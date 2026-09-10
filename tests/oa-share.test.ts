import { describe, expect, it } from "vitest";
import {
  MIN_SHARE_DENOMINATOR,
  oaShareByYear,
  yearsWhereTotalsDiffer,
} from "@/lib/institutions/oaShare";

const years = { from: 2022, to: 2025 };

function status(year: number, entries: Record<string, number>) {
  return Object.entries(entries).map(([st, count]) => ({ year, status: st, count }));
}

describe("oaShareByYear", () => {
  it("sums the status buckets as the denominator, counts everything but closed as open, and rounds to a whole percent", () => {
    const rows = oaShareByYear({
      years,
      oaByStatusByYear: status(2023, { gold: 100, green: 50, bronze: 50, closed: 100 }),
    });
    const r = rows.find((x) => x.year === 2023)!;
    expect(r).toEqual({
      year: 2023,
      known: 300,
      closed: 100,
      open: 200,
      percent: 67,
      withheld: null,
    });
  });

  it("emits one row per year of the window, oldest first, including years with no bucket", () => {
    const rows = oaShareByYear({ years, oaByStatusByYear: status(2024, { gold: 500 }) });
    expect(rows.map((r) => r.year)).toEqual([2022, 2023, 2024, 2025]);
    expect(rows[0]).toEqual({
      year: 2022,
      known: 0,
      closed: 0,
      open: 0,
      percent: null,
      withheld: "small-denominator",
    });
  });

  it("withholds the share below the floor and states it exactly at the floor", () => {
    const below = oaShareByYear({
      years,
      oaByStatusByYear: status(2023, { gold: MIN_SHARE_DENOMINATOR - 1 }),
    }).find((r) => r.year === 2023)!;
    expect(below.percent).toBeNull();
    expect(below.withheld).toBe("small-denominator");
    const at = oaShareByYear({
      years,
      oaByStatusByYear: status(2023, { gold: MIN_SHARE_DENOMINATOR }),
    }).find((r) => r.year === 2023)!;
    expect(at).toMatchObject({ percent: 100, withheld: null });
  });

  it("withholds the snapshot's last year as partial however many works it counts", () => {
    const last = oaShareByYear({
      years,
      oaByStatusByYear: status(2025, { gold: 5000, closed: 5000 }),
    }).find((r) => r.year === 2025)!;
    expect(last).toMatchObject({
      known: 10000,
      open: 5000,
      percent: null,
      withheld: "partial-year",
    });
  });

  it("counts a status it does not know as open, never silently as closed", () => {
    const r = oaShareByYear({
      years,
      oaByStatusByYear: status(2023, { closed: 100, "some-new-status": 100 }),
    }).find((x) => x.year === 2023)!;
    expect(r).toMatchObject({ known: 200, open: 100, percent: 50 });
  });

  it("never treats a year below the window's last year as partial: the key is years.to, not the wall clock", () => {
    const rows = oaShareByYear({
      years,
      oaByStatusByYear: [...status(2024, { gold: 5000 }), ...status(2025, { gold: 5000 })],
    });
    expect(rows.find((r) => r.year === 2024)).toMatchObject({ percent: 100, withheld: null });
    expect(rows.find((r) => r.year === 2025)).toMatchObject({
      percent: null,
      withheld: "partial-year",
    });
  });

  it("only ever states an integer between 0 and 100", () => {
    const rows = oaShareByYear({
      years,
      oaByStatusByYear: [
        ...status(2022, { closed: 777 }),
        ...status(2023, { gold: 1, closed: 299 }),
        ...status(2024, { gold: 123, hybrid: 456, closed: 0 }),
      ],
    });
    for (const r of rows.filter((x) => x.percent !== null)) {
      expect(Number.isInteger(r.percent)).toBe(true);
      expect(r.percent).toBeGreaterThanOrEqual(0);
      expect(r.percent).toBeLessThanOrEqual(100);
    }
    expect(rows.find((r) => r.year === 2022)!.percent).toBe(0);
    expect(rows.find((r) => r.year === 2024)!.percent).toBe(100);
  });
});

describe("yearsWhereTotalsDiffer", () => {
  it("names the years where the two totals differ by more than one percent, and no other", () => {
    const out = yearsWhereTotalsDiffer({
      years,
      worksByYear: [
        { year: 2022, count: 1000 },
        { year: 2023, count: 1000 },
        { year: 2024, count: 0 },
        { year: 2025, count: 0 },
      ],
      oaByStatusByYear: [
        ...status(2022, { gold: 995 }), // 0.5 % — within tolerance
        ...status(2023, { gold: 980 }), // 2 % — named
        ...status(2024, { gold: 10 }), // works-by-year has no row: named
      ],
    });
    expect(out).toEqual([2023, 2024]);
  });

  it("is empty when both totals agree everywhere, including two zeros", () => {
    expect(
      yearsWhereTotalsDiffer({
        years,
        worksByYear: [{ year: 2023, count: 50 }],
        oaByStatusByYear: status(2023, { gold: 50 }),
      }),
    ).toEqual([]);
  });
});
