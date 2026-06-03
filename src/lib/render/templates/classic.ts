import {
  commonCss,
  headerHtml,
  pageShell,
  provenanceFooter,
  sectionsHtml,
} from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * The "classic" template: a traditional academic look — accent-underlined
 * header, uppercase accent section headings with a hairline rule.
 */
function classicCss(_theme: TemplateTheme): string {
  return `
  header.cv-header { margin-bottom: 1.4rem; border-bottom: 2px solid var(--cv-accent); padding-bottom: 0.8rem; }
  header.cv-header h1 { font-size: 1.9rem; margin: 0 0 0.25rem; letter-spacing: 0.2px; }
  header.cv-header .cv-ids { font-size: 0.85rem; color: #555; }
  header.cv-header .cv-ids a { color: var(--cv-accent); text-decoration: none; }
  section.cv-section > h2 {
    font-size: 1.05rem; text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--cv-accent); border-bottom: 1px solid #ddd;
    padding-bottom: 0.25rem; margin: 0 0 0.7rem;
  }`;
}

export const classicTemplate: CvTemplate = {
  key: "classic",
  render(cv, sections, theme) {
    const css = commonCss(theme) + classicCss(theme);
    const body = `<div class="cv">${headerHtml(cv)}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return pageShell(`${cv.owner.displayName || "CV"} — CV`, css, body);
  },
};
