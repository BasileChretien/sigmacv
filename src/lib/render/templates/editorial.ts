import { commonCss, headerHtml, pageShell, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Editorial" — a single-column, magazine-like layout: a large name over a
 * thick accent rule, an accent-coloured headline, and small-caps section
 * headers. No photo (kept text-forward and elegant).
 */
function editorialCss(_theme: TemplateTheme): string {
  return `
  .cv { max-width: 720px; }
  header.cv-header { border-bottom: 3px solid var(--cv-accent); padding-bottom: 0.9rem; margin-bottom: 1.6rem; }
  header.cv-header h1 { font-size: 2.5rem; margin: 0; letter-spacing: -0.02em; line-height: 1.05; }
  header.cv-header .cv-headline { font-size: 1.05rem; color: var(--cv-accent); font-weight: 600; margin-top: 0.3rem; }
  header.cv-header .cv-ids a { color: var(--cv-accent); }
  .cv-summary { font-size: 0.98rem; }
  section.cv-section > h2 {
    font-size: 1.1rem; font-variant: small-caps; letter-spacing: 0.05em;
    color: #222; margin: 0 0 0.6rem; padding-bottom: 0.2rem;
    border-bottom: 1px solid #ddd;
  }`;
}

export const editorialTemplate: CvTemplate = {
  key: "editorial",
  render(cv, sections, theme) {
    const css = commonCss(theme) + editorialCss(theme);
    const body = `<div class="cv">${headerHtml(cv)}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return pageShell(`${cv.owner.displayName || "CV"} — CV`, css, body);
  },
};
