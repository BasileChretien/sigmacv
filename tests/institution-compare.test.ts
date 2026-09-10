import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  counts: vi.fn(),
  records: vi.fn(),
  withSnapshot: vi.fn(),
}));

vi.mock("@/lib/cv/listed", () => ({
  countListedCvsByRor: mocks.counts,
  trustedInstitutionRecords: mocks.records,
  institutionsWithSnapshot: mocks.withSnapshot,
}));

import {
  MAX_COMPARED,
  SNAPSHOT_SKEW_DAYS,
  canonicalCompareQuery,
  institutionComparison,
  listComparableInstitutions,
  normaliseCompareIds,
} from "@/lib/institutions/compare";
import { MIN_SHARE_DENOMINATOR } from "@/lib/institutions/oaShare";

const A = "04chrp450"; // Nagoya
const B = "027arzy69"; // CHU de Caen
const C = "03xjwb503"; // Caen
const D = "0220mzb33"; // a fourth, over the cap

/** A stored snapshot: `oa[year] = { open, closed }`, window `from..to`. */
function aggregates(
  from: number,
  to: number,
  oa: Record<number, { open: number; closed: number }>,
) {
  return {
    version: 1,
    countedEntity: {
      openalexId: "I60134161",
      displayName: "Entity",
      lineageSize: 1,
      relatedCount: 2,
      foldedIds: ["I60134161", "I1", "I2"],
      fetchedAt: "2026-09-01T00:00:00.000Z",
    },
    countedWorkTypes: ["article"],
    years: { from, to },
    worksByYear: [],
    oaByStatusByYear: Object.entries(oa).flatMap(([y, v]) => [
      { year: Number(y), status: "gold", count: v.open },
      { year: Number(y), status: "closed", count: v.closed },
    ]),
    topCountries: [],
    topCoAffiliations: [],
  };
}

function record(
  rorId: string,
  name: string,
  over: Partial<{
    country: string | null;
    openalexId: string | null;
    openalexAggregates: unknown;
    openalexFetchedAt: Date | null;
    openalexPreviousAggregates: unknown;
    openalexPreviousFetchedAt: Date | null;
  }> = {},
) {
  return {
    rorId,
    name,
    country: "JP",
    openalexId: "I60134161",
    openalexAggregates: aggregates(2020, 2026, {
      2021: { open: 300, closed: 700 },
      2024: { open: 500, closed: 500 },
      2025: { open: 60, closed: 20 },
      2026: { open: 900, closed: 100 },
    }),
    openalexFetchedAt: new Date("2026-09-01T00:00:00.000Z"),
    openalexPreviousAggregates: null,
    openalexPreviousFetchedAt: null,
    ...over,
  };
}

function db(rows: ReturnType<typeof record>[], counts: Record<string, number>) {
  mocks.counts.mockResolvedValue(new Map(Object.entries(counts)));
  mocks.records.mockResolvedValue(new Map(rows.map((r) => [r.rorId, r])));
}

beforeEach(() => {
  mocks.counts.mockReset();
  mocks.records.mockReset();
  mocks.withSnapshot.mockReset();
});

describe("normaliseCompareIds", () => {
  it("accepts one id or many, trims, drops anything that is not a bare ROR id silently, deduplicates, and caps", () => {
    expect(normaliseCompareIds(undefined)).toEqual({ ids: [], dropped: [] });
    expect(normaliseCompareIds(` ${A} `)).toEqual({ ids: [A], dropped: [] });
    expect(normaliseCompareIds([A, "https://ror.org/04chrp450", "x'; --", "", A, B])).toEqual({
      ids: [A, B],
      dropped: [],
    });
    const many = normaliseCompareIds([A, B, C, D, "01aaaaa11"]);
    expect(many.ids).toEqual([A, B, C]);
    expect(many.ids).toHaveLength(MAX_COMPARED);
    expect(many.dropped).toEqual([
      { rorId: D, reason: "over-cap" },
      { rorId: "01aaaaa11", reason: "over-cap" },
    ]);
  });

  it("makes one canonical query of any order of the same set", () => {
    expect(canonicalCompareQuery([B, A])).toBe(`ror=${B}&ror=${A}`);
    expect(canonicalCompareQuery([A, B])).toBe(canonicalCompareQuery([B, A]));
  });
});

