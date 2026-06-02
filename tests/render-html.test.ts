import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemIncluded, setSectionVisible, updateDisplay } from "@/lib/canonical/curate";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { getRenderer } from "@/lib/render";
import { htmlRenderer, renderCvHtml } from "@/lib/render/html";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};
const hasApa = listAvailableStyles().includes("apa");
const SECTION = "publications";

function makeCv() {
  return buildCanonicalCv({
    id: "cv_render",
    resolved,
    works,
    now: "2026-06-02T00:00:00.000Z",
  });
}

describe.skipIf(!hasApa)("renderCvHtml (needs vendored CSL assets)", () => {
  it("produces a self-contained HTML document with header + section", () => {
    const html = renderCvHtml(makeCv());
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("Basile Chrétien");
    expect(html).toContain("Publications");
    expect(html).toContain("0000-0002-7483-2489");
  });

  it("highlights the user's name on their own works when enabled", () => {
    const html = renderCvHtml(makeCv());
    expect(html).toContain('<span class="cv-self">');
  });

  it("does NOT highlight a same-name work that the user does not own", () => {
    let cv = makeCv();
    // Keep only the namesake (W4300000003) visible.
    cv = setItemIncluded(cv, SECTION, "W4300000001", false);
    cv = setItemIncluded(cv, SECTION, "W4300000002", false);
    const html = renderCvHtml(cv);
    expect(html).toContain("Chrétien"); // "Jean Chrétien" is rendered…
    expect(html).not.toContain('<span class="cv-self">'); // …but never highlighted
  });

  it("omits highlight spans when highlightSelf is disabled", () => {
    const html = renderCvHtml(updateDisplay(makeCv(), { highlightSelf: false }));
    expect(html).not.toContain('<span class="cv-self">');
  });

  it("excludes 'not mine' items from the output", () => {
    const cv = setItemIncluded(makeCv(), SECTION, "W4300000003", false);
    const html = renderCvHtml(cv);
    expect(html).not.toContain("Unrelated work by a namesake");
    // an included item is still present
    expect(html).toContain("adverse drug reactions");
  });

  it("omits a hidden section entirely", () => {
    const html = renderCvHtml(setSectionVisible(makeCv(), SECTION, false));
    expect(html).not.toContain("adverse drug reactions");
  });

  it("renders the modern template when selected", () => {
    const classic = renderCvHtml(makeCv());
    const modern = renderCvHtml(updateDisplay(makeCv(), { template: "modern" }));
    // Modern uses an accent left-bar on section headings; classic does not.
    expect(modern).toContain("border-left: 3px solid var(--cv-accent)");
    expect(classic).not.toContain("border-left: 3px solid var(--cv-accent)");
  });

  it("renders the compact template with a two-column bibliography", () => {
    const compact = renderCvHtml(updateDisplay(makeCv(), { template: "compact" }));
    expect(compact).toContain("column-count: 2");
    expect(renderCvHtml(makeCv())).not.toContain("column-count: 2");
  });

  it("renders the minimal template (rule-free, lighter weight name)", () => {
    const minimal = renderCvHtml(updateDisplay(makeCv(), { template: "minimal" }));
    expect(minimal).toContain("font-weight: 400");
  });

  it("injects the chosen accent colour into the document CSS", () => {
    const html = renderCvHtml(updateDisplay(makeCv(), { accentColor: "#0f766e" }));
    expect(html).toContain("--cv-accent: #0f766e");
  });

  it("applies compact density (smaller base font)", () => {
    expect(renderCvHtml(updateDisplay(makeCv(), { density: "compact" }))).toContain(
      "font-size: 10pt",
    );
    expect(renderCvHtml(makeCv())).toContain("font-size: 11pt");
  });

  it("shows selected metrics in the header only when enabled", () => {
    const base = makeCv();
    const cv = {
      ...base,
      owner: { ...base.owner, metrics: { h_index: 9 } },
      display: { ...base.display, showMetrics: true, metrics: ["h_index"] },
    };
    expect(renderCvHtml(cv)).toContain("h-index: 9");
    // off by default
    expect(renderCvHtml(base)).not.toContain("h-index");
  });

  it("htmlRenderer returns an html RenderResult with a slugged filename", async () => {
    const result = await htmlRenderer.render({ cv: makeCv() });
    expect(result.format).toBe("html");
    expect(result.mimeType).toContain("text/html");
    expect(result.filename).toBe("basile-chretien-cv.html");
    expect(result.html).toContain("<!DOCTYPE html>");
  });
});

describe("renderer registry", () => {
  it("resolves every implemented renderer", async () => {
    expect((await getRenderer("html")).format).toBe("html");
    expect((await getRenderer("pdf")).format).toBe("pdf");
    expect((await getRenderer("docx")).format).toBe("docx");
    expect((await getRenderer("latex")).format).toBe("latex");
    expect((await getRenderer("markdown")).format).toBe("markdown");
  });

  it("throws for an unknown format", async () => {
    await expect(
      // @ts-expect-error — invalid format on purpose
      getRenderer("xml"),
    ).rejects.toThrow(/unknown render format/i);
  });
});
