import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setSectionPageBreak } from "@/lib/canonical/curate";
import { buildRenderedSections } from "@/lib/render/html";
import { resolveTheme } from "@/lib/render/templates";
import { commonCss, sectionsHtmlRaw } from "@/lib/render/templates/shared";

const cv = buildCanonicalCv({
  id: "pb",
  resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "Basile Chrétien" },
  works: [],
  employments: [{ putCode: "e", organization: "Some University", startYear: 2020 }],
  now: "2026-06-02T00:00:00.000Z",
});
const posId = cv.sections.find((s) => s.type === "positions")!.id;

describe("manual section page break (PDF / print)", () => {
  it("tags a flagged section with cv-break-before; leaves it off otherwise", () => {
    expect(sectionsHtmlRaw(cv, buildRenderedSections(cv))).not.toContain("cv-break-before");
    const flagged = setSectionPageBreak(cv, posId, true);
    expect(sectionsHtmlRaw(flagged, buildRenderedSections(flagged))).toContain(
      'class="cv-section cv-break-before"',
    );
  });

  it("the print stylesheet forces the break — but never on the first section", () => {
    const css = commonCss(resolveTheme(cv.display));
    expect(css).toContain("break-before: page");
    // The first-of-type guard prevents a blank leading page.
    expect(css).toContain("cv-break-before:first-of-type");
  });
});
