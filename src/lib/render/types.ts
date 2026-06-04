import type { CanonicalCv } from "@/lib/canonical/schema";

/**
 * ───────────────────────────────────────────────────────────────────────────
 * THE RENDERER INTERFACE — load-bearing.
 * ───────────────────────────────────────────────────────────────────────────
 * Every output format implements `Renderer` and derives ENTIRELY from the
 * canonical object. No per-format data pipelines: e.g. the PDF renderer simply
 * runs the HTML renderer and prints the result. Keep this interface stable.
 */

export const RENDER_FORMATS = [
  "html",
  "pdf",
  "docx",
  "latex",
  "latex-classic",
  "markdown",
  "bibtex",
  // A self-contained, animated, interactive web page (download + open in a browser).
  "webpage",
] as const;
export type RenderFormat = (typeof RENDER_FORMATS)[number];

export interface RenderInput {
  cv: CanonicalCv;
}

/**
 * A rendered artifact. Exactly one payload field is set depending on `format`:
 *  - html / latex / markdown → `text` (and `html` mirrors it for the html format)
 *  - pdf / docx              → `buffer`
 */
export interface RenderResult {
  format: RenderFormat;
  mimeType: string;
  filename: string;
  html?: string;
  text?: string;
  buffer?: Buffer;
}

export interface Renderer {
  readonly format: RenderFormat;
  render(input: RenderInput): Promise<RenderResult>;
}
