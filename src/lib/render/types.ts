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
  "ro-crate",
  "biosketch",
  "erc",
  "msca",
  "nsf",
  "jsps",
] as const;
export type RenderFormat = (typeof RENDER_FORMATS)[number];

/**
 * The public-page-only per-publication chrome flag and its required `slug`, modelled
 * as a discriminated PAIR so the two can never be half-configured: `publicExtras:
 * true` always carries the `slug` used to build the cite hrefs, and a stray `slug`
 * can't be passed without enabling the feature. Exporters set neither (first arm).
 *
 * When enabled, each citation entry gets a no-JS "Cite" disclosure (BibTeX / RIS /
 * CSL-JSON download links), an open-access "Full text" link (when the work has one),
 * and an "Abstract" disclosure (when one was reconstructed). Only the `/p/[slug]`
 * route sets it; exporters never do, so PDF/DOCX/LaTeX stay clean.
 */
type PublicExtrasOpts =
  | { publicExtras?: false; slug?: never }
  | { publicExtras: true; slug: string };

/**
 * Render-time options that are NOT part of the canonical document — context the
 * caller supplies about *where* the output will be shown (the living public page),
 * never affecting an export. `publicExtras` + `slug` are a typed pair (see
 * {@link PublicExtrasOpts}) so the public chrome can't be half-configured.
 */
export type RenderOpts = PublicExtrasOpts & {
  /**
   * When true, the public-page "Made with SigmaCV" attribution footer is emitted
   * (still subject to the owner's `display.publicAttribution` opt-out). Only the
   * `/p/[slug]` route sets this; exporters never do.
   */
  attribution?: boolean;
  /**
   * Co-authors who have their OWN published, search-indexable SigmaCV CV, resolved
   * server-side (`resolveCoauthorCvs`). Only the `/p/[slug]` route sets this;
   * exporters never do, so the co-author block stays off every PDF/DOCX/LaTeX.
   * Rendered only when the owner opted in (`display.showCoauthorLinks`). Inline
   * structural shape so the render layer takes no dependency on `lib/cv`.
   */
  coauthorCvs?: readonly { orcid: string; slug: string; name: string }[];
  /**
   * Href of this CV's Atom feed (`/p/<slug>/feed.xml`). When set, a quiet
   * "Subscribe" link is added to the public-page footer. Only the `/p/[slug]` route
   * sets it; exporters never do.
   */
  feedHref?: string;
  /**
   * Absolute URL of this CV's public living page (`https://…/p/<slug>`), supplied
   * by the export + preview callers ONLY when the page is actually published. When
   * set AND the owner opted in (`display.showDocQr`), the document footer gets a
   * small QR + "Live version" text link. Encodes only the public URL (no PII).
   * Unset ⇒ no QR (fails closed); the public `/p/[slug]` route never sets it (a QR
   * linking the live page to itself is pointless).
   */
  publicPageUrl?: string;
  /**
   * Confirmed, still-visible works added in the CV's most recent sync — the public
   * "What's new" strip beside the living-page "Updated …" line. Resolved server-side
   * (`publicRecentAdditions`, from the persisted last-sync report) by the `/p/[slug]`
   * route ONLY; exporters never set it, so it stays off every PDF/DOCX/LaTeX/Markdown.
   * Inline structural shape so the render layer takes no dependency on `lib/cv`.
   */
  recentlyAdded?: readonly { itemId: string; title: string; sectionType: string }[];
};

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
