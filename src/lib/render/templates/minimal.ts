import { commonCss, headerHtml, pageShell, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * The "minimal" template: restrained and rule-free — plain black name, quiet
 * normal-case section headings, no accent chrome. The only colour is the
 * identifier-driven self-name highlight (defined in commonCss).
 */
function minimalCss(_theme: TemplateTheme): string {
  return `
  header.cv-header { margin-bottom: 1.4rem; }
  header.cv-header h1 { font-size: 1.7rem; font-weight: 400; margin: 0 0 0.2rem; }
  header.cv-header .cv-ids { font-size: 0.85rem; color: #555; }
  header.cv-header .cv-ids a { color: inherit; text-decoration: none; }
  section.cv-section > h2 {
    font-size: 0.95rem; font-weight: 600; color: #333; margin: 0 0 0.6rem;
  }`;
}

export const minimalTemplate: CvTemplate = {
  key: "minimal",
  render(cv, sections, theme) {
    const css = commonCss(theme) + minimalCss(theme);
    const body = `<div class="cv">${headerHtml(cv)}${sectionsHtml(sections)}</div>`;
    return pageShell(`${cv.owner.displayName || "CV"} — CV`, css, body);
  },
};
