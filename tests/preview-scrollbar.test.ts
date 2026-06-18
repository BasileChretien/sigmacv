import { describe, expect, it } from "vitest";
import { hideIframeScrollbar } from "@/components/CvPreview";

/**
 * The preview iframe is exactly A4 wide and scrolls its content internally. On a
 * platform with classic (space-reserving) scrollbars — e.g. Windows — that
 * scrollbar would steal ~15px and lay the text out NARROWER than the scrollbar-free
 * PDF, so the preview wrapped fewer words per line than the export. The injected
 * style hides the scrollbar (reclaiming the width) without disabling scrolling.
 */
describe("hideIframeScrollbar", () => {
  it("injects the scrollbar-hiding style just before </head>", () => {
    const doc = "<!doctype html><html><head><title>cv</title></head><body>x</body></html>";
    const out = hideIframeScrollbar(doc);
    expect(out).toContain("scrollbar-width:none");
    expect(out).toContain("::-webkit-scrollbar");
    // Inserted inside <head> (before the closing tag), so it applies to the document.
    expect(out.indexOf("scrollbar-width:none")).toBeLessThan(out.indexOf("</head>"));
    // The original document is otherwise untouched.
    expect(out).toContain("<title>cv</title>");
    expect(out).toContain("<body>x</body>");
  });

  it("is a no-op for a fragment with no </head>", () => {
    const frag = "<div>no head here</div>";
    expect(hideIframeScrollbar(frag)).toBe(frag);
  });
});
