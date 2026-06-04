import { commonCss, cvPageShell, headerHtml, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Aurora" — a clean, contemporary layout. Colour is used as a precise accent,
 * never a fill: a slim accent spine runs down the content column, the name is
 * oversized with an accent subtitle, and section labels are quiet uppercase
 * tracking with a hairline that runs to the right margin. Airy and print-light.
 */
function auroraCss(_theme: TemplateTheme): string {
  return `
  .cv { max-width: 760px; padding: 58px 60px 56px 66px; position: relative; }
  /* Accent spine down the content column — the signature, ink-light for print. */
  .cv::before {
    content: ""; position: absolute; left: 0; top: 58px; bottom: 56px;
    width: 4px; border-radius: 4px; background: var(--cv-accent);
  }

  header.cv-header { margin-bottom: 2.3rem; }
  header.cv-header h1 {
    font-size: 2.55rem; font-weight: 750; letter-spacing: -0.026em;
    line-height: 1.0; color: var(--cv-ink); margin: 0;
  }
  .cv-headline {
    font-size: 1.18rem; font-weight: 500; color: var(--cv-accent);
    margin-top: 0.45rem; letter-spacing: -0.005em;
  }
  .cv-photo { width: 100px; height: 100px; border-radius: 50%; }
  .cv-ids a, .cv-contact a, .cv-links a { color: var(--cv-accent); }

  /* Quiet label + a hairline filling the rest of the row. */
  section.cv-section > h2 {
    display: flex; align-items: center; gap: 0.85rem;
    font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.18em; color: var(--cv-muted); margin: 0 0 0.8rem;
  }
  section.cv-section > h2::after {
    content: ""; flex: 1 1 auto; height: 1px; background: var(--cv-rule);
  }

  ol.cv-bib > li a { color: var(--cv-accent); }

  @media print {
    .cv::before { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }`;
}

export const auroraTemplate: CvTemplate = {
  key: "aurora",
  render(cv, sections, theme) {
    const css = commonCss(theme) + auroraCss(theme);
    const body = `<div class="cv">${headerHtml(cv, { photo: true })}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return cvPageShell(cv, css, body);
  },
};
