import type { CanonicalCv } from "@/lib/canonical/schema";
import { escapeHtml } from "@/lib/render/escape";
import { ogImageProps } from "@/lib/cv/ogImage";

/**
 * Embeddable "Living CV" badge — a tiny, self-contained SVG a researcher drops
 * into a GitHub/GitLab README, a personal site, or a Notion page to link back to
 * their living public CV (`/p/<slug>`). PURE + tested under the gate; the route
 * handler just validates the slug, fetches the PUBLIC-projected CV, and renders
 * these strings into an `image/svg+xml` response.
 *
 * Design constraints (load-bearing):
 *  - **No iframe, no script.** The public page is served `X-Frame-Options: DENY`
 *    / `frame-ancestors 'none'`; a static SVG embedded as `<img>` sidesteps that
 *    entirely and is what READMEs/email/posters actually accept.
 *  - **Metric-free by default (DORA).** The badge certifies *openness + freshness*
 *    ("Living CV", last-synced month) — never an h-index or citation count. It is
 *    a brand surface for responsible assessment, so a vanity number here would be
 *    a mission regression, not a feature.
 *  - **Consent-safe.** Only fields already on the public page are used (name /
 *    initials / accent / coarse sync month) — the route hands us the
 *    `projectCvForPublic` output, so nothing gated can reach the badge.
 *  - **No remote fetch.** System-font stack only; the SVG is fully offline.
 *
 * Untrusted text (the display name, a custom label) is XML-escaped before it
 * enters the markup — the badge is served as `image/svg+xml`, an active sink.
 */

/** SVG badge styles the embed endpoint can render. */
export const BADGE_STYLES = ["pill", "flat", "card"] as const;
export type BadgeStyle = (typeof BADGE_STYLES)[number];

/**
 * Colour scheme. Only the `card` style has surfaces that react to it; the
 * `pill`/`flat` chips are self-contained coloured pills that read fine on any
 * page background, so they look identical in light and dark mode.
 */
export const BADGE_THEMES = ["auto", "light", "dark"] as const;
export type BadgeTheme = (typeof BADGE_THEMES)[number];

export interface BadgeOptions {
  style: BadgeStyle;
  theme: BadgeTheme;
  /** Right-hand label (default "Living CV"). */
  label: string;
  /** Accent override (validated hex); falls back to the CV accent. */
  color?: string;
}

const DEFAULT_LABEL = "Living CV";
const BRAND = "SigmaCV";
const SIGMA = "Σ"; // Σ wordmark
/** Mirrors the schema accent default; the last-resort fill if everything else is invalid. */
const FALLBACK_ACCENT = "#1f4fd8";
const MAX_LABEL = 40;
const MAX_NAME = 30;
const MAX_HEADLINE = 46;

/** A 3- or 6-digit hex colour. Used both to validate a `?color=` override and to
 *  defensively normalize the (schema-validated) CV accent before parsing it. */
const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const STYLE_SET = new Set<string>(BADGE_STYLES);
const THEME_SET = new Set<string>(BADGE_THEMES);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Drop C0 control chars + DEL from a user-supplied label (header/markup safety),
 *  without a control-char regex literal. */
function stripControls(s: string): string {
  let out = "";
  for (const ch of s) {
    const c = ch.codePointAt(0)!;
    if (c >= 0x20 && c !== 0x7f) out += ch;
  }
  return out;
}

/**
 * Validate + normalize untrusted query params into `BadgeOptions`. Unknown
 * style/theme values fall back to the defaults (`pill`/`auto`); the label is
 * stripped of control chars, trimmed, and length-capped; `color` is kept only
 * when it is a valid hex. Pure.
 */
export function parseBadgeOptions(params: {
  style?: string | null;
  theme?: string | null;
  label?: string | null;
  color?: string | null;
}): BadgeOptions {
  const style: BadgeStyle =
    params.style && STYLE_SET.has(params.style) ? (params.style as BadgeStyle) : "pill";
  const theme: BadgeTheme =
    params.theme && THEME_SET.has(params.theme) ? (params.theme as BadgeTheme) : "auto";
  const rawLabel = stripControls(params.label ?? "").trim();
  const label = rawLabel ? rawLabel.slice(0, MAX_LABEL) : DEFAULT_LABEL;
  const color = params.color && HEX_RE.test(params.color) ? params.color : undefined;
  return { style, theme, label, color };
}

