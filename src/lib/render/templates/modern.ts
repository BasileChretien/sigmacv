import { commonCss, headerHtml, pageShell, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * The "modern" template: a cleaner, more typographic look — large accent name,
 * quiet grey small-caps section labels with an accent left-bar.
 */
function modernCss(_theme: TemplateTheme): string {
  return `
  .cv { padding-top: 56px; padding-bottom: 48px; }
  header.cv-header { margin-bottom: 2rem; }
  header.cv-header h1 { font-size: 2.4rem; font-weight: 700; color: var(--cv-accent); letter-spacing: -0.022em; line-height: 1.02; }
  header.cv-header .cv-headline { font-size: 1.05rem; color: var(--cv-ink-2); margin-top: 0.25rem; }
  .cv-photo { width: 112px; height: 112px; border-radius: 12px; }
  section.cv-section > h2 {
    font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.16em;
    color: var(--cv-muted); margin: 0 0 0.7rem; padding-left: 0.7rem;
    border-left: 3px solid var(--cv-accent);
  }`;
}

export const modernTemplate: CvTemplate = {
  key: "modern",
  render(cv, sections, theme) {
    const css = commonCss(theme) + modernCss(theme);
    const body = `<div class="cv">${headerHtml(cv, { photo: true })}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return pageShell(`${cv.owner.displayName || "CV"} — CV`, css, body);
  },
};
