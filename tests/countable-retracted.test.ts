import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { authorshipCounts } from "@/lib/render/authorship";
import { curatedCountsByYear } from "@/lib/render/charts";
import { countableWorks } from "@/lib/render/countable";
import { curatedMetrics, openAccessShare } from "@/lib/render/metrics";
import { prepareSections } from "@/lib/render/prepare";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";

/**
 * A retracted work (`meta.retracted`, set by the Crossref / Retraction Watch
 * enrichment) must never feed the figures — the RCR mean, the per-year chart, the
 * authorship table, the OA share — whether or not `display.hideRetracted` drops
 * it from the LIST. Before this rule, hiding a retracted paper removed it from the
 * page while it kept inflating every figure.
 */

// ── Hand-built CVs (mirror the lightweight fixtures in metrics.test.ts) ─────────

type Meta = Record<string, unknown>;
const mk = (id: string, meta: Meta, extra: Record<string, unknown> = {}) => ({
  id,
  csl: { id, title: id },
  included: true,
  notMine: false,
  authoredBySelf: true,
  meta: { peerReviewed: true, type: "article", year: 2020, citedByCount: 1, ...meta },
  ...extra,
});

function cvWith(hideRetracted: boolean, items: unknown[]): CanonicalCv {
  return {
    display: { hideRetracted, countLetters: true, showOpenAccess: true },
    owner: { metrics: {} },
    sections: [{ id: "pubs", type: "publications", items }],
  } as unknown as CanonicalCv;
}

const CLEAN = mk("clean", {
  rcr: 2,
  oaIsOpen: true,
  year: 2020,
  authorPosition: 1,
  authorCount: 3,
});
const RETRACTED = mk("retracted", {
  retracted: true,
  rcr: 10,
  oaIsOpen: false,
  year: 2021,
  authorPosition: 1,
  authorCount: 3,
});

describe("countableWorks — retracted works never count", () => {
  it.each([false, true])(
    "excludes a retracted work from the countable set (hideRetracted=%s)",
    (hide) => {
      const ids = countableWorks(cvWith(hide, [CLEAN, RETRACTED])).map((i) => i.id);
      expect(ids).toEqual(["clean"]);
    },
  );

  it("keeps a work whose retracted flag is absent or explicitly false", () => {
    const notFlagged = mk("nf", {});
    const explicitFalse = mk("ef", { retracted: false });
    const ids = countableWorks(cvWith(false, [notFlagged, explicitFalse])).map((i) => i.id);
    expect(ids).toEqual(["nf", "ef"]);
  });

  it("keeps the RCR mean free of the retracted work's value", () => {
    // With the retracted work counted the mean would be (2 + 10) / 2 = 6.
    for (const hide of [false, true]) {
      const m = curatedMetrics(cvWith(hide, [CLEAN, RETRACTED]));
      expect(m.rcr_mean).toBeCloseTo(2, 5);
      expect(m.rcr_n).toBe(1);
    }
  });

  it("keeps the retracted work out of the per-year chart", () => {
    for (const hide of [false, true]) {
      const counts = curatedCountsByYear(cvWith(hide, [CLEAN, RETRACTED]));
      expect(counts).toEqual([{ year: 2020, works: 1, citations: 1 }]);
    }
  });

  it("keeps the retracted work out of the authorship table", () => {
    for (const hide of [false, true]) {
      const [first] = authorshipCounts(cvWith(hide, [CLEAN, RETRACTED]), ["first"]);
      expect(first).toMatchObject({ role: "first", count: 1, total: 1, percent: 100 });
    }
  });

  it("keeps the retracted work out of the open-access share", () => {
    // Counting the (closed) retracted work would read 1/2 = 50%.
    for (const hide of [false, true]) {
      expect(openAccessShare(cvWith(hide, [CLEAN, RETRACTED]))).toEqual({
        open: 1,
        known: 1,
        pct: 100,
      });
    }
  });
});

// ── List ↔ figures agreement through the real build + prepare path ─────────────

const hasApa = listAvailableStyles().includes("apa");
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function work(id: string, title: string): OpenAlexWork {
  return {
    id: `https://openalex.org/${id}`,
    title,
    display_name: title,
    type: "article",
    publication_year: 2024,
    doi: `https://doi.org/10.1000/${id}`,
    authorships: [{ author: { id: "https://openalex.org/A5001069481" } }],
    primary_location: { source: { display_name: "J. Pharmacology", type: "journal" } },
  } as OpenAlexWork;
}

/** Build a real CV and flag one work as retracted the way `enrichCvWithRetractions` does. */
function builtCv(): CanonicalCv {
  const cv = buildCanonicalCv({
    id: "ret",
    resolved,
    works: [work("Wgood", "Sound paper"), work("Wbad", "Withdrawn paper")],
    now: "2026-06-02T00:00:00.000Z",
  });
  return {
    ...cv,
    sections: cv.sections.map((s) => ({
      ...s,
      items: s.items.map((it) =>
        it.csl?.title === "Withdrawn paper" ? { ...it, meta: { ...it.meta, retracted: true } } : it,
      ),
    })),
  };
}

describe.skipIf(!hasApa)("prepareSections list vs countableWorks figures", () => {
  const listedTitles = (cv: CanonicalCv) =>
    prepareSections(cv, "text")
      .flatMap((s) => s.items)
      .map((p) => p.item.csl?.title)
      .filter(Boolean);

  it("hideRetracted off: the retracted work is LISTED (with its badge) but not COUNTED", () => {
    const cv = builtCv();
    expect(listedTitles(cv)).toEqual(expect.arrayContaining(["Sound paper", "Withdrawn paper"]));
    expect(countableWorks(cv).map((i) => i.csl?.title)).toEqual(["Sound paper"]);
    // The chart only ever sees the sound paper.
    expect(curatedCountsByYear(cv)).toEqual([{ year: 2024, works: 1, citations: 0 }]);
  });

  it("hideRetracted on: the retracted work is neither listed nor counted", () => {
    const cv = updateDisplay(builtCv(), { hideRetracted: true });
    expect(listedTitles(cv)).toEqual(["Sound paper"]);
    expect(countableWorks(cv).map((i) => i.csl?.title)).toEqual(["Sound paper"]);
  });

  it("the list is never narrower than the figures: every countable work is listed", () => {
    for (const hide of [false, true]) {
      const cv = updateDisplay(builtCv(), { hideRetracted: hide });
      const listed = new Set(listedTitles(cv));
      for (const it of countableWorks(cv)) expect(listed.has(it.csl?.title)).toBe(true);
    }
  });
});
