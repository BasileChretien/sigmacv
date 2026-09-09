import { describe, expect, it } from "vitest";
import { SECTION_TYPES } from "@/lib/canonical/schema";
import { OPEN_ACCESS_STATES, type OpenAccessState } from "@/lib/cv/worklist";
import {
  K_ANONYMITY,
  sumAggregates,
  type SummedAggregates,
  type SummedCell,
  type SummedYearRow,
} from "@/lib/institutions/aggregateSum";
import { UNKNOWN_YEAR, type CvAggregates } from "@/lib/institutions/cvAggregates";

/**
 * Summing per-CV aggregates for an institution page under k-anonymity, where
 * the unit is the SET of CVs a figure comes from: a year row needs k
 * contributing CVs; a cell nobody has is a structural 0, a cell 1..k−1 have is
 * hidden, a cell k have is shown; hidden cells of a row take shown cells with
 * them until the hidden set stands on k CVs; and across the two tables, while
 * one is fully shown (so the overall total is on the page) the hidden entries
 * of the other take the fully shown table's smallest entries with them until
 * they stand on k CVs too. The property test at the end is the guarantee, over
 * random populations; the named cases before it are the three leaks the review
 * found in the count-based version.
 */

type Oa = Partial<Record<OpenAccessState, number>>;

function oa(cells: Oa): Record<OpenAccessState, number> {
  return {
    "open-cc": cells["open-cc"] ?? 0,
    "open-other": cells["open-other"] ?? 0,
    "no-open-copy-found": cells["no-open-copy-found"] ?? 0,
    "not-determined": cells["not-determined"] ?? 0,
  };
}

/** One CV's aggregate from `{ year: cells }` — totals derived; types given, or
 *  every work filed under Publications when omitted. */
function agg(byYear: Record<string, Oa>, byType?: Record<string, number>): CvAggregates {
  const rows: CvAggregates["byYear"] = {};
  let worksTotal = 0;
  for (const [year, cells] of Object.entries(byYear)) {
    const full = oa(cells);
    const total = OPEN_ACCESS_STATES.reduce((n, st) => n + full[st], 0);
    rows[year] = { total, oa: full };
    worksTotal += total;
  }
  return {
    v: 1,
    worksTotal,
    byYear: rows,
    byType: byType ?? (worksTotal > 0 ? { publications: worksTotal } : {}),
  };
}

const row = (a: CvAggregates | null) => ({ aggregates: a });
const year = (s: SummedAggregates, y: string): SummedYearRow | undefined =>
  s.byYear.find((r) => r.year === y);
const cell = (count: number, contributorCount: number): SummedCell => ({ count, contributorCount });
/** A structurally empty cell: nobody has such a work. Shown as 0, never hidden. */
const ZERO: SummedCell = { count: 0, contributorCount: 0 };
const fiveOf = (a: CvAggregates | ((i: number) => CvAggregates)) =>
  Array.from({ length: 5 }, (_, i) => row(typeof a === "function" ? a(i) : a));

describe("sumAggregates: contributors and pending", () => {
  it("counts the rows with an aggregate as contributors and the null rows as pending", () => {
    const s = sumAggregates([row(agg({})), row(null), row(agg({})), row(null), row(null)]);
    expect(s.contributors).toBe(2);
    expect(s.pending).toBe(3);
    expect(s.k).toBe(K_ANONYMITY);
    expect(K_ANONYMITY).toBe(5);
  });

  it("is empty for no rows", () => {
    expect(sumAggregates([])).toEqual({
      contributors: 0,
      pending: 0,
      k: 5,
      byYear: [],
      byType: [],
    });
  });
});

