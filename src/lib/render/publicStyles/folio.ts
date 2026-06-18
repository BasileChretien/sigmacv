/**
 * Public-page showcase style — "Folio".
 * A typeset scholarly-journal feature: warm cream paper, elegant system-serif
 * typography, generous whitespace, strong hierarchy. Each section heading is
 * numbered like a journal's table of contents (roman folio mark) and underlined
 * by a thin accent hairline that draws in; the name is large and refined.
 * Motion is RESTRAINED — headings and entries SETTLE in (gentle fade + small
 * rise) on scroll. The accent is a quiet editorial signal (heading rules, the
 * self-name, link underline), never a loud fill. Reads credibly to a hiring
 * committee. CSS-ONLY, light page.
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

function folioCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    /* Warm cream paper, deep warm-ink text, muted/faint warm greys — all AA on
       the cream page (ink ~14:1, muted ~6:1, faint ~4.9:1). */
    --cv-ink:#211d18; --cv-ink-2:#403a31; --cv-muted:#5b5346; --cv-faint:#6a6253;
    --cv-rule: rgba(33,29,24,0.14); --cv-rule-strong: rgba(33,29,24,0.32); --cv-page:#faf7f0;
    --folio-serif: ui-serif, Georgia, "Iowan Old Style", "Palatino Linotype", "Times New Roman", serif;
    --folio-sans: ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
    /* A quiet, legible accent for hairlines / self-name / link underline. A pale
       picked accent would fail contrast, so the self-name floors to ink and only
       leans accent where colour is decorative (hairlines, underlines). */
    --folio-accent: var(--cv-accent);
  }
  body {
    min-height:100vh; color:var(--cv-ink); background:var(--cv-page);
    font-family: var(--folio-serif);
    /* A faint baseline-grid wash gives the page a "typeset on stock" feel without
       any image — extremely subtle, never competes with text. */
    background-image: linear-gradient(var(--cv-page) 0 0);
  }
  .cv { max-width: 760px; padding: clamp(48px, 8vw, 96px) clamp(28px, 6vw, 72px) 132px; counter-reset: folio; }

  /* ---- Masthead / header ---- */
  header.cv-header {
    margin-bottom: 2.6rem; padding-bottom: 1.8rem;
    border-bottom: 1px solid var(--cv-rule-strong);
  }
  /* A tiny journal-style eyebrow above the name, set in the utility sans. */
  header.cv-header::before {
    content: "Curriculum Vitæ"; display: block;
    font-family: var(--folio-sans); font-size: 0.66rem; font-weight: 600;
    letter-spacing: 0.34em; text-transform: uppercase; color: var(--cv-muted);
    margin-bottom: 1.1rem;
  }
  .cv-headmain { gap: 2rem; align-items: flex-start; }
  header.cv-header h1 {
    font-family: var(--folio-serif);
    font-size: clamp(2.5rem, 7vw, 4.1rem); font-weight: 500;
    line-height: 1.02; letter-spacing: -0.018em; color: var(--cv-ink);
    margin: 0 0 0.5rem; font-variant-ligatures: common-ligatures contextual;
  }
  .cv-honorific { font-style: italic; font-weight: 400; }
  header.cv-header .cv-headline {
    font-family: var(--folio-serif); font-style: italic; font-weight: 400;
    font-size: clamp(1.1rem, 2.6vw, 1.4rem); color: var(--cv-ink-2);
    letter-spacing: 0; margin-top: 0.2rem;
  }
  header.cv-header .cv-ids,
  header.cv-header .cv-contact,
  header.cv-header .cv-links {
    font-family: var(--folio-sans); font-size: 0.8rem; letter-spacing: 0.01em;
    color: var(--cv-muted);
  }
  header.cv-header .cv-ids { margin-top: 0.9rem; }
  header.cv-header .cv-ids a,
  header.cv-header .cv-contact a,
  header.cv-header .cv-links a {
    color: var(--cv-ink-2); text-decoration: underline;
    text-decoration-color: var(--folio-accent);
    text-decoration-thickness: 1px; text-underline-offset: 0.18em;
  }
  header.cv-header .cv-metrics { font-family: var(--folio-sans); color: var(--cv-muted); }
  .cv-summary {
    font-size: 1.06rem; line-height: 1.62; color: var(--cv-ink-2);
    margin-top: 1.5rem; max-width: 60ch;
  }
  /* Drop-cap on the summary's first letter — a small editorial flourish. */
  .cv-summary::first-letter {
    font-size: 3.1em; line-height: 0.82; float: left;
    margin: 0.04em 0.09em -0.02em 0; font-weight: 500; color: var(--cv-ink);
  }
  /* Portrait: a quiet warm border + soft duotone, like a printed author photo. */
  .cv-photo {
    width: 120px; height: 150px; border-radius: 2px; object-fit: cover;
    border: 1px solid var(--cv-rule-strong);
    box-shadow: 0 1px 0 rgba(255,255,255,0.6), 0 14px 30px -18px rgba(33,29,24,0.5);
    filter: grayscale(0.55) sepia(0.12) contrast(1.02);
  }

  /* ---- Sections: numbered like a journal contents page ---- */
  section.cv-section { margin-top: 2.8rem; counter-increment: folio; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position: relative; display: flex; align-items: baseline; gap: 0.85rem;
    font-family: var(--folio-serif);
    font-size: 0.82rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.22em; color: var(--cv-ink);
    margin: 0 0 1.15rem; padding-bottom: 0.7rem;
  }
  /* Roman folio numeral in the utility sans, sitting before the heading. */
  section.cv-section > h2::before {
    content: counter(folio, upper-roman);
    font-family: var(--folio-sans); font-size: 0.66rem; font-weight: 700;
    letter-spacing: 0.08em; color: var(--folio-accent);
    flex: none; min-width: 1.6em; padding-top: 0.05em;
  }
  /* Thin accent hairline drawn under each heading (animated to draw in). */
  section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
    content: ""; position: absolute; left: 0; right: 0; bottom: 0;
    height: 1px; background: var(--cv-rule-strong);
    transform-origin: 0 50%;
  }
  /* The accent tint only on the leading segment of the rule, so colour reads
     without ever sitting under body text. */
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    background-image: linear-gradient(90deg, var(--folio-accent) 0 2.2rem, transparent 2.2rem);
    background-size: 100% 2px; background-position: 0 100%; background-repeat: no-repeat;
  }

  /* ---- Entries ---- */
  ol.cv-bib > li {
    margin-bottom: 1rem; line-height: 1.55; font-size: 0.98rem; color: var(--cv-ink-2);
  }
  ol.cv-bib > li a {
    color: var(--cv-ink); text-decoration: underline;
    text-decoration-color: var(--folio-accent);
    text-decoration-thickness: 1px; text-underline-offset: 0.16em;
  }
  /* The account holder's own name — emphasized, legible, leaning on the accent
     but never below ink-strength: serif italic + small-caps + ink colour, with a
     fine accent underline so the accent shows without risking contrast. */
  .cv-self {
    color: var(--cv-ink) !important; font-weight: 600; font-style: normal;
    font-variant: small-caps; letter-spacing: 0.02em;
    border-bottom: 1.5px solid var(--folio-accent); padding-bottom: 0.02em;
  }

  /* Prose sections read as the journal's running body copy. */
  .cv-prose-body p { font-size: 1.0rem; line-height: 1.62; color: var(--cv-ink-2); }
  ul.cv-prose-list > li { line-height: 1.55; color: var(--cv-ink-2); }

  /* Footnote-grade footers, set in the utility sans, kept AA-legible. */
  .cv-provenance, .cv-license, .cv-living, .cv-attribution {
    font-family: var(--folio-sans); color: var(--cv-faint);
  }
  .cv-living { color: var(--cv-muted); }
  .cv-attribution a { color: var(--cv-ink-2); text-decoration: underline; text-decoration-color: var(--folio-accent); }

  /* ---- Restrained motion: settle-in fade + small rise ---- */
  @keyframes folio-settle { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
  @keyframes folio-rule { from { transform: scaleX(0); } to { transform: scaleX(1); } }

  /* Per-heading + per-entry reveals only (small geometry) — never the whole tall
     section (the scroll-reveal trap). Reference terminal.ts lines 62-65. */
  @supports (animation-timeline: view()) {
    section.cv-section > h2, .cv-summary-block > .cv-summary-h {
      animation: folio-settle cubic-bezier(0.22, 1, 0.36, 1) both;
      animation-timeline: view(); animation-range: entry 0% cover 12%;
    }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
      animation: folio-rule cubic-bezier(0.22, 1, 0.36, 1) both;
      animation-timeline: view(); animation-range: entry 0% cover 14%;
    }
    ol.cv-bib > li {
      animation: folio-settle cubic-bezier(0.22, 1, 0.36, 1) both;
      animation-timeline: view(); animation-range: entry 0% entry 46%;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation: none !important; }
    section.cv-section > h2, .cv-summary-block > .cv-summary-h,
    ol.cv-bib > li { opacity: 1 !important; transform: none !important; filter: none !important; }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after { transform: none !important; }
  }`;
}

export const folioTemplate: CvTemplate = {
  key: "folio",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + folioCss(theme);
    const body =
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
