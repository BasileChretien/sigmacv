/**
 * Public-page showcase style — "Clockwork".
 * A steampunk stage: a dark brass-and-iron room where electric cords HANG from a
 * ceiling rail with glowing Edison bulbs that gently SWAY, two brass gears turn
 * slowly behind the page, the name is set on an engraved brass nameplate, and
 * each entry is marked with a rivet. Warm parchment text on dark iron; brass and
 * copper chrome; the user's accent tints the bulb glow + self-name. 100% CSS-ONLY
 * → runs under the strict public-page CSP (no JS, no external assets).
 *
 * Guardrails: scroll reveals target headings + entries individually (never the
 * whole tall section — the scroll-reveal trap); the hanging cords/bulbs/gears are
 * decorative (aria-hidden) and a full `prefers-reduced-motion` fallback freezes
 * all motion while keeping every element visible.
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

function clockworkCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: dark;
    /* Warm parchment inks on dark iron — all WCAG-AA on #15110c (faint #a3906f
       ≈ 6:1; the small provenance/license/living/attribution footnotes inherit
       these, the failure mode this style guards). */
    --cv-ink:#ece0c8; --cv-ink-2:#cdbd9e; --cv-muted:#b3a384; --cv-faint:#a3906f;
    --cv-rule: rgba(201,164,76,0.22); --cv-rule-strong: rgba(201,164,76,0.42); --cv-page:#15110c;
    --brass:#c9a44c; --brass-lt:#e7c878; --brass-deep:#8a6d2e; --copper:#b87333;
    --iron:#2a2118; --bulb:#ffd27a;
    /* Warm bulb halo, tinted by the user's accent so the lamps pick up their colour. */
    --ck-glow: color-mix(in srgb, var(--cv-accent) 45%, #ffb347);
  }
  body {
    min-height:100vh; color:var(--cv-ink);
    font-family: ui-serif, "Hoefler Text", Georgia, "Times New Roman", serif;
    background:
      radial-gradient(120% 80% at 50% -10%, #241b10 0%, transparent 55%),
      radial-gradient(90% 60% at 50% 120%, #1d160d 0%, transparent 60%),
      #15110c;
    background-attachment: fixed;
  }
  /* Faint riveted-metal texture — a sparse brass dot grid, no image. */
  body::before {
    content:""; position:fixed; inset:0; z-index:0; pointer-events:none; opacity:0.6;
    background-image: radial-gradient(rgba(201,164,76,0.05) 1px, transparent 1.5px);
    background-size: 26px 26px;
  }
  .cv { position:relative; z-index:2; max-width:820px; padding: clamp(225px, 28vh, 280px) clamp(24px,5vw,52px) 16vh; }

  /* ---- The ceiling rail + hanging electric cords (the centrepiece) -------- */
  .ck-rail {
    position:absolute; top:0; left:0; right:0; height:11px; z-index:3;
    background: linear-gradient(#4a3a20, var(--brass-deep) 45%, #3a2c18);
    border-bottom:1px solid rgba(0,0,0,0.55);
    box-shadow: 0 3px 8px rgba(0,0,0,0.55), inset 0 1px 0 rgba(231,200,120,0.5);
  }
  /* Rivets along the rail. */
  .ck-rail::after {
    content:""; position:absolute; left:0; right:0; top:3px; height:5px;
    background-image: radial-gradient(circle, var(--brass-lt) 0 1.5px, transparent 2px);
    background-size: 38px 5px; opacity:0.7;
  }
  .ck-cords { position:absolute; top:11px; left:0; right:0; height:0; z-index:3; pointer-events:none; }
  .ck-cord {
    position:absolute; top:0; width:3px; transform-origin: top center; border-radius:0 0 2px 2px;
    background: linear-gradient(#241a10, #160f08);
  }
  /* Brass socket that joins the cord to the bulb. */
  .ck-cord::before {
    content:""; position:absolute; left:50%; bottom:-9px; transform:translateX(-50%);
    width:11px; height:13px; border-radius:2px 2px 3px 3px;
    background: linear-gradient(var(--brass-lt), var(--brass-deep));
    box-shadow: inset 0 0 0 1px rgba(0,0,0,0.3);
  }
  /* The glowing Edison bulb. */
  .ck-cord::after {
    content:""; position:absolute; left:50%; bottom:-30px; transform:translateX(-50%);
    width:21px; height:29px; border-radius:46% 46% 50% 50% / 38% 38% 62% 62%;
    background: radial-gradient(circle at 50% 36%, #fff7da 0%, var(--bulb) 42%, #c07c22 78%, #7c4a12 100%);
    box-shadow: 0 0 16px 4px rgba(255,185,95,0.5), 0 0 44px 14px var(--ck-glow);
  }
  .ck-c1 { left:13%; height:120px; animation: ck-sway 6.6s ease-in-out infinite; }
  .ck-c2 { left:50%; height:178px; animation: ck-sway 8.6s ease-in-out infinite; animation-delay:-2.1s; }
  .ck-c3 { left:84%; height:142px; animation: ck-sway 7.3s ease-in-out infinite; animation-delay:-1.1s; }
  .ck-c1::after { animation: ck-flicker 5.5s steps(24) infinite; }
  .ck-c2::after { animation: ck-flicker 6.7s steps(24) infinite; animation-delay:-1.6s; }
  .ck-c3::after { animation: ck-flicker 5.9s steps(24) infinite; animation-delay:-3s; }
  @keyframes ck-sway { 0%,100%{ transform: rotate(-2.4deg); } 50%{ transform: rotate(2.4deg); } }
  @keyframes ck-flicker { 0%,100%{opacity:1} 44%{opacity:0.82} 47%{opacity:1} 71%{opacity:0.9} 74%{opacity:1} }

  /* ---- Slow brass gears behind the page (ambient) ------------------------ */
  .ck-gear { position:fixed; z-index:1; opacity:0.14; pointer-events:none; }
  .ck-gear::before {
    content:""; position:absolute; inset:0; border-radius:50%;
    background: repeating-conic-gradient(var(--brass) 0deg 9deg, transparent 9deg 22.5deg);
    -webkit-mask: radial-gradient(transparent 55%, #000 57% 73%, transparent 75%);
    mask: radial-gradient(transparent 55%, #000 57% 73%, transparent 75%);
  }
  .ck-gear::after {
    content:""; position:absolute; inset:19%; border-radius:50%;
    background: radial-gradient(circle at 38% 34%, var(--brass-lt), var(--brass-deep) 72%);
    box-shadow: inset 0 0 0 3px rgba(0,0,0,0.35), inset 0 0 0 7px rgba(231,200,120,0.18);
  }
  .ck-gear-a { width:300px; height:300px; left:-92px; bottom:-92px; animation: ck-spin 64s linear infinite; }
  .ck-gear-b { width:196px; height:196px; right:-70px; top:16%; animation: ck-spin 47s linear infinite reverse; }
  @keyframes ck-spin { to { transform: rotate(360deg); } }

  /* ---- Header: engraved brass nameplate ---------------------------------- */
  header.cv-header { position:relative; margin-bottom:2.4rem; padding-bottom:1.5rem; border-bottom:2px solid var(--brass-deep); }
  header.cv-header h1 {
    font-size: clamp(2.3rem, 6vw, 3.9rem); font-weight:800; letter-spacing:0.005em; line-height:1.04;
    color: var(--brass-lt); text-wrap: balance;
  }
  @supports ((background-clip:text) or (-webkit-background-clip:text)) {
    header.cv-header h1 {
      background: linear-gradient(180deg, #f6e6b6 0%, var(--brass) 46%, #876a2d 100%);
      -webkit-background-clip:text; background-clip:text; color:transparent;
      filter: drop-shadow(0 1px 1px rgba(0,0,0,0.6));
    }
  }
  header.cv-header .cv-honorific { color: var(--brass); font-weight:700; }
  header.cv-header .cv-headline { font-style:italic; font-weight:400; color:var(--cv-ink-2); margin-top:0.5rem; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a { color: var(--brass-lt); }
  header.cv-header .cv-summary { color: var(--cv-ink-2); max-width:62ch; }
  .cv-self {
    color:#fff3d6 !important; font-weight:800;
    text-shadow: 0 0 10px var(--ck-glow), 0 0 2px rgba(255,225,160,0.6);
  }
  .cv-photo {
    width:120px; height:120px; border-radius:50%; object-fit:cover;
    border:3px solid var(--brass-deep);
    box-shadow: 0 0 0 2px #110c07, 0 0 24px -4px var(--ck-glow), inset 0 0 0 1px var(--brass-lt);
    filter: sepia(0.4) contrast(1.05) brightness(0.98);
  }

  /* ---- Sections: brass plate headings + rivet bullets -------------------- */
  section.cv-section { margin-top:2.6rem; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; display:flex; align-items:center; gap:0.65em;
    font-size:0.86rem; font-weight:700; text-transform:uppercase; letter-spacing:0.2em;
    color: var(--brass-lt); margin:0 0 1rem; padding-bottom:0.55rem;
  }
  /* A small brass cog/rivet before each heading. */
  section.cv-section > h2::before {
    content:""; flex:none; width:0.82em; height:0.82em; border-radius:50%;
    background: radial-gradient(circle at 40% 34%, var(--brass-lt), var(--brass-deep) 72%);
    box-shadow: 0 0 0 2px rgba(201,164,76,0.22), inset 0 0 0 2px rgba(0,0,0,0.25);
  }
  /* Brass underline (accent-led segment), drawn in on reveal. */
  section.cv-section > h2::after {
    content:""; position:absolute; left:0; bottom:0; width:100%; height:2px; transform-origin:0 50%;
    background: linear-gradient(90deg, var(--brass) 0 2.6rem, var(--cv-rule) 2.6rem);
  }
  ol.cv-bib > li { position:relative; }
  ol.cv-bib > li::before {
    content:""; position:absolute; left:calc(var(--cv-hang) * -1); top:0.52em;
    width:7px; height:7px; border-radius:50%;
    background: radial-gradient(circle at 40% 34%, var(--brass-lt), var(--copper) 78%);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.4);
  }
  ol.cv-bib > li a { color: var(--brass-lt); text-decoration:none; border-bottom:1px solid rgba(201,164,76,0.32); }
  ol.cv-bib > li a:hover { border-bottom-color: var(--brass-lt); }
  .cv-prose-body p, ul.cv-prose-list > li { color: var(--cv-ink-2); }

  /* Footers — quiet but AA-legible; co-author + reuse links stay brass. */
  .cv-provenance, .cv-license, .cv-attribution { color: var(--cv-faint); }
  .cv-living { color: var(--cv-muted); }
  .cv-attribution a, .cv-license a, .cv-coauthors-list a { color: var(--brass-lt); }

  /* ---- Motion: mechanical stamp-in (gated, per heading + entry) ---------- */
  @keyframes ck-stamp { from { opacity:0; transform: translateY(-8px) rotate(-1.4deg) scale(0.98); } to { opacity:1; transform:none; } }
  @keyframes ck-rise { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform:none; } }
  @keyframes ck-draw { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @supports (animation-timeline: view()) {
    section.cv-section > h2, .cv-summary-block > .cv-summary-h {
      animation: ck-stamp cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 12%;
    }
    section.cv-section > h2::after {
      animation: ck-draw cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 2% cover 16%;
    }
    ol.cv-bib > li {
      animation: ck-rise ease-out both;
      animation-timeline: view(); animation-range: entry 0% cover 14%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; }
    section.cv-section > h2, ol.cv-bib > li { opacity:1 !important; transform:none !important; filter:none !important; }
    section.cv-section > h2::after { transform: scaleX(1) !important; }
    .ck-cord { transform: rotate(0) !important; }
  }

  @media (max-width: 560px) {
    .ck-c1 { left:16%; height:92px; } .ck-c2 { left:50%; height:122px; } .ck-c3 { left:82%; height:106px; }
    .cv { padding-top: 172px; }
    .ck-gear-b { display:none; }
  }

  @media print {
    .ck-rail, .ck-cords, .ck-gear { display:none !important; }
    body::before { display:none; }
    .cv { padding:0; max-width:none; }
  }`;
}

const clockworkMascotSkin = `
  /* === Clockwork mascot: a cast-brass wind-up automaton === */

  /* Body — lathe-turned brass cylinder with metallic sheen */
  .sm-fig {
    width: 38px; height: 38px;
    background:
      radial-gradient(ellipse 55% 35% at 36% 28%, rgba(255,245,200,0.55) 0%, transparent 60%),
      radial-gradient(circle at 52% 52%, #e7c878 0%, #c9a44c 38%, #a07830 62%, #6b4e1a 86%, #3d2a0a 100%);
    border-radius: 50%;
    border: 2px solid #5c3d10;
    box-shadow:
      /* outer dark rim (iron bezel) */
      0 0 0 3px #2a1d08,
      /* thin brass highlight ring */
      0 0 0 4.5px #c9a44c,
      /* warm copper glow halo */
      0 0 18px 5px rgba(184,115,51,0.55),
      /* drop shadow */
      0 7px 18px -4px rgba(0,0,0,0.75),
      /* inner top-left polish sheen */
      inset 0 2px 4px rgba(255,240,180,0.45),
      /* inner bottom-right depth */
      inset 0 -3px 6px rgba(0,0,0,0.45);
    filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
  }

  /* Σ — stamped/engraved into the brass (inset shadow = recessed chisel mark) */
  .sm-fig::before {
    color: #3d2508;
    text-shadow:
      /* emboss: dark groove */
      0 1px 0 rgba(0,0,0,0.85),
      0 -1px 0 rgba(0,0,0,0.5),
      /* highlight: tiny brass ridge on top-left edge of groove */
      -1px -1px 0 rgba(231,200,120,0.5),
      /* subtle warm inner glow so Σ stays readable at 40px */
      0 0 3px rgba(100,55,10,0.3);
    font-weight: 900;
  }

  /* Feet — two brass rivet studs */
  .sm-fig::after {
    content: "";
    position: absolute;
    bottom: -7px; left: 50%; transform: translateX(-50%);
    width: 22px; height: 7px;
    background:
      radial-gradient(circle at 30% 35%, #e7c878, #8a6d2e 70%) no-repeat 0 0 / 8px 7px,
      radial-gradient(circle at 30% 35%, #e7c878, #8a6d2e 70%) no-repeat 14px 0 / 8px 7px;
    filter: drop-shadow(0 2px 2px rgba(0,0,0,0.6));
  }

  /* Bezel / rivet ring — a decorative ring of brass studs around the body */
  .sm-deco {
    position: absolute;
    inset: -6px;
    border-radius: 50%;
    /* 8-stud ring via repeating-conic-gradient dot trick */
    background:
      repeating-conic-gradient(
        transparent 0deg 41deg,
        rgba(231,200,120,0.0) 41deg 44deg,
        transparent 44deg 45deg
      );
    /* The actual studs: sparse radial dots on a conic path */
    box-shadow:
      /* 8 evenly-spaced rivet highlights (clock positions: 12,1:30,3,4:30,6,7:30,9,10:30) */
       0  -15px  0 -4.5px #e7c878,
      10px -11px 0 -4.5px #c9a44c,
      15px   0   0 -4.5px #e7c878,
      10px  11px 0 -4.5px #c9a44c,
       0   15px  0 -4.5px #e7c878,
     -10px  11px 0 -4.5px #c9a44c,
     -15px   0   0 -4.5px #e7c878,
     -10px -11px 0 -4.5px #c9a44c;
    pointer-events: none;
    animation: ck-mascot-tick 8s steps(8, end) infinite;
  }
  /* Subtle copper rim that ties the stud ring together */
  .sm-deco::before {
    content: "";
    position: absolute; inset: 3px; border-radius: 50%;
    border: 1px solid rgba(184,115,51,0.35);
    box-shadow: 0 0 0 1px rgba(100,55,10,0.25) inset;
  }
  /* Outer warm glow ring (copper warmth) */
  .sm-deco::after {
    content: "";
    position: absolute; inset: -3px; border-radius: 50%;
    box-shadow: 0 0 12px 2px rgba(184,115,51,0.28), 0 0 24px 6px rgba(201,164,76,0.12);
    pointer-events: none;
  }

  /* Tick: the rivet ring rotates one stud-step at a time — mechanical feel */
  @keyframes ck-mascot-tick {
    from { transform: rotate(0deg);   }
    to   { transform: rotate(360deg); }
  }
  @media (prefers-reduced-motion: reduce) {
    .sm-deco { animation: none !important; }
  }`;

export const clockworkTemplate: CvTemplate = {
  key: "clockwork",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + clockworkCss(theme) + mascotBaseCss() + clockworkMascotSkin;
    const body =
      mascotHtml(cv, sections) +
      `<div class="ck-rail" aria-hidden="true"></div>` +
      `<div class="ck-cords" aria-hidden="true"><span class="ck-cord ck-c1"></span><span class="ck-cord ck-c2"></span><span class="ck-cord ck-c3"></span></div>` +
      `<div class="ck-gear ck-gear-a" aria-hidden="true"></div>` +
      `<div class="ck-gear ck-gear-b" aria-hidden="true"></div>` +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
