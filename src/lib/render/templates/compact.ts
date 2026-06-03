import { commonCss, cvPageShell, headerHtml, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * The "compact" template: a dense, two-column bibliography (pure CSS columns
 * over the shared single `<ol>` — no markup change), tighter headings. Pairs
 * naturally with density=compact. Entries avoid breaking across columns/pages.
 */
function compactCss(_theme: TemplateTheme): string {
  return `
  .cv { padding: 36px 44px; }
  header.cv-header { margin-bottom: 1.1rem; padding-bottom: 0.55rem; border-bottom: 1px solid var(--cv-rule-strong); }
  header.cv-header h1 { font-size: 1.6rem; font-weight: 600; }
  header.cv-header .cv-ids a { color: var(--cv-accent); }
  section.cv-section > h2 {
    font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--cv-accent); border-bottom: 1px solid var(--cv-rule);
    padding-bottom: 0.18rem; margin: 0 0 0.55rem;
  }
  ol.cv-bib { column-count: 2; column-gap: 1.8rem; column-fill: balance; padding-left: 0; }
  ol.cv-bib > li {
    break-inside: avoid; -webkit-column-break-inside: avoid;
    padding-left: 1.2em; text-indent: -1.2em;
    hyphens: auto; -webkit-hyphens: auto;
  }
  @media print { ol.cv-bib { column-count: 2; } }`;
}

export const compactTemplate: CvTemplate = {
  key: "compact",
  render(cv, sections, theme) {
    const css = commonCss(theme) + compactCss(theme);
    const body = `<div class="cv">${headerHtml(cv)}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return cvPageShell(cv, css, body);
  },
};
