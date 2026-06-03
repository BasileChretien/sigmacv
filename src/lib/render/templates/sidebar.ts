import { commonCss, headerHtml, pageShell, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Sidebar" — a modern two-column CV: a coloured accent sidebar (round photo,
 * name, headline, contact, summary) beside a clean main column of sections.
 * Deliberately un-Word-like. Background colours print via print-color-adjust.
 */
function sidebarCss(_theme: TemplateTheme): string {
  return `
  .cv { max-width: 860px; padding: 0; }
  .cv-sidebar-layout { display: grid; grid-template-columns: 250px 1fr; align-items: stretch; min-height: 100vh; }
  .cv-sidebar {
    background: var(--cv-accent);
    background-image: linear-gradient(160deg, var(--cv-accent) 0%, color-mix(in srgb, var(--cv-accent) 82%, #000) 100%);
    color: #fff; padding: 40px 26px;
  }
  .cv-sidebar .cv-header { margin: 0; }
  .cv-sidebar .cv-headmain { flex-direction: column; align-items: flex-start; gap: 1rem; }
  .cv-sidebar h1 { font-size: 1.55rem; font-weight: 700; color: #fff; line-height: 1.12; letter-spacing: -0.01em; }
  .cv-sidebar .cv-headline { font-size: 1.1rem; color: rgba(255,255,255,0.92); font-weight: 500; }
  .cv-sidebar .cv-ids,
  .cv-sidebar .cv-contact,
  .cv-sidebar .cv-links { color: rgba(255,255,255,0.9); font-size: 0.8rem; line-height: 1.7; }
  .cv-sidebar .cv-metrics { color: rgba(255,255,255,0.9); }
  .cv-sidebar .cv-summary {
    color: rgba(255,255,255,0.92); font-size: 0.84rem; line-height: 1.55;
    margin-top: 1.1rem; padding-top: 1.1rem; border-top: 1px solid rgba(255,255,255,0.25); max-width: none;
  }
  .cv-sidebar a { color: #fff; text-decoration: none; border-bottom: 1px solid rgba(255,255,255,0.4); }
  .cv-sidebar .cv-photo { width: 132px; height: 132px; border-radius: 50%; border: 4px solid rgba(255,255,255,0.85); object-fit: cover; }
  .cv-main { padding: 40px 38px; }
  .cv-main section.cv-section:first-child,
  .cv-main section.cv-section:first-of-type { margin-top: 0; }
  .cv-main section.cv-section > h2 {
    font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--cv-accent); margin: 0 0 0.7rem; padding-bottom: 0.3rem; position: relative;
  }
  .cv-main section.cv-section > h2::after {
    content: ""; position: absolute; left: 0; bottom: 0; width: 34px; height: 2px; background: var(--cv-accent);
  }
  .cv-main .cv-provenance { border-top-color: var(--cv-rule); }
  @media print {
    .cv-sidebar-layout { min-height: 0; }
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
