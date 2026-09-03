import type { CanonicalCv, CvItem } from "./schema";

/**
 * REVIEW STATE — how far the account holder has actually adjudicated their own
 * auto-assembled profile.
 *
 * SigmaCV attributes works to the account holder by identifier, never by name
 * string, but OpenAlex tunes its author disambiguation for recall over precision,
 * so a profile can contain a stranger's papers (see `misattribution.ts`). The
 * curation UI lets the user reject those. What the stored document could NOT say,
 * until `reviewedAt` existed, is whether the user ever *looked*: an unexamined
 * work and a deliberately-kept work were both `included:true, notMine:false`.
 *
 * That distinction is the denominator for every honest claim about a profile.
 * "Researcher-confirmed" means nothing without it, and a per-item provenance
 * badge that cannot tell "confirmed" from "untouched" is worse than no badge —
 * it asserts human attention that may never have happened.
 *
 * NOT TO BE CONFUSED with the other "review" in this codebase. `meta.reviewFlag`,
 * `display.dismissedReviewCandidates` and the "review candidate" language in
 * `build.ts` are about TRIAGE: the system flagging a specific item as suspicious
 * (name-matched, ORCID-conflicting, probably a duplicate) and holding it back
 * until the user rules on it. This module is about COVERAGE: whether the user has
 * looked at an item at all, suspicious or not. A profile can have zero review
 * candidates and still be entirely unreviewed.
 *
 * This module is PURE and derives everything from the stored item; nothing here
 * writes. The two write paths are `setItemReviewed` and `setItemNotMine` in
 * `curate.ts`.
 */

/**
 * The three-valued adjudication state of an item, DERIVED so that a contradictory
 * state is unrepresentable:
 *  - "rejected"   — the user asserted `notMine` (takes precedence over everything);
 *  - "confirmed"  — the user looked at it and kept it (`reviewedAt` stamped);
 *  - "unreviewed" — never adjudicated. The default for every item ever synced.
 */
export type ItemReviewState = "unreviewed" | "confirmed" | "rejected";

/** Derive an item's adjudication state. `notMine` always wins. */
export function itemReviewState(item: CvItem): ItemReviewState {
  if (item.notMine) return "rejected";
  return item.reviewedAt ? "confirmed" : "unreviewed";
}

/**
 * Whether an item belongs in the review DENOMINATOR.
 *
 * Reviewable = a citation item that a SOURCE attributed to the account holder.
 * Two exclusions, both deliberate:
 *  - non-citation entries (positions, editorial roles, grants) — these are
 *    adjudicable, but they are not what attribution error is about, and folding
 *    them in would let a user reach "100% reviewed" without touching a single
 *    publication;
 *  - user-asserted items (`manual`, `bibtex`, and DOI-claimed works) — the user
 *    supplied these, so "has the user checked them?" is vacuous, and counting
 *    them would let the denominator be padded.
 *
 * Note that `included` and `notMine` are NOT consulted: a hidden or rejected work
 * has still been reviewed, and must stay in the denominator or the percentage
 * would rise every time a user rejected something.
 */
export function isReviewable(item: CvItem): boolean {
  if (!item.csl) return false;
  if (item.source === "manual" || item.source === "bibtex") return false;
  if (item.meta.claimed) return false;
  return true;
}

/** Aggregate review progress over a whole CV. */
export interface ReviewCoverage {
  /** Items in the denominator — source-attributed citation items. */
  reviewable: number;
  /** Reviewable items adjudicated either way (confirmed + rejected). */
  reviewed: number;
  /** Reviewable items looked at and kept. */
  confirmed: number;
  /** Reviewable items asserted "not mine". */
  rejected: number;
  /**
   * `reviewed / reviewable` as 0..1, or `undefined` when there is nothing to
   * review. Deliberately not defaulted to 1: an empty profile is not a fully
   * reviewed one, and callers must render the difference.
   */
  fraction?: number;
}

/**
 * Compute review coverage across every section of a CV.
 *
 * Runs over the stored document (not a rendered projection), so hidden works and
 * hidden sections still count — the question is "has the user adjudicated what
 * the sources attributed to them", which does not depend on what they chose to
 * display.
 */
export function reviewCoverage(cv: CanonicalCv): ReviewCoverage {
  let reviewable = 0;
  let confirmed = 0;
  let rejected = 0;
  for (const section of cv.sections) {
    for (const item of section.items) {
      if (!isReviewable(item)) continue;
      reviewable += 1;
      const state = itemReviewState(item);
      if (state === "confirmed") confirmed += 1;
      else if (state === "rejected") rejected += 1;
    }
  }
  const reviewed = confirmed + rejected;
  return {
    reviewable,
    reviewed,
    confirmed,
    rejected,
    ...(reviewable > 0 ? { fraction: reviewed / reviewable } : {}),
  };
}

/**
 * The reviewable items a user has not adjudicated yet, in document order, with
 * their section id — the worklist behind a "review the rest" affordance.
 * Bounded by `limit` so a 900-work profile cannot build an unbounded array for
 * a UI that shows a handful at a time.
 */
export function unreviewedItems(
  cv: CanonicalCv,
  limit = 500,
): Array<{ sectionId: string; item: CvItem }> {
  const out: Array<{ sectionId: string; item: CvItem }> = [];
  for (const section of cv.sections) {
    for (const item of section.items) {
      if (out.length >= limit) return out;
      if (!isReviewable(item)) continue;
      if (itemReviewState(item) !== "unreviewed") continue;
      out.push({ sectionId: section.id, item });
    }
  }
  return out;
}
