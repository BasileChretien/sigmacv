import type { InstitutionAggregates } from "./snapshot";

/**
 * The open-access share of an organisation's works, one row per year of the
 * stored snapshot — the one figure the institution pages derive from
 * OpenAlex's counts (decision of 2026-09-09, designed by the panel of
 * 2026-09-10). It is computed at render, never stored: the snapshot stays
 * counts-only.
 *
 * Definitions, all stated on the page beside the figure:
 *
 * - The denominator is the number of works with an OpenAlex OA status that
 *   year — the sum of the status buckets, which all come from ONE request —
 *   not the works-by-year count, which comes from another request and can
 *   differ slightly ({@link yearsWhereTotalsDiffer} names the years where it
 *   does). Summing the buckets guarantees 0–100 %.
 * - The numerator is every status but `closed`: OpenAlex's gold, hybrid,
 *   diamond, green and bronze, and any status the API adds later.
 * - A share is a whole number, and it is WITHHELD (null, with the reason)
 *   for the snapshot's last year — the fetch-time year, structurally
 *   incomplete — and for any year below {@link MIN_SHARE_DENOMINATOR}
 *   works, where one work moves the figure by a printed point.
 *
 * `years` is the snapshot's OWN window and must never be narrowed: `years.to`
 * is the fetch year and the partial-year key. A caller that wants fewer
 * years (the side-by-side view over two snapshots' common full years)
 * filters the returned rows; it never rewrites `years`.
 *
 * Never a difference between two shares, never a sort by one, never a
 * decimal: the reader sees `open / known = n %` and the counts around it.
 */

/** A share is stated only where a year counts at least this many works with
 *  a status: at 100, one work is one printed point. */
export const MIN_SHARE_DENOMINATOR = 100;

/** Why a row carries no share. */
export type OaShareWithheld = "small-denominator" | "partial-year";

export interface OaShareRow {
  year: number;
  /** Works with any OA status that year — the denominator. */
  known: number;
  /** Works whose best copy OpenAlex records as `closed` (found none). */
  closed: number;
  /** `known − closed`: works with an open copy of any status. */
  open: number;
  /** Whole percent `round(100 · open / known)`, or null when withheld. */
  percent: number | null;
  withheld: OaShareWithheld | null;
}

/** OpenAlex's status for "no open copy found". */
const CLOSED = "closed";

/**
 * One row per year of the window, oldest first, whether or not the stored
 * data has a bucket for it (a year with no bucket is 0 works, share withheld).
 */
export function oaShareByYear(
  a: Pick<InstitutionAggregates, "years" | "oaByStatusByYear">,
): OaShareRow[] {
  const rows: OaShareRow[] = [];
  for (let year = a.years.from; year <= a.years.to; year++) {
    let known = 0;
    let closed = 0;
    for (const r of a.oaByStatusByYear) {
      if (r.year !== year) continue;
      known += r.count;
      if (r.status === CLOSED) closed += r.count;
    }
    const open = known - closed;
    const withheld = withheldReason(year, known, a.years.to);
    const percent = withheld === null ? Math.round((100 * open) / known) : null;
    rows.push({ year, known, closed, open, percent, withheld });
  }
  return rows;
}

function withheldReason(year: number, known: number, lastYear: number): OaShareWithheld | null {
  if (year === lastYear) return "partial-year";
  if (known < MIN_SHARE_DENOMINATOR) return "small-denominator";
  return null;
}

/** The relative gap between the two totals above which a year is named. */
const TOTALS_TOLERANCE = 0.01;

/**
 * The years where the works-by-year count and the number of works with a
 * status differ by more than {@link TOTALS_TOLERANCE} of the larger one: the
 * page names them, so a reader relating the two tables is told why they do
 * not add up rather than left to suspect the arithmetic.
 */
export function yearsWhereTotalsDiffer(
  a: Pick<InstitutionAggregates, "years" | "oaByStatusByYear" | "worksByYear">,
): number[] {
  const byYear = new Map(a.worksByYear.map((r) => [r.year, r.count]));
  return oaShareByYear(a)
    .filter(({ year, known }) => {
      const works = byYear.get(year) ?? 0;
      const larger = Math.max(works, known);
      return larger > 0 && Math.abs(works - known) > TOTALS_TOLERANCE * larger;
    })
    .map((r) => r.year);
}