describe("rule (a): a year row needs k contributing CVs", () => {
  it("omits a year four CVs contribute to and emits one five contribute to, with the summed total", () => {
    const rows = fiveOf((i) =>
      agg(i < 4 ? { 2020: { "open-cc": 2 }, 2021: { "open-cc": 1 } } : { 2021: { "open-cc": 3 } }),
    );
    const s = sumAggregates(rows);
    expect(year(s, "2020")).toBeUndefined();
    expect(year(s, "2021")?.total).toEqual(cell(7, 5));
  });

  it("a CV with a zero row for the year does not contribute to it", () => {
    const rows = [
      ...Array.from({ length: 4 }, () => row(agg({ 2020: { "open-cc": 1 } }))),
      row(agg({ 2020: {} })),
    ];
    expect(year(sumAggregates(rows), "2020")).toBeUndefined();
  });

  it("orders years oldest first with 'unknown' last", () => {
    const rows = fiveOf(
      agg({ unknown: { "open-cc": 1 }, 2021: { "open-cc": 1 }, 2019: { "open-cc": 1 } }),
    );
    expect(sumAggregates(rows).byYear.map((r) => r.year)).toEqual(["2019", "2021", UNKNOWN_YEAR]);
  });
});

describe("rule (b): a cell is 0 when nobody has it, hidden when 1..k−1 CVs have it, shown from k", () => {
  it("a cell nobody contributes to is a structural 0 (shown), never a hidden cell", () => {
    // Six CVs: all six have an open-cc work in 2020 and a closed one; nobody
    // has an open-other or a not-determined one.
    const rows = Array.from({ length: 6 }, () =>
      row(agg({ 2020: { "open-cc": 1, "no-open-copy-found": 2 } })),
    );
    const r = year(sumAggregates(rows), "2020")!;
    expect(r.total).toEqual(cell(18, 6));
    expect(r.oa["open-cc"]).toEqual(cell(6, 6));
    expect(r.oa["no-open-copy-found"]).toEqual(cell(12, 6));
    expect(r.oa["open-other"]).toEqual(ZERO);
    expect(r.oa["not-determined"]).toEqual(ZERO);
  });

  it("nulls a cell two CVs contribute to, and (rule c) takes the smallest shown cell with it", () => {
    const rows = Array.from({ length: 6 }, (_, i) =>
      row(agg({ 2020: { "open-cc": 1, "no-open-copy-found": 2, "open-other": i < 2 ? 1 : 0 } })),
    );
    const r = year(sumAggregates(rows), "2020")!;
    expect(r.total).toEqual(cell(20, 6));
    expect(r.oa["open-other"]).toBeNull();
    // open-cc (6) is the smallest shown cell: hidden with it, so the hidden set
    // stands on all six CVs; closed stays, not-determined is a structural 0.
    expect(r.oa["open-cc"]).toBeNull();
    expect(r.oa["no-open-copy-found"]).toEqual(cell(12, 6));
    expect(r.oa["not-determined"]).toEqual(ZERO);
  });
});

