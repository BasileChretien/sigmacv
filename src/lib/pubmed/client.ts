import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";

/**
 * PubMed E-utilities `esummary` — the record summary of PubMed articles by PMID.
 * Free, keyless; NCBI asks callers to name themselves (`tool` + `email`) and to
 * stay under three requests a second without a key, which the sequential,
 * spaced batches below do.
 *
 * Read for the guideline-citations pass only: the PUBLICATION TYPES PubMed
 * indexers assign each record ("Practice Guideline", "Guideline", …), plus the
 * title, journal abbreviation and year needed to print a guideline that cites one
 * of the owner's works. Verified live 2026-09-17 against
 * `esummary.fcgi?db=pubmed&retmode=json&id=34724392`: the record carries
 * `title`, `source` ("J Clin Oncol"), `pubdate` ("2021 Dec 20"), `pubtype`
 * (["Journal Article", "Practice Guideline", …]). Parsing ignores what it does
 * not understand; a failed call returns `null` (never throws) so the caller can
 * tell "no answer" from "no record".
 */

const ESUMMARY_API = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi";
const USER_AGENT = "SigmaCV (+https://github.com/BasileChretien/sigmacv)";
/** NCBI accepts a few hundred ids per esummary call; keep the URL well-bounded. */
export const PUBMED_BATCH_SIZE = 200;
/** Without an API key NCBI allows three requests a second: space the batches. */
const PUBMED_MIN_INTERVAL_MS = 350;

/**
 * The PubMed publication types that make a record a clinical practice guideline
 * or a consensus statement — the documents a funder means by "taken up in
 * practice". A plain "Review" or "Clinical Trial" is not one.
 */
export const GUIDELINE_PUBLICATION_TYPES: readonly string[] = [
  "Practice Guideline",
  "Guideline",
  "Consensus Development Conference",
  "Consensus Development Conference, NIH",
];

export interface PubmedSummary {
  pmid: string;
  title: string;
  /** Journal abbreviation as PubMed prints it ("J Clin Oncol"). */
  source?: string;
  year?: number;
  publicationTypes: string[];
}

/** Whether a summary is typed as a practice guideline / consensus statement. */
export function isGuideline(summary: Pick<PubmedSummary, "publicationTypes">): boolean {
  return summary.publicationTypes.some((t) => GUIDELINE_PUBLICATION_TYPES.includes(t));
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function parseSummary(uid: string, rec: any): PubmedSummary | undefined {
  const title = typeof rec?.title === "string" ? rec.title.trim() : "";
  if (!title) return undefined;
  const source =
    typeof rec?.source === "string" && rec.source.trim() ? rec.source.trim() : undefined;
  const yearMatch = typeof rec?.pubdate === "string" ? /\b(\d{4})\b/.exec(rec.pubdate) : null;
  const year = yearMatch ? Number(yearMatch[1]) : undefined;
  const publicationTypes = Array.isArray(rec?.pubtype)
    ? rec.pubtype.filter((t: unknown): t is string => typeof t === "string")
    : [];
  return {
    pmid: uid,
    title,
    ...(source ? { source } : {}),
    ...(year !== undefined ? { year } : {}),
    publicationTypes,
  };
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export interface PubmedSummaryOptions {
  /** Per-request timeout (the remaining time to `deadline` caps it further). */
  timeoutMs?: number;
  /** Pause between batches (tests pass 0). */
  minIntervalMs?: number;
  /** `Date.now()` value past which no batch is started and the whole lookup
   *  answers `null` — the caller's pass budget, made real across the batches. */
  deadline?: number;
}

/**
 * Map PMID → {@link PubmedSummary} for the given PubMed ids, bare numeric only,
 * de-duplicated, in sequential spaced batches, one attempt each (no retry).
 * `null` when any batch fails or the deadline passes before the last one: the
 * caller then knows nothing about the whole set and must not treat the silence
 * as "no guideline". Empty input → empty map, no call.
 */
export async function fetchPubmedSummaries(
  pmids: readonly string[],
  mailto: string,
  opts: PubmedSummaryOptions = {},
): Promise<Map<string, PubmedSummary> | null> {
  const valid = [...new Set(pmids.map((p) => p.trim()).filter((p) => /^\d+$/.test(p)))];
  const out = new Map<string, PubmedSummary>();
  const interval = opts.minIntervalMs ?? PUBMED_MIN_INTERVAL_MS;
  for (let i = 0; i < valid.length; i += PUBMED_BATCH_SIZE) {
    if (i > 0 && interval > 0) await sleep(interval);
    const remaining = opts.deadline === undefined ? Infinity : opts.deadline - Date.now();
    if (remaining <= 0) {
      logger.info("pubmed.esummary_budget_exhausted", { done: i, total: valid.length });
      return null;
    }
    const url = new URL(ESUMMARY_API);
    url.searchParams.set("db", "pubmed");
    url.searchParams.set("retmode", "json");
    url.searchParams.set("tool", "SigmaCV");
    if (mailto) url.searchParams.set("email", mailto);
    url.searchParams.set("id", valid.slice(i, i + PUBMED_BATCH_SIZE).join(","));
    try {
      const res = await resilientFetch(url, {
        headers: { Accept: "application/json", "User-Agent": USER_AGENT },
        timeoutMs: Math.max(1, Math.min(opts.timeoutMs ?? 10_000, remaining)),
        retries: 0,
      });
      if (!res.ok) throw new Error(`PubMed esummary failed (${res.status})`);
      const data = (await res.json()) as any;
      const result = data?.result;
      const uids: unknown[] = Array.isArray(result?.uids) ? result.uids : [];
      for (const raw of uids) {
        const uid = typeof raw === "number" ? String(raw) : typeof raw === "string" ? raw : "";
        const parsed = uid ? parseSummary(uid, result?.[uid]) : undefined;
        if (parsed) out.set(uid, parsed);
      }
    } catch (err) {
      logger.warn("pubmed.esummary_failed", { err });
      return null;
    }
  }
  return out;
}
