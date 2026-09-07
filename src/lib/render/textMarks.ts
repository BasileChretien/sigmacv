import { rederiveEntryLine } from "@/lib/canonical/entryLine";
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
 * The entry line as the OWNER rewrote it, when they did: their free-text
 * `displayTextOverride`, or — after an institution rename (`meta.institutionOverride`)
 * — the line re-derived from the structured meta with that name in place (what
 * every renderer prints). undefined when the line is still the source's own.
 */
function ownerRewrittenLine(item: CvItem): string | undefined {
  const text = item.displayTextOverride?.trim();
  if (text) return text;
  const institution = item.meta.institutionOverride?.trim();
  if (!institution) return undefined;
  /* v8 ignore next -- a non-blank institution override always re-derives (itemInstitution is set) */
  return rederiveEntryLine(item) ?? institution;
}

/**
 * The organisation a verified entry may be said to be verified BY: ORCID's
 * asserter name (`meta.verifiedBy`) — UNLESS the owner rewrote the line or the
 * institution and the text they chose no longer carries that name. Naming the
 * asserter then would re-reveal an employer the owner deliberately wrote out, so
 * the mark falls back to the generic wording instead (undefined here). Also
 * undefined when ORCID named no asserter. Shared by the plain clause and the
 * HTML badge title so every surface applies the same rule.
 */
export function verifiedAsserter(item: CvItem): string | undefined {
  const org = item.meta.verifiedBy?.trim();
  if (!org) return undefined;
  const rewritten = ownerRewrittenLine(item);
  if (rewritten !== undefined && !rewritten.toLowerCase().includes(org.toLowerCase())) {
    return undefined;
  }
  return org;
}

/**
 * The plain verified clause for an entry a trusted organisation asserted on the
 * ORCID record (`meta.verified`): "verified by <org>" when the asserter may be
 * named ({@link verifiedAsserter}), else the generic "verified via ORCID".
 * Localised to the CV language. "" when `display.showVerifiedBadges` is off or
 * the entry isn't verified — mirrors `verifiedBadgeHtml` exactly.
 */
function verifiedMarkText(item: CvItem, display: DisplayChoices): string {
  if (!display.showVerifiedBadges || !item.meta.verified) return "";
  const s = renderStrings(display.locale);
  const org = verifiedAsserter(item);
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
