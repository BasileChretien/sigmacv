/**
 * Public-page showcase style — "Aura".
 * Glowing gradient-mesh BENTO: each section is a rounded dark glass card with
 * its own soft, slowly-moving colour aura (a different hue per section), the
 * header a hero card with a big mesh and a gradient name. Premium, colourful,
 * soft. CSS-ONLY.
 */
import {
  attributionFooter,
  coauthorLinksFooter,
  commonCss,
  cvPageShell,
  headerHtml,
  licenseFooter,
  mascotBaseCss,
  provenanceFooter,
  sectionsHtml,
} from "@/lib/render/templates/shared";
import type { CvTemplate, TemplateTheme } from "@/lib/render/templates/types";

function auraCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: dark;
    --cv-ink:#eef0ff; --cv-ink-2:#c4c8ee; --cv-muted:#9398c6; --cv-faint:#9ea3d4;
    --cv-rule: rgba(255,255,255,0.10); --cv-rule-strong: rgba(255,255,255,0.2); --cv-page:#0a0a14;
  }
  body { min-height:100vh; color:var(--cv-ink); background:
    radial-gradient(60% 50% at 50% -5%, #1b1740 0%, transparent 60%), #0a0a14; background-attachment: fixed; }
  .cv { max-width: 880px; padding: 6vh 40px 14vh; }

  /* Every card: glass + its own drifting colour aura behind it */
  header.cv-header, section.cv-section {
    position: relative; overflow: hidden; border-radius: 24px;
    background: rgba(255,255,255,0.035); border: 1px solid rgba(255,255,255,0.09);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 60px -30px rgba(0,0,0,0.8);
    backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
  }
  header.cv-header { padding: 40px 40px 32px; margin-bottom: 1.4rem; }
  section.cv-section { padding: 26px 30px; margin-top: 1.4rem; }
  header.cv-header::before, section.cv-section::before {
    /* The aura sits BEHIND the card content but in FRONT of the card's own
       background, so it tints the text's backdrop directly. Dimmed (0.55 -> 0.4
       opacity, lower gradient alphas) so the glow stays vivid at the card edges
       without dropping body/secondary text below a readable contrast. */
    content:""; position:absolute; inset:-45%; z-index:-1; filter: blur(46px); opacity:0.4;
    background:
      radial-gradient(circle at 28% 30%, hsl(var(--h,265) 92% 62% / 0.78), transparent 52%),
      radial-gradient(circle at 74% 68%, hsl(calc(var(--h,265) + 55) 92% 60% / 0.72), transparent 52%);
    animation: aura-move 16s ease-in-out infinite alternate;
  }
  @keyframes aura-move { to { transform: translate(10%, 9%) rotate(18deg) scale(1.18); } }
  header.cv-header { --h: 265; }
  section.cv-section:nth-of-type(1){--h:200} section.cv-section:nth-of-type(2){--h:330}
  section.cv-section:nth-of-type(3){--h:150} section.cv-section:nth-of-type(4){--h:30}
  section.cv-section:nth-of-type(5){--h:275} section.cv-section:nth-of-type(6){--h:185}
  section.cv-section:nth-of-type(7){--h:310} section.cv-section:nth-of-type(8){--h:95}
  section.cv-section:nth-of-type(9){--h:240} section.cv-section:nth-of-type(n+10){--h:0}

  header.cv-header h1 { font-size: clamp(2.2rem,6vw,3.4rem); font-weight:800; letter-spacing:-0.02em; line-height:1.02; color:var(--cv-ink); }
  @supports ((background-clip:text) or (-webkit-background-clip:text)) {
    header.cv-header h1 { background: linear-gradient(100deg,#fff, var(--cv-accent) 42%, #ff9ad9); background-size: 240% 100%; -webkit-background-clip:text; background-clip:text; color:transparent; animation: aura-flow 9s linear infinite; }
  }
  header.cv-header .cv-headline { color: var(--cv-ink-2); font-weight:600; }
  header.cv-header .cv-ids a, ol.cv-bib > li a { color:#9ec2ff; }
  .cv-self { color:#fff !important; font-weight:800; text-shadow:0 0 14px rgba(150,170,255,0.7); }
  .cv-photo { width:118px; height:118px; border-radius:24px; border:1px solid rgba(255,255,255,0.25); box-shadow:0 12px 40px -10px rgba(0,0,0,0.6); }

  section.cv-section > h2 { font-size:0.74rem; font-weight:800; text-transform:uppercase; letter-spacing:0.16em; margin:0 0 0.7rem;
    color:#fff; }
  ol.cv-bib > li { position:relative; padding-left:1.6em; text-indent:0; }
  ol.cv-bib > li::before { content:""; position:absolute; left:0; top:0.5em; width:7px; height:7px; border-radius:50%;
    background: hsl(var(--h,265) 90% 65%); box-shadow:0 0 10px hsl(var(--h,265) 90% 65% / 0.8); }

  @keyframes aura-in { from{opacity:0;transform:translateY(28px) scale(0.97)} to{opacity:1;transform:none} }
  @keyframes aura-progress { to { transform: scaleX(1); } }
  @supports (animation-timeline: view()) {
    /* Reveal heading + entries on their own (small) geometry, never the whole
       card — a tall section card animated as one block stays faded at its top
       while its first entries are already in the reading zone. */
    section.cv-section > h2, .cv-prose-body > * { animation: aura-in cubic-bezier(0.22,1,0.36,1) both; animation-timeline: view(); animation-range: cover 0% cover 10%; }
    ol.cv-bib > li { animation: aura-in ease-out both; animation-timeline: view(); animation-range: entry 0% entry 52%; }
  }
  @supports (animation-timeline: scroll()) {
    .aura-progress { position:fixed; top:0; left:0; height:3px; width:100%; z-index:60; transform-origin:0 50%; transform:scaleX(0);
      background: linear-gradient(90deg,#7ad9ff,#b9a6ff,#ff9ad9); animation: aura-progress linear both; animation-timeline: scroll(root); }
  }
  /* --- extra ambient motion --- */
  ol.cv-bib > li::before { animation: aura-dot 3s ease-in-out infinite; }
  @keyframes aura-flow { to { background-position: 240% 50%; } }
  @keyframes aura-dot { 50% { transform: scale(1.5); } }

  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    section.cv-section, ol.cv-bib > li { opacity:1 !important; transform:none !important; }
    header.cv-header h1 { animation: none !important; }
    .aura-progress { display:none; }
  }`;
}

export const auraTemplate: CvTemplate = {
  key: "aura",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + auraCss(theme) + mascotBaseCss();
    const body =
      `<div class="aura-progress" aria-hidden="true"></div>` +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(sections, { mascot: cv.display.showMascot }) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
