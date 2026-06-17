/**
 * Public-page showcase style — "Neon".
 * Neon-sign tubes on a dark wall: glowing layered text-shadow on the name (with
 * a classic neon flicker), per-section neon heading colours, a glowing photo
 * frame. Palette derived from the user's accent (relative-color). CSS-ONLY.
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

function neonCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: dark;
    --cv-ink:#eaf6ff; --cv-ink-2:#b9c6d6; --cv-muted:#8a98ab; --cv-faint:#6f7c8f;
    --cv-rule: rgba(255,255,255,0.12); --cv-rule-strong: rgba(255,255,255,0.24); --cv-page:#0a0a0e;
    --n1:#ff2db4; --n2:#3bf0ff; --n3:#b14dff; --n4:#39ff8c; --n5:#ffd166;
  }
  body { min-height:100vh; color:var(--cv-ink); background:#0a0a0e;
    background-image: radial-gradient(120% 80% at 50% -12%, #17131f 0%, #0a0a0e 62%); }
  .cv { max-width: 840px; padding: 56px 56px 120px; }

  header.cv-header { margin-bottom: 2rem; padding-bottom: 1.1rem; border-bottom: 1px solid var(--cv-rule); }
  header.cv-header h1 { font-size: clamp(2.2rem,7vw,3.9rem); font-weight:800; color:#fff; letter-spacing:0.01em;
    text-shadow: 0 0 6px var(--n1), 0 0 18px var(--n1), 0 0 40px var(--n1); animation: neon-flicker 5s infinite; }
  @keyframes neon-flicker { 0%,18%,22%,25%,55%,100%{opacity:1} 20%,24%{opacity:0.55} 56%{opacity:0.8} }
  header.cv-header .cv-headline { color: var(--n2); font-weight:600; text-shadow:0 0 8px var(--n2), 0 0 22px var(--n2); margin-top:0.35rem; }
  header.cv-header .cv-ids a, ol.cv-bib > li a { color: var(--n2); text-shadow:0 0 8px var(--n2); }
  header.cv-header .cv-summary { color: var(--cv-ink-2); }
  .cv-self { color:#fff !important; font-weight:800; text-shadow:0 0 8px var(--n1), 0 0 20px var(--n1); }
  .cv-photo { width:120px; height:120px; border-radius:16px; border:2px solid var(--n1);
    box-shadow: 0 0 10px var(--n1), 0 0 28px var(--n1); }

  section.cv-section > h2 { color: var(--n3); text-transform:uppercase; letter-spacing:0.18em; font-size:0.82rem; font-weight:800;
    margin:0 0 0.8rem; text-shadow:0 0 8px var(--n3), 0 0 20px var(--n3); }
  section.cv-section:nth-of-type(5n+2) > h2 { color: var(--n2); text-shadow:0 0 8px var(--n2), 0 0 20px var(--n2); }
  section.cv-section:nth-of-type(5n+3) > h2 { color: var(--n4); text-shadow:0 0 8px var(--n4), 0 0 20px var(--n4); }
  section.cv-section:nth-of-type(5n+4) > h2 { color: var(--n5); text-shadow:0 0 8px var(--n5), 0 0 20px var(--n5); }
  section.cv-section:nth-of-type(5n+5) > h2 { color: var(--n1); text-shadow:0 0 8px var(--n1), 0 0 20px var(--n1); }
  ol.cv-bib > li { position:relative; padding-left:1.5em; text-indent:0; }
  ol.cv-bib > li::before { content:""; position:absolute; left:0; top:0.35em; bottom:0.35em; width:3px; border-radius:3px;
    background: var(--n2); box-shadow:0 0 8px var(--n2); }

  @keyframes neon-rise { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:none} }
  @keyframes neon-progress { to { transform: scaleX(1); } }
  @supports (animation-timeline: view()) {
    /* Reveal heading + entries on their own (small) geometry, never the whole
       section — a tall section animated as one block stays faded at its top
       while its first entries are already being read. */
    section.cv-section > h2, .cv-prose-body > * { animation: neon-rise linear both; animation-timeline: view(); animation-range: cover 0% cover 10%; }
    ol.cv-bib > li { animation: neon-rise linear both; animation-timeline: view(); animation-range: entry 0% entry 52%; }
  }
  @supports (animation-timeline: scroll()) {
    .neon-progress { position:fixed; top:0; left:0; height:3px; width:100%; z-index:60; transform-origin:0 50%; transform:scaleX(0);
      background: var(--n1); box-shadow:0 0 12px var(--n1); animation: neon-progress linear both; animation-timeline: scroll(root); }
  }
  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    section.cv-section, ol.cv-bib > li { opacity:1 !important; transform:none !important; }
    header.cv-header h1 { opacity:1 !important; }
    .neon-progress { display:none; }
  }`;
}

const neonMascotSkin = `
  .sm-fig { box-shadow: 0 0 0 2px var(--cv-accent, #1f4fd8), 0 0 14px var(--cv-accent, #1f4fd8), 0 0 28px color-mix(in srgb, var(--cv-accent, #1f4fd8) 40%, transparent); }
  .sm-fig::before { text-shadow: 0 0 8px var(--cv-accent, #1f4fd8); }`;

export const neonTemplate: CvTemplate = {
  key: "neon",
  render(cv, sections, theme, opts) {
    const css =
      commonCss(theme) +
      neonCss(theme) +
      accentSpectrum(["--n1", "--n2", "--n3", "--n4", "--n5"], { l: 0.74, c: 0.2 }) +
      mascotBaseCss() +
      neonMascotSkin;
    const body =
      mascotHtml(cv, sections) +
      `<div class="neon-progress" aria-hidden="true"></div>` +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
