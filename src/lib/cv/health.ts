import {
  isHidden,
  isProseSectionType,
  type CanonicalCv,
  type CvSection,
} from "@/lib/canonical/schema";
import { orderedSections } from "@/lib/canonical/curate";
import { evidenceRefCounts, type EvidenceRefCounts } from "@/lib/canonical/evidenceRefs";
import { isNarrativeModuleType } from "@/lib/canonical/narrativeEvidence";

/** The categories the "needs your attention" checklist surfaces. Declared here,
 *  beside the counts and the jump targets, so all three stay one definition. */
export const CV_HEALTH_CATEGORIES = [
  "review",
  "duplicates",
  "conflicts",
  "misattributed",
  "retracted",
  // Narrative prose whose evidence references no longer resolve / carry none.
  "evidence",
  "narrative",
] as const;
export type CvHealthCategory = (typeof CV_HEALTH_CATEGORIES)[number];

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
  /** Visible works flagged likely-misattributed (a probable same-name over-merge),
   *  not yet dismissed via "keep hidden". */
  likelyMisattributed: number;
  /** Visible works flagged retracted while `display.hideRetracted` is off. */
  retractedVisible: number;
  /** Evidence references (`[[id]]`) in visible prose sections that no longer
   *  point to an entry on the CV (hidden, "not mine", removed) — the claim has
   *  lost its evidence. */
  unresolvedEvidenceRefs: number;
  /** Visible narrative modules with a body but not one linked evidence entry —
   *  prose a funder reviewer cannot verify. */
  narrativesWithoutEvidence: number;
  /** Sum of the above — 0 means nothing awaits the user. */
  total: number;
}

/** A VISIBLE prose section with a non-blank body, with its evidence-link counts;
 *  null otherwise. The one predicate the count and the target walk share. */
function proseEvidenceOf(cv: CanonicalCv, section: CvSection): EvidenceRefCounts | null {
  if (!section.visible || !isProseSectionType(section.type)) return null;
  const body = (section.body ?? "").trim();
  return body ? evidenceRefCounts(cv, body) : null;
}

export function computeCvHealth(cv: CanonicalCv): CvHealth {
  let pendingReviewCandidates = 0;
  let pendingDuplicates = 0;
  let orcidConflicts = 0;
  let likelyMisattributed = 0;
  let retractedVisible = 0;
  let unresolvedEvidenceRefs = 0;
  let narrativesWithoutEvidence = 0;

  // Review candidates the user triaged with "Keep hidden" are resolved — they
  // stay hidden and no longer count toward the outstanding-decisions total.
  const dismissed = new Set(cv.display.dismissedReviewCandidates ?? []);
  for (const s of cv.sections) {
    for (const it of s.items) {
      const flag = it.meta.reviewFlag;
      if (
        (flag === "name-matched" || flag === "orcid-doi") &&
        !it.included &&
        !it.notMine &&
        !dismissed.has(it.id)
      ) {
        pendingReviewCandidates++;
      }
      if (flag === "duplicate" && !isHidden(it)) pendingDuplicates++;
      if (flag === "orcid-conflict" && !isHidden(it)) orcidConflicts++;
      if (flag === "likely-misattributed" && !isHidden(it) && !dismissed.has(it.id)) {
        likelyMisattributed++;
      }
      if (it.meta.retracted === true && !isHidden(it) && !cv.display.hideRetracted) {
        retractedVisible++;
      }
    }
    const prose = proseEvidenceOf(cv, s);
    if (prose) {
      unresolvedEvidenceRefs += prose.unresolved;
      if (isNarrativeModuleType(s.type) && prose.linked === 0) narrativesWithoutEvidence++;
    }
  }

  return {
    pendingReviewCandidates,
    pendingDuplicates,
    orcidConflicts,
    likelyMisattributed,
    retractedVisible,
    unresolvedEvidenceRefs,
    narrativesWithoutEvidence,
    total:
      pendingReviewCandidates +
      pendingDuplicates +
      orcidConflicts +
      likelyMisattributed +
      retractedVisible +
      unresolvedEvidenceRefs +
      narrativesWithoutEvidence,
  };
}

