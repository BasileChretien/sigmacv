/**
 * Public-page showcase style — "Chronicle".
 * An archival CAREER REGISTER. Strictly ACHROMATIC — deep ink on aged grey-white
 * stock, no colour at all (the user's accent is intentionally unused: the
 * distinguishing stance from Meridian's and Trajectory's accent signals). A classic
 * old-style serif with old-style numerals, a fine DOUBLE-RULE masthead, and small-
 * caps register section labels under hairlines. Its signature is a per-ENTRY dated
 * timeline for Positions & Education: each entry's dates sit in a left margin column
 * against a thin vertical rule with a hollow node tick — a dated chronology of a
 * career, distinct from Trajectory's section-level accent rail. Motion is a quiet
 * "ink-set" fade. Reads like a printed record. CSS-ONLY, light page, no JS.
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

function chronicleCss(_t: TemplateTheme): string {
  return `
  :root {
    color-scheme: light;
    /* Achromatic archival palette — ink on aged "stock". All AA on the paper
       (ink ~15:1, ink-2 ~9:1, muted ~5.7:1, faint ~4.8:1). No accent by design. */
    --cv-ink:#1b1b1a; --cv-ink-2:#3a3a38; --cv-muted:#5b5b56; --cv-faint:#6c6c66;
    --cv-rule: rgba(27,27,26,0.16); --cv-rule-strong: rgba(27,27,26,0.42); --cv-page:#f4f3ee;
    --chr-serif: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, ui-serif, serif;
    --chr-sans: ui-sans-serif, system-ui, "Segoe UI", Helvetica, Arial, sans-serif;
    --chr-gutter: 6.5rem; /* the dated left margin for the career timeline */
  }
  body {
    min-height:100vh; color:var(--cv-ink); background:var(--cv-page);
    font-family: var(--chr-serif); font-variant-numeric: oldstyle-nums proportional-nums;
  }
  .cv { max-width: 740px; padding: clamp(44px,7vw,88px) clamp(26px,6vw,64px) 128px; }

  /* ---- Masthead: a register heading closed by a fine double rule ---- */
  header.cv-header { margin-bottom: 2.4rem; padding-bottom: 1.5rem; border-bottom: 3px double var(--cv-rule-strong); }
  .cv-headmain { gap: 1.8rem; align-items: flex-start; }
  header.cv-header h1 {
    font-family: var(--chr-serif); font-weight: 500;
    font-size: clamp(2.3rem, 6.4vw, 3.6rem); line-height: 1.04; letter-spacing: -0.01em;
    color: var(--cv-ink); margin: 0 0 0.35rem; font-variant-ligatures: common-ligatures contextual;
  }
  .cv-honorific { font-style: italic; font-weight: 400; }
  header.cv-header .cv-headline {
    font-family: var(--chr-serif); font-style: italic; font-weight: 400;
    font-size: clamp(1.05rem, 2.4vw, 1.3rem); color: var(--cv-ink-2); margin-top: 0.15rem;
  }
  header.cv-header .cv-ids, header.cv-header .cv-contact, header.cv-header .cv-links {
    font-family: var(--chr-sans); font-size: 0.78rem; letter-spacing: 0.01em; color: var(--cv-muted);
  }
  header.cv-header .cv-ids { margin-top: 0.85rem; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a {
    color: var(--cv-ink-2); text-decoration: underline;
    text-decoration-color: var(--cv-rule-strong); text-underline-offset: 0.16em;
  }
  header.cv-header .cv-metrics { font-family: var(--chr-sans); color: var(--cv-muted); }
  /* Achromatic by design: even ORCID's brand-green iD is rendered in ink here (a
     CSS fill overrides the inline brand-fill presentation attribute). */
  .cv-ico { fill: currentColor; }
  .cv-summary { font-size: 1.02rem; line-height: 1.6; color: var(--cv-ink-2); margin-top: 1.3rem; max-width: 62ch; }
  /* Portrait as a plain grayscale archival plate. */
  .cv-photo {
    width: 108px; height: 138px; object-fit: cover; border-radius: 1px;
    border: 1px solid var(--cv-rule-strong); filter: grayscale(1) contrast(1.03);
  }

  /* ---- Sections: small-caps register labels under a hairline ---- */
  section.cv-section { margin-top: 2.4rem; padding-top: 1.1rem; border-top: 1px solid var(--cv-rule); }
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    font-family: var(--chr-sans); font-size: 0.7rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.26em; color: var(--cv-ink); margin: 0 0 1.05rem;
  }

  /* ---- Entries ---- */
  ol.cv-bib > li { margin-bottom: 0.9rem; line-height: 1.5; font-size: 0.96rem; color: var(--cv-ink-2); }
  ol.cv-bib > li a {
    color: var(--cv-ink); text-decoration: underline;
    text-decoration-color: var(--cv-rule-strong); text-underline-offset: 0.15em;
  }
  /* The account holder's own name — ink-strength, small-caps, fine ink underline
     (no colour: this style is achromatic). */
  .cv-self {
    color: var(--cv-ink) !important; font-weight: 600; font-style: normal;
    font-variant: small-caps; letter-spacing: 0.02em; border-bottom: 1px solid var(--cv-ink);
  }

  /* ============ Dated career timeline — Positions & Education ============
     CSS-only over the shared .cv-history markup: a thin vertical rule down a left
     margin, a hollow node tick per entry, and each entry's dates pulled into the
     margin column (right-aligned to the rule). A per-ENTRY chronology. */
  ol.cv-history { position: relative; }
  ol.cv-history::before {
    content: ""; position: absolute; top: 0.25rem; bottom: 0.25rem;
    left: calc(var(--chr-gutter) - 1.5rem); width: 1px; background: var(--cv-rule-strong);
  }
  ol.cv-history > li { position: relative; padding-left: var(--chr-gutter); margin-bottom: 1.2rem; }
  ol.cv-history > li::before {
    content: ""; position: absolute; left: calc(var(--chr-gutter) - 1.5rem - 3.5px);
    top: 0.4em; width: 7px; height: 7px; border-radius: 50%;
    background: var(--cv-page); border: 1.5px solid var(--cv-ink);
  }
  ol.cv-history .cv-entry-dates {
    position: absolute; left: 0; top: 0; width: calc(var(--chr-gutter) - 2.2rem);
    margin: 0; text-align: right; white-space: normal;
    font-family: var(--chr-sans); font-size: 0.72rem; line-height: 1.35;
    color: var(--cv-muted); font-variant-numeric: lining-nums tabular-nums;
  }
  ol.cv-history .cv-entry-lead { font-weight: 600; color: var(--cv-ink); }
  ol.cv-history .cv-entry-sub { color: var(--cv-muted); }

  /* Prose + footnote-grade footers in the utility sans. */
  .cv-prose-body p { font-size: 0.99rem; line-height: 1.6; color: var(--cv-ink-2); }
  ul.cv-prose-list > li { line-height: 1.5; color: var(--cv-ink-2); }
  .cv-provenance, .cv-license, .cv-living, .cv-attribution, .cv-whatsnew {
    font-family: var(--chr-sans); color: var(--cv-faint);
  }
  .cv-living, .cv-whatsnew { color: var(--cv-muted); }
  .cv-attribution a, .cv-whatsnew a { color: var(--cv-ink-2); text-decoration: underline; }

  /* ---- Quiet "ink-set" motion: a small fade (+ tiny rise) per element ---- */
  @keyframes chr-set { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  @supports (animation-timeline: view()) {
    section.cv-section > h2, .cv-summary-block > .cv-summary-h {
      animation: chr-set cubic-bezier(0.2, 0.7, 0.2, 1) both;
      animation-timeline: view(); animation-range: entry 0% cover 12%;
    }
    ol.cv-bib > li {
      animation: chr-set cubic-bezier(0.2, 0.7, 0.2, 1) both;
      animation-timeline: view(); animation-range: entry 0% entry 44%;
    }
  }

  /* Mobile: drop the dated margin so entries aren't squeezed. */
  @media (max-width: 560px) {
    ol.cv-history::before, ol.cv-history > li::before { display: none; }
    ol.cv-history > li { padding-left: 0; }
    ol.cv-history .cv-entry-dates { position: static; width: auto; text-align: left; margin-top: 0.1rem; }
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation: none !important; }
    section.cv-section > h2, .cv-summary-block > .cv-summary-h,
    ol.cv-bib > li { opacity: 1 !important; transform: none !important; }
  }`;
}

export const chronicleTemplate: CvTemplate = {
  key: "chronicle",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + chronicleCss(theme);
    const body =
      `<div class="cv">` +
      headerHtml(cv, { photo: true }) +
      sectionsHtml(cv, sections) +
      `${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
