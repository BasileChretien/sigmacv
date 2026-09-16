import { isProseSectionType, type CanonicalCv, type CvSection } from "./schema";

/**
 * Page estimates for the narrative sections.
 *
 * Funder narrative CVs come with a page limit (the CV-FRQ: six pages in French,
 * five in English) and a fixed typography for the file the applicant uploads.
 * FRQnet's presentation standards for attachments are letter paper, 2 cm margins,
 * Times New Roman 12 point, single spacing; a full page of running text at those
 * settings holds about 3,300 to 3,600 characters. The estimate below divides the
 * characters of each visible prose section by that figure, plus a small
 * allowance for the heading and the gap under it. It describes the Word template
 * the text will be pasted into, not SigmaCV's own preview (whose typography
 * differs), which is the document the limit applies to. Always shown with "≈".
 */

/** Characters of running text per page under the FRQnet presentation standards. */
export const CHARS_PER_PAGE = 3400;
/** Characters a section heading and the space around it cost on the page. */
const HEADING_ALLOWANCE = 120;

/** Pages for a character count, to one decimal (0 for nothing). */
export function estimatePages(chars: number): number {
  if (chars <= 0) return 0;
  return Math.round((chars / CHARS_PER_PAGE) * 10) / 10;
}

/** Pages one prose section takes (0 for a blank or non-prose section). */
export function proseSectionPages(section: Pick<CvSection, "type" | "body">): number {
  if (!isProseSectionType(section.type)) return 0;
  const body = (section.body ?? "").trim();
  if (!body) return 0;
  return estimatePages(body.length + HEADING_ALLOWANCE);
}

export interface NarrativePageEstimate {
  /** Pages the visible prose sections take together, to one decimal. */
  pages: number;
  /** The page limit of the funder layout last applied, when it has one. */
  limit?: number;
  /** Whether the estimate exceeds the limit (false when there is no limit). */
  over: boolean;
}

/**
 * The visible prose sections' pages together, against the layout's page limit
 * (`display.pageLimit`, set by a funder layout, cleared by another or by reset).
 */
export function narrativePageEstimate(cv: CanonicalCv): NarrativePageEstimate {
  const chars = cv.sections
    .filter((s) => s.visible && isProseSectionType(s.type) && (s.body ?? "").trim().length > 0)
    .reduce((sum, s) => sum + (s.body ?? "").trim().length + HEADING_ALLOWANCE, 0);
  const pages = estimatePages(chars);
  const limit = cv.display.pageLimit;
  return { pages, ...(limit ? { limit } : {}), over: limit ? pages > limit : false };
}
