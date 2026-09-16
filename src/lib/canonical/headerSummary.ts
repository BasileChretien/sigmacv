import type { CanonicalCv } from "./schema";

/**
 * The headline and summary the document actually shows.
 *
 * A funder layout whose template has no personal statement outside its own
 * sections (the CV-FRQ, the Tri-agency CV) sets `display.hideHeaderSummary`, and
 * then neither line belongs on the page. Every surface that prints them must
 * agree: the HTML header, the text headers of DOCX / LaTeX / Markdown, the public
 * page's meta description, its social card, its JSON-LD `jobTitle`, and the
 * decorative ribbon of the marquee style. They all read this one function, so
 * the page body and the page's metadata never disagree about what the owner
 * chose to show. The owner's stored text is never touched.
 */
export interface HeaderSummary {
  headline?: string;
  summary?: string;
}

export function headerSummary(cv: Pick<CanonicalCv, "owner" | "display">): HeaderSummary {
  if (cv.display.hideHeaderSummary === true) return {};
  const headline = cv.owner.headline?.trim() || undefined;
  const summary = cv.owner.summary?.trim() || undefined;
  return { ...(headline ? { headline } : {}), ...(summary ? { summary } : {}) };
}
