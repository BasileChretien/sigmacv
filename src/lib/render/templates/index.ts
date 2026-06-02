import type {
  DisplayChoices,
  FontPairing,
  HighlightStyle,
  TemplateKey,
} from "@/lib/canonical/schema";
import { classicTemplate } from "./classic";
import { compactTemplate } from "./compact";
import { minimalTemplate } from "./minimal";
import { modernTemplate } from "./modern";
import type { CvTemplate, TemplateTheme } from "./types";

export type { CvTemplate, RenderedItem, RenderedSection, TemplateTheme } from "./types";

const FONT_STACKS: Record<FontPairing, string> = {
  serif: 'Georgia, "Times New Roman", serif',
  sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  palatino: '"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif',
};

/** CSS for the self-name `.cv-self` span, per highlight-style choice. */
const SELF_HIGHLIGHT_CSS: Record<HighlightStyle, string> = {
  accent: "color: var(--cv-accent); font-weight: 700;",
  bold: "font-weight: 700;",
  underline:
    "text-decoration: underline; text-underline-offset: 0.15em; text-decoration-thickness: 0.07em;",
  "accent-underline":
    "color: var(--cv-accent); font-weight: 700; text-decoration: underline; text-underline-offset: 0.15em;",
};

const REGISTRY: Record<TemplateKey, CvTemplate> = {
  classic: classicTemplate,
  modern: modernTemplate,
  minimal: minimalTemplate,
  compact: compactTemplate,
};

export function getTemplate(key: TemplateKey): CvTemplate {
  return REGISTRY[key];
}

/** Map the user's display choices to a CSS-safe presentation theme. */
export function resolveTheme(display: DisplayChoices): TemplateTheme {
  const compact = display.density === "compact";
  return {
    accentColor: display.accentColor,
    fontFamily: FONT_STACKS[display.fontPairing],
    bodyFontPt: compact ? 10 : 11,
    lineHeight: compact ? 1.3 : 1.45,
    sectionGapRem: compact ? 1.0 : 1.5,
    entryGapRem: compact ? 0.4 : 0.6,
    selfHighlightCss: SELF_HIGHLIGHT_CSS[display.highlightStyle],
  };
}
