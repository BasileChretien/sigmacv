import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import {
  CanonicalCvSchema,
  type CanonicalCv,
  type Contribution,
  type CvItem,
} from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderCvHtml } from "@/lib/render/html";
import { renderCvMarkdown } from "@/lib/render/markdown";
import { renderCvDocxBuffer } from "@/lib/render/docx";
import { renderCvLatex } from "@/lib/render/latex";
import { renderGrantCv } from "@/lib/render/grantCv";
import { prepareSections } from "@/lib/render/prepare";
import { computeCvHealth } from "@/lib/cv/health";

/**
 * The structured contributions in every export: numbered, titled, with the
 * period and audience, the role and impact, where they are cited, and the linked
 * entry's reference as the style prints it (never the style's own number). An
 * empty field prints nothing; a contribution whose entry left the record and has
 * no title of its own is skipped. User strings are escaped; a link is only a
 * link when it is http(s).
 */

const styles = listAvailableStyles();
const hasApa = styles.includes("apa");
const hasIeee = styles.includes("ieee");

function work(id: string, over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: ["Chrétien"],
    csl: {
      id,
      type: "article-journal",
      title: `Signal detection ${id}`,
      author: [
        { family: "Chrétien", given: "Basile" },
        { family: "Kaur", given: "Priya" },
      ],
      issued: { "date-parts": [[2020]] },
      "container-title": "Revue fictive",
      DOI: `10.0000/${id.toLowerCase()}`,
    },
    meta: { year: 2020 },
    ...over,
  };
}

const CONTRIBUTIONS: Contribution[] = [
  {
    id: "c1",
    itemId: "W1",
    period: "2019–2023",
    audience: ["A", "B"],
    role: "I designed <the> analysis & led it",
    impact: "Changed monitoring\nin two hospitals",
    citedIn: [
      { text: "NCCN Guidelines 2024", url: "https://pubmed.ncbi.nlm.nih.gov/39413835/" },
      { text: "Bad link", url: "javascript:alert(1)" },
      { text: "   " },
    ],
  },
  { id: "c2", itemId: "W-gone" }, // entry left the record, no title → skipped
  { id: "c3", title: "Pharmacovigilance network 50% & more" }, // an experience, no entry
];

function makeCv(style = "apa", body = "", contributions = CONTRIBUTIONS): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "render",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Basile Chrétien" },
    display: { locale: "en-US", cslStyle: style },
    sections: [
      {
        id: "pubs",
        type: "publications",
        title: "Publications",
        visible: false,
        order: 0,
        items: [work("W1"), work("W2")],
      },
      {
        id: "k",
        type: "narrative-knowledge",
        title: "Contributions",
        visible: true,
        order: 1,
        items: [],
        body,
        contributions,
      },
    ],
    provenance: { generatedAt: "2026-09-17T00:00:00.000Z", sources: ["openalex"] },
  });
}

