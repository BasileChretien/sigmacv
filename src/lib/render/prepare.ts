import type { CanonicalCv, CvItem, CvSection } from "@/lib/canonical/schema";
import { visibleItems, visibleSections } from "@/lib/canonical/curate";
import { registerStyleXml } from "@/lib/citeproc/assets";
import {
  renderBibliography,
  type CiteprocOutputFormat,
} from "@/lib/citeproc/engine";
import type { CslItem } from "@/types/csl";
import { escapeHtml } from "./escape";

const escapeHtmlText = escapeHtml;

export interface PreparedItem {
  item: CvItem;
  /** The citeproc-rendered bibliography entry (HTML or plain text). */
  entry: string;
}

export interface PreparedSection {
  section: CvSection;
  items: PreparedItem[];
}

/**
 * Shared front-end for every renderer: take the canonical object, drop hidden
 * sections/items, and render the bibliography ONCE (in the requested output
 * format), mapping each entry back to its item. Format-specific self-name
 * emphasis is applied by the individual renderers.
 */
export function prepareSections(
  cv: CanonicalCv,
  outputFormat: CiteprocOutputFormat,
): PreparedSection[] {
  // If the chosen style is a user-added custom style, make its XML resolvable
  // for this render (the canonical document carries it; this is the fast path).
  const custom = cv.display.customStyle;
  if (custom && custom.id === cv.display.cslStyle) {
    registerStyleXml(custom.id, custom.xml);
  }

  // "Peer-reviewed only" drops non-peer-reviewed CITATIONS wherever they sit
  // (e.g. a preprint mis-filed under Publications). Non-citation entries
  // (positions, grants, editorial roles) are never touched.
  const peerOnly = cv.display.peerReviewedOnly;
  const keep = (item: CvItem): boolean =>
    !peerOnly || !item.csl || item.meta.peerReviewed !== false;

  // Optional re-sort of publication/preprint entries by citations or year.
  // "custom" keeps the curated/dragged order (the chokepoint default).
  const order = cv.display.publicationOrder;
  const CITATION_SECTIONS = new Set(["publications", "preprints"]);
  const sortCitations = (items: CvItem[]): CvItem[] => {
    if (order === "custom") return items;
    return [...items].sort((a, b) => {
      if (order === "citations") {
        return (b.meta.citedByCount ?? 0) - (a.meta.citedByCount ?? 0);
      }
      if (order === "year-asc") return (a.meta.year ?? 0) - (b.meta.year ?? 0);
      return (b.meta.year ?? 0) - (a.meta.year ?? 0); // year-desc
    });
  };

  const perSection = visibleSections(cv).map((section) => {
    let items = visibleItems(section).filter(keep);
    if (CITATION_SECTIONS.has(section.type)) items = sortCitations(items);
    return { section, items };
  });

  // Render each section's bibliography SEPARATELY. Numbered CSL styles
  // (Vancouver, AMA, Nature, IEEE…) number a bibliography 1..N and may sort it;
  // rendering all sections in one pass meant Publications showed gappy numbers
  // (3,4,5,…,11) because Preprints/Datasets occupied the skipped numbers. Per
  // section, each list is contiguous (Publications 1..K, Preprints 1..M).
  // Author–date styles (APA) carry no numbers, so their output is unchanged.
  return perSection.map(({ section, items }) => {
    const cslItems = items
      .map((i) => i.csl)
      .filter((c): c is CslItem => Boolean(c));
    const entries = cslItems.length
      ? renderBibliography(
          cslItems,
          cv.display.cslStyle,
          cv.display.locale,
          outputFormat,
        )
      : [];
    const byId = new Map(entries.map((e) => [e.id, e.content]));
    return {
      section,
      items: items.map((item) => {
        if (item.csl) return { item, entry: byId.get(item.id) ?? "" };
        const text = item.displayText ?? "";
        // citeproc HTML is already markup; plain displayText must be escaped for HTML.
        return {
          item,
          entry: outputFormat === "html" ? escapeHtmlText(text) : text,
        };
      }),
    };
  });
}
