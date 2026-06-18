import { describe, expect, it } from "vitest";
import {
  CanonicalCvSchema,
  type CanonicalCv,
  type CvItem,
  type CvSectionType,
} from "@/lib/canonical/schema";
import { narrativeEvidence } from "@/lib/canonical/narrativeEvidence";

function item(id: string, over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id, type: "article-journal" },
    meta: {},
    ...over,
  } as CvItem;
}

function section(type: CvSectionType, items: CvItem[], visible = true) {
  return { id: type, type, title: type, visible, order: 0, items };
}

function cv(sections: ReturnType<typeof section>[]): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "ev",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Basile Chrétien" },
    display: {},
    sections,
    provenance: { generatedAt: "2026-06-19T00:00:00.000Z", sources: ["openalex"] },
  });
}

describe("narrativeEvidence", () => {
  it("counts the visible knowledge outputs, in priority order, omitting empty + irrelevant types", () => {
    const c = cv([
      section("publications", [item("p1"), item("p2"), item("ph", { included: false })]),
      section("datasets", [item("d1")]),
      section("preprints", []), // empty → omitted
      section("supervision", [item("s1")]), // irrelevant to "knowledge" → omitted
    ]);
    expect(narrativeEvidence(c, "narrative-knowledge")).toEqual([
      { type: "publications", count: 2 }, // hidden item not counted
      { type: "datasets", count: 1 },
    ]);
  });

  it("maps each module to its own evidence sections", () => {
    const c = cv([
      section("supervision", [item("s1"), item("s2")]),
      section("teaching", [item("t1")]),
      section("peer-review", [item("r1")]),
      section("editorial", [item("e1")]),
      section("patents", [item("pt1")]),
      section("clinical-trials", [item("ct1")]),
    ]);
    expect(narrativeEvidence(c, "narrative-individuals")).toEqual([
      { type: "supervision", count: 2 },
      { type: "teaching", count: 1 },
    ]);
    expect(narrativeEvidence(c, "narrative-community")).toEqual([
      { type: "peer-review", count: 1 },
      { type: "editorial", count: 1 },
    ]);
    expect(narrativeEvidence(c, "narrative-society")).toEqual([
      { type: "patents", count: 1 },
      { type: "clinical-trials", count: 1 },
    ]);
  });

  it("ignores hidden sections and returns [] for non-narrative types", () => {
    const c = cv([section("patents", [item("pt1")], false)]); // whole section hidden
    expect(narrativeEvidence(c, "narrative-society")).toEqual([]);
    expect(narrativeEvidence(c, "statement")).toEqual([]);
    expect(narrativeEvidence(c, "publications")).toEqual([]);
  });
});
