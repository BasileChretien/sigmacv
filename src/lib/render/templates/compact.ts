import { commonCss, headerHtml, pageShell, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * The "compact" template: a dense, two-column bibliography (pure CSS columns
 * over the shared single `<ol>` — no markup change), tighter headings. Pairs
 * naturally with density=compact. Entries avoid breaking across columns/pages.
 */
function compactCss(_theme: TemplateTheme): string {
  return `
  header.cv-header { margin-bottom: 1rem; border-bottom: 1px solid #ccc; padding-bottom: 0.5rem; }
  header.cv-header h1 { font-size: 1.6rem; margin: 0 0 0.15rem; }
  header.cv-header .cv-ids { font-size: 0.8rem; color: #555; }
  header.cv-header .cv-ids a { color: var(--cv-accent); text-decoration: none; }
  section.cv-section > h2 {
    font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em;
    color: var(--cv-accent); border-bottom: 1px solid #ddd;
    padding-bottom: 0.15rem; margin: 0 0 0.5rem;
  }
  ol.cv-bib { column-count: 2; column-gap: 1.6rem; }
  ol.cv-bib > li { break-inside: avoid; -webkit-column-break-inside: avoid; }
  @media print { ol.cv-bib { column-count: 2; } }`;
}

export const compactTemplate: CvTemplate = {
  key: "compact",
  render(cv, sections, theme) {
    const css = commonCss(theme) + compactCss(theme);
    const body = `<div class="cv">${headerHtml(cv)}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return pageShell(`${cv.owner.displayName || "CV"} — CV`, css, body);
  },
};
