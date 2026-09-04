import { describe, expect, it } from "vitest";
import { citationCountsTitle } from "@/lib/render/citationSources";

describe("citationCountsTitle", () => {
  it("returns the base caveat unchanged when no OpenCitations count is available", () => {
    expect(citationCountsTitle("caveat", 10, undefined, "en-US")).toBe("caveat");
  });

  it("appends an OpenAlex/OpenCitations breakdown when both counts are present", () => {
    const title = citationCountsTitle("caveat", 10, 7, "en-US");
    expect(title).toBe("caveat · OpenAlex 10 · OpenCitations 7");
  });

  it("formats both numbers per the given locale", () => {
    const title = citationCountsTitle("caveat", 1234, 5678, "de-DE");
    expect(title).toContain("1.234");
    expect(title).toContain("5.678");
  });

  it("handles a zero OpenCitations count (not treated as missing)", () => {
    const title = citationCountsTitle("caveat", 10, 0, "en-US");
    expect(title).toBe("caveat · OpenAlex 10 · OpenCitations 0");
  });
});
