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
import { ensureReadableOnWhite } from "../readableAccent";

export type { CvTemplate, RenderedItem, RenderedSection, TemplateTheme } from "./types";

// Every pairing LEADS with a bundled font (embedded @font-face, see commonCss /
// bundledFonts.ts), so the typeface is IDENTICAL in the editor preview, the
// server-rendered PDF and every visitor's browser — not whatever font each device
// happens to install. The system fonts that follow are a fallback for glyphs
// outside the bundled latin subset (Cyrillic/CJK fall through per-glyph via the
// @font-face unicode-range). The three keys are stable ids; their user-facing
// labels (the actual font names) live in i18n.
const FONT_STACKS: Record<FontPairing, string> = {
  // Source Serif 4 — refined contemporary serif (default).
  serif:
    '"Source Serif 4", "Iowan Old Style", "Charter", "Palatino Linotype", "Sitka Text", Georgia, "Times New Roman", serif',
  // Inter — clean modern sans.
  sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  // EB Garamond — classic old-style serif (the "palatino" key is legacy).
  palatino:
    '"EB Garamond", "Palatino Linotype", Palatino, "Book Antiqua", "URW Palladio L", Georgia, serif',
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
  // Overall type-size multiplier (clamped defensively). Scales the body pt size
  // directly AND, via commonCss's `html { font-size }`, every rem-based size
  // (headings, name, section gaps) — so the WHOLE CV grows/shrinks in proportion.
  const fontScale = Math.min(1.25, Math.max(0.8, display.fontScale));
  // Defence-in-depth: the schema validates accentColor, but this value is
  // interpolated raw into a <style> block, so re-check at the render boundary.
  // Then floor its contrast so a too-light custom accent can't render an
  // unreadable name/heading/link or white-on-accent sidebar (no-op for presets).
  const accentColor = ensureReadableOnWhite(safeAccent(display.accentColor));
  return {
    accentColor,
    accentSoft: accentSoft(accentColor),
    fontFamily: FONT_STACKS[display.fontPairing],
    fontScale,
    // Body text is `pt` (absolute), so it must be scaled here; the rem sizes below
    // are scaled by the root font-size in commonCss. Both by the same factor.
    bodyFontPt: Math.round((compact ? 10 : 11) * fontScale * 100) / 100,
    lineHeight: compact ? 1.32 : 1.5,
    sectionGapRem: compact ? 1.05 : 1.7,
    entryGapRem: compact ? 0.38 : 0.58,
    nameSizeRem: compact ? 1.7 : 1.95,
    selfHighlightCss: SELF_HIGHLIGHT_CSS[display.highlightStyle],
    // CSS `@page size` keyword: "A4" (ISO) or "letter" (US 8.5×11in).
    pageSize: display.pageFormat === "letter" ? "letter" : "A4",
  };
}
