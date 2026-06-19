import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { renderCvHtml } from "@/lib/render/html";
import { resolveTheme } from "@/lib/render/templates";
import { CanonicalCvSchema, type CanonicalCv } from "@/lib/canonical/schema";
import { A4_WIDTH_PX, LETTER_WIDTH_PX, fitScale, pageWidthPx } from "@/components/CvPreview";

/**
 * `display.pageFormat` chooses the paper for the PDF/print + the WYSIWYG preview
 * width — `a4` (ISO default) or `letter` (US 8.5×11in). The fixed-width `.cv`
 * content column is unchanged; only the paper (and pagination) differs.
 */
function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "page",
    resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "Basile Chrétien" },
    works: [],
    now: "2026-06-02T00:00:00.000Z",
  });
}

describe("page format (display.pageFormat)", () => {
  it("defaults to a4 → @page size: A4", () => {
    expect(makeCv().display.pageFormat).toBe("a4");
    expect(resolveTheme(makeCv().display).pageSize).toBe("A4");
    expect(renderCvHtml(makeCv())).toContain("@page { size: A4; margin: 0; }");
  });

  it("renders @page size: letter when US Letter is chosen", () => {
    const letter = updateDisplay(makeCv(), { pageFormat: "letter" });
    expect(resolveTheme(letter.display).pageSize).toBe("letter");
    expect(renderCvHtml(letter)).toContain("@page { size: letter; margin: 0; }");
  });

  it("validates as part of the canonical schema (default a4)", () => {
    const parsed = CanonicalCvSchema.safeParse(makeCv());
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.display.pageFormat).toBe("a4");
    expect(
      CanonicalCvSchema.safeParse(updateDisplay(makeCv(), { pageFormat: "letter" })).success,
    ).toBe(true);
  });

  it("rejects an unknown pageFormat (enum-validated)", () => {
    const bad = {
      ...makeCv(),
      display: { ...makeCv().display, pageFormat: "tabloid" as unknown as "a4" },
    };
    expect(CanonicalCvSchema.safeParse(bad).success).toBe(false);
  });
});

describe("preview width follows the page format", () => {
  it("maps each format to its CSS-px paper width", () => {
    expect(pageWidthPx("a4")).toBe(A4_WIDTH_PX);
    expect(pageWidthPx("letter")).toBe(LETTER_WIDTH_PX);
    expect(pageWidthPx(undefined)).toBe(A4_WIDTH_PX); // default
    expect(LETTER_WIDTH_PX).toBe(816); // 8.5in * 96
    expect(Math.round(A4_WIDTH_PX)).toBe(794); // 210mm * 96/25.4
  });

  it("fitScale scales against the chosen page width (never magnifying past 1:1)", () => {
    // A pane exactly one Letter-width wide fits Letter at 1:1 but would have to
    // shrink an A4… no — Letter is WIDER than A4, so the same pane shrinks Letter more.
    expect(fitScale(LETTER_WIDTH_PX, LETTER_WIDTH_PX)).toBe(1);
    expect(fitScale(A4_WIDTH_PX, A4_WIDTH_PX)).toBe(1);
    expect(fitScale(LETTER_WIDTH_PX, A4_WIDTH_PX)).toBe(1); // A4 fits in a wider pane
    expect(fitScale(A4_WIDTH_PX / 2, A4_WIDTH_PX)).toBeCloseTo(0.5, 5);
    // Default page width is A4 when omitted.
    expect(fitScale(A4_WIDTH_PX)).toBe(1);
  });
});
