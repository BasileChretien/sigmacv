/**
 * Public-page showcase style — "Pharmacopoeia" (atmosphere redesign).
 *
 * A field-tuned credible style for the APOTHECARY / materia medica, rendered by
 * lamplight. The mood lives in the ATMOSPHERE LAYER (aged parchment under a warm
 * amber lamp-glow); the text lives on a separate READING SURFACE — a clean
 * parchment page that floats above it — so nothing is ever behind a glyph.
 *
 *   • ATMOSPHERE — aged parchment with an amber lamp-glow from above, edges falling
 *     into shadow; the lamp breathes very slowly, confined to the surround.
 *   • READING SURFACE — a clean parchment page, centred, floating on a soft shadow.
 *   • SPECIMEN MARGIN (the signature) — a fine botanical engraving + a graduated
 *     apothecary rule run down the page's left margin.
 *   • TYPE — Fraunces (bundled), a characterful old-style serif; verdigris-green
 *     headings (NOT terracotta); amber is light only.
 *   • SELF-NAME — your own (identifier-matched, never name-string-matched) name in
 *     ink under a fine verdigris rule.
 *
 * One orchestrated load moment: the lamp comes up + the page settles. CSS-ONLY; AA
 * throughout (ink ~13:1, verdigris #35543f ~6:1); reduced-motion stills
 * everything; print = clean black-on-white. Not a mascot style.
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

function pharmacopoeiaCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    --ph-ink:#2a2113; --ph-ink-2:#473a26; --ph-muted:#665740; --ph-faint:#776648;
    --ph-page:#f7f0df; --cv-page:#f7f0df; --ph-rule: rgba(42,33,19,0.16); --ph-rule-strong: rgba(42,33,19,0.3);
    --ph-verdigris:#35543f; --ph-verdigris-2:#4d7359; --ph-amber:#c8922e;
    --ph-serif: "Fraunces", ui-serif, "Iowan Old Style", Georgia, "Times New Roman", serif;
    --ph-sans: ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
    --ph-mono: ui-monospace, "SFMono-Regular", "JetBrains Mono", Menlo, Consolas, monospace;
  }

  /* ---- Atmosphere: an apothecary by lamplight ---- */
  body { min-height:100vh; color:var(--ph-ink); font-family: var(--ph-serif);
    background:
      radial-gradient(85% 60% at 50% -8%, #f3e9cf 0%, #e9dcba 42%, transparent 78%),
      radial-gradient(120% 90% at 50% 120%, #c9b585 0%, #ddcaa0 60%, #ead9b4 100%);
    background-attachment: fixed; }
  body::before { content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
    background: radial-gradient(50% 40% at 50% 2%, rgba(255,224,150,0.45), transparent 70%);
    animation: ph-lamp 10s ease-in-out infinite; }
  @keyframes ph-lamp { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
  /* a soft amber vignette falling into the corners */
  body::after { content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
    box-shadow: inset 0 0 240px -80px rgba(70,45,10,0.45); }

  /* ---- Reading surface: a clean parchment page floating above ---- */
  .cv { position:relative; z-index:1; max-width: 760px;
    margin: clamp(22px,5vw,60px) auto clamp(40px,7vw,84px);
    background: var(--ph-page);
    padding: clamp(46px,7vw,82px) clamp(28px,6vw,60px) clamp(52px,8vw,90px) clamp(58px,9vw,102px);
    border-radius: 2px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 30px 70px -42px rgba(60,40,8,0.66), 0 0 0 1px rgba(42,33,19,0.14);
    animation: ph-on 0.95s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
  @keyframes ph-on { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } }

  /* ---- Specimen margin (the signature): a botanical engraving + a graduated rule ---- */
  .ph-spec { position:absolute; left: clamp(10px,2.6vw,28px); top: clamp(30px,5vw,54px);
    width:56px; height:260px; z-index:2; pointer-events:none; }
  .ph-spec .ph-stem, .ph-spec .ph-leaf { fill:none; stroke: var(--ph-verdigris); stroke-width:1.3; stroke-linecap:round; }
  .ph-spec .ph-leaf { fill: rgba(53,84,63,0.12); }
  .ph-spec .ph-grad { stroke: var(--ph-amber); stroke-width:1; opacity:0.6; }
  .ph-spec text { fill: var(--ph-amber); font:600 6px var(--ph-mono); opacity:0.7; }
  @media (max-width: 720px) { .cv { padding-left: clamp(28px,6vw,40px); } .ph-spec { display:none; } }

  /* ---- Masthead ---- */
  header.cv-header { position:relative; margin-bottom: 2.6rem; padding: 0 0 1.6rem;
    border-bottom: 2px solid var(--ph-verdigris); }
  header.cv-header::before {
    content:"Materia Academica · Curriculum Vitæ"; display:block; font-family: var(--ph-sans);
    font-size:0.64rem; font-weight:600; letter-spacing:0.24em; text-transform:uppercase;
    color: var(--ph-verdigris); margin-bottom:1rem; }
  .cv-headmain { gap: 2rem; align-items: flex-start; }
  header.cv-header h1 {
    font-family: var(--ph-serif); font-size: clamp(2.4rem, 6.6vw, 3.9rem); font-weight:500;
    line-height:1.02; letter-spacing:0; color: var(--ph-ink); margin:0 0 0.45rem; }
  .cv-honorific { font-style: italic; font-weight:400; }
  header.cv-header .cv-headline {
    font-family: var(--ph-serif); font-style: italic; font-weight:400;
    font-size: clamp(1.08rem, 2.5vw, 1.4rem); color: var(--ph-ink-2); margin-top:0.2rem; }
  header.cv-header .cv-ids, header.cv-header .cv-contact, header.cv-header .cv-links {
    font-family: var(--ph-mono); font-size:0.76rem; letter-spacing:0; color: var(--ph-muted); }
  header.cv-header .cv-ids { margin-top:0.95rem; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a {
    color: var(--ph-verdigris); text-decoration: underline; text-decoration-color: var(--ph-verdigris-2);
    text-decoration-thickness:1px; text-underline-offset:0.18em; }
  header.cv-header .cv-metrics { font-family: var(--ph-mono); color: var(--ph-muted); }
  .cv-summary { font-size:1.08rem; line-height:1.62; color: var(--ph-ink-2); margin-top:1.5rem; max-width:62ch; }
  .cv-photo { width:120px; height:150px; border-radius:2px; object-fit:cover;
    border:1px solid var(--ph-rule-strong); box-shadow: 0 16px 32px -20px rgba(42,33,19,0.5);
    filter: grayscale(0.3) sepia(0.2) contrast(1.02); }

  /* ---- Sections ---- */
  section.cv-section { margin-top: 2.6rem; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; padding-left:1.5rem; padding-bottom:0.55rem;
    font-family: var(--ph-serif); font-size:0.96rem; font-weight:600; font-variant: small-caps;
    letter-spacing:0.08em; color: var(--ph-verdigris); margin:0 0 1.05rem; }
  section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before {
    content:"❦"; position:absolute; left:0; top:-0.06em; font-variant:normal; color: var(--ph-verdigris-2); font-size:0.92rem; }
  section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
    content:""; position:absolute; left:1.5rem; right:0; bottom:0; height:1px; background: var(--ph-rule-strong); }

  /* ---- Entries ---- */
  ol.cv-bib > li { margin-bottom:1rem; line-height:1.58; font-size:1.0rem; color: var(--ph-ink-2); }
  ol.cv-bib > li a, .cv-prose-body a {
    color: var(--ph-ink); text-decoration: underline; text-decoration-color: var(--ph-verdigris-2);
    text-decoration-thickness:1px; text-underline-offset:0.16em; }
  .cv-self {
    color: var(--ph-ink) !important; font-weight:600; padding-bottom:0.04em;
    background-image: linear-gradient(var(--ph-verdigris), var(--ph-verdigris));
    background-size:100% 1.5px; background-position:0 100%; background-repeat:no-repeat; }

  .cv-prose-body p { font-size:1.04rem; line-height:1.62; color: var(--ph-ink-2); }
  ul.cv-prose-list > li { line-height:1.58; color: var(--ph-ink-2); }
  .cv-provenance, .cv-license, .cv-living, .cv-attribution { font-family: var(--ph-sans); color: var(--ph-faint); }
  .cv-living { color: var(--ph-muted); }
  .cv-attribution a { color: var(--ph-ink-2); text-decoration: underline; text-decoration-color: var(--ph-verdigris-2); }

  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    .cv { opacity:1 !important; transform:none !important; }
  }
  @media print {
    body { background:#fff !important; }
    body::before, body::after, .ph-spec { display:none !important; }
    *,*::before,*::after { animation:none !important; }
    .cv { box-shadow:none !important; padding:0 !important; max-width:none !important; margin:0 !important; }
  }`;
}

export const pharmacopoeiaTemplate: CvTemplate = {
  key: "pharmacopoeia",
  render(cv, sections, theme, opts) {
    const css = bundledFaceCss("Fraunces") + commonCss(theme) + pharmacopoeiaCss(theme);
    // A botanical specimen (sprig) beside a graduated apothecary rule.
    const spec =
      `<svg class="ph-spec" viewBox="0 0 56 260" aria-hidden="true" focusable="false">` +
      `<path class="ph-stem" d="M30 6 C30 60 30 150 30 240"></path>` +
      `<path class="ph-leaf" d="M30 36 C18 30 10 36 9 48 C20 50 28 46 30 40 Z"></path>` +
      `<path class="ph-leaf" d="M30 70 C42 64 50 70 51 82 C40 84 32 80 30 74 Z"></path>` +
      `<path class="ph-leaf" d="M30 104 C18 98 10 104 9 116 C20 118 28 114 30 108 Z"></path>` +
      `<path class="ph-leaf" d="M30 138 C42 132 50 138 51 150 C40 152 32 148 30 142 Z"></path>` +
      `<circle class="ph-stem" cx="30" cy="6" r="3"></circle>` +
      `<line class="ph-grad" x1="46" y1="170" x2="46" y2="248"></line>` +
      Array.from({ length: 5 }, (_, i) => {
        const y = 176 + i * 18;
        return `<line class="ph-grad" x1="46" y1="${y}" x2="${i % 2 === 0 ? 38 : 42}" y2="${y}"></line>`;
      }).join("") +
      `</svg>`;
    const body =
      `<div class="cv">` +
      spec +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
