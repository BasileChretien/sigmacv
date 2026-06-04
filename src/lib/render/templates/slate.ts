import { commonCss, cvPageShell, headerHtml, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Slate" — a full dark-mode CV. The whole page is deep charcoal with light
 * text and a vivid accent; the forced-light charts/authorship render as bright
 * cards that pop against the dark field. It recolours the shared design tokens
 * (--cv-ink/-muted/-rule/-page) so every shared element adapts. A distinctly
 * screen/web look; the dark fill is kept for PDF too (print-color-adjust exact).
 */
function slateCss(theme: TemplateTheme): string {
  const a = theme.accentColor;
  const bg = "#0e1117";
  return `
  /* Recolour the shared tokens for dark mode — everything downstream follows. */
  :root {
    --cv-page: ${bg};
    --cv-ink: #f4f6fa;
    --cv-ink-2: #cdd4e0;
    --cv-muted: #99a2b2;
    --cv-faint: #7c8696;
    --cv-rule: #262b36;
    --cv-rule-strong: #39414f;
  }
  html, body { background: ${bg}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cv { max-width: 820px; padding: 60px 60px; }

  header.cv-header {
    padding-bottom: 1.5rem; margin-bottom: 1.9rem;
    border-bottom: 1px solid var(--cv-rule);
  }
  header.cv-header h1 { font-size: 2.7rem; font-weight: 800; color: #ffffff; letter-spacing: -0.026em; }
  .cv-headline { color: ${a}; font-weight: 600; font-size: 1.22rem; margin-top: 0.3rem; }
  .cv-photo {
    width: 108px; height: 108px; border-radius: 50%; border: 3px solid ${a};
    box-shadow: 0 0 0 6px color-mix(in srgb, ${a} 18%, transparent);
  }
  .cv-ids a, .cv-contact a, .cv-links a { color: ${a}; }

  /* Accent-led section labels with a soft underline. */
  section.cv-section > h2 {
    font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.16em;
    color: ${a}; margin: 0 0 0.7rem; padding-bottom: 0.3rem;
    border-bottom: 1px solid var(--cv-rule);
  }
  ol.cv-bib > li a { color: ${a}; }

  @media print {
    html, body, .cv { background: ${bg}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    section.cv-section { break-inside: auto; }
  }`;
}

export const slateTemplate: CvTemplate = {
  key: "slate",
  render(cv, sections, theme) {
    const css = commonCss(theme) + slateCss(theme);
    const body = `<div class="cv">${headerHtml(cv, { photo: true })}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return cvPageShell(cv, css, body);
  },
};