describe("rule (c): the hidden cells of a row take shown cells with them until they stand on k CVs", () => {
  it("with one hidden cell, hides the smallest shown cell too", () => {
    // Five CVs contribute to three cells; only two to the fourth.
    const rows = fiveOf((i) =>
      agg({
        2020: {
          "open-cc": 4,
          "open-other": 2,
          "no-open-copy-found": 3,
          "not-determined": i < 2 ? 1 : 0,
        },
      }),
    );
    const r = year(sumAggregates(rows), "2020")!;
    expect(r.total.count).toBe(47);
    expect(r.oa["not-determined"]).toBeNull();
    // open-other (10) is the smallest shown cell: hidden with it, so the reader
    // sees 47 − 20 − 15 = 12 for TWO cells that five CVs stand behind, never 2
    // for one that two do.
    expect(r.oa["open-other"]).toBeNull();
    expect(r.oa["open-cc"]).toEqual(cell(20, 5));
    expect(r.oa["no-open-copy-found"]).toEqual(cell(15, 5));
  });

  it("REGRESSION (review): two hidden cells that two CVs stand behind are not left to sum to their figure", () => {
    // Five CVs: open-cc 2 and closed 1 each; CV#1 alone has 2 open-other works,
    // CV#2 alone 1 not-determined. The count-based rule saw two hidden cells
    // and stopped: total 18 − open-cc 10 − closed 5 = 3, the two CVs' figure.
    const rows = fiveOf((i) =>
      agg({
        2020: {
          "open-cc": 2,
          "no-open-copy-found": 1,
          "open-other": i === 0 ? 2 : 0,
          "not-determined": i === 1 ? 1 : 0,
        },
      }),
    );
    const r = year(sumAggregates(rows), "2020")!;
    expect(r.total).toEqual(cell(18, 5));
    expect(r.oa["open-other"]).toBeNull();
    expect(r.oa["not-determined"]).toBeNull();
    // The hidden set {CV#1, CV#2} is short of k: the smallest shown cell
    // (closed, 5) joins it, and then all five CVs stand behind 18 − 10 = 8.
    expect(r.oa["no-open-copy-found"]).toBeNull();
    expect(r.oa["open-cc"]).toEqual(cell(10, 5));
  });

  it("REGRESSION (review): a structurally empty column is not 'one hidden cell' and must not hide open-other", () => {
    // Five CVs contribute to three cells; nobody has a not-determined work.
    // The count-based rule nulled the empty cell, saw exactly one hidden and
    // hid open-other (10) with it — for nothing.
    const rows = fiveOf(agg({ 2020: { "open-cc": 4, "open-other": 2, "no-open-copy-found": 3 } }));
    const r = year(sumAggregates(rows), "2020")!;
    expect(r.oa["not-determined"]).toEqual(ZERO);
    expect(r.oa["open-other"]).toEqual(cell(10, 5));
    expect(r.oa["open-cc"]).toEqual(cell(20, 5));
    expect(r.oa["no-open-copy-found"]).toEqual(cell(15, 5));
  });

  it("hidden cells whose contributors already number k together need nothing more", () => {
    // open-other: CVs 1–2; not-determined: CVs 3–5. Two hidden cells, five
    // distinct CVs behind them: open-cc stays shown.
    const rows = fiveOf((i) =>
      agg({
        2020: { "open-cc": 2, "open-other": i < 2 ? 1 : 0, "not-determined": i >= 2 ? 1 : 0 },
      }),
    );
    const r = year(sumAggregates(rows), "2020")!;
    expect(r.oa["open-other"]).toBeNull();
    expect(r.oa["not-determined"]).toBeNull();
    expect(r.oa["open-cc"]).toEqual(cell(10, 5));
    expect(r.oa["no-open-copy-found"]).toEqual(ZERO);
  });

  it("keeps hiding shown cells, smallest first, while the hidden set is short of k (k = 6, seven CVs)", () => {
    // open-other: CV#1 only; not-determined: CV#2 only (hidden, 2 CVs).
    // closed: CVs 1–5 (5 CVs, count 5); open-cc: all seven (count 7).
    const rows = Array.from({ length: 7 }, (_, i) =>
      row(
        agg({
          2020: {
            "open-cc": 1,
            "no-open-copy-found": i < 5 ? 1 : 0,
            "open-other": i === 0 ? 1 : 0,
            "not-determined": i === 1 ? 1 : 0,
          },
        }),
      ),
    );
    const r = year(sumAggregates(rows, 6), "2020")!;
    expect(r.total).toEqual(cell(14, 7));
    // closed joins first (hidden set → CVs 1–5, still five); then open-cc.
    for (const st of OPEN_ACCESS_STATES) expect(r.oa[st], st).toBeNull();
  });

  it("leaves a row alone when no cell is hidden", () => {
    const r = year(
      sumAggregates(
        fiveOf(
          agg({
            2020: { "open-cc": 1, "open-other": 1, "no-open-copy-found": 1, "not-determined": 1 },
          }),
        ),
      ),
      "2020",
    )!;
    for (const st of OPEN_ACCESS_STATES) expect(r.oa[st]).toEqual(cell(5, 5));
  });

  it("breaks a tie between equal shown cells deterministically (first in state order)", () => {
    const rows = fiveOf((i) =>
      agg({
        2020: {
          "open-cc": 1,
          "open-other": 1,
          "no-open-copy-found": 1,
          "not-determined": i === 0 ? 1 : 0,
        },
      }),
    );
    const r = year(sumAggregates(rows), "2020")!;
    expect(r.oa["not-determined"]).toBeNull();
    expect(r.oa["open-cc"]).toBeNull();
    expect(r.oa["open-other"]).toEqual(cell(5, 5));
    expect(r.oa["no-open-copy-found"]).toEqual(cell(5, 5));
  });
});

