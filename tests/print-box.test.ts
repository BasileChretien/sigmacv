import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { renderCvHtml } from "@/lib/render/html";
import type { CanonicalCv } from "@/lib/canonical/schema";

/**
 * The PDF prints the same HTML the editor preview shows. For a true WYSIWYG match
 * the print box must EQUAL the on-screen `.cv` box — same max-width, same padding —
 * and the page itself adds no margin (full bleed; each template supplies its own
 * gutter via its box). This guards against the historical regressions that pulled
 * the PDF away from the preview: the `.cv { padding: 0; max-width: none }`
 * full-width reset, and the interim page margin that reopened a white strip above
 * the full-bleed Sidebar panel.
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

  it("uses a zero page margin (full bleed; gutter comes from the .cv box)", () => {
    expect(html).toContain("@page { size: A4; margin: 0; }");
    // Any non-zero page margin would push full-bleed templates off the page edge —
    // the white strip above the Sidebar panel that this whole change removed.
    expect(html).not.toContain("margin: 16mm");
  });

  it("never resets the .cv box in print — it keeps the screen padding + width", () => {
    // The pre-#217 reset that stripped the column width + side padding (widened the
    // PDF column past the preview).
    expect(html).not.toContain(".cv { padding: 0; max-width: none; }");
    // The interim reset that zeroed .cv top/bottom padding (paired with a page
    // margin). With a zero page margin, .cv keeps its own padding instead, so the
    // on-screen and printed boxes are byte-for-byte the same.
    expect(html).not.toContain(".cv { padding-top: 0; padding-bottom: 0; }");
  });
});
