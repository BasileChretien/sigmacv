import { commonCss, cvPageShell, headerHtml, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * The "minimal" template: ultra-airy, hairline/no-rule, quiet elegance.
 *
 * Its signature is restraint — a feather-light 300-weight name, zero rules
 * anywhere, a narrow measure with extreme whitespace, and a SINGLE thin accent
 * tick before each section heading. That tick (plus the identifier-driven
 * `.cv-self` highlight from commonCss) is the only colour in the whole document.
 *
 * Distinct from siblings: vs Classic it has NO rules and a light name; vs
 * Modern it has NO accent name and NO left-bar; vs Editorial it is quiet, not
 * oversized — the calmest template.
 */
function minimalCss(_theme: TemplateTheme): string {
  return `
  /* Narrower measure + extra padding = more whitespace than the 780px default. */
  .cv { max-width: 680px; padding: 64px 56px; }

  /* Header: no rule, no padding — just generous space below it. */
  header.cv-header { margin-bottom: 2.6rem; border: 0; padding: 0; }
  /* The light 300-weight name is the signature of this template. */
  header.cv-header h1 {
    font-size: 1.8rem; font-weight: 300; letter-spacing: -0.01em; color: var(--cv-ink);
  }
  header.cv-header .cv-headline {
    font-weight: 400; color: var(--cv-muted); font-size: 1.05rem;
  }
  /* Kill the accent on ORCID/contact links — accent is reserved for ONE touch. */
  header.cv-header .cv-ids a,
  header.cv-header .cv-contact a,
  header.cv-header .cv-links a { color: inherit; }

  /* Wide-tracked, ruleless small-caps labels. */
  section.cv-section > h2 {
    font-size: 0.72rem; font-weight: 600; text-transform: uppercase;
    letter-spacing: 0.22em; color: var(--cv-ink-2); margin: 0 0 0.85rem; border: 0;
  }
  /* THE ONE ACCENT TOUCH: a thin 2px tick before every section heading. */
  section.cv-section > h2::before {
    content: ''; display: inline-block; width: 1.1em; height: 2px;
    background: var(--cv-accent); vertical-align: 0.28em; margin-right: 0.7em;
  }

  /* Extra breathing room between entries; rely on the large --cv-space as-is. */
  ol.cv-bib > li {
    line-height: 1.55; margin-bottom: calc(var(--cv-entry-gap) + 0.15rem);
  }
  /* Quiet, ruleless links inside entries too. */
  ol.cv-bib > li a { color: inherit; }

  @media print {
    /* Everything here is hairline / no-fill, so it prints identically; the thin
       accent tick is a 2px bar and is fine in PDF. */
    section.cv-section > h2 { border: 0; }
  }`;
}

export const minimalTemplate: CvTemplate = {
  key: "minimal",
  render(cv, sections, theme) {
    const css = commonCss(theme) + minimalCss(theme);
    const body = `<div class="cv">${headerHtml(cv, { photo: false })}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return cvPageShell(cv, css, body);
  },
};
