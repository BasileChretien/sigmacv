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
  "markdown",
  "bibtex",
  "csljson",
  "jsonresume",
  "biosketch",
  "erc",
  "msca",
  "nsf",
  "jsps",
] as const;
export type RenderFormat = (typeof RENDER_FORMATS)[number];

/**
 * Render-time options that are NOT part of the canonical document — context the
 * caller supplies about *where* the output will be shown. Currently just the
 * public-page attribution backlink, which only the living public page requests
 * (every export path leaves it unset, so exports stay unbranded).
 */
export interface RenderOpts {
  /**
   * When true, the public-page "Made with SigmaCV" attribution footer is emitted
   * (still subject to the owner's `display.publicAttribution` opt-out). Only the
   * `/p/[slug]` route sets this; exporters never do.
   */
  attribution?: boolean;
}

export interface RenderInput {
  cv: CanonicalCv;
  opts?: RenderOpts;
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
