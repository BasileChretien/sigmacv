import { XMLParser } from "fast-xml-parser";
import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";
import { matchesNameAndOrg, personMatch } from "@/lib/grants/match";
import type { PatentRecord } from "@/lib/patents/types";
import { getEpoAccessToken } from "./auth";

/**
 * EPO Open Patent Services (OPS) — patents by INVENTOR name.
 *
 * Patents carry no ORCID, so we search the published-data index by inventor name
 * (CQL `in="…"`) and keep only results where an inventor matches the person AND
 * an applicant (assignee — usually the institution/company) matches one of their
 * organizations. That name+org rule (never name-only) makes every hit a REVIEW
 * CANDIDATE the user confirms. Auth is mandatory (OAuth) — with no credentials
 * configured the client is dormant and returns []. Fails soft → [].
 */

const SEARCH_ENDPOINT = "https://ops.epo.org/3.2/rest-services/published-data/search/biblio";
const USER_AGENT = "SigmaCV (+https://github.com/BasileChretien/sigmacv)";
// A 25-result biblio page is small; cap the body to reject a pathological response.
const MAX_BYTES = 4_000_000;

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}

function toArray(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  if (v === undefined || v === null) return [];
  return [v];
}

/** Text of a node fast-xml-parser may render as a string or `{ "#text": … }`. */
function nodeText(v: unknown): string | undefined {
  if (typeof v === "string") return v.trim() || undefined;
  if (typeof v === "number") return String(v);
  const t = asRecord(v)?.["#text"];
  if (typeof t === "string") return t.trim() || undefined;
  if (typeof t === "number") return String(t);
  return undefined;
}

/** Find the `<document-id>` of a given type within a `<publication-reference>`. */
function documentId(pubRef: unknown, type: string): Record<string, unknown> | undefined {
  const ids = toArray(asRecord(pubRef)?.["document-id"]);
  return ids.map(asRecord).find((id) => id?.["@_document-id-type"] === type);
}

/** Publication number (prefer the concatenated epodoc form) + year, from refs. */
function publicationNumber(pubRef: unknown): { number?: string; year?: number } {
  const epodoc = documentId(pubRef, "epodoc");
  const docdb = documentId(pubRef, "docdb");
  let number = nodeText(epodoc?.["doc-number"]);
  if (!number) {
    const docNum = nodeText(docdb?.["doc-number"]);
    if (docNum) {
      number = `${nodeText(docdb?.["country"]) ?? ""}${docNum}${nodeText(docdb?.["kind"]) ?? ""}`;
    }
  }
  const date = nodeText(epodoc?.["date"]) ?? nodeText(docdb?.["date"]);
  const year = date && /^\d{4}/.test(date) ? Number(date.slice(0, 4)) : undefined;
  return { number, year };
}

/** Invention title, preferring the English variant. */
function inventionTitle(biblio: Record<string, unknown>): string | undefined {
  const titles = toArray(biblio["invention-title"]);
  const en = titles.map(asRecord).find((t) => t?.["@_lang"] === "en");
  return nodeText(en ?? titles[0]);
}

/**
 * Party names (inventors / applicants). EPO repeats each party once per
 * data-format (epodoc + original), so a Set both dedupes identical strings and
 * keeps the distinct normalized vs as-filed variants (more to match against).
 */
function partyNames(
  parties: Record<string, unknown> | undefined,
  groupKey: string,
  memberKey: string,
  nameWrapperKey: string,
): string[] {
  const members = toArray(asRecord(parties?.[groupKey])?.[memberKey]);
  const out = new Set<string>();
  for (const raw of members) {
    const name = nodeText(asRecord(asRecord(raw)?.[nameWrapperKey])?.["name"]);
    if (name) out.add(name);
  }
  return [...out];
}

/**
 * Dedup key that collapses the same invention filed in several jurisdictions
 * (US/EP/JP/WO…) into one entry via its DOCDB simple patent family; falls back
 * to the publication number when a record has no family id, so unrelated
 * family-less patents are never merged together.
 */
function patentKey(p: PatentRecord): string {
  return p.familyId ? `fam:${p.familyId}` : `num:${p.publicationNumber}`;
}

