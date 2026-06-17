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
  mascotHtml,
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

const meshMascotSkin = `
  @keyframes sm-mesh-shift {
    0%   { background-position: 0% 0%,   100% 0%,   100% 100%, 0% 100%; }
    25%  { background-position: 8% 12%,  92% 8%,    96% 92%,  4% 88%;  }
    50%  { background-position: 14% 6%,  86% 14%,   90% 88%,  10% 94%; }
    75%  { background-position: 6% 14%,  94% 6%,    98% 96%,  2% 82%;  }
    100% { background-position: 0% 0%,   100% 0%,   100% 100%, 0% 100%; }
  }
  @keyframes sm-bloom-pulse {
    0%, 100% { opacity: 0.55; transform: scale(1);    }
    50%       { opacity: 0.85; transform: scale(1.18); }
  }
  @keyframes sm-sheen-slide {
    from { transform: translateX(-110%) skewX(-18deg); }
    to   { transform: translateX(210%)  skewX(-18deg); }
  }

  /* ── BODY: layered radial-gradient mesh, shifts positions slowly ── */
  .sm-fig {
    width: 38px; height: 38px;
    border-radius: 12px;
    background-image:
      radial-gradient(ellipse 70% 70% at 0%   0%,   #7c8fff 0%, transparent 65%),
      radial-gradient(ellipse 65% 65% at 100% 0%,   #54d6ff 0%, transparent 65%),
      radial-gradient(ellipse 70% 70% at 100% 100%,  #e078f5 0%, transparent 65%),
      radial-gradient(ellipse 65% 65% at 0%   100%,  #ffc6e5 0%, transparent 65%);
    background-size: 120% 120%, 120% 120%, 120% 120%, 120% 120%;
    background-color: #8b8fff;
    animation: sm-mesh-shift 14s ease-in-out infinite;
    border-top:    1px solid rgba(255, 255, 255, 0.55);
    border-left:   1px solid rgba(255, 255, 255, 0.30);
    border-right:  1px solid rgba(180, 160, 255, 0.18);
    border-bottom: 1px solid rgba(180, 160, 255, 0.18);
    box-shadow:
      0 0  0 1px  rgba(255, 255, 255, 0.18),
      0 4px 14px -3px rgba(100, 80, 220, 0.55),
      0 12px 32px -6px rgba(140, 80, 255, 0.40),
      0 0  22px 0px  rgba(200, 140, 255, 0.22);
    position: relative;
    overflow: hidden;
  }

  /* ── Σ glyph: clean white, centred, bold ── */
  .sm-fig::before {
    content: "Σ";
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ui-serif, Georgia, "Times New Roman", serif;
    font-size: 20px;
    font-weight: 800;
    line-height: 1;
    color: #fff;
    text-shadow:
      0 1px 4px rgba(80, 40, 160, 0.60),
      0 0  10px rgba(255, 255, 255, 0.45);
    z-index: 3;
  }

  /* ── Feet: two soft violet-pink ovals ── */
  .sm-fig::after {
    content: "";
    position: absolute;
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    width: 22px;
    height: 7px;
    background: linear-gradient(90deg, #a78bfa 0%, #f0abfc 100%);
    border-radius: 50%;
    opacity: 0.75;
    z-index: 0;
  }

  /* ── Bloom / outer glow halo ── */
  .sm-deco {
    position: absolute;
    inset: -9px;
    border-radius: 20px;
    background:
      radial-gradient(ellipse 80% 80% at 30% 30%, rgba(124, 143, 255, 0.38), transparent 70%),
      radial-gradient(ellipse 80% 80% at 72% 68%, rgba(224, 120, 245, 0.32), transparent 70%);
    animation: sm-bloom-pulse 6s ease-in-out infinite;
    z-index: 0;
    pointer-events: none;
  }

  /* ── Sheen: fast left-to-right glint every ~9 s ── */
  .sm-deco::before {
    content: "";
    position: absolute;
    top: 0; bottom: 0;
    left: 0;
    width: 38%;
    background: linear-gradient(
      105deg,
      transparent 0%,
      rgba(255, 255, 255, 0.42) 48%,
      rgba(255, 255, 255, 0.18) 52%,
      transparent 100%
    );
    border-radius: inherit;
    animation: sm-sheen-slide 9s ease-in-out infinite 2s;
    z-index: 4;
  }

  /* ── Inner top-left corner highlight ── */
  .sm-deco::after {
    content: "";
    position: absolute;
    top: 4px; left: 5px;
    width: 12px; height: 5px;
    background: rgba(255, 255, 255, 0.55);
    border-radius: 4px;
    filter: blur(2px);
    z-index: 4;
  }

  @media (prefers-reduced-motion: reduce) {
    .sm-fig        { animation: none !important; }
    .sm-deco       { animation: none !important; }
    .sm-deco::before { animation: none !important; }
  }`;

export const meshTemplate: CvTemplate = {
  key: "mesh",
  render(cv, sections, theme, opts) {
    const css =
      commonCss(theme) +
      meshCss(theme) +
      accentSpectrum(["--m1", "--m2", "--m3", "--m4"], { l: 0.8, c: 0.15 }) +
      mascotBaseCss() +
      meshMascotSkin;
    const body =
      mascotHtml(cv, sections) +
      `<div class="mesh-bg" aria-hidden="true"></div>` +
      `<div class="mesh-progress" aria-hidden="true"></div>` +
      `<div class="mesh-card">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
