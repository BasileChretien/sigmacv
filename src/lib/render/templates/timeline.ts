import { commonCss, cvPageShell, headerHtml, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Timeline" — sections thread one continuous accent rail with a filled node at
 * each heading, so the CV scans as a single vertical narrative. Refined nodes,
 * sentence-case headings and roomy spacing keep it modern rather than gimmicky.
 * The header sits above the rail (it owns the charts/authorship light cards).
 */
function timelineCss(_theme: TemplateTheme): string {
  return `
  .cv { max-width: 770px; padding: 54px 58px; }

  header.cv-header { margin-bottom: 2rem; }
  header.cv-header h1 {
    font-size: 2.2rem; font-weight: 700; letter-spacing: -0.022em; color: var(--cv-ink);
  }
  .cv-headline { font-size: 1.15rem; font-weight: 500; color: var(--cv-accent); margin-top: 0.32rem; }
  .cv-photo { width: 96px; height: 96px; border-radius: 50%; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a { color: var(--cv-accent); }

  /* The rail: each section paints a segment of one unbroken left border. */
  section.cv-section {
    position: relative; margin-top: 0; margin-left: 0.45rem;
    padding-left: 2.2rem; padding-top: var(--cv-space);
    border-left: 2px solid var(--cv-rule);
  }
  section.cv-section:first-of-type { padding-top: calc(var(--cv-space) * 0.55); }

  section.cv-section > h2 {
    position: relative; font-size: 1.02rem; font-weight: 700;
    letter-spacing: -0.006em; color: var(--cv-ink); margin: 0 0 0.7rem;
  }
  /* Filled accent node sitting on the rail, ringed by the page colour. */
  section.cv-section > h2::before {
    content: ""; position: absolute; left: calc(-2.2rem - 7px); top: 0.18em;
    width: 13px; height: 13px; border-radius: 50%;
    background: var(--cv-accent); box-shadow: 0 0 0 4px var(--cv-page);
  }

  ol.cv-bib > li a { color: var(--cv-accent); }

  @media print {
    section.cv-section { break-inside: auto; }
    section.cv-section > h2::before { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }`;
}

export const timelineTemplate: CvTemplate = {
  key: "timeline",
  render(cv, sections, theme) {
    const css = commonCss(theme) + timelineCss(theme);
    const body = `<div class="cv">${headerHtml(cv, { photo: false })}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return cvPageShell(cv, css, body);
  },
};
