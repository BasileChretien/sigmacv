import { commonCss, cvPageShell, headerHtml, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Slate" — an editorial Swiss grid. Each section's LABEL sits in a narrow left
 * gutter and its content fills the wide right column, divided by a hairline.
 * Monochrome with a single accent and a strong rule under the name — a precise,
 * designed, contemporary look. Prints cleanly (no fills).
 */
function slateCss(_theme: TemplateTheme): string {
  return `
  .cv { max-width: 830px; padding: 56px 58px; }

  header.cv-header {
    margin-bottom: 2rem; padding-bottom: 1.3rem;
    border-bottom: 2.5px solid var(--cv-ink);
  }
  header.cv-header h1 {
    font-size: 2.35rem; font-weight: 700; letter-spacing: -0.022em; color: var(--cv-ink);
  }
  .cv-headline { font-size: 1.12rem; font-weight: 500; color: var(--cv-muted); margin-top: 0.3rem; }
  .cv-photo { width: 92px; height: 92px; border-radius: 8px; }
  .cv-ids a, .cv-contact a, .cv-links a { color: var(--cv-accent); }

  /* The grid: label column + content column, separated by a top hairline. */
  section.cv-section {
    display: grid;
    grid-template-columns: 8.5rem 1fr;
    column-gap: 2rem;
    margin-top: var(--cv-space);
    padding-top: 1rem;
    border-top: 1px solid var(--cv-rule);
  }
  section.cv-section:first-of-type { margin-top: calc(var(--cv-space) * 0.7); }
  section.cv-section > h2 {
    grid-column: 1; margin: 0; line-height: 1.45;
    font-size: 0.72rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.13em; color: var(--cv-accent);
  }
  /* Everything that isn't the heading flows into the right column. */
  section.cv-section > :not(h2) { grid-column: 2; }

  ol.cv-bib > li a { color: var(--cv-accent); }

  @media print {
    /* The label/content grid holds on the printed page too. */
    section.cv-section { break-inside: auto; }
  }`;
}

export const slateTemplate: CvTemplate = {
  key: "slate",
  render(cv, sections, theme) {
    const css = commonCss(theme) + slateCss(theme);
    const body = `<div class="cv">${headerHtml(cv, { photo: false })}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return cvPageShell(cv, css, body);
  },
};
