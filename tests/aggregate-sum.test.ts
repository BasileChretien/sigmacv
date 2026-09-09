import { describe, expect, it } from "vitest";
import { SECTION_TYPES } from "@/lib/canonical/schema";
import { OPEN_ACCESS_STATES, type OpenAccessState } from "@/lib/cv/worklist";
import {
  K_ANONYMITY,
  sumAggregates,
  type SummedAggregates,
  type SummedYearRow,
} from "@/lib/institutions/aggregateSum";
import { type CvAggregates } from "@/lib/institutions/cvAggregates";

/**
 * Summing per-CV aggregates for an institution page under k-anonymity: a year
 * row needs k contributing CVs, every cell needs k of its own, a lone
 * suppressed cell takes its neighbour with it (complement suppression), and
 * the section table follows the same rules. The property test at the end is
 * the guarantee: from any emitted output, no hidden cell can be recovered as
 * the row total minus the shown cells.
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

/** One CV's aggregate from `{ year: cells }` — totals derived, types given. */
function agg(byYear: Record<string, Oa>, byType: Record<string, number> = {}): CvAggregates {
  const rows: CvAggregates["byYear"] = {};
  let worksTotal = 0;
  for (const [year, cells] of Object.entries(byYear)) {
    const full = oa(cells);
    const total = OPEN_ACCESS_STATES.reduce((n, st) => n + full[st], 0);
    rows[year] = { total, oa: full };
    worksTotal += total;
  }
  return { v: 1, worksTotal, byYear: rows, byType };
}

const row = (a: CvAggregates | null) => ({ aggregates: a });
const year = (s: SummedAggregates, y: string): SummedYearRow | undefined =>
  s.byYear.find((r) => r.year === y);

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
    const rows = Array.from({ length: 5 }, (_, i) =>
      row(
        agg(
          i < 4 ? { 2020: { "open-cc": 2 }, 2021: { "open-cc": 1 } } : { 2021: { "open-cc": 3 } },
        ),
      ),
    );
    const s = sumAggregates(rows);
    expect(year(s, "2020")).toBeUndefined();
    expect(year(s, "2021")?.total).toEqual({ count: 7, contributorCount: 5 });
  });

  it("a CV with a zero row for the year does not contribute to it", () => {
    const rows = [
      ...Array.from({ length: 4 }, () => row(agg({ 2020: { "open-cc": 1 } }))),
      row(agg({ 2020: {} })),
    ];
    expect(year(sumAggregates(rows), "2020")).toBeUndefined();
  });

  it("orders years oldest first with 'unknown' last", () => {
    const rows = Array.from({ length: 5 }, () =>
      row(agg({ unknown: { "open-cc": 1 }, 2021: { "open-cc": 1 }, 2019: { "open-cc": 1 } })),
    );
    expect(sumAggregates(rows).byYear.map((r) => r.year)).toEqual(["2019", "2021", "unknown"]);
  });
});

describe("rule (b): every cell needs k contributing CVs of its own", () => {
  it("nulls a cell fewer than k CVs contribute to and keeps the others, each with its contributor count", () => {
    // Six CVs: all six have an open-cc work in 2020, all six a closed one, and
    // two of them also an open-other one; not-determined is empty everywhere.
    const rows = Array.from({ length: 6 }, (_, i) =>
      row(
        agg({
          2020: { "open-cc": 1, "no-open-copy-found": 2, "open-other": i < 2 ? 1 : 0 },
        }),
      ),
    );
    const r = year(sumAggregates(rows), "2020")!;
    expect(r.total).toEqual({ count: 20, contributorCount: 6 });
    expect(r.oa["open-cc"]).toEqual({ count: 6, contributorCount: 6 });
    expect(r.oa["no-open-copy-found"]).toEqual({ count: 12, contributorCount: 6 });
    // Two suppressed cells: the lone-cell rule below does not fire.
    expect(r.oa["open-other"]).toBeNull();
    expect(r.oa["not-determined"]).toBeNull();
  });
});

