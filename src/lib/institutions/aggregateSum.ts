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
 * The unit of disclosure is the SET of CVs a figure is computed from, not a
 * count of them: a figure is safe when at least k distinct CVs contribute to it,
 * and a hidden figure is safe when the CVs contributing to everything hidden
 * beside it — everything a reader could recover it from — number at least k
 * together. The rules, in order:
 *
 *  (a) a year row is emitted only if at least k CVs contribute to its total
 *      (a CV contributes when it has at least one work that year); a year with
 *      1..k−1 contributors is hidden (absent);
 *  (b) a cell nobody contributes to is STRUCTURALLY EMPTY: emitted as `0` (it
 *      discloses nobody and is never "hidden"); a cell with 1..k−1 contributors
 *      is hidden (`null`, "fewer than k researchers"); a cell with k or more is
 *      shown. The section table follows the same rule per type (a type nobody
 *      has a work in is absent, not zero);
 *  (c) within a shown year row, whose total is on the page: while some cell is
 *      hidden and the union of the hidden cells' contributors is smaller than k,
 *      the smallest SHOWN cell (ties: first in state order) is hidden too — so
 *      total − Σ(shown) is only ever the sum of a hidden set that k CVs stand
 *      behind, never one or two CVs' figure;
 *  (d) across the two tables: both add up to the same overall total, so
 *      Σ(shown types) − Σ(shown years) = Σ(hidden years) − Σ(hidden types) is
 *      ALWAYS computable from the page — with one table fully shown it is a
 *      hidden row outright, and with both partially hidden it is still a
 *      number that only the hidden entries' contributors stand behind (a lone
 *      CV's hidden year minus another lone CV's hidden type is two people's
 *      figure). So whenever anything is hidden in either table and the union
 *      of contributors to every hidden year row and hidden type is smaller
 *      than k, the smallest shown entry of EITHER table (year rows by total,
 *      types by count; ties: years before types, then key order) is hidden
 *      too, until the hidden set stands on k CVs or nothing shown is left.
 *
 * Suppressed years are simply absent (the page says so in one sentence) and a
 * suppressed cell carries no contributor count either — emitting "3 CVs" would
 * be emitting the cell. The property test in `tests/aggregate-sum.test.ts`
 * asserts (a)–(d) over random populations.
 */

/** Distinct CVs a year row or a cell needs before it is shown. */
export const K_ANONYMITY = 5;

export interface SummedCell {
  count: number;
  /** Distinct CVs the count came from; `0` only for a structurally empty cell
   *  (count `0`, shown as such — nobody has such a work). */
  contributorCount: number;
}

