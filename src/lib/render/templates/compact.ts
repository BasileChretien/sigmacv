import { commonCss, cvPageShell, headerHtml, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * The "compact" template: the densest, most paper-efficient layout. Its
 * signature is a TWO-COLUMN bibliography flowed by pure CSS columns over the
 * shared single `<ol>` (no markup change), paired with a very tight vertical
 * rhythm and small, accent-ruled section labels.
 *
 * Distinct from its siblings:
 *  - vs Classic — two-column bib + tighter rhythm + smaller everything.
 *  - vs ATS — keeps the accent (heading colour/rule, links) and columns;
 *    ATS is single-column monochrome.
 *  - vs Sidebar — no panel/photo; density, not a portrait, is the point.
 *
 * Pairs naturally with density=compact, which already lowers the body point
 * size, line-height and gaps via the shared theme vars — so this template
 * leans on those vars and deliberately adds NO extra margins.
 *
 * Column safety: `headerHtml` renders the charts/authorship cards and summary
 * INSIDE `<header class="cv-header">`, above all sections, so the column rules
 * (scoped to `ol.cv-bib`) can never pull those inline-flex/table elements into
 * a column flow. Bib entries are `break-inside: avoid` so a single citation is
 * never split across a column or page boundary.
 */
function compactCss(_theme: TemplateTheme): string {
  return `
  .cv { padding: 34px 44px; }

  /* HEADER — tight: a single hairline strong rule, no band/fill (keeps PDF
     export legible — no large dark areas anywhere in this template). */
  header.cv-header {
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--cv-rule-strong);
  }
  header.cv-header h1 { font-size: 1.55rem; font-weight: 600; }
  header.cv-header .cv-headline { font-size: 1rem; }
  header.cv-header .cv-ids a { color: var(--cv-accent); }
  /* The supporting cards sit flush under the tight header without extra air. */
  header.cv-header .cv-charts,
  header.cv-header .cv-authorship { margin-top: 0.7rem; }
  header.cv-header .cv-summary { margin-top: 0.7rem; }

  /* SECTION HEADINGS — compact accent rule: small uppercase label in the
     accent colour over a hairline. */
  section.cv-section > h2 {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--cv-accent);
    border-bottom: 1px solid var(--cv-rule);
    padding-bottom: 0.16rem;
    margin: 0 0 0.5rem;
  }

  /* THE SIGNATURE — two-column bibliography over the shared single <ol>.
     Hanging indent is rebuilt per-column (the shared text-indent/padding is
     overridden so each column gets its own clean hang). Hyphenation keeps the
     narrow measure tidy. */
  ol.cv-bib {
    column-count: 2;
    column-gap: 1.8rem;
    column-fill: balance;
    padding-left: 0;
  }
  ol.cv-bib > li {
    break-inside: avoid;
    -webkit-column-break-inside: avoid;
    page-break-inside: avoid;
    padding-left: 1.2em;
    text-indent: -1.2em;
    hyphens: auto;
    -webkit-hyphens: auto;
    overflow-wrap: anywhere;
  }
  /* Long DOIs/URLs in a narrow column must wrap rather than overflow into the
     gutter or the adjacent column. */
  ol.cv-bib > li a { overflow-wrap: anywhere; word-break: break-word; }

  @media print {
    /* Retain two columns in the PDF; hairline rules only — no dark fills. */
    ol.cv-bib { column-count: 2; }
    header.cv-header { border-bottom-color: var(--cv-rule-strong); }
  }`;
}

export const compactTemplate: CvTemplate = {
  key: "compact",
  render(cv, sections, theme) {
    const css = commonCss(theme) + compactCss(theme);
    const body = `<div class="cv">${headerHtml(cv)}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return cvPageShell(cv, css, body);
  },
};