describe("rule (c): complement suppression", () => {
  it("when exactly one cell of a row is hidden, hides the smallest shown cell too", () => {
    // Five CVs contribute to three cells; only two to the fourth.
    const rows = Array.from({ length: 5 }, (_, i) =>
      row(
        agg({
          2020: {
            "open-cc": 4,
            "open-other": 2,
            "no-open-copy-found": 3,
            "not-determined": i < 2 ? 1 : 0,
          },
        }),
      ),
    );
    const r = year(sumAggregates(rows), "2020")!;
    expect(r.total.count).toBe(47);
    expect(r.oa["not-determined"]).toBeNull();
    // open-other (10) is the smallest shown cell: hidden with it, so the reader
    // sees 47 − 20 − 15 = 12 for TWO cells, never 2 for one.
    expect(r.oa["open-other"]).toBeNull();
    expect(r.oa["open-cc"]).toEqual({ count: 20, contributorCount: 5 });
    expect(r.oa["no-open-copy-found"]).toEqual({ count: 15, contributorCount: 5 });
  });

  it("leaves a row alone when no cell is hidden, or when two or more already are", () => {
    const full = Array.from({ length: 5 }, () =>
      row(
        agg({
          2020: { "open-cc": 1, "open-other": 1, "no-open-copy-found": 1, "not-determined": 1 },
        }),
      ),
    );
    const r = year(sumAggregates(full), "2020")!;
    for (const st of OPEN_ACCESS_STATES)
      expect(r.oa[st]).toEqual({ count: 5, contributorCount: 5 });

    const two = Array.from({ length: 5 }, () =>
      row(agg({ 2020: { "open-cc": 3, "open-other": 1 } })),
    );
    const r2 = year(sumAggregates(two), "2020")!;
    expect(r2.oa["open-cc"]).toEqual({ count: 15, contributorCount: 5 });
    expect(r2.oa["open-other"]).toEqual({ count: 5, contributorCount: 5 });
    expect(r2.oa["no-open-copy-found"]).toBeNull();
    expect(r2.oa["not-determined"]).toBeNull();
  });

  it("breaks a tie between equal shown cells deterministically (first in state order)", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      row(
        agg({
          2020: {
            "open-cc": 1,
            "open-other": 1,
            "no-open-copy-found": 1,
            "not-determined": i === 0 ? 1 : 0,
          },
        }),
      ),
    );
    const r = year(sumAggregates(rows), "2020")!;
    expect(r.oa["not-determined"]).toBeNull();
    expect(r.oa["open-cc"]).toBeNull();
    expect(r.oa["open-other"]).not.toBeNull();
    expect(r.oa["no-open-copy-found"]).not.toBeNull();
  });
});

describe("rule (d): the section table", () => {
  it("emits a type five CVs contribute to and nulls one fewer contribute to; types follow the canonical order", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      row(
        agg(
          { 2020: { "open-cc": 2 } },
          { publications: 1, preprints: i < 3 ? 1 : 0, ...(i < 2 ? { datasets: 1 } : {}) },
        ),
      ),
    );
    // Every year is shown (5 contributors), so the overall total is on the page
    // and a lone hidden type would be derivable: preprints AND datasets are hidden
    // (two), publications stays.
    const s = sumAggregates(rows);
    expect(s.byType).toEqual([
      { type: "publications", cell: { count: 5, contributorCount: 5 } },
      { type: "preprints", cell: null },
      { type: "datasets", cell: null },
    ]);
    const order = s.byType.map((t) => (SECTION_TYPES as readonly string[]).indexOf(t.type));
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it("applies complement suppression to the types when every year row is shown …", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      row(agg({ 2020: { "open-cc": 2 } }, { publications: 2, preprints: i < 2 ? 1 : 0 })),
    );
    const s = sumAggregates(rows);
    expect(s.byType).toEqual([
      { type: "publications", cell: null },
      { type: "preprints", cell: null },
    ]);
  });

  it("… and not when a year row is hidden, since then the total is not on the page", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      row(
        agg(
          { 2020: { "open-cc": 2 }, ...(i < 2 ? { 2021: { "open-cc": 1 } } : {}) },
          { publications: 2, preprints: i < 2 ? 1 : 0 },
        ),
      ),
    );
    const s = sumAggregates(rows);
    expect(year(s, "2021")).toBeUndefined();
    expect(s.byType).toEqual([
      { type: "publications", cell: { count: 10, contributorCount: 5 } },
      { type: "preprints", cell: null },
    ]);
  });

  it("a section table with a single, hidden entry has nothing else to hide", () => {
    const rows = Array.from({ length: 5 }, (_, i) =>
      row(agg({ 2020: { "open-cc": 1 } }, { preprints: i < 2 ? 1 : 0 })),
    );
    expect(sumAggregates(rows).byType).toEqual([{ type: "preprints", cell: null }]);
  });

  it("ignores a stored type the catalogue does not know", () => {
    const rows = Array.from({ length: 5 }, () => row(agg({}, { publications: 1, bogus: 9 })));
    expect(sumAggregates(rows).byType.map((t) => t.type)).toEqual(["publications"]);
  });
});

