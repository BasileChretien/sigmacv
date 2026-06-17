/**
 * Public-page showcase style — "Cyberpunk".
 * Neon-noir rainy night-city (Blade-Runner / 2077 *mood* — genre, never any
 * specific IP). Near-black sky with a deep blue-violet city haze; magenta + cyan
 * neon and a warm sign-amber. EXTREMELY ANIMATED, all CSS under the strict
 * public-page CSP (no JS / no external assets):
 *
 *   • FALLING DIGITAL RAIN — three layered streak fields drifting at different
 *     speeds/opacities (the centrepiece), behind the content.
 *   • a slow vertical city-haze gradient + a drifting holographic grid.
 *   • CHROMATIC-ABERRATION GLITCH on the name — a jittering RGB split via two
 *     tinted ::before/::after copies that twitch on a loop.
 *   • a hologram SCANLINE shimmer sweeping over the header panel.
 *   • GLITCH-IN section headings (quick RGB-split + clip jitter on reveal).
 *   • neon pulses on the accent rivets + heading glow.
 *   • a thin neon scroll-progress beam.
 *   • a faint decorative scrolling DATA TICKER line (aria-hidden, no text).
 *
 * Distinct from Synthwave (80s sun + ground perspective-grid + sunset sky),
 * Neon (flat sign-tubes only) and Terminal (monochrome CRT phosphor console):
 * this is a colour neon-noir rainstorm with chromatic-aberration glitch, not a
 * sun/grid, a flat wall, or a green console.
 *
 * Guardrails: every link + the small footer faint text clears WCAG AA on the
 * near-black page (`--cv-faint #a3a9c4` ≈ 8.7:1; cyan links ≈ 13.6:1, magenta
 * ≈ 8.6:1, amber ≈ 12.8:1 — verified). Rain/grid/glitch sit BEHIND or beside
 * body text, never over it. Scroll reveals are gated and target heading + entry
 * individually (never the whole tall section). A full `prefers-reduced-motion`
 * fallback freezes all motion, hides the rain/ticker, and resets the name's RGB
 * split so nothing stays chromatically offset when motion is off.
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

function cyberpunkCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: dark;
    /* Cool neon-noir inks on near-black. All WCAG-AA on #06060c — the small
       provenance/license/living/attribution footnotes inherit --cv-faint
       (#a3a9c4 ≈ 8.7:1), the failure mode a dark busy style must guard. */
    --cv-ink:#e9ecf8; --cv-ink-2:#c3c9e4; --cv-muted:#a6adcf; --cv-faint:#a3a9c4;
    --cv-rule: rgba(120,150,255,0.18); --cv-rule-strong: rgba(120,150,255,0.36); --cv-page:#06060c;
    /* Sign neons. --cyber-rain rides the user's accent so the rain/glow pick up
       their colour; bright literal fallbacks below for non-accent contexts. */
    --mag:#ff79cf; --cyan:#45e7ff; --amber:#ffc36b; --violet:#9a6bff;
    --cyber-rain: color-mix(in srgb, var(--cv-accent) 55%, #45e7ff);
  }
  body {
    min-height:100vh; overflow-x:hidden; color:var(--cv-ink);
    font-family: "Segoe UI", system-ui, -apple-system, "Helvetica Neue", sans-serif;
    /* Deep blue-violet city haze settling into near-black. */
    background:
      radial-gradient(140% 80% at 18% -8%, rgba(255,77,180,0.10) 0%, transparent 46%),
      radial-gradient(140% 80% at 88% 6%, rgba(60,210,255,0.10) 0%, transparent 48%),
      linear-gradient(180deg, #0a0a1a 0%, #080812 40%, #06060c 100%);
    background-attachment: fixed;
  }
  .cv { position:relative; z-index:2; max-width: 840px; padding: 60px 56px 130px; }

  /* ---- Layer 0: drifting holographic grid + slow haze breathing ---------- */
  .cy-grid { position:fixed; inset:0; z-index:0; pointer-events:none; opacity:0.5;
    background-image:
      linear-gradient(rgba(120,150,255,0.07) 1px, transparent 1px),
      linear-gradient(90deg, rgba(120,150,255,0.07) 1px, transparent 1px);
    background-size: 46px 46px;
    -webkit-mask-image: radial-gradient(120% 90% at 50% 25%, #000 0%, transparent 78%);
    mask-image: radial-gradient(120% 90% at 50% 25%, #000 0%, transparent 78%);
    animation: cy-grid 22s linear infinite; }
  @keyframes cy-grid { to { background-position: 0 46px, 46px 0; } }
  /* A breathing magenta/cyan haze bloom high in the "sky". */
  .cy-haze { position:fixed; inset:0 0 40% 0; z-index:0; pointer-events:none;
    background:
      radial-gradient(40% 30% at 30% 12%, rgba(255,77,180,0.16), transparent 70%),
      radial-gradient(44% 32% at 74% 8%, rgba(60,210,255,0.16), transparent 72%);
    animation: cy-haze 9s ease-in-out infinite; }
  @keyframes cy-haze { 0%,100%{ opacity:0.7; } 50%{ opacity:1; } }

  /* ---- Layer 1: FALLING DIGITAL RAIN (centrepiece) ----------------------- */
  /* Three streak fields = thin neon verticals at different sizes/speeds/opacity.
     Pure repeating-linear-gradients translated down → fast, GPU-cheap, behind
     the content (z-index:1, .cv is z-index:2). */
  .cy-rain { position:fixed; inset:-10% 0 -10% 0; z-index:1; pointer-events:none; }
  .cy-rain span { position:absolute; inset:0; }
  .cy-rain .r1 {
    background-image: repeating-linear-gradient(180deg,
      transparent 0 18px,
      color-mix(in srgb, var(--cyber-rain) 70%, transparent) 18px 40px,
      transparent 40px 150px);
    background-size: 3px 150px; opacity:0.5; animation: cy-fall 0.9s linear infinite; }
  .cy-rain .r2 {
    background-image: repeating-linear-gradient(180deg,
      transparent 0 26px,
      color-mix(in srgb, var(--mag) 60%, transparent) 26px 54px,
      transparent 54px 220px);
    background-size: 2px 220px; background-position: 22px 0; opacity:0.34; animation: cy-fall 1.5s linear infinite; }
  .cy-rain .r3 {
    background-image: repeating-linear-gradient(180deg,
      transparent 0 40px,
      rgba(180,200,255,0.5) 40px 64px,
      transparent 64px 320px);
    background-size: 2px 320px; background-position: 9px 0; opacity:0.22; animation: cy-fall 2.4s linear infinite; }
  @keyframes cy-fall { from { transform: translateY(-150px); } to { transform: translateY(150px); } }

  /* ---- Header: neon-sign panel ------------------------------------------- */
  header.cv-header {
    position:relative; margin-bottom: 2.2rem; padding: 1.4rem 1.5rem 1.3rem;
    border:1px solid var(--cv-rule); border-radius:16px;
    background: linear-gradient(180deg, rgba(16,16,34,0.66), rgba(8,8,18,0.66));
    box-shadow: 0 0 0 1px rgba(0,0,0,0.4), 0 0 50px -12px rgba(60,210,255,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
    overflow:hidden;
    animation: cy-sign 4.2s steps(40) infinite;
  }
  /* Hologram scanline shimmer sweeping the header panel. */
  header.cv-header::before {
    content:""; position:absolute; left:0; right:0; top:-60%; height:60%; z-index:0; pointer-events:none;
    background: linear-gradient(180deg, transparent, rgba(60,210,255,0.10) 50%, transparent);
    animation: cy-holo 6.5s linear infinite;
  }
  header.cv-header > * { position:relative; z-index:1; }
  @keyframes cy-holo { to { transform: translateY(360%); } }
  /* Flickering neon-sign glow on the whole panel (subtle, never hides text). */
  @keyframes cy-sign { 0%,100%{ box-shadow: 0 0 0 1px rgba(0,0,0,0.4), 0 0 50px -12px rgba(60,210,255,0.4), inset 0 1px 0 rgba(255,255,255,0.06); }
    47%{ box-shadow: 0 0 0 1px rgba(0,0,0,0.4), 0 0 42px -14px rgba(255,77,180,0.34), inset 0 1px 0 rgba(255,255,255,0.06); }
    49%{ box-shadow: 0 0 0 1px rgba(0,0,0,0.4), 0 0 60px -8px rgba(60,210,255,0.5), inset 0 1px 0 rgba(255,255,255,0.06); } }

  /* The name + CHROMATIC-ABERRATION GLITCH (jittering RGB split). The literal
     name glyphs stay sharp white (legible); the magenta+cyan offset copies are
     painted as twin text-shadows that twitch on a loop, with a one-pixel
     transform jitter. No duplicate DOM needed, and it's readable at all times.
     prefers-reduced-motion resets the offset so the name never stays split. */
  header.cv-header h1 {
    font-size: clamp(2.2rem, 6.5vw, 3.8rem); font-weight:800; letter-spacing:-0.01em; line-height:1.03;
    color:#ffffff; text-wrap: balance;
    text-shadow: -2px 0 rgba(255,45,180,0.55), 2px 0 rgba(60,210,255,0.55), 0 0 18px rgba(120,160,255,0.4);
    animation: cy-glitch 4.6s steps(1) infinite;
  }
  @keyframes cy-glitch {
    0%,100% { transform: translate(0,0); text-shadow: -2px 0 rgba(255,45,180,0.55), 2px 0 rgba(60,210,255,0.55), 0 0 18px rgba(120,160,255,0.4); }
    6%  { transform: translate(1px,-1px); text-shadow: -4px 0 rgba(255,45,180,0.75), 3px 0 rgba(60,210,255,0.75), 0 0 18px rgba(120,160,255,0.4); }
    9%  { transform: translate(-1px,1px); text-shadow: 3px 0 rgba(255,45,180,0.6), -3px 0 rgba(60,210,255,0.6), 0 0 22px rgba(120,160,255,0.5); }
    12% { transform: translate(0,0); }
    55% { transform: translate(-1px,0); text-shadow: -3px 0 rgba(255,45,180,0.7), 3px 0 rgba(60,210,255,0.7), 0 0 18px rgba(120,160,255,0.4); }
    58% { transform: translate(0,0); }
  }
  header.cv-header .cv-honorific { color:inherit; }
  header.cv-header .cv-headline { color: var(--cyan); font-weight:600; margin-top:0.5rem;
    text-shadow: 0 0 12px rgba(60,210,255,0.5); }
  header.cv-header .cv-headline::before { content:"// "; color: var(--mag); }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a,
  ol.cv-bib > li a { color: var(--cyan); text-shadow:0 0 8px rgba(60,210,255,0.4); }
  header.cv-header .cv-ids a:hover, ol.cv-bib > li a:hover { color: var(--mag); text-shadow:0 0 10px rgba(255,121,207,0.6); }
  header.cv-header .cv-summary { color: var(--cv-ink-2); max-width:64ch; }
  .cv-self {
    color:#ffffff !important; font-weight:800;
    text-shadow: 0 0 8px var(--cyber-rain), 0 0 18px color-mix(in srgb, var(--cyber-rain) 60%, transparent), 0 0 2px rgba(255,255,255,0.6);
  }
  .cv-photo {
    width:122px; height:122px; border-radius:12px; object-fit:cover;
    border:1px solid var(--cyan);
    box-shadow: 0 0 0 1px #06060c, 0 0 22px -4px var(--cyan), 0 0 40px -10px var(--mag);
    filter: contrast(1.06) saturate(1.12) brightness(1.02);
  }

  /* ---- Sections: neon ":: " headings with a glitch-in reveal ------------- */
  section.cv-section { margin-top: 2.6rem; }
  section.cv-section > h2 {
    position:relative; display:inline-flex; align-items:center; gap:0.55em;
    font-size:0.82rem; font-weight:800; text-transform:uppercase; letter-spacing:0.22em;
    color: var(--mag); margin:0 0 0.9rem;
    text-shadow: 0 0 12px rgba(255,121,207,0.5);
  }
  section.cv-section:nth-of-type(3n+2) > h2 { color: var(--cyan); text-shadow:0 0 12px rgba(60,210,255,0.5); }
  section.cv-section:nth-of-type(3n+3) > h2 { color: var(--amber); text-shadow:0 0 12px rgba(255,179,71,0.45); }
  section.cv-section > h2::before { content:"::"; opacity:0.7; letter-spacing:0; }
  /* Pulsing neon underline beneath each heading. */
  section.cv-section > h2::after {
    content:""; position:absolute; left:0; right:0; bottom:-0.35em; height:2px; border-radius:2px;
    background: linear-gradient(90deg, currentColor, transparent);
    box-shadow: 0 0 8px currentColor; opacity:0.85;
    animation: cy-pulse 3.2s ease-in-out infinite;
  }
  @keyframes cy-pulse { 0%,100%{ opacity:0.5; } 50%{ opacity:1; } }

  ol.cv-bib > li { position:relative; padding-left:1.6em; text-indent:0; }
  ol.cv-bib > li::before {
    content:""; position:absolute; left:0; top:0.46em; width:8px; height:8px; transform: rotate(45deg);
    background: var(--cyber-rain); box-shadow: 0 0 8px var(--cyber-rain);
    animation: cy-pulse 2.6s ease-in-out infinite;
  }
  ol.cv-bib > li:nth-child(2n)::before { background: var(--mag); box-shadow:0 0 8px var(--mag); }
  .cv-prose-body p, ul.cv-prose-list > li { color: var(--cv-ink-2); }

  /* Footers — quiet but AA-legible; co-author + reuse links stay neon cyan. */
  .cv-provenance, .cv-license, .cv-attribution { color: var(--cv-faint); }
  .cv-living { color: var(--cv-muted); }
  .cv-attribution a, .cv-license a, .cv-coauthors-list a { color: var(--cyan); }
  .cv-coauthors-h { color: var(--cv-muted); }

  /* ---- Faint decorative scrolling DATA TICKER (aria-hidden, no real text) - */
  .cy-ticker { position:fixed; left:0; right:0; bottom:0; z-index:3; height:22px; pointer-events:none;
    border-top:1px solid var(--cv-rule);
    background: linear-gradient(180deg, transparent, rgba(8,8,18,0.85));
    overflow:hidden; }
  .cy-ticker::before {
    content:""; position:absolute; top:9px; left:0; width:300%; height:3px;
    background: repeating-linear-gradient(90deg,
      rgba(60,210,255,0.5) 0 14px, transparent 14px 22px,
      rgba(255,121,207,0.5) 22px 30px, transparent 30px 56px);
    animation: cy-ticker 9s linear infinite;
  }
  @keyframes cy-ticker { to { transform: translateX(-33.33%); } }

  /* ---- Motion: gated scroll reveals (per heading + per entry) ------------- */
  @keyframes cy-rise { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform:none; } }
  @keyframes cy-head {
    0%   { opacity:0; transform: translateX(-8px); clip-path: inset(0 0 60% 0); text-shadow: 5px 0 var(--mag), -5px 0 var(--cyan); }
    40%  { opacity:1; clip-path: inset(45% 0 18% 0); transform: translateX(4px); }
    70%  { clip-path: inset(0 0 0 0); transform: translateX(0); }
    100% { opacity:1; transform:none; clip-path: inset(0 0 0 0); }
  }
  @keyframes cy-progress { to { transform: scaleX(1); } }
  @supports (animation-timeline: view()) {
    /* Reveal the heading + each entry on their OWN (small) geometry — never the
       whole tall section, which would leave its top dark while its first entries
       are already in the reading zone. */
    section.cv-section > h2 {
      animation: cy-head 620ms steps(6) both;
      animation-timeline: view(); animation-range: entry 0% cover 12%;
    }
    .cv-prose-body > * {
      animation: cy-rise linear both;
      animation-timeline: view(); animation-range: cover 0% cover 10%;
    }
    ol.cv-bib > li {
      animation: cy-rise linear both;
      animation-timeline: view(); animation-range: entry 0% entry 52%;
    }
  }
  @supports (animation-timeline: scroll()) {
    .cy-progress { position:fixed; top:0; left:0; height:3px; width:100%; z-index:60; transform-origin:0 50%; transform:scaleX(0);
      background: linear-gradient(90deg, var(--cyan), var(--mag), var(--amber));
      box-shadow: 0 0 12px rgba(60,210,255,0.7); animation: cy-progress linear both; animation-timeline: scroll(root); }
  }

  @media (max-width: 560px) {
    .cv { padding: 40px 22px 120px; }
    header.cv-header { padding: 1.1rem 1.1rem 1rem; }
  }

  /* ---- Reduced motion: freeze everything, reset the name's RGB split ------ */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; }
    section.cv-section > h2, .cv-prose-body > *, ol.cv-bib > li { opacity:1 !important; transform:none !important; clip-path:none !important; }
    /* The name must NOT stay chromatically offset when motion is off. */
    header.cv-header h1 { transform:none !important; text-shadow: 0 0 16px rgba(120,160,255,0.4) !important; }
    section.cv-section > h2 { text-shadow: 0 0 12px currentColor !important; }
    .cy-rain, .cy-ticker { display:none !important; }
    .cy-grid, .cy-haze { animation:none !important; }
    .cy-progress { display:none !important; }
  }

  @media print {
    .cy-rain, .cy-ticker, .cy-grid, .cy-haze, .cy-progress { display:none !important; }
    header.cv-header { animation:none; box-shadow:none; }
    header.cv-header h1 { text-shadow:none; }
    .cv { padding:0; max-width:none; }
  }`;
}

export const cyberpunkTemplate: CvTemplate = {
  key: "cyberpunk",
  render(cv, sections, theme, opts) {
    const css =
      commonCss(theme) +
      cyberpunkCss(theme) +
      accentSpectrum(["--cyber-rain", "--cyan", "--mag", "--amber"], {
        l: 0.78,
        c: 0.19,
        accentFirst: false,
      });
    const body =
      `<div class="cy-grid" aria-hidden="true"></div>` +
      `<div class="cy-haze" aria-hidden="true"></div>` +
      `<div class="cy-rain" aria-hidden="true"><span class="r1"></span><span class="r2"></span><span class="r3"></span></div>` +
      `<div class="cy-progress" aria-hidden="true"></div>` +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>` +
      `<div class="cy-ticker" aria-hidden="true"></div>`;
    return cvPageShell(cv, css, body);
  },
};
