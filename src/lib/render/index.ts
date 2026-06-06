import type { Renderer, RenderFormat } from "./types";

export type { Renderer, RenderFormat, RenderInput, RenderResult } from "./types";
export { renderCvHtml, htmlRenderer, cvSlug } from "./html";

/**
 * Resolve a renderer by format. Each is loaded lazily so a consumer only pulls
 * in the heavy deps it needs (e.g. the live preview never loads Playwright or
 * the docx library). Every format derives from the same canonical object +
 * citeproc output, so citations are identical across all of them.
 */
export async function getRenderer(format: RenderFormat): Promise<Renderer> {
  switch (format) {
    case "html":
      return (await import("./html")).htmlRenderer;
    case "pdf":
      return (await import("./pdf")).pdfRenderer;
    case "docx":
      return (await import("./docx")).docxRenderer;
    case "latex":
      return (await import("./latex")).latexRenderer;
    case "markdown":
      return (await import("./markdown")).markdownRenderer;
    case "bibtex":
      return (await import("./bibtex")).bibtexRenderer;
    case "csljson":
      return (await import("./csljson")).csljsonRenderer;
    case "jsonresume":
      return (await import("./jsonresume")).jsonresumeRenderer;
    case "biosketch":
      return (await import("./biosketch")).biosketchRenderer;
    case "erc":
      return (await import("./grantCv")).ercRenderer;
    case "msca":
      return (await import("./grantCv")).mscaRenderer;
    case "nsf":
      return (await import("./grantCv")).nsfRenderer;
    case "jsps":
      return (await import("./grantCv")).jspsRenderer;
    default:
      throw new Error(`Unknown render format: ${String(format)}`);
  }
}
