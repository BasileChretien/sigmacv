/**
 * Public-page showcase style — "Codex".
 *
 * A field-tuned credible style for the HUMANITIES: a printed monograph. Warm
 * ivory book stock, classic old-style serif typography, a hardback book-spine in
 * the left margin, fleuron section marks, a drop-capped opening, and an oxblood
 * (bookbinding) accent. Built for disciplines whose record is books and chapters,
 * read by people who distrust metrics — so it foregrounds prose and the
 * bibliography, never a number.
 *
 *   • BOOK-SPINE — a hardback oxblood spine with a thin gold keyline runs down the
 *     far-left gutter (hidden on narrow viewports / print).
 *   • FRONTISPIECE — a small-caps eyebrow and an old-style masthead; the summary
 *     opens with a drop cap.
 *   • FLEURON HEADINGS — each section is marked by a fleuron (❧) in oxblood over a
 *     thin rule that draws in.
 *   • PRINTED SELF-NAME — the account holder's own (identifier-matched, never
 *     name-string-matched) name is set in oxblood small-caps, like printed emphasis.
 *
 * Palette is a FIXED ivory/ink/oxblood identity (NOT account-accent-derived).
 * Motion is RESTRAINED. Guardrails: ink ~13:1 on the ivory page; the oxblood text
 * (#6e2530) ~7:1; the bright spine oxblood is a fill / decoration, never small
 * text. `prefers-reduced-motion` stills all motion; print drops the spine. Pairs
 * naturally with a books-first section order + a notes-bibliography citation style
 * (a content choice, set separately). CSS-ONLY, light page. Not a mascot style.
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

function codexCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    /* Ivory book stock + warm ink. ink ~13:1, muted ~6:1, faint ~4.9:1 — all AA. */
    --cv-ink:#2a2420; --cv-ink-2:#473f37; --cv-muted:#675d52; --cv-faint:#776b5e;
    --cv-rule: rgba(42,36,32,0.16); --cv-rule-strong: rgba(42,36,32,0.32); --cv-page:#f6f1e6;
    /* Oxblood bookbinding — spine = bright fill/decoration; spine-ink = the deep
       oxblood used wherever it becomes text; gold = the spine keyline. */
    --cx-spine:#7a2b35; --cx-spine-ink:#6e2530; --cx-gold:#9c7b3f;
    --cx-serif: ui-serif, "Iowan Old Style", "Hoefler Text", "Palatino Linotype", Georgia, "Times New Roman", serif;
    --cx-sans: ui-sans-serif, system-ui, "Optima", "Segoe UI", Helvetica, Arial, sans-serif;
  }
  body { min-height:100vh; color:var(--cv-ink); background:var(--cv-page); font-family: var(--cx-serif); }

  /* ---- Hardback book-spine in the left gutter ---- */
  .cx-spine { position:fixed; left:0; top:0; bottom:0; width: clamp(10px, 2.2vw, 26px); z-index:0;
    pointer-events:none; background: var(--cx-spine); box-shadow: inset -1px 0 0 rgba(0,0,0,0.2); }
  .cx-spine::after { content:""; position:absolute; top:0; bottom:0; right:4px; width:1px;
    background: var(--cx-gold); opacity:0.6; }
  @media (max-width: 900px) { .cx-spine { display:none; } }

  .cv { position:relative; z-index:1; max-width: 720px; margin:0 auto;
    padding: clamp(52px, 9vw, 104px) clamp(28px, 6vw, 72px) 140px; }

  /* ---- Frontispiece masthead ---- */
  header.cv-header { position:relative; margin-bottom: 2.8rem; padding-bottom: 1.8rem;
    border-bottom: 1px solid var(--cv-rule-strong); }
  header.cv-header::before {
    content:"Curriculum Vitæ"; display:block; font-family: var(--cx-sans);
    font-size:0.66rem; font-weight:600; letter-spacing:0.34em; text-transform:uppercase;
    color: var(--cx-spine-ink); margin-bottom:1.1rem;
  }
  .cv-headmain { gap: 2rem; align-items: flex-start; }
  header.cv-header h1 {
    font-family: var(--cx-serif); font-size: clamp(2.5rem, 7vw, 4rem); font-weight:500;
    line-height:1.04; letter-spacing:-0.012em; color: var(--cv-ink); margin:0 0 0.5rem;
    font-variant-ligatures: common-ligatures contextual; font-variant-numeric: oldstyle-nums;
  }
  .cv-honorific { font-style: italic; font-weight:400; }
  header.cv-header .cv-headline {
    font-family: var(--cx-serif); font-style: italic; font-weight:400;
    font-size: clamp(1.08rem, 2.6vw, 1.38rem); color: var(--cv-ink-2); margin-top:0.2rem;
  }
  header.cv-header .cv-ids, header.cv-header .cv-contact, header.cv-header .cv-links {
    font-family: var(--cx-sans); font-size:0.8rem; letter-spacing:0.01em; color: var(--cv-muted);
  }
  header.cv-header .cv-ids { margin-top:0.9rem; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a {
    color: var(--cv-ink-2); text-decoration: underline; text-decoration-color: var(--cx-spine);
    text-decoration-thickness:1px; text-underline-offset:0.18em;
  }
  header.cv-header .cv-metrics { font-family: var(--cx-sans); color: var(--cv-muted); }
  .cv-summary { font-size:1.06rem; line-height:1.64; color: var(--cv-ink-2); margin-top:1.5rem; max-width:60ch; }
  .cv-summary::first-letter {
    font-size:3.2em; line-height:0.82; float:left; margin:0.04em 0.09em -0.02em 0;
    font-weight:500; color: var(--cx-spine-ink);
  }
  /* Matted frontispiece portrait. */
  .cv-photo { width:120px; height:150px; border-radius:2px; object-fit:cover;
    border:5px solid #fffdf6; outline:1px solid var(--cx-spine); outline-offset:-6px;
    box-shadow: 0 14px 30px -18px rgba(42,36,32,0.5); filter: grayscale(0.35) sepia(0.1) contrast(1.02); }

  /* ---- Sections: fleuron + small-caps + thin rule ---- */
  section.cv-section { margin-top: 2.9rem; }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    position:relative; padding-left:1.7rem; padding-bottom:0.6rem;
    font-family: var(--cx-serif); font-size:0.92rem; font-weight:600; font-variant: small-caps;
    letter-spacing:0.12em; color: var(--cv-ink); margin:0 0 1.1rem;
  }
  section.cv-section > h2::before, .cv-summary-block > .cv-summary-h::before {
    content:"❧"; position:absolute; left:0; top:-0.05em; font-variant:normal;
    color: var(--cx-spine); font-size:1rem;
  }
  section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
    content:""; position:absolute; left:1.7rem; right:0; bottom:0; height:1px;
    background: var(--cv-rule-strong); transform-origin:0 50%;
  }

  /* ---- Entries ---- */
  ol.cv-bib > li { margin-bottom:1.05rem; line-height:1.6; font-size:0.99rem; color: var(--cv-ink-2); }
  ol.cv-bib > li a, .cv-prose-body a {
    color: var(--cv-ink); text-decoration: underline; text-decoration-color: var(--cx-spine);
    text-decoration-thickness:1px; text-underline-offset:0.16em;
  }
  /* The owner's own name — oxblood small-caps, like printed emphasis. */
  .cv-self {
    color: var(--cx-spine-ink) !important; font-weight:600; font-variant: small-caps; letter-spacing:0.03em;
  }

  .cv-prose-body p { font-size:1.0rem; line-height:1.64; color: var(--cv-ink-2); }
  ul.cv-prose-list > li { line-height:1.6; color: var(--cv-ink-2); }

  .cv-provenance, .cv-license, .cv-living, .cv-attribution { font-family: var(--cx-sans); color: var(--cv-faint); }
  .cv-living { color: var(--cv-muted); }
  .cv-attribution a { color: var(--cv-ink-2); text-decoration: underline; text-decoration-color: var(--cx-spine); }

  /* ---- Restrained motion ---- */
  @keyframes cx-settle { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform:none; } }
  @keyframes cx-rule { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  @supports (animation-timeline: view()) {
    section.cv-section > h2, .cv-summary-block > .cv-summary-h {
      animation: cx-settle cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 12%;
    }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after {
      animation: cx-rule cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% cover 14%;
    }
    ol.cv-bib > li {
      animation: cx-settle cubic-bezier(0.22,1,0.36,1) both;
      animation-timeline: view(); animation-range: entry 0% entry 46%;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    *,*::before,*::after { animation:none !important; }
    section.cv-section > h2, .cv-summary-block > .cv-summary-h,
    ol.cv-bib > li { opacity:1 !important; transform:none !important; }
    section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after { transform:none !important; }
  }
  @media print {
    .cx-spine { display:none !important; }
    *,*::before,*::after { animation:none !important; }
    .cv { padding:0; max-width:none; }
  }`;
}

export const codexTemplate: CvTemplate = {
  key: "codex",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + codexCss(theme);
    const body =
      `<div class="cx-spine" aria-hidden="true"></div>` +
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
