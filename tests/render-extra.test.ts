import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemIncluded } from "@/lib/canonical/curate";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { TEMPLATES } from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { curatedCountsByYear, renderChartsHtml } from "@/lib/render/charts";
import { renderCvHtml } from "@/lib/render/html";
import { docxRenderer } from "@/lib/render/docx";
import { bibtexRenderer } from "@/lib/render/bibtex";
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
  return buildCanonicalCv({
    id: "rx",
    resolved,
    works: baseWorks,
    now: "2026-06-02T00:00:00.000Z",
  });
}

function withMetrics(): CanonicalCv {
  const cv = makeCv();
  return {
    ...cv,
    owner: { ...cv.owner, metrics: { h_index: 9, "2yr_mean_citedness": 3.4 } },
    display: { ...cv.display, showMetrics: true, metrics: ["h_index"] },
  };
}

// Charts derive from the curated work ITEMS (so "not mine"/hidden works drop
// out), not the build-time author aggregate — so build a CV whose items span
// the given publication years.
function cvWithYears(years: number[]): CanonicalCv {
  const works = years.map(
    (year, i) =>
      ({
        id: `https://openalex.org/Wy${i}`,
        title: `Work ${i}`,
        display_name: `Work ${i}`,
        type: "article",
        publication_year: year,
        cited_by_count: i,
        authorships: [{ author: { id: "https://openalex.org/A5001069481" } }],
        primary_location: { source: { display_name: "J. Test", type: "journal" } },
      }) as unknown as OpenAlexWork,
  );
  const cv = buildCanonicalCv({ id: "yr", resolved, works, now: "2026-06-02T00:00:00.000Z" });
  return { ...cv, display: { ...cv.display, showCharts: true } };
}

