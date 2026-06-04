import {
  commonCss,
  cvPageShell,
  headerHtml,
  provenanceFooter,
  sectionsHtml,
} from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * The "modern" template: contemporary professional. A large ACCENT-coloured
 * name is the signature, paired with uppercase letter-spaced section labels
 * carried by an accent LEFT-BAR, a clean sans stack and a supported photo.
 *
 * Distinct from siblings:
 *  - vs Classic  — left-aligned + accent name + photo + left-bar h2
 *                  (Classic is centred-feel serif, no photo, underlined h2).
 *  - vs Editorial — sans (no serif display), smaller display, left-bar labels
 *                  rather than hairline-rule small-caps.
 *  - vs Sidebar  — single column, no coloured panel.
 *
 * The soft accent rule under the whole header lifts the block so it can never
 * be mistaken for Classic. Both the accent name and the soft tint are
 * ink-light, so PDF export stays clean (no dark or gradient fills).
 */
function modernCss(_theme: TemplateTheme): string {
  return `
  .cv { padding-top: 56px; padding-bottom: 48px; }

  /* HEADER — the accent name + soft tint rule are the lift. */
  header.cv-header {
    margin-bottom: 2.1rem;
    padding-bottom: 1rem;
    border-bottom: 2px solid var(--cv-accent-soft);
  }
  header.cv-header h1 {
    font-size: 2.2rem;
    font-weight: 700;
    color: var(--cv-accent);
    letter-spacing: -0.024em;
    line-height: 1.03;
  }
  header.cv-header .cv-headline {
    font-size: 1.22rem;
    font-weight: 500;
    color: var(--cv-ink-2);
    margin-top: 0.3rem;
  }
  header.cv-header .cv-ids a { color: var(--cv-accent); }

  /* PHOTO — squared-rounded portrait on the right of the head row. */
  .cv-photo {
    width: 116px;
    height: 116px;
    border-radius: 12px;
  }

  /* SECTION LABELS — the accent left-bar is the signature. */
  section.cv-section > h2 {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    color: var(--cv-muted);
    margin: 0 0 0.7rem;
    padding-left: 0.7rem;
    border-left: 3px solid var(--cv-accent);
  }

  /* Body links pick up the accent so the single column reads as one system. */
  ol.cv-bib > li a { color: var(--cv-accent); }

  @media print {
    /* The soft tint prints fine; keep the rule so the header still reads as
       a distinct block on paper rather than collapsing into the body. */
    header.cv-header { border-bottom: 2px solid var(--cv-accent-soft); }
  }`;
}

export const modernTemplate: CvTemplate = {
  key: "modern",
  render(cv, sections, theme) {
    const css = commonCss(theme) + modernCss(theme);
    const body = `<div class="cv">${headerHtml(cv, {
      photo: true,
    })}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return cvPageShell(cv, css, body);
  },
};
