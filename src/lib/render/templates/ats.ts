import { commonCss, headerHtml, pageShell, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "ATS" — optimized for Applicant Tracking Systems (résumé parsers): a single
 * column, a standard system sans-serif, plain black text, bold standard section
 * headings, and NO decoration (badges, charts, photo, columns, colour) that
 * confuses parsers. Text stays fully selectable in the PDF. Decoration is hidden
 * via CSS so it's stripped regardless of the user's display toggles.
 */
function atsCss(_theme: TemplateTheme): string {
  return `
  body { font-family: Arial, Helvetica, "Liberation Sans", sans-serif; color: #000; }
  .cv { max-width: 720px; padding: 36px 44px; }
  /* Strip everything a résumé parser can't read. */
  .cv-photo, .cv-charts, .cv-badge { display: none !important; }
  .cv-authorship { display: none !important; }
  .cv-headmain { display: block; }
  header.cv-header { margin-bottom: 1rem; border: 0; }
  header.cv-header h1 { font-size: 1.6rem; font-weight: bold; margin: 0 0 0.2rem; color: #000; letter-spacing: 0; }
  header.cv-header .cv-headline { color: #000; font-weight: normal; }
  .cv-ids, .cv-ids a, .cv-contact, .cv-contact a, .cv-links, .cv-links a, .cv-summary, .cv-metrics { color: #000; }
  section.cv-section > h2 {
    font-size: 1.05rem; font-weight: bold; text-transform: none;
    letter-spacing: 0; border: 0; color: #000; margin: 0 0 0.4rem;
  }
  section.cv-section > h2::after { content: none; }
  ol.cv-bib { column-count: 1; }
  ol.cv-bib > li { padding-left: 0; text-indent: 0; }
  a { color: #000; text-decoration: none; }
  .cv-self { color: #000; font-weight: 700; text-decoration: none; }`;
}

export const atsTemplate: CvTemplate = {
  key: "ats",
  render(cv, sections, theme) {
    const css = commonCss(theme) + atsCss(theme);
    const body = `<div class="cv">${headerHtml(cv)}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return pageShell(`${cv.owner.displayName || "CV"} — CV`, css, body);
  },
};
