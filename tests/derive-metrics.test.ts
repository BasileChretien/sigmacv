import { describe, expect, it } from "vitest";
import {
  computeDerivedMetrics,
  computeSigmaScore,
} from "@/lib/openalex/deriveMetrics";
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

  it("never emits a Sigma-Score value (placeholder)", () => {
    expect(computeSigmaScore().value).toBeUndefined();
    expect(computeSigmaScore().isPlaceholder).toBe(true);
    expect(computeDerivedMetrics([work(1, 50)]).sigma_score).toBeUndefined();
  });
});
