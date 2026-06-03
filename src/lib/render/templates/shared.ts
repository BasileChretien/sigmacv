import type { CanonicalCv } from "@/lib/canonical/schema";
import { renderChartsHtml } from "../charts";
import { escapeHtml } from "../escape";
import { formattedMetrics } from "../metrics";
import type { RenderedSection, TemplateTheme } from "./types";

export { escapeHtml };

/**
 * Wrap template-specific CSS + body into a complete HTML document. The strict
 * CSP means injected markup (from citeproc output) can never execute — applies
 * to both the preview iframe and the headless-Chromium PDF page.
 */
export function pageShell(title: string, css: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:;" />
<title>${escapeHtml(title)}</title>
<style>${css}</style>
</head>
<body>
${body}
</body>
</html>`;
}

/** Reset + bibliography + self-highlight CSS common to every template. */
export function commonCss(theme: TemplateTheme): string {
  return `
  :root { --cv-accent: ${theme.accentColor}; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: ${theme.fontFamily};
    font-size: ${theme.bodyFontPt}pt;
    line-height: ${theme.lineHeight};
    color: #1a1a1a;
    background: #fff;
  }
  .cv { max-width: 760px; margin: 0 auto; padding: 40px 48px; }
  section.cv-section { margin-top: ${theme.sectionGapRem}rem; }
  ol.cv-bib { list-style: none; margin: 0; padding: 0; }
  ol.cv-bib > li { margin: 0 0 ${theme.entryGapRem}rem; padding-left: 1.4rem; text-indent: -1.4rem; }
  .csl-entry { display: inline; }
  .cv-metrics { font-size: 0.8rem; color: #555; margin-top: 0.25rem; }
  .cv-charts { display: flex; flex-wrap: wrap; gap: 1.5rem; margin-top: 0.6rem; }
  .cv-chart { margin: 0; }
  .cv-chart figcaption { font-size: 0.7rem; color: #555; margin-bottom: 0.15rem; }
  .cv-chart svg { display: block; }
  .cv-self { ${theme.selfHighlightCss} }
  a { color: inherit; }
  @page { size: A4; margin: 18mm 16mm; }
  @media print {
    .cv { padding: 0; max-width: none; }
    a { text-decoration: none; }
  }`;
}

/** The header block (shared structure; templates style `.cv-header` differently). */
export function headerHtml(cv: CanonicalCv): string {
  const name = escapeHtml(cv.owner.displayName || "Curriculum Vitae");
  const orcid = cv.owner.orcid ? escapeHtml(cv.owner.orcid) : "";
  const ids = orcid
    ? `<div class="cv-ids">ORCID: <a href="https://orcid.org/${orcid}">${orcid}</a></div>`
    : "";
  const metrics = formattedMetrics(cv);
  const metricsLine = metrics.length
    ? `<div class="cv-metrics">${metrics
        .map((m) => `${escapeHtml(m.label)}: ${escapeHtml(m.value)}`)
        .join(" · ")}</div>`
    : "";
  return `<header class="cv-header"><h1>${name}</h1>${ids}${metricsLine}${renderChartsHtml(cv)}</header>`;
}

/** Section list markup (identical across templates; styled via CSS classes). */
export function sectionsHtml(sections: RenderedSection[]): string {
  return sections
    .map((rs) => {
      if (rs.items.length === 0) return "";
      const entries = rs.items
        .map((ri) => `<li><div class="csl-entry">${ri.html}</div></li>`)
        .join("\n");
      return `<section class="cv-section"><h2>${escapeHtml(
        rs.section.title,
      )}</h2><ol class="cv-bib">\n${entries}\n</ol></section>`;
    })
    .join("\n");
}
