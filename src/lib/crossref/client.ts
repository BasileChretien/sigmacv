import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";
import { normalizeOrcid } from "@/lib/openalex/types";
import { normDoi, type DoiRelation } from "@/lib/canonical/duplicates";
import type { CslItem } from "@/types/csl";

/**
 * Crossref REST API — bibliographic metadata GAP-FILL by DOI.
 *
 * OpenAlex is the primary works source, but it occasionally lacks the journal
 * name, volume/issue or page range (common for chapters, conference papers and
 * older records). Crossref can return CSL-JSON directly via content negotiation,
 * so we fetch it for works that have a DOI but are missing those fields and fill
 * ONLY the gaps — never overwriting data OpenAlex already provided.
 *
 * Free, no auth. We join the polite pool with a `mailto`. Every call fails soft
 * (returns null) so a Crossref hiccup never breaks a sync.
 */

const CROSSREF_API = "https://api.crossref.org/works";
const CSL_ACCEPT = "application/vnd.citationstyles.csl+json";
// A single CSL record is small; cap the body to reject a pathological response.
const MAX_BYTES = 200_000;

/** A DOI is "10.<registrant>/<suffix>". Reject anything else before building a URL. */
const DOI_RE = /^10\.\d{4,9}\/\S+$/;

/** The subset of CSL fields we trust Crossref to supply as gap-fill. */
export type CrossrefGapFields = Pick<
  CslItem,
  "container-title" | "volume" | "issue" | "page" | "ISSN" | "publisher"
>;

function firstString(value: unknown): string | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (Array.isArray(value)) {
    const first = value.find((v) => typeof v === "string" && v.trim());
    return typeof first === "string" ? first.trim() : undefined;
  }
  return undefined;
}

function issnList(value: unknown): string | string[] | undefined {
  if (typeof value === "string") return value.trim() || undefined;
  if (Array.isArray(value)) {
    const list = value.filter((v): v is string => typeof v === "string" && !!v.trim());
    return list.length ? list : undefined;
  }
  return undefined;
}

/**
 * Fetch Crossref CSL-JSON for a DOI and return only the bibliographic gap-fill
 * fields (or null on any failure / non-CSL response).
 */
export async function fetchCrossrefGapFields(
  doi: string,
  mailto: string,
): Promise<CrossrefGapFields | null> {
  const bare = doi
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  if (!DOI_RE.test(bare)) return null;

  const url = new URL(`${CROSSREF_API}/${encodeURIComponent(bare)}`);
  url.searchParams.set("mailto", mailto);

  try {
    const res = await resilientFetch(url, {
      headers: { Accept: CSL_ACCEPT },
      next: { revalidate: 86_400 }, // bibliographic metadata is effectively static
      timeoutMs: 12_000,
    });
    if (!res.ok) return null;

    const len = Number(res.headers.get("content-length"));
    if (Number.isFinite(len) && len > MAX_BYTES) return null;
    const body = await res.text();
    if (body.length > MAX_BYTES) return null;

    const data = JSON.parse(body) as Record<string, unknown>;
    const out: CrossrefGapFields = {};
    const container = firstString(data["container-title"]);
    if (container) out["container-title"] = container;
    const volume = firstString(data.volume);
    if (volume) out.volume = volume;
    const issue = firstString(data.issue);
    if (issue) out.issue = issue;
    const page = firstString(data.page);
    if (page) out.page = page;
    const issn = issnList(data.ISSN);
    if (issn) out.ISSN = issn;
    const publisher = firstString(data.publisher);
    if (publisher) out.publisher = publisher;

    return Object.keys(out).length > 0 ? out : null;
  } catch (err) {
    logger.warn("crossref.fetch_failed", { err });
    return null;
  }
}

// ── Relation lookup: preprint ↔ published-version links (duplicate detection) ─

/** Crossref `relation` keys that mean "the same work, a different version". */
const RELATION_KINDS: Record<string, DoiRelation["kind"]> = {
  "is-preprint-of": "preprint-pair",
  "has-preprint": "preprint-pair",
  "is-version-of": "version",
  "has-version": "version",
};

function relationDois(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const entry of value) {
    const rec = asRecord(entry);
    if (rec?.["id-type"] === "doi" && typeof rec.id === "string") {
      const norm = normDoi(rec.id);
      if (norm) out.push(norm);
    }
  }
  return out;
}

/**
 * The publisher-asserted preprint/version relationships for a DOI, from
 * Crossref's `message.relation`. This is the gold-standard signal for the
 * preprint↔published-version duplicate (different DOIs, so identifier matching
 * can't catch it). Normalized DOIs out. Fails soft → [] (a miss just leaves the
 * pair to the heuristic tiers). Cached 24h (bibliographic data is static).
 */
