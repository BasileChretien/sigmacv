/**
 * Public-page showcase style — "Prism".
 *
 * MAXIMALIST / eccentric: a dark stage under a huge, slowly spinning + endlessly
 * hue-cycling spectrum nebula; an oversized name in a flowing iridescent
 * gradient; a frosted-glass plate; per-section NEON heading colours; colour-
 * cycling publication ticks; glowing links; bold rotate+rise scroll reveals.
 * Loud, colourful, alive — but text sits on a solid glass plate so it stays
 * readable. 100% CSS-ONLY → runs under the strict public-page CSP (no JS).
 *
 * Guardrails: reveal start-states gated behind `@supports (animation-timeline)`;
 * full `prefers-reduced-motion` fallback.
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

function prismCss(_theme: TemplateTheme): string {
  return `
  :root {
    color-scheme: dark;
    --cv-ink: #f6f7ff; --cv-ink-2: #d2d5f2; --cv-muted: #a7abdb; --cv-faint: #888cc4;
    --cv-rule: rgba(255,255,255,0.14); --cv-rule-strong: rgba(255,255,255,0.26);
    --cv-page: #07060f;
    --neon-1:#ff2db4; --neon-2:#8b3cff; --neon-3:#15d3ff; --neon-4:#23ff9c; --neon-5:#ffb13d;
  }
  body { background: #07060f; color: var(--cv-ink); min-height: 100vh; overflow-x: hidden; }
  .cv { max-width: none; margin: 0; padding: 0; }

  /* ---- Spinning + hue-cycling spectrum nebula ---------------------------- */
  .prism-bg {
    position: fixed; inset: -30%; z-index: 0; pointer-events: none;
    background:
      radial-gradient(38% 38% at 22% 26%, var(--neon-2) 0%, transparent 60%),
      radial-gradient(42% 42% at 80% 18%, var(--neon-3) 0%, transparent 60%),
      radial-gradient(46% 46% at 72% 82%, var(--neon-1) 0%, transparent 60%),
      radial-gradient(40% 40% at 24% 82%, var(--neon-4) 0%, transparent 60%),
      radial-gradient(60% 60% at 50% 50%, var(--neon-5) 0%, transparent 66%);
    filter: blur(64px) saturate(1.45);
    opacity: 0.85;
    animation: prism-spin 36s linear infinite, prism-hue 16s linear infinite;
  }
  @keyframes prism-spin { to { transform: rotate(360deg) scale(1.12); } }
  @keyframes prism-hue  { to { filter: blur(64px) saturate(1.45) hue-rotate(360deg); } }

  /* ---- Frosted content plate (keeps text readable over the riot) --------- */
  .prism-plate {
    position: relative; z-index: 1;
    max-width: 880px; margin: 8vh auto 12vh; padding: 56px 58px 64px;
    background: rgba(11,10,22,0.56);
    backdrop-filter: blur(30px) saturate(1.5); -webkit-backdrop-filter: blur(30px) saturate(1.5);
    border: 1px solid rgba(255,255,255,0.13); border-radius: 30px;
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.16), 0 50px 140px rgba(0,0,0,0.62);
  }

  /* ---- Giant iridescent name -------------------------------------------- */
  header.cv-header { margin-bottom: 2rem; padding-bottom: 1.2rem; border-bottom: 1px solid var(--cv-rule); }
  header.cv-header h1 {
    font-size: clamp(2.6rem, 8.5vw, 4.8rem); font-weight: 800; letter-spacing: -0.03em; line-height: 0.98;
    color: var(--cv-ink);
  }
  @supports ((background-clip: text) or (-webkit-background-clip: text)) {
    header.cv-header h1 {
      background: linear-gradient(100deg, var(--neon-1), var(--neon-2), var(--neon-3), var(--neon-4), var(--neon-5), var(--neon-1));
      background-size: 300% 100%;
      -webkit-background-clip: text; background-clip: text; color: transparent;
      animation: prism-flow 9s linear infinite;
    }
  }
  @keyframes prism-flow { to { background-position: 300% 50%; } }
  header.cv-header .cv-headline { color: var(--cv-ink-2); font-weight: 600; margin-top: 0.35rem; }
  header.cv-header .cv-ids a { color: var(--neon-3); text-shadow: 0 0 14px rgba(21,211,255,0.45); }
  header.cv-header .cv-summary { color: var(--cv-ink-2); }

  /* Self-name highlight → neon pink glow. */
  .cv-self { color: #ffd9f1 !important; font-weight: 800; text-shadow: 0 0 12px rgba(255,45,180,0.65); }
  .cv-photo { width: 120px; height: 120px; border-radius: 18px; border: 2px solid rgba(255,255,255,0.45); box-shadow: 0 0 12px var(--neon-1), 0 0 34px rgba(255,45,180,0.4); }

  /* ---- Neon, per-section heading colours (sticky glass) ------------------ */
  section.cv-section > h2 {
    position: sticky; top: 0; z-index: 3;
    font-size: 0.78rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.18em;
    margin: 0 0 0.75rem; padding: 0.55rem 0;
    background: rgba(11,10,22,0.5); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
    color: var(--neon-1);
  }
  section.cv-section:nth-of-type(5n+2) > h2 { color: var(--neon-3); }
  section.cv-section:nth-of-type(5n+3) > h2 { color: var(--neon-4); }
  section.cv-section:nth-of-type(5n+4) > h2 { color: var(--neon-5); }
  section.cv-section:nth-of-type(5n+5) > h2 { color: var(--neon-2); }

  /* ---- Colour-cycling publication ticks + glowing links ------------------ */
  ol.cv-bib > li { position: relative; padding-left: 1.7em; text-indent: 0; border-radius: 8px; transition: background 0.25s ease; }
  ol.cv-bib > li:hover { background: rgba(255,255,255,0.05); }
  ol.cv-bib > li::before {
    content: ""; position: absolute; left: 0; top: 0.32em; bottom: 0.32em; width: 3px; border-radius: 3px;
    background: linear-gradient(var(--neon-1), var(--neon-2));
  }
  ol.cv-bib > li:nth-child(3n+2)::before { background: linear-gradient(var(--neon-3), var(--neon-4)); }
  ol.cv-bib > li:nth-child(3n)::before { background: linear-gradient(var(--neon-5), var(--neon-1)); }
  ol.cv-bib > li a { color: var(--neon-3); text-shadow: 0 0 10px rgba(21,211,255,0.4); }

  /* ---- Bold scroll reveals + progress ----------------------------------- */
  @keyframes prism-in { from { opacity: 0; transform: translateY(42px) rotate(-2deg) scale(0.95); filter: blur(7px); } to { opacity: 1; transform: none; filter: none; } }
  @keyframes prism-in-li { from { opacity: 0; transform: translateX(-18px); } to { opacity: 1; transform: none; } }
  @keyframes prism-progress { to { transform: scaleX(1); } }

  @supports (animation-timeline: view()) {
    section.cv-section { animation: prism-in linear both; animation-timeline: view(); animation-range: entry 0% cover 26%; }
    ol.cv-bib > li { animation: prism-in-li linear both; animation-timeline: view(); animation-range: entry 0% entry 55%; }
  }
  @supports (animation-timeline: scroll()) {
    .prism-progress {
      position: fixed; top: 0; left: 0; height: 4px; width: 100%; z-index: 60;
      transform-origin: 0 50%; transform: scaleX(0);
      background: linear-gradient(90deg, var(--neon-1), var(--neon-3), var(--neon-4), var(--neon-5));
      animation: prism-progress linear both; animation-timeline: scroll(root);
    }
  }

  /* --- extra ambient motion --- */
  header.cv-header h1 { animation: prism-flow 9s linear infinite, prism-glow 4.5s ease-in-out infinite; }
  .prism-plate { animation: prism-plate 8s ease-in-out infinite; }
  ol.cv-bib > li::before { animation: prism-tick 3s ease-in-out infinite; }
  @keyframes prism-glow { 0%,100% { filter: drop-shadow(0 0 0 transparent); } 50% { filter: drop-shadow(0 2px 22px rgba(255,45,180,0.55)); } }
  @keyframes prism-plate { 50% { box-shadow: inset 0 1px 0 rgba(255,255,255,0.22), 0 60px 165px rgba(123,60,255,0.42); } }
  @keyframes prism-tick { 50% { opacity: 0.5; } }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; }
    section.cv-section, ol.cv-bib > li { opacity: 1 !important; transform: none !important; filter: none !important; }
    .prism-progress { display: none; }
  }`;
}

export const prismTemplate: CvTemplate = {
  key: "prism",
  render(cv, sections, theme, opts) {
    const css =
      commonCss(theme) +
      prismCss(theme) +
      accentSpectrum(["--neon-1", "--neon-2", "--neon-3", "--neon-4", "--neon-5"], {
        l: 0.74,
        c: 0.2,
      });
    const body =
      `<div class="prism-bg" aria-hidden="true"></div>` +
      `<div class="prism-progress" aria-hidden="true"></div>` +
      `<div class="prism-plate">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
