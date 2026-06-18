/**
 * Public-page showcase style — "Cyberpunk".
 * An Arcane/Zaun-Piltover *aesthetic* — hextech-graffiti brawler energy (genre &
 * mood only; original art, no character likeness or trademarks). All CSS under
 * the strict public-page CSP (no JS / no external assets):
 *
 *   • HEXTECH LATTICE — a drifting triangular hex grid (teal + brass).
 *   • RISING SHIMMER — toxic teal/pink/Zaun-green motes drifting up, plus a
 *     smog glow welling from the depths.
 *   • RIVETED METAL PLATES — the header and every entry are brass-riveted
 *     hextech panels with a glowing hex marker and a charge-up hover.
 *   • BRAWLER NAME — heavy type with a pink/teal energy split + brass stroke,
 *     a one-shot impact slam on load, then a steady energy pulse.
 *   • GRAFFITI HEADINGS — bold stencil caps with a skewed glowing slash + a
 *     hex bullet; panels slam in on load (staggered cascade).
 *   • HEXTECH-CORE PHOTO — hexagon-clipped with a brass/teal/pink drop-glow.
 *   • a thin pink->teal->brass scroll-progress beam.
 *
 * Palette is a FIXED pink + teal + brass arcade set (original; deliberately NOT
 * accent-derived). Guardrails: body copy stays crisp + AA on the near-black Zaun
 * base; faint footnotes ride --cv-faint ~8:1; `prefers-reduced-motion` freezes
 * all motion, hides the moving layers, and resets the name's split.
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

function cyberpunkCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: dark;
    /* Inks tuned for WCAG-AA on the near-black Zaun base (#0a0c12). Faint
       footnotes ride --cv-faint #a6b2c8 (~8:1), the failure mode a dark style
       must guard. */
    --cv-ink:#eef1f8; --cv-ink-2:#cdd4e6; --cv-muted:#aab2c9; --cv-faint:#a6b2c8;
    --cv-rule: rgba(120,150,255,0.16); --cv-rule-strong: rgba(120,150,255,0.34); --cv-page:#0a0c12;
    /* Fixed ARCANE Zaun x hextech x brawler palette (original; no IP). */
    --pink:#ff3d9a; --pink-2:#ff7ac2; --teal:#2ee6d6; --brass:#e8a23d; --zaun:#9dff5e;
  }
  body {
    min-height:100vh; overflow-x:hidden; color:var(--cv-ink);
    font-family: "Segoe UI", system-ui, -apple-system, "Helvetica Neue", sans-serif;
    /* Zaun depths: pink + teal city glow up top, toxic shimmer rising below. */
    background:
      radial-gradient(60% 42% at 50% -2%, rgba(46,230,214,0.18) 0%, transparent 62%),
      radial-gradient(130% 80% at 10% -8%, rgba(255,61,154,0.15) 0%, transparent 46%),
      radial-gradient(130% 80% at 92% 2%, rgba(46,230,214,0.14) 0%, transparent 48%),
      radial-gradient(120% 62% at 50% 114%, rgba(157,255,94,0.13) 0%, transparent 60%),
      linear-gradient(180deg, #0c1018 0%, #0a0c12 45%, #050609 100%);
    background-attachment: fixed;
  }
  .cv { position:relative; z-index:3; max-width: 840px; padding: 60px 56px 130px; }

  /* ---- Layer 0: drifting HEXTECH lattice (triangular hex grid) ------------- */
  .cy-hex { position:fixed; inset:0; z-index:0; pointer-events:none; opacity:0.72;
    background-image:
      repeating-linear-gradient(60deg, rgba(46,230,214,0.11) 0 1.4px, transparent 1.4px 48px),
      repeating-linear-gradient(-60deg, rgba(46,230,214,0.11) 0 1.4px, transparent 1.4px 48px),
      repeating-linear-gradient(0deg, rgba(232,162,61,0.08) 0 1.4px, transparent 1.4px 84px);
    -webkit-mask-image: radial-gradient(120% 92% at 50% 22%, #000 0%, transparent 80%);
    mask-image: radial-gradient(120% 92% at 50% 22%, #000 0%, transparent 80%);
    animation: cy-hex-drift 26s linear infinite; }
  @keyframes cy-hex-drift { to { background-position: 96px 0, -96px 0, 0 84px; } }

  /* ---- Layer 0: rising SHIMMER motes (toxic teal / pink / Zaun-green) ------ */
  .cy-shimmer { position:fixed; inset:0; z-index:0; pointer-events:none; opacity:0.7; mix-blend-mode:screen;
    background-image:
      radial-gradient(2px 2px at 12% 92%, var(--teal), transparent 60%),
      radial-gradient(2px 2px at 26% 70%, var(--pink), transparent 60%),
      radial-gradient(1.5px 1.5px at 44% 86%, var(--zaun), transparent 60%),
      radial-gradient(2px 2px at 62% 62%, var(--teal), transparent 60%),
      radial-gradient(1.5px 1.5px at 77% 80%, var(--pink), transparent 60%),
      radial-gradient(2px 2px at 90% 68%, var(--zaun), transparent 60%);
    background-size: 100% 820px;
    -webkit-mask-image: linear-gradient(to top, transparent, #000 20%, #000 80%, transparent);
    mask-image: linear-gradient(to top, transparent, #000 20%, #000 80%, transparent);
    animation: cy-shimmer-rise 15s linear infinite, cy-ember 2.6s ease-in-out infinite; }
  @keyframes cy-shimmer-rise { to { background-position: 0 -820px; } }
  @keyframes cy-ember { 0%,100% { opacity:0.9; } 50% { opacity:0.55; } }

  /* ---- Layer 0: toxic SMOG glow welling up from Zaun's depths ------------- */
  .cy-smog { position:fixed; left:0; right:0; bottom:0; height:46vh; z-index:0; pointer-events:none;
    background: linear-gradient(0deg, rgba(157,255,94,0.15) 0%, rgba(46,230,214,0.09) 34%, transparent 80%);
    animation: cy-smog-breathe 9s ease-in-out infinite; }
  @keyframes cy-smog-breathe { 0%,100% { opacity:0.7; } 50% { opacity:1; } }

  /* ---- Cinematic GOD-RAYS fanning down from above (Arcane drama) --------- */
  .cy-rays { position:fixed; left:-20%; right:-20%; top:-18%; height:96vh; z-index:0; pointer-events:none; opacity:0.62; mix-blend-mode:screen;
    background: repeating-conic-gradient(from 198deg at 50% -8%,
      transparent 0deg 6deg, rgba(46,230,214,0.08) 6deg 8deg, transparent 8deg 15deg,
      rgba(255,61,154,0.06) 15deg 16.5deg, transparent 16.5deg 24deg);
    -webkit-mask-image: linear-gradient(to bottom, #000 0%, transparent 78%);
    mask-image: linear-gradient(to bottom, #000 0%, transparent 78%);
    animation: cy-rays-sweep 16s ease-in-out infinite alternate; }
  @keyframes cy-rays-sweep { from { transform: rotate(-3.5deg); } to { transform: rotate(3.5deg); } }

  /* ---- Chiaroscuro VIGNETTE — dramatic darkened edges -------------------- */
  .cy-vignette { position:fixed; inset:0; z-index:2; pointer-events:none;
    background: radial-gradient(125% 95% at 50% 32%, transparent 44%, rgba(0,0,0,0.5) 100%);
    animation: cy-vig 10s ease-in-out infinite; }
  @keyframes cy-vig { 0%,100% { opacity:0.85; } 50% { opacity:1; } }

  /* ---- Film GRAIN — faint cinematic noise (behind the text) ------------- */
  .cy-grain { position:fixed; inset:0; z-index:2; pointer-events:none; opacity:0.06; mix-blend-mode:overlay;
    background-image: radial-gradient(rgba(255,255,255,0.85) 0.5px, transparent 0.7px);
    background-size: 3px 3px;
    animation: cy-grain-jit 0.5s steps(3) infinite; }
  @keyframes cy-grain-jit { 0% { transform: translate(0,0); } 33% { transform: translate(-1px,1px); } 66% { transform: translate(1px,-1px); } }

  /* ---- GAME HUD: rolling scanlines + a screen frame with brass brackets -- */
  .cy-crt { position:fixed; inset:0; z-index:54; pointer-events:none; opacity:0.5;
    background: repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,0.16) 2px 3px);
    animation: cy-crt-roll 9s linear infinite; }
  @keyframes cy-crt-roll { to { background-position: 0 90px; } }
  .cy-hud { position:fixed; inset:14px; z-index:55; pointer-events:none;
    border:1px solid rgba(232,162,61,0.16); border-radius:3px;
    animation: cy-hud-pulse 3.4s ease-in-out infinite; }
  .cy-hud span { position:absolute; width:42px; height:42px; border:3px solid var(--brass); box-shadow:0 0 12px rgba(232,162,61,0.7); }
  .cy-hud span:nth-child(1) { top:-1px; left:-1px; border-right:0; border-bottom:0; }
  .cy-hud span:nth-child(2) { top:-1px; right:-1px; border-left:0; border-bottom:0; }
  .cy-hud span:nth-child(3) { bottom:-1px; left:-1px; border-right:0; border-top:0; }
  .cy-hud span:nth-child(4) { bottom:-1px; right:-1px; border-left:0; border-top:0; }
  @keyframes cy-hud-pulse { 0%,100% { opacity:0.9; } 50% { opacity:0.6; } }

  /* ---- Cyberpunk DATA RAIN — neon code streaks falling behind content ----- */
  .cy-rain { position:fixed; inset:-10% 0 -10% 0; z-index:0; pointer-events:none; mix-blend-mode:screen; }
  .cy-rain span { position:absolute; inset:0; }
  .cy-rain .r1 { background-image: repeating-linear-gradient(180deg, transparent 0 16px, rgba(46,230,214,0.55) 16px 38px, transparent 38px 150px); background-size:3px 150px; opacity:0.5; animation: cy-fall 0.9s linear infinite; }
  .cy-rain .r2 { background-image: repeating-linear-gradient(180deg, transparent 0 24px, rgba(255,61,154,0.5) 24px 52px, transparent 52px 220px); background-size:2px 220px; background-position:22px 0; opacity:0.4; animation: cy-fall 1.5s linear infinite; }
  .cy-rain .r3 { background-image: repeating-linear-gradient(180deg, transparent 0 40px, rgba(157,255,94,0.45) 40px 64px, transparent 64px 320px); background-size:2px 320px; background-position:9px 0; opacity:0.3; animation: cy-fall 2.4s linear infinite; }
  @keyframes cy-fall { from { transform: translateY(-150px); } to { transform: translateY(150px); } }

  /* ---- GAME HUD bars: top energy cells + bottom data ticker -------------- */
  .cy-topbar { position:fixed; top:0; left:0; right:0; height:30px; z-index:56; pointer-events:none;
    background: linear-gradient(180deg, rgba(8,10,16,0.95) 35%, transparent);
    border-bottom:1px solid rgba(232,162,61,0.32); }
  .cy-topbar::before { content:""; position:absolute; left:22px; top:11px; width:230px; height:8px;
    background: repeating-linear-gradient(90deg, var(--teal) 0 13px, transparent 13px 17px);
    box-shadow:0 0 8px rgba(46,230,214,0.6);
    -webkit-mask: linear-gradient(90deg,#000 55%, transparent); mask: linear-gradient(90deg,#000 55%, transparent);
    animation: cy-cells 2.4s steps(8) infinite; }
  .cy-topbar::after { content:""; position:absolute; right:22px; top:12px; width:150px; height:6px;
    background: repeating-linear-gradient(90deg, rgba(255,61,154,0.75) 0 3px, transparent 3px 9px);
    box-shadow:0 0 6px rgba(255,61,154,0.5); animation: cy-cells 4s steps(10) infinite reverse; }
  @keyframes cy-cells { to { background-position: 130px 0; } }
  .cy-botbar { position:fixed; left:0; right:0; bottom:0; height:26px; z-index:56; pointer-events:none; overflow:hidden;
    background: linear-gradient(0deg, rgba(8,10,16,0.95) 35%, transparent);
    border-top:1px solid rgba(46,230,214,0.32); }
  .cy-botbar::before { content:""; position:absolute; bottom:10px; left:0; width:300%; height:3px;
    background: repeating-linear-gradient(90deg, rgba(46,230,214,0.65) 0 16px, transparent 16px 26px, rgba(255,61,154,0.6) 26px 36px, transparent 36px 64px);
    animation: cy-ticker 9s linear infinite; }
  @keyframes cy-ticker { to { transform: translateX(-33.33%); } }

  /* ---- GAME radar sweep (bottom-right HUD widget; hidden on narrow) ------- */
  .cy-radar { position:fixed; right:30px; bottom:44px; width:88px; height:88px; z-index:56; pointer-events:none; border-radius:50%;
    border:1px solid rgba(46,230,214,0.45);
    box-shadow:0 0 16px -4px rgba(46,230,214,0.5), inset 0 0 18px -8px rgba(46,230,214,0.5);
    background:
      radial-gradient(circle, rgba(46,230,214,0.07), transparent 70%),
      repeating-radial-gradient(circle, transparent 0 13px, rgba(46,230,214,0.14) 13px 14px),
      linear-gradient(90deg, transparent 49%, rgba(46,230,214,0.18) 50%, transparent 51%),
      linear-gradient(0deg, transparent 49%, rgba(46,230,214,0.18) 50%, transparent 51%);
    overflow:hidden; }
  .cy-radar::before { content:""; position:absolute; inset:0; border-radius:50%;
    background: conic-gradient(from 0deg, rgba(46,230,214,0.55), rgba(46,230,214,0) 75deg);
    animation: cy-radar-spin 2.8s linear infinite; }
  @keyframes cy-radar-spin { to { transform: rotate(360deg); } }

  /* ---- Header: riveted hextech METAL PLATE -------------------------------- */
  header.cv-header {
    position:relative; margin-bottom: 2.6rem; padding: 1.9rem 2rem 1.9rem;
    border:3px solid var(--brass); border-radius:4px;
    background:
      radial-gradient(circle at 15px 15px, var(--brass) 0 3px, transparent 3.9px),
      radial-gradient(circle at calc(100% - 15px) 15px, var(--brass) 0 3px, transparent 3.9px),
      radial-gradient(circle at 15px calc(100% - 15px), var(--brass) 0 3px, transparent 3.9px),
      radial-gradient(circle at calc(100% - 15px) calc(100% - 15px), var(--brass) 0 3px, transparent 3.9px),
      linear-gradient(180deg, rgba(36,46,60,0.9), rgba(10,13,20,0.92));
    box-shadow: 0 0 0 1px rgba(0,0,0,0.5), 0 0 46px -10px rgba(46,230,214,0.5), inset 0 0 0 1px rgba(232,162,61,0.28), inset 0 0 42px -16px rgba(46,230,214,0.6), 0 16px 44px -16px rgba(0,0,0,0.85);
    overflow:hidden;
    animation: cy-plate 5s ease-in-out infinite;
  }
  /* Hextech scan sweeping the plate. */
  header.cv-header::before {
    content:""; position:absolute; left:0; right:0; top:-60%; height:60%; z-index:0; pointer-events:none;
    background: linear-gradient(180deg, transparent, rgba(46,230,214,0.10) 50%, transparent);
    animation: cy-scan 6.5s linear infinite;
  }
  header.cv-header > * { position:relative; z-index:1; }
  @keyframes cy-scan { to { transform: translateY(360%); } }
  @keyframes cy-plate {
    0%,100% { box-shadow: 0 0 0 1px rgba(0,0,0,0.5), 0 0 46px -10px rgba(46,230,214,0.5), inset 0 0 0 1px rgba(232,162,61,0.28), inset 0 0 42px -16px rgba(46,230,214,0.6), 0 16px 44px -16px rgba(0,0,0,0.85); }
    50% { box-shadow: 0 0 0 1px rgba(0,0,0,0.5), 0 0 56px -8px rgba(255,61,154,0.46), inset 0 0 0 1px rgba(232,162,61,0.34), inset 0 0 42px -16px rgba(255,61,154,0.5), 0 16px 44px -16px rgba(0,0,0,0.85); } }

  /* The name — heavy BRAWLER type with a pink/teal energy split + brass stroke,
     a one-shot impact slam on load, then a steady energy pulse. The white core
     stays legible; prefers-reduced-motion resets the split so it never sticks. */
  header.cv-header h1 {
    font-size: clamp(2.7rem, 8.5vw, 5rem); font-weight:900; letter-spacing:-0.02em; line-height:0.95;
    color:#ffffff; text-wrap: balance;
    -webkit-text-stroke: 1.2px color-mix(in srgb, var(--brass) 78%, #fff);
    text-shadow: -4px 0 rgba(255,61,154,0.75), 4px 0 rgba(46,230,214,0.75), 0 0 28px rgba(46,230,214,0.6), 0 0 60px rgba(255,61,154,0.5);
    animation: cy-impact 0.95s cubic-bezier(.2,.85,.2,1.3) both, cy-energy 5s ease-in-out 0.95s infinite, cy-flicker 7s steps(1) 1s infinite;
  }
  @keyframes cy-flicker { 0%,96%,100% { opacity:1; } 96.5% { opacity:0.55; } 97% { opacity:1; } 98% { opacity:0.7; } 98.5% { opacity:1; } }
  @keyframes cy-impact {
    0% { opacity:0; transform: scale(1.34) translateY(-10px); letter-spacing:0.2em; }
    55% { opacity:1; transform: scale(0.96); }
    72% { transform: scale(1.025); }
    100% { opacity:1; transform: none; letter-spacing:-0.02em; }
  }
  @keyframes cy-energy {
    0%,100% { text-shadow: -4px 0 rgba(255,61,154,0.75), 4px 0 rgba(46,230,214,0.75), 0 0 28px rgba(46,230,214,0.6), 0 0 60px rgba(255,61,154,0.5); }
    50% { text-shadow: -4px 0 rgba(255,61,154,0.75), 4px 0 rgba(46,230,214,0.75), 0 0 44px rgba(46,230,214,0.85), 0 0 84px rgba(255,61,154,0.65); }
  }
  header.cv-header .cv-honorific { color:inherit; }
  header.cv-header .cv-headline { color: var(--teal); font-weight:700; margin-top:0.5rem;
    text-shadow: 0 0 12px rgba(46,230,214,0.5); }
  header.cv-header .cv-headline::before {
    content:""; display:inline-block; width:0.62em; height:0.7em; margin-right:0.45em; vertical-align:-0.02em;
    background: var(--brass); box-shadow:0 0 8px var(--brass);
    clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
  }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a,
  ol.cv-bib > li a { color: var(--teal); text-shadow:0 0 8px rgba(46,230,214,0.4); transition: color .2s ease, text-shadow .2s ease; }
  header.cv-header .cv-ids a:hover, header.cv-header .cv-contact a:hover, header.cv-header .cv-links a:hover,
  ol.cv-bib > li a:hover { color: var(--pink-2); text-shadow:0 0 10px rgba(255,61,154,0.6); }
  header.cv-header .cv-summary { color: var(--cv-ink-2); max-width:64ch; }
  .cv-self {
    color:#ffffff !important; font-weight:800;
    text-shadow: 0 0 8px var(--pink), 0 0 18px rgba(255,61,154,0.6), 0 0 2px rgba(255,255,255,0.6);
  }
  /* Photo as a glowing HEXTECH CORE (hexagon-clipped; brass/teal/pink drop-glow). */
  .cv-photo {
    width:144px; height:144px; object-fit:cover;
    clip-path: polygon(50% 0%, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%);
    filter: drop-shadow(0 0 13px var(--teal)) drop-shadow(0 0 28px rgba(255,61,154,0.62)) contrast(1.08) saturate(1.16);
    animation: cy-core 4.2s ease-in-out infinite;
  }
  @keyframes cy-core {
    0%,100% { filter: drop-shadow(0 0 13px var(--teal)) drop-shadow(0 0 28px rgba(255,61,154,0.62)) contrast(1.08) saturate(1.16); }
    50% { filter: drop-shadow(0 0 22px var(--teal)) drop-shadow(0 0 44px rgba(255,61,154,0.78)) contrast(1.1) saturate(1.22); }
  }

  /* ---- Sections: graffiti-stencil hex headings --------------------------- */
  section.cv-section { margin-top: 2.6rem; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; display:inline-block;
    font-size:1.1rem; font-weight:900; text-transform:uppercase; letter-spacing:0.14em;
    color: var(--pink); margin:0 0 1.15rem; padding-bottom:0.55rem;
    text-shadow: 0 0 12px rgba(255,61,154,0.75), 0 0 26px rgba(255,61,154,0.5);
  }
  /* brass hex bullet, drawn (not a glyph) so there is no missing-font tofu. */
  section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before {
    content:""; display:inline-block; width:0.9em; height:1em; margin-right:0.55em; vertical-align:-0.12em;
    background: var(--brass); box-shadow:0 0 11px rgba(232,162,61,0.75);
    clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
  }
  section.cv-section:nth-of-type(2n) > h2 { color: var(--teal); text-shadow:0 0 12px rgba(46,230,214,0.75), 0 0 26px rgba(46,230,214,0.5); }
  /* graffiti underline: a thick, skewed glowing slash. */
  section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
    content:""; position:absolute; left:0; right:0; bottom:0; height:6px; transform: skewX(-22deg);
    background: linear-gradient(90deg, currentColor, transparent);
    box-shadow: 0 0 14px currentColor; opacity:0.95;
    animation: cy-pulse 3.2s ease-in-out infinite;
  }
  @keyframes cy-pulse { 0%,100%{ opacity:0.55; } 50%{ opacity:1; } }

  /* ---- Entries: riveted hextech PLATES with a glowing hex marker ---------- */
  ol.cv-bib > li {
    position:relative; padding:0.95em 1.1em 0.95em 2.1em; margin-bottom:0.9rem; text-indent:0;
    border:3px solid var(--cv-rule-strong); border-left:8px solid var(--teal); border-radius:3px;
    background:
      radial-gradient(circle at calc(100% - 11px) 11px, rgba(232,162,61,0.85) 0 2.2px, transparent 3px),
      radial-gradient(circle at calc(100% - 11px) calc(100% - 11px), rgba(232,162,61,0.85) 0 2.2px, transparent 3px),
      linear-gradient(180deg, rgba(40,52,68,0.5), rgba(12,16,24,0.55));
    box-shadow: 0 0 24px -6px var(--teal), 0 12px 30px -14px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.07);
    transition: transform .18s ease, box-shadow .25s ease, border-color .25s ease;
  }
  ol.cv-bib > li::before {
    content:""; position:absolute; left:0.7em; top:1.15em; width:12px; height:13px;
    background: var(--teal); box-shadow:0 0 11px var(--teal);
    clip-path: polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%);
  }
  ol.cv-bib > li:nth-child(2n) { border-left-color: var(--pink); box-shadow:0 0 24px -6px var(--pink), 0 12px 30px -14px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.07); }
  ol.cv-bib > li:nth-child(2n)::before { background: var(--pink); box-shadow:0 0 11px var(--pink); }
  /* hover = "charge up" */
  ol.cv-bib > li:hover { transform: translateY(-3px); border-color: var(--brass);
    box-shadow: 0 0 30px -3px var(--teal), 0 14px 34px -12px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.1); }
  .cv-prose-body p, ul.cv-prose-list > li { color: var(--cv-ink-2); }

  /* Footers — quiet but AA-legible; links stay teal. */
  .cv-provenance, .cv-license, .cv-attribution { color: var(--cv-faint); }
  .cv-living { color: var(--cv-muted); }
  .cv-attribution a, .cv-license a, .cv-coauthors-list a { color: var(--teal); }
  .cv-coauthors-h { color: var(--cv-muted); }

  /* ---- Motion: brawler SLAM-IN cascade on load + steady glow ------------- */
  @keyframes cy-slam {
    0% { opacity:0; transform: translateY(-34px) scale(1.04); }
    62% { opacity:1; transform: translateY(6px) scale(0.995); }
    100% { opacity:1; transform: none; }
  }
  @keyframes cy-head-in {
    0% { opacity:0; transform: translateX(-12px) skewX(-6deg); }
    60% { opacity:1; transform: translateX(3px) skewX(0deg); }
    100% { opacity:1; transform: none; }
  }
  @keyframes cy-progress { to { transform: scaleX(1); } }

  section.cv-section > h2, .cv-summary-block > .cv-summary-h { animation: cy-head-in 0.6s ease-out both; }
  .cv-prose-body > * { animation: cy-slam 0.6s ease-out both; }
  .cv-prose-body > *:nth-child(2) { animation-delay: 0.08s; }
  .cv-prose-body > *:nth-child(3) { animation-delay: 0.16s; }
  .cv-prose-body > *:nth-child(n+4) { animation-delay: 0.24s; }
  /* fill: backwards so the resting state is the base rule (frees :hover). */
  ol.cv-bib > li { animation: cy-slam 0.62s ease-out backwards; }
  ol.cv-bib > li:nth-child(1) { animation-delay: 0.05s; }
  ol.cv-bib > li:nth-child(2) { animation-delay: 0.12s; }
  ol.cv-bib > li:nth-child(3) { animation-delay: 0.19s; }
  ol.cv-bib > li:nth-child(4) { animation-delay: 0.26s; }
  ol.cv-bib > li:nth-child(5) { animation-delay: 0.33s; }
  ol.cv-bib > li:nth-child(6) { animation-delay: 0.40s; }
  ol.cv-bib > li:nth-child(7) { animation-delay: 0.47s; }
  ol.cv-bib > li:nth-child(n+8) { animation-delay: 0.54s; }

  @supports (animation-timeline: scroll()) {
    .cy-progress { position:fixed; top:0; left:0; height:6px; width:100%; z-index:60; transform-origin:0 50%; transform:scaleX(0);
      background: linear-gradient(90deg, var(--pink), var(--teal), var(--brass));
      box-shadow: 0 0 16px rgba(46,230,214,0.8); animation: cy-progress linear both; animation-timeline: scroll(root); }
  }

  @media (max-width: 900px) { .cy-radar { display:none !important; } }
  @media (max-width: 560px) {
    .cv { padding: 40px 22px 120px; }
    header.cv-header { padding: 1.1rem 1.1rem 1rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; }
    section.cv-section, section.cv-section > h2, .cv-prose-body > *, ol.cv-bib > li { opacity:1 !important; transform:none !important; }
    /* The name must NOT stay chromatically offset when motion is off. */
    header.cv-header h1 { transform:none !important; text-shadow: 0 0 16px rgba(46,230,214,0.4) !important; }
    .cy-hex, .cy-rays, .cy-rain, .cy-shimmer, .cy-smog, .cy-grain, .cy-crt, .cy-topbar, .cy-botbar, .cy-radar { display:none !important; }
    .cy-progress { display:none !important; }
  }

  @media print {
    .cy-hex, .cy-rays, .cy-rain, .cy-shimmer, .cy-smog, .cy-vignette, .cy-grain, .cy-crt, .cy-hud, .cy-topbar, .cy-botbar, .cy-radar, .cy-progress { display:none !important; }
    *, *::before, *::after { animation:none !important; }
    header.cv-header { box-shadow:none; border-color:#ccc; background:#fff; }
    header.cv-header h1 { text-shadow:none; -webkit-text-stroke:0; color:#000; }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after { display:none !important; }
    ol.cv-bib > li { border-color:#ccc !important; background:none !important; box-shadow:none !important; }
    .cv { padding:0; max-width:none; }
  }`;
}

/** Mascot skin — hovering neon hologram: glassy blue-violet body, neon-cyan Σ
 *  with flicker, magenta rim light, scanline sweep, and a glowing under-shadow. */
const cyberpunkMascotSkin = `
  /* --- Hologram keyframes --- */
  @keyframes sm-flicker {
    0%,100% { opacity:1; text-shadow: 0 0 6px #45e7ff, 0 0 14px #45e7ff, 0 0 28px rgba(69,231,255,0.6); }
    18%      { opacity:0.85; text-shadow: 0 0 4px #45e7ff, 0 0 10px #45e7ff; }
    20%      { opacity:1;    text-shadow: 0 0 8px #45e7ff, 0 0 18px #45e7ff, 0 0 32px rgba(69,231,255,0.7); }
    52%      { opacity:0.92; text-shadow: 0 0 5px #45e7ff, 0 0 12px #45e7ff; }
    54%      { opacity:1;    text-shadow: 0 0 7px #45e7ff, 0 0 16px #45e7ff, 0 0 30px rgba(69,231,255,0.65); }
  }
  @keyframes sm-scan {
    from { transform: translateY(-100%); }
    to   { transform: translateY(400%); }
  }
  @keyframes sm-rim {
    0%,100% { box-shadow:
      0 0 0 1px rgba(69,231,255,0.55),
      inset 0 0 0 1px rgba(69,231,255,0.18),
      -2px 0 6px rgba(255,121,207,0.5),
      2px 0 0 rgba(69,231,255,0.18),
      0 6px 22px -4px rgba(69,231,255,0.55),
      0 10px 36px -6px rgba(69,231,255,0.3); }
    47% { box-shadow:
      0 0 0 1px rgba(255,121,207,0.45),
      inset 0 0 0 1px rgba(255,121,207,0.15),
      -3px 0 8px rgba(255,121,207,0.65),
      2px 0 0 rgba(69,231,255,0.12),
      0 6px 20px -4px rgba(255,121,207,0.45),
      0 10px 36px -6px rgba(69,231,255,0.25); }
    49% { box-shadow:
      0 0 0 1px rgba(69,231,255,0.7),
      inset 0 0 0 1px rgba(69,231,255,0.22),
      -2px 0 6px rgba(255,121,207,0.55),
      2px 0 0 rgba(69,231,255,0.2),
      0 6px 26px -4px rgba(69,231,255,0.65),
      0 10px 40px -6px rgba(69,231,255,0.38); }
  }

  /* BODY — glassy dark blue-violet with holographic depth */
  .sm-fig {
    background:
      linear-gradient(160deg,
        rgba(100,180,255,0.12) 0%,
        rgba(30,20,70,0.0) 35%,
        rgba(10,8,30,0.0) 100%),
      linear-gradient(180deg, #12103a 0%, #0a0820 55%, #060516 100%);
    border-radius: 10px;
    /* Rim light pulses between cyan (primary) and magenta (secondary) */
    animation: sm-rim 4.8s steps(1) infinite;
    /* Holographic glass sheen */
    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);
  }

  /* Σ GLYPH — neon cyan with flicker */
  .sm-fig::before {
    color: #c8f8ff;
    font-weight: 900;
    -webkit-text-stroke: 0.5px rgba(69,231,255,0.6);
    animation: sm-flicker 3.6s steps(1) infinite;
  }

  /* FEET — deep violet, nearly invisible under the under-glow */
  .sm-fig::after {
    background: #0d0a22;
    box-shadow: 11px 0 0 #0d0a22;
    opacity: 0.85;
  }

  /* SCANLINE SWEEP — a bright horizontal band gliding top→bottom */
  .sm-deco {
    border-radius: 10px;
    overflow: hidden;
  }
  .sm-deco::before {
    content: "";
    position: absolute;
    inset: 0;
    /* Faint holographic horizontal raster lines */
    background: repeating-linear-gradient(
      180deg,
      rgba(69,231,255,0.055) 0px,
      rgba(69,231,255,0.055) 1px,
      transparent 1px,
      transparent 3px
    );
    border-radius: 10px;
    pointer-events: none;
  }
  .sm-deco::after {
    content: "";
    position: absolute;
    left: 0; right: 0;
    height: 30%;
    /* Bright scanline band */
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(69,231,255,0.18) 40%,
      rgba(69,231,255,0.28) 50%,
      rgba(69,231,255,0.18) 60%,
      transparent 100%
    );
    border-radius: 10px;
    pointer-events: none;
    animation: sm-scan 2.8s linear infinite;
  }`;

export const cyberpunkTemplate: CvTemplate = {
  key: "cyberpunk",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + cyberpunkCss(theme) + mascotBaseCss() + cyberpunkMascotSkin;
    const body =
      mascotHtml(cv, sections) +
      `<div class="cy-hex" aria-hidden="true"></div>` +
      `<div class="cy-rays" aria-hidden="true"></div>` +
      `<div class="cy-rain" aria-hidden="true"><span class="r1"></span><span class="r2"></span><span class="r3"></span></div>` +
      `<div class="cy-shimmer" aria-hidden="true"></div>` +
      `<div class="cy-smog" aria-hidden="true"></div>` +
      `<div class="cy-vignette" aria-hidden="true"></div>` +
      `<div class="cy-grain" aria-hidden="true"></div>` +
      `<div class="cy-progress" aria-hidden="true"></div>` +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>` +
      `<div class="cy-crt" aria-hidden="true"></div>` +
      `<div class="cy-hud" aria-hidden="true"><span></span><span></span><span></span><span></span></div>` +
      `<div class="cy-topbar" aria-hidden="true"></div>` +
      `<div class="cy-botbar" aria-hidden="true"></div>` +
      `<div class="cy-radar" aria-hidden="true"></div>`;
    return cvPageShell(cv, css, body);
  },
};
