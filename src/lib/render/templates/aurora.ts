import { commonCss, cvPageShell, headerHtml, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Aurora" — a bold, colourful hero. A full-bleed gradient masthead (the accent
 * deepening into shadow) carries an oversized name, a ringed photo and the
 * contact line in light type; the charts/authorship render as white cards
 * floating on the colour. The body is clean white with accent "chip" section
 * labels. Print-aware: the gradient is confined to the masthead.
 */
function auroraCss(theme: TemplateTheme): string {
  const a = theme.accentColor;
  const gutter = "60px";
  return `
  .cv { max-width: 860px; padding: 0; }

  /* ---- GRADIENT HERO MASTHEAD ---- */
  header.cv-header {
    background: radial-gradient(135% 160% at 0% 0%, ${a} 0%, color-mix(in srgb, ${a} 58%, #0b1020) 100%);
    color: #fff;
    padding: 66px ${gutter} 54px;
    margin: 0 0 2.4rem;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  header.cv-header h1 {
    font-size: 3.1rem; font-weight: 800; color: #fff;
    letter-spacing: -0.032em; line-height: 0.98;
  }
  header.cv-header .cv-honorific { color: #fff; }
  .cv-headline { color: rgba(255,255,255,0.94); font-size: 1.32rem; font-weight: 500; margin-top: 0.5rem; }
  .cv-ids, .cv-contact, .cv-links, .cv-metrics { color: rgba(255,255,255,0.9); }
  .cv-ids a, .cv-contact a, .cv-links a { color: #fff; }
  .cv-metric-context { color: rgba(255,255,255,0.72); }
  .cv-summary { color: rgba(255,255,255,0.95); }
  .cv-photo {
    width: 124px; height: 124px; border-radius: 50%;
    border: 4px solid rgba(255,255,255,0.4); box-shadow: 0 8px 22px rgba(0,0,0,0.22);
  }
  /* Charts/authorship are forced-light cards — lift them as white panels. */
  .cv-charts, .cv-authorship { border: 0; border-radius: 14px; box-shadow: 0 10px 26px rgba(0,0,0,0.20); }

  /* ---- WHITE BODY with accent chip labels ---- */
  section.cv-section { margin: 0 ${gutter} var(--cv-space); }
  section.cv-section:first-of-type { margin-top: 0; }
  section.cv-section > h2 {
    display: flex; align-items: center; gap: 0.6rem;
    font-size: 0.74rem; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.14em; color: ${a}; margin: 0 0 0.7rem;
  }
  section.cv-section > h2::before {
    content: ""; width: 22px; height: 4px; border-radius: 4px; background: ${a};
  }
  ol.cv-bib > li a { color: ${a}; }
  .cv-provenance { margin: 1.8rem ${gutter} 2.6rem; }

  @media print {
    header.cv-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .cv-charts, .cv-authorship { box-shadow: none; }
    section.cv-section { break-inside: auto; }
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
