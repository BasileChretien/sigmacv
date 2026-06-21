/**
 * Public-page showcase style — "Hanko" (ukiyo-e / sumizuri-e).
 *
 * A Franco-Japanese editorial style rendered as a monochrome-ink woodblock print
 * (sumizuri-e, 墨摺絵): the whole ukiyo-e world — the great wave, Fuji, seigaiha,
 * an enso, a crest, drifting leaves — is drawn in SUMI INK, with a single vermilion
 * seal as the one saturated note. The mood lives entirely in the ATMOSPHERE LAYER
 * (a washi surround + ink scenery + drifting leaves); the text lives on a separate
 * READING SURFACE — a warm paper page that floats above it — so nothing textured
 * or moving is ever behind a glyph.
 *
 *   • ATMOSPHERE — washi, a faint Mt. Fuji + seigaiha wave band in the surround, a
 *     sumi ink-wash that BLOOMS open on load, an ENSO that brushes itself in, a
 *     quiet kamon crest, and golden ginkgo leaves drifting down the surround.
 *   • READING SURFACE — a warm paper page, centred, floating on a soft shadow + a
 *     fine gold keyline, with generous ma (space).
 *   • THE GREAT WAVE (the signature) — an ink cresting wave sits beside each section
 *     heading and CRESTS IN as that section scrolls into view.
 *   • TATEGAKI — a vertical 履歴書 column down the page's left margin.
 *   • CARVED SEAL — a vermilion hanko (印) stamped beside your name, with an
 *     ink-spread ripple on the press.
 *   • TYPE — Newsreader (bundled), a literary high-contrast serif.
 *
 * Motion: one load moment (page settles, ink blooms, enso draws, seal stamps) +
 * faint ambient (leaf drift, seigaiha drift, ink breathe) confined to the surround;
 * the per-section wave is scroll-triggered. CSS-ONLY; AA throughout (sumi ~14:1,
 * vermilion #b23a2c ~5:1); `prefers-reduced-motion` stills everything (scene shown,
 * waves settled); print = clean black-on-white. Not a mascot style.
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

/** A stylized cresting ink wave (the great wave), as a CSS background data URI. */
const WAVE_SVG =
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 60'>" +
  "<path d='M4 54 C 44 54 52 18 92 10 C 124 4 152 12 158 34 C 161 46 152 53 142 49 C 133 46 135 36 144 35' fill='none' stroke='rgba(27,25,22,0.62)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/>" +
  "<path d='M92 10 C 90 3 80 3 78 10' fill='none' stroke='rgba(27,25,22,0.58)' stroke-width='1.7' stroke-linecap='round'/>" +
  "<path d='M110 7 C 109 1 99 1 97 8' fill='none' stroke='rgba(27,25,22,0.58)' stroke-width='1.7' stroke-linecap='round'/>" +
  "<path d='M128 9 C 128 2 118 2 116 9' fill='none' stroke='rgba(27,25,22,0.58)' stroke-width='1.7' stroke-linecap='round'/>" +
  "<path d='M68 22 C 64 16 56 17 55 24' fill='none' stroke='rgba(27,25,22,0.52)' stroke-width='1.5' stroke-linecap='round'/>" +
  "<path d='M160 50 C 178 50 184 41 196 44' fill='none' stroke='rgba(27,25,22,0.45)' stroke-width='1.6' stroke-linecap='round'/>" +
  "</svg>";
const WAVE_URI = "data:image/svg+xml," + WAVE_SVG.replace(/</g, "%3C").replace(/>/g, "%3E");

function hankoCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    --hk-ink:#1b1916; --hk-ink-2:#3a352e; --hk-muted:#5f594f; --hk-faint:#71695e;
    --hk-page:#f7f2e7; --cv-page:#f7f2e7; --hk-rule: rgba(27,25,22,0.16); --hk-rule-strong: rgba(27,25,22,0.3);
    --hk-seal:#b23a2c; --hk-seal-ink:#9e2b1e; --hk-gold:#ad8a4e;
    --hk-serif: "Newsreader", ui-serif, "Hiragino Mincho ProN", "Yu Mincho", Georgia, "Times New Roman", serif;
    --hk-sans: ui-sans-serif, system-ui, "Hiragino Kaku Gothic ProN", "Yu Gothic UI", "Segoe UI", Helvetica, Arial, sans-serif;
  }

  /* ---- Atmosphere: a washi field with an ink-wash that blooms open ---- */
  body { min-height:100vh; color:var(--hk-ink); font-family: var(--hk-serif);
    background: radial-gradient(130% 80% at 50% -10%, #f0e8d6 0%, #e7dcc4 50%, #ddd0b2 100%);
    background-attachment: fixed; }
  body::before { content:""; position:fixed; inset:0; z-index:0; pointer-events:none;
    background: radial-gradient(42% 34% at 84% 9%, rgba(40,36,30,0.1), transparent 70%);
    transform-origin: 84% 9%;
    animation: hk-bloom 1.8s cubic-bezier(0.22,1,0.36,1) both, hk-wash 16s ease-in-out 1.8s infinite; }
  @keyframes hk-bloom { from { opacity:0; transform: scale(0.4); } to { opacity:0.85; transform: scale(1); } }
  @keyframes hk-wash { 0%,100% { opacity:0.7; } 50% { opacity:1; } }

  /* ---- Ink scenery in the surround: Fuji + seigaiha + a kamon + an enso ---- */
  .hk-scene { position:fixed; inset:0; width:100%; height:100%; z-index:0; pointer-events:none; }
  .hk-enso { position:fixed; top: clamp(2vh,5vh,8vh); right: clamp(8px,5vw,68px); width:128px; height:128px;
    z-index:0; pointer-events:none; }
  .hk-enso path { fill:none; stroke: rgba(27,25,22,0.16); stroke-width:6; stroke-linecap:round;
    stroke-dasharray:1; stroke-dashoffset:0; animation: hk-enso 2.4s cubic-bezier(0.4,0,0.2,1) 0.3s both; }
  @keyframes hk-enso { from { stroke-dashoffset:1; } to { stroke-dashoffset:0; } }
  .hk-kamon { position:fixed; bottom: clamp(8px,4vw,40px); right: clamp(8px,4vw,44px); width:62px; height:62px;
    z-index:0; pointer-events:none; opacity:0.14; }
  .hk-kamon path, .hk-kamon circle { fill:none; stroke: var(--hk-ink); stroke-width:2.2; }
  @media (max-width: 980px) { .hk-enso, .hk-kamon { display:none; } }

  /* ---- Golden ginkgo leaves drifting down the surround ---- */
  .hk-leaves { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }
  .hk-leaf { position:absolute; top:-8%; width:24px; height:24px; color: rgba(178,140,66,0.62);
    animation: hk-fall linear infinite; will-change: transform; }
  .hk-leaf svg { width:100%; height:100%; display:block; }
  .hk-leaf:nth-child(1) { left:8%;  animation-duration:18s; animation-delay:-2s;  transform:scale(0.9); }
  .hk-leaf:nth-child(2) { left:24%; animation-duration:24s; animation-delay:-9s;  transform:scale(0.7); }
  .hk-leaf:nth-child(3) { left:64%; animation-duration:21s; animation-delay:-5s;  transform:scale(1.05); }
  .hk-leaf:nth-child(4) { left:82%; animation-duration:27s; animation-delay:-14s; transform:scale(0.8); }
  .hk-leaf:nth-child(5) { left:46%; animation-duration:23s; animation-delay:-18s; transform:scale(0.85); }
  @keyframes hk-fall {
    0%   { transform: translate(0, -10vh) rotate(0deg); opacity:0; }
    8%   { opacity:0.85; }
    50%  { transform: translate(30px, 55vh) rotate(180deg); }
    92%  { opacity:0.85; }
    100% { transform: translate(-20px, 116vh) rotate(360deg); opacity:0; } }

  /* ---- Reading surface: a warm paper page floating above ---- */
  .cv { position:relative; z-index:1; max-width: 720px;
    margin: clamp(22px,5vw,60px) auto clamp(40px,7vw,84px);
    background: var(--hk-page);
    padding: clamp(50px,8vw,92px) clamp(30px,7vw,72px) clamp(56px,8vw,96px) clamp(56px,9vw,100px);
    border-radius: 2px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 30px 70px -44px rgba(40,30,12,0.6), 0 0 0 1px rgba(173,138,78,0.3);
    animation: hk-open 1s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
  @keyframes hk-open { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } }

  /* ---- Tategaki margin: a vertical 履歴書 + a thin sumi rule ---- */
  .cv::before { content:""; position:absolute; left: clamp(30px,5vw,54px);
    top: clamp(32px,5vw,58px); bottom: clamp(32px,5vw,58px); width:1px; background: var(--hk-rule-strong); }
  .hk-tate { position:absolute; left: clamp(12px,3vw,28px); top: clamp(30px,5vw,56px); z-index:2;
    writing-mode: vertical-rl; font-family: var(--hk-serif); font-size: clamp(0.9rem,1.6vw,1.15rem);
    letter-spacing:0.3em; color: rgba(27,25,22,0.26); pointer-events:none; }
  @media (max-width: 720px) { .cv { padding-left: clamp(30px,7vw,44px); } .cv::before, .hk-tate { display:none; } }

  /* ---- Masthead ---- */
  header.cv-header { position:relative; margin-bottom: 2.8rem; padding-bottom: 1.9rem;
    border-bottom: 1px solid var(--hk-rule-strong); }
  header.cv-header::before {
    content:"履歴書 ・ Curriculum Vitæ"; display:block; font-family: var(--hk-sans);
    font-size:0.66rem; font-weight:600; letter-spacing:0.28em; text-transform:uppercase;
    color: var(--hk-seal-ink); margin-bottom:1.3rem; }
  .cv-headmain { gap: 2.2rem; align-items: flex-start; }
  header.cv-header h1 {
    font-family: var(--hk-serif); font-size: clamp(2.4rem, 6.4vw, 3.8rem); font-weight:500;
    line-height:1.08; letter-spacing:0; color: var(--hk-ink); margin:0 0 0.5rem; }
  /* The carved hanko, stamped after the name; presses in + ink spreads on load. */
  header.cv-header h1::after {
    content:"印"; display:inline-grid; place-items:center; vertical-align:0.16em;
    width:1.5em; height:1.5em; margin-left:0.4em; font-size:0.42em; font-weight:700;
    background: var(--hk-seal); color: var(--hk-page); border-radius:0.14em; transform: rotate(-5deg);
    box-shadow: inset 0 0 0 1.5px rgba(247,242,231,0.3), 0 1px 2px rgba(0,0,0,0.18);
    animation: hk-stamp 0.6s cubic-bezier(0.34,1.56,0.64,1) 1s both; }
  @keyframes hk-stamp {
    0% { opacity:0; transform: rotate(-5deg) scale(2.4); box-shadow: inset 0 0 0 1.5px rgba(247,242,231,0.3), 0 0 0 0 rgba(178,58,44,0.45); }
    55% { opacity:1; transform: rotate(-5deg) scale(0.9); box-shadow: inset 0 0 0 1.5px rgba(247,242,231,0.3), 0 0 0 7px rgba(178,58,44,0.28); }
    100% { opacity:1; transform: rotate(-5deg) scale(1); box-shadow: inset 0 0 0 1.5px rgba(247,242,231,0.3), 0 1px 2px rgba(0,0,0,0.18), 0 0 0 0 rgba(178,58,44,0); } }
  .cv-honorific { font-style: italic; font-weight:400; }
  header.cv-header .cv-headline {
    font-family: var(--hk-serif); font-style: italic; font-weight:400;
    font-size: clamp(1.08rem, 2.5vw, 1.4rem); color: var(--hk-ink-2); margin-top:0.3rem; }
  header.cv-header .cv-ids, header.cv-header .cv-contact, header.cv-header .cv-links {
    font-family: var(--hk-sans); font-size:0.8rem; letter-spacing:0.01em; color: var(--hk-muted); }
  header.cv-header .cv-ids { margin-top:1rem; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a {
    color: var(--hk-ink-2); text-decoration: underline; text-decoration-color: var(--hk-seal);
    text-decoration-thickness:1px; text-underline-offset:0.18em; }
  header.cv-header .cv-metrics { font-family: var(--hk-sans); color: var(--hk-muted); }
  .cv-summary { font-size:1.1rem; line-height:1.66; color: var(--hk-ink-2); margin-top:1.5rem; max-width:60ch; }
  .cv-photo { width:118px; height:148px; border-radius:2px; object-fit:cover;
    border:5px solid #fffdf6; outline:1px solid var(--hk-gold); outline-offset:-6px;
    box-shadow: 0 16px 32px -20px rgba(27,25,22,0.5); filter: grayscale(0.4) contrast(1.02); }

  /* ---- Sections: the great wave crests beside each heading on scroll-in ---- */
  section.cv-section { margin-top: 3.4rem; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; padding-top:0.5rem; padding-bottom:0.7rem;
    font-family: var(--hk-sans); font-size:0.76rem; font-weight:600; text-transform:uppercase;
    letter-spacing:0.22em; color: var(--hk-ink); margin:0 0 1.15rem; }
  section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before {
    content:""; position:absolute; left:0; top:-2.5rem; width:200px; height:60px;
    background: url("${WAVE_URI}") left bottom / contain no-repeat; }
  section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
    content:""; position:absolute; left:0; right:0; bottom:0; height:1px;
    background: linear-gradient(90deg, var(--hk-ink) 0, var(--hk-ink) 55%, transparent 100%); }
  @supports (animation-timeline: view()) {
    section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before {
      animation: hk-crest cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 16%; }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
      animation: hk-rule cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 16%; transform-origin:0 50%; }
  }
  @keyframes hk-crest {
    from { clip-path: inset(0 100% 0 0); opacity:0; transform: translateY(8px); }
    to { clip-path: inset(0 0 0 0); opacity:1; transform:none; } }
  @keyframes hk-rule { from { transform: scaleX(0); } to { transform: scaleX(1); } }

  /* ---- Entries ---- */
  ol.cv-bib > li { margin-bottom:1.05rem; line-height:1.6; font-size:1.0rem; color: var(--hk-ink-2); }
  ol.cv-bib > li a, .cv-prose-body a {
    color: var(--hk-ink); text-decoration: underline; text-decoration-color: var(--hk-seal);
    text-decoration-thickness:1px; text-underline-offset:0.16em; }
  .cv-self {
    color: var(--hk-ink) !important; font-weight:600; padding-bottom:0.06em;
    background-image: linear-gradient(var(--hk-seal), var(--hk-seal));
    background-size:100% 1.5px; background-position:0 100%; background-repeat:no-repeat; }

  .cv-prose-body p { font-size:1.04rem; line-height:1.66; color: var(--hk-ink-2); }
  ul.cv-prose-list > li { line-height:1.6; color: var(--hk-ink-2); }
  .cv-provenance, .cv-license, .cv-living, .cv-attribution { font-family: var(--hk-sans); color: var(--hk-faint); }
  .cv-living { color: var(--hk-muted); }
  .cv-attribution a { color: var(--hk-ink-2); text-decoration: underline; text-decoration-color: var(--hk-seal); }

  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    .cv { opacity:1 !important; transform:none !important; }
    body::before { opacity:0.85 !important; transform:none !important; }
    .hk-enso path { stroke-dashoffset:0 !important; }
    .hk-leaves { display:none !important; }
    section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before { clip-path:none !important; opacity:1 !important; transform:none !important; }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after { transform:none !important; }
  }
  @media print {
    body { background:#fff !important; }
    body::before, .hk-scene, .hk-enso, .hk-kamon, .hk-leaves, .hk-tate, .cv::before { display:none !important; }
    section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before { display:none !important; }
    *,*::before,*::after { animation:none !important; }
    .cv { box-shadow:none !important; padding:0 !important; max-width:none !important; margin:0 !important; }
  }`;
}

export const hankoTemplate: CvTemplate = {
  key: "hanko",
  render(cv, sections, theme, opts) {
    const css = bundledFaceCss("Newsreader") + commonCss(theme) + hankoCss(theme);
    // Ink scenery: a seigaiha wave band + a faint Mt. Fuji, anchored to the foot.
    const scene =
      `<svg class="hk-scene" viewBox="0 0 1200 820" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">` +
      `<defs><pattern id="hk-sg" x="0" y="0" width="64" height="32" patternUnits="userSpaceOnUse">` +
      `<g fill="none" stroke="rgba(27,25,22,0.12)" stroke-width="1.4">` +
      `<path d="M0 32 A 32 32 0 0 1 64 32"></path><path d="M11 32 A 21 21 0 0 1 53 32"></path><path d="M22 32 A 10 10 0 0 1 42 32"></path>` +
      `</g><g fill="none" stroke="rgba(27,25,22,0.12)" stroke-width="1.4" transform="translate(32 16)">` +
      `<path d="M0 32 A 32 32 0 0 1 64 32"></path><path d="M11 32 A 21 21 0 0 1 53 32"></path><path d="M22 32 A 10 10 0 0 1 42 32"></path>` +
      `</g></pattern></defs>` +
      `<path d="M150 720 C 430 470 540 388 600 388 C 660 388 770 470 1050 720 Z" fill="rgba(27,25,22,0.06)"></path>` +
      `<path d="M566 426 L 590 402 L 600 414 L 614 400 L 638 426" fill="none" stroke="rgba(247,242,231,0.5)" stroke-width="3"></path>` +
      `<rect x="0" y="690" width="1200" height="140" fill="url(#hk-sg)"></rect>` +
      `</svg>`;
    const enso =
      `<svg class="hk-enso" viewBox="0 0 120 120" aria-hidden="true" focusable="false">` +
      `<path pathLength="1" d="M88 26 C 100 38 104 60 96 78 C 86 100 60 108 40 100 C 16 90 8 62 20 40 C 30 22 54 14 74 20"></path>` +
      `</svg>`;
    const kamon =
      `<svg class="hk-kamon" viewBox="0 0 60 60" aria-hidden="true" focusable="false">` +
      `<circle cx="30" cy="30" r="27"></circle>` +
      `<path d="M30 14 C 40 14 46 22 46 30 C 46 36 41 40 36 38 C 41 34 38 26 30 26 C 26 26 24 30 26 34 C 22 30 22 18 30 14 Z" fill="var(--hk-ink)" stroke="none"></path>` +
      `<path d="M46 30 C 46 40 38 46 30 46 C 24 46 20 41 22 36 C 26 41 34 38 34 30 C 34 26 30 24 26 26 C 30 22 42 22 46 30 Z" fill="var(--hk-ink)" stroke="none"></path>` +
      `</svg>`;
    const leafSvg = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22 C 12 16 6 16 3 9 C 1 5 5 1 12 2 C 19 1 23 5 21 9 C 18 16 12 16 12 22 Z M12 22 L12 13" fill="currentColor" stroke="rgba(140,110,50,0.5)" stroke-width="0.6"></path></svg>`;
    const leaves =
      `<div class="hk-leaves" aria-hidden="true">` +
      Array.from({ length: 5 }, () => `<span class="hk-leaf">${leafSvg}</span>`).join("") +
      `</div>`;
    const body =
      scene +
      enso +
      kamon +
      leaves +
      `<div class="cv">` +
      `<div class="hk-tate" aria-hidden="true">履歴書</div>` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
