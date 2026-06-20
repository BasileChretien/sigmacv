/**
 * Public-page showcase style — "Atelier" (atmosphere redesign).
 *
 * A field-tuned credible style for the ARTS / design / architecture, rendered as a
 * gallery wall under even, still light. The mood lives in the ATMOSPHERE LAYER (a
 * cool plaster wall + a picture rail + a soft, STATIC overhead wash); the text
 * lives on a separate READING SURFACE — a clean "wall label" card that floats on
 * the wall — so nothing is ever behind a glyph.
 *
 *   • ATMOSPHERE — a cool plaster wall, a thin picture-rail line near the top, and
 *     an even overhead light (no panning, no flicker — a gallery is still).
 *   • READING SURFACE — a clean label card, centred, floating on a soft shadow + a
 *     precise hairline.
 *   • BRASS PLATE (the signature) — the eyebrow is an engraved brass nameplate; the
 *     portrait is museum-matted. The only warm note against cool plaster.
 *   • TYPE — Inter (bundled), the clean grotesque of gallery signage.
 *   • SELF-NAME — your own (identifier-matched, never name-string-matched) name in
 *     ink under a fine brass rule.
 *
 * One orchestrated load moment: the lights come up. CSS-ONLY; AA throughout (ink
 * ~15:1); reduced-motion stills everything; print = clean black-on-white, surround
 * dropped. Not a mascot style.
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

function atelierCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    --at-ink:#1c1b19; --at-ink-2:#3a3733; --at-muted:#5f5a52; --at-faint:#726c62;
    --at-page:#fbfbfa; --cv-page:#fbfbfa; --at-rule: rgba(28,27,25,0.14); --at-rule-strong: rgba(28,27,25,0.26);
    --at-brass1:#c9b27a; --at-brass2:#9c8246; --at-brass-ink:#4a3c18;
    --at-sans: "Inter", ui-sans-serif, system-ui, "Helvetica Neue", "Segoe UI", Arial, sans-serif;
    --at-serif: ui-serif, "Hoefler Text", Georgia, "Times New Roman", serif;
  }

  /* ---- Atmosphere: a cool plaster wall under even light, with a picture rail ---- */
  body { min-height:100vh; color:var(--at-ink); font-family: var(--at-sans);
    background:
      radial-gradient(70% 44% at 50% -2%, rgba(255,255,255,0.7), transparent 66%),
      radial-gradient(120% 90% at 50% 120%, #ded9cf 0%, #e6e2d9 55%, #ebe8e1 100%);
    background-attachment: fixed; }
  /* the picture rail: a thin molding line across the wall near the top */
  body::before { content:""; position:fixed; left:0; right:0; top: 10vh; height:0;
    border-top:1px solid rgba(28,27,25,0.12); box-shadow: 0 1px 0 rgba(255,255,255,0.6); z-index:0; pointer-events:none; }

  /* ---- Reading surface: a clean label card floating on the wall ---- */
  .cv { position:relative; z-index:1; max-width: 820px;
    margin: clamp(40px,9vw,120px) auto clamp(48px,8vw,96px);
    background: var(--at-page);
    padding: clamp(48px,7vw,88px) clamp(30px,6vw,72px) clamp(56px,8vw,96px);
    border-radius: 2px;
    box-shadow: 0 1px 0 rgba(255,255,255,0.8), 0 34px 70px -40px rgba(28,27,25,0.4), 0 0 0 1px rgba(28,27,25,0.08);
    animation: at-lights 1.1s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
  @keyframes at-lights { from { opacity:0; transform: translateY(10px); filter: brightness(1.5); } to { opacity:1; transform:none; filter:none; } }

  /* ---- Portfolio hero ---- */
  header.cv-header { position:relative; margin-bottom: 3.4rem; }
  /* The engraved brass nameplate (the signature). */
  header.cv-header::before {
    content:"Selected Work · Curriculum Vitæ"; display:inline-block; font-family: var(--at-sans);
    font-size:0.62rem; font-weight:600; letter-spacing:0.28em; text-transform:uppercase;
    color: var(--at-brass-ink); margin-bottom:1.5rem; padding:0.4em 0.9em; border-radius:2px;
    background: linear-gradient(180deg, var(--at-brass1), var(--at-brass2));
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.18), 0 1px 2px rgba(0,0,0,0.12);
    text-shadow: 0 1px 0 rgba(255,255,255,0.3); }
  .cv-headmain { gap: 2.6rem; align-items: flex-start; }
  header.cv-header h1 {
    font-family: var(--at-sans); font-size: clamp(2.8rem, 8vw, 4.8rem); font-weight:600;
    line-height:1.0; letter-spacing:-0.028em; color: var(--at-ink); margin:0 0 0.55rem; }
  .cv-honorific { font-weight:400; }
  header.cv-header .cv-headline {
    font-family: var(--at-serif); font-style: italic; font-weight:400;
    font-size: clamp(1.14rem, 2.6vw, 1.5rem); color: var(--at-ink-2); margin-top:0.35rem; }
  header.cv-header .cv-ids, header.cv-header .cv-contact, header.cv-header .cv-links {
    font-family: var(--at-sans); font-size:0.8rem; letter-spacing:0.02em; color: var(--at-muted); }
  header.cv-header .cv-ids { margin-top:1.05rem; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a {
    color: var(--at-ink-2); text-decoration: underline; text-decoration-color: var(--at-brass2);
    text-decoration-thickness:1px; text-underline-offset:0.2em; }
  header.cv-header .cv-metrics { font-family: var(--at-sans); color: var(--at-muted); }
  .cv-summary { font-family: var(--at-serif); font-size:1.12rem; line-height:1.66; color: var(--at-ink-2); margin-top:1.6rem; max-width:58ch; }
  .cv-photo { width:150px; height:188px; border-radius:1px; object-fit:cover;
    border:8px solid #ffffff; outline:1px solid var(--at-rule-strong); outline-offset:-9px;
    box-shadow: 0 24px 46px -28px rgba(28,27,25,0.5); }

  /* ---- Gallery-label sections ---- */
  section.cv-section { margin-top: 3.4rem; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; padding-top:0.95rem; margin:0 0 1.35rem;
    font-family: var(--at-sans); font-size:0.7rem; font-weight:600; text-transform:uppercase;
    letter-spacing:0.26em; color: var(--at-ink); }
  section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before {
    content:""; position:absolute; left:0; right:0; top:0; height:1px; background: var(--at-rule-strong); }

  /* ---- Entries as plate-numbered wall labels ---- */
  .cv-prose-body { font-family: var(--at-serif); }
  ol.cv-bib { counter-reset: plate; }
  ol.cv-bib > li { counter-increment: plate; position:relative; font-family: var(--at-serif);
    margin-bottom:1.1rem; padding:0.55rem 0.2rem 0.55rem 3.2rem; line-height:1.6; font-size:1.0rem;
    color: var(--at-ink-2); border-bottom:1px solid var(--at-rule); }
  ol.cv-bib > li::before { content:"Pl. " counter(plate, decimal-leading-zero); position:absolute;
    left:0; top:0.62rem; font-family: var(--at-sans); font-size:0.6rem; font-weight:600; letter-spacing:0.12em;
    color: var(--at-brass2); }
  ol.cv-bib > li a, .cv-prose-body a {
    color: var(--at-ink); text-decoration: underline; text-decoration-color: var(--at-brass2);
    text-decoration-thickness:1px; text-underline-offset:0.18em; }
  .cv-self {
    color: var(--at-ink) !important; font-weight:600;
    background-image: linear-gradient(var(--at-brass2), var(--at-brass2));
    background-size:100% 1.5px; background-position:0 100%; background-repeat:no-repeat; padding-bottom:0.04em; }

  ul.cv-prose-list > li { line-height:1.62; color: var(--at-ink-2); }
  .cv-provenance, .cv-license, .cv-living, .cv-attribution { font-family: var(--at-sans); color: var(--at-faint); }
  .cv-living { color: var(--at-muted); }
  .cv-attribution a { color: var(--at-ink-2); text-decoration: underline; text-decoration-color: var(--at-brass2); }

  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    .cv { opacity:1 !important; transform:none !important; filter:none !important; }
  }
  @media print {
    body { background:#fff !important; }
    body::before { display:none !important; }
    *,*::before,*::after { animation:none !important; }
    .cv { box-shadow:none !important; padding:0 !important; max-width:none !important; margin:0 !important; }
  }`;
}

export const atelierTemplate: CvTemplate = {
  key: "atelier",
  render(cv, sections, theme, opts) {
    const css = bundledFaceCss("Inter") + commonCss(theme) + atelierCss(theme);
    const body =
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
