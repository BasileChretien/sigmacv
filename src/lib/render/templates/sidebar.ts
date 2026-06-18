import {
  attributionFooter,
  coauthorLinksFooter,
  commonCss,
  cvPageShell,
  headerHtml,
  licenseFooter,
  provenanceFooter,
  sectionsHtmlRaw,
} from "./shared";
import type { CvTemplate, TemplateTheme } from "./types";

/**
 * "Sidebar" — the most "web-profile" template: a full-height, accent-tinted
 * LEFT panel (~32% width) carrying a round avatar, name, headline, contact,
 * ORCID, metrics and an optional summary, beside a clean white main column of
 * sections (publications + the rest). It is the ONLY template with a full-bleed
 * coloured side PANEL — distinct from Aurora (gradient is a top banner over body
 * cards) and Slate (dark band is a top band only). The tinted panel prints via
 * print-color-adjust. Charts + the authorship table are forced-light cards, so
 * they intentionally read as white cards inside the coloured sidebar (keeping
 * the accent bars and dark text legible).
 */
function sidebarCss(_theme: TemplateTheme): string {
  return `
  .cv { max-width: 880px; padding: 0; }

  /* Two columns: a fixed ~32% tinted rail + a fluid main column, both stretched
     to full height so the coloured panel runs edge-to-edge top-to-bottom. */
  .cv-sidebar-layout {
    display: grid;
    grid-template-columns: 265px 1fr;
    align-items: stretch;
    min-height: 100vh;
  }

  /* ---- The coloured side panel -------------------------------------------- */
  .cv-sidebar {
    background: var(--cv-accent);
    background-image: linear-gradient(160deg, var(--cv-accent) 0%, color-mix(in srgb, var(--cv-accent) 82%, #000) 100%);
    color: #fff;
    padding: 42px 28px;
  }
  .cv-sidebar .cv-header { margin: 0; }
  .cv-sidebar .cv-headmain {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  .cv-sidebar .cv-headtext { width: 100%; }

  /* Round, ring-bordered avatar — the signature "profile" element. It leads the
     panel, so it sits above the name in the column flow. */
  .cv-sidebar .cv-photo {
    order: -1;
    width: 132px;
    height: 132px;
    border-radius: 50%;
    border: 4px solid rgba(255, 255, 255, 0.85);
    box-shadow: 0 4px 18px rgba(0, 0, 0, 0.18);
    object-fit: cover;
  }

  /* White-on-accent type scale tuned for the narrow column. */
  .cv-sidebar h1 {
    font-size: 1.55rem;
    font-weight: 700;
    color: #fff;
    line-height: 1.14;
    letter-spacing: -0.01em;
    margin: 0 0 0.1rem;
  }
  .cv-sidebar .cv-headline {
    font-size: 1.05rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.92);
    margin-top: 0.2rem;
    letter-spacing: 0;
  }
  .cv-sidebar .cv-ids,
  .cv-sidebar .cv-contact,
  .cv-sidebar .cv-links {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.8rem;
    line-height: 1.7;
    margin-top: 0.55rem;
  }
  .cv-sidebar .cv-links { margin-top: 0.2rem; }
  .cv-sidebar .cv-metrics {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.8rem;
    margin-top: 0.7rem;
    gap: 0.28rem;
  }
  /* The metric spans default to dark --cv-* tokens (legible on the white page and
     re-themed on the public styles); the sidebar's accent PANEL doesn't re-theme
     those tokens, so force the label/value/caveats to white here, mirroring the
     existing .cv-metric-context override. */
  .cv-sidebar .cv-metric-label,
  .cv-sidebar .cv-metric-value { color: #fff; }
  .cv-sidebar .cv-metric-context { color: rgba(255, 255, 255, 0.78); }
  .cv-sidebar .cv-metric-coverage { color: rgba(255, 255, 255, 0.66); }

  /* Every textual link in the panel reads as an underlined-on-white affordance,
     including the ORCID id, contact email/website and extra profile links. */
  .cv-sidebar a {
    color: #fff;
    text-decoration: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.45);
  }
  .cv-sidebar .cv-ids a { color: #fff; }

  /* The summary is fenced off from the contact block by a soft white rule so the
     panel reads as "identity → divider → bio". */
  .cv-sidebar .cv-summary {
    color: rgba(255, 255, 255, 0.92);
    font-size: 0.85rem;
    line-height: 1.58;
    margin-top: 1.15rem;
    padding-top: 1.15rem;
    border-top: 1px solid rgba(255, 255, 255, 0.25);
    max-width: none;
  }

  /* The forced-light cards (charts, authorship table) are full-width white cards
     inside the panel; keep them from touching the rounded panel edges. */
  .cv-sidebar .cv-charts,
  .cv-sidebar .cv-authorship {
    margin-top: 1.1rem;
    width: 100%;
    max-width: 100%;
  }
  .cv-sidebar .cv-charts { display: flex; }

  /* ---- The main column ----------------------------------------------------- */
  .cv-main { padding: 42px 40px; min-width: 0; }
  .cv-main section.cv-section:first-child,
  .cv-main section.cv-section:first-of-type { margin-top: 0; }

  /* Quiet uppercase accent labels with a short accent underline drawn via
     ::after — the rhythm marker down the right column. */
  .cv-main section.cv-section > h2 {
    font-size: 0.74rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--cv-accent);
    margin: 0 0 0.7rem;
    padding-bottom: 0.3rem;
    position: relative;
  }
  .cv-main section.cv-section > h2::after {
    content: "";
    position: absolute;
    left: 0;
    bottom: 0;
    width: 34px;
    height: 2px;
    background: var(--cv-accent);
    border-radius: 2px;
  }

  .cv-main .cv-provenance { border-top-color: var(--cv-rule); }

  /* ---- Print: keep the tinted panel, drop the screen-only full-height ------ */
  @media print {
    .cv-sidebar-layout { min-height: 0; }
    .cv-sidebar {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .cv-sidebar .cv-photo { box-shadow: none; }
  }`;
}

export const sidebarTemplate: CvTemplate = {
  key: "sidebar",
  render(cv, sections, theme, opts) {
    const css = commonCss(theme) + sidebarCss(theme);
    // Custom body: the shared header lives in the coloured <aside>, the shared
    // sections + provenance footer in the white <main>. headerHtml/sectionsHtml
    // still own the citation data, fallback title and ORCID handling.
    const body =
      `<div class="cv">` +
      `<div class="cv-sidebar-layout">` +
      `<aside class="cv-sidebar">${headerHtml(cv, { photo: true })}</aside>` +
      `<main class="cv-main">${sectionsHtmlRaw(sections)}${provenanceFooter(cv)}${licenseFooter(cv)}${coauthorLinksFooter(cv, opts)}${attributionFooter(cv, opts)}</main>` +
      `</div>` +
      `</div>`;
    return cvPageShell(cv, css, body);
  },
};
