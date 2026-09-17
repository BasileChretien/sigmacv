import {
  isProseSectionType,
  proseSectionHasContent,
  type CanonicalCv,
  type Contribution,
  type CvSection,
} from "./schema";

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

/** What a linked entry's title + reference add to a contribution, on average. */
const CONTRIBUTION_ENTRY_ALLOWANCE = 380;

/** Characters one structured contribution prints, roughly. */
function contributionChars(c: Contribution): number {
  return (
    (c.title?.length ?? 0) +
    (c.itemId ? CONTRIBUTION_ENTRY_ALLOWANCE : 0) +
    (c.period?.length ?? 0) +
    (c.role?.length ?? 0) +
    (c.impact?.length ?? 0) +
    (c.citedIn ?? []).reduce((sum, x) => sum + x.text.length + 20, 0) +
    60
  );
}

/** Characters a prose section prints: its body plus its structured contributions. */
function proseSectionChars(section: Pick<CvSection, "body" | "contributions">): number {
  return (
    (section.body ?? "").trim().length +
    (section.contributions ?? []).reduce((sum, c) => sum + contributionChars(c), 0)
  );
}

/** Pages one prose section takes (0 for an empty or non-prose section). */
export function proseSectionPages(
  section: Pick<CvSection, "type" | "body" | "contributions">,
): number {
  if (!isProseSectionType(section.type) || !proseSectionHasContent(section)) return 0;
  return estimatePages(proseSectionChars(section) + HEADING_ALLOWANCE);
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
    .filter((s) => s.visible && isProseSectionType(s.type) && proseSectionHasContent(s))
    .reduce((sum, s) => sum + proseSectionChars(s) + HEADING_ALLOWANCE, 0);
  const pages = estimatePages(chars);
  const limit = cv.display.pageLimit;
  return { pages, ...(limit ? { limit } : {}), over: limit ? pages > limit : false };
}
