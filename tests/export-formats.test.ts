import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemNotMine, updateDisplay, updateOwner } from "@/lib/canonical/curate";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderCvBibtex } from "@/lib/render/bibtex";
import { renderCvDocxBuffer } from "@/lib/render/docx";
import { textHeader } from "@/lib/render/headerText";
import { renderCvLatex } from "@/lib/render/latex";
import { renderCvMarkdown } from "@/lib/render/markdown";
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

function makeCv() {
  return buildCanonicalCv({
    id: "cv_export",
    resolved,
    works,
    now: "2026-06-02T00:00:00.000Z",
  });
}

describe.skipIf(!hasApa)("export formats (need vendored CSL assets)", () => {
  it("Markdown: YAML frontmatter + section + bolded self name", () => {
    const md = renderCvMarkdown(makeCv());
    expect(md).toMatch(/^---\n/);
    expect(md).toContain('title: "Basile Chrétien"');
    expect(md).toContain('orcid: "0000-0002-7483-2489"');
    expect(md).toContain("## Publications");
    expect(md).toContain("1. "); // numbered entry
    expect(md).toContain("**Chrétien**"); // self name bolded
  });

  it("Markdown: escapes metacharacters in section titles and the name heading", () => {
    const base = makeCv();
    const cv = {
      ...base,
      owner: { ...base.owner, displayName: "Doe\n\n## Forged" },
      sections: base.sections.map((s) =>
        s.type === "publications" ? { ...s, title: "Pubs [x](http://e.tld) keep" } : s,
      ),
    };
    const md = renderCvMarkdown(cv);
    // A name like "Doe\n\n## Forged" must not inject a real heading block.
    expect(md).not.toMatch(/^## Forged/m);
    // A renamed section title can't smuggle a Markdown link past the escaper.
    expect(md).not.toContain("[x](http://e.tld)");
    expect(md).toContain("## Pubs"); // the real heading still renders (escaped)
  });

  it("LaTeX: accent colour, section rules, template-styled layout", () => {
    const tex = renderCvLatex(makeCv());
    expect(tex).toContain("\\documentclass[11pt,a4paper]{article}");
    expect(tex).toContain("\\definecolor{cvaccent}{HTML}{1F4FD8}");
    expect(tex).toContain("\\section{Publications}");
    expect(tex).toContain("\\titlerule");
    expect(tex).toContain("\\textbf{Chr");
    expect(tex).toContain("\\end{document}");
  });

  it("LaTeX: escapes special characters (no bare % comment surprises)", () => {
    const tex = renderCvLatex(makeCv());
    expect(tex).not.toMatch(/[^\\]%/);
  });

  it("LaTeX (modern): uses a valid accent and falls back for an invalid one", () => {
    const cv = makeCv();
    const ok = renderCvLatex(updateDisplay(cv, { accentColor: "#0f766e" }));
    expect(ok).toContain("\\definecolor{cvaccent}{HTML}{0F766E}");
    // An invalid colour (bypassing schema validation) → safe default.
    const bad = renderCvLatex({
      ...cv,
      display: { ...cv.display, accentColor: "#fff" },
    });
    expect(bad).toContain("\\definecolor{cvaccent}{HTML}{1F4FD8}");
  });

  it("DOCX: produces a non-empty .docx (zip) buffer", async () => {
    const buf = await renderCvDocxBuffer(makeCv());
    expect(buf.length).toBeGreaterThan(0);
    // .docx is a ZIP container — check the PK magic bytes.
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
  });

  it("Markdown + LaTeX include headline, contact and summary", () => {
    const cv = updateOwner(makeCv(), {
      headline: "Assistant Professor",
      summary: "Pharmacovigilance researcher.",
      contact: { email: "b@example.org", location: "Nagoya" },
      links: [{ label: "Scholar", url: "https://scholar.example/me" }],
    });
    const md = renderCvMarkdown(cv);
    expect(md).toContain("Assistant Professor");
    expect(md).toContain("b@example.org");
    expect(md).toContain("Nagoya");
    expect(md).toContain("Scholar: https://scholar.example/me");
    expect(md).toContain("Pharmacovigilance researcher.");

    const tex = renderCvLatex(cv);
    expect(tex).toContain("Assistant Professor");
    expect(tex).toContain("b@example.org");
    expect(tex).toContain("Pharmacovigilance researcher.");
  });

  it("DOCX still builds with profile header fields", async () => {
    const cv = updateOwner(makeCv(), {
      headline: "Prof",
      summary: "Bio.",
      contact: { email: "b@example.org" },
    });
    const buf = await renderCvDocxBuffer(cv);
    expect(buf.length).toBeGreaterThan(0);
  });

  it("prepends the honorific to the name in Markdown + LaTeX exports", () => {
    const cv = updateOwner(makeCv(), { honorific: "Dr" });
    expect(renderCvMarkdown(cv)).toContain("# Dr Basile Chrétien");
    expect(renderCvLatex(cv)).toContain("Dr Basile Chr");
  });

  it("BibTeX: @article entries with author/title/year/DOI + a cite key", () => {
    const bib = renderCvBibtex(makeCv());
    expect(bib).toContain("@article{");
    expect(bib).toMatch(/@article\{chretien2023/); // <family><year><word>
    expect(bib).toContain("title = {{"); // double-braced to protect case
    expect(bib).toContain("doi = {10.1000/example1}"); // DOI kept literal
    expect(bib).toContain("Chrétien"); // UTF-8 author preserved
    expect(bib.endsWith("\n")).toBe(true);
  });

  it("BibTeX: excludes works asserted 'not mine'", () => {
    const cv = setItemNotMine(makeCv(), "publications", "W4300000003", true);
    const bib = renderCvBibtex(cv);
    expect(bib).not.toContain("namesake"); // the not-mine work is dropped
  });
});

describe("BibTeX (no CSL assets needed)", () => {
  it("returns an empty string when there are no publications", () => {
    const empty = buildCanonicalCv({
      id: "e",
      resolved,
      works: [],
      now: "2026-06-02T00:00:00.000Z",
    });
    expect(renderCvBibtex(empty)).toBe("");
  });
});

describe("textHeader", () => {
  it("collects contact parts in order and trims empties", () => {
    const cv = updateOwner(makeCv(), {
      headline: "  Prof  ",
      summary: "  ",
      contact: { location: "Nagoya", email: "a@b.com", phone: "+81-90", website: "https://x.org" },
      links: [
        { label: "Site", url: "https://site.org" },
        { label: "", url: "https://noLabel.org" },
        { label: "Empty", url: "  " },
      ],
    });
    const h = textHeader(cv);
    expect(h.headline).toBe("Prof"); // trimmed
    expect(h.summary).toBeUndefined(); // whitespace-only → undefined
    expect(h.contact).toEqual([
      "Nagoya",
      "a@b.com",
      "+81-90",
      "https://x.org",
      "Site: https://site.org",
      "https://noLabel.org",
    ]); // empty-url link dropped
  });
});
