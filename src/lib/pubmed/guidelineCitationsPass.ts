import { answeredWithin } from "@/lib/archiving/freshness";
import { applyPass, posKey, rotationQueue, type RotationTarget } from "@/lib/canonical/enrich";
import type { CanonicalCv, CvItem, CvSection } from "@/lib/canonical/schema";
import { fetchClinicalCitersByPmids } from "@/lib/icite/client";
import { logger } from "@/lib/log";
import { countableWorks } from "@/lib/render/countable";
import { fetchPubmedSummaries, isGuideline, type PubmedSummary } from "./client";
import type { GuidelineCitation } from "./guidelineText";

/**
 * The OWNER sync's guideline-citations pass: for each countable work with a
 * PubMed id, the clinical practice guidelines that cite it, stored as
 * `meta.guidelineCitations` for the editor's row chip and the starter drafts.
 *
 * Why: a narrative CV (the FRQ's CV descriptif, the Tri-agency CV, R4RI) asks the
 * researcher to show that a contribution reached practice. "Cited in the ASCO
 * guideline on immune-related adverse events" is that, in one checkable line.
 * Overton sells this index; a real part of it is free: NIH iCite already lists
 * the CLINICAL articles citing a work (`cited_by_clin`), and PubMed's own
 * publication types say which of those are guidelines. Partial by construction —
 * a guideline PubMed does not index (many national ones) is not seen — and the
 * editor says so. Two identifier-matched hops (PMID → PMID), no name matching.
 *
 * Called from `syncCvForUser` ONLY, never from `buildCvFromOrcid` (which the
 * anonymous preview shares): a visitor who pastes an iD triggers no PubMed call.
 * Polite by construction: one iCite call for the works of the sync, then PubMed
 * in spaced sequential batches, at most {@link GUIDELINE_CITATIONS_MAX_WORKS}
 * works and {@link GUIDELINE_CITATIONS_MAX_CITERS} citing articles per sync inside
 * {@link GUIDELINE_CITATIONS_BUDGET_MS}, never-checked works first, and a work
 * answered within {@link GUIDELINE_CITATIONS_REFRESH_DAYS} days is not asked
 * again (guidelines are revised over years, not weeks). Fail-soft: a failed call
 * keeps the stored list and stamps the ATTEMPT only, so the work is retried on a
 * later sync behind the works never examined; an answered "no guideline" clears
 * it. A work that stops being a candidate (hidden, "not mine", retracted, PMID
 * gone) loses its list: nothing is stored that the editor would not show. Never
 * rendered on the CV itself — the researcher cites it in prose or not at all —
 * and stripped from every public surface like the other owner-only passes.
 */

export const GUIDELINE_CITATIONS_MAX_WORKS = 25;
export const GUIDELINE_CITATIONS_MAX_CITERS = 600;
export const GUIDELINE_CITATIONS_MAX_PER_WORK = 20;
export const GUIDELINE_CITATIONS_REFRESH_DAYS = 30;
const GUIDELINE_CITATIONS_BUDGET_MS = 10_000;

export interface GuidelineCitationsOptions {
  /** The clinical citers of each work by PMID (`null` = the call failed). */
  citers?: (pmids: readonly string[]) => Promise<Map<string, string[]> | null>;
  /** PubMed summaries by PMID (`null` = a call failed). */
  summaries?: (
    pmids: readonly string[],
    mailto: string,
    timeoutMs: number,
  ) => Promise<Map<string, PubmedSummary> | null>;
  now?: string;
}

/** A countable work with a bare numeric PubMed id. */
function isCandidate(item: CvItem, countable: ReadonlySet<CvItem>): boolean {
  return (
    countable.has(item) && typeof item.meta.pmid === "string" && /^\d+$/.test(item.meta.pmid.trim())
  );
}

/** Drop the list + both sentinels from every item that is no longer a candidate. */
function withoutStaleRecords(sections: CvSection[], candidates: ReadonlySet<string>): CvSection[] {
  return sections.map((section, s) => ({
    ...section,
    items: section.items.map((item, i) =>
      candidates.has(posKey({ s, i })) ||
      (item.meta.guidelineCitations === undefined &&
        item.meta.guidelineCitationsCheckedAt === undefined &&
        item.meta.guidelineCitationsTriedAt === undefined)
        ? item
        : {
            ...item,
            meta: {
              ...item.meta,
              guidelineCitations: undefined,
              guidelineCitationsCheckedAt: undefined,
              guidelineCitationsTriedAt: undefined,
            },
          },
    ),
  }));
}

/**
 * The guidelines among a work's clinical citers, newest first, capped: each
 * citer PubMed types as a guideline, with its title, journal and year.
 */
