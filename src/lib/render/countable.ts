import { isHidden, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

/**
 * The work items that count toward the FIGURES — the per-year charts, the
 * field-normalized metrics, and the authorship table — kept consistent across
 * all of them. A work counts when it is:
 *   - a kept citation (has CSL, not hidden / not "not mine"), AND
 *   - NOT in the Preprints section (preprints never count toward the figures), AND
 *   - peer-reviewed (non-peer-reviewed items — editorials, datasets — never count), AND
 *   - NOT retracted (`meta.retracted`, set by the Crossref / Retraction Watch
 *     enrichment) — a retracted work is never evidence of output, so it never
 *     counts, REGARDLESS of `display.hideRetracted`, AND
 *   - not a LETTER that the user has switched off via `countLetters`.
 *
 * Letters are peer-reviewed (journal correspondence), so they count by default;
 * `countLetters` is an opt-OUT for an "articles-only" view.
 *
 * Retraction is deliberately "always", not "only when hidden": `hideRetracted`
 * is a LIST choice (show the work with its "Retracted" badge, or drop it from the
 * page), the same way `peerReviewedOnly` is a list choice while non-peer-reviewed
 * items never count here. Listing a retracted paper with its badge is honest;
 * counting it in the RCR mean, the per-year chart, the authorship table or the OA
 * share would inflate every figure with a work the literature has withdrawn.
 *
 * This is the single source of truth; the LIST filter (`selectSections` in
 * citationItems.ts, used by prepareSections) mirrors the same fields, so the
 * figures never count anything a stricter list setting would drop.
 */
export function countableWorks(cv: CanonicalCv): CvItem[] {
  const countLetters = cv.display.countLetters !== false; // default on
  const out: CvItem[] = [];
  for (const section of cv.sections) {
    if (section.type === "preprints") continue; // preprints never count toward figures
    for (const item of section.items) {
      if (!item.csl || isHidden(item)) continue; // kept citations only
      if (item.meta.peerReviewed === false) continue; // peer-reviewed only
      if (item.meta.retracted === true) continue; // retracted works are never evidence
      if (item.meta.type === "letter" && !countLetters) continue; // articles-only: drop letters
      out.push(item);
    }
  }
  return out;
}
