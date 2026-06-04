import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import type { CanonicalCv } from "@/lib/canonical/schema";
import {
  curatedMetrics,
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

  it("appends FWCI coverage (mean over N works) when fwci_n is present", () => {
    const cv = makeCv();
    const withCoverage: CanonicalCv = {
      ...cv,
      owner: { ...cv.owner, metrics: { fwci_mean: 1.84, fwci_n: 73 } },
      display: { ...cv.display, showMetrics: true, metrics: ["fwci_mean"] },
    };
    const fwci = formattedMetrics(withCoverage)[0];
    expect(fwci?.value).toBe("1.8");
    expect(fwci?.context).toContain("1.0 = world average");
    expect(fwci?.context).toContain("mean over 73 works with FWCI");
  });

  it("omits FWCI coverage when fwci_n is absent", () => {
    const cv = makeCv();
    const noCoverage: CanonicalCv = {
      ...cv,
      owner: { ...cv.owner, metrics: { fwci_mean: 1.84 } },
      display: { ...cv.display, showMetrics: true, metrics: ["fwci_mean"] },
    };
    const fwci = formattedMetrics(noCoverage)[0];
    expect(fwci?.context).toBe("1.0 = world average for field & year");
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

describe("curatedMetrics (field-normalized measures follow curation)", () => {
  const workWith = (id: string, fwci: number, pct: number): OpenAlexWork =>
    ({
      id: `https://openalex.org/${id}`,
      title: id,
      display_name: id,
      type: "article",
      publication_year: 2022,
      cited_by_count: 10,
      fwci,
      cited_by_percentile_year: { min: pct, max: pct + 1 },
      authorships: [{ author: { id: "https://openalex.org/A5001069481" } }],
      primary_location: { source: { display_name: "J", type: "journal" } },
    }) as unknown as OpenAlexWork;

  // Three self works carrying per-work FWCI (2, 1, 5) + top-decile (yes, no, yes).
  function build3(): CanonicalCv {
    const cv = buildCanonicalCv({
      id: "cm",
      resolved,
      works: [workWith("Wa", 2, 95), workWith("Wb", 1, 50), workWith("Wc", 5, 99)],
      now: "2026-06-02T00:00:00.000Z",
    });
    return {
      ...cv,
      owner: {
        ...cv.owner,
        // Author-level numbers that must survive untouched.
        metrics: { ...cv.owner.metrics, h_index: 12, works_count: 116 },
      },
    };
  }

  it("recomputes FWCI mean / N / top-10% from per-work data, keeping official counts", () => {
    const m = curatedMetrics(build3());
    expect(m.fwci_mean).toBeCloseTo((2 + 1 + 5) / 3, 5);
    expect(m.fwci_n).toBe(3);
    expect(m.top10pct_share).toBeCloseTo(2 / 3, 5);
    expect(m.h_index).toBe(12); // OpenAlex official — untouched
    expect(m.works_count).toBe(116); // untouched
  });

  it("excludes preprints from the FWCI recompute", () => {
    // A preprint (type + repository venue → routed to the preprints section)
    // carrying a high FWCI must NOT move the mean.
    const preprint = {
      ...workWith("Wpre", 10, 99),
      type: "preprint",
      primary_location: { source: { display_name: "medRxiv", type: "repository" } },
    } as unknown as OpenAlexWork;
    const cv = buildCanonicalCv({
      id: "cmp",
      resolved,
      works: [workWith("Wa", 2, 95), workWith("Wb", 1, 50), workWith("Wc", 5, 99), preprint],
      now: "2026-06-02T00:00:00.000Z",
    });
    const m = curatedMetrics(cv);
    expect(m.fwci_mean).toBeCloseTo((2 + 1 + 5) / 3, 5); // preprint's 10 excluded
    expect(m.fwci_n).toBe(3);
  });

  it("drops a 'not mine' work from the FWCI mean / N / top-10%", () => {
    const cv = build3();
    const curated: CanonicalCv = {
      ...cv,
      sections: cv.sections.map((s) => ({
        ...s,
        items: s.items.map((it) => (it.meta.fwci === 5 ? { ...it, notMine: true } : it)),
      })),
    };
    const m = curatedMetrics(curated);
    expect(m.fwci_mean).toBeCloseTo(1.5, 5); // (2 + 1) / 2
    expect(m.fwci_n).toBe(2);
    expect(m.top10pct_share).toBeCloseTo(0.5, 5); // 1 of 2
  });

  it("keeps the author-level FWCI when no per-work data is present (pre-re-sync)", () => {
    const cv = makeCv(); // fixture works carry no per-work fwci
    const m = curatedMetrics({
      ...cv,
      owner: { ...cv.owner, metrics: { fwci_mean: 1.84, fwci_n: 73 } },
    });
    expect(m.fwci_mean).toBe(1.84);
    expect(m.fwci_n).toBe(73);
  });
});
