/**
 * Public-page showcase style — "Posology".
 *
 * The credible flagship, built from the owner's own iconography and rendered as a
 * live PHARMACODYNAMICS INSTRUMENT. The page sits over a faint field of plotted
 * dose-response curves; a labelled sigmoid (Hill/Emax — also the logistic curve
 * and the shape of a Σ) runs down the left as an instrument axis, and a glowing
 * teal cursor TRACES the curve like an oscilloscope readout.
 *
 *   • CURVE FIELD — a faint, slowly breathing field of dose-response sigmoids
 *     washes the page (decorative, aria-hidden).
 *   • INSTRUMENT SPINE — a teal sigmoid pinned to the left gutter with a baseline
 *     axis, log-dose ticks, dashed Emax/baseline asymptotes, an EC₅₀ inflection
 *     node, and a cursor dot that traces the curve (offset-path) on a loop. The
 *     curve also strokes itself in on load.
 *   • CLINICAL SQUARED PAPER + Σ MONOGRAM — graph-paper wash under a large Σ
 *     watermark behind the name.
 *   • SECTION ASSAYS — each heading carries a teal data-point node and a tiny
 *     concentration tick-scale.
 *   • VERMILION SEAL — the account holder's own (identifier-matched, never
 *     name-string-matched) name is stamped in a deep-cinnabar hanko box.
 *
 * Palette is a FIXED apothecary-teal identity (NOT account-accent-derived). The
 * reading column sits above every animated layer (z-index) so body copy never
 * moves or loses contrast. Guardrails: heading/link teal is the AA-floored
 * #0f6e56 (~6:1); the vermilion self-name uses the deep #9e2b1e (~5.5:1);
 * `prefers-reduced-motion` freezes the curve drawn + parks the cursor + stills the
 * field; print drops every instrument layer. CSS-ONLY, light page, no mascot
 * (the seal is the character).
 */
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

/** The instrument sigmoid, shared by the drawn curve AND the tracing cursor. */
const POSO_CURVE = "M40 54 C40 196 46 250 80 272 C114 294 120 352 120 452";

function posologyCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    --cv-ink:#1b211f; --cv-ink-2:#36423c; --cv-muted:#545f57; --cv-faint:#67726a;
    --cv-rule: rgba(15,110,86,0.16); --cv-rule-strong: rgba(15,110,86,0.34); --cv-page:#fbfdfb;
    --poso-page:#fbfdfb;
    /* Apothecary teal — accent is DECORATIVE; accent-ink is the AA text colour. */
    --poso-accent:#1d9e75; --poso-accent-ink:#0f6e56;
    --poso-rule: rgba(15,110,86,0.30);
    --poso-grid: rgba(15,110,86,0.055);
    --poso-seal:#b7352b; --poso-seal-ink:#9e2b1e; --poso-seal-fill: rgba(183,53,43,0.08);
    --poso-serif: ui-serif, Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif;
    --poso-sans: ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
    --poso-mono: ui-monospace, "SFMono-Regular", "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace;
  }
  body {
    min-height:100vh; color:var(--cv-ink); background:var(--cv-page); font-family: var(--poso-serif);
    background-image:
      linear-gradient(var(--poso-grid) 1px, transparent 1px),
      linear-gradient(90deg, var(--poso-grid) 1px, transparent 1px);
    background-size: 26px 26px;
  }
  .cv { position:relative; z-index:3; max-width: 760px; margin:0 auto;
    padding: clamp(48px, 8vw, 96px) clamp(28px, 6vw, 64px) 132px; }

  /* ---- Background field of dose-response curves (breathing) ---- */
  .poso-field { position:fixed; inset:0; width:100%; height:100%; z-index:0; pointer-events:none;
    opacity:0.5; animation: poso-breathe 11s ease-in-out infinite; }
  .poso-field path { fill:none; stroke: var(--poso-accent); stroke-width:1.1; opacity:0.16; }
  @keyframes poso-breathe { 0%,100% { opacity:0.36; } 50% { opacity:0.6; } }

  /* ---- Instrument spine ---- */
  .poso-spine { position:fixed; left: clamp(2px, 2.5vw, 40px); top:50%; transform: translateY(-50%);
    width:160px; height: min(500px, 78vh); z-index:1; pointer-events:none; }
  .poso-axis { fill:none; stroke: var(--poso-rule); stroke-width:1; }
  .poso-asym { fill:none; stroke: var(--poso-accent); stroke-width:1; stroke-dasharray:2 4; opacity:0.5; }
  .poso-xtick { stroke: var(--poso-rule); stroke-width:1; }
  .poso-tick { stroke: var(--poso-accent); stroke-width:1.2; opacity:0.6; }
  .poso-node { fill: var(--poso-page); stroke: var(--poso-accent); stroke-width:2; }
  .poso-lab { fill: var(--poso-accent-ink); font:600 10px var(--poso-mono); letter-spacing:0.02em; }
  .poso-lab-mut { fill: #6b7a72; font:600 9px var(--poso-mono); opacity:0.85; }
  /* The curve: base = fully drawn (no-animation fallback); strokes in on load. */
  .poso-curve { fill:none; stroke: var(--poso-accent); stroke-width:2.4; stroke-linecap:round;
    stroke-dasharray:1; stroke-dashoffset:0; filter: drop-shadow(0 0 2px rgba(29,158,117,0.5));
    animation: poso-draw 1.6s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
  @keyframes poso-draw { from { stroke-dashoffset:1; } to { stroke-dashoffset:0; } }
  /* The oscilloscope cursor: traces the curve on a loop (offset-path). */
  .poso-cursor { offset-path: path("${POSO_CURVE}"); offset-rotate:0deg; offset-distance:0%;
    filter: drop-shadow(0 0 4px rgba(29,158,117,0.9));
    animation: poso-trace 5.2s cubic-bezier(0.45,0,0.55,1) 1.6s infinite; }
  @keyframes poso-trace {
    0% { offset-distance:0%; opacity:0; } 8% { opacity:1; }
    90% { opacity:1; } 100% { offset-distance:100%; opacity:0; }
  }

  /* ---- Masthead ---- */
  header.cv-header { position:relative; isolation:isolate; margin-bottom: 2.6rem;
    padding-bottom: 1.8rem; border-bottom: 1px solid var(--cv-rule-strong); }
  header.cv-header > * { position:relative; z-index:1; }
  header.cv-header::before {
    content:"Curriculum Vitæ · pharmacodynamics"; display:block; position:relative; z-index:1;
    font-family: var(--poso-mono); font-size:0.64rem; font-weight:600;
    letter-spacing:0.22em; text-transform:uppercase; color: var(--poso-accent-ink); margin-bottom:1.05rem;
  }
  header.cv-header::after {
    content:"Σ"; position:absolute; top:-0.3em; left:-0.06em; right:auto; z-index:0; pointer-events:none;
    font-family: var(--poso-serif); font-weight:600; line-height:1;
    font-size: clamp(6.5rem, 18vw, 11rem); color: var(--poso-accent); opacity:0.06;
  }
  .cv-headmain { gap: 2rem; align-items: flex-start; }
  header.cv-header h1 {
    font-family: var(--poso-serif); font-size: clamp(2.4rem, 6.6vw, 3.9rem); font-weight:500;
    line-height:1.04; letter-spacing:-0.016em; color: var(--cv-ink); margin:0 0 0.5rem;
    font-variant-ligatures: common-ligatures contextual;
  }
  .cv-honorific { font-style: italic; font-weight:400; }
  header.cv-header .cv-headline {
    font-family: var(--poso-serif); font-style: italic; font-weight:400;
    font-size: clamp(1.08rem, 2.5vw, 1.36rem); color: var(--cv-ink-2); margin-top:0.2rem;
  }
  header.cv-header .cv-ids, header.cv-header .cv-contact, header.cv-header .cv-links {
    font-family: var(--poso-mono); font-size:0.78rem; letter-spacing:0; color: var(--cv-muted);
  }
  header.cv-header .cv-ids { margin-top:0.95rem; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a {
    color: var(--poso-accent-ink); text-decoration: underline;
    text-decoration-color: var(--poso-accent); text-decoration-thickness:1px; text-underline-offset:0.18em;
  }
  header.cv-header .cv-metrics { font-family: var(--poso-sans); color: var(--cv-muted); }
  .cv-summary { font-size:1.05rem; line-height:1.62; color: var(--cv-ink-2); margin-top:1.5rem; max-width:62ch; }
  .cv-summary::first-letter {
    font-size:3.0em; line-height:0.82; float:left; margin:0.04em 0.09em -0.02em 0;
    font-weight:500; color: var(--poso-accent-ink);
  }
  .cv-photo { width:120px; height:150px; border-radius:2px; object-fit:cover;
    border:1px solid var(--cv-rule-strong);
    box-shadow: 0 1px 0 rgba(255,255,255,0.6), 0 14px 30px -18px rgba(15,110,86,0.45);
    filter: grayscale(0.5) contrast(1.02); }

  /* ---- Sections: data-point node + concentration tick-scale ---- */
  section.cv-section { margin-top: 2.8rem; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; padding-left:1.9rem; padding-bottom:0.6rem;
    font-family: var(--poso-sans); font-size:0.8rem; font-weight:600; text-transform:uppercase;
    letter-spacing:0.2em; color: var(--poso-accent-ink); margin:0 0 1.1rem;
  }
  section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before {
    content:""; position:absolute; left:0; top:0.18em; width:10px; height:10px; border-radius:50%;
    background: var(--poso-page); border:2px solid var(--poso-accent);
    box-shadow: 0 0 0 4px rgba(29,158,117,0.1);
  }
  /* A tiny concentration tick-scale rides under the heading rule. */
  section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
    content:""; position:absolute; left:1.9rem; right:0; bottom:0; height:1px;
    background:
      linear-gradient(90deg, var(--poso-accent) 0 1.4rem, transparent 1.4rem) 0 100%/100% 1px no-repeat,
      repeating-linear-gradient(90deg, var(--cv-rule-strong) 0 1px, transparent 1px 18px);
    transform-origin:0 50%;
  }

  /* ---- Entries ---- */
  ol.cv-bib > li { margin-bottom:1rem; line-height:1.55; font-size:0.98rem; color: var(--cv-ink-2);
    position:relative; transition: transform .16s ease; }
  ol.cv-bib > li:hover { transform: translateX(2px); }
  ol.cv-bib > li a, .cv-prose-body a {
    color: var(--cv-ink); text-decoration: underline; text-decoration-color: var(--poso-accent);
    text-decoration-thickness:1px; text-underline-offset:0.16em;
  }
  .cv-self {
    color: var(--poso-seal-ink) !important; font-weight:600; font-variant: small-caps;
    letter-spacing:0.02em; border:1.5px solid var(--poso-seal); border-radius:3px;
    padding:0.02em 0.3em; background: var(--poso-seal-fill);
    -webkit-box-decoration-break: clone; box-decoration-break: clone;
  }

  .cv-prose-body p { font-size:1.0rem; line-height:1.62; color: var(--cv-ink-2); }
  ul.cv-prose-list > li { line-height:1.55; color: var(--cv-ink-2); }
  .cv-provenance, .cv-license, .cv-living, .cv-attribution { font-family: var(--poso-sans); color: var(--cv-faint); }
  .cv-living { color: var(--cv-muted); }
  .cv-attribution a { color: var(--cv-ink-2); text-decoration: underline; text-decoration-color: var(--poso-accent); }

  /* ---- Restrained reveal motion ---- */
  @keyframes poso-settle { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } }
  @keyframes poso-rule { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @supports (animation-timeline: view()) {
    section.cv-section > h2, .cv-summary-block > .cv-summary-h {
      animation: poso-settle cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 12%;
    }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
      animation: poso-rule cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 14%;
    }
    ol.cv-bib > li {
      animation: poso-settle cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% entry 46%;
    }
  }
  @media (max-width: 1100px) { .poso-spine { display:none; } }
  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    .poso-curve { stroke-dashoffset:0 !important; }
    .poso-cursor, .poso-field { display:none !important; }
    section.cv-section > h2, .cv-summary-block > .cv-summary-h,
    ol.cv-bib > li { opacity:1 !important; transform:none !important; }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after { transform:none !important; }
  }
  @media print {
    .poso-spine, .poso-field { display:none !important; }
    header.cv-header::after { display:none !important; }
    body { background-image:none !important; }
    *,*::before,*::after { animation:none !important; }
    .cv { padding:0; max-width:none; }
  }`;
}

export const posologyTemplate: CvTemplate = {
  key: "posology",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + posologyCss(theme);
    const field =
      `<svg class="poso-field" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">` +
      `<path d="M-20 470 C90 470 120 360 200 300 C280 240 300 120 420 120"></path>` +
      `<path d="M-20 540 C120 540 150 430 240 380 C330 330 350 220 420 210"></path>` +
      `<path d="M-20 360 C70 360 96 250 170 190 C250 126 280 70 420 56"></path>` +
      `</svg>`;
    const spine =
      `<svg class="poso-spine" viewBox="0 0 160 500" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">` +
      `<path class="poso-axis" d="M34 44 V470 H140"></path>` +
      `<path class="poso-asym" d="M34 54 H132"></path>` +
      `<path class="poso-asym" d="M34 452 H132"></path>` +
      `<line class="poso-xtick" x1="58" y1="470" x2="58" y2="476"></line>` +
      `<line class="poso-xtick" x1="80" y1="470" x2="80" y2="476"></line>` +
      `<line class="poso-xtick" x1="102" y1="470" x2="102" y2="476"></line>` +
      `<line class="poso-xtick" x1="124" y1="470" x2="124" y2="476"></line>` +
      `<line class="poso-tick" x1="66" y1="272" x2="94" y2="272"></line>` +
      `<path class="poso-curve" pathLength="1" d="${POSO_CURVE}"></path>` +
      `<circle class="poso-node" cx="80" cy="272" r="3.8"></circle>` +
      `<circle class="poso-cursor" r="3.4" fill="#1d9e75"></circle>` +
      `<text class="poso-lab" x="40" y="46">Emax</text>` +
      `<text class="poso-lab" x="64" y="266" text-anchor="end">EC₅₀</text>` +
      `<text class="poso-lab-mut" x="40" y="466">0</text>` +
      `<text class="poso-lab-mut" x="138" y="488" text-anchor="end">log[dose]</text>` +
      `</svg>`;
    const body =
      field +
      spine +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
