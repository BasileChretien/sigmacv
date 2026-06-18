import {
  displayInstitution,
  itemDateRange,
  itemDisplayText,
  type CanonicalCv,
  type CvItem,
  type CvSection,
} from "@/lib/canonical/schema";
import { localizedYearRange, yearRange } from "@/lib/canonical/entryLine";
import { visibleItems, visibleSections } from "@/lib/canonical/curate";
import { DEFAULT_STYLE, isBundledStyle, registerStyleXml } from "@/lib/citeproc/assets";
import { renderBibliography, type CiteprocOutputFormat } from "@/lib/citeproc/engine";
import { renderStrings } from "@/lib/i18n/render";
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
 * The non-citation line text (positions / education), localized to the CV's
 * language: the institution name swapped for ROR's variant when one exists, and
 * the date-range term ("present" / "until …") swapped for the CV-language form.
 * Both bake an English/canonical value into `displayText` at build time and are
 * localized here so all formats agree; skipped when the user overrode the whole
 * line (their text is authoritative). Mirrors `withRorLink`'s `lastIndexOf` lookup
 * so the ROR link still wraps the now-localized institution name.
 */
function localizeEntryLine(item: CvItem, locale: string): string {
  let text = itemDisplayText(item) ?? "";
  if (item.displayTextOverride) return text;
  // Institution: swap the source name for ROR's localized variant.
  const base = item.meta.institution?.trim();
  const display = displayInstitution(item, locale);
  if (base && display && display !== base) {
    const at = text.lastIndexOf(base);
    if (at >= 0) text = text.slice(0, at) + display + text.slice(at + base.length);
  }
  // Date term: swap the English "present"/"until" baked into the line for the
  // CV-language term (a closed numeric range carries no words, so it's unchanged).
  const { startYear, endYear } = itemDateRange(item);
  const en = yearRange(startYear, endYear);
  if (en) {
    const rs = renderStrings(locale);
    const loc = localizedYearRange(startYear, endYear, rs.datePresent, rs.dateUntil);
    if (loc !== en) {
      const at = text.lastIndexOf(en);
      if (at >= 0) text = text.slice(0, at) + loc + text.slice(at + en.length);
    }
  }
  return text;
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
  // Resolve the effective citation style for THIS render.
  //  - A custom style whose payload this document carries → register + use it.
  //  - A custom style id WITHOUT a matching payload → do NOT resolve it from the
  //    shared, process-global custom-style cache (another user may have
  //    registered that id); fall back to the default bundled style.
  //  - A bundled style id → use it directly.
  const custom = cv.display.customStyle;
  let styleKey = cv.display.cslStyle;
  if (custom && custom.id === cv.display.cslStyle) {
    registerStyleXml(custom.id, custom.xml);
  } else if (!isBundledStyle(styleKey)) {
    styleKey = DEFAULT_STYLE;
  }

  // Which CITATIONS to LIST (non-citation entries — positions, grants, editorial
  // roles — are never touched):
  //  - "Peer-reviewed only" drops every non-peer-reviewed work wherever it sits
  //    (preprints, editorials, a preprint mis-filed under Publications).
  //  - "Count letters" off → drop LETTERS (by document type) for an articles-only
  //    view, even though letters are peer-reviewed. On (default) → keep them.
  // Both mirror countableWorks so the listing matches the figures.
  const peerOnly = cv.display.peerReviewedOnly;
  const countLetters = cv.display.countLetters !== false; // default on
  const hideRetracted = cv.display.hideRetracted === true;
  const keep = (item: CvItem): boolean => {
    if (!item.csl) return true; // non-citation entries untouched
    if (hideRetracted && item.meta.retracted) return false; // user opted to exclude retractions
    if (peerOnly && item.meta.peerReviewed === false) return false; // strict: drop non-peer-reviewed
    if (item.meta.type === "letter" && !countLetters) return false; // articles-only: drop letters
    return true;
  };

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

  // "Selected publications": cap the main Publications list to the top N AFTER
  // ordering + the peer-reviewed-only filter (for a grant biosketch / short CV).
  // Only Publications is capped; Preprints and everything else are untouched.
  const limit = cv.display.publicationsLimit ?? 0;

  const perSection = visibleSections(cv).map((section) => {
    let items = visibleItems(section).filter(keep);
    // Per-view exclusions ("hide from THIS view" — a cosmetic display choice,
    // distinct from "not mine"): drop them before ordering/limiting.
    const excluded = cv.display.excludedItems?.[section.id];
    if (excluded?.length) {
      const set = new Set(excluded);
      items = items.filter((it) => !set.has(it.id));
    }
    if (CITATION_SECTIONS.has(section.type)) {
      items = sortCitations(items);
      // "Selected / featured" works pin to the TOP of the section (stable, ahead of
      // the order above) — a hand-picked "Selected publications" set leads, and the
      // pins land within the publicationsLimit cap below rather than being dropped.
      const featured = items.filter((it) => it.featured);
      if (featured.length && featured.length < items.length) {
        items = [...featured, ...items.filter((it) => !it.featured)];
      }
    }
    if (section.type === "publications" && limit > 0) {
      items = items.slice(0, limit);
    }
    return { section, items };
  });

  // Render each section's bibliography SEPARATELY. Numbered CSL styles
  // (Vancouver, AMA, Nature, IEEE…) number a bibliography 1..N and may sort it;
  // rendering all sections in one pass meant Publications showed gappy numbers
  // (3,4,5,…,11) because Preprints/Datasets occupied the skipped numbers. Per
  // section, each list is contiguous (Publications 1..K, Preprints 1..M).
  // Author–date styles (APA) carry no numbers, so their output is unchanged.
  return perSection.map(({ section, items }) => {
    const cslItems = items.map((i) => i.csl).filter((c): c is CslItem => Boolean(c));
    const entries = cslItems.length
      ? renderBibliography(cslItems, styleKey, cv.display.locale, outputFormat)
      : [];
    const byId = new Map(entries.map((e) => [e.id, e.content]));
    return {
      section,
      items: items.map((item) => {
        if (item.csl) return { item, entry: byId.get(item.id) ?? "" };
        const text = localizeEntryLine(item, cv.display.locale);
        // citeproc HTML is already markup; plain displayText must be escaped for HTML.
        return {
          item,
          entry: outputFormat === "html" ? escapeHtmlText(text) : text,
        };
      }),
    };
  });
}
