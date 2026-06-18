/**
 * Public-page showcase style — "Pop".
 *
 * MAXIMALIST / eccentric, light & joyful: a bright candy-gradient field with
 * big drifting blobs, a giant bold name in a playful multi-colour gradient with
 * a gentle wobble, rounded candy-chip section headings (each a different hue),
 * coloured publication dots, thick fun underlines, and bouncy (overshoot)
 * scroll reveals. Loud and colourful but on a light, legible ground. 100%
 * CSS-ONLY → runs under the strict public-page CSP (no JS).
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

function popCss(_theme: TemplateTheme): string {
  return `
  :root {
    --cv-ink: #1a1330; --cv-ink-2: #4a4068; --cv-muted: #6b6390; --cv-faint: #6a628f;
    --cv-rule: #ecdcf0; --cv-page: #fff7fc;
    --pop-1:#ff4d8d; --pop-2:#8b5cff; --pop-3:#19c3ff; --pop-4:#1fd58a; --pop-5:#ffb02e;
  }
  body {
    min-height: 100vh; overflow-x: hidden;
    background:
      radial-gradient(55% 45% at 12% 8%, #ffe24d66, transparent 60%),
      radial-gradient(50% 42% at 88% 12%, #6be6ff66, transparent 60%),
      radial-gradient(55% 50% at 84% 88%, #ff7ac366, transparent 60%),
      radial-gradient(52% 48% at 10% 90%, #9b8bff66, transparent 60%),
      var(--cv-page);
    background-attachment: fixed;
  }
  .cv { max-width: 860px; padding: 0 56px 120px; position: relative; z-index: 1; }

  /* ---- Drifting candy blobs --------------------------------------------- */
  .pop-blobs { position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden; }
  .pop-blobs i {
    position: absolute; border-radius: 46% 54% 58% 42% / 52% 44% 56% 48%;
    filter: blur(8px); opacity: 0.5; mix-blend-mode: multiply;
  }
  .pop-blobs i:nth-child(1) { width: 280px; height: 280px; background: var(--pop-1); top: 12%; left: -60px; animation: pop-bob 14s ease-in-out infinite; }
  .pop-blobs i:nth-child(2) { width: 220px; height: 220px; background: var(--pop-3); top: 45%; right: -40px; animation: pop-bob 18s ease-in-out infinite reverse; }
  .pop-blobs i:nth-child(3) { width: 200px; height: 200px; background: var(--pop-5); bottom: 8%; left: 8%; animation: pop-bob 16s ease-in-out infinite; }
  @keyframes pop-bob { 50% { transform: translate(28px, -32px) rotate(20deg) scale(1.08); } }

  /* ---- Giant playful name ----------------------------------------------- */
  header.cv-header { margin-bottom: 1.9rem; padding-bottom: 1rem; border-bottom: 3px dotted var(--pop-2); }
  header.cv-header h1 {
    font-size: clamp(2.5rem, 8vw, 4.4rem); font-weight: 800; letter-spacing: -0.03em; line-height: 1.0;
    color: var(--cv-ink); transform-origin: left center;
  }
  @supports ((background-clip: text) or (-webkit-background-clip: text)) {
    header.cv-header h1 {
      background: linear-gradient(92deg, var(--pop-1), var(--pop-2), var(--pop-3), var(--pop-4), var(--pop-5), var(--pop-1));
      background-size: 280% 100%;
      -webkit-background-clip: text; background-clip: text; color: transparent;
      animation: pop-flow 10s linear infinite, pop-wobble 6s ease-in-out infinite;
    }
  }
  @keyframes pop-flow { to { background-position: 280% 50%; } }
  @keyframes pop-wobble { 25% { transform: rotate(-1.4deg); } 75% { transform: rotate(1.4deg); } }
  header.cv-header .cv-headline { color: var(--cv-ink-2); font-weight: 700; margin-top: 0.35rem; }
  /* ID/DOI links: a fixed dark purple (7.3:1 on the near-white page). NOT tied to
     --pop-2, whose spectrum value is a LIGHT L=0.72 vivid (~2:1 on this page) and
     whose literal fallback #8b5cff is only 3.94:1 — both fail as body-link text. */
  header.cv-header .cv-ids a { color: #6321d6; font-weight: 700; }

  /* Self-name = the floored accent directly (always ≥4.7:1 on white via
     ensureReadableOnWhite). Using --cv-accent rather than --pop-1 avoids the
     non-oklch fallback path where --pop-1 is the literal #ff4d8d (2.98:1). */
  .cv-self { color: var(--cv-accent) !important; font-weight: 800; }
  .cv-photo { width: 120px; height: 120px; border-radius: 42% 58% 58% 42% / 42% 42% 58% 58%; border: 5px solid #fff; box-shadow: 0 12px 30px -8px var(--pop-2); }

  /* ---- Candy-chip section headings (rounded pills, per-section hue) ------ */
  section.cv-section { margin-top: 2.1rem; }
  section.cv-section > h2 {
    display: inline-block;
    font-size: 0.74rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;
    /* Dark ink on the candy chips (small text → WCAG-AA 4.5:1). The pink chip
       (default --pop-1) reads white at only 3.14:1; a deep-wine ink is 5.47:1.
       The amber chip already used this dark-text pattern; the cyan/green/purple
       variants below mirror it. */
    color: #40000f; margin: 0 0 0.85rem; padding: 0.32em 0.95em;
    border-radius: 999px; background: var(--pop-1);
    box-shadow: 0 6px 16px -6px var(--pop-1);
  }
  section.cv-section:nth-of-type(5n+2) > h2 { background: var(--pop-3); box-shadow: 0 6px 16px -6px var(--pop-3); color: #08323f; }
  section.cv-section:nth-of-type(5n+3) > h2 { background: var(--pop-4); box-shadow: 0 6px 16px -6px var(--pop-4); color: #053524; }
  section.cv-section:nth-of-type(5n+4) > h2 { background: var(--pop-5); box-shadow: 0 6px 16px -6px var(--pop-5); color: #3a2a00; }
  section.cv-section:nth-of-type(5n+5) > h2 { background: var(--pop-2); box-shadow: 0 6px 16px -6px var(--pop-2); color: #0d0033; }

  /* ---- Coloured publication dots + fun underlines ------------------------ */
  ol.cv-bib > li { position: relative; padding-left: 1.6em; text-indent: 0; }
  ol.cv-bib > li::before {
    content: ""; position: absolute; left: 0; top: 0.5em; width: 9px; height: 9px; border-radius: 50%;
    background: var(--pop-1);
  }
  ol.cv-bib > li:nth-child(4n+2)::before { background: var(--pop-3); }
  ol.cv-bib > li:nth-child(4n+3)::before { background: var(--pop-4); }
  ol.cv-bib > li:nth-child(4n)::before { background: var(--pop-5); }
  /* Bib link text: the same fixed dark purple as the ID links (7.3:1 on the
     near-white page). The bright --pop-3 stays as the decorative underline only. */
  ol.cv-bib > li a { color: #6321d6; text-decoration: underline; text-decoration-color: var(--pop-3); text-decoration-thickness: 0.18em; text-underline-offset: 0.18em; }

  /* ---- Bouncy scroll reveals + progress --------------------------------- */
  @keyframes pop-in { from { opacity: 0; transform: translateY(40px) scale(0.94); } to { opacity: 1; transform: none; } }
  @keyframes pop-in-li { from { opacity: 0; transform: translateX(-14px); } to { opacity: 1; transform: none; } }
  @keyframes pop-progress { to { transform: scaleX(1); } }

  @supports (animation-timeline: view()) {
    /* Reveal the heading + each entry on their OWN (small) geometry, never the
       whole section. A tall section (e.g. Publications) animated as one block
       stays faded/translated at its TOP while its first entries are already in
       the reading zone (scroll-driven ranges scale with element height); per-
       child reveals always finish low in the viewport, well before reading. */
    section.cv-section > h2, .cv-prose-body > * { animation: pop-in cubic-bezier(0.34, 1.56, 0.64, 1) both; animation-timeline: view(); animation-range: cover 0% cover 10%; }
    ol.cv-bib > li { animation: pop-in-li ease-out both; animation-timeline: view(); animation-range: entry 0% entry 55%; }
  }
  @supports (animation-timeline: scroll()) {
    .pop-progress {
      position: fixed; top: 0; left: 0; height: 5px; width: 100%; z-index: 60;
      transform-origin: 0 50%; transform: scaleX(0);
      background: linear-gradient(90deg, var(--pop-1), var(--pop-2), var(--pop-3), var(--pop-4), var(--pop-5));
      animation: pop-progress linear both; animation-timeline: scroll(root);
    }
  }

  /* --- extra ambient motion --- */
  section.cv-section > h2 { animation: pop-chip 4s ease-in-out infinite; }
  ol.cv-bib > li::before { animation: pop-dot 2.6s ease-in-out infinite; }
  .pop-blobs i:nth-child(4) { width: 240px; height: 240px; background: var(--pop-4); top: 30%; left: 40%; animation: pop-bob 20s ease-in-out infinite; }
  .pop-blobs i:nth-child(5) { width: 170px; height: 170px; background: var(--pop-2); top: 68%; right: 32%; animation: pop-bob 13s ease-in-out infinite reverse; }
  @keyframes pop-chip { 50% { transform: translateY(-3px) scale(1.03); } }
  @keyframes pop-dot { 50% { transform: scale(1.45); } }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; }
    section.cv-section, ol.cv-bib > li { opacity: 1 !important; transform: none !important; }
    header.cv-header h1, section.cv-section > h2 { transform: none !important; }
    .pop-progress { display: none; }
  }`;
}

const popMascotSkin = `
  /* ---- Pop mascot: comic-book character ---------------------------------- */
  @keyframes sm-pop-bounce {
    0%, 100% { transform: translateY(0) rotate(-2deg); }
    50%       { transform: translateY(-4px) rotate(2deg); }
  }
  @keyframes sm-pop-shine {
    0%, 100% { opacity: 0.85; transform: translate(3px, 3px) scale(1); }
    50%       { opacity: 1;    transform: translate(3px, 2px) scale(1.08); }
  }

  /* Body: saturated blue with heavy 3px comic-ink border + hard offset drop-shadow */
  .sm-fig {
    width: 38px; height: 38px;
    border-radius: 50%;
    background: #1a6efc;
    border: 3px solid #111;
    box-shadow: 6px 6px 0 #111;
    overflow: visible;
    animation: sm-pop-bounce 2.8s ease-in-out infinite;
  }

  /* Σ glyph: bold white with black outline via -webkit-text-stroke */
  .sm-fig::before {
    content: "Σ";
    position: absolute;
    inset: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; font-weight: 900; line-height: 1;
    color: #fff;
    -webkit-text-stroke: 1.5px #111;
    text-shadow: none;
    z-index: 2;
  }

  /* Feet: two small rounded nubs at the bottom */
  .sm-fig::after {
    content: "";
    position: absolute;
    bottom: -8px; left: 50%;
    transform: translateX(-50%);
    width: 22px; height: 7px;
    background: #111;
    border-radius: 0 0 6px 6px;
    box-shadow: -8px 0 0 #111, 8px 0 0 #111;
    z-index: 1;
  }

  /* .sm-deco: halftone dots across the body */
  .sm-deco {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background-image:
      radial-gradient(circle, rgba(0,0,0,0.22) 1.5px, transparent 1.5px);
    background-size: 6px 6px;
    background-position: 1px 1px;
    z-index: 1;
    pointer-events: none;
  }

  /* .sm-deco::before: white shine highlight (top-left crescent) */
  .sm-deco::before {
    content: "";
    position: absolute;
    top: 5px; left: 6px;
    width: 10px; height: 7px;
    background: rgba(255,255,255,0.72);
    border-radius: 50% 50% 30% 30%;
    transform: rotate(-20deg);
    z-index: 3;
    animation: sm-pop-shine 2.8s ease-in-out infinite;
  }

  /* .sm-deco::after: punchy yellow starburst accent dot (bottom-right) */
  .sm-deco::after {
    content: "";
    position: absolute;
    bottom: 4px; right: 4px;
    width: 7px; height: 7px;
    background: #ffb02e;
    border: 1.5px solid #111;
    border-radius: 50%;
    z-index: 3;
  }

  @media (prefers-reduced-motion: reduce) {
    .sm-fig { animation: none; }
    .sm-deco::before { animation: none; }
  }`;

export const popTemplate: CvTemplate = {
  key: "pop",
  render(cv, sections, theme, opts) {
    const css =
      commonCss(theme) +
      popCss(theme) +
      accentSpectrum(["--pop-1", "--pop-2", "--pop-3", "--pop-4", "--pop-5"], {
        l: 0.72,
        c: 0.19,
      }) +
      mascotBaseCss() +
      popMascotSkin;
    const body =
      mascotHtml(cv, sections) +
      `<div class="pop-blobs" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>` +
      `<div class="pop-progress" aria-hidden="true"></div>` +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
