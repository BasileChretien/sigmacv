import { commonCss, cvPageShell, headerHtml, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Editorial" — a print-magazine masthead. The signature is an oversized serif
 * DISPLAY name (the biggest of any template) sitting over a thick accent rule,
 * an accent-coloured HEADLINE under it (the inverse of Modern, which accents the
 * name), and refined small-caps section headers each carrying a strong hairline.
 *
 * It is the most "designed page" of the conservative-leaning set: text-forward
 * (no photo), high-contrast, with generous vertical rhythm. The accent is a
 * typographic spice — a header rule, a headline, link colour, a thin summary
 * hairline — never a fill, so the page prints beautifully with no dark areas.
 */
function editorialCss(_theme: TemplateTheme): string {
  return `
  .cv { max-width: 760px; padding: 54px 56px; }

  /* Header: oversized serif masthead over a thick accent rule. */
  header.cv-header {
    border-bottom: 3px solid var(--cv-accent);
    padding-bottom: 1rem;
    margin-bottom: 2rem;
  }
  /* The 2.6rem display name is the signature — biggest of any template. */
  header.cv-header h1 {
    font-size: 2.6rem;
    font-weight: 700;
    letter-spacing: -0.026em;
    line-height: 1.02;
    margin: 0 0 0.05rem;
  }
  /* Accent HEADLINE (not an accent name) — the inverse of Modern. */
  header.cv-header .cv-headline {
    font-size: 1.3rem;
    color: var(--cv-accent);
    font-weight: 600;
    margin-top: 0.45rem;
    letter-spacing: 0.01em;
    line-height: 1.2;
  }
  header.cv-header .cv-ids a { color: var(--cv-accent); }

  /* Generous lede. A thin accent hairline prefixes the first line as a subtle
     editorial flourish — a magazine drop-rule, not a fill. */
  .cv-summary {
    position: relative;
    font-size: 1.02rem;
    line-height: 1.62;
    color: var(--cv-ink-2);
    margin-top: 1.1rem;
    padding-left: 1.05rem;
  }
  .cv-summary::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0.32em;
    bottom: 0.32em;
    width: 2px;
    background: var(--cv-accent);
    border-radius: 1px;
  }

  /* Refined small-caps section headers with a strong hairline. The headers stay
     ink-coloured (accent is reserved for the rule/headline/links). */
  section.cv-section > h2 {
    font-size: 1.08rem;
    font-weight: 600;
    font-variant: small-caps;
    letter-spacing: 0.06em;
    color: var(--cv-ink);
    margin: 0 0 0.75rem;
    padding-bottom: 0.22rem;
    border-bottom: 1px solid var(--cv-rule-strong);
  }

  /* Strong vertical rhythm: roomier bibliography leading than the shared base. */
  ol.cv-bib > li { line-height: 1.52; }

  @media print {
    /* Hairlines + serif display print beautifully; keep the accent rule crisp. */
    header.cv-header { border-bottom-width: 2px; }
    .cv-summary::before { width: 1.5px; }
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
