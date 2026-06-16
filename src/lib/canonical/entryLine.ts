import type { CvItem } from "./schema";
import { itemRoleTitle } from "./schema";

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

/** Year range like "(2012–2024)" / "(2024–present)". Empty if no years. */
export function yearRange(start?: number, end?: number): string {
  if (start && end) return `(${start}–${end})`;
  if (start) return `(${start}–present)`;
  if (end) return `(until ${end})`;
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
  const institution = item.meta.institution;
  if (!institution) return undefined;
  return formatEntryLine({
    roleTitle: itemRoleTitle(item),
    department: item.meta.department,
    institution,
    startYear: item.meta.startYear,
    endYear: item.meta.endYear,
  });
}
