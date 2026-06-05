import { attributionFooter, commonCss, cvPageShell, headerHtml, licenseFooter, narrativeBlock, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "ATS" — optimized for Applicant Tracking Systems (résumé parsers). It is the
 * deliberately PLAIN sibling: a single column, a true system Arial stack, plain
 * black text with NO accent anywhere, bold standard-case section headings, no
 * rules/transforms, and a FLAT (non-hanging, single-column) bibliography that a
 * parser can read top-to-bottom. Photo, charts, badges, and the authorship
 * table are stripped via `display:none !important` so they vanish regardless of
 * the user's display toggles. The injected `.cv-self` highlight is intentionally
 * neutralized to plain black bold — colour confuses parsers — making this the
 * only template that fights the highlight. Text stays fully selectable in the
 * PDF. The polish here is restraint, not chrome: only spacing and heading sizing
 * are refined.
 */
function atsCss(_theme: TemplateTheme): string {
  return `
  /* The one template that overrides the font: a true system Arial stack, and
     forces every ink token to pure black for maximally parseable output. */
  body { font-family: Arial, Helvetica, "Liberation Sans", sans-serif; color: #000; }
  .cv { max-width: 720px; padding: 36px 44px; }

  /* Strip everything a résumé parser can't read — independent of display toggles. */
  .cv-photo, .cv-charts, .cv-badge, .cv-badges, .cv-authorship, .cv-authorship-note { display: none !important; }
  .cv-headmain { display: block; }

  /* Header: plain black, no border band, no accent. */
  header.cv-header { margin-bottom: 1rem; border: 0; }
  header.cv-header h1 {
    font-size: 1.6rem; font-weight: bold; letter-spacing: 0;
    color: #000; margin: 0 0 0.2rem; line-height: 1.12;
  }
  header.cv-header .cv-headline { font-size: 1.1rem; font-weight: normal; color: #000; margin-top: 0.1rem; }
  .cv-ids, .cv-ids a,
  .cv-contact, .cv-contact a,
  .cv-links, .cv-links a,
  .cv-summary, .cv-metrics { color: #000; }
  .cv-summary { margin-top: 0.8rem; }

  /* Section headings: plain bold, standard case, no transforms/rules/markers. */
  section.cv-section > h2 {
    font-size: 1.05rem; font-weight: bold; text-transform: none;
    letter-spacing: 0; border: 0; color: #000; margin: 0 0 0.4rem;
  }
  section.cv-section > h2::after { content: none; }

  /* Body: flat, single column, no hanging indent — fully top-to-bottom readable. */
  ol.cv-bib { column-count: 1; }
  ol.cv-bib > li { padding-left: 0; text-indent: 0; }
  ol.cv-bib > li a { color: #000; text-decoration: none; }

  /* Links black, undecorated everywhere. */
  a { color: #000; text-decoration: none; }

  /* Neutralize the injected self-highlight: black bold, no colour/underline. */
  .cv-self { color: #000; font-weight: 700; text-decoration: none; background: none; }

  /* Footer stays neutral grey-free: muted but still pure-ish black for parsers. */
  .cv-provenance { color: #000; }

  @media print {
    /* Already monochrome; keep text selectable and let it flow naturally. */
    a { color: #000; text-decoration: none; }
  }`;
}

export const atsTemplate: CvTemplate = {
  key: "ats",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + atsCss(theme);
    const body = `<div class="cv">${headerHtml(cv)}${narrativeBlock(cv)}${sectionsHtml(sections)}${provenanceFooter(cv)}${licenseFooter(cv)}${attributionFooter(cv, opts)}</div>`;
    return cvPageShell(cv, css, body);
  },
};
