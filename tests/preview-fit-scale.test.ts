import { describe, expect, it } from "vitest";
import { A4_WIDTH_PX, fitScale } from "@/components/CvPreview";

/**
 * The editor preview renders the CV at a fixed A4 width and scales it to fit the
 * pane, so the preview wraps/lays out exactly like the exported PDF (which prints
 * at A4) regardless of the pane width. `fitScale` is that scale factor.
 */
describe("CvPreview fitScale", () => {
  it("uses A4 width = 210mm at 96 px/in (the PDF print width)", () => {
    expect(A4_WIDTH_PX).toBeCloseTo(793.7, 1);
  });

  it("never magnifies past 1:1 when the pane is at least A4 wide", () => {
    expect(fitScale(A4_WIDTH_PX)).toBe(1);
    expect(fitScale(A4_WIDTH_PX + 200)).toBe(1);
    expect(fitScale(2000)).toBe(1);
  });

  it("scales down proportionally when the pane is narrower than A4", () => {
    expect(fitScale(A4_WIDTH_PX / 2)).toBeCloseTo(0.5, 5);
    expect(fitScale(A4_WIDTH_PX * 0.75)).toBeCloseTo(0.75, 5);
  });

  it("falls back to 1 for a zero/negative/NaN width (pane not laid out yet)", () => {
    expect(fitScale(0)).toBe(1);
    expect(fitScale(-100)).toBe(1);
    expect(fitScale(Number.NaN)).toBe(1);
  });
});
