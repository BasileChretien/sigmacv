/**
 * Public-page showcase style — "Lumina".
 * A near-black cinematic STAGE. A soft radial "spotlight" glow in the user's
 * accent sits behind the header and gently BREATHES (slow opacity + scale). The
 * name is set in a large light serif with a subtle luminous sheen; sections RISE
 * from black on expensive easing, and a thin accent underline SWEEPS in under
 * each heading as it reveals. The accent is the single light source. Restrained,
 * premium, not flashy. CSS-ONLY (no JS, no external assets).
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

function luminaCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: dark;
    /* Light inks on near-black — every value below is WCAG-AA verified against
       the #070708 page (lowest is --cv-faint #9aa1ad ≈ 7.6:1). The small
       provenance/license/living/attribution footnotes inherit --cv-faint /
       --cv-muted, so they stay legible — the failure mode this style guards. */
    --cv-ink:#edeef1; --cv-ink-2:#c9cdd6; --cv-muted:#aab1bd; --cv-faint:#9aa1ad;
    --cv-rule: rgba(255,255,255,0.09); --cv-rule-strong: rgba(255,255,255,0.16); --cv-page:#070708;
    /* A LIGHT accent for link text on the near-black stage. The page --cv-accent
       is floored DARK (≥4.7:1 vs WHITE), so accent-coloured text reads at only
       ~3.0:1 on #070708 — the accent-on-dark trap. The literal #7aa2ff fallback
       is ~8.1:1; the oklch line (where supported) re-lightens the user's own
       accent hue to L≈0.82 (≥9:1). */
    --cv-accent-light: #7aa2ff;
  }
  @supports (color: oklch(from red l c h)) {
    :root { --cv-accent-light: oklch(from var(--cv-accent) 0.82 0.16 h); }
  }
  body {
    min-height:100vh; color:var(--cv-ink);
    /* The stage: a whisper of cool light at the very top, then deep black. */
    background:
      radial-gradient(120% 60% at 50% -10%, #15161c 0%, transparent 55%),
      #070708;
    background-attachment: fixed;
  }
  .cv { max-width: 820px; padding: 9vh 48px 16vh; position: relative; z-index: 1; }

  /* The breathing spotlight — the single light source, in the user's accent.
     Fixed, decorative, low-amplitude. Sits behind everything (z-index:0). */
  .lumina-spot {
    position: fixed; left: 50%; top: -12vh; transform: translateX(-50%);
    width: min(1100px, 150vw); height: 70vh; z-index: 0; pointer-events: none;
    background:
      radial-gradient(closest-side, var(--cv-accent), transparent 72%);
    opacity: 0.18; filter: blur(60px);
    animation: lumina-breathe 11s ease-in-out infinite;
  }
  /* A second, tighter core for a touch of depth — also breathing, offset phase. */
  .lumina-spot::after {
    content:""; position:absolute; left:50%; top:34%; transform: translate(-50%,-50%);
    width: 46%; height: 46%; border-radius:50%;
    background: radial-gradient(closest-side, var(--cv-accent), transparent 70%);
    opacity: 0.6; filter: blur(34px);
    animation: lumina-breathe 11s ease-in-out infinite reverse;
  }
  @keyframes lumina-breathe {
    0%,100% { opacity: 0.14; transform: translateX(-50%) scale(1); }
    50%     { opacity: 0.24; transform: translateX(-50%) scale(1.07); }
  }

  /* ---- Header ---- */
  header.cv-header { margin-bottom: 2.6rem; padding-bottom: 1.6rem; border-bottom: 1px solid var(--cv-rule); }
  header.cv-header h1 {
    font-family: ui-serif, "Iowan Old Style", "Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif;
    font-size: clamp(2.4rem, 6.5vw, 4rem); font-weight: 500; letter-spacing: -0.015em; line-height: 1.04;
    color: var(--cv-ink);
  }
  /* A subtle luminous sheen on the name (accent-tinted), no harsh glow. */
  @supports ((background-clip:text) or (-webkit-background-clip:text)) {
    header.cv-header h1 {
      background: linear-gradient(176deg, #ffffff 0%, #e7e9ee 46%, var(--cv-accent) 132%);
      -webkit-background-clip:text; background-clip:text; color:transparent;
      text-shadow: 0 0 28px rgba(255,255,255,0.05);
    }
  }
  header.cv-header .cv-headline {
    font-family: ui-serif, "Iowan Old Style", Georgia, serif;
    font-style: italic; font-weight: 400; color: var(--cv-ink-2); margin-top: 0.55rem; letter-spacing: 0.005em;
  }
  header.cv-header .cv-ids a, ol.cv-bib > li a { color: var(--cv-accent-light); text-decoration: none; }
  header.cv-header .cv-ids a:hover, ol.cv-bib > li a:hover { text-decoration: underline; text-underline-offset: 0.18em; }
  header.cv-header .cv-summary { color: var(--cv-ink-2); max-width: 60ch; }
  .cv-self {
    color:#ffffff !important; font-weight:600;
    /* A refined, legible accent emphasis — a faint luminous wash, not a flare. */
    text-shadow: 0 0 16px color-mix(in srgb, var(--cv-accent) 55%, transparent);
  }
  .cv-photo {
    width:120px; height:120px; border-radius:50%; object-fit:cover;
    border:1px solid var(--cv-rule-strong);
    box-shadow: 0 0 0 6px rgba(255,255,255,0.02), 0 24px 60px -28px #000,
      0 0 40px -6px color-mix(in srgb, var(--cv-accent) 45%, transparent);
  }

  /* ---- Sections ---- */
  section.cv-section { margin-top: 3rem; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position: relative; display: inline-block;
    font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.26em;
    color: var(--cv-ink); margin: 0 0 1.1rem; padding-bottom: 0.55rem;
  }
  /* The accent underline that SWEEPS in on reveal (origin-left scaleX). */
  section.cv-section > h2::after {
    content:""; position:absolute; left:0; bottom:0; height:1.5px; width:100%;
    background: linear-gradient(90deg, var(--cv-accent), transparent);
    transform: scaleX(0); transform-origin: 0 50%;
  }
  ol.cv-bib > li { position:relative; }
  /* A quiet accent tick before each entry — the only ornament. */
  ol.cv-bib > li::before {
    content:""; position:absolute; left:calc(var(--cv-hang) * -1); top:0.62em;
    width:5px; height:5px; border-radius:50%;
    background: var(--cv-accent); opacity:0.7;
    box-shadow: 0 0 8px color-mix(in srgb, var(--cv-accent) 70%, transparent);
  }
  /* Prose sections share the rising reveal + heading sweep (same h2). */
  .cv-prose-body p, ul.cv-prose-list > li { color: var(--cv-ink-2); }

  /* ---- Motion: expensive easing, gated entirely behind scroll-timeline ---- */
  @keyframes lumina-rise { from { opacity:0; transform: translateY(34px); } to { opacity:1; transform: none; } }
  @keyframes lumina-rise-soft { from { opacity:0; transform: translateY(18px); } to { opacity:1; transform: none; } }
  @keyframes lumina-sweep { to { transform: scaleX(1); } }

  @supports (animation-timeline: view()) {
    /* Per-HEADING and per-ENTRY only — NEVER the whole tall section (the
       scroll-reveal trap: a tall section's range scales with its height and
       strands the top). */
    section.cv-section > h2, .cv-summary-block > .cv-summary-h {
      animation: lumina-rise cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 12%;
    }
    section.cv-section > h2::after {
      animation: lumina-sweep cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 4% cover 16%;
    }
    ol.cv-bib > li, .cv-prose-body p {
      animation: lumina-rise-soft cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 14%;
    }
  }
  @supports (animation-timeline: scroll()) {
    /* A hairline accent progress bar — the only fixed UI flourish. */
    .lumina-progress {
      position: fixed; top: 0; left: 0; height: 2px; width: 100%; z-index: 60;
      transform-origin: 0 50%; transform: scaleX(0);
      background: linear-gradient(90deg, var(--cv-accent), transparent);
      box-shadow: 0 0 10px color-mix(in srgb, var(--cv-accent) 70%, transparent);
      animation: lumina-sweep linear both; animation-timeline: scroll(root);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; }
    section.cv-section > h2, ol.cv-bib > li, .cv-prose-body p { opacity:1 !important; transform:none !important; }
    section.cv-section > h2::after { transform: scaleX(1) !important; }
    .lumina-spot { display:none; }
    .lumina-progress { display:none; }
  }`;
}

export const luminaTemplate: CvTemplate = {
  key: "lumina",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + luminaCss(theme);
    const body =
      `<div class="lumina-spot" aria-hidden="true"></div>` +
      `<div class="lumina-progress" aria-hidden="true"></div>` +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
