/**
 * Public-page showcase style — "Riso".
 * Risograph zine print: warm paper, halftone dot texture, two-ink overprint
 * (riso pink + blue) with a living MISREGISTRATION drift on the name, bold
 * poster headings as ink blocks, ink-stamp reveals. Tasteful-bold, editorial-
 * eccentric. CSS-ONLY.
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

function risoCss(_t: TemplateTheme): string {
  return `
  :root {
    --cv-ink:#241c34; --cv-ink-2:#43395c; --cv-muted:#6a5f86; --cv-faint:#645d86;
    --cv-rule: rgba(36,28,52,0.18); --cv-rule-strong: rgba(36,28,52,0.34); --cv-page:#f4eede;
    --riso-pink:#ff2d87; --riso-blue:#1f3bff; --riso-teal:#00b3a4; --riso-yellow:#ffc12e;
  }
  body { min-height:100vh; color:var(--cv-ink); background:var(--cv-page);
    background-image: radial-gradient(rgba(36,28,52,0.06) 1px, transparent 1.5px); background-size: 5px 5px; background-attachment: fixed; }
  .cv { max-width: 820px; padding: 56px 56px 120px; }

  header.cv-header { margin-bottom: 1.9rem; padding-bottom: 1rem; border-bottom: 3px solid var(--riso-blue); }
  header.cv-header h1 { font-size: clamp(2.4rem,7vw,4.2rem); font-weight:800; letter-spacing:-0.03em; line-height:0.98;
    color: var(--riso-pink); mix-blend-mode: multiply; text-shadow: 3px -2px 0 rgba(31,59,255,0.9); animation: riso-mis 6s ease-in-out infinite; }
  @keyframes riso-mis { 0%,100%{text-shadow:3px -2px 0 rgba(31,59,255,0.9)} 50%{text-shadow:6px -4px 0 rgba(31,59,255,0.9)} }
  header.cv-header .cv-headline { color: var(--riso-blue); font-weight:700; margin-top:0.3rem; }
  header.cv-header .cv-ids a, ol.cv-bib > li a { color: var(--riso-blue); text-decoration: underline; text-decoration-thickness:0.14em; text-underline-offset:0.16em; }
  .cv-self { color: var(--riso-pink) !important; font-weight:800; }
  .cv-photo { width:112px; height:140px; border-radius:2px; border:3px solid var(--riso-blue); filter: grayscale(1) contrast(1.05); mix-blend-mode: multiply; }

  /* Heading as a solid ink block */
  section.cv-section { margin-top: 2.1rem; }
  section.cv-section > h2 { display:inline-block; color:#f4eede; background: var(--riso-blue); padding:0.28em 0.7em;
    font-size:0.78rem; font-weight:800; text-transform:uppercase; letter-spacing:0.12em; margin:0 0 0.85rem; transform: rotate(-1.2deg); }
  /* Paper ink reads on the blue block (5.8:1) but FAILS on the lighter teal
     (2.27:1) and pink (3.03:1) ink blocks → flip those to dark ink (teal 6.2:1,
     pink 4.6:1) the way the amber chip pattern does elsewhere. */
  section.cv-section:nth-of-type(3n+1) > h2 { background: var(--riso-pink); color: var(--cv-ink); transform: rotate(1deg); }
  section.cv-section:nth-of-type(3n+3) > h2 { background: var(--riso-teal); color: var(--cv-ink); transform: rotate(-0.6deg); }

  ol.cv-bib > li { position:relative; padding-left:1.6em; text-indent:0; }
  ol.cv-bib > li::before { content:"●"; position:absolute; left:0; color: var(--riso-pink); font-size:0.7em; top:0.28em; }
  ol.cv-bib > li:nth-child(2n)::before { color: var(--riso-blue); }

  @keyframes riso-stamp { from{opacity:0;transform:translateY(16px) scale(1.05)} to{opacity:1;transform:none} }
  @keyframes riso-progress { to { transform: scaleX(1); } }
  @supports (animation-timeline: view()) {
    /* Stamp in the heading + each entry on their OWN geometry, never the whole
       section. The old whole-section reveal scaled the block (scale 1.05) and
       kept it faded at its top: on a tall section that overflowed UP into the
       section above (the Education/Publications overlap) AND left the first
       entries blurred while being read. Per-child reveals do neither. */
    section.cv-section > h2, .cv-prose-body > * { animation: riso-stamp steps(4) both; animation-timeline: view(); animation-range: cover 0% cover 10%; }
    ol.cv-bib > li { animation: riso-stamp linear both; animation-timeline: view(); animation-range: entry 0% entry 50%; }
  }
  @supports (animation-timeline: scroll()) {
    .riso-progress { position:fixed; top:0; left:0; height:5px; width:100%; z-index:60; transform-origin:0 50%; transform:scaleX(0);
      background: repeating-linear-gradient(90deg, var(--riso-pink) 0 20px, var(--riso-blue) 20px 40px); animation: riso-progress linear both; animation-timeline: scroll(root); }
  }
  /* --- extra ambient motion: boiling riso grain --- */
  .cv { position: relative; z-index: 1; }
  .riso-grain { position: fixed; inset: 0; z-index: 0; pointer-events: none; opacity: 0.5;
    background-image: radial-gradient(rgba(36,28,52,0.08) 1px, transparent 1.5px); background-size: 4px 4px;
    animation: riso-boil 0.9s steps(3) infinite; }
  @keyframes riso-boil { 0%{background-position:0 0} 33%{background-position:2px 1px} 66%{background-position:-1px 2px} 100%{background-position:0 0} }

  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    section.cv-section, ol.cv-bib > li { opacity:1 !important; transform:none !important; }
    header.cv-header h1 { text-shadow: 3px -2px 0 rgba(31,59,255,0.9) !important; }
    section.cv-section > h2 { transform: rotate(-1.2deg); }
    .riso-progress { display:none; }
  }`;
}

const risoMascotSkin = `
  /* ── Riso mascot skin: flat spot-colour screen-print look ── */

  /* BODY — flat riso-blue rectangle, matte, no shadow, no gradient */
  .sm-fig {
    background: #1f3bff;
    border-radius: 6px;
    filter: contrast(1.05) saturate(0.95);
    box-shadow: none;
  }

  /* Σ mark — flat cream/paper colour, no shadow, looks inked */
  .sm-fig::before {
    color: #f4eede;
    text-shadow: none;
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  /* FEET — two flat pink ink blobs */
  .sm-fig::after {
    content: '';
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 22px;
    height: 5px;
    background: #1f3bff;
    border-radius: 0 0 4px 4px;
    box-shadow: -7px 0 0 0 #1f3bff, 7px 0 0 0 #1f3bff;
  }

  /* MISREGISTRATION GHOST — pink copy of the body, offset behind */
  .sm-deco {
    position: absolute;
    inset: 0;
    border-radius: 6px;
    background: #ff2d87;
    transform: translate(3px, 3px);
    z-index: -1;
    pointer-events: none;
  }

  /* GRAIN LAYER — faint halftone-style dot noise on the pink ghost */
  .sm-deco::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 6px;
    background-image:
      radial-gradient(circle, rgba(36,28,52,0.18) 1px, transparent 1.5px);
    background-size: 3px 3px;
    background-position: 1px 1px;
  }

  /* Second accent bleed — tiny riso-pink sliver peeking out bottom-right */
  .sm-deco::after {
    content: '';
    position: absolute;
    bottom: -2px;
    right: -2px;
    width: 14px;
    height: 4px;
    border-radius: 2px;
    background: #ff2d87;
    opacity: 0.7;
  }`;

export const risoTemplate: CvTemplate = {
  key: "riso",
  render(cv, sections, theme, opts) {
    const css =
      commonCss(theme) +
      risoCss(theme) +
      accentSpectrum(["--riso-pink", "--riso-blue", "--riso-teal", "--riso-yellow"], {
        l: 0.58,
        c: 0.2,
      }) +
      mascotBaseCss() +
      risoMascotSkin;
    const body =
      mascotHtml(cv, sections) +
      `<div class="riso-grain" aria-hidden="true"></div>` +
      `<div class="riso-progress" aria-hidden="true"></div>` +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
