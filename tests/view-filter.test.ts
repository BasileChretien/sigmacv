import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  filterCvForView,
  isFilterActive,
  parseViewFilters,
  viewFilterBarHtml,
  viewFilterFacets,
} from "@/lib/cv/viewFilter";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";

const SELF = "https://openalex.org/A5001069481";
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function work(id: string, year: number, oa: boolean): OpenAlexWork {
  return {
    id: `https://openalex.org/${id}`,
    title: `Study ${id}`,
    display_name: `Study ${id}`,
    type: "article",
    publication_year: year,
    authorships: [{ author: { id: SELF, display_name: "B" }, raw_author_name: "B" }],
    primary_location: { source: { display_name: "Journal A", type: "journal" } },
    open_access: { is_oa: oa, oa_status: oa ? "gold" : "closed" },
  } as unknown as OpenAlexWork;
}

function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "vf",
    resolved,
    works: [
      work("W1", 2025, true),
      work("W2", 2024, false),
      work("W3", 2019, true),
      work("W4", 2014, false),
    ],
    now: "2026-06-02T00:00:00.000Z",
  });
}

function pubCount(cv: CanonicalCv): number {
  return cv.sections.find((s) => s.type === "publications")?.items.length ?? 0;
}

describe("parseViewFilters", () => {
  it("parses valid params and ignores invalid ones", () => {
    expect(parseViewFilters(new URLSearchParams("since=2020&oa=1"))).toEqual({
      since: 2020,
      oa: true,
    });
    expect(parseViewFilters(new URLSearchParams("type=article"))).toEqual({ type: "article" });
    expect(parseViewFilters(new URLSearchParams("since=abc&type=$bad&oa=0"))).toEqual({});
    expect(parseViewFilters(new URLSearchParams("since=99"))).toEqual({}); // out of range
  });
});

describe("isFilterActive", () => {
  it("is true only when some dimension is set", () => {
    expect(isFilterActive({})).toBe(false);
    expect(isFilterActive({ since: 2020 })).toBe(true);
    expect(isFilterActive({ oa: true })).toBe(true);
    expect(isFilterActive({ type: "article" })).toBe(true);
  });
});

describe("filterCvForView", () => {
  it("returns the same reference when inactive", () => {
    const cv = makeCv();
    expect(filterCvForView(cv, {})).toBe(cv);
  });

  it("filters by year cutoff", () => {
    const cv = makeCv();
    expect(pubCount(filterCvForView(cv, { since: 2020 }))).toBe(2); // 2025, 2024
  });

  it("filters by open access", () => {
    const cv = makeCv();
    expect(pubCount(filterCvForView(cv, { oa: true }))).toBe(2); // W1, W3
  });

  it("filters by type and combines dimensions", () => {
    const cv = makeCv();
    expect(pubCount(filterCvForView(cv, { type: "article", since: 2020, oa: true }))).toBe(1); // W1
    expect(pubCount(filterCvForView(cv, { type: "book" }))).toBe(0);
  });
});

describe("viewFilterFacets + viewFilterBarHtml", () => {
  it("derives year cutoffs relative to the most recent work + OA presence", () => {
    const facets = viewFilterFacets(makeCv());
    expect(facets.hasOa).toBe(true);
    expect(facets.years).toEqual([2021, 2016]); // 2025-4, 2025-9
  });

  it("renders facet chips with the active one marked", () => {
    const cv = makeCv();
    const bar = viewFilterBarHtml(cv, { since: 2021 }, "en-US");
    expect(bar).toContain('class="cv-filterbar"');
    expect(bar).toContain("Since 2021");
    expect(bar).toContain("Open access");
    // The active "Since 2021" chip is marked current.
    expect(bar).toMatch(/aria-current="true"[^>]*>Since 2021|Since 2021<\/a>/);
    expect(bar).toContain("?since=2021");
  });

  it('is "" when there is nothing meaningful to filter', () => {
    const empty = buildCanonicalCv({
      id: "e",
      resolved,
      works: [],
      now: "2026-06-02T00:00:00.000Z",
    });
    expect(viewFilterBarHtml(empty, {}, "en-US")).toBe("");
  });
});
