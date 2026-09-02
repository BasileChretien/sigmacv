import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";

/**
 * Find the rows behind a provenance line, so "Matched by name — review these"
 * can be navigated instead of merely counted.
 *
 * The panel tells you a source contributed items you have not decided on yet;
 * without a way through, finding them means expanding sections and reading for
 * a `Review` badge. These map a line's `itemSource` back to the outstanding
 * rows, in document order, so the caller can jump to the first — or cycle.
 *
 * "Outstanding" means still awaiting a decision: not included, not asserted
 * "not mine". A candidate the user has confirmed (now included) or rejected is
 * finished, and jumping to it would be a dead end.
 */

/** Is this row a review candidate from `itemSource` that still needs a decision? */
function isPendingFrom(item: CvItem, itemSource: string): boolean {
  return (
    item.source === itemSource &&
    Boolean(item.meta.reviewFlag) &&
    !item.included &&
    item.notMine !== true
  );
}

/** Every outstanding review candidate from `itemSource`, in document order. */
export function pendingReviewItems(
  cv: CanonicalCv | null | undefined,
  itemSource: string | undefined,
): CvItem[] {
  if (!cv || !itemSource) return [];
  return cv.sections.flatMap((section) =>
    section.items.filter((item) => isPendingFrom(item, itemSource)),
  );
}

/**
 * The id to jump to for `itemSource`, or null when nothing is outstanding.
 *
 * `afterId` cycles: pass the id currently focused to get the next one, wrapping
 * at the end, so repeated activation walks the whole set rather than pinning the
 * first. Matches how the sync banner's "to review" pill already behaves.
 */
export function nextReviewItemId(
  cv: CanonicalCv | null | undefined,
  itemSource: string | undefined,
  afterId?: string | null,
): string | null {
  const items = pendingReviewItems(cv, itemSource);
  if (items.length === 0) return null;
  const at = afterId ? items.findIndex((i) => i.id === afterId) : -1;
  return items[(at + 1) % items.length]!.id;
}
