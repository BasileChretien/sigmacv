import {
  isHidden,
  itemDisplayText,
  type CanonicalCv,
  type CvItem,
  type CvSection,
  type NotMineReason,
} from "./schema";
import { withExcludedItems } from "./curate";

/**
 * Bulk curation: pure, immutable operations over MANY items of one section at
 * once, plus the filter that selects them. A senior researcher with 400+ works
 * otherwise pays one click per item to trim a CV — these keep curation cost
 * roughly constant in career length. Same contract as `curate.ts`: every
 * function returns a NEW object and runs identically client- and server-side.
 */

export interface BulkFilter {
  /** Case-insensitive substring match on title / venue / display text. */
  text?: string;
  /** Inclusive year bounds (items without a year never match a bounded filter). */
  yearFrom?: number;
  yearTo?: number;
  /** Only items carrying a review flag (advisory disambiguation hints). */
  flaggedOnly?: boolean;
}

/** Whether one item matches a bulk filter (an empty filter matches everything). */
export function matchesBulkFilter(item: CvItem, filter: BulkFilter): boolean {
  const text = filter.text?.trim().toLowerCase();
  if (text) {
    const venue = item.csl?.["container-title"];
    const hay = [
      item.csl?.title,
      typeof venue === "string" ? venue : undefined,
      itemDisplayText(item),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    if (!hay.includes(text)) return false;
  }
  if (
    filter.yearFrom !== undefined &&
    (item.meta.year === undefined || item.meta.year < filter.yearFrom)
  ) {
    return false;
  }
  if (
    filter.yearTo !== undefined &&
    (item.meta.year === undefined || item.meta.year > filter.yearTo)
  ) {
    return false;
  }
  if (filter.flaggedOnly && item.meta.reviewFlag === undefined) return false;
  return true;
}

/** A section's items matching the filter, in display (order-field) order. */
export function filterSectionItems(section: CvSection, filter: BulkFilter): CvItem[] {
  return [...section.items]
    .sort((a, b) => a.order - b.order)
    .filter((it) => matchesBulkFilter(it, filter));
}

function mapSectionItems(
  cv: CanonicalCv,
  sectionId: string,
  fn: (item: CvItem) => CvItem,
): CanonicalCv {
  return {
    ...cv,
    sections: cv.sections.map((s) => (s.id === sectionId ? { ...s, items: s.items.map(fn) } : s)),
  };
}

/** Bulk show/hide on the CV (display curation, exactly like `setItemIncluded`
 *  per item — the work is still the user's; nothing is deleted). */
export function setItemsIncluded(
  cv: CanonicalCv,
  sectionId: string,
  itemIds: readonly string[],
  included: boolean,
): CanonicalCv {
  const ids = new Set(itemIds);
  if (ids.size === 0) return cv;
  return mapSectionItems(cv, sectionId, (it) => (ids.has(it.id) ? { ...it, included } : it));
}

/**
 * Bulk "not mine" assertion / retraction — the same disambiguation claim as
 * `setItemNotMine`, applied to many items with ONE shared reason (a namesake
 * cleanup is dozens of works wrongly attributed for the same cause). Each item
 * still records its own timestamp + reason, so the research signal per item is
 * identical to N single assertions.
 */
export function setItemsNotMine(
  cv: CanonicalCv,
  sectionId: string,
  itemIds: readonly string[],
  notMine: boolean,
  opts: { reason?: NotMineReason; now?: string } = {},
): CanonicalCv {
  const ids = new Set(itemIds);
  if (ids.size === 0) return cv;
  const now = opts.now ?? new Date().toISOString();
  return mapSectionItems(cv, sectionId, (it) =>
    ids.has(it.id)
      ? {
          ...it,
          notMine,
          notMineAssertedAt: notMine ? now : undefined,
          notMineReason: notMine ? opts.reason : undefined,
        }
      : it,
  );
}

/**
 * Bulk per-VIEW show/hide (`display.excludedItems`) — the cosmetic per-preset
 * choice, not curation. One exclusion-list rewrite for the whole batch (the
 * per-item op would rebuild `display` N times).
 */
export function setItemsInView(
  cv: CanonicalCv,
  sectionId: string,
  itemIds: readonly string[],
  show: boolean,
): CanonicalCv {
  const ids = new Set(itemIds);
  if (ids.size === 0) return cv;
  const existing = cv.display.excludedItems?.[sectionId] ?? [];
  const next = show
    ? existing.filter((id) => !ids.has(id))
    : [...new Set([...existing, ...itemIds])];
  return withExcludedItems(cv, sectionId, next);
}

/**
 * Which of the given items may carry a "not mine" disambiguation claim — the
 * SAME eligibility rule the per-row editor applies (a third party attributed
 * the item by identifier; manual rows and name+org-matched registry candidates
 * are excluded). Lets the bulk action bar offer "Not mine" only where it is
 * meaningful and apply it only to eligible members of a mixed selection.
 */
export function notMineEligibleIds(section: CvSection, itemIds: readonly string[]): string[] {
  const ids = new Set(itemIds);
  return section.items
    .filter((it) => ids.has(it.id))
    .filter((it) => {
      if (it.source === "manual") return false;
      const isCitation = Boolean(it.csl);
      return (
        isCitation ||
        it.source === "oep" ||
        it.source === "datacite" ||
        it.source === "openaire" ||
        it.source === "dblp" ||
        section.type === "positions"
      );
    })
    .map((it) => it.id);
}

/** Convenience for the bulk bar: ids of a section's items that are currently
 *  hidden (display-hidden or asserted not-mine) among the given ids. */
export function hiddenIds(section: CvSection, itemIds: readonly string[]): string[] {
  const ids = new Set(itemIds);
  return section.items.filter((it) => ids.has(it.id) && isHidden(it)).map((it) => it.id);
}
