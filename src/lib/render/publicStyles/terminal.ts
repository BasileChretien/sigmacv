/**
 * Public-page showcase style — "Terminal".
 * Retro CRT phosphor console: scanline + flicker + vignette overlay, monospace,
 * phosphor-green name with a blinking cursor, amber `//` section headings with a
 * glitch-in reveal, cyan glowing links, `$` publication prompts. CSS-ONLY.
 *
 */
import {
  attributionFooter,
  coauthorLinksFooter,
  commonCss,
  cvPageShell,
  headerHtml,
  licenseFooter,
  mascotBaseCss,
  mascotHtml,
  provenanceFooter,
  sectionsHtml,
} from "@/lib/render/templates/shared";
import type { CvTemplate, TemplateTheme } from "@/lib/render/templates/types";
import { accentSpectrum } from "./kit";

function terminalCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: dark;
    --cv-ink:#9dffce; --cv-ink-2:#5fe0a8; --cv-muted:#3fae7d; --cv-faint:#2f8a63;
    --cv-rule: rgba(57,255,140,0.22); --cv-rule-strong: rgba(57,255,140,0.4); --cv-page:#020805;
    --term:#39ff8c; --amber:#ffd166; --cyan:#42f5ff; --mag:#ff4d8d;
  }
  body {
    background:#020805; color:var(--cv-ink); min-height:100vh;
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
    text-shadow: 0 0 4px rgba(57,255,140,0.35);
  }
  .cv { max-width: 820px; padding: 52px 52px 120px; }

  /* CRT overlay: scanlines + flicker + vignette */
  .crt { position: fixed; inset: 0; z-index: 50; pointer-events: none;
    background: repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.16) 3px, rgba(0,0,0,0) 4px);
    animation: crt-flicker 5s steps(48) infinite; }
  .crt::after { content:""; position:absolute; inset:0; background: radial-gradient(125% 125% at 50% 50%, transparent 58%, rgba(0,0,0,0.6)); }
  @keyframes crt-flicker { 0%,100%{opacity:1} 3%{opacity:.82} 7%{opacity:1} 52%{opacity:.9} 80%{opacity:.97} }

  header.cv-header { margin-bottom: 1.8rem; padding-bottom: 1rem; border-bottom: 1px solid var(--cv-rule); }
  header.cv-header h1 { font-size: clamp(1.9rem,5.5vw,3rem); font-weight:700; color:var(--term); letter-spacing:0.01em; text-shadow:0 0 14px rgba(57,255,140,0.6); }
  header.cv-header h1::after { content:"_"; margin-left:0.1em; animation: term-cursor 1.05s steps(2,jump-none) infinite; }
  @keyframes term-cursor { 50%{opacity:0} }
  header.cv-header .cv-headline { color: var(--amber); }
  header.cv-header .cv-headline::before { content:"> "; color: var(--cyan); }
  header.cv-header .cv-ids a, ol.cv-bib > li a { color: var(--cyan); text-shadow:0 0 8px rgba(66,245,255,0.5); }
  header.cv-header .cv-summary { color: var(--cv-ink-2); }
  .cv-self { color:#eafff4 !important; font-weight:700; text-shadow:0 0 10px rgba(57,255,140,0.8); }
  .cv-photo { width:112px; height:112px; border-radius:6px; border:1px solid var(--term); box-shadow:0 0 16px rgba(57,255,140,0.4); filter: grayscale(1) contrast(1.08) brightness(1.05); }

  section.cv-section > h2, .cv-summary-block > .cv-summary-h { color: var(--amber); text-transform: uppercase; letter-spacing:0.2em; font-size:0.8rem; font-weight:700; margin:0 0 0.7rem; }
  section.cv-section > h2::before { content:"// "; color: var(--term); }
  ol.cv-bib > li { position:relative; padding-left:1.6em; text-indent:0; }
  ol.cv-bib > li::before { content:"$"; position:absolute; left:0; color: var(--term); opacity:0.8; }

  @keyframes term-rise { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
  @keyframes term-glitch { 0%{clip-path:inset(0 0 70% 0);transform:translateX(-3px);text-shadow:2px 0 var(--cyan),-2px 0 var(--mag)} 30%{clip-path:inset(40% 0 20% 0);transform:translateX(3px)} 60%{clip-path:inset(0 0 0 0);transform:none;text-shadow:none} 100%{} }
  @keyframes term-progress { to { transform: scaleX(1); } }

  @supports (animation-timeline: view()) {
    section.cv-section > h2, .cv-summary-block > .cv-summary-h { animation: term-glitch 600ms steps(3) both; animation-timeline: view(); animation-range: entry 0% entry 30%; }
    ol.cv-bib > li { animation: term-rise linear both; animation-timeline: view(); animation-range: entry 0% entry 50%; }
  }
  @supports (animation-timeline: scroll()) {
    .term-progress { position:fixed; top:0; left:0; height:3px; width:100%; z-index:60; transform-origin:0 50%; transform:scaleX(0);
      background: var(--term); box-shadow:0 0 10px var(--term); animation: term-progress linear both; animation-timeline: scroll(root); }
  }
  /* --- extra ambient motion: a bright scan beam sweeping down --- */
  .crt::before { content:""; position:absolute; left:0; right:0; top:0; height:170px;
    background: linear-gradient(to bottom, transparent, rgba(57,255,140,0.11), transparent);
    animation: term-beam 7s linear infinite; }
  @keyframes term-beam { from { transform: translateY(-170px); } to { transform: translateY(100vh); } }

  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    section.cv-section > h2, .cv-summary-block > .cv-summary-h { clip-path:none !important; }
    ol.cv-bib > li { opacity:1 !important; transform:none !important; }
    .crt { display:none; } .term-progress { display:none; }
  }`;
}

const terminalMascotSkin = `
  /* CRT monitor body — dark chassis with green phosphor bezel glow */
  .sm-fig {
    background: #050e07;
    border-radius: 4px 4px 3px 3px;
    box-shadow:
      0 0 0 2px #0d2a14,
      0 0 0 3px #1a4425,
      0 0 12px 2px rgba(34,255,102,0.45),
      0 0 28px 6px rgba(34,255,102,0.18),
      inset 0 0 8px 2px rgba(34,255,102,0.08);
    overflow: visible;
  }
  /* Phosphor-green Σ on the screen */
  .sm-fig::before {
    font-family: ui-monospace, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
    color: #22ff66;
    text-shadow:
      0 0 4px #22ff66,
      0 0 10px rgba(34,255,102,0.8),
      0 0 20px rgba(34,255,102,0.5);
    font-size: 1.35em;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -0.02em;
  }
  /* Tiny green pixel feet — two rectangles below the body */
  .sm-fig::after {
    content: "";
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 4px;
    background: #0d2a14;
    border-radius: 0 0 2px 2px;
    box-shadow:
      -8px 0 0 2px #0d2a14,
      8px 0 0 2px #0d2a14,
      -8px 2px 0 1px #22ff66,
      8px 2px 0 1px #22ff66,
      0 0 6px rgba(34,255,102,0.4);
  }
  /* Scanlines + blinking cursor block + screen bloom — all on .sm-deco */
  .sm-deco {
    position: absolute;
    inset: 2px;
    border-radius: 3px;
    pointer-events: none;
    /* phosphor-green scan-lines across the entire screen face */
    background:
      repeating-linear-gradient(
        to bottom,
        transparent 0px,
        transparent 2px,
        rgba(34,255,102,0.07) 2px,
        rgba(34,255,102,0.07) 3px
      );
    /* faint screen bloom overlay */
    box-shadow:
      inset 0 0 10px 3px rgba(34,255,102,0.12),
      inset 0 0 3px 1px rgba(34,255,102,0.2);
    overflow: hidden;
  }
  /* Blinking cursor block in the bottom-right of the screen */
  .sm-deco::after {
    content: "";
    position: absolute;
    bottom: 5px;
    right: 6px;
    width: 5px;
    height: 7px;
    background: #22ff66;
    box-shadow: 0 0 4px rgba(34,255,102,0.9);
    animation: sm-cursor-blink 1.1s steps(2, jump-none) infinite;
  }
  /* Subtle horizontal sweep beam across the screen */
  .sm-deco::before {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(34,255,102,0.06) 48%,
      rgba(34,255,102,0.11) 50%,
      rgba(34,255,102,0.06) 52%,
      transparent 100%
    );
    animation: sm-beam-sweep 4s linear infinite;
  }
  @keyframes sm-cursor-blink { 50% { opacity: 0; } }
  @keyframes sm-beam-sweep {
    0%   { transform: translateY(-110%); }
    100% { transform: translateY(200%); }
  }
  @media (prefers-reduced-motion: reduce) {
    .sm-deco::after { animation: none; }
    .sm-deco::before { animation: none; }
  }`;

export const terminalTemplate: CvTemplate = {
  key: "terminal",
  render(cv, sections, theme, opts) {
    const css =
      commonCss(theme) +
      terminalCss(theme) +
      accentSpectrum(["--term", "--amber", "--cyan"], { l: 0.82, c: 0.17 }) +
      mascotBaseCss() +
      terminalMascotSkin;
    const body =
      mascotHtml(cv, sections) +
      `<div class="crt" aria-hidden="true"></div>` +
      `<div class="term-progress" aria-hidden="true"></div>` +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
