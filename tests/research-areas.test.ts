import { describe, expect, it } from "vitest";
import { buildCanonicalCv, computeResearchAreas } from "@/lib/canonical/build";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import { renderCvHtml } from "@/lib/render/html";

const hasApa = listAvailableStyles().includes("apa");
const SELF = "https://openalex.org/A5001069481";
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function work(id: string, year: number, field?: string): OpenAlexWork {
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
    primary_topic: field
      ? { field: { display_name: field }, domain: { display_name: "Health Sciences" } }
      : undefined,
  } as unknown as OpenAlexWork;
}

function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "ra",
    resolved,
    works: [
      work("W1", 2024, "Oncology"),
      work("W2", 2023, "Oncology"),
      work("W3", 2022, "Pharmacology"),
      work("W4", 2021, undefined), // unclassified — contributes nothing
    ],
    now: "2026-06-02T00:00:00.000Z",
  });
}

describe("computeResearchAreas (build aggregate)", () => {
  it("counts the most frequent fields, descending, skipping unclassified works", () => {
    const cv = makeCv();
    expect(cv.owner.researchAreas).toEqual([
      { field: "Oncology", count: 2 },
      { field: "Pharmacology", count: 1 },
    ]);
  });

  it("excludes hidden / not-mine works (a same-name over-merge can't pollute it)", () => {
    const cv = makeCv();
    const sections = cv.sections.map((s) =>
      s.type === "publications"
        ? { ...s, items: s.items.map((i) => (i.id === "W2" ? { ...i, notMine: true } : i)) }
        : s,
    );
    expect(computeResearchAreas(sections)).toEqual([
      { field: "Oncology", count: 1 },
      { field: "Pharmacology", count: 1 },
    ]);
  });

  it("is undefined when no work carries a topic", () => {
    const cv = buildCanonicalCv({
      id: "ra2",
      resolved,
      works: [work("W1", 2024, undefined)],
      now: "2026-06-02T00:00:00.000Z",
    });
    expect(cv.owner.researchAreas).toBeUndefined();
  });
});

describe.skipIf(!hasApa)("research areas render (opt-in)", () => {
  it("shows the chip row only when display.showResearchAreas is on", () => {
    const cv = makeCv();
    // The class selector lives in commonCss; assert on the rendered markup instead.
    expect(renderCvHtml(cv)).not.toContain('class="cv-areas"');

    const on: CanonicalCv = { ...cv, display: { ...cv.display, showResearchAreas: true } };
    const html = renderCvHtml(on);
    expect(html).toContain('class="cv-areas"');
    expect(html).toContain("Oncology");
    expect(html).toContain("Pharmacology");
  });
});
