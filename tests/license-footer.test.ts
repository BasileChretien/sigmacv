import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderCvHtml } from "@/lib/render/html";
import { licenseFooter } from "@/lib/render/templates/shared";
import type { CanonicalCv } from "@/lib/canonical/schema";

function makeCv(cvLicense?: CanonicalCv["display"]["cvLicense"]): CanonicalCv {
  const cv = buildCanonicalCv({
    id: "lf",
    resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "Basile Chrétien" },
    works: [],
    now: "2026-06-02T00:00:00.000Z",
  });
  return cvLicense ? updateDisplay(cv, { cvLicense }) : cv;
}

const hasApa = listAvailableStyles().includes("apa");

describe("licenseFooter", () => {
  it("renders nothing for the 'none' default", () => {
    expect(licenseFooter(makeCv())).toBe("");
  });

  it("renders nothing for 'all-rights-reserved' (no canonical URL)", () => {
    expect(licenseFooter(makeCv("all-rights-reserved"))).toBe("");
  });

  it("renders the license name linked to its SPDX URL when chosen", () => {
    const html = licenseFooter(makeCv("CC-BY-4.0"));
    expect(html).toContain('class="cv-license"');
    expect(html).toContain("CC BY 4.0");
    expect(html).toContain('href="https://spdx.org/licenses/CC-BY-4.0.html"');
    expect(html).toContain('rel="license"');
  });

  it("renders CC0 with its proper-noun name (untranslated)", () => {
    const html = licenseFooter(makeCv("CC0-1.0"));
    expect(html).toContain("CC0 1.0");
  });

  it.skipIf(!hasApa)("appears in the full rendered CV document", () => {
    const html = renderCvHtml(makeCv("CC-BY-SA-4.0"));
    expect(html).toContain('class="cv-license"');
    expect(html).toContain("CC BY-SA 4.0");
  });

  it.skipIf(!hasApa)("is absent from the rendered document by default", () => {
    const html = renderCvHtml(makeCv());
    expect(html).not.toContain('class="cv-license"');
  });
});
