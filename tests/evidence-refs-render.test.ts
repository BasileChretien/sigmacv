import { describe, expect, it } from "vitest";
import JSZip from "jszip";
import {
  CanonicalCvSchema,
  type CanonicalCv,
  type CvItem,
  type CvSectionType,
} from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { bibtexCiteKeys, renderCvBibtex } from "@/lib/render/bibtex";
import { renderCvDocxBuffer } from "@/lib/render/docx";
import { renderGrantCv } from "@/lib/render/grantCv";
import { renderCvHtml } from "@/lib/render/html";
import { renderCvLatex } from "@/lib/render/latex";
import { renderCvMarkdown } from "@/lib/render/markdown";
import { computeCvHealth, healthTargets } from "@/lib/cv/health";
import { buildNarrativeMessages } from "@/lib/ai/narrativeDraft";

const hasApa = listAvailableStyles().includes("apa");

function item(id: string, over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: {
      id,
      type: "article-journal",
      title: `Title of ${id}`,
      author: [{ family: "Smith", given: "A" }],
      issued: { "date-parts": [[2021]] },
      "container-title": "J. Test",
    },
    meta: {},
    ...over,
  } as CvItem;
}

function section(
  type: CvSectionType,
  items: CvItem[],
  over: { visible?: boolean; body?: string; id?: string; title?: string } = {},
) {
  return {
    id: over.id ?? type,
    type,
    title: over.title ?? type,
    visible: over.visible ?? true,
    order: 0,
    items,
    ...(over.body !== undefined ? { body: over.body } : {}),
  };
}

function cv(
  sections: ReturnType<typeof section>[],
  display: Record<string, unknown> = {},
): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "ev",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Basile Chrétien" },
    display: { template: "classic", ...display },
    sections,
    provenance: { generatedAt: "2026-09-04T00:00:00.000Z", sources: ["openalex"] },
  });
}

const BODY = "I built a method [[W1]] taught widely [[position:1]]; a lost claim [[gone]].";

/** A CV with one citation entry, one plain entry, a hidden entry and a narrative
 *  body that references all three (+ an unknown id). */
function fixture(body = BODY, display: Record<string, unknown> = {}) {
  return cv(
    [
      section("publications", [item("W1"), item("hid", { included: false })]),
      section("positions", [
        item("position:1", { csl: undefined, displayText: "Professor, Caen" }),
      ]),
      section("narrative-knowledge", [], { body, title: "Contributions to knowledge" }),
    ],
    display,
  );
}