describe("rule (d): the section table, and the two tables together", () => {
  it("emits a type five CVs contribute to and nulls one fewer contribute to, in the canonical order", () => {
    // The hidden types (preprints: 3 CVs, datasets: 2) stand on three CVs, and
    // the year table — fully shown — would put the overall total on the page,
    // so it gives up its smallest row (its only one) rather than let the sum
    // of the hidden types be read off.
    const rows = fiveOf((i) =>
      agg(
        { 2020: { "open-cc": 2 } },
        { publications: 1, preprints: i < 3 ? 1 : 0, ...(i < 2 ? { datasets: 1 } : {}) },
      ),
    );
    const s = sumAggregates(rows);
    expect(s.byType).toEqual([
      { type: "publications", cell: cell(5, 5) },
      { type: "preprints", cell: null },
      { type: "datasets", cell: null },
    ]);
    expect(s.byYear).toEqual([]);
    const order = s.byType.map((t) => (SECTION_TYPES as readonly string[]).indexOf(t.type));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("REGRESSION (review): a single CV's hidden year cannot be read as the sections' total minus the shown years", () => {
    // Five CVs with 2 works each in 2025; CV#1 alone has 7 more in 2019. The
    // count-based rule showed byYear = [2025: 10] and byType = [publications:
    // 17]: 17 − 10 = 7, one person's figure.
    const rows = fiveOf((i) =>
      agg(
        i === 0 ? { 2025: { "open-cc": 2 }, 2019: { "open-cc": 7 } } : { 2025: { "open-cc": 2 } },
      ),
    );
    const s = sumAggregates(rows);
    expect(year(s, "2019")).toBeUndefined();
    expect(year(s, "2025")?.total).toEqual(cell(10, 5));
    // The section table was fully shown: its smallest (only) entry is hidden
    // with the year, so the overall total is no longer on the page.
    expect(s.byType).toEqual([{ type: "publications", cell: null }]);
  });

  it("the reverse: a hidden section hides the fully shown year table's smallest rows until the hidden set stands on k", () => {
    // Six CVs: 2020 (1 work each) and 2021 (2 each); datasets: CV#1 only.
    const rows = Array.from({ length: 6 }, (_, i) =>
      row(
        agg(
          { 2020: { "open-cc": 1 }, 2021: { "open-cc": 2 } },
          { publications: 3, ...(i === 0 ? { datasets: 1 } : {}) },
        ),
      ),
    );
    const s = sumAggregates(rows);
    expect(s.byType).toEqual([
      { type: "publications", cell: cell(18, 6) },
      { type: "datasets", cell: null },
    ]);
    // 2020 (total 6) is the smallest year row: hidden, and six CVs now stand
    // behind {datasets, 2020}; 2021 stays.
    expect(s.byYear.map((r) => r.year)).toEqual(["2021"]);
    expect(year(s, "2021")?.total).toEqual(cell(12, 6));
  });

  it("when both tables are already partially hidden, the overall total is not on the page and nothing more is hidden", () => {
    // 2021: CVs 1–2 (hidden); preprints: CVs 1–2 (hidden). Neither table adds
    // up to the overall total, so neither hidden entry is the other table's
    // sum minus the shown entries.
    const rows = fiveOf((i) =>
      agg(
        { 2020: { "open-cc": 2 }, ...(i < 2 ? { 2021: { "open-cc": 1 } } : {}) },
        { publications: 2, preprints: i < 2 ? 1 : 0 },
      ),
    );
    const s = sumAggregates(rows);
    expect(year(s, "2021")).toBeUndefined();
    expect(year(s, "2020")?.total).toEqual(cell(10, 5));
    expect(s.byType).toEqual([
      { type: "publications", cell: cell(10, 5) },
      { type: "preprints", cell: null },
    ]);
  });

  it("a section table with a single hidden entry: the fully shown year table gives up its rows, and when it runs out nothing that could reveal the entry is left", () => {
    const rows = fiveOf((i) => agg({ 2020: { "open-cc": 1 } }, { preprints: i < 2 ? 1 : 0 }));
    const s = sumAggregates(rows);
    expect(s.byType).toEqual([{ type: "preprints", cell: null }]);
    expect(s.byYear).toEqual([]);
  });

  it("hidden year rows that stand on k CVs together leave the fully shown section table alone", () => {
    // Five CVs, each with its one work in a different year: five hidden years,
    // five CVs behind them; publications (all five) stays.
    const rows = fiveOf((i) => agg({ [String(2016 + i)]: { "open-cc": 1 } }));
    const s = sumAggregates(rows);
    expect(s.byYear).toEqual([]);
    expect(s.byType).toEqual([{ type: "publications", cell: cell(5, 5) }]);
  });

  it("ignores a stored type the catalogue does not know", () => {
    const rows = fiveOf(agg({}, { publications: 1, bogus: 9 }));
    expect(sumAggregates(rows).byType.map((t) => t.type)).toEqual(["publications"]);
  });
});

describe("k", () => {
  it("is a parameter: with k = 1 nothing is suppressed, and empty cells are still 0", () => {
    const s = sumAggregates([row(agg({ 2020: { "open-cc": 1 } }, { publications: 1 }))], 1);
    expect(year(s, "2020")?.oa["open-cc"]).toEqual(cell(1, 1));
    expect(year(s, "2020")?.oa["open-other"]).toEqual(ZERO);
    expect(s.byType).toEqual([{ type: "publications", cell: cell(1, 1) }]);
  });
});

describe("property: every emitted number stands on k CVs, and so does everything a reader could recover", () => {
  // A small deterministic PRNG (mulberry32) so a failure is reproducible.
  function prng(seed: number): () => number {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const YEARS = ["2019", "2020", "2021", UNKNOWN_YEAR];
  const TYPES = ["publications", "preprints", "datasets", "software"] as const;

  /** Consistent aggregates: the works of each year are the works of the
   *  sections, so each table adds up to the same overall total (as
   *  `computeCvAggregates` guarantees). */
  function randomRows(rand: () => number): Array<{ aggregates: CvAggregates | null }> {
    const n = Math.floor(rand() * 15);
    return Array.from({ length: n }, () => {
      if (rand() < 0.15) return row(null);
      const byYear: Record<string, Oa> = {};
      for (const y of YEARS) {
        if (rand() < 0.5) continue;
        const cells: Oa = {};
        for (const st of OPEN_ACCESS_STATES) if (rand() < 0.6) cells[st] = Math.floor(rand() * 4);
        byYear[y] = cells;
      }
      const a = agg(byYear, {});
      const byType: Record<string, number> = {};
      for (let w = 0; w < a.worksTotal; w++) {
        const t = TYPES[Math.floor(rand() * TYPES.length)]!;
        byType[t] = (byType[t] ?? 0) + 1;
      }
      return row({ ...a, byType });
    });
  }

  interface Truth {
    count: number;
    rows: Set<number>;
  }
  const truthOf = () => ({ count: 0, rows: new Set<number>() });
  const union = (parts: Truth[]) => new Set(parts.flatMap((p) => [...p.rows]));
  const sum = (parts: Truth[]) => parts.reduce((n, p) => n + p.count, 0);

  it("holds over 600 random institution pages (300 with k = 5, the rest k = 2 and 3)", () => {
    const rand = prng(20260909);
    for (let i = 0; i < 600; i++) {
      const rows = randomRows(rand);
      const k = [5, 2, 5, 3][i % 4]!;
      const tag = `case ${i} (k = ${k})`;
      const s = sumAggregates(rows, k);
      const present = rows.flatMap((r) => (r.aggregates ? [r.aggregates] : []));
      expect(s.contributors, tag).toBe(present.length);
      expect(s.pending, tag).toBe(rows.length - present.length);

      // Truth, as sets of row indices: per year (total + cells) and per type.
      const years = new Map<string, { total: Truth; oa: Record<OpenAccessState, Truth> }>();
      const types = new Map<string, Truth>();
      present.forEach((a, r) => {
        for (const [y, yr] of Object.entries(a.byYear)) {
          if (yr.total === 0) continue;
          const t = years.get(y) ?? {
            total: truthOf(),
            oa: Object.fromEntries(OPEN_ACCESS_STATES.map((st) => [st, truthOf()])) as Record<
              OpenAccessState,
              Truth
            >,
          };
          t.total.count += yr.total;
          t.total.rows.add(r);
          for (const st of OPEN_ACCESS_STATES) {
            if (yr.oa[st] === 0) continue;
            t.oa[st].count += yr.oa[st];
            t.oa[st].rows.add(r);
          }
          years.set(y, t);
        }
        for (const [ty, c] of Object.entries(a.byType)) {
          if (!c) continue;
          const t = types.get(ty) ?? truthOf();
          t.count += c;
          t.rows.add(r);
          types.set(ty, t);
        }
      });

      // (i) Every shown number stands on k CVs (or is a structural 0), and is
      // the true sum with the true number of distinct CVs.
      const shownYears = new Set(s.byYear.map((r) => r.year));
      for (const r of s.byYear) {
        const t = years.get(r.year)!;
        expect(t, `${tag}: ${r.year}`).toBeDefined();
        expect(r.total, tag).toEqual(cell(t.total.count, t.total.rows.size));
        expect(t.total.rows.size, tag).toBeGreaterThanOrEqual(k);
        const hidden: Truth[] = [];
        let shownSum = 0;
        for (const st of OPEN_ACCESS_STATES) {
          const truth = t.oa[st];
          const c = r.oa[st];
          if (truth.rows.size === 0) {
            expect(c, `${tag}: ${r.year} ${st} is structurally empty`).toEqual(ZERO);
          } else if (c === null) {
            hidden.push(truth);
          } else {
            expect(c, tag).toEqual(cell(truth.count, truth.rows.size));
            expect(truth.rows.size, tag).toBeGreaterThanOrEqual(k);
            shownSum += c.count;
          }
        }
        // (ii) total − Σ shown is 0 or the sum of a hidden set k CVs stand behind.
        expect(r.total.count - shownSum, tag).toBe(sum(hidden));
        if (hidden.length > 0) {
          expect(
            union(hidden).size,
            `${tag}: ${r.year} hides ${hidden.length}`,
          ).toBeGreaterThanOrEqual(k);
        }
      }
      // Years are ordered and hidden years exist in the truth.
      const order = s.byYear.map((r) => r.year);
      expect(order, tag).toEqual(
        [...order].sort((a, b) =>
          a === UNKNOWN_YEAR ? 1 : b === UNKNOWN_YEAR ? -1 : Number(a) - Number(b),
        ),
      );
      const hiddenYears = [...years].filter(([y]) => !shownYears.has(y)).map(([, t]) => t.total);

      // Types: the catalogue's set, shown ones true and on k CVs.
      expect(s.byType.map((t) => t.type).sort(), tag).toEqual([...types.keys()].sort());
      const hiddenTypes: Truth[] = [];
      let shownTypeSum = 0;
      for (const t of s.byType) {
        const truth = types.get(t.type)!;
        if (t.cell === null) {
          hiddenTypes.push(truth);
        } else {
          expect(t.cell, tag).toEqual(cell(truth.count, truth.rows.size));
          expect(truth.rows.size, tag).toBeGreaterThanOrEqual(k);
          shownTypeSum += t.cell.count;
        }
      }

      // (iii) Σ shown types − Σ shown year totals = Σ hidden years − Σ hidden
      // types (consistent data), and whenever one table is fully shown — so the
      // overall total is on the page — everything hidden stands on k CVs.
      const shownYearSum = s.byYear.reduce((n, r) => n + r.total.count, 0);
      expect(shownTypeSum - shownYearSum, tag).toBe(sum(hiddenYears) - sum(hiddenTypes));
      const crossHidden = [...hiddenYears, ...hiddenTypes];
      if (crossHidden.length > 0 && (hiddenYears.length === 0 || hiddenTypes.length === 0)) {
        expect(union(crossHidden).size, `${tag}: one table fully shown`).toBeGreaterThanOrEqual(k);
      }

      // No over-suppression: an entry k CVs stand behind is hidden only for a
      // reason on the other table.
      for (const t of hiddenYears) {
        if (t.rows.size >= k)
          expect(hiddenTypes.length, `${tag}: year hidden for nothing`).toBeGreaterThan(0);
      }
      for (const t of hiddenTypes) {
        if (t.rows.size >= k)
          expect(hiddenYears.length, `${tag}: type hidden for nothing`).toBeGreaterThan(0);
      }
    }
  });
});
