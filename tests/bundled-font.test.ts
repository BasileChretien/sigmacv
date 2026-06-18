import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { renderCvHtml } from "@/lib/render/html";
import { SOURCE_SERIF_4_FACE_CSS } from "@/lib/render/fonts/sourceSerif4";
import type { CanonicalCv } from "@/lib/canonical/schema";

/**
 * The CV body font (Source Serif 4) is EMBEDDED as an `@font-face` data URI so the
 * editor preview (visitor's browser), the server-rendered PDF (headless Chromium
 * on Linux) and every visitor's view render the IDENTICAL typeface — instead of
 * each device resolving the bare `serif` stack to a different installed font (which
 * made the preview and the PDF look different). It's emitted ONLY for the serif
 * pairing, so a sans/palatino CV doesn't carry the ~134 KB of font data.
 */
function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "font",
    resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "Basile Chrétien" },
    works: [],
    now: "2026-06-02T00:00:00.000Z",
  });
}

describe("bundled CV body font", () => {
  it("embeds Source Serif 4 and leads the family with it for the serif pairing", () => {
    const html = renderCvHtml(updateDisplay(makeCv(), { fontPairing: "serif" }));
    expect(html).toContain("@font-face");
    expect(html).toContain("data:font/woff2;base64,");
    expect(html).toContain(SOURCE_SERIF_4_FACE_CSS);
    // The bundled face leads the stack so it wins over any installed serif.
    expect(html).toContain('font-family: "Source Serif 4",');
  });

  it("allows data: fonts in the CSP (otherwise the embedded font is blocked)", () => {
    expect(renderCvHtml(makeCv())).toContain("font-src data:");
  });

  it("does NOT embed the font for the sans pairing (no wasted ~134 KB)", () => {
    const html = renderCvHtml(updateDisplay(makeCv(), { fontPairing: "sans" }));
    expect(html).not.toContain("@font-face");
    expect(html).not.toContain("Source Serif 4");
    expect(html).toContain("font-family: Inter,");
  });

  it("ships a non-trivial embedded latin upright + italic face", () => {
    // Two @font-face blocks (normal + italic), variable weight axis, woff2 data URIs.
    expect(SOURCE_SERIF_4_FACE_CSS).toContain("font-style:normal");
    expect(SOURCE_SERIF_4_FACE_CSS).toContain("font-style:italic");
    expect(SOURCE_SERIF_4_FACE_CSS).toContain("font-weight:200 900");
    expect(SOURCE_SERIF_4_FACE_CSS.length).toBeGreaterThan(50_000);
  });
});
