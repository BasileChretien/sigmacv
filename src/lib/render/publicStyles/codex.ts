/**
 * Public-page showcase style — "Codex".
 *
 * A field-tuned credible style for the HUMANITIES, rendered as a FINE-PRESS
 * ILLUMINATED BOOK. Warm ivory stock with faint manuscript ruling, a hardback
 * book-spine with raised bands and a gilt title panel in the left gutter, an
 * illuminated versal opening initial, printer's-flower ornaments, and an oxblood-
 * and-gilt accent. Foregrounds prose and the bibliography, never a number.
 *
 *   • RAISED-BAND SPINE — a hardback oxblood spine with raised horizontal bands, a
 *     gilt keyline and a gilt title panel runs down the far-left gutter (hidden on
 *     narrow viewports / print).
 *   • RULED MARGIN — a faint manuscript ruling washes the page; a gilt margin rule
 *     edges the text block.
 *   • ILLUMINATED VERSAL — the summary opens with a large oxblood initial set on a
 *     gilt-tinted ground.
 *   • PRINTER'S FLOWERS — a centred fleuron ornament closes the masthead; each
 *     section is marked by a fleuron (❧) in oxblood over a gilt-tipped rule.
 *   • PRINTED SELF-NAME — your own (identifier-matched, never name-string-matched)
 *     name is set in oxblood small-caps.
 *
 * Palette is a FIXED ivory/ink/oxblood/gilt identity (NOT account-accent-derived).
 * Motion is RESTRAINED. Guardrails: ink ~13:1 on ivory; oxblood text (#6e2530)
 * ~7:1; the bright spine oxblood/gilt is fill/decoration. `prefers-reduced-motion`
 * stills motion; print drops the spine. CSS-ONLY, light page. Not a mascot style.
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

function codexCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    --cv-ink:#2a2420; --cv-ink-2:#473f37; --cv-muted:#675d52; --cv-faint:#776b5e;
    --cv-rule: rgba(42,36,32,0.16); --cv-rule-strong: rgba(42,36,32,0.32); --cv-page:#f6f1e6;
    --cx-spine:#7a2b35; --cx-spine-ink:#6e2530; --cx-spine-dk:#5a1f28;
    --cx-gold:#9c7b3f; --cx-gold-lt:#caa765;
    --cx-serif: ui-serif, "Iowan Old Style", "Hoefler Text", "Palatino Linotype", Georgia, "Times New Roman", serif;
    --cx-sans: ui-sans-serif, system-ui, "Optima", "Segoe UI", Helvetica, Arial, sans-serif;
  }
  body { min-height:100vh; color:var(--cv-ink); background:var(--cv-page); font-family: var(--cx-serif);
    background-image: repeating-linear-gradient(0deg, rgba(42,36,32,0.028) 0 1px, transparent 1px 30px); }

  /* ---- Hardback book-spine with raised bands + gilt title panel ---- */
  .cx-spine { position:fixed; left:0; top:0; bottom:0; width: clamp(16px, 3vw, 34px); z-index:0; pointer-events:none;
    background:
      repeating-linear-gradient(180deg, transparent 0 70px, rgba(0,0,0,0.16) 70px 78px, transparent 78px 86px),
      linear-gradient(90deg, var(--cx-spine-dk), var(--cx-spine) 40%, var(--cx-spine-dk));
    box-shadow: inset -2px 0 0 rgba(0,0,0,0.22), inset 2px 0 0 rgba(255,255,255,0.06); }
  .cx-spine::before { content:""; position:absolute; top:0; bottom:0; right:4px; width:1px; background: var(--cx-gold); opacity:0.7; }
  /* gilt title panel near the top of the spine. */
  .cx-spine::after { content:""; position:absolute; left:50%; transform:translateX(-50%); top:18%; width:60%; height:120px;
    border:1px solid var(--cx-gold-lt); border-radius:1px; box-shadow: inset 0 0 0 2px rgba(156,123,63,0.25); opacity:0.85; }

  /* A gold glint travels down the spine — light catching the gilt. */
  .cx-glint { position:fixed; left:0; top:0; width: clamp(16px, 3vw, 34px); height:100vh; z-index:0; pointer-events:none; overflow:hidden; }
  .cx-glint::before { content:""; position:absolute; left:0; right:0; height:64px;
    background: linear-gradient(180deg, transparent, rgba(234,210,150,0.85), transparent); filter: blur(2px);
    animation: cx-glint 4.6s ease-in-out infinite; }
  @keyframes cx-glint {
    0% { transform: translateY(-90px); opacity:0; } 18% { opacity:0.9; }
    50% { opacity:0.65; } 82% { opacity:0.9; } 100% { transform: translateY(100vh); opacity:0; } }

  /* Candlelight: a warm wash that flickers over the page. */
  .cx-candle { position:fixed; inset:0; z-index:0; pointer-events:none; mix-blend-mode: multiply;
    background: radial-gradient(72% 56% at 50% 24%, rgba(255,244,214,0) 42%, rgba(120,90,40,0.07) 100%);
    animation: cx-flicker 5.5s ease-in-out infinite; }
  @keyframes cx-flicker { 0%,100% { opacity:0.72; } 22% { opacity:0.92; } 38% { opacity:0.6; } 56% { opacity:0.86; } 74% { opacity:0.7; } }
  @media (max-width: 900px) { .cx-spine, .cx-glint { display:none; } }

  /* The page opens (hinges from the spine) on load. */
  .cv { position:relative; z-index:1; max-width: 720px; margin:0 auto;
    padding: clamp(52px, 9vw, 104px) clamp(28px, 6vw, 72px) 140px;
    border-left: 1px solid rgba(156,123,63,0.28); transform-origin: left center;
    animation: cx-open 1.1s cubic-bezier(0.22,1,0.36,1) 0.1s both; }
  @keyframes cx-open {
    from { opacity:0; transform: perspective(1600px) rotateY(-7deg) translateX(-12px); }
    to { opacity:1; transform: none; } }

  /* ---- Frontispiece masthead ---- */
  header.cv-header { position:relative; margin-bottom: 2.8rem; padding-bottom: 2.4rem;
    border-bottom: 1px solid var(--cv-rule-strong); }
  header.cv-header::before {
    content:"Curriculum Vitæ"; display:block; font-family: var(--cx-sans);
    font-size:0.66rem; font-weight:600; letter-spacing:0.34em; text-transform:uppercase;
    color: var(--cx-spine-ink); margin-bottom:1.1rem; }
  /* A centred printer's-flower ornament closes the masthead; it blooms with gilt. */
  header.cv-header::after {
    content:"❦"; position:absolute; left:50%; bottom:0.55rem; transform:translateX(-50%);
    font-size:1.1rem; color: var(--cx-gold); animation: cx-bloom 6s ease-in-out infinite; }
  @keyframes cx-bloom {
    0%,100% { color: var(--cx-gold); transform: translateX(-50%) scale(1); text-shadow:none; }
    50% { color: var(--cx-gold-lt); transform: translateX(-50%) scale(1.14); text-shadow: 0 0 7px rgba(202,167,101,0.6); } }
  .cv-headmain { gap: 2rem; align-items: flex-start; }
  header.cv-header h1 {
    font-family: var(--cx-serif); font-size: clamp(2.5rem, 7vw, 4rem); font-weight:500;
    line-height:1.04; letter-spacing:-0.012em; color: var(--cv-ink); margin:0 0 0.5rem;
    font-variant-ligatures: common-ligatures contextual; font-variant-numeric: oldstyle-nums; }
  .cv-honorific { font-style: italic; font-weight:400; }
  header.cv-header .cv-headline {
    font-family: var(--cx-serif); font-style: italic; font-weight:400;
    font-size: clamp(1.08rem, 2.6vw, 1.38rem); color: var(--cv-ink-2); margin-top:0.2rem; }
  header.cv-header .cv-ids, header.cv-header .cv-contact, header.cv-header .cv-links {
    font-family: var(--cx-sans); font-size:0.8rem; letter-spacing:0.01em; color: var(--cv-muted); }
  header.cv-header .cv-ids { margin-top:0.9rem; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a {
    color: var(--cv-ink-2); text-decoration: underline; text-decoration-color: var(--cx-spine);
    text-decoration-thickness:1px; text-underline-offset:0.18em; }
  header.cv-header .cv-metrics { font-family: var(--cx-sans); color: var(--cv-muted); }
  .cv-summary { font-size:1.06rem; line-height:1.64; color: var(--cv-ink-2); margin-top:1.5rem; max-width:60ch; }
  /* Illuminated versal: a large oxblood initial on a gilt-tinted ground. */
  .cv-summary::first-letter {
    font-size:3.4em; line-height:0.78; float:left; margin:0.06em 0.12em -0.04em 0;
    padding:0.04em 0.1em; font-weight:600; color: var(--cx-spine-ink);
    background: linear-gradient(160deg, rgba(202,167,101,0.28), rgba(156,123,63,0.12));
    box-shadow: inset 0 0 0 1px rgba(156,123,63,0.45); }
  .cv-photo { width:120px; height:150px; border-radius:2px; object-fit:cover;
    border:5px solid #fffdf6; outline:1px solid var(--cx-spine); outline-offset:-6px;
    box-shadow: 0 14px 30px -18px rgba(42,36,32,0.5); filter: grayscale(0.35) sepia(0.1) contrast(1.02); }

  /* ---- Sections: fleuron + small-caps + gilt-tipped rule ---- */
  section.cv-section { margin-top: 2.9rem; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; padding-left:1.7rem; padding-bottom:0.6rem;
    font-family: var(--cx-serif); font-size:0.92rem; font-weight:600; font-variant: small-caps;
    letter-spacing:0.12em; color: var(--cv-ink); margin:0 0 1.1rem; }
  section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before {
    content:"❧"; position:absolute; left:0; top:-0.05em; font-variant:normal;
    color: var(--cx-spine); font-size:1rem; }
  section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
    content:""; position:absolute; left:1.7rem; right:0; bottom:0; height:1px; transform-origin:0 50%;
    background: linear-gradient(90deg, var(--cx-gold) 0 2rem, var(--cv-rule-strong) 2rem); }

  /* ---- Entries ---- */
  ol.cv-bib > li { margin-bottom:1.05rem; line-height:1.6; font-size:0.99rem; color: var(--cv-ink-2); }
  ol.cv-bib > li a, .cv-prose-body a {
    color: var(--cv-ink); text-decoration: underline; text-decoration-color: var(--cx-spine);
    text-decoration-thickness:1px; text-underline-offset:0.16em; }
  .cv-self {
    color: var(--cx-spine-ink) !important; font-weight:600; font-variant: small-caps; letter-spacing:0.03em; }

  .cv-prose-body p { font-size:1.0rem; line-height:1.64; color: var(--cv-ink-2); }
  ul.cv-prose-list > li { line-height:1.6; color: var(--cv-ink-2); }
  .cv-provenance, .cv-license, .cv-living, .cv-attribution { font-family: var(--cx-sans); color: var(--cv-faint); }
  .cv-living { color: var(--cv-muted); }
  .cv-attribution a { color: var(--cv-ink-2); text-decoration: underline; text-decoration-color: var(--cx-spine); }

  /* ---- Restrained motion ---- */
  @keyframes cx-settle { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } }
  @keyframes cx-rule { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @supports (animation-timeline: view()) {
    section.cv-section > h2, .cv-summary-block > .cv-summary-h {
      animation: cx-settle cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 12%; }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
      animation: cx-rule cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 14%; }
    ol.cv-bib > li {
      animation: cx-settle cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% entry 46%; }
  }
  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    .cx-candle, .cx-glint { display:none !important; }
    .cv { transform:none !important; opacity:1 !important; }
    section.cv-section > h2, .cv-summary-block > .cv-summary-h,
    ol.cv-bib > li { opacity:1 !important; transform:none !important; }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after { transform:none !important; }
  }
  @media print {
    .cx-spine, .cx-glint, .cx-candle { display:none !important; }
    *,*::before,*::after { animation:none !important; }
    .cv { padding:0; max-width:none; border-left:0 !important; transform:none !important; }
  }`;
}

export const codexTemplate: CvTemplate = {
  key: "codex",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + codexCss(theme);
    const body =
      `<div class="cx-spine" aria-hidden="true"></div>` +
      `<div class="cx-glint" aria-hidden="true"></div>` +
      `<div class="cx-candle" aria-hidden="true"></div>` +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
