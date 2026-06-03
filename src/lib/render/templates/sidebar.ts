import { commonCss, headerHtml, pageShell, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Sidebar" — a modern two-column CV: a coloured accent sidebar (round photo,
 * name, headline, contact, summary) beside a clean main column of sections.
 * Deliberately un-Word-like. Background colours print via print-color-adjust.
 */
function sidebarCss(_theme: TemplateTheme): string {
  return `
  .cv { max-width: 840px; padding: 0; }
  .cv-sidebar-layout { display: grid; grid-template-columns: 240px 1fr; align-items: stretch; }
  .cv-sidebar { background: var(--cv-accent); color: #fff; padding: 34px 22px; }
  .cv-sidebar .cv-header { margin: 0; }
  .cv-sidebar .cv-headmain { flex-direction: column; align-items: flex-start; gap: 0.7rem; }
  .cv-sidebar h1 { font-size: 1.5rem; margin: 0; color: #fff; line-height: 1.15; }
  .cv-sidebar .cv-headline { font-size: 0.92rem; }
  .cv-sidebar .cv-ids,
  .cv-sidebar .cv-contact,
  .cv-sidebar .cv-links,
  .cv-sidebar .cv-metrics,
  .cv-sidebar .cv-summary { color: rgba(255,255,255,0.92); }
  .cv-sidebar .cv-summary { font-size: 0.84rem; }
  .cv-sidebar a { color: #fff; text-decoration: underline; }
  .cv-sidebar .cv-photo { width: 124px; height: 124px; border-radius: 50%; border: 3px solid rgba(255,255,255,0.7); }
  .cv-main { padding: 34px 32px; }
  .cv-main section.cv-section:first-child { margin-top: 0; }
  section.cv-section > h2 {
    font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.1em;
    color: var(--cv-accent); margin: 0 0 0.6rem; padding-bottom: 0.25rem;
    border-bottom: 2px solid #eee;
  }
  @media print {
    .cv-sidebar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }`;
}

export const sidebarTemplate: CvTemplate = {
  key: "sidebar",
  render(cv, sections, theme) {
    const css = commonCss(theme) + sidebarCss(theme);
    const body = `<div class="cv"><div class="cv-sidebar-layout"><aside class="cv-sidebar">${headerHtml(
      cv,
      { photo: true },
    )}</aside><main class="cv-main">${sectionsHtml(sections)}${provenanceFooter(cv)}</main></div></div>`;
    return pageShell(`${cv.owner.displayName || "CV"} — CV`, css, body);
  },
};
