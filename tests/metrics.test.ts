import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import type { CanonicalCv } from "@/lib/canonical/schema";
import {
  formatMetricValue,
  formattedMetrics,
  metricsLineText,
} from "@/lib/render/metrics";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function makeCv(): CanonicalCv {
  return buildCanonicalCv({ id: "m", resolved, works, now: "2026-06-02T00:00:00.000Z" });
}

function withMetrics(overrides: Partial<CanonicalCv["display"]>): CanonicalCv {
  const cv = makeCv();
  return {
    ...cv,
    owner: {
      ...cv.owner,
      metrics: {
        "2yr_mean_citedness": 3.42,
        h_index: 12,
        i10_index: 8,
        works_count: 116,
        cited_by_count: 1485,
        fwci_mean: 1.84,
        top10pct_share: 0.25,
      },
    },
    display: { ...cv.display, ...overrides },
  };
}

describe("formatMetricValue", () => {
  it("formats per the metric's catalog format", () => {
    expect(formatMetricValue("h_index", 12)).toBe("12"); // integer
    expect(formatMetricValue("works_count", 116)).toBe("116"); // integer
    expect(formatMetricValue("fwci_mean", 1.84)).toBe("1.8"); // decimal
    // Unknown / removed keys fall back to the decimal format.
    expect(formatMetricValue("top10pct_share", 0.25)).toBe("0.3");
  });

  it("falls back to decimal for an unknown key", () => {
    expect(formatMetricValue("not-a-metric", 3.14159)).toBe("3.1");
  });
});

describe("formattedMetrics", () => {
  it("returns nothing by default (metrics off)", () => {
    expect(formattedMetrics(makeCv())).toEqual([]);
  });

  it("returns nothing when the master toggle is on but none selected", () => {
    expect(formattedMetrics(withMetrics({ showMetrics: true, metrics: [] }))).toEqual([]);
  });

  it("shows selected metrics in catalog order (field-contextualized first)", () => {
    const cv = withMetrics({ showMetrics: true, metrics: ["h_index", "2yr_mean_citedness"] });
    expect(formattedMetrics(cv).map((m) => m.label)).toEqual([
      "2-yr mean citedness",
      "h-index",
    ]);
  });

  it("omits selected metrics that have no captured value", () => {
    const cv = makeCv();
    const noValues: CanonicalCv = {
      ...cv,
      display: { ...cv.display, showMetrics: true, metrics: ["h_index"] },
    };
    expect(formattedMetrics(noValues)).toEqual([]);
  });

  it("formats the mean-citedness with one decimal and counts as integers", () => {
    const cv = withMetrics({ showMetrics: true, metrics: ["2yr_mean_citedness", "works_count"] });
    expect(metricsLineText(cv)).toBe("2-yr mean citedness: 3.4 · Works: 116");
  });

  it("formats field-normalized metrics and ignores removed/unknown keys", () => {
    const cv = withMetrics({
      showMetrics: true,
      // top10pct_share is no longer a selectable metric → silently dropped.
      metrics: ["fwci_mean", "top10pct_share"],
    });
    expect(metricsLineText(cv)).toBe("Mean work FWCI: 1.8");
  });

  it("leads with field-normalized measures before h-index", () => {
    const cv = withMetrics({
      showMetrics: true,
      metrics: ["h_index", "fwci_mean"],
    });
    expect(formattedMetrics(cv).map((m) => m.label)).toEqual([
      "Mean work FWCI",
      "h-index",
    ]);
  });

  it("drops a selected metric that has no captured value", () => {
    const cv = withMetrics({ showMetrics: true, metrics: ["i10_index"] });
    // i10_index isn't in withMetrics()'s owner.metrics → nothing rendered.
    const noI10: CanonicalCv = {
      ...cv,
      owner: {
        ...cv.owner,
        metrics: { h_index: 12 }, // i10_index absent
      },
    };
    expect(formattedMetrics(noI10)).toEqual([]);
  });
});
