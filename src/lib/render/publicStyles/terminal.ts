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

  section.cv-section > h2 { color: var(--amber); text-transform: uppercase; letter-spacing:0.2em; font-size:0.8rem; font-weight:700; margin:0 0 0.7rem; }
  section.cv-section > h2::before { content:"// "; color: var(--term); }
  ol.cv-bib > li { position:relative; padding-left:1.6em; text-indent:0; }
  ol.cv-bib > li::before { content:"$"; position:absolute; left:0; color: var(--term); opacity:0.8; }

  @keyframes term-rise { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:none} }
  @keyframes term-glitch { 0%{clip-path:inset(0 0 70% 0);transform:translateX(-3px);text-shadow:2px 0 var(--cyan),-2px 0 var(--mag)} 30%{clip-path:inset(40% 0 20% 0);transform:translateX(3px)} 60%{clip-path:inset(0 0 0 0);transform:none;text-shadow:none} 100%{} }
  @keyframes term-progress { to { transform: scaleX(1); } }

  @supports (animation-timeline: view()) {
    section.cv-section > h2 { animation: term-glitch 600ms steps(3) both; animation-timeline: view(); animation-range: entry 0% entry 30%; }
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
    section.cv-section > h2 { clip-path:none !important; }
    ol.cv-bib > li { opacity:1 !important; transform:none !important; }
    .crt { display:none; } .term-progress { display:none; }
  }`;
}

export const terminalTemplate: CvTemplate = {
  key: "terminal",
  render(cv, sections, theme, opts) {
    const css =
      commonCss(theme) +
      terminalCss(theme) +
      accentSpectrum(["--term", "--amber", "--cyan"], { l: 0.82, c: 0.17 });
    const body =
      `<div class="crt" aria-hidden="true"></div>` +
      `<div class="term-progress" aria-hidden="true"></div>` +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
