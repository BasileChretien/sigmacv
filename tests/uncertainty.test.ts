import { describe, expect, it } from "vitest";
import {
  ATTRIBUTION_CLASSES,
  attributionProfile,
  attributionRank,
  classifyAttribution,
  PROVISIONAL_PRIORS,
  priorFor,
} from "@/lib/uncertainty/attribution";
import {
  hIndex,
  rcrCoverage,
  rcrMean,
  totalCitations,
  worksCount,
} from "@/lib/uncertainty/indicators";
import { DEFAULT_SEED, propagate, quantile } from "@/lib/uncertainty/propagate";
import { attributionSummary, propagateIndicators } from "@/lib/uncertainty/profile";
import {
  CURRENT_MODEL,
  isCalibrated,
  MODELS,
  MODEL_V1,
  modelFor,
  requireCalibrated,
} from "@/lib/uncertainty/version";
import type { CanonicalCv, CvItem, MisattributionSignal } from "@/lib/canonical/schema";

function item(over: Partial<CvItem> = {}): CvItem {
  return {
    id: over.id ?? "W1",
    source: "openalex",
    sourceId: "https://openalex.org/W1",
    csl: { id: over.id ?? "W1", type: "article-journal", title: "A work" },
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    meta: {},
    ...over,
  } as CvItem;
}

function cv(items: CvItem[]): CanonicalCv {
  return {
    schemaVersion: 2,
    owner: { name: "A Researcher" },
    sections: [
      {
        id: "publications",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items,
      },
    ],
    display: {},
  } as unknown as CanonicalCv;
}

/** `n` misattribution signals, typed to the enum so tsc checks the fixture too. */
const sig = (n: number) => ({
  misattribution: {
    score: 0.5,
    signals: Array.from({ length: n }, (): MisattributionSignal => "different-field"),
  },
});

describe("classifyAttribution", () => {
  it("puts human adjudication above every heuristic, in both directions", () => {
    // A researcher's ruling on their own work beats anything we compute — and a
    // rejection is just as adjudicated as a confirmation.
    expect(classifyAttribution(item({ reviewedAt: "2026-09-03T00:00:00.000Z" }))).toBe(
      "adjudicated",
    );
    expect(classifyAttribution(item({ notMine: true }))).toBe("adjudicated");
    // …even when the heuristics would have said otherwise.
    expect(
      classifyAttribution(item({ notMine: true, meta: { matchBasis: "orcid", ...sig(2) } })),
    ).toBe("adjudicated");
  });

  it("separates user-asserted works from identifier matches", () => {
    // Differently sourced, not merely less certain: folding them into the
    // identifier scale would make the two incomparable.
    expect(classifyAttribution(item({ meta: { claimed: true } }))).toBe("self-asserted");
    expect(classifyAttribution(item({ source: "manual" }))).toBe("self-asserted");
    expect(classifyAttribution(item({ source: "bibtex" }))).toBe("self-asserted");
  });

  it("treats an ORCID match as the strongest automatic evidence", () => {
    expect(classifyAttribution(item({ meta: { matchBasis: "orcid" } }))).toBe("identified");
    expect(classifyAttribution(item({ meta: { matchBasis: "both" } }))).toBe("identified");
  });

  it("does not let a signal undo an ORCID identifier, only qualify it", () => {
    expect(classifyAttribution(item({ meta: { matchBasis: "orcid", ...sig(2) } }))).toBe(
      "probable",
    );
  });

  it("treats a bare author-id match as normal, not as doubt", () => {
    // ORCID is on only a minority of OpenAlex authorships, so author-id-only is
    // the common case for sound work. What moves it down is corroboration.
    expect(classifyAttribution(item({ meta: { matchBasis: "openalex-id" } }))).toBe("probable");
    expect(classifyAttribution(item())).toBe("probable");
  });

  it("steps down the scale as misattribution signals accumulate", () => {
    expect(classifyAttribution(item({ meta: { matchBasis: "openalex-id", ...sig(1) } }))).toBe(
      "uncertain",
    );
    expect(classifyAttribution(item({ meta: { matchBasis: "openalex-id", ...sig(2) } }))).toBe(
      "doubtful",
    );
    expect(classifyAttribution(item({ meta: { matchBasis: "openalex-id", ...sig(3) } }))).toBe(
      "doubtful",
    );
  });
});

