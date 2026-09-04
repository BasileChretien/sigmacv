import type { CanonicalCv, CvItem, CvSection } from "@/lib/canonical/schema";
import { visibleItems, visibleSections } from "@/lib/canonical/curate";
import { CITATION_SECTION_TYPES, sortPublicationItems } from "@/lib/canonical/publicationSort";
import type { CslItem } from "@/types/csl";
import { cslForRender } from "./cslOverride";
import { withSelfPublicationName } from "./selfName";

/**
 * The ONE answer to "which entries does this CV list, in what order, with which
 * corrections applied". Every visual renderer (HTML / PDF / DOCX / LaTeX /
 * Markdown, via `prepare.ts`) AND every machine citation export (BibTeX / CSL-JSON
 * / RIS / RO-Crate / the public per-work "Cite" button) go through here, so the
 * per-view exclusions, the "hide retracted" / "peer-reviewed only" / "count
 * letters" choices, the publication order + "Selected publications" cap, the
 * owner's preferred publication name and the per-work year/venue overrides can
 * never diverge between the CV a reader sees and the file a reference manager
 * imports. Pure + immutable — never mutates the canonical object.
 */

export interface SelectedSection {
  section: CvSection;
  /** The entries to list, in display order, with the owner's preferred
   *  publication name already substituted (see `withSelfPublicationName`). */
  items: CvItem[];
}

/** Visible sections with their listed entries, ordered, corrected, capped. */
export function selectSections(cv: CanonicalCv): SelectedSection[] {
  // Which CITATIONS to LIST (non-citation entries — positions, grants, editorial
  // roles — are never touched):
  //  - "Peer-reviewed only" drops every non-peer-reviewed work wherever it sits
  //    (preprints, editorials, a preprint mis-filed under Publications).
  //  - "Count letters" off → drop LETTERS (by document type) for an articles-only
  //    view, even though letters are peer-reviewed. On (default) → keep them.
  //  - "Hide retracted" drops retracted works.
  // All mirror countableWorks so the listing matches the figures.
  const peerOnly = cv.display.peerReviewedOnly;
  const countLetters = cv.display.countLetters !== false; // default on
  const hideRetracted = cv.display.hideRetracted === true;
  const keep = (item: CvItem): boolean => {
    if (!item.csl) return true; // non-citation entries untouched
    if (hideRetracted && item.meta.retracted) return false;
    if (peerOnly && item.meta.peerReviewed === false) return false;
    if (item.meta.type === "letter" && !countLetters) return false;
    return true;
  };

  // "Selected publications": cap the main Publications list to the top N AFTER
  // ordering + the filters above (for a grant biosketch / short CV). Only
  // Publications is capped; Preprints and everything else are untouched.
  const limit = cv.display.publicationsLimit ?? 0;

  return visibleSections(cv).map((section) => {
    let items = visibleItems(section).filter(keep);
    // Per-view exclusions ("hide from THIS view" — a cosmetic display choice,
    // distinct from "not mine"): drop them before ordering/limiting.
    const excluded = cv.display.excludedItems?.[section.id];
    if (excluded?.length) {
      const set = new Set(excluded);
      items = items.filter((it) => !set.has(it.id));
    }
    if (CITATION_SECTION_TYPES.has(section.type)) {
      // The `publicationOrder` display choice, shared with the editor list
      // (`SectionsList`) via `sortPublicationItems`. "custom" keeps the curated
      // /dragged order.
      items = sortPublicationItems(items, cv.display.publicationOrder);
      // "Selected / featured" works pin to the TOP of the section (stable, ahead
      // of the order above) — a hand-picked "Selected publications" set leads,
      // and the pins land within the publicationsLimit cap rather than dropping.
      const featured = items.filter((it) => it.featured);
      if (featured.length && featured.length < items.length) {
        items = [...featured, ...items.filter((it) => !it.featured)];
      }
    }
    if (section.type === "publications" && limit > 0) {
      items = items.slice(0, limit);
    }
    // The owner's preferred publication name: substitutes the account holder's
    // own author entry (located by the identifier-derived authorPosition, never
    // by name) so a correction shows identically in every format.
    const named = items.map((i) => withSelfPublicationName(i, cv.owner.publicationName));
    return { section, items: named };
  });
}

/** Every listed, owned entry that carries a citation (has CSL), across all
 *  sections, in display order — the items a citation export serialises. */
export function citationItems(cv: CanonicalCv): CvItem[] {
  return selectSections(cv)
    .flatMap((s) => s.items)
    .filter((i) => Boolean(i.csl) && !i.notMine);
}

/** `citationItems` as the CSL a renderer or export must use: the per-work
 *  year/venue overrides applied (`cslForRender`) — never raw `item.csl`. */
export function citationCslItems(cv: CanonicalCv): CslItem[] {
  return citationItems(cv)
    .map((i) => cslForRender(i))
    .filter((c): c is CslItem => Boolean(c));
}
