import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";
import { normDoi } from "@/lib/canonical/duplicates";
import type { RawDataLink } from "@/lib/canonical/dataLinks";

/**
 * Europe PMC REST API — per-work OPEN DATA / CODE links.
 *
 * Two keyless calls, both polite (User-Agent) and FAIL-SOFT (a hiccup never
 * breaks a sync):
 *
 *  1. `search?query=DOI:"<doi>"&resultType=core&format=json&pageSize=1` — resolve
 *     a DOI to its Europe PMC record: PMID / PMCID and the `hasData` flag (whether
 *     Europe PMC knows of associated data), plus `hasSuppl` / `isOpenAccess`.
 *  2. `MED/<pmid>/datalinks?format=json` — the work's data links (SciLite
 *     text-mined accessions + publisher-asserted data citations, grouped by
 *     category), each with a target identifier, scheme and landing URL.
 *
 * TODO(verify-live): written offline against the documented response shapes —
 * verify against the live API. Assumed shapes:
 *   search → `{ hitCount, resultList: { result: [ { pmid, pmcid, doi, hasData: "Y"|"N",
 *              hasSuppl: "Y"|"N", isOpenAccess: "Y"|"N", dataLinksCount? } ] } }`
 *   datalinks → `{ hitCount, dataLinkList: { Category: [ { Name, CategoryLinkCount,
 *                Section: [ { ObtainedBy, Publisher?, Linklist: { Link: [ { ObtainedBy,
 *                Target: { Type?, Identifier: { ID, IDScheme, IDURL }, Title? } } ] } } ] } ] } }`
 * Every field is read defensively (a single object where an array is expected is
 * tolerated; unknown fields are ignored; nothing throws).
 */

const EUROPEPMC_API = "https://www.ebi.ac.uk/europepmc/webservices/rest";
const USER_AGENT = "SigmaCV (+https://github.com/BasileChretien/sigmacv)";
/**
 * Per-call limits. Both calls run INSIDE a sync, once per work, so a hanging
 * endpoint must fail fast and must NOT be retried: with `resilientFetch`'s
 * default backoff (2 retries) a dead `datalinks` endpoint cost ~40 s per work
 * and stalled a re-sync for minutes (production incident, 2026-09-07). The
 * data-links pass in `canonical/enrich.ts` circuit-breaks the endpoint after a
 * few consecutive failures and keeps every pass under a time budget, so a
 * single attempt per work is the right amount of persistence here.
 */
const SEARCH_TIMEOUT_MS = 8_000;
const DATALINKS_TIMEOUT_MS = 6_000;
const RETRIES = 0;
/** A DOI is "10.<registrant>/<suffix>". Reject anything else before building a URL. */
const DOI_RE = /^10\.\d{4,9}\/\S+$/;
/** Response caps: a one-hit core search record is ~10 kB; a data-link list is small. */
const MAX_SEARCH_BYTES = 500_000;
const MAX_LINKS_BYTES = 2_000_000;
/** Links kept per work (mirrors the schema cap on `meta.dataLinks`). */
const MAX_LINKS = 20;

/** The Europe PMC record for a DOI (identifiers + open-science flags). */
export interface EuropePmcRecord {
  pmid?: string;
  pmcid?: string;
  /** Whether Europe PMC lists associated data for the work (`hasData`). */
  hasData?: boolean;
  hasSuppl?: boolean;
  isOpenAccess?: boolean;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function asRecord(v: unknown): Record<string, any> | undefined {
  return typeof v === "object" && v !== null && !Array.isArray(v)
    ? (v as Record<string, any>)
    : undefined;
}

/** An array field that Europe PMC may serialise as a bare object when it has one entry. */
function asList(v: unknown): unknown[] {
  if (Array.isArray(v)) return v;
  return v === undefined || v === null ? [] : [v];
}

function str(v: unknown): string | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

/** Europe PMC's "Y"/"N" flags (also tolerates booleans). Undefined when absent/unknown. */
function ynFlag(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  const s = typeof v === "string" ? v.trim().toUpperCase() : "";
  if (s === "Y" || s === "TRUE") return true;
  if (s === "N" || s === "FALSE") return false;
  return undefined;
}

/** Bounded response body, or null on a non-OK status / over-cap body. */
async function boundedBody(res: Response, cap: number): Promise<string | null> {
  if (!res.ok) return null;
  const len = Number(res.headers.get("content-length"));
  if (Number.isFinite(len) && len > cap) return null;
  const body = await res.text();
  return body.length > cap ? null : body;
}

/**
 * Resolve a DOI to its Europe PMC record (PMID/PMCID + `hasData` and the other
 * open-science flags). Null when the work isn't indexed, the DOI is malformed, or
 * on any failure (fail-soft). Cached 24h: the identifiers never change and the
 * flags move slowly.
 */
export async function fetchEuropePmcByDoi(doi: string): Promise<EuropePmcRecord | null> {
  const bare = normDoi(doi);
  if (!bare || !DOI_RE.test(bare)) return null;

  const url = new URL(`${EUROPEPMC_API}/search`);
  url.searchParams.set("query", `DOI:"${bare}"`);
  url.searchParams.set("resultType", "core");
  url.searchParams.set("format", "json");
  url.searchParams.set("pageSize", "1");

  try {
    const res = await resilientFetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      next: { revalidate: 86_400 },
      timeoutMs: SEARCH_TIMEOUT_MS,
      retries: RETRIES,
    });
    const body = await boundedBody(res, MAX_SEARCH_BYTES);
    if (body === null) return null;
    const data = asRecord(JSON.parse(body));
    const results = asList(asRecord(data?.resultList)?.result);
    const hit = asRecord(results[0]);
    if (!hit) return null;
    // Defensive: the search is a DOI query, but confirm the hit is the same DOI
    // when the record carries one (a fuzzy match must never attach a stranger's PMID).
    const hitDoi = normDoi(str(hit.doi));
    if (hitDoi && hitDoi !== bare) return null;
    const out: EuropePmcRecord = {};
    const pmid = str(hit.pmid);
    if (pmid && /^\d+$/.test(pmid)) out.pmid = pmid;
    const pmcid = str(hit.pmcid);
    if (pmcid && /^PMC\d+$/i.test(pmcid)) out.pmcid = pmcid.toUpperCase();
    const hasData = ynFlag(hit.hasData);
    if (hasData !== undefined) out.hasData = hasData;
    const hasSuppl = ynFlag(hit.hasSuppl);
    if (hasSuppl !== undefined) out.hasSuppl = hasSuppl;
    const isOpenAccess = ynFlag(hit.isOpenAccess);
    if (isOpenAccess !== undefined) out.isOpenAccess = isOpenAccess;
    return out;
  } catch (err) {
    logger.warn("europepmc.search_failed", { err });
    return null;
  }
}