export function guidelinesFor(
  citers: readonly string[],
  summaries: ReadonlyMap<string, PubmedSummary>,
): GuidelineCitation[] {
  const out: GuidelineCitation[] = [];
  for (const pmid of citers) {
    const s = summaries.get(pmid);
    if (!s || !isGuideline(s)) continue;
    out.push({
      pmid,
      title: s.title.slice(0, 500),
      ...(s.source ? { source: s.source.slice(0, 200) } : {}),
      ...(s.year !== undefined ? { year: s.year } : {}),
    });
  }
  return out
    .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))
    .slice(0, GUIDELINE_CITATIONS_MAX_PER_WORK);
}

export async function enrichCvWithGuidelineCitations(
  cv: CanonicalCv,
  mailto: string,
  opts: GuidelineCitationsOptions = {},
): Promise<CanonicalCv> {
  const now = opts.now ?? new Date().toISOString();
  const citersOf = opts.citers ?? fetchClinicalCitersByPmids;
  const summariesOf =
    opts.summaries ??
    ((pmids: readonly string[], to: string, timeoutMs: number) =>
      fetchPubmedSummaries(pmids, to, { timeoutMs }));

  const countable = new Set(countableWorks(cv));
  const candidates: Array<RotationTarget & { pmid: string; answeredAt?: string }> = [];
  cv.sections.forEach((section, s) => {
    section.items.forEach((item, i) => {
      if (!isCandidate(item, countable)) return;
      candidates.push({
        s,
        i,
        pmid: item.meta.pmid!.trim(),
        // The rotation reads the last ATTEMPT (never older than the last answer):
        // a failed work queues behind those still waiting for their first lookup.
        checkedAt: item.meta.guidelineCitationsTriedAt ?? item.meta.guidelineCitationsCheckedAt,
        answeredAt: item.meta.guidelineCitationsCheckedAt,
      });
    });
  });
  const candidateKeys = new Set(candidates.map(posKey));
  const due = candidates.filter(
    (t) => !answeredWithin(t.answeredAt, now, GUIDELINE_CITATIONS_REFRESH_DAYS),
  );
  const targets = rotationQueue(due, GUIDELINE_CITATIONS_MAX_WORKS);
  if (targets.length === 0) {
    return { ...cv, sections: withoutStaleRecords(cv.sections, candidateKeys) };
  }

  const deadline = Date.now() + GUIDELINE_CITATIONS_BUDGET_MS;
  const triedOnly = (examined: readonly RotationTarget[]) => ({
    ...cv,
    sections: withoutStaleRecords(
      applyPass(cv, examined, new Map(), { guidelineCitationsTriedAt: now }),
      candidateKeys,
    ),
  });

  // Hop 1: the clinical articles citing each work, one iCite call for the sync.
  const citers = await citersOf(targets.map((t) => t.pmid));
  if (citers === null) {
    logger.info("guidelines.citers_unavailable", { works: targets.length });
    return triedOnly(targets);
  }

  // Take the works in queue order while their citers fit the per-sync cap; a
  // work that would overflow it is left unstamped for a later sync. A single
  // work with more citers than the cap is asked about its first cap's worth.
  const examined: typeof targets = [];
  const wanted = new Set<string>();
  for (const t of targets) {
    const list = (citers.get(t.pmid) ?? []).slice(0, GUIDELINE_CITATIONS_MAX_CITERS);
    const fresh = list.filter((p) => !wanted.has(p)).length;
    if (examined.length > 0 && wanted.size + fresh > GUIDELINE_CITATIONS_MAX_CITERS) break;
    for (const p of list) wanted.add(p);
    examined.push(t);
  }

  // Hop 2: which of those citers PubMed types as guidelines.
  let summaries: ReadonlyMap<string, PubmedSummary> = new Map();
  if (wanted.size > 0) {
    const got = await summariesOf([...wanted], mailto, Math.max(1, deadline - Date.now()));
    if (got === null) {
      logger.info("guidelines.summaries_unavailable", {
        works: examined.length,
        citers: wanted.size,
      });
      return triedOnly(examined);
    }
    summaries = got;
  }

  const hits = new Map<string, Partial<CvItem["meta"]>>();
  for (const t of examined) {
    const list = guidelinesFor(
      (citers.get(t.pmid) ?? []).slice(0, GUIDELINE_CITATIONS_MAX_CITERS),
      summaries,
    );
    hits.set(posKey(t), {
      guidelineCitations: list.length > 0 ? list : undefined,
      guidelineCitationsCheckedAt: now,
    });
  }
  // Every examined work is stamped as TRIED; an answer also stamps the checked
  // date and writes — or clears — the list.
  const sections = applyPass(cv, examined, hits, { guidelineCitationsTriedAt: now });
  return { ...cv, sections: withoutStaleRecords(sections, candidateKeys) };
}
