import { commonCss, headerHtml, pageShell, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * The "modern" template: a cleaner, more typographic look — large accent name,
 * quiet grey small-caps section labels with an accent left-bar.
 */
function modernCss(_theme: TemplateTheme): string {
  return `
  .cv { padding-top: 48px; }
  header.cv-header { margin-bottom: 1.6rem; }
  header.cv-header h1 { font-size: 2.2rem; margin: 0; color: var(--cv-accent); letter-spacing: -0.01em; }
  header.cv-header .cv-ids { font-size: 0.85rem; color: #666; margin-top: 0.3rem; }
  header.cv-header .cv-ids a { color: var(--cv-accent); text-decoration: none; }
  section.cv-section > h2 {
    font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.12em;
    color: #888; margin: 0 0 0.6rem; padding-left: 0.6rem;
    border-left: 3px solid var(--cv-accent);
  }`;
}

export const modernTemplate: CvTemplate = {
  key: "modern",
  render(cv, sections, theme) {
    const css = commonCss(theme) + modernCss(theme);
    const body = `<div class="cv">${headerHtml(cv)}${sectionsHtml(sections)}</div>`;
    return pageShell(`${cv.owner.displayName || "CV"} — CV`, css, body);
  },
};
