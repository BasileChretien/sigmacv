import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { renderCvHtml } from "@/lib/render/html";
import type { CanonicalCv } from "@/lib/canonical/schema";

/**
 * The PDF prints the same HTML the editor preview shows. For a true WYSIWYG match
 * the printed `.cv` text column must equal the on-screen one, so the print box
 * KEEPS the screen `.cv` (max-width + side padding) and the horizontal page margin
 * is 0 — only the VERTICAL page margin lives in `@page` (it must repeat per page).
 * This guards against a regression back to the old `.cv { padding: 0; max-width:
 * none }` print reset, which widened the PDF column past the preview.
 */
function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "printbox",
    resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "Basile Chrétien" },
    works: [],
    now: "2026-06-02T00:00:00.000Z",
  });
}

describe("print page box (WYSIWYG with the preview)", () => {
  const html = renderCvHtml(makeCv());

  it("gives @page only a vertical margin (horizontal gutter = the .cv box)", () => {
    expect(html).toContain("@page { size: A4; margin: 16mm 0; }");
    // The old full-margin page box would re-introduce a horizontal gutter on top
    // of the .cv padding (double gutter / narrower column than the preview).
    expect(html).not.toContain("margin: 16mm 15mm");
  });

  it("keeps the screen .cv box in print, only dropping its top/bottom padding", () => {
    expect(html).toContain(".cv { padding-top: 0; padding-bottom: 0; }");
    // The old print reset stripped the column width + side padding — the regression.
    expect(html).not.toContain(".cv { padding: 0; max-width: none; }");
  });
});
