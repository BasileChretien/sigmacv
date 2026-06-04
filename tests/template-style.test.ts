import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import type { CanonicalCv, TemplateKey } from "@/lib/canonical/schema";
import { renderCvDocxBuffer } from "@/lib/render/docx";
import { renderCvLatex } from "@/lib/render/latex";
import { docStyle } from "@/lib/render/templateStyle";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};
const works = worksFixture as unknown as OpenAlexWork[];
const base = buildCanonicalCv({ id: "ts", resolved, works, now: "2026-06-02T00:00:00.000Z" });
const withTemplate = (t: TemplateKey): CanonicalCv => updateDisplay(base, { template: t });

// 1×1 transparent PNG — a valid owner.photo (the LaTeX export leaves a photo note).
const PNG_1x1 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
const rich = (t: TemplateKey): CanonicalCv => {
  const cv = updateDisplay(base, {
    template: t,
    showCharts: true,
    showAuthorshipTable: true,
    authorshipRoles: ["first", "last", "corresponding"],
  });
  return {
    ...cv,
    owner: {
      ...cv.owner,
      photo: PNG_1x1,
      countsByYear: [
        { year: 2023, works: 5, citations: 40 },
        { year: 2024, works: 7, citations: 80 },
      ],
    },
  };
};

describe("docStyle", () => {
  it("maps each template to a distinct profile", () => {
    expect(docStyle(withTemplate("classic"))).toMatchObject({ centeredHeader: true, accentName: false, plain: false });
    expect(docStyle(withTemplate("modern"))).toMatchObject({ accentName: true, centeredHeader: false });
    expect(docStyle(withTemplate("ats"))).toMatchObject({ plain: true, accentHeadings: false, serif: false });
    expect(docStyle(withTemplate("sidebar"))).toMatchObject({ accentHeadings: true, plain: false });
    expect(docStyle(withTemplate("rirekisho"))).toMatchObject({ accentHeadings: false, uppercaseHeadings: false });
    // An unknown template falls back to the base profile.
    expect(docStyle({ ...base, display: { ...base.display, template: "x" as TemplateKey } })).toMatchObject({
      accentHeadings: true,
      twoColumn: false,
    });
  });

  it("follows the chosen font + accent, with a safe accent fallback", () => {
    const sans = docStyle(updateDisplay(base, { fontPairing: "sans" }));
    expect(sans.serif).toBe(false);
    const serif = docStyle(updateDisplay(base, { fontPairing: "serif" }));
    expect(serif.serif).toBe(true);
    expect(docStyle(updateDisplay(base, { accentColor: "#0f766e" })).accentHex).toBe("0F766E");
  });
});

describe("LaTeX export follows the template", () => {
  it("Classic centres the masthead", () => {
    expect(renderCvLatex(withTemplate("classic"))).toContain("\\begin{center}");
  });
  it("Modern accent-colours the name", () => {
    const tex = renderCvLatex(withTemplate("modern"));
    expect(tex).toContain("\\bfseries \\color{cvaccent}"); // accent-coloured name
    expect(tex).not.toContain("\\begin{center}");
  });
  it("ATS is plain: no accent in headings, sans font, black links", () => {
    const tex = renderCvLatex(withTemplate("ats"));
    expect(tex).toContain("\\renewcommand{\\familydefault}{\\sfdefault}");
    expect(tex).toContain("urlcolor=black");
    // Heading format carries no accent colour in plain mode.
    expect(tex).not.toContain("\\bfseries\\color{cvaccent}");
  });
});

describe("DOCX export builds for every template", () => {
  it("produces a non-empty .docx (zip) for each template", async () => {
    for (const t of ["classic", "modern", "sidebar", "ats", "rirekisho"] as TemplateKey[]) {
      const buf = await renderCvDocxBuffer(withTemplate(t));
      expect(buf.length).toBeGreaterThan(0);
      expect(buf[0]).toBe(0x50); // PK zip magic
    }
  });
});

