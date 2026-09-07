import type { CanonicalCv, CvItem, DisplayChoices } from "@/lib/canonical/schema";
import { renderStrings } from "@/lib/i18n/render";
import { safeHref } from "./escape";

/**
 * The trust marks and identifiers the HTML/PDF shows as badges, chips and links,
 * reduced to PLAIN TEXT so they survive the file boundary — DOCX, Markdown,
 * LaTeX, JSON Résumé and the parser-safe ATS template — under the SAME display
 * toggles (a toggle that hides a mark on screen hides it in every file too).
 *
 * Per-item marks only. Nothing here counts, sums or shares: an "N of M verified"
 * line would be a completeness proxy, and no format may emit one.
 */

/**
 * The plain verified clause for an entry a trusted organisation asserted on the
 * ORCID record (`meta.verified`): "verified by <org>" when ORCID named the
 * asserter (`meta.verifiedBy`), else the generic "verified via ORCID". Localised
 * to the CV language. "" when `display.showVerifiedBadges` is off or the entry
 * isn't verified — mirrors `verifiedBadgeHtml` exactly.
 */
function verifiedMarkText(item: CvItem, display: DisplayChoices): string {
  if (!display.showVerifiedBadges || !item.meta.verified) return "";
  const s = renderStrings(display.locale);
  const org = item.meta.verifiedBy?.trim();
  return org ? s.verifiedByText.replace("{org}", () => org) : s.verifiedGenericText;
}

/** {@link verifiedMarkText} as a parenthesised suffix — " (verified by <org>)" — or "". */
export function verifiedSuffix(item: CvItem, display: DisplayChoices): string {
  const mark = verifiedMarkText(item, display);
  return mark ? ` (${mark})` : "";
}

/**
 * The factual details under a Software entry as plain-text parts, in the order
 * the HTML details line uses: the source-code repository (`meta.repositoryUrl`,
 * re-validated as http(s) via `safeHref` so an unsafe URL is dropped, not
 * printed), the released version, the reuse licence — and, opt-in
 * (`display.showArchivalStatus`), the Software Heritage snapshot URL the HTML
 * carries as an "Archived" badge. Each part is "Label: value"; the caller joins
 * them. Empty when the item carries none.
 */
export function softwareDetailsText(item: CvItem, display: DisplayChoices): string[] {
  const s = renderStrings(display.locale);
  const parts: string[] = [];
  const repo = safeHref(item.meta.repositoryUrl);
  if (repo) parts.push(`${s.softwareRepository}: ${repo}`);
  const version = item.meta.version?.trim();
  if (version) parts.push(s.softwareVersion.replace("{version}", version));
  const license = item.meta.license?.trim();
  if (license) parts.push(s.softwareLicense.replace("{license}", license));
  if (display.showArchivalStatus && item.meta.swhid) {
    parts.push(`${s.badgeArchived}: https://archive.softwareheritage.org/${item.meta.swhid}`);
  }
  return parts;
}

/**
 * The owner's aggregated research areas (`owner.researchAreas`, most frequent
 * first) as a plain labelled line — label + field names, for the text formats
 * and the ATS template. Gated on `display.showResearchAreas` exactly like the
 * HTML chip row; null when off or empty. `fields` are the raw names, so each
 * renderer escapes and joins them in its own syntax.
 */
export function researchAreasLine(cv: CanonicalCv): { label: string; fields: string[] } | null {
  if (!cv.display.showResearchAreas) return null;
  const fields = (cv.owner.researchAreas ?? []).map((a) => a.field);
  if (fields.length === 0) return null;
  return { label: renderStrings(cv.display.locale).researchAreasLabel, fields };
}
