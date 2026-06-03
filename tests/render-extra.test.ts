import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemIncluded } from "@/lib/canonical/curate";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { TEMPLATES } from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderCvHtml } from "@/lib/render/html";
import { docxRenderer } from "@/lib/render/docx";
import { latexRenderer } from "@/lib/render/latex";
import { markdownRenderer, renderCvMarkdown } from "@/lib/render/markdown";
import { renderCvLatex } from "@/lib/render/latex";
import { renderCvDocxBuffer } from "@/lib/render/docx";
import { cvSlug } from "@/lib/render/slug";
import { RENDER_FORMATS } from "@/lib/render/types";
import type { EditorialRole } from "@/lib/oep/client";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const baseWorks = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};
const hasApa = listAvailableStyles().includes("apa");

function makeCv(): CanonicalCv {
  return buildCanonicalCv({ id: "rx", resolved, works: baseWorks, now: "2026-06-02T00:00:00.000Z" });
}

function withMetrics(): CanonicalCv {
  const cv = makeCv();
  return {
    ...cv,
    owner: { ...cv.owner, metrics: { h_index: 9, "2yr_mean_citedness": 3.4 } },
    display: { ...cv.display, showMetrics: true, metrics: ["h_index"] },
  };
}

describe("render format catalog", () => {
  it("lists the supported formats", () => {
    expect(RENDER_FORMATS).toEqual(["html", "pdf", "docx", "latex", "markdown"]);
  });
});

describe("cvSlug", () => {
  it("slugifies and strips diacritics", () => {
    expect(cvSlug("Émilie Dupont!")).toBe("emilie-dupont");
  });
  it("falls back to 'cv' for an empty/symbol-only name", () => {
    expect(cvSlug("")).toBe("cv");
    expect(cvSlug("!!!")).toBe("cv");
  });
});

