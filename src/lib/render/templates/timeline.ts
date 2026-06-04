import { commonCss, cvPageShell, headerHtml, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Timeline" — a left accent-rail with section markers. STUB: a placeholder
 * layout to keep the registry compiling; the real design is filled in by the
 * template-redesign pass.
 */
function timelineCss(_theme: TemplateTheme): string {
  return `
  .cv { padding-top: 48px; }
  header.cv-header h1 { color: var(--cv-accent); }`;
}

export const timelineTemplate: CvTemplate = {
  key: "timeline",
  render(cv, sections, theme) {
    const css = commonCss(theme) + timelineCss(theme);
    const body = `<div class="cv">${headerHtml(cv)}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return cvPageShell(cv, css, body);
  },
};
