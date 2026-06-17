/**
 * Public-page showcase style — "Mesh".
 * Premium light: a slowly morphing pastel MESH-GRADIENT sky (Stripe/Linear-grade)
 * behind a floating translucent card. Soft, classy, colourful. Palette derived
 * from the user's accent. CSS-ONLY.
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
import { accentSpectrum } from "./kit";

function meshCss(_t: TemplateTheme): string {
  return `
  :root {
    --cv-ink:#1b1733; --cv-ink-2:#46406a; --cv-muted:#6a648c; --cv-faint:#605a7d;
    --cv-rule: rgba(27,23,51,0.12); --cv-rule-strong: rgba(27,23,51,0.24); --cv-page:#f7f8fc;
    --m1:#6d7cff; --m2:#54d6ff; --m3:#ff8ad1; --m4:#ffd36b;
  }
  body { min-height:100vh; color:var(--cv-ink); background:#f5f6fc; overflow-x:hidden; }
  .cv { max-width:none; padding:0; }

  .mesh-bg { position:fixed; inset:-22%; z-index:0; pointer-events:none; opacity:0.8;
    filter: blur(46px) saturate(1.35);
    background:
      radial-gradient(38% 38% at 22% 26%, var(--m1), transparent 60%),
      radial-gradient(42% 42% at 80% 18%, var(--m2), transparent 60%),
      radial-gradient(46% 46% at 72% 82%, var(--m3), transparent 60%),
      radial-gradient(42% 42% at 24% 82%, var(--m4), transparent 60%);
    animation: mesh-move 26s ease-in-out infinite alternate; }
  @keyframes mesh-move { to { transform: translate(6%, 5%) scale(1.14) rotate(8deg); } }

  .mesh-card { position:relative; z-index:1; max-width:840px; margin:8vh auto 12vh; padding:54px 58px 62px;
    background: rgba(255,255,255,0.74); backdrop-filter: blur(26px) saturate(1.3); -webkit-backdrop-filter: blur(26px) saturate(1.3);
    border: 1px solid rgba(255,255,255,0.85); border-radius:30px; box-shadow: 0 50px 130px -45px rgba(70,50,140,0.4); }

  header.cv-header { margin-bottom:1.9rem; padding-bottom:1.1rem; border-bottom:1px solid var(--cv-rule); }
  header.cv-header h1 { font-size:clamp(2.2rem,6vw,3.4rem); font-weight:800; letter-spacing:-0.02em; line-height:1.02; color:var(--cv-ink); }
  @supports ((background-clip:text) or (-webkit-background-clip:text)) {
    header.cv-header h1 { background: linear-gradient(100deg, var(--m1), var(--m3) 55%, var(--m2)); background-size:220% 100%;
      -webkit-background-clip:text; background-clip:text; color:transparent; animation: mesh-flow 10s linear infinite; }
  }
  @keyframes mesh-flow { to { background-position: 220% 50%; } }
  header.cv-header .cv-headline { color:var(--cv-ink-2); font-weight:600; margin-top:0.3rem; }
  header.cv-header .cv-ids a, ol.cv-bib > li a { color: var(--cv-accent); }
  .cv-photo { width:118px; height:118px; border-radius:24px; border:3px solid rgba(255,255,255,0.9);
    box-shadow: 0 14px 40px -12px rgba(70,50,140,0.5); }

  section.cv-section > h2 { font-size:0.74rem; font-weight:800; text-transform:uppercase; letter-spacing:0.14em; color:var(--cv-accent); margin:0 0 0.7rem; }
  ol.cv-bib > li { position:relative; padding-left:1.6em; text-indent:0; }
  ol.cv-bib > li::before { content:""; position:absolute; left:0; top:0.45em; width:8px; height:8px; border-radius:50%;
    background: linear-gradient(var(--m1), var(--m3)); }

  @keyframes mesh-in { from{opacity:0;transform:translateY(26px) scale(0.98)} to{opacity:1;transform:none} }
  @keyframes mesh-progress { to { transform: scaleX(1); } }
  @supports (animation-timeline: view()) {
    /* Reveal heading + entries on their own (small) geometry, never the whole
       section — a tall section animated as one block stays faded/translated at
       its top while its first entries are already in the reading zone. */
    section.cv-section > h2, .cv-prose-body > * { animation: mesh-in cubic-bezier(0.22,1,0.36,1) both; animation-timeline: view(); animation-range: cover 0% cover 10%; }
    ol.cv-bib > li { animation: mesh-in ease-out both; animation-timeline: view(); animation-range: entry 0% entry 52%; }
  }
  @supports (animation-timeline: scroll()) {
    .mesh-progress { position:fixed; top:0; left:0; height:3px; width:100%; z-index:60; transform-origin:0 50%; transform:scaleX(0);
      background: linear-gradient(90deg, var(--m1), var(--m2), var(--m3)); animation: mesh-progress linear both; animation-timeline: scroll(root); }
  }
  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    section.cv-section, ol.cv-bib > li { opacity:1 !important; transform:none !important; }
    header.cv-header h1 { animation:none !important; }
    .mesh-progress { display:none; }
  }`;
}

export const meshTemplate: CvTemplate = {
  key: "mesh",
  render(cv, sections, theme, opts) {
    const css =
      commonCss(theme) +
      meshCss(theme) +
      accentSpectrum(["--m1", "--m2", "--m3", "--m4"], { l: 0.8, c: 0.15 }) +
      mascotBaseCss();
    const body =
      `<div class="mesh-bg" aria-hidden="true"></div>` +
      `<div class="mesh-progress" aria-hidden="true"></div>` +
      `<div class="mesh-card">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(sections, { mascot: cv.display.showMascot }) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
