import {
  displayInstitution,
  itemDateRange,
  itemDisplayText,
  type CanonicalCv,
  type CvItem,
  type CvSection,
} from "@/lib/canonical/schema";
import { localizedYearRange, yearRange } from "@/lib/canonical/entryLine";
import { DEFAULT_STYLE, isBundledStyle, registerStyleXml } from "@/lib/citeproc/assets";
import { renderBibliography, type CiteprocOutputFormat } from "@/lib/citeproc/engine";
import { renderStrings } from "@/lib/i18n/render";
import type { CslItem } from "@/types/csl";
import { selectSections } from "./citationItems";
import { cslForRender } from "./cslOverride";
import { escapeHtml } from "./escape";
import { supervisionEntry, supervisionEntryHtml, supervisionEntryText } from "./supervision";
import { supervisionSummary, supervisionSummaryText } from "./supervisionSummary";

const escapeHtmlText = escapeHtml;

export interface PreparedItem {
  item: CvItem;
  /** The citeproc-rendered bibliography entry (HTML or plain text). */
  entry: string;
}

export interface PreparedSection {
  section: CvSection;
  /**
   * An optional one-line lead-in rendered between the heading and the list (in
   * the output format — HTML-escaped markup or plain text). Today: the opt-in
   * Supervision summary. Absent for every other section.
   */
  intro?: string;
  items: PreparedItem[];
}

/**
 * The supervision section's opt-in summary line (`display.showSupervisionSummary`),
 * over the items this render lists. "" when off or nothing to count.
 */
function sectionIntro(cv: CanonicalCv, section: CvSection, items: CvItem[]): string {
  if (section.type !== "supervision" || !cv.display.showSupervisionSummary) return "";
  return supervisionSummaryText(supervisionSummary(items), renderStrings(cv.display.locale));
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

  // Which entries to list, in what order, under which corrections: the shared
  // selection (`citationItems.ts`) — the SAME one the BibTeX / CSL-JSON / RIS
  // exports serialise, so a file a reference manager imports can never disagree
  // with the CV. It already applies the owner's preferred publication name.
  //
  // Render each section's bibliography SEPARATELY. Numbered CSL styles
  // (Vancouver, AMA, Nature, IEEE…) number a bibliography 1..N and may sort it;
  // rendering all sections in one pass meant Publications showed gappy numbers
  // (3,4,5,…,11) because Preprints/Datasets occupied the skipped numbers. Per
  // section, each list is contiguous (Publications 1..K, Preprints 1..M).
  // Author–date styles (APA) carry no numbers, so their output is unchanged.
  return selectSections(cv).map(({ section, items }) => {
    // The per-work year/venue overrides (cslForRender) go on BEFORE citeproc, so a
    // correction shows identically in every format (never feed raw item.csl).
    const cslItems = items.map((i) => cslForRender(i)).filter((c): c is CslItem => Boolean(c));
    const entries = cslItems.length
      ? renderBibliography(cslItems, styleKey, cv.display.locale, outputFormat)
      : [];
    const byId = new Map(entries.map((e) => [e.id, e.content]));
    const intro = sectionIntro(cv, section, items);
    const hideNames = cv.display.hideSuperviseeNames === true;
    return {
      section,
      ...(intro ? { intro: outputFormat === "html" ? escapeHtmlText(intro) : intro } : {}),
      items: items.map((item) => {
        if (item.csl) return { item, entry: byId.get(item.id) ?? "" };
        // A STRUCTURED supervision record is serialized here, once, for every
        // format (the two-line HTML record / the flat text line) — with the
        // supervisee-name hiding applied in the same place. An unstructured
        // supervision entry falls through to its free-text line below.
        if (section.type === "supervision") {
          const rec = supervisionEntry(item, cv.display.locale, hideNames);
          if (rec) {
            const entry =
              outputFormat === "html" ? supervisionEntryHtml(rec) : supervisionEntryText(rec);
            return { item, entry };
          }
        }
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