/**
 * Link categories that are NOT data/code — Europe PMC's data-links list also
 * carries altmetrics, reviews/evaluations and reference-manager style records.
 * TODO(verify-live): confirm the live category names; anything unmatched is kept.
 */
const NON_DATA_CATEGORY_RE = /altmetric|review|evaluation|wikipedia|f1000|blog|citation of/i;

/** One Europe PMC `Link` entry → a raw data link, or null when unusable. */
function parseLink(raw: unknown, category: string | undefined): RawDataLink | null {
  const link = asRecord(raw);
  const target = asRecord(link?.Target);
  const ident = asRecord(target?.Identifier);
  const id = str(ident?.ID);
  const scheme = str(ident?.IDScheme);
  if (!id || !scheme) return null;
  const url = str(ident?.IDURL);
  const title = str(target?.Title);
  return {
    id,
    scheme,
    ...(url ? { url } : {}),
    ...(title ? { title } : {}),
    ...(category ? { category } : {}),
  };
}

/** A status the endpoint itself is failing on (not a per-record answer like 404). */
const isEndpointFailure = (status: number): boolean => status === 429 || status >= 500;

/**
 * The data links Europe PMC holds for a PubMed id — normalised raw links (the
 * kind is inferred downstream by `canonical/dataLinks.ts`), capped at
 * {@link MAX_LINKS}. Non-data categories (altmetrics, reviews) are dropped.
 * Cached 24h. Fail-soft, but the two kinds of "nothing" are told apart:
 *  - `[]`   — the endpoint ANSWERED and the work has no usable links (also a
 *             404 / unparsable body: the record was reached, it just has nothing);
 *  - `null` — the endpoint FAILED (timeout / network error / 5xx / 429): nothing
 *             is known about the work, and the caller's circuit breaker counts it.
 * A failure is deliberately NOT logged here: once per work would flood the logs
 * during an outage (it did); the data-links pass logs ONCE when it opens the breaker.
 */
export async function fetchEuropePmcDataLinks(pmid: string): Promise<RawDataLink[] | null> {
  const id = pmid.trim();
  if (!/^\d+$/.test(id)) return [];

  const url = new URL(`${EUROPEPMC_API}/MED/${id}/datalinks`);
  url.searchParams.set("format", "json");

  // The transport is the only thing that can FAIL; a body we cannot read or
  // parse is still an answer (the record was reached) and yields [] below.
  let body: string | null;
  try {
    const res = await resilientFetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      next: { revalidate: 86_400 },
      timeoutMs: DATALINKS_TIMEOUT_MS,
      retries: RETRIES,
    });
    if (isEndpointFailure(res.status)) return null;
    body = await boundedBody(res, MAX_LINKS_BYTES);
  } catch {
    return null;
  }
  if (body === null) return [];
  try {
    const data = asRecord(JSON.parse(body));
    const out: RawDataLink[] = [];
    for (const cat of asList(asRecord(data?.dataLinkList)?.Category)) {
      const category = asRecord(cat);
      const name = str(category?.Name);
      if (name && NON_DATA_CATEGORY_RE.test(name)) continue;
      for (const sec of asList(category?.Section)) {
        for (const raw of asList(asRecord(asRecord(sec)?.Linklist)?.Link)) {
          if (out.length >= MAX_LINKS) return out;
          const link = parseLink(raw, name);
          if (link) out.push(link);
        }
      }
    }
    return out;
  } catch {
    return [];
  }
}