describe("institutionComparison", () => {
  it("returns nothing for no usable id, without reading the database", async () => {
    expect(await institutionComparison(["nope"])).toEqual({
      columns: [],
      dropped: [],
      commonYears: [],
      skewed: false,
      canonicalIds: [],
    });
    expect(mocks.counts).not.toHaveBeenCalled();
  });

  it("drops, with the reason, an id nobody is listed under, one with no stored snapshot, and one below the floor in every full year", async () => {
    db(
      [
        record(A, "Nagoya University", { openalexAggregates: null, openalexFetchedAt: null }),
        record(C, "Université de Caen Normandie", {
          openalexAggregates: aggregates(2020, 2026, {
            2024: { open: MIN_SHARE_DENOMINATOR - 60, closed: 59 },
            2026: { open: 5000, closed: 0 },
          }),
        }),
      ],
      { [A]: 3, [C]: 2 },
    );
    const out = await institutionComparison([A, B, C]);
    expect(out.columns).toEqual([]);
    expect(out.dropped).toEqual([
      { rorId: A, reason: "no-record" },
      { rorId: B, reason: "no-page" },
      { rorId: C, reason: "below-floor" },
    ]);
  });

  it("treats an id with a page but no Institution row at all as having no record", async () => {
    mocks.counts.mockResolvedValue(new Map([[A, 2]]));
    mocks.records.mockResolvedValue(new Map());
    const out = await institutionComparison(A);
    expect(out.columns).toEqual([]);
    expect(out.dropped).toEqual([{ rorId: A, reason: "no-record" }]);
  });

  it("orders the columns by name whatever the caller's order, keeps the full years every record covers plus each column's own incomplete year, and never carries the listed count", async () => {
    db(
      [
        record(A, "Nagoya University"),
        record(C, "Université de Caen Normandie", {
          country: "FR",
          openalexAggregates: aggregates(2021, 2026, {
            2021: { open: 100, closed: 100 },
            2024: { open: 250, closed: 750 },
            2026: { open: 10, closed: 10 },
          }),
        }),
      ],
      { [A]: 1, [C]: 9 },
    );
    const out = await institutionComparison([C, A]);
    expect(out.columns.map((c) => c.name)).toEqual([
      "Nagoya University",
      "Université de Caen Normandie",
    ]);
    expect(out.canonicalIds).toEqual([C, A].sort());
    expect(out.commonYears).toEqual([2021, 2022, 2023, 2024, 2025]);
    expect(out.skewed).toBe(false);
    const nagoya = out.columns[0]!;
    expect(nagoya.country).toBe("JP");
    expect(nagoya.foldedCount).toBe(3);
    expect(nagoya.rows.map((r) => r.year)).toEqual([2021, 2022, 2023, 2024, 2025, 2026]);
    expect(nagoya.rows.find((r) => r.year === 2024)).toMatchObject({
      known: 1000,
      open: 500,
      closed: 500,
      percent: 50,
      withheld: null,
    });
    expect(nagoya.rows.find((r) => r.year === 2025)).toMatchObject({
      percent: null,
      withheld: "small-denominator",
    });
    expect(nagoya.rows.find((r) => r.year === 2026)).toMatchObject({
      known: 1000,
      percent: null,
      withheld: "partial-year",
      statuses: { gold: 900, closed: 100 },
    });
    expect(nagoya.rows.find((r) => r.year === 2022)!.statuses).toEqual({});
    expect(nagoya.domains).toBeUndefined();
    expect(nagoya.previous).toBeNull();
    // Nothing consented rides along: no listed count, no count of any kind.
    expect(JSON.stringify(out)).not.toMatch(/listed|"count":/i);
  });

  it("intersects windows that end in different years, keeping each column's own last year as partial", async () => {
    db(
      [
        record(A, "A", {
          openalexAggregates: aggregates(2019, 2025, { 2023: { open: 100, closed: 100 } }),
          openalexFetchedAt: new Date("2025-12-30T00:00:00.000Z"),
        }),
        record(B, "B", {
          openalexAggregates: aggregates(2020, 2026, { 2023: { open: 100, closed: 100 } }),
          openalexFetchedAt: new Date("2026-01-06T00:00:00.000Z"),
        }),
      ],
      { [A]: 1, [B]: 1 },
    );
    const out = await institutionComparison([A, B]);
    expect(out.commonYears).toEqual([2020, 2021, 2022, 2023, 2024]);
    expect(out.columns[0]!.rows.map((r) => r.year)).toEqual([2020, 2021, 2022, 2023, 2024, 2025]);
    expect(out.columns[1]!.rows.map((r) => r.year)).toEqual([2020, 2021, 2022, 2023, 2024, 2026]);
    expect(out.skewed).toBe(false);
  });

  it("carries the previous reading of the last full year, and withholds it with the shares under skew", async () => {
    const prev = {
      openalexPreviousAggregates: aggregates(2020, 2026, { 2025: { open: 640, closed: 360 } }),
      openalexPreviousFetchedAt: new Date("2026-08-25T00:00:00.000Z"),
    };
    // The current reading states a share for 2025 too (both readings must).
    const current = aggregates(2020, 2026, {
      2024: { open: 500, closed: 500 },
      2025: { open: 700, closed: 300 },
    });
    db(
      [
        record(A, "A", { ...prev, openalexAggregates: current }),
        record(B, "B", { ...prev, openalexAggregates: current }),
      ],
      { [A]: 1, [B]: 1 },
    );
    const out = await institutionComparison([A, B]);
    expect(out.columns[0]!.previous).toEqual({
      year: 2025,
      open: 640,
      known: 1000,
      percent: 64,
      fetchedAt: "2026-08-25T00:00:00.000Z",
    });

    const late = new Date(
      Date.parse("2026-09-01T00:00:00.000Z") + (SNAPSHOT_SKEW_DAYS + 1) * 864e5,
    );
    db([record(A, "A", prev), record(B, "B", { ...prev, openalexFetchedAt: late })], {
      [A]: 1,
      [B]: 1,
    });
    const skewed = await institutionComparison([A, B]);
    expect(skewed.skewed).toBe(true);
    expect(skewed.columns.every((c) => c.previous === null)).toBe(true);

    // The previous readings themselves read too far apart: both lines go.
    db(
      [
        record(A, "A", prev),
        record(B, "B", {
          ...prev,
          openalexPreviousFetchedAt: new Date("2026-07-01T00:00:00.000Z"),
        }),
      ],
      { [A]: 1, [B]: 1 },
    );
    const prevSkewed = await institutionComparison([A, B]);
    expect(prevSkewed.skewed).toBe(false);
    expect(prevSkewed.columns.every((c) => c.previous === null)).toBe(true);

    // At a year boundary A's last full year (2026) is not common: no line for A.
    db(
      [
        record(A, "A", {
          openalexAggregates: aggregates(2021, 2027, {
            2025: { open: 500, closed: 500 },
            2026: { open: 700, closed: 300 },
          }),
          openalexFetchedAt: new Date("2027-01-03T00:00:00.000Z"),
          openalexPreviousAggregates: aggregates(2021, 2027, { 2026: { open: 650, closed: 350 } }),
          openalexPreviousFetchedAt: new Date("2026-12-27T00:00:00.000Z"),
        }),
        record(B, "B", {
          ...prev,
          openalexAggregates: aggregates(2020, 2026, { 2025: { open: 640, closed: 360 } }),
          openalexFetchedAt: new Date("2026-12-28T00:00:00.000Z"),
        }),
      ],
      { [A]: 1, [B]: 1 },
    );
    const boundary = await institutionComparison([A, B]);
    expect(boundary.commonYears).toEqual([2021, 2022, 2023, 2024, 2025]);
    expect(boundary.columns.find((c) => c.rorId === A)!.previous).toBeNull();
    expect(boundary.columns.find((c) => c.rorId === B)!.previous).toMatchObject({ year: 2025 });
  });

  it("withholds every stated share when the snapshots were read too far apart, keeping the counts and the more specific reasons", async () => {
    const late = new Date(
      Date.parse("2026-09-01T00:00:00.000Z") + (SNAPSHOT_SKEW_DAYS + 1) * 864e5,
    );
    db([record(A, "A"), record(B, "B", { openalexFetchedAt: late })], { [A]: 1, [B]: 1 });
    const out = await institutionComparison([A, B]);
    expect(out.skewed).toBe(true);
    for (const col of out.columns) {
      expect(col.rows.every((r) => r.percent === null)).toBe(true);
      expect(col.rows.find((r) => r.year === 2024)).toMatchObject({
        known: 1000,
        withheld: "snapshot-skew",
      });
      expect(col.rows.find((r) => r.year === 2025)!.withheld).toBe("small-denominator");
      expect(col.rows.find((r) => r.year === 2026)!.withheld).toBe("partial-year");
    }
  });

  it("is not skewed at exactly the threshold, treats a non-I entity id or unparsable aggregates as no record, and names a nameless row by its ROR id", async () => {
    const exactly = new Date(Date.parse("2026-09-01T00:00:00.000Z") + SNAPSHOT_SKEW_DAYS * 864e5);
    db([record(A, "A"), record(B, "B", { openalexFetchedAt: exactly })], { [A]: 1, [B]: 1 });
    expect((await institutionComparison([A, B])).skewed).toBe(false);

    db(
      [
        record(A, "A", { openalexId: "W123" }),
        record(B, "B", { openalexAggregates: { junk: 1 } }),
        { ...record(C, "x"), name: null as unknown as string },
      ],
      { [A]: 1, [B]: 1, [C]: 1 },
    );
    const out = await institutionComparison([A, B, C]);
    expect(out.dropped).toEqual([
      { rorId: A, reason: "no-record" },
      { rorId: B, reason: "no-record" },
    ]);
    expect(out.columns.map((c) => c.name)).toEqual([`ROR ${C}`]);
  });

  it("drops a column whose only stated share lies outside the common full years (then widens the window), and breaks name ties by ROR id", async () => {
    const jan = new Date("2026-01-06T00:00:00.000Z");
    db(
      [
        record(A, "A", {
          openalexAggregates: aggregates(2019, 2025, { 2019: { open: 500, closed: 500 } }),
          openalexFetchedAt: new Date("2025-12-30T00:00:00.000Z"),
        }),
        record(B, "B", {
          openalexAggregates: aggregates(2020, 2026, { 2023: { open: 100, closed: 100 } }),
          openalexFetchedAt: jan,
        }),
        record(C, "C", {
          openalexAggregates: aggregates(2018, 2026, { 2023: { open: 100, closed: 100 } }),
          openalexFetchedAt: jan,
        }),
      ],
      { [A]: 1, [B]: 1, [C]: 1 },
    );
    const out = await institutionComparison([A, B, C]);
    expect(out.dropped).toEqual([{ rorId: A, reason: "below-floor" }]);
    expect(out.columns.map((c) => c.rorId)).toEqual([B, C]);
    expect(out.commonYears).toEqual([2020, 2021, 2022, 2023, 2024, 2025]);

    db([record(B, "Same"), record(A, "Same")], { [A]: 1, [B]: 1 });
    expect((await institutionComparison([A, B])).columns.map((c) => c.rorId)).toEqual(
      [A, B].sort(),
    );
    expect((await institutionComparison([B, A])).columns.map((c) => c.rorId)).toEqual(
      [A, B].sort(),
    );
  });

  it("reports the ids over the cap and does not read them", async () => {
    db([record(A, "A"), record(B, "B"), record(C, "C")], { [A]: 1, [B]: 1, [C]: 1 });
    const out = await institutionComparison([A, B, C, D]);
    expect(out.columns).toHaveLength(3);
    expect(out.dropped).toEqual([{ rorId: D, reason: "over-cap" }]);
    expect(mocks.records).toHaveBeenCalledWith([A, B, C]);
  });
});

describe("listComparableInstitutions", () => {
  it("reads the snapshotted rows keyed on the opted-in sets (never a table scan), by name, with the ROR fallback for a blank name", async () => {
    mocks.counts.mockResolvedValue(
      new Map([
        [A, 2],
        [C, 1],
        ["not-a-ror", 4],
      ]),
    );
    mocks.withSnapshot.mockResolvedValue([
      { rorId: C, name: "Université de Caen Normandie" },
      { rorId: A, name: "  " },
    ]);
    expect(await listComparableInstitutions()).toEqual([
      { rorId: A, name: `ROR ${A}` },
      { rorId: C, name: "Université de Caen Normandie" },
    ]);
    expect(mocks.withSnapshot).toHaveBeenCalledWith([A, C]);
  });
});
