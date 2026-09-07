import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";

/**
 * NIH iCite API — per-article citation + translational indicators, keyed by
 * PubMed id. Free, no auth.
 *
 * Fields read (ALL BIOMEDICAL-ONLY — they need a PMID and NIH's biomedical
 * co-citation / clinical-citation network — so they are surfaced opt-in and
 * clearly caveated; they complement OpenAlex's FWCI rather than replacing it):
 * - `rcr` — Relative Citation Ratio, field-normalized, 1.0 = the average
 *   NIH-funded article.
 * - `cited_by_clin` — PMIDs of clinical articles (guidelines, trials) citing the
 *   work; only its COUNT is kept.
 * - `is_clinical` — whether the work itself is a clinical article.
 * - `apt` — Approximate Potential to Translate (0..1), iCite's machine-learned
 *   likelihood of future clinical citation.
 *
 * TODO(verify-live): assumed response shape (field-filtered via `fl=`):
 * `{ data: [ { pmid: number|string, rcr: number|null, cited_by_clin: string[] |
 * number[] | string | null, is_clinical: boolean | "Yes"/"No" | null, apt:
 * number|null } ] }`. The long alias `relative_citation_ratio` appears only in
 * unfiltered records and is accepted as a fallback. Parsing accepts every one of
 * those shapes and ignores what it does not understand — it never throws.
 * Fails soft → an empty / partial map never breaks a sync.
 */

const ICITE_API = "https://icite.od.nih.gov/api/pubs";
const USER_AGENT = "SigmaCV (+https://github.com/BasileChretien/sigmacv)";
// iCite accepts up to ~1000 ids per call; keep the query string well-bounded.
const BATCH_SIZE = 200;
// NOTE: in a field-filtered response iCite returns the RCR under the SHORT alias
// `rcr` (the full, unfiltered record uses `relative_citation_ratio`); request the
// short names and read them below, with a fallback to the long name for safety.
const ICITE_FIELDS = "pmid,rcr,cited_by_clin,is_clinical,apt";

/**
 * Per-article iCite record. Every field is optional: iCite returns null for very
 * recent / sparsely-cited papers, and a record is kept only when at least one
 * field parsed.
 */
export interface IciteRecord {
  /** Relative Citation Ratio (field-normalized; 1.0 = NIH-funded average). */
  rcr?: number;
  /** Number of clinical articles citing the work (`cited_by_clin` length). */
  clinicalCitations?: number;
  /** The work is itself a clinical article (guideline / clinical study). */
  isClinical?: boolean;
  /** Approximate Potential to Translate, 0..1. */
  apt?: number;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/** A 0..1 proportion; anything outside the unit interval is treated as absent. */
function unit(v: unknown): number | undefined {
  const n = num(v);
  return n !== undefined && n >= 0 && n <= 1 ? n : undefined;
}

/**
 * Count of the citing-PMID list: an array → its length; a bare non-negative
 * integer → itself; a delimited string ("123 456" / "123,456") → its numeric
 * token count. Null / anything else → absent.
 */
function count(v: unknown): number | undefined {
  if (Array.isArray(v)) return v.length;
  if (typeof v === "number") return Number.isInteger(v) && v >= 0 ? v : undefined;
  if (typeof v === "string") {
    return v.split(/[\s,;|]+/).filter((t) => /^\d+$/.test(t)).length;
  }
  return undefined;
}

/** A boolean, also accepting iCite's textual/numeric spellings ("Yes"/"No", 1/0). */
function bool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1 ? true : v === 0 ? false : undefined;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (s === "yes" || s === "true" || s === "1") return true;
    if (s === "no" || s === "false" || s === "0") return false;
  }
  return undefined;
}

/** Parse one iCite record defensively; undefined when nothing usable parsed. */
function parseRecord(rec: any): IciteRecord | undefined {
  const rcr = num(rec?.rcr) ?? num(rec?.relative_citation_ratio);
  const clinicalCitations = count(rec?.cited_by_clin);
  const isClinical = bool(rec?.is_clinical);
  const apt = unit(rec?.apt);
  const out: IciteRecord = {
    ...(rcr !== undefined ? { rcr } : {}),
    ...(clinicalCitations !== undefined ? { clinicalCitations } : {}),
    ...(isClinical !== undefined ? { isClinical } : {}),
    ...(apt !== undefined ? { apt } : {}),
  };
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Fetch one batch of (already-validated) PMIDs. Fails soft → empty map. */
async function fetchBatch(pmids: string[]): Promise<Map<string, IciteRecord>> {
  const out = new Map<string, IciteRecord>();
  const url = new URL(ICITE_API);
  url.searchParams.set("pmids", pmids.join(","));
  url.searchParams.set("fl", ICITE_FIELDS);
  // legacy=false returns the current RCR model.
  url.searchParams.set("legacy", "false");
  try {
    const res = await resilientFetch(url, {
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
      next: { revalidate: 86_400 },
      timeoutMs: 12_000,
    });
    if (!res.ok) throw new Error(`iCite request failed (${res.status})`);
    const data = (await res.json()) as any;
    for (const rec of Array.isArray(data?.data) ? data.data : []) {
      const pmid = rec?.pmid;
      const key = typeof pmid === "number" ? String(pmid) : typeof pmid === "string" ? pmid : "";
      const parsed = key ? parseRecord(rec) : undefined;
      // Every field is null for very recent papers — only keep records with a value.
      if (parsed) out.set(key, parsed);
    }
  } catch (err) {
    logger.warn("icite.fetch_failed", { err });
  }
  return out;
}

/**
 * Map PMID → {@link IciteRecord} for the given PubMed ids. Bare numeric PMIDs only
 * (others are ignored). Batched + de-duplicated; a failing batch is skipped, never
 * thrown, so partial results still flow through. Returns an empty map for no
 * valid input.
 */
export async function fetchIciteByPmids(
  pmids: readonly string[],
): Promise<Map<string, IciteRecord>> {
  const valid = [...new Set(pmids.map((p) => p.trim()).filter((p) => /^\d+$/.test(p)))];
  const result = new Map<string, IciteRecord>();
  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const batch = await fetchBatch(valid.slice(i, i + BATCH_SIZE));
    for (const [k, v] of batch) result.set(k, v);
  }
  return result;
}
