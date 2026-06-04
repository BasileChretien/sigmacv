import type {
  DisplayChoices,
  FontPairing,
  HighlightStyle,
  TemplateKey,
} from "@/lib/canonical/schema";
import { atsTemplate } from "./ats";
import { auroraTemplate } from "./aurora";
import { classicTemplate } from "./classic";
import { compactTemplate } from "./compact";
import { editorialTemplate } from "./editorial";
import { minimalTemplate } from "./minimal";
import { modernTemplate } from "./modern";
import { rirekishoTemplate } from "./rirekisho";
import { sidebarTemplate } from "./sidebar";
import { slateTemplate } from "./slate";
import { timelineTemplate } from "./timeline";
import type { CvTemplate, TemplateTheme } from "./types";

export type { CvTemplate, RenderedItem, RenderedSection, TemplateTheme } from "./types";

const FONT_STACKS: Record<FontPairing, string> = {
  // Modern transitional serif: Apple's Iowan/Charter → Georgia → web-safe.
  serif:
    '"Iowan Old Style", "Charter", "Palatino Linotype", "Sitka Text", Georgia, "Times New Roman", serif',
  // System UI sans, Inter-class metrics where present.
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  // Humanist serif with a generous x-height — great for CVs.
  palatino:
    '"Palatino Linotype", Palatino, "Book Antiqua", "URW Palladio L", Georgia, serif',
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
  sidebar: sidebarTemplate,
  editorial: editorialTemplate,
  ats: atsTemplate,
  rirekisho: rirekishoTemplate,
  aurora: auroraTemplate,
  slate: slateTemplate,
  timeline: timelineTemplate,
};

export function getTemplate(key: TemplateKey): CvTemplate {
  return REGISTRY[key];
}

/** A 6-digit hex colour or the safe default — never interpolate untrusted CSS. */
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
function safeAccent(color: string): string {
  return HEX_COLOR.test(color) ? color : "#1f4fd8";
}

/** A low-opacity tint of the (already-validated) accent for rules/fills. */
function accentSoft(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, 0.08)`;
}

/** Map the user's display choices to a CSS-safe presentation theme. */
export function resolveTheme(display: DisplayChoices): TemplateTheme {
  const compact = display.density === "compact";
  // Defence-in-depth: the schema validates accentColor, but this value is
  // interpolated raw into a <style> block, so re-check at the render boundary.
  const accentColor = safeAccent(display.accentColor);
  return {
    accentColor,
    accentSoft: accentSoft(accentColor),
    fontFamily: FONT_STACKS[display.fontPairing],
    bodyFontPt: compact ? 10 : 11,
    lineHeight: compact ? 1.32 : 1.5,
    sectionGapRem: compact ? 1.05 : 1.7,
    entryGapRem: compact ? 0.38 : 0.58,
    nameSizeRem: compact ? 1.7 : 1.95,
    selfHighlightCss: SELF_HIGHLIGHT_CSS[display.highlightStyle],
  };
}
