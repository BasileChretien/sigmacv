import type { CanonicalCv, CvItem, CvSection } from "@/lib/canonical/schema";

/** One bibliography entry: the source item + its rendered (highlighted) HTML. */
export interface RenderedItem {
  item: CvItem;
  html: string;
}

export interface RenderedSection {
  section: CvSection;
  items: RenderedItem[];
}

/**
 * Resolved presentation theme (from DisplayChoices) handed to a template.
 * All values are safe to interpolate into CSS.
 */
export interface TemplateTheme {
  accentColor: string; // validated hex
  /** A low-opacity tint of the accent (safe rgba), derived from accentColor. */
  accentSoft: string;
  fontFamily: string; // resolved CSS font stack
  bodyFontPt: number;
  lineHeight: number;
  sectionGapRem: number;
  entryGapRem: number;
  /** Base <h1> name size in rem (templates may still override). */
  nameSizeRem: number;
  /** CSS declarations for `.cv-self` (from the highlight-style choice). */
  selfHighlightCss: string;
}

/**
 * A CV template renders the canonical object (with its citations already
 * formatted + highlighted) into a complete, self-contained HTML document.
 * Templates differ only in chrome/CSS — never in the citation data.
 */
export interface CvTemplate {
  key: string;
  render(
    cv: CanonicalCv,
    sections: RenderedSection[],
    theme: TemplateTheme,
  ): string;
}