/** Collapse whitespace, trim, and ellipsize to `max` characters. */
function clamp(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

/** `{r,g,b}` (0–255) for a normalized 3/6-digit hex. */
function parseHex(hex: string): { r: number; g: number; b: number } {
  let h = hex.slice(1);
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** Pick near-black or white text for legibility on a solid `hex` fill. Exported
 *  so the raster email-badge card (`badge.png`) tints its avatar identically. */
export function readableOn(hex: string): string {
  const { r, g, b } = parseHex(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#1f2328" : "#ffffff";
}

/**
 * Estimate the advance width of `s` at `fontSize` for a sans serif, without a
 * font-metrics table: CJK/full-width glyphs ≈ 1em, thin glyphs ≈ 0.32em, wide
 * caps ≈ 0.85em, everything else ≈ 0.56em. Used only to size the badge box, so
 * a rough estimate (with generous padding) is enough.
 */
function textWidth(s: string, fontSize: number): number {
  let w = 0;
  for (const ch of s) {
    const code = ch.codePointAt(0)!;
    if (code > 0x2e7f) w += fontSize;
    else if (/[iIl.,:;'`|!()[\] ]/.test(ch)) w += fontSize * 0.32;
    else if (/[mwMW]/.test(ch)) w += fontSize * 0.85;
    else w += fontSize * 0.56;
  }
  return Math.ceil(w);
}

/** "Jun 2026" for a stored ISO date, or "" when missing/unparseable. Exported
 *  so the raster email-badge card reuses the same coarse-month freshness label. */
export function syncedLabel(iso: string | undefined): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return "";
  const d = new Date(t);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

/** Two-segment shields-style pill: `[Σ SigmaCV] [label]`. Theme-invariant.
 *  `title` is PRE-ESCAPED by the caller. */
function pillSvg(label: string, accent: string, title: string): string {
  const h = 20;
  const fs = 11;
  const pad = 7;
  const left = `${SIGMA} ${BRAND}`;
  const leftW = textWidth(left, fs) + pad * 2;
  const rightW = textWidth(label, fs) + pad * 2;
  const w = leftW + rightW;
  const onAccent = readableOn(accent);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">` +
    `<title>${title}</title>` +
    `<clipPath id="r"><rect width="${w}" height="${h}" rx="3"/></clipPath>` +
    `<g clip-path="url(#r)">` +
    `<rect width="${leftW}" height="${h}" fill="#1f2328"/>` +
    `<rect x="${leftW}" width="${rightW}" height="${h}" fill="${accent}"/>` +
    `</g>` +
    `<g font-family="${FONT}" font-size="${fs}" font-weight="500" text-anchor="middle">` +
    `<text x="${leftW / 2}" y="14" fill="#ffffff">${escapeHtml(left)}</text>` +
    `<text x="${leftW + rightW / 2}" y="14" fill="${onAccent}">${escapeHtml(label)}</text>` +
    `</g></svg>`
  );
}

/** Single accent chip: `Σ label`. Minimal, theme-invariant. `title` PRE-ESCAPED. */
function flatSvg(label: string, accent: string, title: string): string {
  const h = 20;
  const fs = 11;
  const pad = 8;
  const text = `${SIGMA} ${label}`;
  const w = textWidth(text, fs) + pad * 2;
  const onAccent = readableOn(accent);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">` +
    `<title>${title}</title>` +
    `<rect width="${w}" height="${h}" rx="4" fill="${accent}"/>` +
    `<text x="${w / 2}" y="14" font-family="${FONT}" font-size="${fs}" font-weight="500" text-anchor="middle" fill="${onAccent}">${escapeHtml(text)}</text>` +
    `</svg>`
  );
}

interface CardSurface {
  s: string;
  bd: string;
  tx: string;
  mu: string;
}
const CARD_LIGHT: CardSurface = { s: "#ffffff", bd: "#d0d7de", tx: "#1f2328", mu: "#57606a" };
const CARD_DARK: CardSurface = { s: "#0d1117", bd: "#30363d", tx: "#e6edf3", mu: "#8b949e" };

/** `.s/.bd/.tx/.mu` fill+stroke rules for a surface palette. */
function surfaceRules(p: CardSurface): string {
  return `.s{fill:${p.s}}.bd{stroke:${p.bd}}.tx{fill:${p.tx}}.mu{fill:${p.mu}}`;
}

/** Theme-aware `<style>` for the card: fixed light/dark, or light + a
 *  `prefers-color-scheme: dark` override for `auto` (evaluated by the viewer's
 *  browser even when the SVG is embedded as an `<img>`).
 *
 *  SECURITY: this `<style>` content MUST stay 100% hardcoded (the surface palettes
 *  are module constants). It is the only reason the response can carry
 *  `style-src 'unsafe-inline'`; never interpolate user data into it. */
function cardStyle(theme: BadgeTheme): string {
  if (theme === "light") return `<style>${surfaceRules(CARD_LIGHT)}</style>`;
  if (theme === "dark") return `<style>${surfaceRules(CARD_DARK)}</style>`;
  return `<style>${surfaceRules(CARD_LIGHT)}@media (prefers-color-scheme:dark){${surfaceRules(CARD_DARK)}}</style>`;
}

/** Richer card: avatar monogram + name + headline + "Living CV · synced <month>".
 *  `title` PRE-ESCAPED. */
function cardSvg(
  opts: {
    name: string;
    initials: string;
    headline: string;
    label: string;
    synced: string;
    accent: string;
    theme: BadgeTheme;
  },
  title: string,
): string {
  const w = 360;
  const h = 96;
  const onAccent = readableOn(opts.accent);
  const footer = opts.synced ? `${opts.label} · synced ${opts.synced}` : opts.label;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${title}">` +
    `<title>${title}</title>` +
    cardStyle(opts.theme) +
    `<rect class="s bd" x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="11" stroke-width="1"/>` +
    `<circle cx="38" cy="40" r="22" fill="${opts.accent}"/>` +
    `<text x="38" y="46" font-family="${FONT}" font-size="17" font-weight="500" text-anchor="middle" fill="${onAccent}">${escapeHtml(opts.initials)}</text>` +
    `<text class="tx" x="72" y="35" font-family="${FONT}" font-size="15" font-weight="500">${escapeHtml(opts.name)}</text>` +
    (opts.headline
      ? `<text class="mu" x="72" y="54" font-family="${FONT}" font-size="12">${escapeHtml(opts.headline)}</text>`
      : "") +
    `<text x="72" y="79" font-family="${FONT}" font-size="12" font-weight="500" fill="${opts.accent}">${SIGMA}</text>` +
    `<text class="mu" x="85" y="79" font-family="${FONT}" font-size="12">${escapeHtml(footer)}</text>` +
    `</svg>`
  );
}

/**
 * Render the "Living CV" badge SVG for a (public-projected) canonical CV. Reuses
 * `ogImageProps` for the name/initials/headline/accent, reads the coarse sync
 * month from provenance, and never touches a metric or contact field.
 */
export function badgeSvg(cv: CanonicalCv, opts: BadgeOptions): string {
  const props = ogImageProps(cv);
  const resolved = opts.color ?? props.accentColor;
  const accent = HEX_RE.test(resolved) ? resolved : FALLBACK_ACCENT;
  const name = clamp(props.name, MAX_NAME);
  // The accessible title embeds the raw name + label; escape it ONCE here so the
  // builders can drop it straight into the `aria-label` attribute and `<title>`
  // element. The badge is served as active image/svg+xml — an injection sink.
  const title = escapeHtml(`${name} — ${opts.label} on SigmaCV`);

  if (opts.style === "flat") return flatSvg(opts.label, accent, title);
  if (opts.style === "card") {
    return cardSvg(
      {
        name,
        initials: props.initials,
        headline: clamp(props.headline || props.affiliation, MAX_HEADLINE),
        label: opts.label,
        synced: syncedLabel(cv.provenance.lastSyncedAt ?? cv.provenance.generatedAt),
        accent,
        theme: opts.theme,
      },
      title,
    );
  }
  return pillSvg(opts.label, accent, title);
}
