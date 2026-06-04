import { commonCss, cvPageShell, headerHtml, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Aurora" — a clean, professional template in the Canva mould. Tasteful colour
 * used structurally: each section heading is a solid accent "pill" (white text
 * on accent), the role headline is accent-coloured, and the header sits over a
 * quiet rule. White page, modern sans hierarchy, photo supported. Prints cleanly
 * (the only fills are the small heading pills, kept print-exact).
 */
function auroraCss(theme: TemplateTheme): string {
  const a = theme.accentColor;
  return `
  .cv { max-width: 800px; padding: 54px 60px; }

  header.cv-header { margin-bottom: 1.8rem; padding-bottom: 1.2rem; border-bottom: 2px solid var(--cv-rule); }
  header.cv-header h1 { font-size: 2.5rem; font-weight: 800; color: var(--cv-ink); letter-spacing: -0.026em; }
  .cv-headline { color: ${a}; font-weight: 600; font-size: 1.22rem; margin-top: 0.32rem; }
  .cv-photo { width: 106px; height: 106px; border-radius: 50%; }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a { color: ${a}; }

  /* Signature: solid accent section-label pills (white on accent). */
  section.cv-section > h2 {
    display: inline-block; background: ${a}; color: #fff;
    padding: 0.34rem 0.9rem; border-radius: 6px;
    font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.09em;
    margin: 0 0 0.9rem;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  ol.cv-bib > li a { color: ${a}; }

  @media print {
    section.cv-section > h2 { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
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
