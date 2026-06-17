/**
 * Public-page showcase style — "Prism".
 *
 * MAXIMALIST / eccentric: a dark stage under a huge, slowly spinning + endlessly
 * hue-cycling spectrum nebula; an oversized name in a flowing iridescent
 * gradient; a frosted-glass plate; per-section NEON heading colours; colour-
 * cycling publication ticks; glowing links; per-entry rise-in scroll reveals.
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
  mascotBaseCss,
  mascotHtml,
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
    /* --neon-2 lightened from #8b3cff (only 3.84:1 as the 5n+5 heading text on the
       dark glass plate) to #a96bff (5.7:1). This is the non-oklch fallback literal;
       where relative-color is supported accentSpectrum re-derives it at L=0.74
       (a light vivid that already passes on the dark plate). */
    --neon-1:#ff2db4; --neon-2:#a96bff; --neon-3:#15d3ff; --neon-4:#23ff9c; --neon-5:#ffb13d;
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
    /* opaque enough that text stays readable where the bright nebula sits behind
       the plate (raised from 0.56 — the spinning spectrum showed through too much). */
    background: rgba(11,10,22,0.68);
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
    /* Near-opaque so the publications scrolling UNDER this sticky label are
       cleanly occluded, not left half-visible + blurred through a translucent
       bar (the old rgba 0.5 made the top entries unreadable). */
    background: rgba(11,10,22,0.96); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
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
  @keyframes prism-in-li { from { opacity: 0; transform: translateX(-18px); } to { opacity: 1; transform: none; } }
  @keyframes prism-progress { to { transform: scaleX(1); } }

  @supports (animation-timeline: view()) {
    /* Reveal each entry on its OWN geometry, never the whole section: the old
       whole-section reveal (prism-in: rotate + rise + blur 7px) keyed to a tall
       section kept its TOP entries blurred + translated while they were already
       in the reading zone. The sticky neon heading is intentionally not scroll-
       revealed (sticky + view() is unreliable) — it's an always-present label. */
    ol.cv-bib > li, .cv-prose-body > * { animation: prism-in-li linear both; animation-timeline: view(); animation-range: entry 0% entry 55%; }
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

const prismMascotSkin = `
  /* --- Prism mascot: cut-glass crystal body -------------------------------- */

  /* Shimmer / sparkle keyframes */
  @keyframes pm-shimmer {
    0%   { opacity: 0;   transform: translateX(-120%) rotate(28deg); }
    30%  { opacity: 0.85; }
    70%  { opacity: 0.85; }
    100% { opacity: 0;   transform: translateX(180%)  rotate(28deg); }
  }
  @keyframes pm-spark1 {
    0%,100% { opacity: 0; transform: scale(0.5) rotate(0deg);   }
    50%      { opacity: 1; transform: scale(1.3) rotate(180deg); }
  }
  @keyframes pm-spark2 {
    0%,100% { opacity: 0; transform: scale(0.4) rotate(45deg);  }
    50%      { opacity: 1; transform: scale(1.1) rotate(225deg); }
  }
  @keyframes pm-glow-pulse {
    0%,100% { box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.72),
      inset 0 -1px 0 rgba(200,180,255,0.18),
      0 0 0 1px rgba(200,190,255,0.38),
      0 6px 18px -4px rgba(130,80,255,0.55),
      0 0 28px 4px rgba(120,200,255,0.18); }
    50%      { box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.88),
      inset 0 -1px 0 rgba(200,180,255,0.28),
      0 0 0 1px rgba(220,210,255,0.6),
      0 8px 26px -4px rgba(160,80,255,0.75),
      0 0 42px 8px rgba(100,220,255,0.28); }
  }

  /* BODY — translucent faceted glass */
  .sm-fig {
    width: 38px; height: 38px;
    border-radius: 10px;
    /* Multi-stop glass gradient: bright top highlight → translucent mid → faint bottom */
    background:
      linear-gradient(
        160deg,
        rgba(255,255,255,0.70)  0%,
        rgba(200,185,255,0.38) 22%,
        rgba(130,160,255,0.22) 48%,
        rgba(80,200,255,0.16)  72%,
        rgba(180,100,255,0.28) 100%
      );
    /* Frosted-glass blur so the neon nebula bleeds through beautifully */
    backdrop-filter: blur(2px) saturate(1.4);
    -webkit-backdrop-filter: blur(2px) saturate(1.4);
    /* 1 px translucent-white border = the bevelled crystal edge */
    border: 1px solid rgba(255,255,255,0.55);
    overflow: hidden;
    /* Pulsing iridescent glow */
    animation: pm-glow-pulse 3.2s ease-in-out infinite;
  }

  /* Σ — a solid white glyph with a dark crystal edge + iridescent glow, so it
     reads clearly on the near-white frosted glass (a transparent rainbow-clip
     glyph vanished against the light body). */
  .sm-fig::before {
    content: "Σ";
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; font-weight: 900; line-height: 1;
    color: #fff;
    background: none;
    -webkit-background-clip: border-box;
    background-clip: border-box;
    -webkit-text-stroke: 0.6px rgba(70,30,130,0.62);
    text-shadow:
      0 0 5px rgba(255,45,180,0.95),
      0 0 10px rgba(21,211,255,0.72),
      0 1px 2px rgba(35,20,70,0.7);
  }

  /* FEET — two small iridescent rounded nubs */
  .sm-fig::after {
    content: "";
    position: absolute;
    bottom: -5px; left: 50%;
    transform: translateX(-50%);
    width: 20px; height: 6px;
    border-radius: 0 0 4px 4px;
    background: linear-gradient(90deg,
      rgba(139,60,255,0.55) 0%,
      rgba(21,211,255,0.55) 50%,
      rgba(139,60,255,0.55) 100%
    );
    border: 1px solid rgba(255,255,255,0.4);
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
    box-shadow: 0 2px 6px rgba(100,80,220,0.4);
  }

  /* DECO — diagonal shimmer streak sweeping across the face */
  .sm-deco {
    position: absolute;
    inset: 0;
    overflow: hidden;
    border-radius: inherit;
    pointer-events: none;
  }
  .sm-deco::before {
    content: "";
    position: absolute;
    top: -50%; left: -30%;
    width: 28%; height: 200%;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgba(255,255,255,0.55) 40%,
      rgba(200,240,255,0.72) 50%,
      rgba(255,255,255,0.55) 60%,
      transparent 100%
    );
    transform: rotate(28deg) translateX(-120%);
    animation: pm-shimmer 3.8s ease-in-out infinite;
  }

  /* DECO — four-point sparkle: top-right corner */
  .sm-deco::after {
    content: "✦";
    position: absolute;
    top: 1px; right: 2px;
    font-size: 9px; line-height: 1;
    color: rgba(255,255,255,0.92);
    filter: drop-shadow(0 0 3px rgba(200,220,255,1));
    animation: pm-spark1 2.6s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .sm-fig { animation: none !important; }
    .sm-fig::before { animation: none !important; }
    .sm-deco::before { animation: none !important; }
    .sm-deco::after  { animation: none !important; }
  }`;

export const prismTemplate: CvTemplate = {
  key: "prism",
  render(cv, sections, theme, opts) {
    const css =
      commonCss(theme) +
      prismCss(theme) +
      accentSpectrum(["--neon-1", "--neon-2", "--neon-3", "--neon-4", "--neon-5"], {
        l: 0.74,
        c: 0.2,
      }) +
      mascotBaseCss() +
      prismMascotSkin;
    const body =
      mascotHtml(cv, sections) +
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
