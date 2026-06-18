import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { renderCvHtml } from "@/lib/render/html";
import { resolveTheme } from "@/lib/render/templates";
import type { CanonicalCv } from "@/lib/canonical/schema";

/**
 * `display.fontScale` is the overall type-size control. It scales the body's pt size
 * directly AND emits the document's root `font-size`, so EVERY rem-based size
 * (headings, name, section gaps) grows/shrinks by the same factor — the whole CV in
 * proportion, in both the editor preview and the PDF.
 */
function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "scale",
    resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "Basile Chrétien" },
    works: [],
    now: "2026-06-02T00:00:00.000Z",
  });
}

describe("font-size scale (display.fontScale)", () => {
  it("defaults to 1 → 100% root font-size and the base 11pt body", () => {
    const theme = resolveTheme(makeCv().display);
    expect(theme.fontScale).toBe(1);
    expect(theme.bodyFontPt).toBe(11);
    expect(renderCvHtml(makeCv())).toContain("html { font-size: 100%; }");
  });

  it("scales the root font-size AND the body pt by the same factor", () => {
    const big = resolveTheme(updateDisplay(makeCv(), { fontScale: 1.2 }).display);
    expect(big.fontScale).toBe(1.2);
    expect(big.bodyFontPt).toBe(13.2); // 11 * 1.2
    expect(renderCvHtml(updateDisplay(makeCv(), { fontScale: 1.2 }))).toContain(
      "html { font-size: 120%; }",
    );

    const small = resolveTheme(updateDisplay(makeCv(), { fontScale: 0.85 }).display);
    expect(small.bodyFontPt).toBeCloseTo(9.35, 2); // 11 * 0.85
    expect(renderCvHtml(updateDisplay(makeCv(), { fontScale: 0.85 }))).toContain(
      "html { font-size: 85%; }",
    );
  });

  it("composes with density (compact 10pt base, scaled)", () => {
    const t = resolveTheme(updateDisplay(makeCv(), { density: "compact", fontScale: 1.1 }).display);
    expect(t.bodyFontPt).toBe(11); // 10 * 1.1
  });

  it("clamps a silly value defensively", () => {
    // The schema range-validates, but resolveTheme re-clamps at the render boundary.
    expect(resolveTheme({ ...makeCv().display, fontScale: 5 }).fontScale).toBe(1.25);
    expect(resolveTheme({ ...makeCv().display, fontScale: 0.1 }).fontScale).toBe(0.8);
  });
});
