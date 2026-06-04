import { commonCss, cvPageShell, headerHtml, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Timeline" — a bold numbered layout. A CSS counter stamps a large accent
 * numeral (01, 02, 03 …) in the left margin of each section, so the CV reads as
 * a confident, sequenced narrative. Strong accent header rule and headline. No
 * markup change (the counter rides the shared section structure); prints in
 * colour via print-color-adjust.
 */
function timelineCss(theme: TemplateTheme): string {
  const a = theme.accentColor;
  return `
  .cv { max-width: 800px; padding: 54px 58px; counter-reset: cvsec; }

  header.cv-header {
    margin-bottom: 2.2rem; padding-bottom: 1.2rem;
    border-bottom: 3px solid ${a};
  }
  header.cv-header h1 { font-size: 2.55rem; font-weight: 800; color: var(--cv-ink); letter-spacing: -0.028em; }
  .cv-headline { color: ${a}; font-weight: 600; font-size: 1.24rem; margin-top: 0.32rem; }
  .cv-photo { width: 104px; height: 104px; border-radius: 16px; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a { color: ${a}; }

  /* Big accent numeral in the left margin of every section. */
  section.cv-section {
    counter-increment: cvsec; position: relative;
    padding-left: 4.2rem; margin-top: var(--cv-space);
  }
  section.cv-section > h2 {
    font-size: 1.18rem; font-weight: 800; letter-spacing: -0.014em;
    color: var(--cv-ink); margin: 0 0 0.7rem; padding-top: 0.4rem;
  }
  section.cv-section > h2::before {
    content: counter(cvsec, decimal-leading-zero);
    position: absolute; left: 0; top: 0;
    font-size: 2.5rem; font-weight: 800; line-height: 1;
    letter-spacing: -0.04em; color: ${a};
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  ol.cv-bib > li a { color: ${a}; }

  @media print { section.cv-section { break-inside: auto; } }`;
}

export const timelineTemplate: CvTemplate = {
  key: "timeline",
  render(cv, sections, theme) {
    const css = commonCss(theme) + timelineCss(theme);
    const body = `<div class="cv">${headerHtml(cv, { photo: false })}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return cvPageShell(cv, css, body);
  },
};
