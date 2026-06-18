import {
  attributionFooter,
  coauthorLinksFooter,
  commonCss,
  cvPageShell,
  headerHtml,
  licenseFooter,
  provenanceFooter,
  sectionsHtml,
} from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * The "classic" template: a traditional, CENTERED serif institutional CV.
 *
 * Its signature — and the single thing that sets it apart from every sibling —
 * is a fully centered header: the name, contact line, identifiers, links,
 * metrics, charts, authorship card and summary all sit on the page's centre
 * axis under an accent hairline. Modern and Editorial are left-aligned; this is
 * the only template that reads as formal, symmetrical and timeless.
 *
 * The section BODIES stay left-aligned for readability — only the header is
 * centered, and only the section heading colour/rule carry the accent. That
 * header-centered / body-left asymmetry is intentional and classic.
 */
function classicCss(_theme: TemplateTheme): string {
  return `
  /* ---- Centered header (the signature) -------------------------------- */
  /* The shared header lays the text + photo out as a flex row; override it to
     a single centered block so everything stacks on the page's centre axis. */
  header.cv-header {
    text-align: center;
    margin-bottom: 1.7rem;
    padding-bottom: 0.9rem;
    border-bottom: 1.5px solid var(--cv-accent);
  }
  header.cv-header .cv-headmain { display: block; text-align: center; }
  header.cv-header .cv-headtext { min-width: 0; }

  header.cv-header h1 {
    font-size: 1.95rem;
    font-weight: 600;
    letter-spacing: 0.1px;
    color: var(--cv-ink);
  }
  /* The honorific inherits from the name (shared rule) — leave it alone. */

  /* Headline + every block contact/meta line is a centred block div. */
  header.cv-header .cv-headline { text-align: center; }
  header.cv-header .cv-ids,
  header.cv-header .cv-contact,
  header.cv-header .cv-links { text-align: center; }
  /* Restrained accent: ORCID/identifier links pick up the accent colour. */
  header.cv-header .cv-ids a { color: var(--cv-accent); }

  /* .cv-metrics is a one-per-line column list — centre each metric row (and its
     text) instead of left-aligning, to match the centred classic header. */
  header.cv-header .cv-metrics { align-items: center; text-align: center; }

  /* Summary: centred and held to a comfortable measure, auto-margined. */
  header.cv-header .cv-summary {
    text-align: center;
    max-width: 42rem;
    margin-left: auto;
    margin-right: auto;
  }

  /* Charts (inline-flex) and the authorship card (table) are not full-width,
     so auto-margin them to sit centred within the centred header. */
  header.cv-header .cv-charts,
  header.cv-header .cv-authorship {
    margin-left: auto;
    margin-right: auto;
  }

  /* ---- Section headings: classic uppercase accent rule, LEFT-aligned --- */
  /* Section bodies stay left-aligned for readability; only the header above
     is centred — this asymmetry is the classic treatment. */
  section.cv-section > h2 {
    font-size: 0.82rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--cv-accent);
    border-bottom: 1px solid var(--cv-rule);
    padding-bottom: 0.28rem;
    margin: 0 0 0.75rem;
  }

  /* ---- Print ----------------------------------------------------------- */
  /* No dark fills: the header underline and the h2 borders are hairlines that
     print cleanly, and a centred header is fully print-safe. */
  @media print {
    header.cv-header { text-align: center; }
  }`;
}

export const classicTemplate: CvTemplate = {
  key: "classic",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + classicCss(theme);
    // Text-first: omit the photo (no `{ photo: true }`).
    const body = `<div class="cv">${headerHtml(cv)}${sectionsHtml(cv, sections)}${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}</div>`;
    return cvPageShell(cv, css, body);
  },
};
