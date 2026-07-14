import type { CvItem, CvSectionType, DisplayChoices } from "./schema";

/**
 * Section types whose entries respond to the `publicationOrder` display choice
 * (Publications + Preprints). Other sections keep their curated/dragged order.
 */
export const CITATION_SECTION_TYPES: ReadonlySet<CvSectionType> = new Set<CvSectionType>([
  "publications",
  "preprints",
]);

/** Whether `publicationOrder` actively re-sorts a section of this type (i.e. the
 *  section is a citation section AND the order is not the manual "custom"). When
 *  false, the section shows its curated/dragged order and manual reorder applies. */
export function publicationSortActive(
  sectionType: CvSectionType,
  order: DisplayChoices["publicationOrder"],
): boolean {
  return order !== "custom" && CITATION_SECTION_TYPES.has(sectionType);
}

/**
 * Order publication/preprint entries per the `publicationOrder` display choice.
 * `"custom"` preserves the incoming (curated/dragged) order; the others re-sort by
 * year (newest/oldest first) or citation count. Pure + immutable — returns a new
 * array, never mutates. Shared by the render pipeline (`render/prepare.ts`) and the
 * editor list (`components/SectionsList`) so what the owner curates matches what the
 * CV actually renders. Missing year/citations sort as 0 (i.e. to the bottom for the
 * descending orders). The sort is stable, so ties keep the incoming order.
 */
export function sortPublicationItems<T extends CvItem>(
  items: readonly T[],
  order: DisplayChoices["publicationOrder"],
): T[] {
  if (order === "custom") return [...items];
  return [...items].sort((a, b) => {
    if (order === "citations") {
      return (b.meta.citedByCount ?? 0) - (a.meta.citedByCount ?? 0);
    }
    if (order === "year-asc") return (a.meta.year ?? 0) - (b.meta.year ?? 0);
    return (b.meta.year ?? 0) - (a.meta.year ?? 0); // year-desc
  });
}
