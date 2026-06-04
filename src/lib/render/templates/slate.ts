import { commonCss, cvPageShell, headerHtml, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Slate" — a BOLD DARK-ACCENT template. A flat near-black masthead runs
 * full-bleed across the top with light text and a sharp accent keyline at its
 * lower edge; the body stays white (text-on-white) so the PDF prints ink-light
 * below the band. Distinct from Aurora (no gradient, sharp corners), Sidebar
 * (band is across the TOP, not down the side) and Modern (which is all-white
 * with an accent name — Slate inverts the header to dark).
 */
const BAND = "#14171c";

function slateCss(theme: TemplateTheme): string {
  const inset = "52px";
  return `
  /* Full-bleed band: the .cv loses its horizontal padding so the dark masthead
     spans the page; sections are inset individually below. */
  .cv { max-width: 800px; padding: 0; }

  /* ----- DARK HEADER BAND (header-only dark fill) ----- */
  header.cv-header {
    background: ${BAND};
    color: #fff;
    padding: 46px ${inset} 38px;
    margin: 0 0 2rem;
    border-bottom: 4px solid var(--cv-accent);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  header.cv-header h1 {
    font-size: 2.15rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.02em;
    line-height: 1.05;
  }
  /* Honorific stays identical to the name (now white-on-dark). */
  header.cv-header .cv-honorific { color: #fff; }
  /* Signature move: the accent headline pops on the dark band. */
  header.cv-header .cv-headline {
    color: var(--cv-accent);
    font-weight: 600;
    font-size: 1.18rem;
    margin-top: 0.25rem;
    letter-spacing: 0;
  }
  header.cv-header .cv-ids,
  header.cv-header .cv-contact,
  header.cv-header .cv-links,
  header.cv-header .cv-metrics { color: rgba(255, 255, 255, 0.82); }
  header.cv-header .cv-ids a,
  header.cv-header .cv-contact a,
  header.cv-header .cv-links a { color: #fff; text-decoration: none; }
  header.cv-header .cv-metric-context { color: rgba(255, 255, 255, 0.62); }
  header.cv-header .cv-summary { color: rgba(255, 255, 255, 0.9); }

  /* Squared, sharp photo (vs. the rounded sibling templates). */
  header.cv-header .cv-photo { width: 114px; height: 114px; border-radius: 6px; }

  /* ----- BODY (white) ----- */
  /* The band is full-bleed; body content is inset to align under it. The
     forced-light chart/authorship cards already live INSIDE the header, so they
     render as crisp white blocks on the dark band — legible by design. */
  section.cv-section,
  .cv-provenance {
    margin-left: ${inset};
    margin-right: ${inset};
  }

  /* Sharp accent keyline on section headings — echoes the band's keyline. */
  section.cv-section > h2 {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--cv-ink);
    margin: 0 0 0.65rem;
    padding-left: 0.6rem;
    border-left: 3px solid var(--cv-accent);
  }

  /* ----- PRINT ----- */
  /* commonCss resets .cv padding/max-width for print; re-assert the band so the
     masthead keeps its dark fill + inset, and keep the body content inset too.
     Only the band is dark — everything below prints text-on-white. */
  @media print {
    header.cv-header {
      background: ${BAND};
      color: #fff;
      border-bottom: 4px solid var(--cv-accent);
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    section.cv-section,
    .cv-provenance {
      margin-left: ${inset};
      margin-right: ${inset};
    }
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