describe("attribution priors", () => {
  it("orders the identifier classes monotonically", () => {
    // The scale must not invert: a weaker class can never carry a higher prior.
    const scale = ["identified", "probable", "uncertain", "doubtful"] as const;
    for (let i = 1; i < scale.length; i++) {
      expect(PROVISIONAL_PRIORS[scale[i]!]).toBeLessThan(PROVISIONAL_PRIORS[scale[i - 1]!]);
    }
  });

  it("pins the two points we actually know", () => {
    expect(priorFor(item({ notMine: true }))).toBe(0);
    expect(priorFor(item({ reviewedAt: "2026-09-03T00:00:00.000Z" }))).toBe(1);
  });

  it("keeps every prior a probability", () => {
    for (const c of ATTRIBUTION_CLASSES) {
      expect(PROVISIONAL_PRIORS[c]).toBeGreaterThanOrEqual(0);
      expect(PROVISIONAL_PRIORS[c]).toBeLessThanOrEqual(1);
    }
  });

  it("ranks classes most- to least-confident", () => {
    expect(attributionRank("adjudicated")).toBeLessThan(attributionRank("doubtful"));
    expect(attributionRank("identified")).toBeLessThan(attributionRank("uncertain"));
  });

  it("counts a profile by class", () => {
    const p = attributionProfile([
      item({ meta: { matchBasis: "orcid" } }),
      item({ meta: { matchBasis: "openalex-id", ...sig(2) } }),
      item({ notMine: true }),
    ]);
    expect(p).toMatchObject({ identified: 1, doubtful: 1, adjudicated: 1, uncertain: 0 });
  });
});

describe("the calibration gate", () => {
  it("reports v1 as NOT calibrated", () => {
    // The whole discipline of the feature. If this ever passes without a fitted
    // artefact, numeric intervals would start rendering from chosen coefficients.
    expect(MODEL_V1.calibrated).toBe(false);
    expect(isCalibrated()).toBe(false);
    expect(isCalibrated(MODEL_V1)).toBe(false);
  });

  it("throws loudly at a caller that tries to display an uncalibrated number", () => {
    expect(() => requireCalibrated()).toThrow(/not calibrated/i);
  });

  it("refuses a model that claims calibration without evidence", () => {
    const liar = { ...MODEL_V1, calibrated: true };
    expect(isCalibrated(liar)).toBe(false);
    expect(() => requireCalibrated(liar)).toThrow();
  });

  it("accepts one that carries its calibration statistics", () => {
    const fitted = {
      ...MODEL_V1,
      version: 2,
      calibrated: true,
      calibration: {
        brier: 0.04,
        slope: 1.02,
        intercept: -0.01,
        nAdjudications: 900,
        nResearchers: 60,
        fittedAt: "2027-01-01",
      },
    };
    expect(isCalibrated(fitted)).toBe(true);
    expect(requireCalibrated(fitted)).toBe(fitted);
  });

  it("keeps the version registry append-only and resolvable", () => {
    expect(MODELS).toContain(CURRENT_MODEL);
    expect(modelFor(MODEL_V1.id, 1)).toBe(MODEL_V1);
    expect(modelFor(MODEL_V1.id, 99)).toBeUndefined();
    expect(modelFor("nope", 1)).toBeUndefined();
  });
});

describe("indicators (CV-scoped, not OpenAlex's author figures)", () => {
  const set = [
    item({ id: "A", meta: { citedByCount: 10, rcr: 2 } }),
    item({ id: "B", meta: { citedByCount: 5, rcr: 1 } }),
    item({ id: "C", meta: { citedByCount: 1 } }),
  ];

  it("counts works", () => expect(worksCount(set)).toBe(3));
  it("sums citations, treating a missing count as zero", () =>
    expect(totalCitations(set)).toBe(16));
  it("computes h-index", () => expect(hIndex(set)).toBe(2));
  it("averages RCR over works that carry one", () => expect(rcrMean(set)).toBe(1.5));
  it("reports RCR coverage as the denominator", () => expect(rcrCoverage(set)).toBe(2));

  it("handles the empty set without dividing by zero", () => {
    expect(worksCount([])).toBe(0);
    expect(hIndex([])).toBe(0);
    expect(rcrMean([])).toBe(0);
    expect(totalCitations([])).toBe(0);
  });

  it("computes h-index independently of input order", () => {
    const shuffled = [set[2]!, set[0]!, set[1]!];
    expect(hIndex(shuffled)).toBe(hIndex(set));
  });
});

