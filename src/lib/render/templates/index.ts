import type {
  DisplayChoices,
  FontPairing,
  HighlightStyle,
  TemplateKey,
} from "@/lib/canonical/schema";
import { atsTemplate } from "./ats";
import { classicTemplate } from "./classic";
import { modernTemplate } from "./modern";
import { rirekishoTemplate } from "./rirekisho";
import { sidebarTemplate } from "./sidebar";
import type { CvTemplate, TemplateTheme } from "./types";

export type { CvTemplate, RenderedItem, RenderedSection, TemplateTheme } from "./types";

const FONT_STACKS: Record<FontPairing, string> = {
  // Modern transitional serif: Apple's Iowan/Charter → Georgia → web-safe.
  serif:
    '"Iowan Old Style", "Charter", "Palatino Linotype", "Sitka Text", Georgia, "Times New Roman", serif',
  // System UI sans, Inter-class metrics where present.
  sans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  // Humanist serif with a generous x-height — great for CVs.
  palatino: '"Palatino Linotype", Palatino, "Book Antiqua", "URW Palladio L", Georgia, serif',
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
  sidebar: sidebarTemplate,
  ats: atsTemplate,
  rirekisho: rirekishoTemplate,
};

export function getTemplate(key: TemplateKey): CvTemplate {
  return REGISTRY[key];
}

/** A 6-digit hex colour or the safe default — never interpolate untrusted CSS. */
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
function safeAccent(color: string): string {
  return HEX_COLOR.test(color) ? color : "#1f4fd8";
}

/**
 * Darken an accent toward black until it has at least `min` WCAG contrast vs
 * white. The accent colour is user-chosen (`accentColor` is validated only as a
 * hex — the picker has a free colour input), and it is used BOTH as text on
 * white (the Modern name, Classic/Sidebar headings, every link) AND as the
 * Sidebar's panel background under white text. Contrast is symmetric, so a
 * single "readable on white" floor makes both safe across every template.
 *
 * A no-op for any reasonably-saturated accent — all six `ACCENT_PRESETS` already
 * clear ~5:1, comfortably above the 4.7 floor — so it only ever rescues a
 * too-light custom pick (e.g. a pale yellow at ~1.4:1, otherwise an unreadable
 * name/heading/sidebar). Hue is preserved by scaling the channels toward black;
 * only lightness drops.
 */
function ensureReadableOnWhite(hex: string, min = 4.7): string {
  const rgb = [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const lum = (c: number[]): number => {
    const f = c.map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * f[0]! + 0.7152 * f[1]! + 0.0722 * f[2]!;
  };
  // Contrast of `c` against white (white luminance = 1).
  const contrast = (c: number[]): number => 1.05 / (lum(c) + 0.05);
  if (contrast(rgb) >= min) return hex;
  // Largest scale toward black (k in [0,1]) that still clears the floor — darken
  // as little as needed. Binary search converges to ~5 decimals in 24 steps.
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const k = (lo + hi) / 2;
    if (contrast(rgb.map((c) => c * k)) >= min) lo = k;
    else hi = k;
  }
  const toHex = (v: number): string => Math.round(v).toString(16).padStart(2, "0");
  return `#${rgb.map((c) => toHex(c * lo)).join("")}`;
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
  // Then floor its contrast so a too-light custom accent can't render an
  // unreadable name/heading/link or white-on-accent sidebar (no-op for presets).
  const accentColor = ensureReadableOnWhite(safeAccent(display.accentColor));
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
