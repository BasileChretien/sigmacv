import { commonCss, cvPageShell, headerHtml, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Slate" — a professional Canva-style header resume: a clean SOLID accent band
 * across the top carries the name, role, contact and photo in white; the body is
 * white with accent-underlined section headings. Tasteful, corporate-friendly
 * (no gradient, no dark mode). The colour is confined to the top band so the PDF
 * prints mostly ink-light below it.
 */
function slateCss(theme: TemplateTheme): string {
  const a = theme.accentColor;
  const g = "56px";
  return `
  .cv { max-width: 840px; padding: 0; }

  /* Solid accent header band (the signature). */
  header.cv-header {
    background: ${a}; color: #fff;
    padding: 48px ${g} 40px; margin: 0 0 2rem;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  header.cv-header h1 { font-size: 2.7rem; font-weight: 800; color: #fff; letter-spacing: -0.026em; }
  header.cv-header .cv-honorific { color: #fff; }
  .cv-headline { color: rgba(255,255,255,0.94); font-weight: 500; font-size: 1.24rem; margin-top: 0.4rem; }
  .cv-ids, .cv-contact, .cv-links, .cv-metrics { color: rgba(255,255,255,0.9); }
  .cv-ids a, .cv-contact a, .cv-links a { color: #fff; }
  .cv-metric-context { color: rgba(255,255,255,0.72); }
  .cv-summary { color: rgba(255,255,255,0.95); }
  .cv-photo { width: 110px; height: 110px; border-radius: 10px; border: 3px solid rgba(255,255,255,0.55); }
  .cv-charts, .cv-authorship { border: 0; box-shadow: 0 6px 18px rgba(0,0,0,0.15); }

  /* White body with accent-underlined section headings. */
  section.cv-section { margin: 0 ${g} var(--cv-space); }
  section.cv-section:first-of-type { margin-top: 0; }
  section.cv-section > h2 {
    display: inline-block; font-size: 0.8rem; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.1em; color: ${a};
    margin: 0 0 0.65rem; padding-bottom: 0.28rem; border-bottom: 2px solid ${a};
  }
  ol.cv-bib > li a { color: ${a}; }
  .cv-provenance { margin: 1.6rem ${g} 2.4rem; }

  @media print {
    header.cv-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    section.cv-section { break-inside: auto; }
  }`;
}

export const slateTemplate: CvTemplate = {
  key: "slate",
  render(cv, sections, theme) {
    const css = commonCss(theme) + slateCss(theme);
    const body = `<div class="cv">${headerHtml(cv, { photo: true })}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return cvPageShell(cv, css, body);
  },
};