describe("propagate", () => {
  const many = Array.from({ length: 40 }, (_, i) =>
    item({ id: `W${i}`, meta: { citedByCount: 20 - (i % 20), matchBasis: "openalex-id" } }),
  );

  it("is deterministic: the same seed reproduces the result exactly", () => {
    // The reproducibility contract — a figure must be recomputable from archived
    // inputs, the model version and the seed.
    const a = propagate(many, worksCount, { draws: 300, seed: 42 });
    const b = propagate(many, worksCount, { draws: 300, seed: 42 });
    expect(a).toEqual(b);
  });

  it("gives a different answer for a different seed, but a similar one", () => {
    const a = propagate(many, worksCount, { draws: 500, seed: 1 });
    const b = propagate(many, worksCount, { draws: 500, seed: 2 });
    expect(Math.abs(a.median - b.median)).toBeLessThanOrEqual(2);
  });

  it("collapses to a point when every work is certain", () => {
    const certain: CvItem[] = many.map((it) => ({
      ...it,
      reviewedAt: "2026-09-03T00:00:00.000Z",
    }));
    const r = propagate(certain, worksCount, { draws: 200 });
    expect(r.lower).toBe(r.upper);
    expect(r.point).toBe(certain.length);
  });

  it("collapses to zero when every work is rejected", () => {
    const rejected: CvItem[] = many.map((it) => ({ ...it, notMine: true }));
    const r = propagate(rejected, worksCount, { draws: 200 });
    expect(r.upper).toBe(0);
  });

  it("widens as evidence weakens", () => {
    // The central claim: an interval's width should track how much of the profile
    // rests on weak evidence.
    const strong: CvItem[] = many.map((it) => ({
      ...it,
      meta: { ...it.meta, matchBasis: "orcid" as const },
    }));
    const weak: CvItem[] = many.map((it) => ({ ...it, meta: { ...it.meta, ...sig(2) } }));
    const s = propagate(strong, worksCount, { draws: 800, seed: 7 });
    const w = propagate(weak, worksCount, { draws: 800, seed: 7 });
    expect(w.upper - w.lower).toBeGreaterThan(s.upper - s.lower);
  });

  it("brackets the point estimate", () => {
    const r = propagate(many, hIndex, { draws: 800, seed: 3 });
    expect(r.lower).toBeLessThanOrEqual(r.median);
    expect(r.median).toBeLessThanOrEqual(r.upper);
    // Dropping works can only lower a monotone indicator, never raise it.
    expect(r.upper).toBeLessThanOrEqual(r.point);
  });

  it("stamps the model and marks the result uncalibrated", () => {
    const r = propagate(many, worksCount, { draws: 50 });
    expect(r.modelId).toBe(CURRENT_MODEL.id);
    expect(r.modelVersion).toBe(CURRENT_MODEL.version);
    // A consumer cannot obtain an interval without also obtaining this warning.
    expect(r.calibrated).toBe(false);
    expect(r.seed).toBe(DEFAULT_SEED);
  });

  it("accepts an injected probability, as the calibration harness will", () => {
    const r = propagate(many, worksCount, { draws: 200, probability: () => 1 });
    expect(r.lower).toBe(many.length);
  });

  it("handles an empty work set", () => {
    const r = propagate([], worksCount, { draws: 10 });
    expect(r).toMatchObject({ point: 0, median: 0, lower: 0, upper: 0 });
  });
});

describe("quantile", () => {
  it("reads nearest-rank from a sorted array", () => {
    const s = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    expect(quantile(s, 0.5)).toBe(5);
    expect(quantile(s, 0)).toBe(1);
    expect(quantile(s, 1)).toBe(10);
  });
  it("returns 0 for an empty array rather than NaN", () => expect(quantile([], 0.5)).toBe(0));
});

describe("attributionSummary", () => {
  it("summarises the evidence behind a profile", () => {
    const s = attributionSummary(
      cv([
        item({ id: "A", meta: { matchBasis: "orcid" } }),
        item({ id: "B", meta: { matchBasis: "openalex-id", ...sig(1) } }),
        item({ id: "C", meta: { matchBasis: "openalex-id", ...sig(2) } }),
        item({ id: "D", reviewedAt: "2026-09-03T00:00:00.000Z" }),
      ]),
    );
    expect(s.total).toBe(4);
    expect(s.weaklyEvidenced).toBe(2); // uncertain + doubtful
    expect(s.adjudicated).toBe(1);
    expect(s.weakest).toBe("doubtful");
    expect(s.calibrated).toBe(false);
    expect(s.modelVersion).toBe(CURRENT_MODEL.version);
  });

  it("counts hidden and rejected works, so finding errors cannot flatter the summary", () => {
    const s = attributionSummary(
      cv([item({ id: "A", included: false }), item({ id: "B", notMine: true })]),
    );
    expect(s.total).toBe(2);
  });

  it("ignores non-citation entries", () => {
    const s = attributionSummary(cv([item({ csl: undefined, displayText: "Lecturer" })]));
    expect(s.total).toBe(0);
    expect(s.weakest).toBeUndefined();
  });
});

describe("propagateIndicators", () => {
  it("propagates every named indicator over the visible works", () => {
    const out = propagateIndicators(
      cv([
        item({ id: "A", meta: { citedByCount: 9, matchBasis: "openalex-id" } }),
        item({ id: "B", meta: { citedByCount: 4, matchBasis: "openalex-id" } }),
        item({ id: "H", included: false, meta: { citedByCount: 99 } }),
      ]),
      { draws: 200, seed: 5 },
    );
    // The hidden work is excluded: the CV asserts what it displays.
    expect(out.worksCount.point).toBe(2);
    expect(out.totalCitations.point).toBe(13);
    for (const r of Object.values(out)) expect(r.calibrated).toBe(false);
  });
});
