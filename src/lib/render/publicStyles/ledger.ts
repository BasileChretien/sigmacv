/**
 * Public-page showcase style — "Ledger" (atmosphere redesign).
 *
 * A field-tuned credible style for ECONOMICS / quantitative social science,
 * rendered as a working paper in a quiet institute. The mood lives in the
 * ATMOSPHERE LAYER (a cool blue-grey "blueprint" field); the text lives on a
 * separate READING SURFACE — a crisp white page that floats above it — so nothing
 * is ever behind a glyph.
 *
 *   • ATMOSPHERE — a cool blue-grey field; a faint engineering grid lives only in
 *     the surround, never under the page. Sober: no looping motion.
 *   • READING SURFACE — a crisp white page, centred, floating on a soft shadow.
 *   • BLUEPRINT MARGIN (the signature) — the page carries a single ledger-red
 *     margin rule with periodic line numbers, like a working draft.
 *   • TYPE — Source Serif 4 (bundled) for the prose, a system mono for the data,
 *     numbered headings and identifiers.
 *   • STRUCTURE — numbered sections + an "Abstract"-set summary (true to the form).
 *   • SELF-NAME — your own (identifier-matched, never name-string-matched) name in
 *     navy under a fine dotted rule.
 *
 * One orchestrated load moment: the page settles. CSS-ONLY; AA throughout (ink
 * ~15:1, navy #1f3a5f ~8:1); reduced-motion stills everything; print = clean
 * black-on-white. Not a mascot style.
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

function ledgerCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    --lg-ink:#1a1f27; --lg-ink-2:#343b45; --lg-muted:#565d68; --lg-faint:#69707b;
    --lg-page:#ffffff; --cv-page:#ffffff; --lg-rule: rgba(26,31,39,0.14); --lg-rule-strong: rgba(26,31,39,0.28);
    --lg-navy:#1f3a5f; --lg-navy-2:#33567f; --lg-red: rgba(168,57,46,0.55);
    --lg-serif: "Source Serif 4", ui-serif, "Iowan Old Style", Georgia, "Times New Roman", serif;
    --lg-sans: ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
    --lg-mono: ui-monospace, "SFMono-Regular", "JetBrains Mono", "Cascadia Code", Menlo, Consolas, monospace;
  }

  /* ---- Atmosphere: a cool institute, blueprint grid in the surround only ---- */
  body { min-height:100vh; color:var(--lg-ink); font-family: var(--lg-serif);
    background:
      linear-gradient(rgba(31,58,95,0.05) 1px, transparent 1px) 0 0 / 100% 30px,
      linear-gradient(90deg, rgba(31,58,95,0.05) 1px, transparent 1px) 0 0 / 30px 100%,
      radial-gradient(130% 80% at 50% -10%, #eef2f6 0%, #e2e8ef 50%, #d3dce6 100%);
    background-attachment: fixed; }

  /* ---- Reading surface: a crisp white page floating above ---- */
  .cv { position:relative; z-index:1; max-width: 760px;
    margin: clamp(22px,5vw,60px) auto clamp(40px,7vw,84px);
    background: var(--lg-page);
    padding: clamp(46px,7vw,80px) clamp(28px,6vw,60px) clamp(52px,8vw,90px) clamp(54px,8vw,92px);
    border-radius: 2px;
    box-shadow: 0 26px 60px -42px rgba(20,40,70,0.55), 0 0 0 1px rgba(26,31,39,0.1);
    animation: lg-on 0.9s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
  @keyframes lg-on { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } }

  /* ---- Blueprint margin (the signature): a ledger-red rule + line numbers ---- */
  .cv::before { content:""; position:absolute; left: clamp(28px,4.5vw,48px);
    top: clamp(30px,5vw,54px); bottom: clamp(30px,5vw,54px); width:1px; background: var(--lg-red); }
  .lg-lines { position:absolute; left: clamp(8px,2vw,22px); top: clamp(30px,5vw,54px);
    z-index:2; display:flex; flex-direction:column; gap: 1.6rem; pointer-events:none;
    font-family: var(--lg-mono); font-size:0.56rem; font-weight:600; color: var(--lg-navy-2); opacity:0.55; }
  @media (max-width: 720px) { .cv { padding-left: clamp(28px,6vw,40px); } .cv::before, .lg-lines { display:none; } }

  /* ---- Cover masthead ---- */
  header.cv-header { position:relative; margin-bottom: 2.5rem; padding: 1rem 0 1.5rem;
    border-top: 2px solid var(--lg-navy); border-bottom: 1px solid var(--lg-rule-strong); }
  header.cv-header::before {
    content:"Working Paper · Curriculum Vitæ"; display:block; font-family: var(--lg-sans);
    font-size:0.64rem; font-weight:600; letter-spacing:0.24em; text-transform:uppercase;
    color: var(--lg-navy); margin-bottom:0.9rem; }
  .cv-headmain { gap: 2rem; align-items: flex-start; }
  header.cv-header h1 {
    font-family: var(--lg-serif); font-size: clamp(2.3rem, 6.2vw, 3.6rem); font-weight:500;
    line-height:1.04; letter-spacing:0; color: var(--lg-ink); margin:0 0 0.45rem; }
  .cv-honorific { font-style: italic; font-weight:400; }
  header.cv-header .cv-headline {
    font-family: var(--lg-serif); font-style: italic; font-weight:400;
    font-size: clamp(1.04rem, 2.4vw, 1.32rem); color: var(--lg-ink-2); margin-top:0.2rem; }
  header.cv-header .cv-ids, header.cv-header .cv-contact, header.cv-header .cv-links {
    font-family: var(--lg-mono); font-size:0.76rem; letter-spacing:0; color: var(--lg-muted); }
  header.cv-header .cv-ids { margin-top:0.9rem; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a {
    color: var(--lg-navy); text-decoration: underline; text-decoration-color: var(--lg-navy-2);
    text-decoration-thickness:1px; text-underline-offset:0.16em; }
  header.cv-header .cv-metrics { font-family: var(--lg-mono); color: var(--lg-muted); }
  .cv-summary { position:relative; font-size:1.02rem; line-height:1.62; color: var(--lg-ink-2);
    margin-top:1.5rem; max-width:62ch; padding:0.9rem 1.1rem; border:1px solid var(--lg-rule); background: rgba(31,58,95,0.025); }
  .cv-summary::before {
    content:"Abstract"; display:block; font-family: var(--lg-sans); font-size:0.62rem; font-weight:600;
    letter-spacing:0.22em; text-transform:uppercase; color: var(--lg-navy); margin-bottom:0.5rem; }
  .cv-photo { width:118px; height:148px; border-radius:2px; object-fit:cover;
    border:1px solid var(--lg-rule-strong); box-shadow: 0 16px 32px -20px rgba(20,40,70,0.5);
    filter: grayscale(0.5) contrast(1.02); }

  /* ---- Numbered sections (true to the form) ---- */
  section.cv-section { margin-top: 2.5rem; counter-increment: lg; }
  .cv { counter-reset: lg; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; padding-left:2rem; padding-bottom:0.5rem;
    font-family: var(--lg-sans); font-size:0.8rem; font-weight:600; text-transform:uppercase;
    letter-spacing:0.15em; color: var(--lg-navy); margin:0 0 1.05rem; }
  section.cv-section > h2::before {
    content: counter(lg) "."; position:absolute; left:0; top:0; font-family: var(--lg-mono);
    font-size:0.8rem; font-weight:700; color: var(--lg-navy-2); }
  section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
    content:""; position:absolute; left:2rem; right:0; bottom:0; height:1px; background: var(--lg-rule-strong); }
  .cv-summary-block > .cv-summary-h { padding-left:0; }
  .cv-summary-block > .cv-summary-h::after { left:0; }

  /* ---- Entries ---- */
  ol.cv-bib > li { margin-bottom:1rem; line-height:1.58; font-size:0.98rem; color: var(--lg-ink-2); }
  ol.cv-bib > li a, .cv-prose-body a {
    color: var(--lg-navy); text-decoration: underline; text-decoration-color: var(--lg-navy-2);
    text-decoration-thickness:1px; text-underline-offset:0.16em; }
  .cv-self {
    color: var(--lg-navy) !important; font-weight:600;
    border-bottom:1.5px dotted var(--lg-navy); padding-bottom:0.04em; }

  .cv-prose-body p { font-size:1.0rem; line-height:1.62; color: var(--lg-ink-2); }
  ul.cv-prose-list > li { line-height:1.58; color: var(--lg-ink-2); }
  .cv-provenance, .cv-license, .cv-living, .cv-attribution { font-family: var(--lg-sans); color: var(--lg-faint); }
  .cv-living { color: var(--lg-muted); }
  .cv-attribution a { color: var(--lg-navy); text-decoration: underline; text-decoration-color: var(--lg-navy-2); }

  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    .cv { opacity:1 !important; transform:none !important; }
  }
  @media print {
    body { background:#fff !important; }
    .cv::before, .lg-lines { display:none !important; }
    *,*::before,*::after { animation:none !important; }
    .cv { box-shadow:none !important; padding:0 !important; max-width:none !important; margin:0 !important; }
  }`;
}

export const ledgerTemplate: CvTemplate = {
  key: "ledger",
  render(cv, sections, theme, opts) {
    const css = bundledFaceCss("Source Serif 4") + commonCss(theme) + ledgerCss(theme);
    const lines =
      `<div class="lg-lines" aria-hidden="true">` +
      Array.from({ length: 9 }, (_, i) => `<span>${(i + 1) * 5}</span>`).join("") +
      `</div>`;
    const body =
      `<div class="cv">` +
      lines +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
