import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { TEMPLATES } from "@/lib/canonical/schema";
import { sampleForPreview, templateGalleryPreviews } from "@/lib/render/galleryPreview";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};
const cv = buildCanonicalCv({
  id: "cv_prev",
  resolved,
  works,
  now: "2026-06-02T00:00:00.000Z",
});

describe("sampleForPreview", () => {
  it("caps sections + items and drops the provenance footer (immutably)", () => {
    const before = cv.sections.length;
    const sample = sampleForPreview(cv);
    expect(sample.sections.length).toBeLessThanOrEqual(4);
    for (const s of sample.sections) expect(s.items.length).toBeLessThanOrEqual(2);
    expect(sample.display.showProvenance).toBe(false);
    expect(sample.display.publicationsLimit).toBe(0);
    // input untouched
    expect(cv.sections.length).toBe(before);
  });
});

describe("templateGalleryPreviews", () => {
  it("renders a real HTML thumbnail for every template", () => {
    const previews = templateGalleryPreviews(cv);
    expect(previews.map((p) => p.template)).toEqual([...TEMPLATES]);
    for (const p of previews) {
      expect(p.html).toContain("<html");
      expect(p.html.toLowerCase()).toContain("basile");
    }
  });

  it("varies the markup between templates (not an identical schematic)", () => {
    const previews = templateGalleryPreviews(cv);
    const classic = previews.find((p) => p.template === "classic")!.html;
    const sidebar = previews.find((p) => p.template === "sidebar")!.html;
    expect(classic).not.toBe(sidebar);
  });
});