describe("rich content (tables, photo) in exports", () => {
  it("LaTeX renders per-year + authorship tables and wraps long URLs", () => {
    const tex = renderCvLatex(rich("modern"));
    expect(tex).toContain("\\begin{tabular}"); // a real table
    expect(tex).toContain("Publications / year"); // per-year table header
    expect(tex).toContain("n="); // authorship caption with the denominator
    expect(tex).toContain("\\url{"); // publication URLs are breakable
  });
  it("LaTeX leaves a ready-to-use photo include when a photo is set", () => {
    expect(renderCvLatex(rich("modern"))).toContain("cv-photo");
  });
  // The DOCX is a PLAIN, template-agnostic document (no accent / photo /
  // sidebar) — the PDF is the template-faithful export.
  const fullCv: CanonicalCv = {
    ...rich("modern"),
    owner: {
      ...rich("modern").owner,
      honorific: "Dr",
      headline: "Pharmacovigilance & Clinical Pharmacology",
      contact: { email: "basile@example.org" },
      summary: "Drug-safety researcher.",
      metrics: { fwci_mean: 1.6, h_index: 12 },
    },
    display: { ...rich("modern").display, showMetrics: true, metrics: ["fwci_mean", "h_index"] },
  };

  it("DOCX is a valid plain document carrying the header, tables and sections", async () => {
    const buf = await renderCvDocxBuffer(fullCv);
    expect(buf[0]).toBe(0x50); // PK zip magic
    const xml = await (await JSZip.loadAsync(buf)).file("word/document.xml")!.async("string");
    expect(xml).toContain("ORCID:"); // a header field made it in
    expect(xml).toMatch(/\(\d+%\)/); // authorship "N (P%)"
    expect(xml).not.toMatch(/<w:tr\s*\/>|<w:tr>\s*<\/w:tr>/); // no empty rows (would corrupt Word)
    expect(xml).not.toMatch(/w:fill="[0-9A-Fa-f]{6}"/); // plain: no shaded / accent cells
  });

  it("DOCX handles an empty name, an all-zero authorship table, and empty sections", async () => {
    const noWorks = buildCanonicalCv({ id: "e", resolved, works: [], now: "2026-06-02T00:00:00.000Z" });
    const cv: CanonicalCv = {
      ...updateDisplay(noWorks, { showAuthorshipTable: true, authorshipRoles: ["first"] }),
      owner: { ...noWorks.owner, displayName: "" },
    };
    const buf = await renderCvDocxBuffer(cv);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("DOCX embeds the per-year charts as SVG images (only with ≥2 data points)", async () => {
    const withCounts = (counts: { year: number; works: number; citations: number }[]): CanonicalCv => ({
      ...updateDisplay(base, { showCharts: true }),
      owner: { ...base.owner, countsByYear: counts },
    });
    // 12 years also exercises the chart scale + x-axis label-thinning branches.
    const many = Array.from({ length: 12 }, (_, i) => ({ year: 2013 + i, works: (i % 5) + 1, citations: i * 7 }));
    const zip = await JSZip.loadAsync(await renderCvDocxBuffer(withCounts(many)));
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toMatch(/<w:drawing>/); // chart embedded as an image, not a table
    expect(zip.file(/word\/media\/.*\.svg$/i).length).toBeGreaterThan(0); // the SVG chart is in the package
    // A single data point → no chart, but the document still builds.
    expect((await renderCvDocxBuffer(withCounts([{ year: 2024, works: 7, citations: 80 }])))[0]).toBe(0x50);
  });
});

describe("Sidebar template — two-column layout in exports", () => {
  // A sidebar CV carrying every rich element (photo, headline, contact,
  // metrics, charts, authorship) so the coloured-column paths are exercised.
  const sidebarCv: CanonicalCv = {
    ...rich("sidebar"),
    owner: {
      ...rich("sidebar").owner,
      honorific: "Dr",
      headline: "Pharmacovigilance & Clinical Pharmacology",
      contact: { email: "basile@example.org" },
      summary: "Drug-safety researcher.",
      metrics: { fwci_mean: 1.6, h_index: 12 },
    },
    display: { ...rich("sidebar").display, showMetrics: true, metrics: ["fwci_mean", "h_index"] },
  };

  it("LaTeX uses a paracol two-column layout with a full-height accent band", () => {
    const tex = renderCvLatex(sidebarCv);
    expect(tex).toContain("\\begin{paracol}");
    expect(tex).toContain("\\switchcolumn");
    expect(tex).toContain("\\AddToShipoutPictureBG"); // the coloured band
    expect(tex).toContain("\\color{white}"); // left (accent) column text
    expect(tex).toContain("\\color{black}"); // reset so the right column isn't white-on-white
    expect(tex).toContain("\\begin{tabular}"); // tables still render
  });
});

describe("DOCX authorship table is well-formed (Word-openable)", () => {
  const authCv = updateDisplay(base, {
    template: "classic",
    showAuthorshipTable: true,
    authorshipRoles: ["first", "second", "third", "middle", "second-last", "last"],
  });

  it("emits no empty <w:tr> (an empty row makes Word refuse the file) and combines count + share", async () => {
    const buf = await renderCvDocxBuffer(authCv);
    const xml = await (await JSZip.loadAsync(buf)).file("word/document.xml")!.async("string");
    // The regression: a header row built from an empty array → <w:tr></w:tr>.
    expect(xml).not.toMatch(/<w:tr\s*\/>|<w:tr>\s*<\/w:tr>/);
    // Every row carries at least one cell (classic has no nested tables).
    for (const tr of xml.match(/<w:tr[\s>][\s\S]*?<\/w:tr>/g) ?? []) {
      expect(tr).toMatch(/<w:tc[\s>]/);
    }
    // Count + share live in one cell as "N (P%)", not two columns that merge.
    expect(xml).toMatch(/\(\d+%\)/);
  });
});
