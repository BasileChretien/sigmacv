/**
 * Public-page showcase style — "Posology".
 *
 * The credible flagship, built from the owner's own iconography: a pharmacology
 * dose–response (Hill/Emax) SIGMOID — which is also the logistic curve, the shape
 * of a Σ, and a quiet metaphor for a career (threshold → growth → plateau). It
 * collapses pharmacology + the Sigma-Score + DORA-shaped restraint into one mark.
 *
 *   • DOSE–RESPONSE SPINE — a thin teal sigmoid pinned to the left gutter that
 *     DRAWS ITSELF IN on load (a time-based stroke-dashoffset draw, so it is seen
 *     on first paint in every browser), with a faint lower-asymptote axis and an
 *     EC₅₀ tick at the inflection. Decorative + aria-hidden; hides on narrow
 *     viewports / print.
 *   • CLINICAL SQUARED PAPER — an extremely faint teal graph-paper wash gives the
 *     page a "typeset on lab stock" feel without any image.
 *   • Σ WATERMARK — a large, ~6%-opacity sigma sits behind the masthead.
 *   • SECTION NODES — each heading carries a small teal data-point disc in the
 *     left margin, like annotated points on the curve.
 *   • VERMILION SEAL — the account holder's own name (identifier-matched, never
 *     name-string-matched) is stamped in a deep-cinnabar hanko box (a single
 *     Franco-Japanese accent), wrap-safe via `box-decoration-break: clone`.
 *
 * Palette is a FIXED apothecary-teal identity (NOT account-accent-derived) — the
 * clinical look IS the identity, like Neon's pink/cyan. Motion is RESTRAINED:
 * headings + entries SETTLE in on scroll (small fade + rise), nothing flickers,
 * and no metric is enlarged or coloured for emphasis (the curve is the only hero
 * — DORA-safe by construction). Guardrails: heading/link teal is the AA-floored
 * #0f6e56 (≈6:1 on the page); the vermilion self-name uses the deep #9e2b1e ink
 * (≈5.5:1); `prefers-reduced-motion` freezes the curve fully-drawn and stills all
 * motion; print drops the spine/grid/watermark. CSS-ONLY, light page — reads
 * credibly to a hiring committee. This is NOT a mascot style (a hopping cartoon
 * would undercut the document); the seal is the character.
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

function posologyCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    /* Cool clinical off-white paper + deep ink. ink ~14:1, muted ~6.4:1,
       faint ~5:1 on the page — all AA. */
    --cv-ink:#1b211f; --cv-ink-2:#36423c; --cv-muted:#545f57; --cv-faint:#67726a;
    --cv-rule: rgba(15,110,86,0.16); --cv-rule-strong: rgba(15,110,86,0.34); --cv-page:#fbfdfb;
    --poso-page:#fbfdfb;
    /* Apothecary teal — fixed identity. accent is DECORATIVE only (curve, dots,
       hairlines); accent-ink is the AA-floored text colour for headings/links. */
    --poso-accent:#1d9e75; --poso-accent-ink:#0f6e56;
    --poso-rule: rgba(15,110,86,0.30);
    --poso-grid: rgba(15,110,86,0.055);
    /* Vermilion hanko seal — a deep cinnabar for AA text, a brighter vermilion
       for the stamp box. */
    --poso-seal:#b7352b; --poso-seal-ink:#9e2b1e; --poso-seal-fill: rgba(183,53,43,0.08);
    --poso-serif: ui-serif, Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif;
    --poso-sans: ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
    --poso-mono: ui-monospace, "SFMono-Regular", "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace;
  }
  body {
    min-height:100vh; color:var(--cv-ink); background:var(--cv-page);
    font-family: var(--poso-serif);
    /* Faint clinical squared paper — 26px grid, ~5% teal, never competes with text. */
    background-image:
      linear-gradient(var(--poso-grid) 1px, transparent 1px),
      linear-gradient(90deg, var(--poso-grid) 1px, transparent 1px);
    background-size: 26px 26px;
  }
  .cv { position:relative; z-index:1; max-width: 760px; margin:0 auto;
    padding: clamp(48px, 8vw, 96px) clamp(28px, 6vw, 64px) 132px; }

  /* ---- Dose–response SPINE: a sigmoid that draws in on scroll ---- */
  .poso-spine { position:fixed; left: clamp(6px, 3vw, 44px); top:50%; transform: translateY(-50%);
    width:132px; height: min(440px, 72vh); z-index:0; pointer-events:none; }
  .poso-axis { fill:none; stroke: var(--poso-rule); stroke-width:1; stroke-dasharray:1.5 5; opacity:0.65; }
  .poso-tick { stroke: var(--poso-accent); stroke-width:1.2; opacity:0.55; }
  .poso-node { fill: var(--poso-page); stroke: var(--poso-accent); stroke-width:2; }
  .poso-ec { fill: var(--poso-accent-ink); font:600 11px var(--poso-mono); letter-spacing:0.03em; }
  /* The curve DRAWS ITSELF IN on load (time-based, so it's seen on first paint in
     every browser); base = fully drawn for the reduced-motion / no-animation case. */
  .poso-curve { fill:none; stroke: var(--poso-accent); stroke-width:2.4; stroke-linecap:round;
    stroke-dasharray:1; stroke-dashoffset:0;
    animation: poso-draw 1.5s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
  @keyframes poso-draw { from { stroke-dashoffset:1; } to { stroke-dashoffset:0; } }

  /* ---- Masthead ---- */
  header.cv-header { position:relative; isolation:isolate; margin-bottom: 2.6rem;
    padding-bottom: 1.8rem; border-bottom: 1px solid var(--cv-rule-strong); }
  header.cv-header > * { position:relative; z-index:1; }
  /* Journal-style eyebrow above the name (utility sans). */
  header.cv-header::before {
    content:"Curriculum Vitæ"; display:block; position:relative; z-index:1;
    font-family: var(--poso-sans); font-size:0.66rem; font-weight:600;
    letter-spacing:0.34em; text-transform:uppercase; color: var(--poso-accent-ink);
    margin-bottom:1.05rem;
  }
  /* Large Σ monogram watermark behind the name (left-anchored so the portrait can
     never occlude it; faint enough never to hurt the name's legibility). */
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
  /* Clinical portrait: quiet border + faint cool duotone. */
  .cv-photo { width:120px; height:150px; border-radius:2px; object-fit:cover;
    border:1px solid var(--cv-rule-strong);
    box-shadow: 0 1px 0 rgba(255,255,255,0.6), 0 14px 30px -18px rgba(15,110,86,0.45);
    filter: grayscale(0.5) contrast(1.02); }

  /* ---- Sections: heading + left-margin data-point node ---- */
  section.cv-section { margin-top: 2.8rem; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; padding-left:1.7rem; padding-bottom:0.6rem;
    font-family: var(--poso-sans); font-size:0.8rem; font-weight:600; text-transform:uppercase;
    letter-spacing:0.2em; color: var(--poso-accent-ink); margin:0 0 1.1rem;
  }
  /* The data-point disc, sitting on an implied left axis. */
  section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before {
    content:""; position:absolute; left:0; top:0.18em; width:10px; height:10px; border-radius:50%;
    background: var(--poso-page); border:2px solid var(--poso-accent);
  }
  /* Thin hairline under the heading (drawn in), clear of the node. */
  section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
    content:""; position:absolute; left:1.7rem; right:0; bottom:0; height:1px;
    background: var(--cv-rule-strong); transform-origin:0 50%;
  }

  /* ---- Entries ---- */
  ol.cv-bib > li { margin-bottom:1rem; line-height:1.55; font-size:0.98rem; color: var(--cv-ink-2); }
  ol.cv-bib > li a, .cv-prose-body a {
    color: var(--cv-ink); text-decoration: underline; text-decoration-color: var(--poso-accent);
    text-decoration-thickness:1px; text-underline-offset:0.16em;
  }

  /* ---- The owner's own name: a vermilion hanko SEAL (wrap-safe) ---- */
  .cv-self {
    color: var(--poso-seal-ink) !important; font-weight:600; font-variant: small-caps;
    letter-spacing:0.02em; border:1.5px solid var(--poso-seal); border-radius:3px;
    padding:0.02em 0.3em; background: var(--poso-seal-fill);
    -webkit-box-decoration-break: clone; box-decoration-break: clone;
  }

  .cv-prose-body p { font-size:1.0rem; line-height:1.62; color: var(--cv-ink-2); }
  ul.cv-prose-list > li { line-height:1.55; color: var(--cv-ink-2); }

  /* Footnote-grade footers (utility sans), kept AA. */
  .cv-provenance, .cv-license, .cv-living, .cv-attribution { font-family: var(--poso-sans); color: var(--cv-faint); }
  .cv-living { color: var(--cv-muted); }
  .cv-attribution a { color: var(--cv-ink-2); text-decoration: underline; text-decoration-color: var(--poso-accent); }

  /* ---- Restrained motion: settle-in fade + small rise; hairline draws in ---- */
  @keyframes poso-settle { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } }
  @keyframes poso-rule { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  /* Per-heading / per-entry reveals only (small geometry) — never the whole tall
     section (the scroll-reveal trap). */
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

  /* Narrow viewports: the gutter can't hold the spine — drop it, reflow full width. */
  @media (max-width: 1080px) { .poso-spine { display:none; } }

  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    .poso-curve { stroke-dashoffset:0 !important; }
    section.cv-section > h2, .cv-summary-block > .cv-summary-h,
    ol.cv-bib > li { opacity:1 !important; transform:none !important; }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after { transform:none !important; }
  }
  @media print {
    .poso-spine { display:none !important; }
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
    const spine =
      `<svg class="poso-spine" viewBox="0 0 132 440" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false">` +
      `<path class="poso-axis" d="M30 26 V414"></path>` +
      `<line class="poso-tick" x1="54" y1="220" x2="78" y2="220"></line>` +
      `<path class="poso-curve" pathLength="1" d="M30 26 C30 150 36 188 66 220 C96 252 102 290 102 414"></path>` +
      `<circle class="poso-node" cx="66" cy="220" r="4"></circle>` +
      `<text class="poso-ec" x="50" y="224" text-anchor="end">EC₅₀</text>` +
      `</svg>`;
    const body =
      spine +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
