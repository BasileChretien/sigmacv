/**
 * Public-page showcase style — "Arcade".
 *
 * A bright RETRO 8-BIT PLATFORMER stage. The page is a parallax sky: drifting
 * pixel clouds in two depths, twinkling stars, spinning gold coins that bob, and
 * a scrolling tiled ground band along the bottom. The CV itself sits on a solid
 * cream "screen" panel (a chunky pixel-bordered card) so the body text stays
 * fully WCAG-AA legible over the busy animated background. The name is a bold
 * UPPERCASE display with a hard stepped "pixel" drop-shadow (system bold sans, no
 * web font); headings are chunky brick plates; entries POP/JUMP UP into place on
 * scroll with a bouncy spring. A coin-counter scroll-progress bar rides the top.
 * The user's accent tints the coin/score chrome. 100% CSS-ONLY → runs under the
 * strict public-page CSP (no JS, no external fonts/images; only data: + inline CSS).
 *
 * IP: an ORIGINAL genre homage — only generic platformer motifs (plain pixel
 * coins, plain stars, plain bricks, plain clouds, a plain ground). No characters,
 * no trademarked blocks/coins/pipes/logos.
 *
 * Guardrails: scroll reveals are gated behind `@supports (animation-timeline)`
 * and target headings + entries INDIVIDUALLY on small ranges (never the whole
 * tall section — the scroll-reveal trap). A full `prefers-reduced-motion`
 * fallback freezes every loop and reveals all content; the page is complete and
 * readable with motion off.
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

function arcadeCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    /* Inks chosen for AA on the cream "screen" panel (#fffdf3): ink ~16:1,
       muted #5a4a2e ~6.4:1, faint #6a5733 ~5.2:1 — so the small provenance /
       license / living / attribution / co-author footnotes (which inherit these)
       all clear AA, the exact failure mode this brief calls out. */
    --cv-ink:#231a0c; --cv-ink-2:#3c2f17; --cv-muted:#5a4a2e; --cv-faint:#6a5733;
    --cv-rule:#e7d8ad; --cv-rule-strong:#cab38b;
    --cv-page:#fffdf3;
    /* Bright primary platformer palette. */
    --sky-1:#5ec5ff; --sky-2:#9fe0ff; --sky-3:#cdf0ff;
    --brick:#d2502a; --brick-dk:#a23717; --brick-lt:#f07a4f;
    --coin:#ffcf33; --coin-dk:#e0a200; --coin-hi:#fff2b0;
    --grass:#3fb950; --grass-dk:#258a36; --pipe:#2f9e44;
    --cloud:#ffffff; --outline:#1d1606; --star:#fff6c0;
    /* The user's accent tints the score/coin chrome; falls back to coin gold. */
    --score: var(--cv-accent, var(--coin));
  }

  body {
    min-height:100vh; overflow-x:hidden;
    font-family: "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
    /* Parallax sky: a vertical blue gradient + soft sun glow, fixed so it reads
       as a far backdrop while the page scrolls. */
    background:
      radial-gradient(60% 42% at 82% 8%, #fff6c855 0%, transparent 60%),
      linear-gradient(180deg, var(--sky-1) 0%, var(--sky-2) 52%, var(--sky-3) 100%);
    background-attachment: fixed;
  }

  /* ===== Decorative sky layers (all aria-hidden) ========================== */
  .ar-sky { position:fixed; inset:0; z-index:0; pointer-events:none; overflow:hidden; }

  /* --- Twinkling pixel stars: one tiled dot field that fades in/out --------- */
  .ar-stars { position:absolute; inset:0;
    background-image:
      radial-gradient(1.5px 1.5px at 12% 18%, var(--star) 50%, transparent 52%),
      radial-gradient(1.5px 1.5px at 34% 9%, var(--star) 50%, transparent 52%),
      radial-gradient(1.5px 1.5px at 58% 22%, var(--star) 50%, transparent 52%),
      radial-gradient(1.5px 1.5px at 77% 12%, var(--star) 50%, transparent 52%),
      radial-gradient(1.5px 1.5px at 90% 26%, var(--star) 50%, transparent 52%),
      radial-gradient(1.5px 1.5px at 22% 34%, var(--star) 50%, transparent 52%),
      radial-gradient(1.5px 1.5px at 68% 38%, var(--star) 50%, transparent 52%);
    opacity:0.0; animation: ar-twinkle 3.6s ease-in-out infinite;
  }
  @keyframes ar-twinkle { 0%,100%{ opacity:0.15; } 50%{ opacity:0.85; } }

  /* --- Two cloud layers drifting at different speeds (parallax) ------------- */
  /* A cloud = chunky white blob built from layered radial gradients (pixel-ish,
     hard-edged). The strip is 200% wide and translates left, looping seamlessly. */
  .ar-clouds { position:absolute; left:0; right:0; height:0; }
  .ar-clouds i {
    position:absolute; display:block; width:200%; height:120px;
    background-repeat:no-repeat;
    background-image:
      radial-gradient(closest-side, var(--cloud) 96%, transparent 100%),
      radial-gradient(closest-side, var(--cloud) 96%, transparent 100%),
      radial-gradient(closest-side, var(--cloud) 96%, transparent 100%);
  }
  .ar-clouds-far  { top:13%; opacity:0.85; }
  .ar-clouds-far i  { height:90px;
    background-size: 150px 60px, 220px 84px, 120px 50px;
    background-position: 6% 60%, 30% 30%, 62% 70%;
    animation: ar-drift 60s linear infinite;
  }
  .ar-clouds-near { top:30%; opacity:0.95; }
  .ar-clouds-near i { height:130px;
    background-size: 230px 92px, 320px 120px, 180px 76px;
    background-position: 14% 50%, 48% 24%, 80% 64%;
    animation: ar-drift 34s linear infinite;
  }
  @keyframes ar-drift { from { transform: translateX(0); } to { transform: translateX(-50%); } }

  /* --- Floating bricks + spinning coins + a star, bobbing in the sky -------- */
  .ar-props { position:absolute; inset:0; }
  .ar-props span { position:absolute; display:block; }

  /* A chunky brick block: hard pixel-stepped highlight/shadow via box-shadow. */
  .ar-brick {
    width:34px; height:34px; background: var(--brick);
    box-shadow:
      inset 4px 4px 0 var(--brick-lt), inset -4px -4px 0 var(--brick-dk),
      0 0 0 3px var(--outline);
    animation: ar-bob 3.2s ease-in-out infinite;
  }
  /* A plain gold coin: a disc with a hard ring + a tiny inner notch. It flips on
     rotateY to fake an 8-bit spin (the disc thins to an edge at 90deg). */
  .ar-coin {
    width:30px; height:30px; border-radius:50%;
    background: radial-gradient(circle at 38% 34%, var(--coin-hi) 0 22%, var(--coin) 24% 60%, var(--coin-dk) 62%);
    box-shadow: 0 0 0 3px var(--coin-dk), 0 0 0 6px var(--outline), 0 0 14px 2px var(--score);
    animation: ar-spin 2.4s linear infinite, ar-bob 3.6s ease-in-out infinite;
  }
  /* A plain star, drawn with a CSS polygon clip (no glyph, no image). */
  .ar-star {
    width:30px; height:30px; background: var(--star);
    -webkit-clip-path: polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);
    clip-path: polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%);
    filter: drop-shadow(0 0 3px var(--coin-dk));
    animation: ar-bob 4.2s ease-in-out infinite, ar-twinkle 3s ease-in-out infinite;
  }
  .ar-p1 { top:20%; left:6%; }
  .ar-p2 { top:34%; right:7%; animation-delay:-1.2s; }
  .ar-p3 { top:58%; left:9%; animation-delay:-0.6s; }
  .ar-p4 { top:66%; right:10%; animation-delay:-1.8s; }
  .ar-p5 { top:46%; left:3%; animation-delay:-0.9s; }
  .ar-p6 { top:76%; right:4%; animation-delay:-2.4s; }
  @keyframes ar-bob  { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(-14px); } }
  @keyframes ar-spin { 0%{ transform: rotateY(0); } 100%{ transform: rotateY(360deg); } }

  /* --- Scrolling tiled ground band along the bottom ------------------------ */
  .ar-ground { position:fixed; left:0; right:0; bottom:0; height:74px; z-index:1; pointer-events:none; }
  /* Grass cap on top of a tiled dirt-brick strip. The brick pattern scrolls
     left to suggest forward motion through the level. */
  .ar-ground::before {
    content:""; position:absolute; left:0; right:0; top:0; height:14px;
    background: var(--grass);
    box-shadow: inset 0 5px 0 var(--grass-dk), 0 3px 0 var(--outline);
  }
  .ar-ground::after {
    content:""; position:absolute; left:-40px; right:-40px; top:14px; bottom:0;
    background:
      repeating-linear-gradient(90deg, var(--brick-dk) 0 2px, transparent 2px 40px),
      repeating-linear-gradient(0deg,  var(--brick-dk) 0 2px, transparent 2px 30px),
      var(--brick);
    background-size: 40px 30px, 40px 30px, auto;
    animation: ar-roll 6s linear infinite;
  }
  @keyframes ar-roll { from { transform: translateX(0); } to { transform: translateX(-40px); } }

  /* --- Coin-counter scroll-progress bar (top) ------------------------------ */
  @supports (animation-timeline: scroll()) {
    .ar-score {
      position:fixed; top:0; left:0; height:7px; width:100%; z-index:60;
      transform-origin:0 50%; transform:scaleX(0);
      background: linear-gradient(90deg, var(--score), var(--coin-hi));
      box-shadow: 0 1px 0 var(--outline), 0 0 12px var(--score);
      animation: ar-score linear both; animation-timeline: scroll(root);
    }
  }
  @keyframes ar-score { to { transform: scaleX(1); } }

  /* ===== The "screen" panel: the readable CV card ========================= */
  /* Solid cream card with a chunky pixel-stepped border (hard box-shadow steps)
     so body text never has to fight the animated sky. z-index lifts it clear of
     the ground/sky layers. */
  .cv {
    position:relative; z-index:5; max-width:780px;
    margin: clamp(40px,7vh,84px) auto clamp(96px,16vh,150px);
    padding: clamp(26px,4.5vw,46px) clamp(22px,4vw,44px) clamp(34px,5vw,52px);
    background: var(--cv-page);
    border-radius: 4px;
    /* Pixel-stepped frame: dark outline + a bright inset bevel + a hard drop. */
    box-shadow:
      0 0 0 4px var(--outline),
      0 0 0 8px var(--coin),
      0 0 0 12px var(--outline),
      14px 14px 0 0 rgba(29,22,6,0.30);
  }

  /* ===== Header: pixel name plate ========================================= */
  header.cv-header {
    margin-bottom: 1.7rem; padding-bottom: 1.1rem;
    border-bottom: 4px dashed var(--brick);
  }
  header.cv-header h1 {
    font-size: clamp(2.1rem, 6.5vw, 3.5rem); font-weight: 900; line-height: 1.02;
    letter-spacing: 0.01em; text-transform: uppercase; color: var(--brick);
    /* Hard stepped "pixel" drop-shadow → mimics a chunky bitmap font with a
       system bold sans (no web font allowed). */
    text-shadow:
      2px 0 var(--outline), 0 2px var(--outline), 2px 2px var(--outline),
      4px 4px 0 var(--coin), 6px 6px 0 var(--outline);
  }
  header.cv-header .cv-honorific { color: var(--brick); }
  header.cv-header .cv-headline {
    margin-top: 0.7rem; font-weight: 800; color: var(--cv-ink);
    text-transform: uppercase; letter-spacing: 0.04em; font-size: 1.05rem;
  }
  header.cv-header .cv-headline::before { content:"\\25B6  "; color: var(--grass-dk); }
  header.cv-header .cv-ids { color: var(--cv-muted); }
  header.cv-header .cv-ids a { color: var(--grass-dk); font-weight: 700; }
  header.cv-header .cv-contact, header.cv-header .cv-links { color: var(--cv-muted); }
  header.cv-header .cv-contact a, header.cv-header .cv-links a { color: var(--grass-dk); font-weight: 600; }
  header.cv-header .cv-summary { color: var(--cv-ink-2); }
  header.cv-header .cv-metrics { color: var(--cv-muted); }

  /* Self-name = coin gold with a hard pixel outline (legible: dark outline does
     the contrast work, gold is the accent fill). !important beats commonCss. */
  .cv-self {
    color: var(--coin) !important; font-weight: 900;
    text-shadow: 1.5px 0 var(--outline), -1.5px 0 var(--outline), 0 1.5px var(--outline), 0 -1.5px var(--outline), 1.5px 1.5px 0 var(--coin-dk);
  }

  /* Photo: framed like a collectible token with a chunky pixel border. */
  .cv-photo {
    width:116px; height:116px; border-radius:6px; object-fit:cover;
    box-shadow: 0 0 0 4px var(--outline), 0 0 0 8px var(--coin), 6px 6px 0 rgba(29,22,6,0.28);
  }

  /* ===== Sections: chunky brick-plate headings ============================ */
  section.cv-section { margin-top: 2.2rem; }
  section.cv-section > h2 {
    display:inline-block; margin:0 0 1rem; padding:0.4em 0.85em;
    font-size:0.82rem; font-weight:900; text-transform:uppercase; letter-spacing:0.12em;
    color:#fff; background: var(--brick);
    border-radius:3px;
    /* Pixel-bevel brick plate. */
    box-shadow:
      inset 3px 3px 0 var(--brick-lt), inset -3px -3px 0 var(--brick-dk),
      0 0 0 3px var(--outline), 4px 4px 0 rgba(29,22,6,0.25);
    text-shadow: 0 1px 0 var(--brick-dk);
  }
  /* Alternate plates through the level: brick / pipe-green / coin-gold. */
  section.cv-section:nth-of-type(3n+2) > h2 {
    background: var(--pipe);
    box-shadow: inset 3px 3px 0 #5ed27a, inset -3px -3px 0 var(--grass-dk), 0 0 0 3px var(--outline), 4px 4px 0 rgba(29,22,6,0.25);
    text-shadow: 0 1px 0 var(--grass-dk);
  }
  section.cv-section:nth-of-type(3n+3) > h2 {
    background: var(--coin); color: var(--outline);
    box-shadow: inset 3px 3px 0 var(--coin-hi), inset -3px -3px 0 var(--coin-dk), 0 0 0 3px var(--outline), 4px 4px 0 rgba(29,22,6,0.25);
    text-shadow: none;
  }

  /* ===== Entries: coin bullets, grass-green links ========================= */
  ol.cv-bib > li { position:relative; padding-left:1.7em; text-indent:0; }
  ol.cv-bib > li::before {
    content:""; position:absolute; left:0; top:0.34em; width:13px; height:13px; border-radius:50%;
    background: radial-gradient(circle at 38% 34%, var(--coin-hi) 0 26%, var(--coin) 28% 58%, var(--coin-dk) 60%);
    box-shadow: 0 0 0 2px var(--outline);
  }
  ol.cv-bib > li a {
    color: var(--grass-dk); font-weight: 600;
    text-decoration: underline; text-decoration-color: var(--grass);
    text-decoration-thickness: 0.16em; text-underline-offset: 0.16em;
  }
  ol.cv-bib > li a:hover { color: var(--brick-dk); text-decoration-color: var(--brick); }
  .cv-prose-body p, ul.cv-prose-list > li { color: var(--cv-ink-2); }
  .cv-ror-link:hover { color: var(--brick-dk); border-bottom-color: var(--brick); }

  /* ===== Footers — quiet but AA on the cream panel ======================== */
  .cv-provenance { border-top: 3px dotted var(--brick); color: var(--cv-faint); }
  .cv-license, .cv-attribution { color: var(--cv-faint); }
  .cv-living { color: var(--cv-muted); }
  .cv-license a { color: var(--grass-dk); }
  .cv-attribution a { color: var(--brick-dk); font-weight: 700; }
  .cv-coauthors-h { color: var(--cv-muted); }
  .cv-coauthors-list a { color: var(--grass-dk); font-weight: 600; }

  /* ===== Motion: POP / JUMP UP reveals (gated, per heading + entry) ======= */
  /* Bouncy spring overshoot so each heading + entry "jumps up" into place. */
  @keyframes ar-pop { from { opacity:0; transform: translateY(34px) scale(0.92); } to { opacity:1; transform:none; } }
  @keyframes ar-hop { from { opacity:0; transform: translateY(22px); } to { opacity:1; transform:none; } }

  @supports (animation-timeline: view()) {
    /* Per heading + each entry on their OWN small geometry — NEVER the whole
       tall section (a tall Publications section animated as one block would stay
       hidden at its top while its first entries are already being read; the
       scroll-driven range scales with element height). */
    section.cv-section > h2, .cv-prose-body > * {
      animation: ar-pop cubic-bezier(0.34, 1.6, 0.5, 1) both;
      animation-timeline: view(); animation-range: cover 0% cover 11%;
    }
    ol.cv-bib > li {
      animation: ar-hop cubic-bezier(0.34, 1.5, 0.6, 1) both;
      animation-timeline: view(); animation-range: entry 0% entry 52%;
    }
  }

  /* ===== Reduced motion: freeze every loop, reveal everything ============= */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; }
    section.cv-section > h2, ol.cv-bib > li, .cv-prose-body > * {
      opacity:1 !important; transform:none !important; filter:none !important;
    }
    .ar-stars { opacity:0.4; }
    .ar-score { display:none; }
  }

  @media (max-width: 560px) {
    .cv { box-shadow: 0 0 0 3px var(--outline), 0 0 0 6px var(--coin), 0 0 0 9px var(--outline); }
    .ar-props .ar-p1, .ar-props .ar-p2 { display:none; }
  }

  /* The animated sky/ground are screen-only chrome; print is the clean panel. */
  @media print {
    .ar-sky, .ar-ground, .ar-score { display:none !important; }
    .cv { box-shadow:none; margin:0; padding:0; max-width:none; }
    header.cv-header h1 { text-shadow:none; }
    .cv-self { text-shadow:none; }
  }`;
}

const arcadeMascotSkin = `
  /* ===== Arcade mascot: chunky 8-bit coin-character pixel sprite ============
     Markup: <div class="sm"><b class="sm-fig"><u class="sm-deco"></u><i class="sm-hat …">…</i></b></div>
     - .sm-fig        = the BODY (coin-gold square with hard pixel outline + feet)
     - .sm-fig::before = white Σ glyph (readable SigmaCV badge)
     - .sm-fig::after  = two stubby FEET (dark pixel squares)
     - .sm-deco        = eye band behind the hat
     - .sm-deco::before/.sm-deco::after = two small black pixel eyes
  ========================================================================= */

  /* Body: coin-gold (#ffd23f) rectangle, hard 3px black pixel outline,
     chunky diagonal hard-shadow, pixelated rendering so nothing anti-aliases. */
  .sm-fig {
    width: 38px; height: 38px;
    background:
      /* bright highlight strip top-left (faked 8-bit specular) */
      linear-gradient(135deg, #ffe97a 0% 18%, transparent 19%),
      /* base coin gold */
      #ffd23f;
    border-radius: 5px;
    image-rendering: pixelated;
    /* 3-layer pixel outline: hard black ring + offset hard drop-shadow */
    box-shadow:
      0 0 0 3px #1b1b1b,
      5px 5px 0 3px rgba(0, 0, 0, 0.28),
      /* inner bevel — 1px lighter gold on top-left, darker on bottom-right */
      inset 2px 2px 0 #ffe97a,
      inset -2px -2px 0 #c9920a;
    /* subtle idle idle bounce */
    animation: sm-arcade-bob 1.8s ease-in-out infinite;
  }

  @keyframes sm-arcade-bob {
    0%, 100% { transform: translateY(0px);  }
    50%       { transform: translateY(-5px); }
  }

  /* Σ glyph: white, bold, hard 1px pixel drop-shadow (no blur = pixel-art) */
  .sm-fig::before {
    /* content / font-size / position come from mascotBaseCss; we override style only.
       Dark glyph on the gold coin: white read at only 1.44:1 (WCAG 3:1 graphic
       floor); near-black on #ffd23f is ~11.8:1. */
    color: #1b1b1b;
    font-weight: 900;
    /* hard stepped pixel highlight (light staircase) keeps the 8-bit look on the dark glyph */
    text-shadow:
      1px 0   #ffe97a,
      0   1px #ffe97a,
      1px 1px #ffe97a,
      2px 2px rgba(255, 233, 122, 0.6);
    /* keep it square-center on the body */
    font-size: 1.1rem;
    line-height: 1;
  }

  /* Two stubby feet: a wide dark bar split in two by a gap,
     rendered as a hard-edged box-shadow sequence (no extra elements needed). */
  .sm-fig::after {
    content: "";
    position: absolute;
    bottom: -7px; left: 6px;
    width: 8px; height: 6px;
    background: #1b1b1b;
    border-radius: 0 0 2px 2px;
    /* second foot via box-shadow offset */
    box-shadow: 14px 0 0 #1b1b1b;
  }

  /* Eye band: a thin horizontal bar across the upper third of the body,
     sitting just below the hat. No background — acts only as an anchor
     for the ::before and ::after pseudo-eyes. */
  .sm-deco {
    position: absolute;
    top: 10px; left: 0; right: 0;
    height: 8px;
    pointer-events: none;
  }

  /* Left eye: a chunky 6×6px black pixel square */
  .sm-deco::before {
    content: "";
    position: absolute;
    top: 0; left: 6px;
    width: 6px; height: 6px;
    background: #1b1b1b;
    border-radius: 1px;
    /* tiny 1px white pixel highlight in top-right corner */
    box-shadow: 3px -2px 0 1px #ffffff;
  }

  /* Right eye: mirrored */
  .sm-deco::after {
    content: "";
    position: absolute;
    top: 0; right: 6px;
    width: 6px; height: 6px;
    background: #1b1b1b;
    border-radius: 1px;
    box-shadow: -3px -2px 0 1px #ffffff;
  }

  /* Reduced-motion: freeze the bob */
  @media (prefers-reduced-motion: reduce) {
    .sm-fig { animation: none !important; }
  }

  /* Mobile: scale down slightly so it doesn't crowd the narrow viewport */
  @media (max-width: 480px) {
    .sm-fig { width: 32px; height: 32px; }
    .sm-fig::before { font-size: 0.95rem; }
  }`;

export const arcadeTemplate: CvTemplate = {
  key: "arcade",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + arcadeCss(theme) + mascotBaseCss() + arcadeMascotSkin;
    const body =
      mascotHtml(cv, sections) +
      `<div class="ar-sky" aria-hidden="true">` +
      `<div class="ar-stars"></div>` +
      `<div class="ar-clouds ar-clouds-far"><i></i></div>` +
      `<div class="ar-clouds ar-clouds-near"><i></i></div>` +
      `<div class="ar-props">` +
      `<span class="ar-brick ar-p1"></span>` +
      `<span class="ar-coin ar-p2"></span>` +
      `<span class="ar-star ar-p3"></span>` +
      `<span class="ar-coin ar-p4"></span>` +
      `<span class="ar-brick ar-p5"></span>` +
      `<span class="ar-coin ar-p6"></span>` +
      `</div>` +
      `</div>` +
      `<div class="ar-ground" aria-hidden="true"></div>` +
      `<div class="ar-score" aria-hidden="true"></div>` +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
