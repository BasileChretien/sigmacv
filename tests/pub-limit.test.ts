import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemInView } from "@/lib/canonical/curate";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import { prepareSections } from "@/lib/render/prepare";

const hasApa = listAvailableStyles().includes("apa");
const SELF = "https://openalex.org/A5001069481";
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function work(id: string, year: number): OpenAlexWork {
  return {
    id: `https://openalex.org/${id}`,
    title: `Study ${id}`,
    display_name: `Study ${id}`,
    type: "article",
    publication_year: year,
    authorships: [
      { author: { id: SELF, display_name: "Basile Chrétien" }, raw_author_name: "Basile Chrétien" },
    ],
    primary_location: { source: { display_name: "Journal A", type: "journal" } },
  } as unknown as OpenAlexWork;
}

function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "pl",
    resolved,
    works: [work("W1", 2024), work("W2", 2023), work("W3", 2022), work("W4", 2021)],
    now: "2026-06-02T00:00:00.000Z",
  });
}

function pubCount(cv: CanonicalCv): number {
  const prepared = prepareSections(cv, "text");
  return prepared.find((s) => s.section.type === "publications")?.items.length ?? 0;
}

describe.skipIf(!hasApa)("publicationsLimit (Selected publications / top-N)", () => {
  it("caps the publications list to the top N, leaving 0/undefined = all", () => {
    const cv = makeCv();
    const all = pubCount(cv);
    expect(all).toBeGreaterThanOrEqual(3);

    const limited: CanonicalCv = {
      ...cv,
      display: { ...cv.display, publicationsLimit: 2 },
    };
    expect(pubCount(limited)).toBe(2);

    const zero: CanonicalCv = {
      ...cv,
      display: { ...cv.display, publicationsLimit: 0 },
    };
    expect(pubCount(zero)).toBe(all);
  });
});

describe.skipIf(!hasApa)("per-view excludedItems (hide from THIS view)", () => {
  it("drops an excluded item from the rendered section (deny-list)", () => {
    const cv = makeCv();
    const all = pubCount(cv);
    expect(all).toBeGreaterThanOrEqual(3);

    // Hide one specific work from this view (a cosmetic per-view choice).
    const hidden = setItemInView(cv, "publications", "W2", false);
    expect(pubCount(hidden)).toBe(all - 1);

    const prepared = prepareSections(hidden, "text").find(
      (s) => s.section.type === "publications",
    )!;
    expect(prepared.items.some((p) => p.item.id === "W2")).toBe(false);
    expect(prepared.items.some((p) => p.item.id === "W1")).toBe(true);
  });
});
