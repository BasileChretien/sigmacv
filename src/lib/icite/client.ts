import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";

/**
 * NIH iCite API — the Relative Citation Ratio (RCR), a field-normalized,
 * article-level citation measure benchmarked to NIH-funded papers (1.0 = the
 * field average). Free, no auth, keyed by PubMed id.
 *
 * RCR is BIOMEDICAL-ONLY (it needs a PMID and a biomedical co-citation network),
 * so it is surfaced opt-in and clearly caveated — it complements OpenAlex's FWCI
 * rather than replacing it. Fails soft → an empty / partial map never breaks a sync.
 */

const ICITE_API = "https://icite.od.nih.gov/api/pubs";
const USER_AGENT = "SigmaCV (+https://github.com/BasileChretien/sigmacv)";
// iCite accepts up to ~1000 ids per call; keep the query string well-bounded.
const BATCH_SIZE = 200;

/* eslint-disable @typescript-eslint/no-explicit-any */
function num(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

/** Fetch RCR for one batch of (already-validated) PMIDs. Fails soft → empty map. */
async function fetchBatch(pmids: string[]): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  const url = new URL(ICITE_API);
  url.searchParams.set("pmids", pmids.join(","));
  // We only need the RCR field; legacy=false returns the current RCR model.
  // NOTE: in a field-filtered response iCite returns the RCR under the SHORT
  // alias `rcr` (the full, unfiltered record uses `relative_citation_ratio`), so
  // request `rcr` and read it below — with a fallback to the long name for safety.
  url.searchParams.set("fl", "pmid,rcr");
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
      // iCite returns `rcr` in filtered responses; `relative_citation_ratio` in
      // the full record. Accept either so we never silently drop the value again.
      const rcr = num(rec?.rcr) ?? num(rec?.relative_citation_ratio);
      // RCR is null for very recent / sparsely-cited papers — only keep real values.
      if (key && rcr !== undefined) out.set(key, rcr);
    }
  } catch (err) {
    logger.warn("icite.fetch_failed", { err });
  }
  return out;
}

/**
 * Map PMID → RCR for the given PubMed ids. Bare numeric PMIDs only (others are
 * ignored). Batched + de-duplicated; a failing batch is skipped, never thrown, so
 * partial results still flow through. Returns an empty map for no valid input.
 */
export async function fetchRcrByPmids(pmids: readonly string[]): Promise<Map<string, number>> {
  const valid = [...new Set(pmids.map((p) => p.trim()).filter((p) => /^\d+$/.test(p)))];
  const result = new Map<string, number>();
  for (let i = 0; i < valid.length; i += BATCH_SIZE) {
    const batch = await fetchBatch(valid.slice(i, i + BATCH_SIZE));
    for (const [k, v] of batch) result.set(k, v);
  }
  return result;
}
