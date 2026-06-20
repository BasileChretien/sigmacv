/**
 * Public-page showcase style — "Pharmacopoeia".
 *
 * An apothecary monograph / specimen sheet. Warm parchment under a layered
 * hexagonal benzene-ring lattice, with hand-drawn skeletal-molecule line-art in
 * the margins, a graduated-cylinder scale, a double-ruled apothecary label, an
 * aged vignette, and catalog-numbered monograph headings.
 *
 *   • MOLECULAR LATTICE — two faint sepia honeycomb layers of benzene rings wash
 *     the page; a skeletal drug molecule is drawn faintly in the lower margin.
 *   • GRADUATED SCALE — a measuring-cylinder tick-scale climbs the left gutter
 *     (hidden on narrow viewports / print).
 *   • APOTHECARY LABEL — a double-rule masthead with corner ticks, a small-caps
 *     Latin eyebrow, and a large faint benzene-ring (⌬) watermark.
 *   • CATALOG HEADINGS — each section is numbered (No. 01 ⬡) like a specimen entry.
 *   • HIGHLIGHTED SELF-NAME — your own (identifier-matched, never name-string-
 *     matched) name gets a translucent amber highlighter swipe.
 *
 * Palette is a FIXED parchment/sepia/amber identity (NOT account-accent-derived).
 * Motion is RESTRAINED. Guardrails: ink ~13:1 on parchment; sepia accent text
 * (#7a4f1d) ~5.2:1; the amber highlighter is a wash UNDER the ink; the lattice is
 * ~10% alpha. `prefers-reduced-motion` stills motion; print drops the decoration.
 * CSS-ONLY, light page. Not a mascot style.
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

function pharmacopoeiaCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    --cv-ink:#221c12; --cv-ink-2:#3f3526; --cv-muted:#5f5340; --cv-faint:#6f614c;
    --cv-rule: rgba(34,28,18,0.16); --cv-rule-strong: rgba(34,28,18,0.32); --cv-page:#f7f2e7;
    --ph-paper:#f7f2e7;
    --ph-accent:#7a4f1d; --ph-accent-2:#9c7333;
    --ph-mark: rgba(196,142,46,0.34); --ph-lattice: rgba(122,79,29,0.11); --ph-lattice-2: rgba(122,79,29,0.06);
    --ph-serif: ui-serif, "Iowan Old Style", "Palatino Linotype", Georgia, "Times New Roman", serif;
    --ph-sans: ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
    --ph-mono: ui-monospace, "SFMono-Regular", "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace;
  }
  body { min-height:100vh; color:var(--cv-ink); background:var(--cv-page); font-family: var(--ph-serif); }
  .ph-lattice { position:fixed; inset:0; width:100%; height:100%; z-index:0; pointer-events:none; }
  /* Aged vignette: corners gently darkened. */
  .ph-vignette { position:fixed; inset:0; z-index:0; pointer-events:none;
    box-shadow: inset 0 0 220px -90px rgba(60,42,16,0.5); }
  /* A reaction wavefront sweeps diagonally across the lattice (behind the text). */
  .ph-react { position:fixed; inset:0; z-index:0; pointer-events:none; mix-blend-mode: multiply;
    background: linear-gradient(120deg, transparent 30%, rgba(196,142,46,0.09) 48%, rgba(196,142,46,0.17) 50%, rgba(196,142,46,0.09) 52%, transparent 70%);
    background-size: 240% 240%; animation: ph-react 9s ease-in-out infinite; }
  @keyframes ph-react { 0% { background-position: 120% 120%; } 100% { background-position: -20% -20%; } }
  /* Effervescence: amber bubbles rising up the page. */
  .ph-bubbles { position:fixed; inset:0; z-index:0; pointer-events:none; opacity:0.6;
    background-image:
      radial-gradient(3px 3px at 18% 90%, rgba(196,142,46,0.5), transparent 60%),
      radial-gradient(2px 2px at 33% 96%, rgba(196,142,46,0.4), transparent 60%),
      radial-gradient(4px 4px at 72% 92%, rgba(196,142,46,0.45), transparent 60%),
      radial-gradient(2.5px 2.5px at 87% 95%, rgba(196,142,46,0.4), transparent 60%),
      radial-gradient(3px 3px at 55% 94%, rgba(196,142,46,0.42), transparent 60%);
    background-size: 100% 900px; animation: ph-bubbles 14s linear infinite; }
  @keyframes ph-bubbles { from { background-position: 0 0; } to { background-position: 0 -900px; } }
  /* A skeletal drug molecule, slowly rotating, in the lower margin. */
  .ph-molecule { position:fixed; left: clamp(8px, 3vw, 48px); bottom: 6vh; width:150px; height:120px;
    z-index:0; pointer-events:none; opacity:0.5; transform-origin: 50% 50%; animation: ph-spin 42s linear infinite; }
  @keyframes ph-spin { to { transform: rotate(360deg); } }
  .ph-molecule path, .ph-molecule line, .ph-molecule polygon { fill:none; stroke: var(--ph-accent); stroke-width:1.4; }
  .ph-molecule circle { fill: var(--ph-accent); }
  /* A graduated measuring-cylinder scale, with a rising/falling titration level. */
  .ph-scale { position:fixed; left: clamp(6px, 2.4vw, 36px); top:12vh; bottom:12vh; width:34px;
    z-index:0; pointer-events:none; }
  .ph-scale line { stroke: var(--ph-accent); stroke-width:1; opacity:0.45; }
  .ph-scale text { fill: var(--ph-accent); font:600 7px var(--ph-mono); opacity:0.6; }
  .ph-liquid { fill: rgba(196,142,46,0.22); transform-box: fill-box; transform-origin: 50% 100%;
    animation: ph-titrate 7.5s ease-in-out infinite; }
  @keyframes ph-titrate { 0%,100% { transform: scaleY(0.32); } 50% { transform: scaleY(0.82); } }
  @media (max-width: 1180px) { .ph-scale, .ph-molecule { display:none; } }

  .cv { position:relative; z-index:1; max-width: 760px; margin:0 auto;
    padding: clamp(48px, 8vw, 92px) clamp(28px, 6vw, 64px) 132px; counter-reset: ph; }

  /* ---- Apothecary-label masthead with corner ticks ---- */
  header.cv-header { position:relative; isolation:isolate; margin-bottom: 2.8rem;
    padding: 1.5rem 0.8rem 1.5rem; border-top: 3px double var(--ph-accent);
    border-bottom: 1px solid var(--cv-rule-strong); }
  header.cv-header > * { position:relative; z-index:1; }
  /* corner ticks (L-shaped) on the label. */
  header.cv-header::before {
    content:"Materia Academica · Curriculum Vitæ"; display:block; position:relative; z-index:1;
    font-family: var(--ph-sans); font-size:0.66rem; font-weight:600; letter-spacing:0.26em;
    text-transform:uppercase; color: var(--ph-accent); margin-bottom:1rem;
  }
  header.cv-header::after {
    content:"⌬"; position:absolute; top:-0.12em; left:-0.02em; z-index:0; pointer-events:none;
    font-family: var(--ph-serif); line-height:1; font-size: clamp(6rem, 16vw, 10rem);
    color: var(--ph-accent); opacity:0.08; transform-origin:center; animation: ph-ring-spin 50s linear infinite; }
  @keyframes ph-ring-spin { to { transform: rotate(360deg); } }
  .cv-headmain { gap: 2rem; align-items: flex-start; }
  header.cv-header h1 {
    font-family: var(--ph-serif); font-size: clamp(2.4rem, 6.6vw, 3.9rem); font-weight:500;
    line-height:1.04; letter-spacing:-0.012em; color: var(--cv-ink); margin:0 0 0.5rem; }
  .cv-honorific { font-style: italic; font-weight:400; }
  header.cv-header .cv-headline {
    font-family: var(--ph-serif); font-style: italic; font-weight:400;
    font-size: clamp(1.06rem, 2.5vw, 1.34rem); color: var(--cv-ink-2); margin-top:0.2rem; }
  header.cv-header .cv-ids, header.cv-header .cv-contact, header.cv-header .cv-links {
    font-family: var(--ph-mono); font-size:0.78rem; letter-spacing:0; color: var(--cv-muted); }
  header.cv-header .cv-ids { margin-top:0.95rem; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a {
    color: var(--ph-accent); text-decoration: underline; text-decoration-color: var(--ph-accent-2);
    text-decoration-thickness:1px; text-underline-offset:0.18em; }
  header.cv-header .cv-metrics { font-family: var(--ph-mono); color: var(--cv-muted); }
  .cv-summary { font-size:1.05rem; line-height:1.62; color: var(--cv-ink-2); margin-top:1.5rem; max-width:62ch; }
  .cv-photo { width:120px; height:150px; border-radius:2px; object-fit:cover;
    border:1px solid var(--cv-rule-strong); box-shadow: 0 1px 0 rgba(255,255,255,0.6), 0 14px 30px -18px rgba(34,28,18,0.45);
    filter: grayscale(0.35) sepia(0.18) contrast(1.02); }

  /* ---- Catalog-numbered monograph headings (No. 01 ⬡) ---- */
  section.cv-section { margin-top: 2.8rem; counter-increment: ph; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; padding-bottom:0.6rem;
    font-family: var(--ph-sans); font-size:0.8rem; font-weight:600; text-transform:uppercase;
    letter-spacing:0.2em; color: var(--ph-accent); margin:0 0 1.1rem; }
  section.cv-section > h2::before {
    content:"No. " counter(ph, decimal-leading-zero) "  ⬡   "; font-family: var(--ph-mono);
    font-weight:700; color: var(--ph-accent-2); letter-spacing:0.06em; }
  .cv-summary-block > .cv-summary-h::before {
    content:"⬡   "; color: var(--ph-accent-2); }
  section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
    content:""; position:absolute; left:0; right:0; bottom:0; height:1px;
    background: var(--cv-rule-strong); transform-origin:0 50%; }

  /* ---- Entries ---- */
  ol.cv-bib > li { margin-bottom:1rem; line-height:1.58; font-size:0.98rem; color: var(--cv-ink-2); }
  ol.cv-bib > li a, .cv-prose-body a {
    color: var(--cv-ink); text-decoration: underline; text-decoration-color: var(--ph-accent-2);
    text-decoration-thickness:1px; text-underline-offset:0.16em; }
  .cv-self {
    color: var(--cv-ink) !important; font-weight:600; padding:0 0.06em;
    background: linear-gradient(transparent 58%, var(--ph-mark) 58%);
    -webkit-box-decoration-break: clone; box-decoration-break: clone; }

  .cv-prose-body p { font-size:1.0rem; line-height:1.62; color: var(--cv-ink-2); }
  ul.cv-prose-list > li { line-height:1.58; color: var(--cv-ink-2); }
  .cv-provenance, .cv-license, .cv-living, .cv-attribution { font-family: var(--ph-sans); color: var(--cv-faint); }
  .cv-living { color: var(--cv-muted); }
  .cv-attribution a { color: var(--cv-ink-2); text-decoration: underline; text-decoration-color: var(--ph-accent-2); }

  /* ---- Restrained motion ---- */
  @keyframes ph-settle { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } }
  @keyframes ph-rule { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @supports (animation-timeline: view()) {
    section.cv-section > h2, .cv-summary-block > .cv-summary-h {
      animation: ph-settle cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 12%; }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
      animation: ph-rule cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 14%; }
    ol.cv-bib > li {
      animation: ph-settle cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% entry 46%; }
  }
  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    .ph-bubbles, .ph-react { display:none !important; }
    .ph-liquid { transform: scaleY(0.5) !important; }
    section.cv-section > h2, .cv-summary-block > .cv-summary-h,
    ol.cv-bib > li { opacity:1 !important; transform:none !important; }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after { transform:none !important; }
  }
  @media print {
    .ph-lattice, .ph-vignette, .ph-molecule, .ph-scale, .ph-bubbles, .ph-react { display:none !important; }
    header.cv-header::after { display:none !important; }
    *,*::before,*::after { animation:none !important; }
    .cv { padding:0; max-width:none; }
  }`;
}

export const pharmacopoeiaTemplate: CvTemplate = {
  key: "pharmacopoeia",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + pharmacopoeiaCss(theme);
    const lattice =
      `<svg class="ph-lattice" aria-hidden="true" focusable="false">` +
      `<defs>` +
      `<pattern id="ph-hex" width="58" height="50" patternUnits="userSpaceOnUse">` +
      `<path d="M48 25 L39 9.4 L21 9.4 L12 25 L21 40.6 L39 40.6 Z" fill="none" stroke="var(--ph-lattice)" stroke-width="1"></path>` +
      `</pattern>` +
      `<pattern id="ph-hex2" width="116" height="100" patternUnits="userSpaceOnUse" patternTransform="translate(29 25)">` +
      `<path d="M96 50 L78 18.8 L42 18.8 L24 50 L42 81.2 L78 81.2 Z" fill="none" stroke="var(--ph-lattice-2)" stroke-width="1.4"></path>` +
      `</pattern>` +
      `</defs>` +
      `<rect width="100%" height="100%" fill="url(#ph-hex)"></rect>` +
      `<rect width="100%" height="100%" fill="url(#ph-hex2)"></rect>` +
      `</svg>`;
    // A faint skeletal molecule (two fused benzene rings + side groups).
    const molecule =
      `<svg class="ph-molecule" viewBox="0 0 150 120" aria-hidden="true" focusable="false">` +
      `<polygon points="40,40 60,30 80,40 80,62 60,72 40,62"></polygon>` +
      `<polygon points="80,40 100,30 120,40 120,62 100,72 80,62"></polygon>` +
      `<line x1="44" y1="44" x2="44" y2="58"></line>` +
      `<line x1="84" y1="44" x2="84" y2="58"></line>` +
      `<line x1="40" y1="40" x2="22" y2="30"></line>` +
      `<line x1="60" y1="72" x2="60" y2="92"></line>` +
      `<line x1="120" y1="40" x2="138" y2="30"></line>` +
      `<circle cx="22" cy="30" r="2.4"></circle>` +
      `<circle cx="60" cy="92" r="2.4"></circle>` +
      `<circle cx="138" cy="30" r="2.4"></circle>` +
      `</svg>`;
    const scale =
      `<svg class="ph-scale" viewBox="0 0 34 400" preserveAspectRatio="none" aria-hidden="true" focusable="false">` +
      `<rect class="ph-liquid" x="6" y="20" width="16" height="360"></rect>` +
      `<line x1="6" y1="0" x2="6" y2="400"></line>` +
      Array.from({ length: 9 }, (_, i) => {
        const y = 20 + i * 45;
        const long = i % 2 === 0;
        return (
          `<line x1="6" y1="${y}" x2="${long ? 20 : 14}" y2="${y}"></line>` +
          (long ? `<text x="24" y="${y + 3}">${100 - i * 10}</text>` : "")
        );
      }).join("") +
      `</svg>`;
    const body =
      lattice +
      `<div class="ph-react" aria-hidden="true"></div>` +
      `<div class="ph-bubbles" aria-hidden="true"></div>` +
      `<div class="ph-vignette" aria-hidden="true"></div>` +
      molecule +
      scale +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
