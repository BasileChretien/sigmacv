/**
 * Public-page showcase style — "Atelier".
 *
 * A field-tuned credible style for the ARTS, DESIGN and ARCHITECTURE: a gallery
 * portfolio. Bright gallery stock, generous negative space, an oversized display
 * name, a matted portrait, and a single muted-clay accent. These fields have
 * almost no open data source for exhibitions / performances / commissions, so the
 * style is built to look complete with a hand-curated record entered by the owner
 * — it foregrounds the person and the work as a curated wall, not a metric.
 *
 *   • PORTFOLIO HERO — an oversized display name with a small clay label and a
 *     matted (museum-mount) portrait.
 *   • GALLERY LABELS — section headings are small, wide-tracked clay labels over a
 *     thin top rule that draws in, with lots of air between sections.
 *   • CURATED SELF-NAME — the account holder's own (identifier-matched, never
 *     name-string-matched) name is set in clay with a fine underline, like a
 *     gallery caption.
 *
 * Palette is a FIXED gallery-white / ink / clay identity (NOT account-accent-
 * derived). Motion is RESTRAINED. Guardrails: ink ~15:1 on the page; the clay
 * accent text (#a04e38) ~4.7:1; no metric is enlarged or coloured for emphasis.
 * `prefers-reduced-motion` stills all motion; print is plain. CSS-ONLY, light
 * page. Not a mascot style.
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

function atelierCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    /* Gallery white + near-black ink. ink ~15:1, muted ~6.2:1, faint ~5:1 — all AA. */
    --cv-ink:#1b1a18; --cv-ink-2:#3a3733; --cv-muted:#5f5a52; --cv-faint:#726c62;
    --cv-rule: rgba(27,26,24,0.14); --cv-rule-strong: rgba(27,26,24,0.26); --cv-page:#fcfbf9;
    /* Muted clay — accent-ink is the AA text colour; accent is the lighter swatch. */
    --at-accent-ink:#a04e38; --at-accent:#b5563a;
    --at-serif: ui-serif, "Hoefler Text", "Iowan Old Style", "Palatino Linotype", Georgia, serif;
    --at-sans: ui-sans-serif, system-ui, "Helvetica Neue", "Segoe UI", Helvetica, Arial, sans-serif;
  }
  body { min-height:100vh; color:var(--cv-ink); background:var(--cv-page); font-family: var(--at-serif); }
  .cv { position:relative; z-index:1; max-width: 840px; margin:0 auto;
    padding: clamp(56px, 10vw, 120px) clamp(28px, 7vw, 88px) 150px; }

  /* ---- Portfolio hero ---- */
  header.cv-header { position:relative; margin-bottom: 4rem; }
  header.cv-header::before {
    content:"Selected Work · Curriculum Vitæ"; display:block; font-family: var(--at-sans);
    font-size:0.66rem; font-weight:600; letter-spacing:0.32em; text-transform:uppercase;
    color: var(--at-accent-ink); margin-bottom:1.5rem;
  }
  .cv-headmain { gap: 2.6rem; align-items: flex-start; }
  header.cv-header h1 {
    font-family: var(--at-serif); font-size: clamp(3rem, 9.5vw, 5.4rem); font-weight:500;
    line-height:0.98; letter-spacing:-0.022em; color: var(--cv-ink); margin:0 0 0.6rem;
  }
  .cv-honorific { font-style: italic; font-weight:400; }
  header.cv-header .cv-headline {
    font-family: var(--at-serif); font-style: italic; font-weight:400;
    font-size: clamp(1.15rem, 2.8vw, 1.55rem); color: var(--cv-ink-2); margin-top:0.3rem;
  }
  header.cv-header .cv-ids, header.cv-header .cv-contact, header.cv-header .cv-links {
    font-family: var(--at-sans); font-size:0.8rem; letter-spacing:0.04em; color: var(--cv-muted);
  }
  header.cv-header .cv-ids { margin-top:1.1rem; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a {
    color: var(--cv-ink-2); text-decoration: underline; text-decoration-color: var(--at-accent);
    text-decoration-thickness:1px; text-underline-offset:0.2em;
  }
  header.cv-header .cv-metrics { font-family: var(--at-sans); color: var(--cv-muted); }
  .cv-summary { font-size:1.1rem; line-height:1.66; color: var(--cv-ink-2); margin-top:1.7rem; max-width:58ch; }
  /* Museum-mount portrait: a wide white mat + a hairline frame. */
  .cv-photo { width:150px; height:188px; border-radius:1px; object-fit:cover;
    border:8px solid #ffffff; outline:1px solid var(--cv-rule-strong); outline-offset:-9px;
    box-shadow: 0 22px 44px -26px rgba(27,26,24,0.55); }

  /* ---- Gallery-label sections (top rule + wide-tracked clay label, much air) ---- */
  section.cv-section { margin-top: 3.6rem; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; padding-top:1rem; margin:0 0 1.4rem;
    font-family: var(--at-sans); font-size:0.72rem; font-weight:600; text-transform:uppercase;
    letter-spacing:0.26em; color: var(--at-accent-ink);
  }
  section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before {
    content:""; position:absolute; left:0; right:0; top:0; height:1px;
    background: var(--cv-rule-strong); transform-origin:0 50%;
  }

  /* ---- Entries ---- */
  ol.cv-bib > li { margin-bottom:1.15rem; line-height:1.62; font-size:0.99rem; color: var(--cv-ink-2); }
  ol.cv-bib > li a, .cv-prose-body a {
    color: var(--cv-ink); text-decoration: underline; text-decoration-color: var(--at-accent);
    text-decoration-thickness:1px; text-underline-offset:0.18em;
  }
  /* The owner's own name — clay with a fine underline, like a gallery caption. */
  .cv-self {
    color: var(--at-accent-ink) !important; font-weight:600; letter-spacing:0.01em; padding-bottom:0.05em;
    background-image: linear-gradient(var(--at-accent), var(--at-accent));
    background-size:100% 1px; background-position:0 100%; background-repeat:no-repeat;
  }

  .cv-prose-body p { font-size:1.02rem; line-height:1.66; color: var(--cv-ink-2); }
  ul.cv-prose-list > li { line-height:1.62; color: var(--cv-ink-2); }

  .cv-provenance, .cv-license, .cv-living, .cv-attribution { font-family: var(--at-sans); color: var(--cv-faint); }
  .cv-living { color: var(--cv-muted); }
  .cv-attribution a { color: var(--cv-ink-2); text-decoration: underline; text-decoration-color: var(--at-accent); }

  /* ---- Restrained motion ---- */
  @keyframes at-settle { from { opacity:0; transform: translateY(14px); } to { opacity:1; transform:none; } }
  @keyframes at-rule { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @supports (animation-timeline: view()) {
    section.cv-section > h2, .cv-summary-block > .cv-summary-h {
      animation: at-settle cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 12%;
    }
    section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before {
      animation: at-rule cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 14%;
    }
    ol.cv-bib > li {
      animation: at-settle cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% entry 46%;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    section.cv-section > h2, .cv-summary-block > .cv-summary-h,
    ol.cv-bib > li { opacity:1 !important; transform:none !important; }
    section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before { transform:none !important; }
  }
  @media print {
    *,*::before,*::after { animation:none !important; }
    .cv { padding:0; max-width:none; }
  }`;
}

export const atelierTemplate: CvTemplate = {
  key: "atelier",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + atelierCss(theme);
    const body =
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