export async function fetchCrossrefRelations(doi: string, mailto: string): Promise<DoiRelation[]> {
  const bare = normDoi(doi);
  if (!bare || !DOI_RE.test(bare)) return [];

  const url = new URL(`${CROSSREF_API}/${encodeURIComponent(bare)}`);
  url.searchParams.set("mailto", mailto);
  // Only the relation field is needed — keep the response tiny (a full work
  // record is tens of kB; we may issue dozens of these per sync).
  url.searchParams.set("select", "relation");

  try {
    const res = await resilientFetch(url, {
      next: { revalidate: 86_400 },
      timeoutMs: 12_000,
    });
    if (!res.ok) return [];
    const body = await res.text();
    if (body.length > MAX_BYTES) return [];
    const data = JSON.parse(body) as { message?: { relation?: Record<string, unknown> } };
    const relation = data.message?.relation;
    if (!relation) return [];
    const out: DoiRelation[] = [];
    const seen = new Set<string>();
    for (const [key, kind] of Object.entries(RELATION_KINDS)) {
      for (const target of relationDois(relation[key])) {
        if (seen.has(target)) continue;
        seen.add(target);
        out.push({ target, kind });
      }
    }
    return out;
  } catch (err) {
    logger.warn("crossref.relations_fetch_failed", { err });
    return [];
  }
}

// ── Grant Linking System: grants registered against a researcher's ORCID ─────

/** Cap for the grant LIST response (≤50 small records). */
const MAX_GRANT_LIST_BYTES = 2_000_000;

/** A registered grant from the Crossref Grant Linking System (`type:grant`). */
export interface CrossrefGrant {
  /** The grant's own DOI (e.g. "10.35802/218300"). */
  doi: string;
  /** The funder's award number, when present. */
  award?: string;
  title: string;
  funderName?: string;
  /** Open Funder Registry DOI (e.g. "10.13039/100010269"), when present. */
  funderId?: string;
  startYear?: number;
  endYear?: number;
}

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}

/** Year from a Crossref `{ "date-parts": [[YYYY, MM, DD]] }` value. */
function firstYearFromDateParts(v: unknown): number | undefined {
  const dateParts = asRecord(v)?.["date-parts"];
  const first = Array.isArray(dateParts) ? dateParts[0] : undefined;
  const year = Array.isArray(first) ? first[0] : undefined;
  return typeof year === "number" ? year : undefined;
}

/** Map one Crossref `type:grant` work to a normalized {@link CrossrefGrant}. */
function parseGrantItem(raw: unknown): CrossrefGrant | null {
  const work = asRecord(raw);
  const doi = typeof work?.DOI === "string" ? work.DOI : undefined;
  if (!work || !doi) return null;
  // `project` is an array (always one element in practice); its fields optional.
  const project = Array.isArray(work.project) ? asRecord(work.project[0]) : undefined;
  const titleEntry =
    project && Array.isArray(project["project-title"])
      ? asRecord(project["project-title"][0])
      : undefined;
  const title = typeof titleEntry?.title === "string" ? titleEntry.title : undefined;
  if (!title) return null;
  const funding =
    project && Array.isArray(project.funding) ? asRecord(project.funding[0]) : undefined;
  const funder = asRecord(funding?.funder);
  const funderName = typeof funder?.name === "string" ? funder.name : undefined;
  const funderIds = Array.isArray(funder?.id) ? funder.id : [];
  const funderDoiEntry = funderIds.map(asRecord).find((e) => e?.["id-type"] === "DOI");
  const funderId = typeof funderDoiEntry?.id === "string" ? funderDoiEntry.id : undefined;
  return {
    doi,
    award: typeof work.award === "string" ? work.award : undefined,
    title,
    funderName,
    funderId,
    startYear:
      firstYearFromDateParts(project?.["award-start"]) ?? firstYearFromDateParts(work.issued),
    endYear: firstYearFromDateParts(project?.["award-end"]),
  };
}

/**
 * Grants registered against the person's ORCID in the Crossref Grant Linking
 * System (`type:grant`). ORCID-matched (the funder deposited the iD), so these
 * are reliable enough to auto-include. Fails soft → []. Coverage is sparse (a
 * growing set of funders), so this SUPPLEMENTS the ORCID-funding + OpenAlex
 * grant signals — it never replaces them.
 */
export async function fetchCrossrefGrantsByOrcid(
  orcid: string,
  mailto: string,
): Promise<CrossrefGrant[]> {
  const bare = normalizeOrcid(orcid);
  if (!bare) return [];

  const url = new URL(CROSSREF_API);
  url.searchParams.set("filter", `orcid:${bare},type:grant`);
  url.searchParams.set("rows", "50");
  url.searchParams.set("mailto", mailto);

  try {
    const res = await resilientFetch(url, {
      next: { revalidate: 86_400 },
      timeoutMs: 12_000,
    });
    if (!res.ok) return [];
    const body = await res.text();
    /* v8 ignore next -- defensive cap on a pathological response */
    if (body.length > MAX_GRANT_LIST_BYTES) return [];
    const data = JSON.parse(body) as { message?: { items?: unknown[] } };
    const items = data.message?.items;
    const list = Array.isArray(items) ? items : [];
    const out: CrossrefGrant[] = [];
    for (const item of list) {
      const grant = parseGrantItem(item);
      if (grant) out.push(grant);
    }
    return out;
  } catch (err) {
    logger.warn("crossref.grants_fetch_failed", { err });
    return [];
  }
}
