import { commonCss, headerHtml, pageShell, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * The "minimal" template: restrained and rule-free — plain black name, quiet
 * normal-case section headings, no accent chrome. The only colour is the
 * identifier-driven self-name highlight (defined in commonCss).
 */
function minimalCss(_theme: TemplateTheme): string {
  return `
  .cv { max-width: 720px; }
  header.cv-header { margin-bottom: 1.8rem; }
  header.cv-header h1 { font-size: 1.85rem; font-weight: 400; letter-spacing: -0.01em; color: var(--cv-ink); }
  header.cv-header .cv-headline { font-weight: 400; color: var(--cv-muted); }
  header.cv-header .cv-ids a { color: inherit; }
  section.cv-section > h2 {
    font-size: 0.78rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.18em; color: var(--cv-ink-2); margin: 0 0 0.7rem;
  }
  ol.cv-bib > li { line-height: 1.5; }`;
}

export const minimalTemplate: CvTemplate = {
  key: "minimal",
  render(cv, sections, theme) {
    const css = commonCss(theme) + minimalCss(theme);
    const body = `<div class="cv">${headerHtml(cv)}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return pageShell(`${cv.owner.displayName || "CV"} — CV`, css, body);
  },
};