describe.skipIf(!hasApa)("contributions in the exports", () => {
  it("prepares one numbered list for every format, skipping a card with nothing to print", () => {
    const k = prepareSections(makeCv(), "text").find((p) => p.section.id === "k")!;
    expect(k.contributions!.map((p) => [p.n, p.title])).toEqual([
      [1, "Signal detection W1"],
      [2, "Pharmacovigilance network 50% & more"],
    ]);
    expect(k.contributions![0]!.reference).toContain("Signal detection W1");
    expect(k.contributions![1]!.reference).toBe("");
  });

  it("HTML: a numbered list with the facts, safe links, and the entry's reference, even with no prose", () => {
    const html = renderCvHtml(makeCv());
    expect(html).toContain('<ol class="cv-contributions">');
    expect(html).toContain('<span class="cv-contribution-title">Signal detection W1</span>');
    expect(html).toContain(
      '<span class="cv-contribution-meta">2019–2023 · Audience : A (academic community), B (practice community)</span>',
    );
    expect(html).toContain("I designed &lt;the&gt; analysis &amp; led it");
    expect(html).toContain("Changed monitoring<br />in two hospitals");
    expect(html).toContain(
      '<a href="https://pubmed.ncbi.nlm.nih.gov/39413835/" rel="noopener" target="_blank">NCCN Guidelines 2024</a>',
    );
    expect(html).toContain("<li>Bad link</li>");
    expect(html).not.toContain("javascript:");
    expect(html).toContain('<div class="cv-contribution-ref">');
    // The owner's name is highlighted in the reference, as in the lists.
    expect(html).toMatch(/cv-contribution-ref">[\s\S]*?<span class="[^"]*">Chrétien<\/span>/);
    expect(html).toContain("Pharmacovigilance network 50% &amp; more");
    expect(html).not.toContain("W-gone");
    // An export carries no placeholder link for an empty role/impact.
    expect(html).not.toContain('cv-prose-prompt-link"');
  });

  it("HTML in the editor preview: an empty role or impact is a link back to the section", () => {
    const html = renderCvHtml(makeCv(), { editorPreview: true });
    expect(html).toContain(
      '<a class="cv-prose-prompt-link" href="#cv-edit=k" target="_top">Role : [to complete]</a>',
    );
    expect(html).toContain(
      '<a class="cv-prose-prompt-link" href="#cv-edit=k" target="_top">Impact : [to complete]</a>',
    );
  });

  it("a section with no prose and no printable card renders nothing", () => {
    const html = renderCvHtml(makeCv("apa", "", [{ id: "c2", itemId: "W-gone" }]));
    // (the class name itself ships in the base stylesheet; the list element does not)
    expect(html).not.toContain('<ol class="cv-contributions">');
    expect(html).not.toContain(">Contributions<");
  });

  it("Markdown: numbered, bold titles, the facts nested, links in angle brackets", () => {
    const md = renderCvMarkdown(makeCv("apa", "My intro."));
    expect(md).toContain("## Contributions\n\nMy intro.\n\n1. **Signal detection W1** (2019–2023");
    expect(md).toContain("   - **Role :** I designed <the> analysis & led it");
    expect(md).toContain("   - **Impact :** Changed monitoring in two hospitals");
    expect(md).toContain(
      "     - [NCCN Guidelines 2024](<https://pubmed.ncbi.nlm.nih.gov/39413835/>)",
    );
    expect(md).toContain("     - Bad link");
    expect(md).toMatch(/ {3}- \*\*Reference :\*\* \*\*Chrétien\*\*/);
    expect(md).toContain("2. **Pharmacovigilance network 50% & more**");
  });

  it("DOCX: the title, the labelled facts, the cited link, the reference", async () => {
    const zip = await JSZip.loadAsync(await renderCvDocxBuffer(makeCv()));
    const doc = await zip.file("word/document.xml")!.async("string");
    const rels = await zip.file("word/_rels/document.xml.rels")!.async("string");
    expect(doc).toContain("1. Signal detection W1");
    expect(doc).toContain("Role : ");
    expect(doc).toContain("Cited in : ");
    expect(doc).toContain("2. Pharmacovigilance network 50% &amp; more");
    expect(rels).toContain("https://pubmed.ncbi.nlm.nih.gov/39413835/");
    expect(rels).not.toContain("javascript:");
  });

  it("LaTeX: an enumerate with escaped text and \\href links", () => {
    const tex = renderCvLatex(makeCv());
    expect(tex).toContain("\\begin{enumerate}[leftmargin=1.6em,itemsep=0.6em]");
    expect(tex).toContain("\\item \\textbf{Signal detection W1}");
    expect(tex).toContain("\\item \\textbf{Pharmacovigilance network 50\\% \\& more}");
    expect(tex).toContain(
      "\\href{https://pubmed.ncbi.nlm.nih.gov/39413835/}{NCCN Guidelines 2024}",
    );
    expect(tex).toContain("\\textit{Cited in} : Bad link");
    expect(tex).toContain("\\textbf{Chrétien}");
  });

  it("the funder draft prints them after the prose", () => {
    const md = renderGrantCv(makeCv("apa", "Intro."), "erc");
    expect(md).toContain("Intro.\n\n1. **Signal detection W1**");
  });
});

describe.skipIf(!hasApa)("a citation marker typed into a card", () => {
  const withMarker = () =>
    makeCv("apa", "", [
      { id: "c1", itemId: "W1", impact: "Adopted by the network [[W2 | Chrétien 2020]]." },
      { id: "c2", title: "Dangling", role: "See [[W-gone]]." },
    ]);

  it("resolves in every format and never prints raw brackets", async () => {
    const html = renderCvHtml(withMarker());
    expect(html).toContain('class="cv-evidence"');
    expect(html).toContain("Adopted by the network");
    const md = renderCvMarkdown(withMarker());
    expect(md).toContain("Adopted by the network");
    expect(md).not.toContain("[[");
    const tex = renderCvLatex(withMarker());
    expect(tex).toContain("\\cvevidence");
    expect(tex).not.toContain("[[");
    // The macro is defined even though the section has no prose body.
    expect(tex).toContain(String.raw`\newcommand{\cvevidence}`);
    const zip = await JSZip.loadAsync(await renderCvDocxBuffer(withMarker()));
    const doc = await zip.file("word/document.xml")!.async("string");
    expect(doc).toContain("(Chrétien et al. 2020)");
    expect(doc).not.toContain("[[");
    const grant = renderGrantCv(withMarker(), "erc");
    expect(grant).toContain("Adopted by the network");
    expect(grant).not.toContain("[[");
  });

  it("counts in the health panel: a dangling marker in a card is unresolved", () => {
    const health = computeCvHealth(withMarker());
    expect(health.unresolvedEvidenceRefs).toBe(1);
    expect(health.narrativesWithoutEvidence).toBe(0);
  });
});

describe.skipIf(!hasIeee)("a numbered citation style", () => {
  it("does not print its own number inside a contribution", () => {
    const text = prepareSections(makeCv("ieee"), "text").find((p) => p.section.id === "k")!;
    expect(text.contributions![0]!.reference).not.toMatch(/^\s*\[\d+\]/);
    const html = prepareSections(makeCv("ieee"), "html").find((p) => p.section.id === "k")!;
    expect(html.contributions![0]!.reference).not.toContain("csl-left-margin");
  });
});
