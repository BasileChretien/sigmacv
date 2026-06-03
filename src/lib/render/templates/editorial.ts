import { commonCss, headerHtml, pageShell, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Editorial" — a single-column, magazine-like layout: a large name over a
 * thick accent rule, an accent-coloured headline, and small-caps section
 * headers. No photo (kept text-forward and elegant).
 */
function editorialCss(_theme: TemplateTheme): string {
  return `
  .cv { max-width: 740px; padding: 52px 56px; }
  header.cv-header { border-bottom: 3px solid var(--cv-accent); padding-bottom: 1rem; margin-bottom: 1.9rem; }
  header.cv-header h1 { font-size: 2.2rem; font-weight: 700; letter-spacing: -0.022em; line-height: 1.05; }
  header.cv-header .cv-headline { font-size: 1.25rem; color: var(--cv-accent); font-weight: 600; margin-top: 0.4rem; letter-spacing: 0.01em; }
  header.cv-header .cv-ids a { color: var(--cv-accent); }
  .cv-summary { font-size: 1rem; line-height: 1.6; color: var(--cv-ink-2); }
  section.cv-section > h2 {
    font-size: 1.05rem; font-weight: 600; font-variant: small-caps; letter-spacing: 0.06em;
    color: var(--cv-ink); margin: 0 0 0.7rem; padding-bottom: 0.22rem;
    border-bottom: 1px solid var(--cv-rule-strong);
  }
  ol.cv-bib > li { line-height: 1.5; }`;
}

export const editorialTemplate: CvTemplate = {
  key: "editorial",
  render(cv, sections, theme) {
    const css = commonCss(theme) + editorialCss(theme);
    const body = `<div class="cv">${headerHtml(cv)}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return pageShell(`${cv.owner.displayName || "CV"} — CV`, css, body);
  },
};
