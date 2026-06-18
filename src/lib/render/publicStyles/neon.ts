/**
 * Public-page showcase style — "Neon".
 * A cool-video-game arcade screen rendered in a fixed PINK + CYAN neon palette
 * (CSS-ONLY, no JS / no external assets — legal under the strict public-page CSP):
 *
 *   • SCREEN HUD — glowing pink corner brackets pinned to the viewport + faint
 *     rolling CRT scanlines over everything, so it reads like an in-game screen.
 *   • TRON GRID FLOOR — a pink/cyan perspective grid recedes toward the horizon
 *     and scrolls toward you, behind a drifting back-wall grid.
 *   • FALLING PANELS — each entry drops in from above, overshoots and settles,
 *     with a "power-on" glow flash + a light running down its left tube; hover
 *     lifts and re-lights it like a selected menu item.
 *   • IGNITING HEADER — a neon-tube frame flickers on like a sign powering up,
 *     with a bright arc of light running around it; the name flickers + surges.
 *   • AMBIENT LIFE — rising neon sparks, a sweeping light scanline, a pulsing
 *     room-edge glow, and a multicolour-free pink/cyan spark field.
 *
 * Palette is a FIXED pink-led arcade duotone (pink #ff2db4 + cyan), deliberately
 * NOT account-accent-derived — the neon identity is the pink/cyan look. Distinct
 * from Cyberpunk (rainstorm + glitch) and Synthwave (sunset racer). Guardrails:
 * the body copy stays crisp #eaf6ff and never moves while read; faint footnotes
 * ride --cv-faint ≈ 7.6:1; `prefers-reduced-motion` freezes all motion + hides
 * the moving ambient layers.
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

function neonCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: dark;
    /* --cv-faint lifted from #6f7c8f to #9aa7ba (≈7.6:1 on #0a0a0e) so the small
       footnotes stay AA-legible with all the drifting glow behind the content. */
    --cv-ink:#eaf6ff; --cv-ink-2:#b9c6d6; --cv-muted:#8a98ab; --cv-faint:#9aa7ba;
    --cv-rule: rgba(255,255,255,0.12); --cv-rule-strong: rgba(255,255,255,0.24); --cv-page:#0a0a0e;
    /* Fixed PINK + CYAN arcade palette (pink leads) — no rainbow cycling. */
    --n1:#ff2db4; --n2:#28e0ff; --n3:#ff5ecf; --n4:#28e0ff; --n5:#ff8ad9;
  }
  body { min-height:100vh; overflow-x:hidden; color:var(--cv-ink); background:#0a0a0e;
    background-image: radial-gradient(120% 80% at 50% -12%, #1b1426 0%, #0a0a0e 62%); }
  /* The reading column sits above every animated layer (z 3). All the motion
     below is decorative and lives behind it, so the body copy never moves or
     loses contrast while it is being read. */
  .cv { position:relative; z-index:3; max-width: 840px; padding: 56px 56px 120px; }

  /* ---- Ambient: a drifting, breathing NEON-tube grid (cyan + magenta) ----- */
  .neon-wall { position:fixed; inset:0; z-index:0; pointer-events:none;
    background-image:
      linear-gradient(rgba(99,180,255,0.06) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,99,200,0.055) 1px, transparent 1px);
    background-size: 88px 88px;
    -webkit-mask-image: radial-gradient(120% 92% at 50% 18%, #000 0%, transparent 82%);
    mask-image: radial-gradient(120% 92% at 50% 18%, #000 0%, transparent 82%);
    animation: neon-wall-drift 22s linear infinite, neon-wall-breathe 7s ease-in-out infinite; }
  @keyframes neon-wall-drift { to { background-position: 88px 88px, 88px 88px; } }
  @keyframes neon-wall-breathe { 0%,100% { opacity:0.4; } 50% { opacity:0.72; } }

  /* ---- Ambient: neon sparks drifting upward (embers catching the signs) ---- */
  .neon-sparks { position:fixed; inset:0; z-index:0; pointer-events:none; opacity:0.68; mix-blend-mode:screen;
    background-image:
      radial-gradient(2px 2px at 12% 92%, var(--n2), transparent 60%),
      radial-gradient(2px 2px at 28% 72%, var(--n1), transparent 60%),
      radial-gradient(1.5px 1.5px at 46% 86%, var(--n4), transparent 60%),
      radial-gradient(2px 2px at 63% 60%, var(--n2), transparent 60%),
      radial-gradient(1.5px 1.5px at 78% 82%, var(--n3), transparent 60%),
      radial-gradient(2px 2px at 90% 66%, var(--n5), transparent 60%);
    background-size: 100% 760px;
    -webkit-mask-image: linear-gradient(to top, transparent, #000 22%, #000 78%, transparent);
    mask-image: linear-gradient(to top, transparent, #000 22%, #000 78%, transparent);
    animation: neon-sparks-rise 13s linear infinite; }
  @keyframes neon-sparks-rise { to { background-position: 0 -760px; } }

  /* ---- Ambient: a soft scanline of light sweeping down the wall ------------ */
  .neon-sweep { position:fixed; left:0; right:0; top:0; height:32vh; z-index:1; pointer-events:none; mix-blend-mode:screen; opacity:0.7;
    background: linear-gradient(180deg, transparent, rgba(120,200,255,0.14) 46%, rgba(180,230,255,0.22) 50%, rgba(120,200,255,0.14) 54%, transparent);
    animation: neon-sweep-move 7s linear infinite; }
  @keyframes neon-sweep-move { 0% { transform: translateY(-40vh); } 100% { transform: translateY(150vh); } }

  /* ---- Neon room-glow: the whole page edges bathed in pulsing neon --------- */
  .neon-room { position:fixed; inset:0; z-index:2; pointer-events:none;
    box-shadow: inset 0 0 150px -50px var(--n1), inset 0 0 260px -120px var(--n3), inset 0 0 90px -40px var(--n2);
    animation: neon-room-breathe 8s ease-in-out infinite; }
  @keyframes neon-room-breathe { 0%,100% { opacity:0.75; } 50% { opacity:1; } }

  /* ---- Tron perspective GRID FLOOR receding toward the horizon ------------- */
  .neon-floor { position:fixed; left:-50%; right:-50%; bottom:-12vh; height:48vh; z-index:0; pointer-events:none; opacity:0.55;
    background-image: linear-gradient(rgba(40,224,255,0.5) 2px, transparent 2px), linear-gradient(90deg, rgba(255,45,180,0.5) 2px, transparent 2px);
    background-size: 62px 62px;
    transform: perspective(300px) rotateX(74deg); transform-origin: bottom center;
    -webkit-mask-image: linear-gradient(to top, #000 6%, transparent 82%); mask-image: linear-gradient(to top, #000 6%, transparent 82%);
    animation: neon-floor-scroll 1.5s linear infinite; }
  @keyframes neon-floor-scroll { to { background-position: 0 62px, 0 0; } }

  /* ---- CRT scanlines rolling over the whole screen (faint — stays legible) - */
  .neon-crt { position:fixed; inset:0; z-index:50; pointer-events:none; opacity:0.5;
    background: repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,0.13) 2px 3px);
    animation: neon-crt-roll 9s linear infinite; }
  @keyframes neon-crt-roll { to { background-position: 0 90px; } }

  /* ---- Video-game HUD: glowing pink corner brackets pinned to the screen --- */
  .neon-hud { position:fixed; inset:16px; z-index:55; pointer-events:none; animation: neon-hud-pulse 3.2s ease-in-out infinite; }
  .neon-hud span { position:absolute; width:26px; height:26px; border:2px solid var(--n1); box-shadow:0 0 10px var(--n1); }
  .neon-hud span:nth-child(1) { top:0; left:0; border-right:0; border-bottom:0; }
  .neon-hud span:nth-child(2) { top:0; right:0; border-left:0; border-bottom:0; }
  .neon-hud span:nth-child(3) { bottom:0; left:0; border-right:0; border-top:0; }
  .neon-hud span:nth-child(4) { bottom:0; right:0; border-left:0; border-top:0; }
  @keyframes neon-hud-pulse { 0%,100% { opacity:0.85; } 50% { opacity:0.5; } }

  /* ---- Header: a neon-tube FRAME that ignites like a sign powering on ------ */
  header.cv-header { position:relative; margin-bottom: 2.4rem; padding: 1.4rem 1.55rem 1.45rem; }
  header.cv-header::before { content:""; position:absolute; inset:0; border-radius:14px; pointer-events:none;
    border:1.5px solid var(--n1);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.35), 0 0 22px -3px var(--n1), inset 0 0 30px -16px var(--n1);
    animation: neon-ignite 1.3s steps(1) both, neon-frame-buzz 5s ease-in-out 1.3s infinite; }
  @keyframes neon-ignite {
    0%,7%,15% { opacity:0; }
    9%,13%,21% { opacity:1; }
    23% { opacity:0.35; }
    31% { opacity:1; }
    100% { opacity:1; }
  }
  @keyframes neon-frame-buzz { 0%,100% { opacity:1; } 48%,52% { opacity:0.82; } }
  /* A bright arc of light runs continuously AROUND the header tube (rotating
     conic-gradient masked to the border ring). */
  @property --neon-angle { syntax: "<angle>"; inherits: false; initial-value: 0deg; }
  header.cv-header::after { content:""; position:absolute; inset:0; border-radius:14px; padding:1.6px; pointer-events:none;
    background: conic-gradient(from var(--neon-angle, 0deg), transparent 0 58%, var(--n1) 74%, #fff 82%, var(--n1) 90%, transparent 100%);
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor;
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude;
    animation: neon-ring-spin 3.6s linear infinite; }
  @keyframes neon-ring-spin { to { --neon-angle: 360deg; } }
  header.cv-header h1 { font-size: clamp(2.2rem,7vw,3.9rem); font-weight:800; color:#fff; letter-spacing:0.01em;
    -webkit-text-stroke: 0.4px color-mix(in srgb, var(--n1) 60%, #fff);
    text-shadow: 0 0 4px #fff, 0 0 12px var(--n1), 0 0 26px var(--n1), 0 0 52px var(--n1), 0 0 96px var(--n1);
    animation: neon-flicker 6s infinite, neon-surge 9s ease-in-out infinite; }
  @keyframes neon-flicker {
    0%,100% { opacity:1; }
    8% { opacity:0.4; } 9% { opacity:0.9; } 10% { opacity:0.45; }
    21% { opacity:0.6; } 22% { opacity:1; }
    55% { opacity:0.85; }
    70% { opacity:1; } 71% { opacity:0.5; } 72% { opacity:1; }
  }
  @keyframes neon-surge {
    0%,80%,100% { text-shadow: 0 0 4px #fff, 0 0 12px var(--n1), 0 0 26px var(--n1), 0 0 52px var(--n1), 0 0 96px var(--n1); }
    88% { text-shadow: 0 0 7px #fff, 0 0 20px var(--n1), 0 0 44px var(--n1), 0 0 88px var(--n1), 0 0 150px var(--n2); }
  }
  header.cv-header .cv-headline { color: var(--n2); font-weight:600; margin-top:0.4rem;
    text-shadow:0 0 8px var(--n2), 0 0 22px var(--n2), 0 0 40px var(--n2); animation: neon-headline-pulse 3.5s ease-in-out infinite; }
  @keyframes neon-headline-pulse { 0%,100% { text-shadow:0 0 8px var(--n2), 0 0 22px var(--n2), 0 0 40px var(--n2); } 50% { text-shadow:0 0 14px var(--n2), 0 0 36px var(--n2), 0 0 60px var(--n2); } }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a, ol.cv-bib > li a {
    color: var(--n2); text-shadow:0 0 6px var(--n2), 0 0 16px var(--n2); transition: color .2s ease, text-shadow .2s ease; }
  header.cv-header .cv-ids a:hover, header.cv-header .cv-contact a:hover, header.cv-header .cv-links a:hover, ol.cv-bib > li a:hover {
    color:#fff; text-shadow:0 0 8px var(--n2), 0 0 20px var(--n2), 0 0 36px var(--n2); }
  header.cv-header .cv-summary { color: var(--cv-ink-2); }
  .cv-self { color:#fff !important; font-weight:800; text-shadow:0 0 6px #fff, 0 0 14px var(--n1), 0 0 30px var(--n1), 0 0 52px var(--n1); }
  /* Glossy "wet-glass" reflection of the photo, mirrored faintly below it. */
  .cv-photo { width:120px; height:120px; border-radius:16px; border:2px solid var(--n1);
    box-shadow: 0 0 14px var(--n1), 0 0 40px var(--n1), 0 0 70px -10px var(--n1); animation: neon-photo-pulse 3.8s ease-in-out infinite;
    -webkit-box-reflect: below 3px linear-gradient(transparent 58%, rgba(255,255,255,0.22)); }
  @keyframes neon-photo-pulse {
    0%,100% { box-shadow: 0 0 14px var(--n1), 0 0 40px var(--n1), 0 0 70px -10px var(--n1); border-color: var(--n1); }
    50%     { box-shadow: 0 0 20px var(--n2), 0 0 60px var(--n1), 0 0 96px -8px var(--n2); border-color: var(--n2); } }

  /* ---- Section headings: pink (cyan on alternate sections) + pulse + slide -- */
  section.cv-section > h2 { position:relative; display:inline-block; color: var(--n1); text-transform:uppercase; letter-spacing:0.18em;
    font-size:0.82rem; font-weight:800; margin:0 0 0.9rem; padding-bottom:0.4rem; text-shadow:0 0 7px var(--n1), 0 0 18px var(--n1), 0 0 36px var(--n1); }
  section.cv-section > h2::after { content:""; position:absolute; left:0; right:0; bottom:0; height:2px; border-radius:2px;
    background: linear-gradient(90deg, transparent, currentColor, transparent); background-size:220% 100%;
    box-shadow:0 0 10px currentColor, 0 0 20px currentColor; animation: neon-underline-slide 2.6s linear infinite; }
  section.cv-section:nth-of-type(2n) > h2 { color: var(--n2); text-shadow:0 0 7px var(--n2), 0 0 18px var(--n2), 0 0 36px var(--n2); }
  /* Faint neon sheen on the body copy itself — kept low-alpha so glyph cores stay crisp. */
  .cv-prose-body p, .cv-prose-body li, ol.cv-bib > li { text-shadow: 0 0 5px rgba(170,215,255,0.25); }
  @keyframes neon-head-pulse { 0%,100% { filter: brightness(1); } 50% { filter: brightness(1.28); } }
  @keyframes neon-underline-slide { to { background-position: 220% 0; } }

  /* ---- FALLING PANELS — each bib entry is a neon-edged glass panel with a
     bright segment of light travelling down its left tube. -------------------- */
  ol.cv-bib > li { position:relative; padding:0.7em 0.95em 0.7em 1.6em; text-indent:0; margin-bottom:0.65rem;
    border:1px solid color-mix(in srgb, var(--n2) 40%, transparent); border-radius:10px;
    background: linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
    box-shadow: 0 0 18px -4px var(--n2), inset 0 0 20px -14px var(--n2);
    transition: transform 0.18s ease, box-shadow 0.25s ease, border-color 0.25s ease; }
  ol.cv-bib > li::before { content:""; position:absolute; left:0.55em; top:0.55em; bottom:0.55em; width:3.5px; border-radius:3px;
    background: linear-gradient(180deg, transparent, var(--n2) 30%, #fff 50%, var(--n2) 70%, transparent); background-size:100% 240%;
    box-shadow:0 0 14px var(--n2), 0 0 26px var(--n2); animation: neon-edge-travel 2.4s linear infinite; }
  @keyframes neon-edge-travel { 0% { background-position: 0 120%; } 100% { background-position: 0 -120%; } }
  /* Hover lifts the panel, intensifies its glow, and speeds the tube's pulse. */
  ol.cv-bib > li:hover { transform: translateY(-2px) scale(1.005); border-color: var(--n2);
    box-shadow: 0 0 24px -3px var(--n2), 0 8px 26px -12px var(--n2); }
  ol.cv-bib > li:hover::before { animation-duration: 1s; box-shadow: 0 0 16px var(--n2); }

  /* ---- Entrance motion ---------------------------------------------------- */
  @keyframes neon-fall {
    0%   { opacity:0; transform: translateY(-58px) rotate(-1.4deg); }
    70%  { opacity:1; transform: translateY(8px) rotate(0.3deg); }
    85%  { transform: translateY(-2px); }
    100% { opacity:1; transform: none; }
  }
  @keyframes neon-panel-light {
    0%   { border-color: rgba(255,255,255,0.06); box-shadow: 0 0 0 0 transparent; }
    70%  { border-color: var(--n2); box-shadow: 0 0 34px -2px var(--n2), inset 0 0 20px -6px var(--n2); }
    100% { border-color: color-mix(in srgb, var(--n2) 40%, transparent); box-shadow: 0 0 18px -4px var(--n2), inset 0 0 20px -14px var(--n2); }
  }
  @keyframes neon-strike {
    0%   { opacity:0; transform: translateY(-16px); }
    30%  { opacity:0.18; } 40% { opacity:1; } 46% { opacity:0.35; }
    56%  { opacity:1; transform: none; } 70% { opacity:0.7; }
    100% { opacity:1; transform: none; }
  }
  @keyframes neon-progress { to { transform: scaleX(1); } }

  /* Headings + panels FALL into place on load, staggered into a cascade, then
     the heading keeps a gentle glow pulse. Time-based (not scroll-driven) so the
     drop is visible on first paint in EVERY browser, including content already
     on screen. The reading text settles still afterwards. */
  section.cv-section > h2 { animation: neon-strike 0.8s ease-out both, neon-head-pulse 3s ease-in-out 0.9s infinite; }
  .cv-prose-body > * { animation: neon-fall 0.72s ease-out both; }
  .cv-prose-body > *:nth-child(2) { animation-delay: 0.1s; }
  .cv-prose-body > *:nth-child(3) { animation-delay: 0.18s; }
  .cv-prose-body > *:nth-child(n+4) { animation-delay: 0.26s; }
  /* fill: backwards (not both) so the resting transform/border is the base rule
     again once the drop finishes — that frees :hover to lift + reglow the panel. */
  ol.cv-bib > li { animation: neon-fall 0.74s ease-out backwards, neon-panel-light 1s ease-out backwards; }
  ol.cv-bib > li:nth-child(1) { animation-delay: 0.04s, 0.04s; }
  ol.cv-bib > li:nth-child(2) { animation-delay: 0.12s, 0.12s; }
  ol.cv-bib > li:nth-child(3) { animation-delay: 0.20s, 0.20s; }
  ol.cv-bib > li:nth-child(4) { animation-delay: 0.28s, 0.28s; }
  ol.cv-bib > li:nth-child(5) { animation-delay: 0.36s, 0.36s; }
  ol.cv-bib > li:nth-child(6) { animation-delay: 0.44s, 0.44s; }
  ol.cv-bib > li:nth-child(7) { animation-delay: 0.52s, 0.52s; }
  ol.cv-bib > li:nth-child(8) { animation-delay: 0.60s, 0.60s; }
  ol.cv-bib > li:nth-child(n+9) { animation-delay: 0.66s, 0.66s; }

  @supports (animation-timeline: scroll()) {
    .neon-progress { position:fixed; top:0; left:0; height:4px; width:100%; z-index:60; transform-origin:0 50%; transform:scaleX(0);
      background: linear-gradient(90deg, var(--n1), var(--n2)); box-shadow:0 0 14px var(--n1);
      animation: neon-progress linear both; animation-timeline: scroll(root); }
  }
  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    section.cv-section, section.cv-section > h2, .cv-prose-body > *, ol.cv-bib > li { opacity:1 !important; transform:none !important; }
    ol.cv-bib > li { border-color: color-mix(in srgb, var(--n2) 40%, transparent) !important; box-shadow: 0 0 18px -4px var(--n2) !important; }
    header.cv-header h1 { opacity:1 !important; }
    .neon-wall, .neon-floor, .neon-sparks, .neon-sweep, .neon-room, .neon-crt { display:none !important; }
    .neon-progress { display:none; }
  }
  @media print {
    .neon-wall, .neon-floor, .neon-sparks, .neon-sweep, .neon-room, .neon-crt, .neon-hud, .neon-progress { display:none !important; }
    *,*::before,*::after { animation:none !important; }
    header.cv-header::after, section.cv-section > h2::after { display:none !important; }
    ol.cv-bib > li { border-color:#ccc !important; background:none !important; box-shadow:none !important; }
    .cv { padding:0; max-width:none; }
  }`;
}

const neonMascotSkin = `
  @keyframes sm-neon-buzz {
    0%,19%,21%,23%,25%,54%,56%,100% {
      opacity: 1;
      text-shadow:
        0 0 4px #fff,
        0 0 10px var(--cv-accent,#1f4fd8),
        0 0 22px var(--cv-accent,#1f4fd8),
        0 0 42px var(--cv-accent,#1f4fd8),
        0 0 80px color-mix(in srgb,var(--cv-accent,#1f4fd8) 55%,transparent);
    }
    20%,24% {
      opacity: 0.6;
      text-shadow:
        0 0 2px #fff,
        0 0 6px var(--cv-accent,#1f4fd8),
        0 0 14px var(--cv-accent,#1f4fd8);
    }
    55% {
      opacity: 0.82;
      text-shadow:
        0 0 3px #fff,
        0 0 8px var(--cv-accent,#1f4fd8),
        0 0 18px var(--cv-accent,#1f4fd8);
    }
  }
  @keyframes sm-border-pulse {
    0%,100% { opacity: 1; }
    48%,52% { opacity: 0.7; }
  }

  /* BODY — near-black box, neon tube border, outer bloom */
  .sm-fig {
    background: #0a0008;
    border-radius: 8px;
    border: 2px solid var(--cv-accent,#1f4fd8);
    box-shadow:
      0 0 0 1px color-mix(in srgb,var(--cv-accent,#1f4fd8) 60%,transparent),
      0 0 10px var(--cv-accent,#1f4fd8),
      0 0 22px color-mix(in srgb,var(--cv-accent,#1f4fd8) 70%,transparent),
      0 0 44px color-mix(in srgb,var(--cv-accent,#1f4fd8) 35%,transparent),
      inset 0 0 8px color-mix(in srgb,var(--cv-accent,#1f4fd8) 12%,transparent);
    animation: sm-border-pulse 4.7s ease-in-out infinite;
  }

  /* Σ as a bright glowing neon tube */
  .sm-fig::before {
    font-size: 18px;
    font-weight: 900;
    color: #fff;
    -webkit-text-stroke: 0.5px color-mix(in srgb,var(--cv-accent,#1f4fd8) 80%,#fff);
    text-shadow:
      0 0 4px #fff,
      0 0 10px var(--cv-accent,#1f4fd8),
      0 0 22px var(--cv-accent,#1f4fd8),
      0 0 42px var(--cv-accent,#1f4fd8),
      0 0 80px color-mix(in srgb,var(--cv-accent,#1f4fd8) 55%,transparent);
    animation: sm-neon-buzz 6.3s linear infinite;
  }

  /* FEET — two glow dots */
  .sm-fig::after {
    content: '';
    position: absolute;
    bottom: 3px;
    left: 50%;
    transform: translateX(-50%);
    width: 20px;
    height: 4px;
    border-radius: 50%;
    background: transparent;
    box-shadow:
      -6px 0 0 2px color-mix(in srgb,var(--cv-accent,#1f4fd8) 90%,#fff),
       6px 0 0 2px color-mix(in srgb,var(--cv-accent,#1f4fd8) 90%,#fff),
      -6px 0 6px 3px color-mix(in srgb,var(--cv-accent,#1f4fd8) 55%,transparent),
       6px 0 6px 3px color-mix(in srgb,var(--cv-accent,#1f4fd8) 55%,transparent);
  }

  /* DECO — soft wall-reflection glow beneath the sign */
  .sm-deco {
    display: block;
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 70%;
    height: 6px;
    border-radius: 50%;
    background: radial-gradient(ellipse at center,
      color-mix(in srgb,var(--cv-accent,#1f4fd8) 50%,transparent) 0%,
      transparent 80%);
    filter: blur(3px);
    pointer-events: none;
  }
  .sm-deco::before {
    content: '';
    display: block;
    position: absolute;
    top: -16px;
    left: 10%;
    width: 80%;
    height: 10px;
    border-radius: 50%;
    background: radial-gradient(ellipse at center,
      color-mix(in srgb,var(--cv-accent,#1f4fd8) 22%,transparent) 0%,
      transparent 70%);
    filter: blur(4px);
  }
  .sm-deco::after {
    content: '';
    display: block;
    position: absolute;
    top: 4px;
    left: 25%;
    width: 50%;
    height: 3px;
    border-radius: 50%;
    background: color-mix(in srgb,var(--cv-accent,#1f4fd8) 30%,transparent);
    filter: blur(2px);
  }`;

export const neonTemplate: CvTemplate = {
  key: "neon",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + neonCss(theme) + mascotBaseCss() + neonMascotSkin;
    const body =
      mascotHtml(cv, sections) +
      `<div class="neon-wall" aria-hidden="true"></div>` +
      `<div class="neon-floor" aria-hidden="true"></div>` +
      `<div class="neon-sparks" aria-hidden="true"></div>` +
      `<div class="neon-sweep" aria-hidden="true"></div>` +
      `<div class="neon-room" aria-hidden="true"></div>` +
      `<div class="neon-crt" aria-hidden="true"></div>` +
      `<div class="neon-hud" aria-hidden="true"><span></span><span></span><span></span><span></span></div>` +
      `<div class="neon-progress" aria-hidden="true"></div>` +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
