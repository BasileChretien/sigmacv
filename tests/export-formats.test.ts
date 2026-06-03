import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateOwner } from "@/lib/canonical/curate";
import { listAvailableStyles } from "@/lib/citeproc/assets";
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

  it("LaTeX: self-contained document with itemized bibliography + \\textbf self", () => {
    const tex = renderCvLatex(makeCv());
    expect(tex).toContain("\\documentclass[11pt]{article}");
    expect(tex).toContain("\\section*{Publications}");
    expect(tex).toContain("\\item ");
    expect(tex).toContain("\\textbf{Chr"); // \textbf{Chrétien}
    expect(tex).toContain("\\end{document}");
  });

  it("LaTeX: escapes special characters", () => {
    // Title-less work would never happen, but verify the escaper on a hash.
    const tex = renderCvLatex(makeCv());
    // No raw unescaped & should appear (citeproc output rarely has one, but the
    // escaper must run): assert there are no bare '%' line-comment surprises.
    expect(tex).not.toMatch(/[^\\]%/);
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
