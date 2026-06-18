import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { renderCvHtml } from "@/lib/render/html";
import { bundledFaceCss } from "@/lib/render/bundledFonts";
import { FACE_CSS as sourceSerif4 } from "@/lib/render/fonts/sourceSerif4";
import { FACE_CSS as inter } from "@/lib/render/fonts/inter";
import { FACE_CSS as ebGaramond } from "@/lib/render/fonts/ebGaramond";
import type { CanonicalCv } from "@/lib/canonical/schema";

/**
 * Each selectable CV font (design panel → fontPairing) is EMBEDDED as an
 * `@font-face` data URI so the editor preview (visitor's browser), the
 * server-rendered PDF (headless Chromium on Linux) and every visitor's view render
 * the IDENTICAL typeface — instead of each device resolving a bare font stack to a
 * different installed font (which made the preview and the PDF look different). Only
 * the CHOSEN font is embedded per render (each is ~110–135 KB).
 */
function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "font",
    resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "Basile Chrétien" },
    works: [],
    now: "2026-06-02T00:00:00.000Z",
  });
}

const CASES = [
  { pairing: "serif", family: "Source Serif 4", faceCss: sourceSerif4 },
  { pairing: "sans", family: "Inter", faceCss: inter },
  { pairing: "palatino", family: "EB Garamond", faceCss: ebGaramond },
] as const;

describe("bundled CV body fonts (selectable in the design panel)", () => {
  for (const c of CASES) {
    it(`embeds ${c.family} and leads the family with it for the "${c.pairing}" pairing`, () => {
      const html = renderCvHtml(updateDisplay(makeCv(), { fontPairing: c.pairing }));
      expect(html).toContain("@font-face");
      expect(html).toContain("data:font/woff2;base64,");
      expect(html).toContain(c.faceCss);
      // The bundled face leads the stack so it wins over any installed font.
      expect(html).toContain(`font-family: "${c.family}",`);
    });
  }

  it("embeds ONLY the chosen font, never the others", () => {
    const html = renderCvHtml(updateDisplay(makeCv(), { fontPairing: "serif" }));
    expect(html).toContain(sourceSerif4);
    expect(html).not.toContain(inter);
    expect(html).not.toContain(ebGaramond);
  });

  it("allows data: fonts in the CSP (otherwise the embedded font is blocked)", () => {
    expect(renderCvHtml(makeCv())).toContain("font-src data:");
  });

  it("emits the matching face for a bundled stack, and nothing for an unbundled one", () => {
    expect(bundledFaceCss('"EB Garamond", Georgia, serif')).toBe(ebGaramond);
    // A stack that leads with no bundled font carries no embedded @font-face.
    expect(bundledFaceCss("Comic Sans MS, cursive")).toBe("");
  });

  it("each face is a non-trivial latin upright + italic variable woff2", () => {
    for (const css of [sourceSerif4, inter, ebGaramond]) {
      expect(css).toContain("font-style:normal");
      expect(css).toContain("font-style:italic");
      expect(css).toContain("font-weight:200 900");
      expect(css.length).toBeGreaterThan(50_000);
    }
  });
});
