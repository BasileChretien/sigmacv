import { commonCss, cvPageShell, headerHtml, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Editorial" — a magazine masthead: an oversized display name, an italic accent
 * standfirst, a heavy accent rule under the header, and LARGE display section
 * titles (not the small uppercase labels the other templates use). Deliberately
 * bold and typographic so it never reads like the conservative, centered Classic.
 * Accent is a typographic spice (rule, standfirst, titles' hairline, links) — no
 * fills, so it prints with no dark areas.
 */
function editorialCss(_theme: TemplateTheme): string {
  return `
  .cv { max-width: 800px; padding: 60px 64px; }

  header.cv-header {
    margin-bottom: 2.4rem; padding-bottom: 1.2rem;
    border-bottom: 4px solid var(--cv-accent);
  }
  header.cv-header h1 {
    font-size: 3.15rem; font-weight: 800; letter-spacing: -0.032em;
    line-height: 0.96; margin: 0 0 0.05rem; color: var(--cv-ink);
  }
  /* Italic accent standfirst — the magazine signature. */
  header.cv-header .cv-headline {
    font-size: 1.32rem; font-weight: 500; font-style: italic;
    color: var(--cv-accent); margin-top: 0.5rem; letter-spacing: -0.01em;
  }
  header.cv-header .cv-ids a, header.cv-header .cv-contact a, header.cv-header .cv-links a {
    color: var(--cv-accent);
  }

  /* Large display section titles with a hairline — not small uppercase labels. */
  section.cv-section > h2 {
    font-size: 1.5rem; font-weight: 700; letter-spacing: -0.018em;
    color: var(--cv-ink); margin: 0 0 0.7rem; padding-bottom: 0.3rem;
    border-bottom: 1px solid var(--cv-rule);
  }

  ol.cv-bib > li { line-height: 1.5; }
  ol.cv-bib > li a { color: var(--cv-accent); }

  @media print {
    header.cv-header { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }`;
}

export const editorialTemplate: CvTemplate = {
  key: "editorial",
  render(cv, sections, theme) {
    const css = commonCss(theme) + editorialCss(theme);
    const body = `<div class="cv">${headerHtml(cv, { photo: false })}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return cvPageShell(cv, css, body);
  },
};
