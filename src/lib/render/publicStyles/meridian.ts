/**
 * Public-page showcase style — "Meridian".
 *
 * Austere SWISS / International-typographic minimalism: near-black ink on a warm
 * white ground, a confident system grotesque, hairline (1px) rules, generous
 * margins and a precise modular rhythm. Sections are NUMBERED (01 / 02 / 03 …)
 * via a CSS counter, each introduced by a full-width hairline divider with a
 * single 2px accent tick. Micro-motion only: hairlines, labels and entries
 * resolve with a very small, fast, precise fade (+ ≤8px rise) — no blur, no
 * glow, no bounce. The user's accent appears as a SINGLE restrained signal (the
 * self-name, the section-number marker, the divider tick); everything else is
 * pure monochrome. The "quiet premium" a senior professor would publish.
 * 100% CSS-ONLY → runs under the strict public-page CSP (no JS).
 *
 * Guardrails: reveal start-states gated behind `@supports (animation-timeline)`,
 * targeted at headings + entries individually (never the whole tall section);
 * full `prefers-reduced-motion` fallback.
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

function meridianCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    /* Warm-white ground + near-black ink. The muted/faint inks are floored well
       above AA on the #FBFAF7 ground (--cv-faint #5f5d57 ≈ 6.4:1) so the small
       footer text stays legible. */
    --cv-ink:#16150f; --cv-ink-2:#34322b; --cv-muted:#4d4b43; --cv-faint:#5f5d57;
    --cv-rule:#dedcd4; --cv-rule-strong:#c8c6bd; --cv-page:#fbfaf7;
    --mer-sans: ui-sans-serif, system-ui, "Helvetica Neue", Arial, sans-serif;
  }
  body {
    min-height:100vh; background: var(--cv-page); color: var(--cv-ink);
    font-family: var(--mer-sans);
    letter-spacing: 0.005em;
  }
  /* Generous margins; a single, well-aligned measure. */
  .cv {
    max-width: 760px; padding: clamp(56px, 9vw, 104px) clamp(28px, 7vw, 76px) 132px;
    counter-reset: mer-section;
  }

  /* ---- Header: one austere block, hairline-closed ----------------------- */
  header.cv-header {
    margin-bottom: 2.6rem; padding-bottom: 2.2rem;
    border-bottom: 1px solid var(--cv-rule-strong);
  }
  header.cv-header h1 {
    font-family: var(--mer-sans);
    font-size: clamp(2.05rem, 6vw, 3.25rem); font-weight: 600;
    letter-spacing: -0.022em; line-height: 1.04; margin: 0 0 0.5rem;
    color: var(--cv-ink);
  }
  header.cv-header .cv-honorific { font-weight: 400; color: var(--cv-muted); letter-spacing: -0.01em; }
  header.cv-header .cv-headline {
    font-size: 1.04rem; font-weight: 400; color: var(--cv-ink-2);
    letter-spacing: 0.005em; margin-top: 0.45rem;
  }
  header.cv-header .cv-ids,
  header.cv-header .cv-contact,
  header.cv-header .cv-links {
    font-size: 0.78rem; color: var(--cv-muted); letter-spacing: 0.01em; margin-top: 0.5rem;
  }
  header.cv-header .cv-ids a { color: var(--cv-muted); border-bottom: 1px solid var(--cv-rule-strong); text-decoration: none; }
  header.cv-header .cv-contact a, header.cv-header .cv-links a { color: var(--cv-muted); border-bottom: 1px solid var(--cv-rule); text-decoration: none; }
  header.cv-header .cv-summary {
    font-size: 0.98rem; color: var(--cv-ink-2); line-height: 1.62;
    margin-top: 1.5rem; max-width: 60ch;
  }
  header.cv-header .cv-metrics { font-size: 0.76rem; color: var(--cv-muted); letter-spacing: 0.02em; }

  /* The single restrained accent: the self-name. Otherwise pure monochrome. */
  .cv-self { color: var(--cv-accent) !important; font-weight: 600; }

  /* Square, quiet portrait — flat, no shadow, monochrome to match the system. */
  .cv-photo {
    width: 104px; height: 104px; border-radius: 0; object-fit: cover;
    border: 1px solid var(--cv-rule-strong);
    filter: grayscale(1) contrast(1.02);
  }

  /* ---- Numbered sections: hairline divider + counter + accent tick ------- */
  section.cv-section {
    counter-increment: mer-section;
    margin-top: 2.9rem; padding-top: 1.5rem;
    border-top: 1px solid var(--cv-rule);
    position: relative;
  }
  section.cv-section:first-of-type { margin-top: 2.9rem; }
  /* The 2px accent tick that anchors the hairline above each heading. */
  section.cv-section::before {
    content: ""; position: absolute; top: -1px; left: 0;
    width: 30px; height: 2px; background: var(--cv-accent);
  }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    display: flex; align-items: baseline; gap: 0.85em;
    font-family: var(--mer-sans);
    font-size: 0.95rem; font-weight: 600; color: var(--cv-ink);
    text-transform: uppercase; letter-spacing: 0.085em;
    margin: 0 0 1.15rem;
  }
  /* The modular number (01 / 02 / 03 …) — a CSS counter, NOT fixed nth-child. */
  section.cv-section > h2::before {
    content: counter(mer-section, decimal-leading-zero);
    flex: none;
    font-size: 0.74rem; font-weight: 500; letter-spacing: 0.12em;
    color: var(--cv-accent);
    font-variant-numeric: tabular-nums;
    /* sit the index on the cap line of the heading */
    transform: translateY(-0.06em);
  }

  /* ---- Bibliography: clean, hung, hairline-restrained links -------------- */
  ol.cv-bib > li { line-height: 1.55; color: var(--cv-ink-2); }
  ol.cv-bib > li a {
    color: var(--cv-ink); text-decoration: none;
    border-bottom: 1px solid var(--cv-rule-strong);
  }
  .cv-prose-body p, ul.cv-prose-list > li { color: var(--cv-ink-2); }

  /* Footers stay quiet but AA-legible on the warm ground. */
  .cv-provenance, .cv-license, .cv-attribution { color: var(--cv-faint); }
  .cv-living { color: var(--cv-muted); }
  .cv-attribution a { color: var(--cv-muted); border-bottom: 1px solid var(--cv-rule); text-decoration: none; }
  .cv-license a { color: var(--cv-muted); }

  /* ---- Micro-motion: precise, fast fade (+ ≤8px rise). No blur/glow. ----- */
  @keyframes mer-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @keyframes mer-tick { from { opacity: 0; transform: scaleX(0); } to { opacity: 1; transform: none; } }

  @supports (animation-timeline: view()) {
    /* The accent tick draws in from the left as its divider enters. */
    section.cv-section::before {
      transform-origin: 0 50%;
      animation: mer-tick 360ms ease-out both;
      animation-timeline: view(); animation-range: entry 0% cover 8%;
    }
    section.cv-section > h2, .cv-summary-block > .cv-summary-h {
      animation: mer-rise 420ms ease-out both;
      animation-timeline: view(); animation-range: entry 0% cover 10%;
    }
    ol.cv-bib > li {
      animation: mer-rise 380ms ease-out both;
      animation-timeline: view(); animation-range: cover 0% cover 12%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; }
    section.cv-section > h2, .cv-summary-block > .cv-summary-h, ol.cv-bib > li, section.cv-section::before {
      opacity: 1 !important; transform: none !important;
    }
  }`;
}

export const meridianTemplate: CvTemplate = {
  key: "meridian",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + meridianCss(theme);
    const body =
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