describe.skipIf(!hasApa)("evidence references in the renderers (needs vendored CSL assets)", () => {
  it("HTML/PDF: a resolved reference is an inline link to the entry's own id; unresolved is omitted", () => {
    const html = renderCvHtml(fixture(`${BODY}\n- bullet [[W1]]\n- other [[hid]]`));
    expect(html).toContain('<a class="cv-evidence" href="#item-w1">Smith 2021</a>');
    expect(html).toContain('<a class="cv-evidence" href="#item-position-1">Professor, Caen</a>');
    expect(html).toContain('<li id="item-w1">'); // the anchor target exists
    expect(html).toContain("a lost claim.");
    expect(html).not.toContain("[[");
    expect(html).not.toContain("gone");
    expect(html).toContain('<li>bullet <a class="cv-evidence"'); // inside a prose list too
    expect(html).toContain("<li>other</li>"); // hidden entry: reference dropped
    expect(html).toContain("a.cv-evidence"); // the style is emitted
    // In-page links are NOT externalized (no target=_blank), external ones still are.
    expect(html).not.toMatch(/<a class="cv-evidence" href="#item-w1"[^>]*target=/);
    expect(html).toMatch(/<a href="https:\/\/orcid\.org\/[^"]+" target="_blank"/);
  });

  it("HTML: a reference to an entry the render did not list is unresolved (per-view exclusion)", () => {
    const html = renderCvHtml(fixture(BODY, { excludedItems: { publications: ["W1"] } }));
    expect(html).not.toContain('cv-evidence" href="#item-w1"');
    expect(html).toContain("I built a method taught widely");
  });

  it("HTML: prose text around references is still escaped", () => {
    const html = renderCvHtml(fixture("<b>x</b> [[W1]] <i>y</i>"));
    expect(html).toContain('&lt;b&gt;x&lt;/b&gt; <a class="cv-evidence"');
    expect(html).not.toContain("<b>x</b>");
  });

  it("Markdown: [label](#item-…) links plus a matching anchor on the referenced entry", () => {
    const md = renderCvMarkdown(fixture());
    expect(md).toContain("[Smith 2021](#item-w1)");
    expect(md).toContain("[Professor, Caen](#item-position-1)");
    expect(md).toContain('<a id="item-w1"></a>');
    expect(md).toContain('<a id="item-position-1"></a>');
    expect(md).toContain("a lost claim.");
    expect(md).not.toContain("[[");
  });

  it("Markdown: the label is escaped and unreferenced entries carry no anchor", () => {
    const md = renderCvMarkdown(fixture("only [[position:1]]"));
    expect(md).not.toContain('<a id="item-w1"></a>');
    expect(md).toContain("[Professor, Caen](#item-position-1)");
  });

  it("grant draft: plain (label) references, no anchors", () => {
    const md = renderGrantCv(fixture(), "erc");
    expect(md).toContain("(Smith 2021)");
    expect(md).not.toContain("](#item-");
    expect(md).not.toContain("[[");
  });

  it("DOCX: (label) runs hyperlink to a bookmark on the referenced entry; unresolved omitted", async () => {
    const buf = await renderCvDocxBuffer(fixture());
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toContain("(Smith 2021)");
    expect(xml).toContain("(Professor, Caen)");
    expect(xml).toMatch(/<w:hyperlink [^>]*w:anchor="ev_1"/);
    expect(xml).toMatch(/<w:hyperlink [^>]*w:anchor="ev_2"/);
    expect(xml).toMatch(/<w:bookmarkStart [^>]*w:name="ev_1"/);
    expect(xml).toMatch(/<w:bookmarkStart [^>]*w:name="ev_2"/);
    // Each bookmark pair carries its own numeric id (Word pairs start/end by it).
    const ids = [...xml.matchAll(/<w:bookmarkStart [^>]*w:id="(\d+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(2);
    for (const id of ids) expect(xml).toContain(`<w:bookmarkEnd w:id="${id}"/>`);
    expect(xml).toContain("; a lost claim</w:t>");
    expect(xml).not.toContain("[[");
    expect(xml).not.toContain("gone");
  });

  it("DOCX: no bookmark is written when nothing references an entry", async () => {
    const buf = await renderCvDocxBuffer(fixture("no references here"));
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).not.toContain("w:bookmarkStart");
  });

  it("LaTeX: prose sections render, with \\cvevidencecite{label}{bibkey} / \\cvevidence{label}", () => {
    const c = fixture();
    const tex = renderCvLatex(c);
    const key = bibtexCiteKeys(c).get("W1")!;
    expect(key).toBe("smith2021title");
    expect(renderCvBibtex(c)).toContain(`@article{${key},`);
    expect(tex).toContain("\\section{Contributions to knowledge}");
    expect(tex).toContain(`\\cvevidencecite{Smith 2021}{${key}}`);
    expect(tex).toContain("\\cvevidence{Professor, Caen}");
    expect(tex).toContain("\\newcommand{\\cvevidence}[1]");
    expect(tex).toContain("\\newcommand{\\cvevidencecite}[2]");
    expect(tex).toContain("a lost claim.");
    expect(tex).not.toContain("[[");
  });

  it("LaTeX: paragraphs, line breaks and bullet lists, with user text escaped", () => {
    const tex = renderCvLatex(fixture("First & line\nsecond\n\n- item [[W1]]\n- 50% done"));
    expect(tex).toContain("First \\& line \\\\\nsecond\\par");
    expect(tex).toContain(
      "\\begin{itemize}[nosep,leftmargin=1.2em]\n  \\item item \\cvevidencecite",
    );
    expect(tex).toContain("  \\item 50\\% done\n\\end{itemize}");
    expect(tex).toContain("\\medskip");
  });

  it("LaTeX (sidebar template): the same prose block + macros", () => {
    const tex = renderCvLatex(fixture(BODY, { template: "sidebar" }));
    expect(tex).toContain("\\usepackage{paracol}");
    expect(tex).toContain("\\section{Contributions to knowledge}");
    expect(tex).toContain("\\cvevidence{Professor, Caen}");
  });

  it("LaTeX: no evidence macros and no prose block when the document has no prose", () => {
    const tex = renderCvLatex(cv([section("publications", [item("W1")])]));
    expect(tex).not.toContain("cvevidence");
  });
});

describe("evidence references in CV health", () => {
  it("counts unresolved references and narrative modules without linked evidence", () => {
    const c = cv([
      section("publications", [item("W1")]),
      section("narrative-knowledge", [], { body: "linked [[W1]] and [[gone]]" }),
      section("narrative-community", [], { body: "no links at all" }),
      section("narrative-society", [], { body: "hidden module [[gone]]", visible: false }),
      section("statement", [], { body: "a statement without links is fine" }),
    ]);
    const h = computeCvHealth(c);
    expect(h.unresolvedEvidenceRefs).toBe(1); // hidden module not counted
    expect(h.narrativesWithoutEvidence).toBe(1); // community only; statement isn't a module
    expect(h.total).toBe(2);
    const t = healthTargets(c);
    expect(t.evidence).toEqual([
      { sectionId: "narrative-knowledge", itemId: "narrative-knowledge" },
    ]);
    expect(t.narrative).toEqual([
      { sectionId: "narrative-community", itemId: "narrative-community" },
    ]);
  });

  it("a narrative whose only reference is to a hidden entry has both problems", () => {
    const c = cv([
      section("publications", [item("W1", { notMine: true })]),
      section("narrative-knowledge", [], { body: "was [[W1]]" }),
    ]);
    const h = computeCvHealth(c);
    expect(h.unresolvedEvidenceRefs).toBe(1);
    expect(h.narrativesWithoutEvidence).toBe(1);
  });
});

describe("evidence references in the AI draft prompt", () => {
  it("lists each output with its [[id]] token and instructs the model to cite with them", () => {
    const [system, user] = buildNarrativeMessages(fixture(), "narrative-knowledge");
    expect(system.content).toContain("[[W2741809807]]");
    expect(system.content).toMatch(/never invent or alter one/);
    expect(user.content).toContain("- [[W1]] Title of W1 (J. Test, 2021)");
    expect(user.content).toContain("citing each output you draw on with its [[…]] token");
  });
});
