/**
 * Public-page showcase style — "Synthwave".
 * 80s sunset: a purple→magenta→orange sky, a glowing slatted sun behind the
 * name, and an animated neon PERSPECTIVE GRID FLOOR scrolling toward the viewer
 * (CSS 3D transform). Chrome/neon gradient name; content on a dark glass panel
 * for legibility. CSS-ONLY.
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

function synthCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: dark;
    --cv-ink:#ffe9ff; --cv-ink-2:#e3b9ff; --cv-muted:#c79be0; --cv-faint:#cbb0dd;
    --cv-rule: rgba(255,255,255,0.16); --cv-rule-strong: rgba(255,255,255,0.3); --cv-page:#16082e;
    --mag:#ff2db4; --cyan:#3bf0ff; --orange:#ff8a3d; --yellow:#ffe14d;
  }
  body { min-height:100vh; overflow-x:hidden; color:var(--cv-ink);
    background: linear-gradient(180deg, #190a3a 0%, #46105f 42%, #b51a6e 76%, #ff7a3d 100%); background-attachment: fixed; }
  .cv { max-width: 820px; padding: 0; }

  /* Glowing slatted sun */
  .sw-sun { position: fixed; top: 7vh; left: 50%; transform: translateX(-50%); width: 320px; height: 320px; border-radius: 50%; z-index: 0; pointer-events: none;
    background: linear-gradient(180deg, #fff36b 0%, #ff9a3d 42%, #ff2db4 78%);
    filter: blur(1px); box-shadow: 0 0 120px 30px rgba(255,90,170,0.55);
    -webkit-mask-image: linear-gradient(180deg, #000 52%, transparent 52%), repeating-linear-gradient(180deg, #000 0 11px, transparent 11px 19px);
    mask-image: linear-gradient(180deg, #000 52%, transparent 52%), repeating-linear-gradient(180deg, #000 0 11px, transparent 11px 19px);
    -webkit-mask-composite: source-over; }
  /* Neon perspective grid floor */
  .sw-grid { position: fixed; left:-50%; right:-50%; bottom:-12vh; height: 70vh; z-index: 0; pointer-events: none;
    background-image: linear-gradient(rgba(59,240,255,0.55) 2px, transparent 2px), linear-gradient(90deg, rgba(255,45,180,0.55) 2px, transparent 2px);
    background-size: 64px 64px;
    transform: perspective(320px) rotateX(72deg); transform-origin: bottom center;
    -webkit-mask-image: linear-gradient(to top, #000 12%, transparent 82%); mask-image: linear-gradient(to top, #000 12%, transparent 82%);
    animation: sw-scroll 1.3s linear infinite; }
  @keyframes sw-scroll { to { background-position: 0 64px, 0 0; } }

  /* Dark glass content panel for legibility over the sky */
  .sw-panel { position: relative; z-index: 1; max-width: 820px; margin: 30vh auto 14vh; padding: 52px 56px 60px;
    /* opaque enough that light text stays readable where the panel sits over the
       bright orange lower end of the sunset gradient (background-attachment:fixed). */
    background: rgba(20,8,40,0.74); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.14); border-radius: 22px; box-shadow: 0 0 70px rgba(255,45,180,0.25), inset 0 1px 0 rgba(255,255,255,0.14); }

  header.cv-header { margin-bottom: 1.8rem; padding-bottom: 1rem; border-bottom: 1px solid var(--cv-rule); }
  header.cv-header h1 { font-size: clamp(2.2rem,6.5vw,3.6rem); font-weight:800; letter-spacing:-0.01em; line-height:1.02; color:var(--cv-ink); }
  @supports ((background-clip:text) or (-webkit-background-clip:text)) {
    header.cv-header h1 { background: linear-gradient(180deg,#ffffff, #ffe14d 40%, #ff2db4 90%); -webkit-background-clip:text; background-clip:text; color:transparent;
      filter: drop-shadow(0 2px 10px rgba(255,45,180,0.6)); }
  }
  header.cv-header .cv-headline { color: var(--cyan); text-shadow: 0 0 14px rgba(59,240,255,0.5); font-weight:600; }
  header.cv-header .cv-ids a, ol.cv-bib > li a { color: var(--cyan); text-shadow:0 0 10px rgba(59,240,255,0.45); }
  .cv-self { color:#fff !important; font-weight:800; text-shadow:0 0 12px rgba(255,45,180,0.8); }
  .cv-photo { width:120px; height:120px; border-radius:50%; border:3px solid var(--cyan); box-shadow:0 0 26px var(--mag); }

  section.cv-section > h2 { color: var(--mag); text-transform: uppercase; letter-spacing:0.18em; font-size:0.8rem; font-weight:800; margin:0 0 0.7rem; text-shadow:0 0 12px rgba(255,45,180,0.5); }
  section.cv-section:nth-of-type(2n) > h2 { color: var(--cyan); text-shadow:0 0 12px rgba(59,240,255,0.5); }
  ol.cv-bib > li { position:relative; padding-left:1.7em; text-indent:0; }
  ol.cv-bib > li::before { content:""; position:absolute; left:0; top:0.4em; width:8px; height:8px; transform: rotate(45deg); background: var(--mag); box-shadow:0 0 8px var(--mag); }
  ol.cv-bib > li:nth-child(2n)::before { background: var(--cyan); box-shadow:0 0 8px var(--cyan); }

  @keyframes sw-in { from{opacity:0;transform:translateY(30px) scale(0.97)} to{opacity:1;transform:none} }
  @keyframes sw-progress { to { transform: scaleX(1); } }
  @supports (animation-timeline: view()) {
    /* Reveal heading + entries on their own (small) geometry, never the whole
       section — a tall section animated as one block stays dark/faded at its top
       while its first entries are already in the reading zone. */
    section.cv-section > h2, .cv-prose-body > * { animation: sw-in linear both; animation-timeline: view(); animation-range: cover 0% cover 10%; }
    ol.cv-bib > li { animation: sw-in linear both; animation-timeline: view(); animation-range: entry 0% entry 52%; }
  }
  @supports (animation-timeline: scroll()) {
    .sw-progress { position:fixed; top:0; left:0; height:4px; width:100%; z-index:60; transform-origin:0 50%; transform:scaleX(0);
      background: linear-gradient(90deg,var(--cyan),var(--mag),var(--orange)); animation: sw-progress linear both; animation-timeline: scroll(root); }
  }
  /* --- extra ambient motion: pulsing sun + twinkling stars --- */
  .sw-sun { animation: sw-sun 5s ease-in-out infinite; }
  .sw-stars { position: fixed; inset: 0 0 42% 0; z-index: 0; pointer-events: none;
    background-image:
      radial-gradient(1.6px 1.6px at 18% 28%, #fff, transparent),
      radial-gradient(1.4px 1.4px at 68% 18%, #fff, transparent),
      radial-gradient(1.2px 1.2px at 42% 58%, #fff, transparent),
      radial-gradient(1.6px 1.6px at 84% 46%, #fff, transparent),
      radial-gradient(1.2px 1.2px at 55% 12%, #fff, transparent),
      radial-gradient(1.4px 1.4px at 30% 70%, #fff, transparent);
    animation: sw-twinkle 3.6s ease-in-out infinite; }
  @keyframes sw-sun { 50% { box-shadow: 0 0 170px 55px rgba(255,90,170,0.72); } }
  @keyframes sw-twinkle { 50% { opacity: 0.35; } }

  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    section.cv-section, ol.cv-bib > li { opacity:1 !important; transform:none !important; }
    .sw-progress { display:none; }
  }`;
}

export const synthwaveTemplate: CvTemplate = {
  key: "synthwave",
  render(cv, sections, theme, opts) {
    const css =
      commonCss(theme) +
      synthCss(theme) +
      accentSpectrum(["--mag", "--cyan", "--orange", "--yellow"], { l: 0.72, c: 0.2 });
    const body =
      `<div class="sw-stars" aria-hidden="true"></div>` +
      `<div class="sw-sun" aria-hidden="true"></div>` +
      `<div class="sw-grid" aria-hidden="true"></div>` +
      `<div class="sw-progress" aria-hidden="true"></div>` +
      `<div class="sw-panel">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
