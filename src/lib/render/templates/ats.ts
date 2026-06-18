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
  .cv-photo, .cv-charts, .cv-research, .cv-badge, .cv-badges, .cv-authorship, .cv-authorship-note { display: none !important; }
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
  .cv-summary, .cv-metrics, .cv-metrics * { color: #000; }
  .cv-summary { margin-top: 0.8rem; }

  /* Section headings: plain bold, standard case, no transforms/rules/markers. */
  /* Section headings sit ABOVE the headline (1.1rem) and clearly above body — with
     colour stripped for parser safety, size + weight are the only hierarchy cues,
     so the heading must be the largest of the three (was 1.05rem, below the headline). */
  section.cv-section > h2, .cv-summary-block > .cv-summary-h {
    font-size: 1.18rem; font-weight: bold; text-transform: none;
    letter-spacing: 0; border: 0; color: #000; margin: 0 0 0.4rem;
  }
  section.cv-section > h2::after, .cv-summary-block > .cv-summary-h::after { content: none; }

  /* Body: flat, single column, no hanging indent — fully top-to-bottom readable. */
  ol.cv-bib { column-count: 1; }
  ol.cv-bib > li { padding-left: 0; text-indent: 0; }
  ol.cv-bib > li a { color: #000; text-decoration: none; }

  /* Positions/Education two-line records: keep them PARSER-SAFE. The dates sit
     inline right after the role (no right-aligned column a résumé parser could
     mis-associate with the wrong row), reading order stays role → dates → org, and
     every ink token is forced black like the rest of this template. */
  .cv-entry-lead { flex: 0 1 auto; font-weight: bold; }
  .cv-entry-dates { margin-inline-start: 0; }
  .cv-entry-lead, .cv-entry-dates, .cv-entry-sub { color: #000; }
  .cv-entry-sub { font-size: 1em; }

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
    const body = `<div class="cv">${headerHtml(cv)}${sectionsHtml(cv, sections)}${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}</div>`;
    return cvPageShell(cv, css, body);
  },
};
