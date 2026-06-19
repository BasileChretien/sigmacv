import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  addManualEntry,
  addSection,
  setItemIncluded,
  setSectionVisible,
  updateDisplay,
  updateOwner,
} from "@/lib/canonical/curate";
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

  it("wraps inline badges in a separated container so they can't collide with the citation text", () => {
    const html = renderCvHtml(
      updateDisplay(makeCv(), {
        showCitationCounts: true,
        showAuthorRole: true,
        showOpenAccess: true,
      }),
    );
    // The badge group is wrapped, so a bare trailing URL/DOI can't fuse with it…
    expect(html).toContain('class="cv-badges"');
    // …and consecutive badges are reliably separated by an adjacent-sibling margin
    // (regression: the count pill used to butt straight against the OA/role pill).
    expect(html).toMatch(/\.cv-badge \+ \.cv-badge\s*\{[^{}]*margin-left:/);
    // The citation pill carries a field-normalisation caveat (responsible metrics).
    expect(html).toMatch(/cv-badge-cites[^>]*title="[^"]*field-normalised/i);
  });

  it("strips the authorship-note in the ATS template (no orphaned caveat when the table is hidden)", () => {
    const html = renderCvHtml(updateDisplay(makeCv(), { template: "ats" }));
    // .cv-authorship is already hidden in ATS, but the caveat is a SEPARATE class;
    // it must be hidden in the same strip rule or it renders with no table above it.
    expect(html).toMatch(
      /\.cv-photo,[^{}]*\.cv-authorship-note[^{}]*\{[^{}]*display:\s*none\s*!important/,
    );
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

  it("lets long DOIs/URLs break inside bibliography entries (no box overflow)", () => {
    // Regression: on the bordered "panel" public styles (e.g. Cyberpunk) and the
    // narrow sidebar column, a long DOI link (one unbreakable token) spilled past
    // the entry's right edge. The shared bib rule must allow it to wrap.
    const html = renderCvHtml(makeCv());
    expect(html).toContain(
      "text-indent: calc(var(--cv-hang) * -1); line-height: 1.42; overflow-wrap: anywhere;",
    );
  });

  it("renders the sidebar template with the photo in a coloured aside", () => {
    const withPhoto = updateOwner(updateDisplay(makeCv(), { template: "sidebar" }), {
      photo: "data:image/png;base64,iVBORw0KGgo=",
      headline: "Assistant Professor",
    });
    const html = renderCvHtml(withPhoto);
    expect(html).toContain("cv-sidebar-layout");
    expect(html).toContain('<img class="cv-photo"');
    expect(html).toContain("Assistant Professor");
  });

  it("renders the rirekisho form with personal fields + 学歴・職歴 table", () => {
    const base = buildCanonicalCv({
      id: "rk",
      resolved,
      works,
      now: "2026-06-02T00:00:00.000Z",
      employments: [
        {
          putCode: "200",
          organization: "Nagoya University",
          roleTitle: "Assistant Professor",
          startYear: 2024,
        },
      ],
      education: [
        {
          putCode: "400",
          organization: "University of Caen",
          roleTitle: "PharmD",
          startYear: 2008,
          endYear: 2014,
        },
      ],
    });
    const cv = updateOwner(updateDisplay(base, { template: "rirekisho" }), {
      photo: "data:image/png;base64,iVBORw0KGgo=",
      personal: {
        phoneticName: "クレティアン バジル",
        dateOfBirth: "1990-01-01",
        gender: "男性",
        nationality: "フランス",
        address: "名古屋市",
      },
      contact: { email: "b@example.org" },
    });
    const html = renderCvHtml(cv);
    expect(html).toContain('<html lang="ja">');
    expect(html).toContain("履歴書");
    expect(html).toContain("ふりがな");
    expect(html).toContain("クレティアン バジル");
    expect(html).toContain("学歴");
    expect(html).toContain("職歴");
    expect(html).toContain("名古屋市");
    expect(html).toContain('<img class="cv-photo"');
    // Education/positions are in the history table, not duplicated as sections.
    expect(html).toContain("PharmD, University of Caen");
  });

  it("rirekisho fills the 年 column from the entry text for a manual history item without a structured year", () => {
    let cv = addSection(makeCv(), "education");
    cv = addManualEntry(
      cv,
      "education",
      "MSc Public Health, Paris-Saclay (2018–2020)",
      "edu:withyear",
    );
    cv = addManualEntry(cv, "education", "Certificate in Pedagogy", "edu:noyear");
    const html = renderCvHtml(updateDisplay(cv, { template: "rirekisho" }));
    // The first 4-digit year in the free text is surfaced into the 年 column…
    expect(html).toMatch(/<td class="rk-year">2018<\/td><td>[^<]*Paris-Saclay/);
    // …and an entry with no year leaves the 年 column empty (not a broken cell).
    expect(html).toMatch(/<td class="rk-year"><\/td><td>Certificate in Pedagogy/);
  });

  it("renders the ATS template plain: hides badges/charts/photo, black text", () => {
    const cv = updateOwner(
      updateDisplay(makeCv(), { template: "ats", showOpenAccess: true, showCharts: true }),
      { photo: "data:image/png;base64,iVBORw0KGgo=" },
    );
    const html = renderCvHtml(cv);
    // Decoration is stripped via CSS regardless of toggles (photo, charts and
    // badges are hidden with display:none !important — grouped in any order).
    expect(html).toMatch(
      /\.cv-photo,[^{}]*\.cv-charts,[^{}]*\.cv-badge[^{}]*\{[^{}]*display:\s*none\s*!important/,
    );
    // Standard system sans-serif + forced-black text, single column (no two-column markup).
    expect(html).toContain("Arial, Helvetica");
    expect(html).toContain("color: #000");
    expect(html).not.toContain("cv-sidebar-layout");
  });

  it("injects the chosen accent colour into the document CSS", () => {
    const html = renderCvHtml(updateDisplay(makeCv(), { accentColor: "#0f766e" }));
    expect(html).toContain("--cv-accent: #0f766e");
  });

  it("declares the CV light-only so a browser never auto-dark-inverts it", () => {
    // A CV is a light document; without this, force/auto dark-mode inverts the
    // white page (and the preview iframe) to a muddy dark version.
    expect(renderCvHtml(makeCv())).toContain("color-scheme: light");
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
    expect(renderCvHtml(cv)).toContain(
      '<span class="cv-metric-label">h-index</span> <span class="cv-metric-value">9</span>',
    );
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
    expect((await getRenderer("bibtex")).format).toBe("bibtex");
    expect((await getRenderer("csljson")).format).toBe("csljson");
    expect((await getRenderer("jsonresume")).format).toBe("jsonresume");
    expect((await getRenderer("biosketch")).format).toBe("biosketch");
    expect((await getRenderer("erc")).format).toBe("erc");
    expect((await getRenderer("msca")).format).toBe("msca");
    expect((await getRenderer("nsf")).format).toBe("nsf");
    expect((await getRenderer("jsps")).format).toBe("jsps");
  });

  it("throws for an unknown format", async () => {
    await expect(
      // @ts-expect-error — invalid format on purpose
      getRenderer("xml"),
    ).rejects.toThrow(/unknown render format/i);
  });
});
