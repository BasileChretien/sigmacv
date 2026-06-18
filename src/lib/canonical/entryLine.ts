import type { CvItem } from "./schema";
import { itemDateRange, itemDepartment, itemInstitution, itemRoleTitle } from "./schema";

/**
 * Structured parts of a Positions / Education line. The role, department and
 * dates are the user-meaningful pieces; the institution is the ROR-canonical
 * name (kept verbatim as a substring so a renderer can locate + link it).
 */
export interface EntryLineParts {
  roleTitle?: string;
  department?: string;
  institution: string;
  startYear?: number;
  endYear?: number;
}

/** Year range like "(2012–2024)" / "(2024–present)". Empty if no years. The
 *  English form is what `build`/`curate` bake into `displayText`; a renderer
 *  swaps the locale-dependent term via {@link localizedYearRange}. */
export function yearRange(start?: number, end?: number): string {
  if (start && end) return `(${start}–${end})`;
  if (start) return `(${start}–present)`;
  if (end) return `(until ${end})`;
  return "";
}

/**
 * Same shape as {@link yearRange} but with the CV language's terms: `present`
 * for an open end, and `untilTemplate` (a "{year}" placeholder) for an end-only
 * range. A closed numeric range carries no words, so it's identical across
 * locales — the renderer only substitutes when this differs from the English form.
 */
export function localizedYearRange(
  start: number | undefined,
  end: number | undefined,
  present: string,
  untilTemplate: string,
): string {
  if (start && end) return `(${start}–${end})`;
  if (start) return `(${start}–${present})`;
  if (end) return `(${untilTemplate.replace("{year}", String(end))})`;
  return "";
}

/**
 * The CV-language year range WITHOUT the enclosing parentheses, for the two-line
 * Positions / Education layout where the dates sit in their own right-aligned slot
 * rather than trailing the line in `(…)`. Same words as {@link localizedYearRange}
 * (`present` for an open end, `untilTemplate` for an end-only range). "" when no
 * year is known, so the renderer can omit the date slot entirely.
 */
export function bareYearRange(
  start: number | undefined,
  end: number | undefined,
  present: string,
  untilTemplate: string,
): string {
  if (start && end) return `${start}–${end}`;
  if (start) return `${start}–${present}`;
  if (end) return untilTemplate.replace("{year}", String(end));
  return "";
}

/**
 * Format a Positions / Education line from its structured parts:
 * "<role>, <department>, <institution> (<years>)". The role and department are
 * optional; the institution always appears verbatim so a renderer can find it.
 * This is the single source of the line string — `build.ts` uses it to derive
 * `displayText` from a live source, and `curate.ts` re-derives the line in place
 * when the user edits the role, so the two never drift.
 */
export function formatEntryLine(p: EntryLineParts): string {
  const head = [p.roleTitle, p.department].filter(Boolean).join(", ");
  const label = head ? `${head}, ${p.institution}` : p.institution;
  const yrs = yearRange(p.startYear, p.endYear);
  return yrs ? `${label} ${yrs}` : label;
}

/**
 * Re-derive the `displayText` of a source-derived Positions / Education item from
 * its structured `meta`, applying the user's `roleTitleOverride` (via
 * {@link itemRoleTitle}). Returns undefined when the item carries no institution
 * (it cannot be re-derived — e.g. a manual or citation item), signalling the
 * caller to leave the existing `displayText` untouched.
 */
export function rederiveEntryLine(item: CvItem): string | undefined {
  const institution = itemInstitution(item);
  if (!institution) return undefined;
  const { startYear, endYear } = itemDateRange(item);
  return formatEntryLine({
    roleTitle: itemRoleTitle(item),
    department: itemDepartment(item),
    institution,
    startYear,
    endYear,
  });
}
