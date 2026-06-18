import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import type { CanonicalCv } from "@/lib/canonical/schema";
import {
  curatedMetrics,
  formatMetricValue,
  formattedMetrics,
  metricsLineText,
  openAccessShare,
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
    expect(formattedMetrics(cv).map((m) => m.label)).toEqual(["2-yr mean citedness", "h-index"]);
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
    // The anchor is the inline `context`; the coverage rides a separate field
    // (the header surfaces it as a hover title, not inline).
    expect(fwci?.context).toContain("1.0 = world average");
    expect(fwci?.coverageNote).toContain("mean over 73 works with FWCI");
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
    expect(formattedMetrics(cv).map((m) => m.label)).toEqual(["Mean work FWCI", "h-index"]);
  });

  it("shows the iCite RCR mean with its biomedical caveat + coverage", () => {
    const cv = makeCv();
    const withRcr: CanonicalCv = {
      ...cv,
      owner: { ...cv.owner, metrics: { rcr_mean: 1.5, rcr_n: 20 } },
      display: { ...cv.display, showMetrics: true, metrics: ["rcr_mean"] },
    };
    const rcr = formattedMetrics(withRcr)[0];
    expect(rcr?.label).toBe("Mean RCR");
    expect(rcr?.value).toBe("1.5");
    expect(rcr?.context).toContain("NIH-funded average");
    expect(rcr?.context).toContain("biomedical");
    expect(rcr?.coverageNote).toContain("mean over 20 works with RCR");
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

  it("counts letters (peer-reviewed) in the FWCI recompute only when countLetters is on", () => {
    // A "letter" is peer-reviewed but identified by document type.
    const mk = (fwci: number, type?: string) => ({
      csl: {},
      included: true,
      notMine: false,
      meta: { fwci, peerReviewed: true, type, citedByCount: 1 },
    });
    const cv = (countLetters: boolean) =>
      ({
        display: { countLetters },
        owner: { metrics: {} },
        sections: [{ type: "publications", items: [mk(2), mk(1), mk(8, "letter")] }],
      }) as unknown as CanonicalCv;
    expect(curatedMetrics(cv(false)).fwci_mean).toBeCloseTo((2 + 1) / 2, 5); // letter excluded
    expect(curatedMetrics(cv(false)).fwci_n).toBe(2);
    expect(curatedMetrics(cv(true)).fwci_mean).toBeCloseTo((2 + 1 + 8) / 3, 5); // letter included
    expect(curatedMetrics(cv(true)).fwci_n).toBe(3);
    // A genuinely non-peer-reviewed work (e.g. editorial) never counts, regardless.
    const withEditorial = {
      display: { countLetters: true },
      owner: { metrics: {} },
      sections: [
        {
          type: "publications",
          items: [
            mk(2),
            {
              csl: {},
              included: true,
              notMine: false,
              meta: { fwci: 9, peerReviewed: false, type: "editorial" },
            },
          ],
        },
      ],
    } as unknown as CanonicalCv;
    expect(curatedMetrics(withEditorial).fwci_n).toBe(1); // editorial excluded (non-peer-reviewed)
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

  it("recomputes the RCR mean / N over curated works carrying a per-work RCR", () => {
    const mk = (rcr?: number) => ({
      csl: {},
      included: true,
      notMine: false,
      meta: { peerReviewed: true, ...(rcr !== undefined ? { rcr } : {}) },
    });
    const cv = {
      display: { countLetters: true },
      owner: { metrics: {} },
      sections: [{ type: "publications", items: [mk(2), mk(1), mk(undefined)] }],
    } as unknown as CanonicalCv;
    const m = curatedMetrics(cv);
    expect(m.rcr_mean).toBeCloseTo(1.5, 5); // (2 + 1) / 2 — the work without RCR excluded
    expect(m.rcr_n).toBe(2);
  });
});

describe("openAccessShare (opt-in profile-level OA share)", () => {
  const mk = (oaIsOpen: boolean | undefined, extra: Record<string, unknown> = {}) => ({
    csl: {},
    included: true,
    notMine: false,
    meta: { peerReviewed: true, oaIsOpen, ...extra },
  });
  const cv = (showOpenAccess: boolean, items: unknown[]): CanonicalCv =>
    ({
      display: { showOpenAccess, countLetters: true },
      owner: { metrics: {} },
      sections: [{ type: "publications", items }],
    }) as unknown as CanonicalCv;

  it("returns null when the toggle is off, even with data", () => {
    expect(openAccessShare(cv(false, [mk(true), mk(false)]))).toBeNull();
  });

  it("returns null when no countable work carries an OA determination", () => {
    expect(openAccessShare(cv(true, [mk(undefined), mk(undefined)]))).toBeNull();
    expect(openAccessShare(cv(true, []))).toBeNull();
  });

  it("computes the share only over works with a determination (closed ≠ unknown)", () => {
    // 2 open, 1 closed, 1 undetermined → known = 3, open = 2, pct = 67.
    const share = openAccessShare(cv(true, [mk(true), mk(false), mk(true), mk(undefined)]));
    expect(share).toEqual({ open: 2, known: 3, pct: 67 });
  });

  it("counts only curated, countable works (drops 'not mine')", () => {
    const share = openAccessShare(cv(true, [mk(true), { ...mk(false), notMine: true }]));
    expect(share).toEqual({ open: 1, known: 1, pct: 100 });
  });

  it("uses its OWN toggle when set, decoupled from the per-work badge toggle", () => {
    const withShare = (share: boolean | undefined, badges: boolean): CanonicalCv =>
      ({
        display: { showOpenAccess: badges, showOpenAccessShare: share, countLetters: true },
        owner: { metrics: {} },
        sections: [{ type: "publications", items: [mk(true), mk(false)] }],
      }) as unknown as CanonicalCv;
    // Explicit share=true shows it even with badges off.
    expect(openAccessShare(withShare(true, false))).toEqual({ open: 1, known: 2, pct: 50 });
    // Explicit share=false hides it even with badges on.
    expect(openAccessShare(withShare(false, true))).toBeNull();
    // Absent (undefined) inherits the badge toggle (backward-compat).
    expect(openAccessShare(withShare(undefined, true))).toEqual({ open: 1, known: 2, pct: 50 });
    expect(openAccessShare(withShare(undefined, false))).toBeNull();
  });
});
