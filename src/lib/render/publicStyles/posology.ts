/**
 * Public-page showcase style — "Posology" (atmosphere redesign).
 *
 * A field-tuned credible style for MEDICINE / PHARMACOLOGY, rendered as a precise
 * instrument at rest. The mood lives in the ATMOSPHERE LAYER (a cool clinical-teal
 * field with light pooling at the top); the text lives on a separate READING
 * SURFACE — a pale "readout" page that floats above it — so nothing textured or
 * moving is ever behind a glyph.
 *
 *   • ATMOSPHERE — a cool teal field, light pooling at the top like a powered
 *     instrument; a single, very slow light breathe, confined to the surround.
 *   • READING SURFACE — a pale readout page, centred, floating on a soft shadow +
 *     a fine teal keyline.
 *   • ENGRAVED CURVE (the signature) — a single dose–response sigmoid is engraved
 *     down the page's left margin, with quiet EC₅₀ / Emax / baseline ticks.
 *   • TYPE — Space Grotesk (bundled), an instrument grotesque, paired with a system
 *     mono for identifiers + axis labels.
 *   • SELF-NAME — your own (identifier-matched, never name-string-matched) name in
 *     teal with a fine underline.
 *
 * One orchestrated load moment: the page powers up. CSS-ONLY; AA throughout (ink
 * ~13:1 on the page, teal #0f7a5a ~5.2:1); `prefers-reduced-motion` stills
 * everything; print = clean black-on-white, surround dropped. Not a mascot style.
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

function posologyCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    --po-ink:#16201d; --po-ink-2:#33433d; --po-muted:#566159; --po-faint:#67726a;
    --po-page:#f7fbf9; --cv-page:#f7fbf9; --po-rule: rgba(15,110,86,0.16); --po-rule-strong: rgba(15,110,86,0.3);
    --po-teal:#0f7a5a; --po-teal-2:#1d9e75;
    --po-sans: "Space Grotesk", ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
    --po-mono: ui-monospace, "SFMono-Regular", "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace;
  }

  /* ---- Atmosphere: a cool, powered instrument room ---- */
  body { min-height:100vh; color:var(--po-ink); font-family: var(--po-sans);
    background: radial-gradient(135% 82% at 50% -12%, #eef6f2 0%, #dcebe5 48%, #c6dad2 100%);
    background-attachment: fixed; }
  body::before { content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
    background: radial-gradient(56% 42% at 50% 4%, rgba(220,245,236,0.7), transparent 70%);
    animation: po-power 9s ease-in-out infinite; }
  @keyframes po-power { 0%,100% { opacity:0.6; } 50% { opacity:1; } }

  /* ---- Reading surface: a pale readout page floating above ---- */
  .cv { position:relative; z-index:1; max-width: 760px;
    margin: clamp(22px,5vw,60px) auto clamp(40px,7vw,84px);
    background: var(--po-page);
    padding: clamp(46px,7vw,80px) clamp(28px,6vw,60px) clamp(52px,8vw,90px) clamp(56px,9vw,100px);
    border-radius: 3px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.7), 0 28px 64px -42px rgba(15,60,46,0.6), 0 0 0 1px rgba(15,110,86,0.16);
    animation: po-on 0.95s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
  @keyframes po-on { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } }

  /* ---- Engraved dose-response curve in the left margin (the signature) ---- */
  .po-curve { position:absolute; left: clamp(12px,3vw,30px); top: clamp(30px,5vw,54px);
    width:50px; height:220px; z-index:2; pointer-events:none; }
  .po-curve path { fill:none; stroke: var(--po-teal-2); stroke-width:1.4; stroke-linecap:round; }
  .po-curve .po-ax { stroke: var(--po-rule-strong); stroke-width:1; }
  .po-curve .po-as { stroke: var(--po-teal-2); stroke-width:1; stroke-dasharray:2 3; opacity:0.5; }
  .po-curve circle { fill: var(--po-page); stroke: var(--po-teal-2); stroke-width:1.6; }
  .po-curve text { fill: var(--po-teal); font:600 7px var(--po-mono); }
  @media (max-width: 720px) { .cv { padding-left: clamp(28px,6vw,40px); } .po-curve { display:none; } }

  /* ---- Masthead ---- */
  header.cv-header { position:relative; margin-bottom: 2.4rem; padding-bottom: 1.7rem;
    border-bottom: 1px solid var(--po-rule-strong); }
  header.cv-header::before {
    content:"Curriculum Vitæ · pharmacodynamics"; display:block; font-family: var(--po-mono);
    font-size:0.62rem; font-weight:600; letter-spacing:0.2em; text-transform:uppercase;
    color: var(--po-teal); margin-bottom:1rem; }
  .cv-headmain { gap: 2rem; align-items: flex-start; }
  header.cv-header h1 {
    font-family: var(--po-sans); font-size: clamp(2.3rem, 6.2vw, 3.6rem); font-weight:600;
    line-height:1.02; letter-spacing:-0.02em; color: var(--po-ink); margin:0 0 0.45rem; }
  header.cv-header .cv-headline {
    font-family: var(--po-sans); font-weight:400; font-size: clamp(1.04rem, 2.4vw, 1.3rem);
    color: var(--po-ink-2); margin-top:0.2rem; }
  header.cv-header .cv-ids, header.cv-header .cv-contact, header.cv-header .cv-links {
    font-family: var(--po-mono); font-size:0.76rem; letter-spacing:0; color: var(--po-muted); }
  header.cv-header .cv-ids { margin-top:0.9rem; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a {
    color: var(--po-teal); text-decoration: underline; text-decoration-color: var(--po-teal-2);
    text-decoration-thickness:1px; text-underline-offset:0.18em; }
  header.cv-header .cv-metrics { font-family: var(--po-mono); color: var(--po-muted); }
  .cv-summary { font-size:1.04rem; line-height:1.62; color: var(--po-ink-2); margin-top:1.4rem; max-width:62ch; }

  .cv-photo { width:120px; height:150px; border-radius:2px; object-fit:cover;
    border:1px solid var(--po-rule-strong); box-shadow: 0 14px 30px -20px rgba(15,60,46,0.5);
    filter: grayscale(0.45) contrast(1.02); }

  /* ---- Sections ---- */
  section.cv-section { margin-top: 2.5rem; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; padding-left:1.5rem; padding-bottom:0.55rem;
    font-family: var(--po-sans); font-size:0.78rem; font-weight:600; text-transform:uppercase;
    letter-spacing:0.18em; color: var(--po-teal); margin:0 0 1.05rem; }
  section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before {
    content:""; position:absolute; left:0; top:0.2em; width:9px; height:9px; border-radius:50%;
    background: var(--po-page); border:2px solid var(--po-teal-2); }
  section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
    content:""; position:absolute; left:1.5rem; right:0; bottom:0; height:1px; background: var(--po-rule-strong); }

  /* ---- Entries ---- */
  ol.cv-bib > li { margin-bottom:1rem; line-height:1.56; font-size:0.98rem; color: var(--po-ink-2); }
  ol.cv-bib > li a, .cv-prose-body a {
    color: var(--po-ink); text-decoration: underline; text-decoration-color: var(--po-teal-2);
    text-decoration-thickness:1px; text-underline-offset:0.16em; }
  .cv-self {
    color: var(--po-teal) !important; font-weight:600;
    background-image: linear-gradient(var(--po-teal-2), var(--po-teal-2));
    background-size:100% 1.5px; background-position:0 100%; background-repeat:no-repeat; padding-bottom:0.04em; }

  .cv-prose-body p { font-size:1.0rem; line-height:1.62; color: var(--po-ink-2); }
  ul.cv-prose-list > li { line-height:1.56; color: var(--po-ink-2); }
  .cv-provenance, .cv-license, .cv-living, .cv-attribution { font-family: var(--po-mono); font-size:0.72rem; color: var(--po-faint); }
  .cv-living { color: var(--po-muted); }
  .cv-attribution a { color: var(--po-ink-2); text-decoration: underline; text-decoration-color: var(--po-teal-2); }

  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    .cv { opacity:1 !important; transform:none !important; }
  }
  @media print {
    body { background:#fff !important; }
    body::before, .po-curve { display:none !important; }
    *,*::before,*::after { animation:none !important; }
    .cv { box-shadow:none !important; padding:0 !important; max-width:none !important; margin:0 !important; }
  }`;
}

export const posologyTemplate: CvTemplate = {
  key: "posology",
  render(cv, sections, theme, opts) {
    const css = bundledFaceCss("Space Grotesk") + commonCss(theme) + posologyCss(theme);
    const curve =
      `<svg class="po-curve" viewBox="0 0 50 220" aria-hidden="true" focusable="false">` +
      `<path class="po-ax" d="M14 8 V206 H44"></path>` +
      `<path class="po-as" d="M14 18 H42"></path>` +
      `<path class="po-as" d="M14 196 H42"></path>` +
      `<path d="M16 18 C16 90 18 116 26 124 C34 132 38 168 38 196"></path>` +
      `<circle cx="26" cy="124" r="2.6"></circle>` +
      `<text x="16" y="14">Emax</text>` +
      `<text x="30" y="120">EC₅₀</text>` +
      `<text x="16" y="214">log[dose]</text>` +
      `</svg>`;
    const body =
      `<div class="cv">` +
      curve +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
