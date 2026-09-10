import { describe, expect, it } from "vitest";
import { previousReading } from "@/lib/institutions/oaShare";

function aggregates(
  from: number,
  to: number,
  oa: Record<number, { open: number; closed: number }>,
) {
  return {
    version: 1 as const,
    countedEntity: {
      openalexId: "I1",
      displayName: "E",
      lineageSize: 1,
      relatedCount: 0,
      foldedIds: ["I1"],
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

const current = aggregates(2020, 2026, { 2025: { open: 66, closed: 34 } });

describe("previousReading", () => {
  it("is the last full year of the CURRENT window as the previous reading stated it, with that reading's date", () => {
    const out = previousReading(current, {
      aggregates: aggregates(2020, 2026, { 2025: { open: 640, closed: 360 } }),
      fetchedAt: "2026-08-25T00:00:00.000Z",
    });
    expect(out).toEqual({
      year: 2025,
      open: 640,
      known: 1000,
      percent: 64,
      fetchedAt: "2026-08-25T00:00:00.000Z",
    });
  });

  it("is null with no previous reading, when the previous reading stated no share for that year (its own partial year, or below the floor), or when the year lies outside its window", () => {
    expect(previousReading(current, null)).toBeNull();
    // At the previous reading 2025 was the fetch year: withheld as partial.
    expect(
      previousReading(current, {
        aggregates: aggregates(2019, 2025, { 2025: { open: 5000, closed: 0 } }),
        fetchedAt: "2025-12-30T00:00:00.000Z",
      }),
    ).toBeNull();
    // Below the floor then.
    expect(
      previousReading(current, {
        aggregates: aggregates(2020, 2026, { 2025: { open: 50, closed: 40 } }),
        fetchedAt: "2026-08-25T00:00:00.000Z",
      }),
    ).toBeNull();
    // The CURRENT reading states no share for the year: a single reading is no signal.
    expect(
      previousReading(aggregates(2020, 2026, { 2025: { open: 30, closed: 30 } }), {
        aggregates: aggregates(2020, 2026, { 2025: { open: 640, closed: 360 } }),
        fetchedAt: "2026-08-25T00:00:00.000Z",
      }),
    ).toBeNull();
    // Outside its window altogether.
    expect(
      previousReading(current, {
        aggregates: aggregates(2010, 2016, { 2015: { open: 600, closed: 400 } }),
        fetchedAt: "2016-08-25T00:00:00.000Z",
      }),
    ).toBeNull();
  });
});
