import { SECTION_TYPES, type CvSectionType } from "@/lib/canonical/schema";
import { OPEN_ACCESS_STATES, type OpenAccessState } from "@/lib/cv/worklist";
import { UNKNOWN_YEAR, type CvAggregates } from "./cvAggregates";

/**
 * Summing per-CV aggregates (`cvAggregates.ts`) into an institution page's
 * figures under k-anonymity. Pure: the rows come from `@/lib/cv/listed`
 * (`listedForInstitutionPage`, the pinned-consent reader); nothing here reads a
 * database, and nothing here knows about the OpenAlex snapshot the same page
 * shows in another section — the two are never combined, compared or
 * subtracted (the plan's "Opt-out oracle" veto).
 *
 * A cell is a count with the number of distinct CVs it came from. The
 * suppression rules, applied in this order:
 *
 *  (a) a year row is emitted only if at least k CVs contribute to its total
 *      (a CV contributes when it has at least one work that year);
 *  (b) each open-access cell is emitted only if at least k CVs contribute to
 *      THAT cell, otherwise it is `null` ("fewer than k researchers");
 *  (c) complement suppression: when exactly one cell of a row is hidden while
 *      the row total is shown, the smallest shown cell (ties: first in state
 *      order) is hidden too — otherwise the hidden value is total − Σ(shown);
 *  (d) the section table follows (b) per type, and (c) whenever every year
 *      row is shown, because then the year totals add up to the overall total
 *      and a lone hidden type would be that total minus the shown ones.
 *
 * Suppressed years are simply absent (the page says so in one sentence) and a
 * suppressed cell carries no contributor count either — emitting "0 CVs" would
 * be emitting the cell.
 */

/** Distinct CVs a year row or a cell needs before it is shown. */
export const K_ANONYMITY = 5;

export interface SummedCell {
  count: number;
  contributorCount: number;
}

export interface SummedYearRow {
  /** `"2021"` or {@link UNKNOWN_YEAR}. */
  year: string;
  total: SummedCell;
  /** `null` = suppressed (fewer than k contributing CVs). */
  oa: Record<OpenAccessState, SummedCell | null>;
}

export interface SummedTypeRow {
  type: CvSectionType;
  cell: SummedCell | null;
}

export interface SummedAggregates {
  /** Rows with a readable aggregate. */
  contributors: number;
  /** Rows whose aggregate is not computed yet (null until their next write). */
  pending: number;
  k: number;
  /** Oldest year first, {@link UNKNOWN_YEAR} last; suppressed years absent. */
  byYear: SummedYearRow[];
  /** In the canonical section order; only types with at least one work. */
  byType: SummedTypeRow[];
}

interface Accumulator {
  count: number;
  contributors: number;
}

function add(acc: Map<string, Accumulator>, key: string, count: number): void {
  if (count <= 0) return;
  const cur = acc.get(key) ?? { count: 0, contributors: 0 };
  acc.set(key, { count: cur.count + count, contributors: cur.contributors + 1 });
}

function cellOf(acc: Accumulator | undefined, k: number): SummedCell | null {
  if (!acc || acc.contributors < k) return null;
  return { count: acc.count, contributorCount: acc.contributors };
}

/** Rule (c) on one row's cells: with exactly one hidden, hide the smallest
 *  shown one too (ties → first in `order`). Returns a new record. */
function suppressComplement<K extends string>(
  cells: Record<K, SummedCell | null>,
  order: readonly K[],
): Record<K, SummedCell | null> {
  const hidden = order.filter((key) => cells[key] === null);
  if (hidden.length !== 1) return cells;
  let smallest: K | null = null;
  for (const key of order) {
    const cell = cells[key];
    if (cell && (smallest === null || cell.count < cells[smallest]!.count)) smallest = key;
  }
  // A table with a single, hidden entry has nothing else to hide.
  if (smallest === null) return cells;
  return { ...cells, [smallest]: null };
}

function yearOrder(a: string, b: string): number {
  if (a === UNKNOWN_YEAR) return 1;
  if (b === UNKNOWN_YEAR) return -1;
  return Number(a) - Number(b);
}

const KNOWN_TYPES = new Set<string>(SECTION_TYPES);

/** Sum the readable aggregates of an institution's consented CVs under
 *  k-anonymity (rules (a)–(d) above). `null` aggregates count as pending. */
export function sumAggregates(
  rows: ReadonlyArray<{ aggregates: CvAggregates | null }>,
  k: number = K_ANONYMITY,
): SummedAggregates {
  const present = rows.flatMap((r) => (r.aggregates ? [r.aggregates] : []));

  const yearTotals = new Map<string, Accumulator>();
  const yearCells = new Map<string, Map<OpenAccessState, Accumulator>>();
  const typeTotals = new Map<string, Accumulator>();
  for (const a of present) {
    for (const [year, row] of Object.entries(a.byYear)) {
      add(yearTotals, year, row.total);
      const cells = yearCells.get(year) ?? new Map<OpenAccessState, Accumulator>();
      for (const st of OPEN_ACCESS_STATES) add(cells, st, row.oa[st]);
      yearCells.set(year, cells);
    }
    // A stored key outside the catalogue (a type a later schema dropped) is ignored.
    for (const [type, count] of Object.entries(a.byType) as Array<[string, number]>) {
      if (KNOWN_TYPES.has(type)) add(typeTotals, type, count);
    }
  }

  const years = [...yearTotals.keys()].sort(yearOrder);
  const byYear: SummedYearRow[] = [];
  for (const year of years) {
    const total = cellOf(yearTotals.get(year), k);
    if (!total) continue; // rule (a)
    const cells = yearCells.get(year)!;
    const oa = {} as Record<OpenAccessState, SummedCell | null>;
    for (const st of OPEN_ACCESS_STATES) oa[st] = cellOf(cells.get(st), k); // rule (b)
    byYear.push({ year, total, oa: suppressComplement(oa, OPEN_ACCESS_STATES) }); // rule (c)
  }
  const everyYearShown = byYear.length === years.length;

  const typeCells = {} as Record<CvSectionType, SummedCell | null>;
  const types = SECTION_TYPES.filter((t) => typeTotals.has(t));
  for (const type of types) typeCells[type] = cellOf(typeTotals.get(type), k); // rule (d)
  const finalTypes = everyYearShown ? suppressComplement(typeCells, types) : typeCells;
  const byType: SummedTypeRow[] = types.map((type) => ({ type, cell: finalTypes[type] }));

  return {
    contributors: present.length,
    pending: rows.length - present.length,
    k,
    byYear,
    byType,
  };
}
