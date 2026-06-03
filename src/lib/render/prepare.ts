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

  const perSection = visibleSections(cv).map((section) => ({
    section,
    items: visibleItems(section),
  }));

  // Citation items go through citeproc; non-citation items (editorial, grants)
  // carry a plain `displayText` instead.
  const cslItems = perSection
    .flatMap((s) => s.items)
    .map((i) => i.csl)
    .filter((c): c is CslItem => Boolean(c));
  const entries = renderBibliography(
    cslItems,
    cv.display.cslStyle,
    cv.display.locale,
    outputFormat,
  );
  const byId = new Map(entries.map((e) => [e.id, e.content]));

  return perSection.map(({ section, items }) => ({
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
  }));
}
