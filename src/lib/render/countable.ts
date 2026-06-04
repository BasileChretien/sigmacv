import { isHidden, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

/**
 * The work items that count toward the FIGURES — the per-year charts, the
 * field-normalized metrics, and the authorship table — kept consistent across
 * all of them. A work counts when it is:
 *   - a kept citation (has CSL, not hidden / not "not mine"), AND
 *   - NOT in the Preprints section (preprints never count toward the figures), AND
 *   - peer-reviewed — OR a non-peer-reviewed publication (letter / editorial)
 *     when the `countLetters` display option is on.
 *
 * This is the single source of truth so "count letters / don't count letters"
 * applies everywhere at once.
 */
export function countableWorks(cv: CanonicalCv): CvItem[] {
  const countLetters = cv.display.countLetters === true;
  const out: CvItem[] = [];
  for (const section of cv.sections) {
    if (section.type === "preprints") continue; // preprints never count toward figures
    for (const item of section.items) {
      if (!item.csl || isHidden(item)) continue; // kept citations only
      if (item.meta.peerReviewed === false && !countLetters) continue; // letters off by default
      out.push(item);
    }
  }
  return out;
}
