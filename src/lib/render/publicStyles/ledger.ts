/**
 * Public-page showcase style — "Ledger".
 *
 * A field-tuned credible style for ECONOMICS and quantitative social science,
 * rendered as a WORKING PAPER over ledger stock. Cool near-white with faint ruled
 * baselines, a red ledger margin-rule with line numbers, a faint regression
 * scatter behind the page, an institutional-navy accent, a ruled cover masthead
 * with an "Abstract", and numbered sections.
 *
 *   • REGRESSION FIELD — a faint scatter of points with an OLS line is plotted
 *     behind the page (decorative).
 *   • LEDGER MARGIN — a red account-book margin rule with periodic line numbers
 *     climbs the left gutter (hidden on narrow viewports / print).
 *   • COVER MASTHEAD — a navy-ruled header, a small-caps "Working Paper" eyebrow,
 *     and the summary labelled "Abstract".
 *   • NUMBERED SECTIONS — each heading is numbered (1. 2. 3.) in navy, with monospace
 *     tabular detail throughout.
 *   • CITED SELF-NAME — your own (identifier-matched, never name-string-matched)
 *     name is navy-bold under a dotted navy rule.
 *
 * Palette is a FIXED cool-grey/navy/ledger-red identity (NOT account-accent-
 * derived). Motion is RESTRAINED. Guardrails: ink ~15:1; navy text (#1f3a5f) ~8:1;
 * the regression/baseline washes are low-alpha and never sit under text strength.
 * `prefers-reduced-motion` stills motion; print drops the furniture. CSS-ONLY,
 * light page. Not a mascot style.
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

function ledgerCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    --cv-ink:#1a1d22; --cv-ink-2:#333842; --cv-muted:#565d68; --cv-faint:#69707b;
    --cv-rule: rgba(26,29,34,0.16); --cv-rule-strong: rgba(26,29,34,0.30); --cv-page:#fbfbfc;
    --lg-navy:#1f3a5f; --lg-navy-2:#33567f; --lg-grid: rgba(31,58,95,0.05); --lg-red: rgba(176,58,46,0.5);
    --lg-serif: ui-serif, "Iowan Old Style", "Palatino Linotype", Georgia, "Times New Roman", serif;
    --lg-sans: ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
    --lg-mono: ui-monospace, "SFMono-Regular", "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace;
  }
  body { min-height:100vh; color:var(--cv-ink); background:var(--cv-page); font-family: var(--lg-serif);
    background-image: linear-gradient(var(--lg-grid) 1px, transparent 1px); background-size: 100% 28px; }

  /* ---- Regression scatter + OLS line plotted behind the page ---- */
  .lg-plot { position:fixed; inset:0; width:100%; height:100%; z-index:0; pointer-events:none; opacity:0.5; }
  .lg-plot circle { fill: var(--lg-navy); opacity:0.16; }
  .lg-plot line { stroke: var(--lg-navy); stroke-width:1.4; opacity:0.22; stroke-dasharray:5 4; }

  /* ---- Ledger margin: a red rule + periodic line numbers ---- */
  .lg-margin { position:fixed; left: clamp(4px, 2.2vw, 38px); top:8vh; bottom:8vh; width:44px;
    z-index:0; pointer-events:none; }
  .lg-margin .lg-redline { stroke: var(--lg-red); stroke-width:1; }
  .lg-margin text { fill: var(--lg-navy-2); font:600 8px var(--lg-mono); opacity:0.55; }
  @media (max-width: 1140px) { .lg-margin { display:none; } }

  .cv { position:relative; z-index:1; max-width: 760px; margin:0 auto;
    padding: clamp(48px, 8vw, 92px) clamp(28px, 6vw, 64px) 132px; counter-reset: lg; }

  /* ---- Cover-style masthead ---- */
  header.cv-header { position:relative; margin-bottom: 2.6rem; padding: 1.3rem 0 1.5rem;
    border-top: 2px solid var(--lg-navy); border-bottom: 1px solid var(--cv-rule-strong); }
  header.cv-header::before {
    content:"Working Paper · Curriculum Vitæ"; display:block; font-family: var(--lg-sans);
    font-size:0.66rem; font-weight:600; letter-spacing:0.26em; text-transform:uppercase;
    color: var(--lg-navy); margin-bottom:0.95rem; }
  .cv-headmain { gap: 2rem; align-items: flex-start; }
  header.cv-header h1 {
    font-family: var(--lg-serif); font-size: clamp(2.3rem, 6.2vw, 3.6rem); font-weight:500;
    line-height:1.06; letter-spacing:-0.01em; color: var(--cv-ink); margin:0 0 0.5rem; }
  .cv-honorific { font-style: italic; font-weight:400; }
  header.cv-header .cv-headline {
    font-family: var(--lg-serif); font-style: italic; font-weight:400;
    font-size: clamp(1.04rem, 2.4vw, 1.3rem); color: var(--cv-ink-2); margin-top:0.2rem; }
  header.cv-header .cv-ids, header.cv-header .cv-contact, header.cv-header .cv-links {
    font-family: var(--lg-mono); font-size:0.78rem; letter-spacing:0; color: var(--cv-muted); }
  header.cv-header .cv-ids { margin-top:0.9rem; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a {
    color: var(--lg-navy); text-decoration: underline; text-decoration-color: var(--lg-navy-2);
    text-decoration-thickness:1px; text-underline-offset:0.16em; }
  header.cv-header .cv-metrics { font-family: var(--lg-mono); color: var(--cv-muted); }
  .cv-summary { position:relative; font-size:1.02rem; line-height:1.62; color: var(--cv-ink-2);
    margin-top:1.5rem; max-width:62ch; padding:0.9rem 1.1rem; border:1px solid var(--cv-rule);
    background: rgba(31,58,95,0.025); }
  .cv-summary::before {
    content:"Abstract"; display:block; font-family: var(--lg-sans); font-size:0.64rem; font-weight:600;
    letter-spacing:0.22em; text-transform:uppercase; color: var(--lg-navy); margin-bottom:0.5rem; }
  .cv-photo { width:118px; height:148px; border-radius:2px; object-fit:cover;
    border:1px solid var(--cv-rule-strong); box-shadow: 0 14px 30px -18px rgba(26,29,34,0.45);
    filter: grayscale(0.55) contrast(1.02); }

  /* ---- Numbered sections ---- */
  section.cv-section { margin-top: 2.7rem; counter-increment: lg; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; padding-left:2rem; padding-bottom:0.55rem;
    font-family: var(--lg-sans); font-size:0.82rem; font-weight:600; text-transform:uppercase;
    letter-spacing:0.16em; color: var(--lg-navy); margin:0 0 1.1rem; }
  section.cv-section > h2::before {
    content: counter(lg) "."; position:absolute; left:0; top:0; font-family: var(--lg-mono);
    font-size:0.82rem; font-weight:700; color: var(--lg-navy-2); }
  section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
    content:""; position:absolute; left:2rem; right:0; bottom:0; height:1px;
    background: var(--cv-rule-strong); transform-origin:0 50%; }
  .cv-summary-block > .cv-summary-h { padding-left:0; }
  .cv-summary-block > .cv-summary-h::after { left:0; }

  /* ---- Entries ---- */
  ol.cv-bib > li { margin-bottom:1rem; line-height:1.58; font-size:0.97rem; color: var(--cv-ink-2); }
  ol.cv-bib > li a, .cv-prose-body a {
    color: var(--lg-navy); text-decoration: underline; text-decoration-color: var(--lg-navy-2);
    text-decoration-thickness:1px; text-underline-offset:0.16em; }
  .cv-self {
    color: var(--lg-navy) !important; font-weight:600;
    border-bottom:1.5px dotted var(--lg-navy); padding-bottom:0.04em; }

  .cv-prose-body p { font-size:1.0rem; line-height:1.62; color: var(--cv-ink-2); }
  ul.cv-prose-list > li { line-height:1.58; color: var(--cv-ink-2); }
  .cv-provenance, .cv-license, .cv-living, .cv-attribution { font-family: var(--lg-sans); color: var(--cv-faint); }
  .cv-living { color: var(--cv-muted); }
  .cv-attribution a { color: var(--lg-navy); text-decoration: underline; text-decoration-color: var(--lg-navy-2); }

  /* ---- Restrained motion ---- */
  @keyframes lg-settle { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } }
  @keyframes lg-rule { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @supports (animation-timeline: view()) {
    section.cv-section > h2, .cv-summary-block > .cv-summary-h {
      animation: lg-settle cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 12%; }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
      animation: lg-rule cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 14%; }
    ol.cv-bib > li {
      animation: lg-settle cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% entry 46%; }
  }
  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    section.cv-section > h2, .cv-summary-block > .cv-summary-h,
    ol.cv-bib > li { opacity:1 !important; transform:none !important; }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after { transform:none !important; }
  }
  @media print {
    body { background-image:none !important; }
    .lg-plot, .lg-margin { display:none !important; }
    *,*::before,*::after { animation:none !important; }
    .cv { padding:0; max-width:none; }
  }`;
}

export const ledgerTemplate: CvTemplate = {
  key: "ledger",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + ledgerCss(theme);
    // Faint regression scatter + OLS line (deterministic points).
    const pts = [
      [60, 540],
      [120, 500],
      [180, 470],
      [240, 430],
      [300, 400],
      [360, 360],
      [420, 330],
      [150, 520],
      [270, 380],
      [330, 410],
      [210, 440],
      [390, 300],
    ];
    const plot =
      `<svg class="lg-plot" viewBox="0 0 480 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">` +
      `<line x1="40" y1="560" x2="450" y2="290"></line>` +
      pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.4"></circle>`).join("") +
      `</svg>`;
    const margin =
      `<svg class="lg-margin" viewBox="0 0 44 400" preserveAspectRatio="none" aria-hidden="true" focusable="false">` +
      `<line class="lg-redline" x1="34" y1="0" x2="34" y2="400"></line>` +
      Array.from({ length: 8 }, (_, i) => {
        const y = 24 + i * 50;
        return `<text x="28" y="${y}" text-anchor="end">${(i + 1) * 5}</text>`;
      }).join("") +
      `</svg>`;
    const body =
      plot +
      margin +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
