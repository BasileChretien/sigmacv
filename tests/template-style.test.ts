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

describe("docStyle", () => {
  it("maps each template to a distinct profile", () => {
    expect(docStyle(withTemplate("classic"))).toMatchObject({ centeredHeader: true, accentName: false, plain: false });
    expect(docStyle(withTemplate("modern"))).toMatchObject({ accentName: true, centeredHeader: false });
    expect(docStyle(withTemplate("ats"))).toMatchObject({ plain: true, accentHeadings: false, serif: false });
    expect(docStyle(withTemplate("sidebar"))).toMatchObject({ accentHeadings: true, plain: false });
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
    expect(tex).toMatch(/\\bfseries\\color\{cvaccent\}Basile|\\bfseries\\color\{cvaccent\}Dr/);
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
