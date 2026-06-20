/**
 * Public-page showcase style — "Codex" (atmosphere redesign).
 *
 * A field-tuned credible style for the HUMANITIES, rendered as a FINE-PRESS BOOK
 * in a warm, lamplit reading room. The mood lives entirely in the ATMOSPHERE
 * LAYER (a warm graded background + a soft lamp glow); the text lives on a separate
 * READING SURFACE — an ivory page that floats above the atmosphere with a gilt
 * edge — so nothing textured or moving is ever behind a glyph.
 *
 *   • ATMOSPHERE — a warm amber-parchment field with a soft lamp glow from above;
 *     a single, very slow warmth breathe, confined to the surround (never the page).
 *   • READING SURFACE — an ivory page, centred, floating on a soft shadow + a fine
 *     gilt keyline; all text sits here, always crisp.
 *   • ILLUMINATED MARGIN (the signature) — the page carries a decorated left
 *     margin: a gilt rule and a hand-drawn foliate vine, like a manuscript.
 *   • TYPE — EB Garamond (bundled), the body face of fine printing; oxblood
 *     small-caps headings with a fleuron; an illuminated versal opens the summary.
 *   • SELF-NAME — your own (identifier-matched, never name-string-matched) name in
 *     oxblood small-caps.
 *
 * One orchestrated load moment: the page settles open. CSS-ONLY; AA throughout
 * (ink ~12:1, oxblood #6e2530 ~6.5:1 on the ivory page); `prefers-reduced-motion`
 * stills everything; print = clean black-on-white, surround dropped. Not a mascot
 * style.
 */
import { bundledFaceCss } from "@/lib/render/bundledFonts";
import {
  attributionFooter,
  coauthorLinksFooter,
  commonCss,
  cvPageShell,
  headerHtml,
  licenseFooter,
  provenanceFooter,
  sectionsHtml,
} from "@/lib/render/templates/shared";
import type { CvTemplate, TemplateTheme } from "@/lib/render/templates/types";

function codexCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    --cx-ink:#2a2218; --cx-ink-2:#4a4030; --cx-muted:#6a5e49; --cx-faint:#7c6f57;
    --cx-page:#f6efdd; --cv-page:#f6efdd;
    --cx-rule: rgba(42,34,24,0.16); --cx-rule-strong: rgba(42,34,24,0.30);
    --cx-oxblood:#7a2b35; --cx-oxblood-ink:#6e2530; --cx-gilt:#9c7b3f; --cx-gilt-lt:#c2a35f;
    --cx-serif: "EB Garamond", ui-serif, "Iowan Old Style", Georgia, "Times New Roman", serif;
    --cx-sans: ui-sans-serif, system-ui, "Optima", "Segoe UI", Helvetica, Arial, sans-serif;
  }

  /* ---- Atmosphere layer: a warm, lamplit reading room ---- */
  body { min-height:100vh; color:var(--cx-ink); font-family: var(--cx-serif);
    background:
      radial-gradient(135% 80% at 50% -12%, #f0e4c6 0%, #e6d4ab 48%, #d8c498 100%);
    background-attachment: fixed; }
  body::before { content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
    background: radial-gradient(58% 44% at 50% 6%, rgba(255,245,216,0.55), transparent 70%);
    animation: cx-lamp 9s ease-in-out infinite; }
  @keyframes cx-lamp { 0%,100% { opacity:0.66; } 50% { opacity:1; } }

  /* ---- Reading surface: an ivory page floating above the atmosphere ---- */
  .cv { position:relative; z-index:1; max-width: 760px;
    margin: clamp(22px,5vw,60px) auto clamp(40px,7vw,84px);
    background: var(--cx-page);
    padding: clamp(46px,7vw,82px) clamp(28px,6vw,64px) clamp(54px,8vw,92px) clamp(58px,9vw,104px);
    border-radius: 2px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.55), 0 30px 70px -42px rgba(58,40,14,0.72), 0 0 0 1px rgba(156,123,63,0.28);
    animation: cx-open 0.95s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
  @keyframes cx-open { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } }

  /* ---- Illuminated left margin (the signature): a gilt rule + a foliate vine ---- */
  .cv::before { content:""; position:absolute; left: clamp(30px,5vw,56px);
    top: clamp(32px,5vw,58px); bottom: clamp(32px,5vw,58px); width:1px;
    background: linear-gradient(180deg, transparent, var(--cx-gilt) 8%, var(--cx-gilt) 92%, transparent); opacity:0.7; }
  .cx-vine { position:absolute; left: clamp(14px,3.4vw,32px); top: clamp(24px,4.4vw,48px);
    width:48px; height:160px; z-index:2; pointer-events:none; color: var(--cx-gilt); }
  @media (max-width: 720px) {
    .cv { padding-left: clamp(28px,6vw,40px); }
    .cv::before, .cx-vine { display:none; }
  }

  /* ---- Masthead ---- */
  header.cv-header { position:relative; margin-bottom: 2.6rem; padding-bottom: 2.2rem;
    border-bottom: 1px solid var(--cx-rule-strong); }
  header.cv-header::before {
    content:"Curriculum Vitæ"; display:block; font-family: var(--cx-sans);
    font-size:0.64rem; font-weight:600; letter-spacing:0.36em; text-transform:uppercase;
    color: var(--cx-oxblood-ink); margin-bottom:1.1rem; }
  header.cv-header::after {
    content:"❦"; position:absolute; left:50%; bottom:0.5rem; transform:translateX(-50%);
    font-size:1.05rem; color: var(--cx-gilt); }
  .cv-headmain { gap: 2rem; align-items: flex-start; }
  header.cv-header h1 {
    font-family: var(--cx-serif); font-size: clamp(2.7rem, 7.2vw, 4.3rem); font-weight:500;
    line-height:1.0; letter-spacing:0; color: var(--cx-ink); margin:0 0 0.4rem;
    font-variant-ligatures: common-ligatures contextual; font-variant-numeric: oldstyle-nums; }
  .cv-honorific { font-style: italic; font-weight:400; }
  header.cv-header .cv-headline {
    font-family: var(--cx-serif); font-style: italic; font-weight:400;
    font-size: clamp(1.12rem, 2.6vw, 1.46rem); color: var(--cx-ink-2); margin-top:0.25rem; }
  header.cv-header .cv-ids, header.cv-header .cv-contact, header.cv-header .cv-links {
    font-family: var(--cx-sans); font-size:0.8rem; letter-spacing:0.01em; color: var(--cx-muted); }
  header.cv-header .cv-ids { margin-top:0.95rem; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a {
    color: var(--cx-ink-2); text-decoration: underline; text-decoration-color: var(--cx-oxblood);
    text-decoration-thickness:1px; text-underline-offset:0.18em; }
  header.cv-header .cv-metrics { font-family: var(--cx-sans); color: var(--cx-muted); }
  .cv-summary { font-size:1.12rem; line-height:1.62; color: var(--cx-ink-2); margin-top:1.5rem; max-width:62ch; }
  /* Illuminated versal: a large oxblood initial on a gilt-tinted ground. */
  .cv-summary::first-letter {
    font-size:3.5em; line-height:0.76; float:left; margin:0.05em 0.12em -0.05em 0; padding:0.06em 0.12em;
    font-weight:600; color: var(--cx-oxblood-ink);
    background: linear-gradient(150deg, rgba(194,163,95,0.32), rgba(156,123,63,0.12));
    box-shadow: inset 0 0 0 1px rgba(156,123,63,0.5); }
  .cv-photo { width:120px; height:152px; border-radius:1px; object-fit:cover;
    border:5px solid #fffdf6; outline:1px solid var(--cx-gilt); outline-offset:-6px;
    box-shadow: 0 16px 32px -20px rgba(42,34,24,0.6); filter: grayscale(0.32) sepia(0.12) contrast(1.02); }

  /* ---- Sections: fleuron + oxblood small-caps + gilt-tipped rule ---- */
  section.cv-section { margin-top: 2.7rem; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; padding-left:1.7rem; padding-bottom:0.55rem;
    font-family: var(--cx-serif); font-size:0.98rem; font-weight:600; font-variant: small-caps;
    letter-spacing:0.1em; color: var(--cx-oxblood-ink); margin:0 0 1.05rem; }
  section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before {
    content:"❧"; position:absolute; left:0; top:-0.04em; font-variant:normal;
    color: var(--cx-gilt); font-size:1.02rem; }
  section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
    content:""; position:absolute; left:1.7rem; right:0; bottom:0; height:1px;
    background: linear-gradient(90deg, var(--cx-gilt) 0 2.2rem, var(--cx-rule-strong) 2.2rem); }

  /* ---- Entries ---- */
  ol.cv-bib > li { margin-bottom:1.05rem; line-height:1.6; font-size:1.04rem; color: var(--cx-ink-2); }
  ol.cv-bib > li a, .cv-prose-body a {
    color: var(--cx-ink); text-decoration: underline; text-decoration-color: var(--cx-oxblood);
    text-decoration-thickness:1px; text-underline-offset:0.16em; }
  .cv-self {
    color: var(--cx-oxblood-ink) !important; font-weight:600; font-variant: small-caps; letter-spacing:0.03em; }

  .cv-prose-body p { font-size:1.06rem; line-height:1.64; color: var(--cx-ink-2); }
  ul.cv-prose-list > li { line-height:1.6; color: var(--cx-ink-2); }
  .cv-provenance, .cv-license, .cv-living, .cv-attribution { font-family: var(--cx-sans); color: var(--cx-faint); }
  .cv-living { color: var(--cx-muted); }
  .cv-attribution a { color: var(--cx-ink-2); text-decoration: underline; text-decoration-color: var(--cx-oxblood); }

  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    .cv { opacity:1 !important; transform:none !important; }
  }
  @media print {
    body { background:#fff !important; }
    body::before, .cv::before, .cx-vine { display:none !important; }
    *,*::before,*::after { animation:none !important; }
    .cv { box-shadow:none !important; padding:0 !important; max-width:none !important; margin:0 !important; }
  }`;
}

export const codexTemplate: CvTemplate = {
  key: "codex",
  render(cv, sections, theme, opts) {
    const css = bundledFaceCss("EB Garamond") + commonCss(theme) + codexCss(theme);
    // A hand-drawn foliate vine for the illuminated margin (static).
    const vine =
      `<svg class="cx-vine" viewBox="0 0 48 160" fill="none" aria-hidden="true" focusable="false">` +
      `<path d="M24 2 C24 40 24 110 24 158" stroke="currentColor" stroke-width="1.1" opacity="0.55"></path>` +
      `<circle cx="24" cy="4" r="2.4" fill="currentColor"></circle>` +
      `<path d="M24 24 C13 27 8 35 10 46 C17 42 23 35 24 27 Z" fill="currentColor" opacity="0.6"></path>` +
      `<path d="M24 50 C35 53 40 61 38 72 C31 68 25 61 24 53 Z" fill="currentColor" opacity="0.6"></path>` +
      `<path d="M24 78 C13 81 8 89 10 100 C17 96 23 89 24 81 Z" fill="currentColor" opacity="0.6"></path>` +
      `<path d="M24 106 C35 109 40 117 38 128 C31 124 25 117 24 109 Z" fill="currentColor" opacity="0.6"></path>` +
      `<circle cx="24" cy="150" r="3" fill="none" stroke="currentColor" stroke-width="1.1" opacity="0.6"></circle>` +
      `</svg>`;
    const body =
      `<div class="cv">` +
      vine +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
