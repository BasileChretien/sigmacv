import { describe, expect, it } from "vitest";
import { computeDerivedMetrics } from "@/lib/openalex/deriveMetrics";
import type { OpenAlexWork } from "@/lib/openalex/types";

function work(fwci?: number, pct?: number): OpenAlexWork {
  return {
    id: `https://openalex.org/W${Math.abs(fwci ?? 0) * 1000 + (pct ?? 0)}`,
    fwci: fwci ?? null,
    cited_by_percentile_year: pct === undefined ? null : { value: pct },
  } as unknown as OpenAlexWork;
}

describe("computeDerivedMetrics", () => {
  it("averages per-work FWCI and computes the top-10% share", () => {
    const works = [work(2.0, 95), work(1.0, 80), work(0.0, 99)];
    const m = computeDerivedMetrics(works);
    expect(m.fwci_mean).toBeCloseTo(1.0, 5);
    // 2 of 3 works at/above the 90th percentile
    expect(m.top10pct_share).toBeCloseTo(2 / 3, 5);
  });

  it("omits aggregates when the per-work data is absent (no fabrication)", () => {
    const m = computeDerivedMetrics([work(undefined, undefined)]);
    expect(m.fwci_mean).toBeUndefined();
    expect(m.top10pct_share).toBeUndefined();
  });

  // OpenAlex returns `cited_by_percentile_year` as a {min, max} range — there is
  // no `.value`. Reading only `.value` is why the metric was always empty.
  function pctWork(p: { min?: number; max?: number; value?: number } | null): OpenAlexWork {
    return {
      id: `https://openalex.org/Wp${p?.min ?? p?.max ?? p?.value ?? "x"}`,
      fwci: null,
      cited_by_percentile_year: p,
    } as unknown as OpenAlexWork;
  }

  it("reads the {min, max} percentile RANGE (the real OpenAlex shape)", () => {
    // midpoint 91.5 ≥ 90 (top-10%); midpoint 40.5 is not → 1 of 2.
    const m = computeDerivedMetrics([pctWork({ min: 91, max: 92 }), pctWork({ min: 40, max: 41 })]);
    expect(m.top10pct_share).toBeCloseTo(0.5, 5);
  });

  it("uses a single bound when only min or only max is present", () => {
    expect(computeDerivedMetrics([pctWork({ min: 95 })]).top10pct_share).toBe(1);
    expect(computeDerivedMetrics([pctWork({ max: 50 })]).top10pct_share).toBe(0);
  });

  it("ignores an empty percentile object (no usable bound)", () => {
    expect(computeDerivedMetrics([pctWork({})]).top10pct_share).toBeUndefined();
  });
});
