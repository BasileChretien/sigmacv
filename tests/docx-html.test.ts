import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { addManualEntry, updateDisplay } from "@/lib/canonical/curate";
import { renderCvDocxHtml, renderCvDocxViaHtml } from "@/lib/render/docxHtml";
import type { CanonicalCv, TemplateKey } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};
const works = worksFixture as unknown as OpenAlexWork[];
const base = buildCanonicalCv({ id: "dh", resolved, works, now: "2026-06-02T00:00:00.000Z" });

const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

/** A CV exercising every rich element, on template `t`. */
function rich(t: TemplateKey): CanonicalCv {
  let cv = addManualEntry(base, "skills", "Pharmacovigilance · R, Python", "s:1");
  cv = updateDisplay(cv, {
    template: t,
    showCharts: true,
    showMetrics: true,
    metrics: ["fwci_mean", "h_index"],
    showAuthorshipTable: true,
    authorshipRoles: ["first", "second", "third", "middle", "second-last", "last", "corresponding"],
    accentColor: "#0f766e",
  });
  return {
    ...cv,
    owner: {
      ...cv.owner,
      honorific: "Dr",
      headline: "Pharmacist · Pharmacovigilance",
      contact: { email: "basile@example.org" },
      photo: PNG,
      summary: "Drug-safety researcher.",
      countsByYear: [
        { year: 2023, works: 5, citations: 40 },
        { year: 2024, works: 7, citations: 80 },
      ],
      metrics: { fwci_mean: 1.6, h_index: 12 },
    },
  };
}

describe("renderCvDocxHtml (DOCX-targeted HTML)", () => {
  it("Sidebar: coloured left column, photo, accent rules, data tables, self-name bold", () => {
    const html = renderCvDocxHtml(rich("sidebar"));
    expect(html).toContain("background-color:#0f766e"); // the accent sidebar
    expect(html).toContain("<img src=\"data:image/png"); // the photo
    expect(html).toContain("border-bottom:1.5px solid #0f766e"); // accent heading rule
    expect(html).toContain("<table"); // data tables present
    expect(html).toMatch(/\(\d+%\)/); // authorship "N (P%)"
    expect(html).toContain("· n="); // denominator surfaced
    expect(html).toContain("<strong>"); // self-name highlighted on own works
  });

  it("Modern accent-colours the name; ATS is plain (no photo, ink headings)", () => {
    const modern = renderCvDocxHtml(rich("modern"));
    expect(modern).toContain("font-weight:bold;color:#0f766e"); // accent name
    const ats = renderCvDocxHtml(rich("ats"));
    expect(ats).not.toContain("<img"); // plain profile omits the photo
    expect(ats).not.toContain("border-bottom:1.5px solid #0f766e"); // no accent rule
  });

  it("a minimal CV (no photo/charts/authorship/headline) still builds clean HTML", () => {
    const minimal = updateDisplay(base, { template: "classic" });
    const html = renderCvDocxHtml(minimal);
    expect(html).not.toContain("<img");
    expect(html).toContain("<body"); // well-formed shell
  });

  it("skips a non-PNG/JPEG photo (e.g. GIF) gracefully", () => {
    const cv: CanonicalCv = {
      ...updateDisplay(base, { template: "modern" }),
      owner: { ...base.owner, photo: "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" },
    };
    expect(renderCvDocxHtml(cv)).not.toContain("<img");
  });

  it("an empty CV omits empty sections, an all-zero authorship table, and a short chart", () => {
    const empty = buildCanonicalCv({ id: "e", resolved, works: [], now: "2026-06-02T00:00:00.000Z" });
    const cv = updateDisplay(empty, {
      template: "modern",
      showCharts: true, // but countsByYear is empty → no table
      showAuthorshipTable: true,
      authorshipRoles: ["first"], // 0 works → all-zero → omitted
    });
    const html = renderCvDocxHtml(cv);
    expect(html).not.toContain("· n="); // authorship table omitted
    expect(html).not.toContain("/ year"); // year table omitted
    expect(html).toContain("<body"); // still a well-formed shell
  });
});

describe("renderCvDocxViaHtml (converted .docx)", () => {
  it("produces a valid, Word-openable .docx with the accent sidebar + no empty rows", async () => {
    const buf = await renderCvDocxViaHtml(rich("sidebar"));
    expect(buf[0]).toBe(0x50); // PK zip magic
    const xml = await (await JSZip.loadAsync(buf)).file("word/document.xml")!.async("string");
    expect(xml).toMatch(/w:fill="0f766e"/i); // sidebar cell shading carried through
    expect(xml).toMatch(/<a:blip/); // the photo embedded
    expect(xml).not.toMatch(/<w:tr\s*\/>|<w:tr>\s*<\/w:tr>/); // no empty rows
  });

  it("builds for every template", async () => {
    for (const t of ["classic", "modern", "sidebar", "ats", "rirekisho"] as TemplateKey[]) {
      const buf = await renderCvDocxViaHtml(rich(t));
      expect(buf.length).toBeGreaterThan(0);
      expect(buf[0]).toBe(0x50);
    }
  });
});
