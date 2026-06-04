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
 * applies everywhere at once — and it mirrors the LIST filter in prepareSections
 * (incl. "peer-reviewed only"), so the figures never disagree with what's listed.
 */
export function countableWorks(cv: CanonicalCv): CvItem[] {
  const countLetters = cv.display.countLetters === true;
  const peerOnly = cv.display.peerReviewedOnly === true;
  const out: CvItem[] = [];
  for (const section of cv.sections) {
    if (section.type === "preprints") continue; // preprints never count toward figures
    for (const item of section.items) {
      if (!item.csl || isHidden(item)) continue; // kept citations only
      // A non-peer-reviewed publication (a letter) is excluded when "peer-reviewed
      // only" is on, or when "count letters" is off.
      if (item.meta.peerReviewed === false && (peerOnly || !countLetters)) continue;
      out.push(item);
    }
  }
  return out;
}
