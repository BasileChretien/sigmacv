import { isHidden, type CanonicalCv } from "@/lib/canonical/schema";

/**
 * CV "health": the user's outstanding curation debt, computed from the canonical
 * document. Factual counts only — no score, no gamification — surfaced as a
 * compact checklist in the editor so review candidates, duplicate hints,
 * identifier conflicts and retraction flags don't silently age in collapsed
 * sections. Pure + cheap (one pass), recomputed on every editor render.
 */
export interface CvHealth {
  /** Name+org / ORCID-DOI review candidates still awaiting a decision (built
   *  hidden, neither confirmed via Show nor dismissed via "not mine"). */
  pendingReviewCandidates: number;
  /** Visible items carrying an unresolved duplicate hint. */
  pendingDuplicates: number;
  /** Visible own works whose authorship lists a DIFFERENT ORCID iD. */
  orcidConflicts: number;
  /** Visible works flagged retracted while `display.hideRetracted` is off. */
  retractedVisible: number;
  /** Sum of the above — 0 means nothing awaits the user. */
  total: number;
}

export function computeCvHealth(cv: CanonicalCv): CvHealth {
  let pendingReviewCandidates = 0;
  let pendingDuplicates = 0;
  let orcidConflicts = 0;
  let retractedVisible = 0;

  for (const s of cv.sections) {
    for (const it of s.items) {
      const flag = it.meta.reviewFlag;
      if ((flag === "name-matched" || flag === "orcid-doi") && !it.included && !it.notMine) {
        pendingReviewCandidates++;
      }
      if (flag === "duplicate" && !isHidden(it)) pendingDuplicates++;
      if (flag === "orcid-conflict" && !isHidden(it)) orcidConflicts++;
      if (it.meta.retracted === true && !isHidden(it) && !cv.display.hideRetracted) {
        retractedVisible++;
      }
    }
  }

  return {
    pendingReviewCandidates,
    pendingDuplicates,
    orcidConflicts,
    retractedVisible,
    total: pendingReviewCandidates + pendingDuplicates + orcidConflicts + retractedVisible,
  };
}