export interface SummedYearRow {
  /** `"2021"` or {@link UNKNOWN_YEAR}. */
  year: string;
  total: SummedCell;
  /** `null` = suppressed (1..k−1 contributing CVs, or hidden to cover one). */
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

/** A figure with the rows (indices into the readable rows) it came from. */
interface Entry {
  id: string;
  count: number;
  contributors: ReadonlySet<number>;
}

/** Structurally empty: nobody contributes, shown as 0. */
const EMPTY_CELL: SummedCell = { count: 0, contributorCount: 0 };
const NO_ROWS: ReadonlySet<number> = new Set<number>();

/** Accumulate `count` from row `row` under `key`. The map and its sets are
 *  private to one `sumAggregates` call (built here, read below), so they are
 *  extended in place rather than re-copied per work — the only mutation in
 *  this module, and never of an input. */
function add(
  acc: Map<string, { count: number; contributors: Set<number> }>,
  key: string,
  count: number,
  row: number,
): void {
  if (count <= 0) return;
  const cur = acc.get(key);
  if (cur) {
    cur.count += count;
    cur.contributors.add(row);
  } else {
    acc.set(key, { count, contributors: new Set([row]) });
  }
}

function entryOf(
  id: string,
  acc: { count: number; contributors: ReadonlySet<number> } | undefined,
): Entry {
  return { id, count: acc?.count ?? 0, contributors: acc?.contributors ?? NO_ROWS };
}

function cellOf(e: Entry): SummedCell {
  return { count: e.count, contributorCount: e.contributors.size };
}

function unionOf(entries: readonly Entry[]): ReadonlySet<number> {
  const out = new Set<number>();
  for (const e of entries) for (const row of e.contributors) out.add(row);
  return out;
}

/** The smallest entry by count (ties: the first). */
function smallest(entries: readonly Entry[]): Entry {
  return entries.reduce((best, e) => (e.count < best.count ? e : best));
}

/**
 * Rules (c) and (d): while `hidden` is non-empty and its contributors do not
 * cover k rows, move the smallest of `candidates` into it. Returns the ids of
 * the candidates hidden this way. Stops when the candidates run out — then
 * everything the hidden set could be recovered from is hidden with it.
 */
function coverHidden(
  hidden: readonly Entry[],
  candidates: readonly Entry[],
  k: number,
): ReadonlySet<string> {
  const moved = new Set<string>();
  if (hidden.length === 0) return moved;
  let covered = unionOf(hidden);
  let remaining = candidates;
  while (covered.size < k && remaining.length > 0) {
    const next = smallest(remaining);
    moved.add(next.id);
    covered = new Set([...covered, ...next.contributors]);
    remaining = remaining.filter((e) => e !== next);
  }
  return moved;
}

function yearOrder(a: string, b: string): number {
  if (a === UNKNOWN_YEAR) return 1;
  if (b === UNKNOWN_YEAR) return -1;
  return Number(a) - Number(b);
}

const KNOWN_TYPES = new Set<string>(SECTION_TYPES);

/** One year row after rules (b) and (c), with the row's own entry for rule (d). */
interface YearCandidate {
  entry: Entry;
  oa: Record<OpenAccessState, SummedCell | null>;
}

/** Rules (b) + (c) on one shown year's cells. */
function yearCells(
  cells: ReadonlyMap<OpenAccessState, { count: number; contributors: ReadonlySet<number> }>,
  k: number,
): Record<OpenAccessState, SummedCell | null> {
  const entries = OPEN_ACCESS_STATES.map((st) => entryOf(st, cells.get(st)));
  const hidden = entries.filter((e) => e.contributors.size > 0 && e.contributors.size < k);
  const shown = entries.filter((e) => e.contributors.size >= k);
  const covered = coverHidden(hidden, shown, k);
  const oa = {} as Record<OpenAccessState, SummedCell | null>;
  for (const e of entries) {
    const st = e.id as OpenAccessState;
    if (e.contributors.size === 0) oa[st] = EMPTY_CELL;
    else if (e.contributors.size < k || covered.has(st)) oa[st] = null;
    else oa[st] = cellOf(e);
  }
  return oa;
}

/** Sum the readable aggregates of an institution's consented CVs under
 *  k-anonymity (rules (a)–(d) above). `null` aggregates count as pending. */
export function sumAggregates(
  rows: ReadonlyArray<{ aggregates: CvAggregates | null }>,
  k: number = K_ANONYMITY,
): SummedAggregates {
  const present = rows.flatMap((r) => (r.aggregates ? [r.aggregates] : []));

  const yearTotals = new Map<string, { count: number; contributors: Set<number> }>();
  const cellsByYear = new Map<
    string,
    Map<OpenAccessState, { count: number; contributors: Set<number> }>
  >();
  const typeTotals = new Map<string, { count: number; contributors: Set<number> }>();
  present.forEach((a, row) => {
    for (const [year, r] of Object.entries(a.byYear)) {
      add(yearTotals, year, r.total, row);
      const cells = cellsByYear.get(year) ?? new Map();
      for (const st of OPEN_ACCESS_STATES) add(cells, st, r.oa[st], row);
      cellsByYear.set(year, cells);
    }
    // A stored key outside the catalogue (a type a later schema dropped) is ignored.
    for (const [type, count] of Object.entries(a.byType) as Array<[string, number]>) {
      if (KNOWN_TYPES.has(type)) add(typeTotals, type, count, row);
    }
  });

  // Rules (a)–(c): the year table.
  const hiddenYears: Entry[] = [];
  const shownYears: YearCandidate[] = [];
  for (const year of [...yearTotals.keys()].sort(yearOrder)) {
    const entry = entryOf(year, yearTotals.get(year));
    if (entry.contributors.size < k) hiddenYears.push(entry);
    // Every year in `yearTotals` was given its cell map in the same loop above.
    else shownYears.push({ entry, oa: yearCells(cellsByYear.get(year)!, k) });
  }

  // Rule (b) per type: the section table.
  const types = SECTION_TYPES.filter((t) => typeTotals.has(t)).map((t) =>
    entryOf(t, typeTotals.get(t)),
  );
  const hiddenTypes = types.filter((e) => e.contributors.size < k);
  const shownTypes = types.filter((e) => e.contributors.size >= k);

  // Rule (d): the difference between the two tables' shown sums is always on
  // the page, so the hidden entries of both are covered from both. Year ids
  // (digits or `UNKNOWN_YEAR`) and type ids (the section catalogue) never
  // collide, so one set of moved ids serves both tables; the candidate order
  // is the tie-break (years first, each table in its own key order).
  const covered = coverHidden(
    [...hiddenYears, ...hiddenTypes],
    [...shownYears.map((y) => y.entry), ...shownTypes],
    k,
  );

  const byYear: SummedYearRow[] = shownYears
    .filter((y) => !covered.has(y.entry.id))
    .map((y) => ({ year: y.entry.id, total: cellOf(y.entry), oa: y.oa }));
  const byType: SummedTypeRow[] = types.map((e) => ({
    type: e.id as CvSectionType,
    cell: e.contributors.size < k || covered.has(e.id) ? null : cellOf(e),
  }));

  return {
    contributors: present.length,
    pending: rows.length - present.length,
    k,
    byYear,
    byType,
  };
}
