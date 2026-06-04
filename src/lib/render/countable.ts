import { isHidden, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

/**
 * The work items that count toward the FIGURES — the per-year charts, the
 * field-normalized metrics, and the authorship table — kept consistent across
 * all of them. A work counts when it is:
 *   - a kept citation (has CSL, not hidden / not "not mine"), AND
 *   - NOT in the Preprints section (preprints never count toward the figures), AND
 *   - peer-reviewed (non-peer-reviewed items — editorials, datasets — never count), AND
 *   - not a LETTER that the user has switched off via `countLetters`.
 *
 * Letters are peer-reviewed (journal correspondence), so they count by default;
 * `countLetters` is an opt-OUT for an "articles-only" view. This is the single
 * source of truth, mirrored by the LIST filter in prepareSections, so the
 * figures never disagree with what's listed.
 */
export function countableWorks(cv: CanonicalCv): CvItem[] {
  const countLetters = cv.display.countLetters !== false; // default on
  const out: CvItem[] = [];
  for (const section of cv.sections) {
    if (section.type === "preprints") continue; // preprints never count toward figures
    for (const item of section.items) {
      if (!item.csl || isHidden(item)) continue; // kept citations only
      if (item.meta.peerReviewed === false) continue; // peer-reviewed only
      if (item.meta.type === "letter" && !countLetters) continue; // articles-only: drop letters
      out.push(item);
    }
  }
  return out;
}