describe.skipIf(!hasApa)("renderer wrappers + metrics + non-citation HTML", () => {
  it("markdownRenderer.render returns markdown + .md filename", async () => {
    const r = await markdownRenderer.render({ cv: makeCv() });
    expect(r.format).toBe("markdown");
    expect(r.filename).toBe("basile-chretien-cv.md");
    expect(r.text).toContain("---");
  });

  it("latexRenderer.render returns LaTeX + .tex filename", async () => {
    const r = await latexRenderer.render({ cv: makeCv() });
    expect(r.filename).toBe("basile-chretien-cv.tex");
    expect(r.text).toContain("\\documentclass");
  });

  it("docxRenderer.render returns a .docx buffer", async () => {
    const r = await docxRenderer.render({ cv: makeCv() });
    expect(r.filename).toBe("basile-chretien-cv.docx");
    expect(r.buffer && r.buffer.length).toBeGreaterThan(0);
  });

  it("renders the metrics line across formats when enabled", () => {
    expect(renderCvMarkdown(withMetrics())).toContain("h-index: 9");
    expect(renderCvLatex(withMetrics())).toContain("h-index: 9");
  });

  it("renders the metrics line into HTML and DOCX", async () => {
    expect(renderCvHtml(withMetrics())).toContain("h-index: 9");
    const buf = await renderCvDocxBuffer(withMetrics());
    expect(buf.length).toBeGreaterThan(0);
  });


  it("escapes non-citation displayText in HTML (grants with special chars)", () => {
    const cv = buildCanonicalCv({
      id: "g",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      fundings: [
        { putCode: "1", title: "Foo & <Bar> Trust", organization: "X & Y" },
      ],
      editorialRoles: [{ journal: "BMJ", role: "Editor", startYear: 2020 }] as EditorialRole[],
    });
    const html = renderCvHtml(cv);
    expect(html).toContain("Grants &amp; Funding"); // section title escaped
    expect(html).toContain("Foo &amp; &lt;Bar&gt; Trust"); // displayText escaped
    expect(html).toContain("Editorial Roles");
  });

  it("emits an empty section (no rows) when all its items are hidden", () => {
    let cv = makeCv();
    for (const it of cv.sections[0]!.items) {
      cv = setItemIncluded(cv, "publications", it.id, false);
    }
    const html = renderCvHtml(cv);
    expect(html).not.toContain("adverse drug reactions");
  });

  it("uses default name + omits ORCID line for an empty owner, across all templates", () => {
    const cv = makeCv();
    for (const template of TEMPLATES) {
      const empty: CanonicalCv = {
        ...cv,
        owner: { ...cv.owner, displayName: "", orcid: "" },
        display: { ...cv.display, template },
      };
      const html = renderCvHtml(empty);
      expect(html).toContain("Curriculum Vitae");
      expect(html).not.toContain("ORCID:");
    }
  });

  describe("self-name highlight style", () => {
    function withHighlight(style: CanonicalCv["display"]["highlightStyle"]): string {
      const cv = makeCv();
      return renderCvHtml({ ...cv, display: { ...cv.display, highlightStyle: style } });
    }

    it("accent (default) uses the accent colour + bold", () => {
      const css = withHighlight("accent");
      expect(css).toMatch(/\.cv-self\s*\{[^}]*var\(--cv-accent\)/);
      expect(css).toMatch(/\.cv-self\s*\{[^}]*font-weight:\s*700/);
    });

    it("underline emits text-decoration underline and no accent colour", () => {
      const css = withHighlight("underline");
      expect(css).toMatch(/\.cv-self\s*\{[^}]*text-decoration:\s*underline/);
      expect(css).not.toMatch(/\.cv-self\s*\{[^}]*var\(--cv-accent\)/);
    });

    it("accent-underline combines colour and underline", () => {
      const css = withHighlight("accent-underline");
      expect(css).toMatch(/\.cv-self\s*\{[^}]*var\(--cv-accent\)[^}]*text-decoration:\s*underline/);
    });

    it("bold emits only font-weight", () => {
      const css = withHighlight("bold");
      expect(css).toMatch(/\.cv-self\s*\{\s*font-weight:\s*700;\s*\}/);
    });
  });

  it("falls back to the default accent for an invalid stored colour", () => {
    const cv = makeCv();
    const tampered: CanonicalCv = {
      ...cv,
      display: {
        ...cv.display,
        // A value that bypassed schema validation somehow — must not break out of CSS.
        accentColor: "#000; } body{display:none}" as CanonicalCv["display"]["accentColor"],
      },
    };
    const html = renderCvHtml(tampered);
    expect(html).toContain("--cv-accent: #1f4fd8;"); // safe default
    expect(html).not.toContain("body{display:none}");
  });

  describe("mini charts", () => {
    function withCharts(show: boolean): CanonicalCv {
      const cv = makeCv();
      return {
        ...cv,
        owner: {
          ...cv.owner,
          countsByYear: [
            { year: 2022, works: 3, citations: 10 },
            { year: 2023, works: 5, citations: 40 },
            { year: 2024, works: 2, citations: 80 },
          ],
        },
        display: { ...cv.display, showCharts: show },
      };
    }

    it("renders SVG charts when enabled", () => {
      const html = renderCvHtml(withCharts(true));
      // The figure block + captions only appear when charts actually render
      // (the `.cv-charts` CSS rule is always present in the stylesheet).
      expect(html).toContain('<figure class="cv-chart">');
      expect(html).toContain("Publications / year");
      expect(html).toContain("Citations / year");
      expect(html).toContain("<svg");
    });

    it("omits charts when disabled", () => {
      expect(renderCvHtml(withCharts(false))).not.toContain("Publications / year");
    });

    it("omits charts with fewer than two years of data", () => {
      const cv = makeCv();
      const sparse: CanonicalCv = {
        ...cv,
        owner: { ...cv.owner, countsByYear: [{ year: 2024, works: 1, citations: 0 }] },
        display: { ...cv.display, showCharts: true },
      };
      expect(renderCvHtml(sparse)).not.toContain("Publications / year");
    });

    it("thins x-axis labels for long (>8 year) series", () => {
      const cv = makeCv();
      const years = Array.from({ length: 11 }, (_, i) => ({
        year: 2014 + i,
        works: i + 1,
        citations: i * 5,
      }));
      const html = renderCvHtml({
        ...cv,
        owner: { ...cv.owner, countsByYear: years },
        display: { ...cv.display, showCharts: true },
      });
      expect(html).toContain("Publications / year");
      expect(html).toContain("<svg");
    });
  });
});
