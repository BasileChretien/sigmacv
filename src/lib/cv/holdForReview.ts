import type { CanonicalCv } from "@/lib/canonical/schema";

/** The review flag stamped on a work held back by `display.holdNewForReview`. */
export const HELD_FOR_REVIEW = "held-for-review" as const;

/**
 * Apply the owner's "review new works before they appear" preference
 * (`display.holdNewForReview`) to a freshly-synced document.
 *
 * When the toggle is on, a re-sync must not silently push works it has never seen
 * onto the CV (and the living public page). Each work that the build would
 * auto-include — `included`, `authoredBySelf`, not "not mine", and carrying NO
 * existing review flag (so an over-merge/duplicate flag is never clobbered) — and
 * whose id was ABSENT from the previous document is flipped to a hidden review
 * candidate: `included:false` + `reviewFlag:"held-for-review"`. The owner confirms
 * it with "Show" in the editor; until then it appears nowhere public.
 *
 * No-op when the toggle is off, on the first build (no `previous` ⇒ nothing is
 * "new", so the initial import is always populated), or for any work the user has
 * already curated (carried-over `included`/`notMine`/flags are untouched). Pure.
 */
export function applyHoldForReview(
  cv: CanonicalCv,
  previous: CanonicalCv | null | undefined,
): CanonicalCv {
  if (!cv.display.holdNewForReview || !previous) return cv;

  const prevIds = new Set<string>();
  for (const section of previous.sections) {
    for (const item of section.items) prevIds.add(item.id);
  }

  let changed = false;
  const sections = cv.sections.map((section) => {
    let sectionChanged = false;
    const items = section.items.map((item) => {
      const isFreshAutoInclude =
        item.included &&
        item.authoredBySelf &&
        !item.notMine &&
        !item.meta.reviewFlag &&
        !prevIds.has(item.id);
      if (!isFreshAutoInclude) return item;
      sectionChanged = true;
      changed = true;
      return { ...item, included: false, meta: { ...item.meta, reviewFlag: HELD_FOR_REVIEW } };
    });
    return sectionChanged ? { ...section, items } : section;
  });

  return changed ? { ...cv, sections } : cv;
}
