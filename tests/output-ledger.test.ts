import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { outputLedgerHtml } from "@/lib/render/templates/shared";
import type { CanonicalCv, CvItem, CvSection, CvSectionType } from "@/lib/canonical/schema";

const resolved = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function base(): CanonicalCv {
  return buildCanonicalCv({ id: "L", resolved, works: [], now: "2026-06-02T00:00:00.000Z" });
}

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

function section(type: CvSectionType, items: CvItem[], visible = true): CvSection {
  return { id: type, type, title: type, visible, order: 0, items } as CvSection;
}

function withSections(cv: CanonicalCv, sections: CvSection[], on = true): CanonicalCv {
  return {
    ...updateDisplay(cv, { showOutputLedger: on, summaryBlockPosition: "header", locale: "en-US" }),
    sections,
  };
}

describe("outputLedgerHtml", () => {
  it("renders nothing when the toggle is off", () => {
    const cv = withSections(base(), [section("publications", [item("a")])], false);
    expect(outputLedgerHtml(cv)).toBe("");
  });

  it("counts visible items per output type, with locale labels, skipping non-output and empty types", () => {
    const cv = withSections(base(), [
      section("publications", [item("p1"), item("p2"), item("h", { included: false })]),
      section("datasets", [item("d1")]),
      section("patents", [item("pt1")]),
      section("preprints", []), // empty → omitted
      section("awards", [item("aw1")]), // not an output type → omitted
    ]);
    const html = outputLedgerHtml(cv);
    expect(html).toContain('class="cv-ledger"');
    expect(html).toContain('aria-label="Research output"');
    // Hidden item not counted → 2, not 3.
    expect(html).toContain('<span class="cv-ledger-n">2</span> Publications');
    expect(html).toContain('<span class="cv-ledger-n">1</span> Datasets &amp; Software');
    expect(html).toContain('<span class="cv-ledger-n">1</span> Patents');
    expect(html).not.toContain("Preprints");
    expect(html).not.toContain("Awards");
  });

  it("ignores 'not mine' items and items in a hidden section", () => {
    const cv = withSections(base(), [
      section("publications", [item("p1"), item("nm", { notMine: true })]),
      section("clinical-trials", [item("ct1")], false), // section hidden → omitted
    ]);
    const html = outputLedgerHtml(cv);
    expect(html).toContain('<span class="cv-ledger-n">1</span> Publications');
    expect(html).not.toContain("Clinical Trials");
  });

  it("renders nothing when every output type resolves to zero visible items", () => {
    const cv = withSections(base(), [
      section("publications", [item("h", { included: false })]),
      section("datasets", []),
    ]);
    expect(outputLedgerHtml(cv)).toBe("");
  });
});
