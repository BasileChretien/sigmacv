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
  header.cv-header { margin-bottom: 1.6rem; padding-bottom: 0.9rem; border-bottom: 1.5px solid var(--cv-accent); }
  header.cv-header h1 { font-size: 1.95rem; font-weight: 600; letter-spacing: 0.1px; }
  header.cv-header .cv-ids a { color: var(--cv-accent); }
  section.cv-section > h2 {
    font-size: 0.82rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.1em; color: var(--cv-accent);
    border-bottom: 1px solid var(--cv-rule);
    padding-bottom: 0.28rem; margin: 0 0 0.75rem;
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
