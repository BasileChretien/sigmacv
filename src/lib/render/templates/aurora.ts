import { commonCss, cvPageShell, headerHtml, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Aurora" — bold, design-forward template (gradient accent header). STUB: a
 * placeholder layout to keep the registry compiling; the real design is filled
 * in by the template-redesign pass.
 */
function auroraCss(_theme: TemplateTheme): string {
  return `
  .cv { padding-top: 48px; }
  header.cv-header h1 { color: var(--cv-accent); }`;
}

export const auroraTemplate: CvTemplate = {
  key: "aurora",
  render(cv, sections, theme) {
    const css = commonCss(theme) + auroraCss(theme);
    const body = `<div class="cv">${headerHtml(cv, { photo: true })}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return cvPageShell(cv, css, body);
  },
};