function parsePatents(xml: string, person: ReturnType<typeof personMatch>): PatentRecord[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const doc = parser.parse(xml) as Record<string, unknown>;
  const root = asRecord(doc["ops:world-patent-data"]);
  const result = asRecord(asRecord(root?.["ops:biblio-search"])?.["ops:search-result"]);
  // `exchange-documents` may be a single wrapper or an array, each holding one or
  // more `exchange-document` — flatten both shapes.
  const groups = toArray(result?.["exchange-documents"]);
  const docs: unknown[] = [];
  for (const g of groups) docs.push(...toArray(asRecord(g)?.["exchange-document"]));

  const out: PatentRecord[] = [];
  const seen = new Set<string>();
  for (const raw of docs) {
    const rec = asRecord(raw);
    const biblio = asRecord(rec?.["bibliographic-data"]);
    if (!biblio) continue;
    const { number, year } = publicationNumber(biblio["publication-reference"]);
    const title = inventionTitle(biblio);
    if (!number || !title) continue;
    const parties = asRecord(biblio["parties"]);
    const inventors = partyNames(parties, "inventors", "inventor", "inventor-name");
    const applicants = partyNames(parties, "applicants", "applicant", "applicant-name");
    // An inventor matches the person AND an applicant matches one of their orgs.
    const matched = inventors.some((inv) =>
      applicants.some((app) => matchesNameAndOrg(person, inv, app)),
    );
    if (!matched) continue;
    // `family-id` sits on the <exchange-document> element itself, not the biblio.
    const familyId = nodeText(rec?.["@_family-id"]);
    const record: PatentRecord = {
      source: "epo",
      publicationNumber: number,
      title,
      applicants,
      inventors,
      year,
      ...(familyId ? { familyId } : {}),
    };
    // Collapse cross-jurisdiction equivalents by family (first member wins).
    const key = patentKey(record);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(record);
  }
  return out;
}

/**
 * Inventor-name query phrases to try, de-duplicated case-insensitively: the name
 * AS GIVEN plus a SURNAME-FIRST variant ("Basile Chrétien" → also
 * "chretien basile"). EPO's inventor index is largely surname-first, so the
 * as-given phrase alone misses many patents (and can even surface different
 * ones), so we query both orderings and merge.
 */
function inventorQueries(name: string, person: ReturnType<typeof personMatch>): string[] {
  const asGiven = name.replace(/"/g, "").trim();
  const surnameFirst = [
    person.surname,
    ...person.nameTokens.filter((t) => t !== person.surname),
  ].join(" ");
  const out: string[] = [];
  const seen = new Set<string>();
  for (const q of [asGiven, surnameFirst]) {
    const key = q.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(q);
    }
  }
  return out;
}

/**
 * Patents where the account holder is a named inventor, matched by name + an
 * applicant organization. Review candidates (no ORCID). Fails soft → [].
 */
export async function fetchEpoPatents(name: string, orgs: string[]): Promise<PatentRecord[]> {
  const person = personMatch(name, orgs);
  if (!person.surname || person.orgs.length === 0) return [];
  const token = await getEpoAccessToken();
  if (!token) return []; // no credentials → dormant (OPS has no anonymous access)

  try {
    const out: PatentRecord[] = [];
    const seen = new Set<string>();
    // Query both the as-given and a surname-first name phrase (EPO indexes
    // inventors largely surname-first), then merge; parsePatents' name+org gate
    // keeps only the real matches. A bad/empty response on one phrase is skipped.
    for (const query of inventorQueries(name, person)) {
      const url = new URL(SEARCH_ENDPOINT);
      url.searchParams.set("q", `in="${query}"`);
      const res = await resilientFetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/exchange+xml",
          "X-OPS-Range": "1-25",
          "User-Agent": USER_AGENT,
        },
        next: { revalidate: 86_400 },
        timeoutMs: 12_000,
      });
      if (!res.ok) continue;
      const body = await res.text();
      /* v8 ignore next -- defensive cap on a pathological response */
      if (body.length > MAX_BYTES) continue;
      for (const patent of parsePatents(body, person)) {
        // Same family key as within a response, so a family member surfaced by
        // the surname-first phrase doesn't re-add one already found as-given.
        const key = patentKey(patent);
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(patent);
      }
    }
    return out;
  } catch (err) {
    logger.warn("epo.search_failed", { err });
    return [];
  }
}