/** A jump target inside the editor: which section to expand, which row to focus.
 *  For a PROSE section (the evidence / narrative categories) there is no row:
 *  `itemId` is the section id, and the editor focuses the section's text box. */
export interface HealthTarget {
  sectionId: string;
  itemId: string;
}

/**
 * EVERY outstanding item of each health category, in document order — not just
 * the first.
 *
 * This lives beside {@link computeCvHealth} on purpose. The two use the same
 * predicates, and while the target list lived in the editor component the pair
 * carried a "keep the two in sync" comment and no test to enforce it. Sharing a
 * module means a category can be counted and walked from one definition.
 *
 * Returning the whole list is what lets the checklist CYCLE. Jumping only to the
 * first meant an outstanding set could be counted but not read through: a
 * researcher told "3 works may not be yours" landed on the same row every time
 * and had to hunt the other two by expanding sections and looking for a badge.
 * That is the case that matters most — an included work flagged
 * `orcid-conflict` or `likely-misattributed` is a stranger's paper sitting
 * visibly on the CV.
 */
export function healthTargets(cv: CanonicalCv): Record<CvHealthCategory, HealthTarget[]> {
  const dismissed = new Set(cv.display.dismissedReviewCandidates ?? []);
  const out: Record<CvHealthCategory, HealthTarget[]> = {
    review: [],
    duplicates: [],
    conflicts: [],
    misattributed: [],
    retracted: [],
    evidence: [],
    narrative: [],
  };
  // MUST be orderedSections, not a raw sort on `s.order`. When
  // `display.sectionsCustomized` is unset — the common case, nobody has dragged a
  // section — the editor renders by DEFAULT_SECTION_ORDER[type] and ignores each
  // section's stored `order`, which can be stale on any document synced before
  // that table was last renumbered. Sorting raw here made the walk visit rows in
  // a different order from the one on screen, which is the whole point of a walk.
  for (const s of orderedSections(cv)) {
    for (const it of [...s.items].sort((a, b) => a.order - b.order)) {
      const flag = it.meta.reviewFlag;
      const here: HealthTarget = { sectionId: s.id, itemId: it.id };
      if (
        (flag === "name-matched" || flag === "orcid-doi") &&
        !it.included &&
        !it.notMine &&
        !dismissed.has(it.id)
      ) {
        out.review.push(here);
      }
      if (flag === "duplicate" && !isHidden(it)) out.duplicates.push(here);
      if (flag === "orcid-conflict" && !isHidden(it)) out.conflicts.push(here);
      if (flag === "likely-misattributed" && !isHidden(it) && !dismissed.has(it.id)) {
        out.misattributed.push(here);
      }
      if (it.meta.retracted === true && !isHidden(it) && !cv.display.hideRetracted) {
        out.retracted.push(here);
      }
    }
    const prose = proseEvidenceOf(cv, s);
    if (prose) {
      const here: HealthTarget = { sectionId: s.id, itemId: s.id };
      if (prose.unresolved > 0) out.evidence.push(here);
      if (isNarrativeModuleType(s.type) && prose.linked === 0) out.narrative.push(here);
    }
  }
  return out;
}

/**
 * The next target to jump to within a category, cycling.
 *
 * Pass the id currently focused as `afterId` to advance, wrapping at the end, so
 * repeated activation walks the whole set rather than pinning the first. Matches
 * how the sync banner's "to review" pill already behaves
 * ({@link nextReviewItemId} in `cv/reviewNavigation.ts`). Returns null when the
 * category is empty.
 */
export function nextHealthTarget(
  targets: readonly HealthTarget[],
  afterId?: string | null,
): HealthTarget | null {
  if (targets.length === 0) return null;
  const at = afterId ? targets.findIndex((t) => t.itemId === afterId) : -1;
  return targets[(at + 1) % targets.length]!;
}
