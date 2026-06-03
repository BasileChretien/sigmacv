import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
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
