import { commonCss, cvPageShell, headerHtml, provenanceFooter, sectionsHtml } from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Aurora" — the BOLD SHOWPIECE. A full-width gradient banner header carries the
 * name in light type, then the body is a stack of soft-tinted rounded "cards",
 * one per section, each lifted by a faint shadow. The only template that pairs a
 * gradient banner with rounded section cards — maximum visual energy.
 *
 * Print-aware: the gradient is confined to the header band (print-color-adjust
 * exact); section cards use the very-light --cv-accent-soft so body text stays
 * on a near-white field and remains legible in PDF export.
 */
function auroraCss(_theme: TemplateTheme): string {
  return `
  /* Full-bleed body: the banner spans edge-to-edge, cards carry the side gutter
     themselves (since .cv padding is 0). */
  .cv { max-width: 820px; padding: 0; }

  /* ---- GRADIENT BANNER (signature, print-exact) -------------------------- */
  header.cv-header {
    background: linear-gradient(135deg,
      var(--cv-accent) 0%,
      color-mix(in srgb, var(--cv-accent) 55%, #fff) 100%);
    color: #fff;
    padding: 48px 52px 40px;
    margin: 0 0 2rem;
    border-radius: 0 0 22px 22px;
    box-shadow: 0 10px 28px rgba(0, 0, 0, 0.14);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  header.cv-header h1 {
    font-size: 2.3rem;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.02em;
    line-height: 1.05;
  }
  header.cv-header .cv-honorific { color: #fff; }
  .cv-headline {
    color: rgba(255, 255, 255, 0.95);
    font-weight: 500;
    font-size: 1.2rem;
    margin-top: 0.25rem;
  }
  /* Light identity/contact text on the gradient. */
  .cv-ids,
  .cv-contact,
  .cv-links,
  .cv-metrics { color: rgba(255, 255, 255, 0.92); }
  .cv-ids a,
  .cv-contact a,
  .cv-links a {
    color: #fff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.5);
    text-decoration: none;
  }
  .cv-metric-context { color: rgba(255, 255, 255, 0.78); }
  .cv-summary { color: rgba(255, 255, 255, 0.95); }

  /* Photo: soft white ring + lift, rounded to match the banner language. */
  .cv-photo {
    width: 120px;
    height: 120px;
    border-radius: 18px;
    border: 3px solid rgba(255, 255, 255, 0.7);
    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.18);
  }

  /* Charts / authorship are forced-light cards by design — they read as crisp
     white panels floating on the gradient, which is on-brand here. */

  /* ---- SECTION CARDS (signature) ----------------------------------------- */
  section.cv-section {
    background: var(--cv-accent-soft);
    border: 1px solid var(--cv-accent-soft);
    border-radius: 14px;
    padding: 1.1rem 1.4rem;
    /* horizontal gutter comes from the card margin since .cv padding is 0 */
    margin: 0 52px var(--cv-entry-gap);
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  section.cv-section:first-of-type { margin-top: 0; }
  section.cv-section > h2 {
    font-size: 0.74rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--cv-accent);
    margin: 0 0 0.6rem;
  }

  /* Provenance footer keeps the side gutter and a touch of breathing room. */
  .cv-provenance { margin: 1.6rem 52px 2.4rem; }

  /* ---- PRINT ------------------------------------------------------------- */
  @media print {
    /* The gradient banner is the only saturated fill; keep it exact. */
    header.cv-header {
      border-radius: 0 0 16px 16px;
      box-shadow: none;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    /* Cards keep their light tint; drop the shadow so it doesn't smear in PDF. */
    section.cv-section {
      box-shadow: none;
      break-inside: avoid;
    }
  }`;
}

export const auroraTemplate: CvTemplate = {
  key: "aurora",
  render(cv, sections, theme) {
    const css = commonCss(theme) + auroraCss(theme);
    const body = `<div class="cv">${headerHtml(cv, { photo: true })}${sectionsHtml(sections)}${provenanceFooter(cv)}</div>`;
    return cvPageShell(cv, css, body);
  },
};