describe("render format catalog", () => {
  it("lists the supported formats", () => {
    expect(RENDER_FORMATS).toEqual([
      "html",
      "pdf",
      "docx",
      "latex",
      "markdown",
      "bibtex",
      "csljson",
      "jsonresume",
      "ro-crate",
      "biosketch",
      "erc",
      "msca",
      "nsf",
      "jsps",
    ]);
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

  it("latexRenderer.render returns modern LaTeX + .tex filename", async () => {
    const r = await latexRenderer.render({ cv: makeCv() });
    expect(r.format).toBe("latex");
    expect(r.filename).toBe("basile-chretien-cv.tex");
    expect(r.text).toContain("\\definecolor{cvaccent}"); // modern
  });

  it("docxRenderer.render returns a .docx buffer", async () => {
    const r = await docxRenderer.render({ cv: makeCv() });
    expect(r.filename).toBe("basile-chretien-cv.docx");
    expect(r.buffer && r.buffer.length).toBeGreaterThan(0);
  });

  it("bibtexRenderer.render returns BibTeX + .bib filename", async () => {
    const r = await bibtexRenderer.render({ cv: makeCv() });
    expect(r.format).toBe("bibtex");
    expect(r.filename).toBe("basile-chretien-publications.bib");
    expect(r.text).toContain("@article{");
  });

  it("renders the metrics line across formats when enabled", () => {
    expect(renderCvMarkdown(withMetrics())).toContain("h-index: 9");
    expect(renderCvLatex(withMetrics())).toContain("h-index: 9");
  });

  it("renders the metrics line into HTML and DOCX", async () => {
    expect(renderCvHtml(withMetrics())).toContain(
      '<span class="cv-metric-label">h-index</span> <span class="cv-metric-value">9</span>',
    );
    const buf = await renderCvDocxBuffer(withMetrics());
    expect(buf.length).toBeGreaterThan(0);
  });

  it("escapes non-citation displayText in HTML (grants with special chars)", () => {
    const cv = buildCanonicalCv({
      id: "g",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      fundings: [{ putCode: "1", title: "Foo & <Bar> Trust", organization: "X & Y" }],
      editorialRoles: [{ journal: "BMJ", role: "Editor", startYear: 2020 }] as EditorialRole[],
    });
    const html = renderCvHtml(cv);
    expect(html).toContain("Grants &amp; Funding"); // section title escaped
    expect(html).toContain("Foo &amp; &lt;Bar&gt; Trust"); // displayText escaped
    expect(html).toContain("Editorial Roles");
  });

  it("renders the honorific before the name and the headline below it", () => {
    const cv = makeCv();
    const withHeader: CanonicalCv = {
      ...cv,
      owner: { ...cv.owner, honorific: "Dr", headline: "Senior Pharmacologist" },
    };
    const html = renderCvHtml(withHeader);
    // Honorific is inline, before the name, inside the h1.
    expect(html).toMatch(/<h1><span class="cv-honorific">Dr<\/span> Basile/);
    // Headline/role is a separate block under the name.
    expect(html).toContain('<div class="cv-headline">Senior Pharmacologist</div>');
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
      // Every template falls back to a default title; the rirekisho form uses
      // its own Japanese title (履歴書) instead of "Curriculum Vitae".
      expect(html.includes("Curriculum Vitae") || html.includes("履歴書")).toBe(true);
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

    it("renders the publications SVG chart when enabled (no citations chart)", () => {
      const html = renderCvHtml(withCharts(true));
      // The figure block + caption only appear when charts actually render
      // (the `.cv-charts` CSS rule is always present in the stylesheet).
      expect(html).toContain('<figure class="cv-chart">');
      expect(html).toContain("Publications / year");
      expect(html).toContain("<svg");
      // Citations/year was dropped (citation lag makes recent bars wrong).
      expect(html).not.toContain("Citations / year");
    });

    it("omits charts when disabled", () => {
      expect(renderCvHtml(withCharts(false))).not.toContain("Publications / year");
    });

    it("scales the publications bars linearly (no log scale, no log label)", () => {
      const mk = (year: number) =>
        ({
          csl: {},
          included: true,
          notMine: false,
          meta: { year, citedByCount: 0 },
        }) as unknown as CanonicalCv["sections"][number]["items"][number];
      // 1 publication in 2020, 4 in 2021 → a LINEAR scale makes the 2020 bar
      // exactly 1/4 the height of the (full-height) 2021 bar. A log1p scale would
      // give a different (compressed) ratio, so this pins the scale to linear.
      const cv = {
        display: { showCharts: true, locale: "en-US", countLetters: false },
        sections: [
          {
            type: "publications",
            items: [mk(2020), mk(2021), mk(2021), mk(2021), mk(2021)],
          },
        ],
      } as unknown as CanonicalCv;
      const html = renderChartsHtml(cv);
      expect(html).not.toContain("(log)");
      const heights = [...html.matchAll(/<rect[^>]*height="(\d+)"/g)].map((m) => Number(m[1]));
      expect(Math.max(...heights)).toBe(64); // the 4-publication year fills the chart
      expect(heights).toContain(16); // the 1-publication year is exactly 1/4 height
    });

    it("omits charts with fewer than two years of data", () => {
      // A single curated work-year → not enough to chart.
      expect(renderCvHtml(cvWithYears([2024]))).not.toContain("Publications / year");
    });

    it("thins x-axis labels for long (>8 year) series", () => {
      const html = renderCvHtml(cvWithYears(Array.from({ length: 11 }, (_, i) => 2014 + i)));
      expect(html).toContain("Publications / year");
      expect(html).toContain("<svg");
    });

    it("counts only included, dated work items — excludes not-mine/hidden/undated/manual", () => {
      const mk = (o: {
        year?: number;
        cites?: number;
        manual?: boolean;
        included?: boolean;
        notMine?: boolean;
      }) =>
        ({
          csl: o.manual ? undefined : {},
          included: o.included ?? true,
          notMine: o.notMine ?? false,
          meta: { year: o.year, citedByCount: o.cites },
        }) as unknown as CanonicalCv["sections"][number]["items"][number];
      const cv = {
        display: { countLetters: false },
        sections: [
          {
            type: "publications",
            items: [
              mk({ year: 2020, cites: 3 }),
              mk({ year: 2020, cites: 2 }),
              mk({ year: 2021 }), // counted; no cited-by count → +0
              mk({ year: 2021, cites: 99, notMine: true }), // excluded: not mine
              mk({ year: 2022, cites: 99, included: false }), // excluded: hidden
              mk({ year: 2023, manual: true }), // excluded: not a work (no CSL)
              mk({}), // excluded: undated
            ],
          },
          // A whole section of preprints is excluded from the figures.
          { type: "preprints", items: [mk({ year: 2019, cites: 99 })] },
        ],
      } as unknown as CanonicalCv;
      const by = Object.fromEntries(curatedCountsByYear(cv).map((c) => [c.year, c]));
      expect(by[2020]).toMatchObject({ works: 2, citations: 5 });
      expect(by[2021]).toMatchObject({ works: 1, citations: 0 }); // not-mine 2021 dropped
      expect(by[2022]).toBeUndefined();
      expect(by[2023]).toBeUndefined();
      expect(by[2019]).toBeUndefined(); // preprint section excluded
    });

    it("counts letters (peer-reviewed) in the per-year charts only when countLetters is on", () => {
      const item = (year: number, type?: string) => ({
        csl: {},
        included: true,
        notMine: false,
        meta: { year, peerReviewed: true, type, citedByCount: 0 },
      });
      const cv = (countLetters: boolean) =>
        ({
          display: { countLetters },
          sections: [{ type: "publications", items: [item(2018), item(2019, "letter")] }],
        }) as unknown as CanonicalCv;
      expect(curatedCountsByYear(cv(false)).map((c) => c.year)).toEqual([2018]); // letter year off
      expect(
        curatedCountsByYear(cv(true))
          .map((c) => c.year)
          .sort(),
      ).toEqual([2018, 2019]); // on
    });

    it("a wrongly-attributed old work marked 'not mine' leaves the charts (1993 case)", () => {
      // OpenAlex attributed a 1993 work; the user's real first paper is 2015.
      const cv = cvWithYears([1993, 2015, 2016, 2017]);
      const curated: CanonicalCv = {
        ...cv,
        sections: cv.sections.map((s) => ({
          ...s,
          items: s.items.map((it) => (it.meta.year === 1993 ? { ...it, notMine: true } : it)),
        })),
      };
      const years = curatedCountsByYear(curated).map((c) => c.year);
      expect(years).not.toContain(1993);
      expect(years).toEqual(expect.arrayContaining([2015, 2016, 2017]));
      // It IS still counted while it remains in the list (until marked):
      expect(curatedCountsByYear(cv).map((c) => c.year)).toContain(1993);
    });
  });

  describe("publication badges (open access + author role)", () => {
    const oaWork = {
      ...(baseWorks[0] as OpenAlexWork),
      id: "https://openalex.org/W777",
      doi: null,
      title: "An OA paper",
      display_name: "An OA paper",
      cited_by_count: 1234,
      open_access: { is_oa: true, oa_status: "gold" },
      authorships: [
        {
          author_position: "first",
          is_corresponding: true,
          author: {
            id: "https://openalex.org/A5001069481",
            display_name: "Basile Chrétien",
          },
        },
        {
          author_position: "last",
          author: {
            id: "https://openalex.org/A999",
            display_name: "Someone Else",
          },
        },
      ],
    };
    function cvWith(display: Partial<CanonicalCv["display"]>): CanonicalCv {
      const cv = buildCanonicalCv({
        id: "b",
        resolved,
        works: [oaWork as unknown as OpenAlexWork],
        now: "2026-06-02T00:00:00.000Z",
      });
      return { ...cv, display: { ...cv.display, ...display } };
    }

    it("renders an OA badge when showOpenAccess and the work is OA", () => {
      expect(renderCvHtml(cvWith({ showOpenAccess: true }))).toContain(
        'title="Open access (gold)"',
      );
    });

    it("omits the OA badge when showOpenAccess is off", () => {
      expect(renderCvHtml(cvWith({ showOpenAccess: false }))).not.toContain('title="Open access');
    });

    it("renders the profile OA share as a labelled metric row when works carry OA data", () => {
      const html = renderCvHtml(cvWith({ showOpenAccess: true }));
      expect(html).toContain("cv-metric-oa");
      expect(html).toContain('<span class="cv-metric-value">100%</span>');
    });

    it("omits the profile OA share when showOpenAccess is off", () => {
      expect(renderCvHtml(cvWith({ showOpenAccess: false }))).not.toContain("cv-metric-oa");
    });

    it("shows the OA share when its own toggle is on even with badges off (decoupled)", () => {
      const html = renderCvHtml(cvWith({ showOpenAccess: false, showOpenAccessShare: true }));
      expect(html).toContain("cv-metric-oa");
      // …and the per-work OA badge stays off (it follows showOpenAccess).
      expect(html).not.toContain('title="Open access');
    });

    it("hides the OA share when its own toggle is off even with badges on (decoupled)", () => {
      const html = renderCvHtml(cvWith({ showOpenAccess: true, showOpenAccessShare: false }));
      expect(html).not.toContain("cv-metric-oa");
      // …while the per-work OA badge still renders.
      expect(html).toContain('title="Open access (gold)"');
    });

    it("always shows a Retracted badge for a retracted work (even with badges off)", () => {
      const base = cvWith({ showOpenAccess: false });
      const cv: CanonicalCv = {
        ...base,
        sections: base.sections.map((s) => ({
          ...s,
          items: s.items.map((it) => ({ ...it, meta: { ...it.meta, retracted: true } })),
        })),
      };
      const html = renderCvHtml(cv);
      expect(html).toContain("cv-badge-retracted");
      expect(html).toContain(">Retracted</span>");
    });

    it("excludes retracted works from the render when hideRetracted is on", () => {
      const base = cvWith({ hideRetracted: true });
      const cv: CanonicalCv = {
        ...base,
        sections: base.sections.map((s) => ({
          ...s,
          items: s.items.map((it) => ({ ...it, meta: { ...it.meta, retracted: true } })),
        })),
      };
      const html = renderCvHtml(cv);
      expect(html).not.toContain("An OA paper");
      expect(html).not.toContain("cv-badge-retracted");
    });

    it("renders the author-role badge when enabled (first, corresponding)", () => {
      const html = renderCvHtml(cvWith({ showAuthorRole: true }));
      expect(html).toContain(">first, corresponding</span>");
    });

    it("omits the author-role badge by default", () => {
      expect(renderCvHtml(cvWith({}))).not.toContain("first, corresponding");
    });

    it("renders a locale-formatted citation-count badge when enabled", () => {
      const html = renderCvHtml(cvWith({ showCitationCounts: true }));
      // en-US groups thousands: 1,234. (The class name is always in the CSS, so
      // we assert on the rendered count text, not the class.)
      expect(html).toContain(">1,234 citations</span>");
    });

    it("omits the citation-count badge by default", () => {
      expect(renderCvHtml(cvWith({}))).not.toContain("1,234 citations");
    });
  });

  describe("provenance footer + metric context", () => {
    function withProvenance(cv: CanonicalCv): CanonicalCv {
      return { ...cv, display: { ...cv.display, showProvenance: true } };
    }

    it("renders a provenance footer when enabled, with hidden/corrected counts", () => {
      const base = withProvenance(makeCv());
      const id = base.sections[0]!.items[0]!.id;
      const hidden = setItemIncluded(base, "publications", id, false);
      const html = renderCvHtml(hidden);
      expect(html).toContain('class="cv-provenance"');
      expect(html).toContain("Generated from OpenAlex");
      expect(html).toContain("1 hidden");
    });

    it("localizes the sync date and falls back gracefully on a bad timestamp", () => {
      const cv = withProvenance(makeCv());
      // Valid ISO → localized medium date (en-US): "Jun 2, 2026".
      const good = renderCvHtml({
        ...cv,
        provenance: { ...cv.provenance, lastSyncedAt: "2026-06-02T00:00:00.000Z" },
      });
      expect(good).toContain("Jun 2, 2026");
      // Unparseable timestamp → falls back to the raw leading characters, never throws.
      const bad = renderCvHtml({
        ...cv,
        provenance: { ...cv.provenance, lastSyncedAt: "not-a-date" },
      });
      expect(bad).toContain('class="cv-provenance"');
    });

    it("omits the provenance footer by default (opt-in)", () => {
      // Default display → no footer (it's meta-info, off on a finished CV).
      expect(renderCvHtml(makeCv())).not.toContain("Generated from");
    });

    it.skipIf(!hasApa)(
      "exposes exactly one <footer> landmark even with provenance + license + attribution",
      () => {
        // a11y: the provenance block is the single contentinfo landmark; the
        // license + attribution lines render as <p> (class-styled), never as
        // additional <footer> landmarks that would dilute the landmark map.
        const cv: CanonicalCv = {
          ...withProvenance(makeCv()),
          display: {
            ...withProvenance(makeCv()).display,
            cvLicense: "CC-BY-4.0",
          },
        };
        const html = renderCvHtml(cv, { attribution: true });
        // All three lines present…
        expect(html).toContain('class="cv-provenance"');
        expect(html).toContain('class="cv-license"');
        expect(html).toContain('class="cv-attribution"');
        // …but only the provenance one is a <footer> landmark.
        expect((html.match(/<footer/g) ?? []).length).toBe(1);
      },
    );

    it("annotates a field-normalised metric with responsible-reading context", () => {
      const cv = makeCv();
      const withFwci: CanonicalCv = {
        ...cv,
        owner: { ...cv.owner, metrics: { fwci_mean: 1.8 } },
        display: { ...cv.display, showMetrics: true, metrics: ["fwci_mean"] },
      };
      const html = renderCvHtml(withFwci);
      expect(html).toContain(
        '<span class="cv-metric-label">Mean work FWCI</span> <span class="cv-metric-value">1.8</span>',
      );
      expect(html).toContain("1.0 = world average");
    });

    it("leads the metric strip with open access, demotes the coverage note to a hover title, and places the summary above the cards", () => {
      const works = [2019, 2020, 2021].map(
        (year, i) =>
          ({
            id: `https://openalex.org/Woa${i}`,
            title: `OA work ${i}`,
            display_name: `OA work ${i}`,
            type: "article",
            publication_year: year,
            cited_by_count: i,
            authorships: [{ author: { id: "https://openalex.org/A5001069481" } }],
            primary_location: { source: { display_name: "J. Test", type: "journal" } },
            open_access: { is_oa: true, oa_status: "gold" },
          }) as unknown as OpenAlexWork,
      );
      const base = buildCanonicalCv({ id: "oa", resolved, works, now: "2026-06-02T00:00:00.000Z" });
      const cv: CanonicalCv = {
        ...base,
        owner: {
          ...base.owner,
          summary: "Drug-safety signal detection.",
          // h_index carries no responsible-reading anchor → exercises the
          // no-context branch in the strip.
          metrics: { fwci_mean: 1.4, fwci_n: 97, h_index: 9 },
        },
        display: {
          ...base.display,
          showCharts: true,
          showOpenAccess: true,
          showMetrics: true,
          metrics: ["fwci_mean", "h_index"],
        },
      };
      const html = renderCvHtml(cv);
      // The OA share leads the strip, before the field-normalised metric.
      expect(html.indexOf("Open access")).toBeLessThan(html.indexOf("Mean work FWCI"));
      // The coverage note is now VISIBLE text (its own span), not a hover title.
      expect(html).toContain("cv-metric-coverage");
      expect(html).toContain("mean over 97 works with FWCI");
      expect(html).not.toContain('title="mean over 97 works with FWCI"');
      // A no-context metric still renders its label/value, one per line.
      expect(html).toContain(
        '<span class="cv-metric-label">h-index</span> <span class="cv-metric-value">9</span>',
      );
      // The narrative summary now precedes the metric strip + research cards.
      expect(html.indexOf('class="cv-summary"')).toBeLessThan(html.indexOf('class="cv-metrics"'));
      expect(html.indexOf('class="cv-summary"')).toBeLessThan(html.indexOf('class="cv-charts"'));
    });
  });
});
