import { commonCss, cvPageShell, headerHtml, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Timeline" — a STRUCTURAL template built around a single continuous accent
 * RAIL down the left margin of the sections column, with a node dot per
 * section heading so the whole CV reads as one timeline.
 *
 * The rail is drawn entirely with CSS over the SHARED markup (no markup
 * change): each `section.cv-section` contributes a `border-left` segment, and
 * by zeroing the inter-section margin and moving the gap into `padding-top`
 * those segments JOIN into one unbroken line. A `::before` dot on each `h2`
 * sits ON the line, its page-coloured halo masking the rail so the node reads
 * cleanly. The header stays ABOVE / outside the rail (it owns the charts and
 * authorship cards), so the rail only ever decorates the section list — no
 * conflict with those light cards.
 *
 * Distinct from Modern/Slate (which put a SHORT per-heading accent bar on each
 * h2): here the accent is a CONTINUOUS full-height rail threading every
 * section, a device no sibling template uses.
 */
function timelineCss(_theme: TemplateTheme): string {
  return `
  .cv { max-width: 780px; padding: 48px 52px; }

  /* HEADER — kept above and outside the rail (full text width, not indented). */
  header.cv-header { margin-bottom: 1.8rem; }
  header.cv-header h1 {
    font-size: 2rem; font-weight: 700; color: var(--cv-ink);
    letter-spacing: -0.018em; line-height: 1.05;
  }
  header.cv-header .cv-headline {
    font-size: 1.18rem; font-weight: 500; color: var(--cv-ink-2); margin-top: 0.28rem;
  }
  header.cv-header .cv-ids a,
  header.cv-header .cv-contact a,
  header.cv-header .cv-links a { color: var(--cv-accent); }

  /* THE RAIL — each section paints one segment of a continuous left border.
     margin-top:0 + padding-top:var(--cv-space) keeps the border unbroken so
     adjacent segments fuse into a single full-height line. */
  section.cv-section {
    position: relative;
    margin-top: 0;
    margin-left: 0.4rem;
    padding-left: 2rem;
    padding-top: var(--cv-space);
    border-left: 2px solid var(--cv-accent-soft);
  }
  /* The first section's segment starts a touch tighter so the rail does not
     begin with an awkward gap under the header. */
  section.cv-section:first-of-type { padding-top: calc(var(--cv-space) * 0.7); }
  /* Round the very top of the rail so the line has a clean cap, not a raw edge. */
  section.cv-section:first-of-type { border-top-left-radius: 2px; }

  /* SECTION HEADING — uppercase tracked label, the timeline's text rhythm. */
  section.cv-section > h2 {
    position: relative;
    font-size: 0.8rem; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.12em; color: var(--cv-ink); margin: 0 0 0.7rem;
  }
  /* NODE DOT — sits ON the rail; the page-coloured halo (box-shadow) masks the
     line behind it so the node reads as a clean ringed point on the timeline. */
  section.cv-section > h2::before {
    content: "";
    position: absolute;
    left: calc(-2rem - 1px);
    top: 0.35em;
    width: 11px; height: 11px;
    border-radius: 50%;
    background: var(--cv-page);
    border: 2.5px solid var(--cv-accent);
    box-shadow: 0 0 0 3px var(--cv-page);
  }

  ol.cv-bib > li a { color: var(--cv-accent); }

  @media print {
    /* The rail is a soft 2px border + small accent-ring dots — ink-light, so
       it prints fine; force the dot's ring/halo to print in colour and let
       sections flow across page breaks (the continuous line is the point). */
    section.cv-section { break-inside: auto; }
    section.cv-section > h2::before { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }`;
}

export const timelineTemplate: CvTemplate = {
  key: "timeline",
  render(cv, sections, theme) {
    const css = commonCss(theme) + timelineCss(theme);
    // Header (with its charts/authorship cards) stays outside the rail; the
    // rail decorates only the sections column.
    const body = `<div class="cv">${headerHtml(cv, { photo: false })}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return cvPageShell(cv, css, body);
  },
};