describe("k", () => {
  it("is a parameter: with k = 1 nothing is suppressed", () => {
    const s = sumAggregates([row(agg({ 2020: { "open-cc": 1 } }, { publications: 1 }))], 1);
    expect(year(s, "2020")?.oa["open-cc"]).toEqual({ count: 1, contributorCount: 1 });
    expect(year(s, "2020")?.oa["open-other"]).toBeNull();
    expect(s.byType).toEqual([{ type: "publications", cell: { count: 1, contributorCount: 1 } }]);
  });
});

describe("property: no hidden cell is ever derivable from the emitted output", () => {
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
  const YEARS = ["2019", "2020", "2021", "unknown"];
  const TYPES = ["publications", "preprints", "datasets", "software"];

  function randomRows(rand: () => number): Array<{ aggregates: CvAggregates | null }> {
    const n = Math.floor(rand() * 13);
    return Array.from({ length: n }, () => {
      if (rand() < 0.15) return row(null);
      const byYear: Record<string, Oa> = {};
      for (const y of YEARS) {
        if (rand() < 0.5) continue;
        const cells: Oa = {};
        for (const st of OPEN_ACCESS_STATES) if (rand() < 0.6) cells[st] = Math.floor(rand() * 4);
        byYear[y] = cells;
      }
      const byType: Record<string, number> = {};
      for (const t of TYPES) if (rand() < 0.6) byType[t] = Math.floor(rand() * 5);
      return row(agg(byYear, byType));
    });
  }

  it("holds over 400 random institution pages, for k = 2, 3 and 5", () => {
    const rand = prng(20260909);
    for (let i = 0; i < 400; i++) {
      const rows = randomRows(rand);
      const k = [2, 3, 5][i % 3]!;
      const s = sumAggregates(rows, k);
      const present = rows.flatMap((r) => (r.aggregates ? [r.aggregates] : []));
      expect(s.contributors).toBe(present.length);
      expect(s.pending).toBe(rows.length - present.length);

      // Truth: per year, the contributors and the sums.
      const truth = new Map<
        string,
        {
          n: number;
          total: number;
          oa: Record<OpenAccessState, number>;
          oaN: Record<OpenAccessState, number>;
        }
      >();
      for (const a of present) {
        for (const [y, r] of Object.entries(a.byYear)) {
          if (r.total === 0) continue;
          const t = truth.get(y) ?? { n: 0, total: 0, oa: oa({}), oaN: oa({}) };
          t.n++;
          t.total += r.total;
          for (const st of OPEN_ACCESS_STATES) {
            t.oa[st] += r.oa[st];
            if (r.oa[st] > 0) t.oaN[st]++;
          }
          truth.set(y, t);
        }
      }
      const allYearsShown = [...truth.values()].every((t) => t.n >= k);
      expect(s.byYear.length).toBe([...truth.values()].filter((t) => t.n >= k).length);

      for (const r of s.byYear) {
        const t = truth.get(r.year)!;
        expect(r.total).toEqual({ count: t.total, contributorCount: t.n });
        expect(t.n).toBeGreaterThanOrEqual(k);
        const hidden = OPEN_ACCESS_STATES.filter((st) => r.oa[st] === null);
        let shownSum = 0;
        for (const st of OPEN_ACCESS_STATES) {
          const cell = r.oa[st];
          if (cell === null) continue;
          expect(cell).toEqual({ count: t.oa[st], contributorCount: t.oaN[st] });
          expect(cell.contributorCount).toBeGreaterThanOrEqual(k);
          shownSum += cell.count;
        }
        // THE property: a single hidden cell would equal total − shown.
        expect(hidden.length, `${i}: ${r.year} hides one cell`).not.toBe(1);
        expect(shownSum).toBeLessThanOrEqual(r.total.count);
      }

      // Types: shown ones have k contributors and true sums; a lone hidden type
      // is only ever emitted when the overall total is NOT on the page.
      const typeTruth = new Map<string, { n: number; sum: number }>();
      for (const a of present) {
        for (const [ty, c] of Object.entries(a.byType)) {
          if (!c) continue;
          const t = typeTruth.get(ty) ?? { n: 0, sum: 0 };
          t.n++;
          t.sum += c;
          typeTruth.set(ty, t);
        }
      }
      expect(s.byType.map((t) => t.type).sort()).toEqual([...typeTruth.keys()].sort());
      const hiddenTypes = s.byType.filter((t) => t.cell === null);
      for (const t of s.byType) {
        if (t.cell === null) continue;
        const tt = typeTruth.get(t.type)!;
        expect(t.cell).toEqual({ count: tt.sum, contributorCount: tt.n });
        expect(tt.n).toBeGreaterThanOrEqual(k);
      }
      if (allYearsShown) expect(hiddenTypes.length, `${i}: types hide one`).not.toBe(1);
    }
  });
});
