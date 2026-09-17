import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import {
  CanonicalCvSchema,
  type CanonicalCv,
  type CvItem,
  type CvSection,
  type CvSectionType,
} from "@/lib/canonical/schema";
import { applyCvModel } from "@/lib/canonical/cvModels";
import { setSectionBody } from "@/lib/canonical/curate";
import { evidenceCandidates, evidenceRefCounts } from "@/lib/canonical/evidenceRefs";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderCvHtml } from "@/lib/render/html";
import { evidenceMarkdown } from "@/lib/render/evidenceRefs";
import { renderCvMarkdown } from "@/lib/render/markdown";
import { renderCvDocxBuffer } from "@/lib/render/docx";

const hasApa = listAvailableStyles().includes("apa");

function item(id: string, extra: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "manual",
    sourceId: "manual",
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: ["Chrétien"],
    meta: {},
    ...extra,
  };
}
function section(type: CvSectionType, items: CvItem[], body?: string): CvSection {
  return {
    id: type,
    type,
    title: type,
    visible: true,
    order: 0,
    items: items.map((it, i) => ({ ...it, order: i })),
    ...(body !== undefined ? { body } : {}),
  };
}

const BODY = "A method now used elsewhere [[W1 | Chrétien 2022]], with a student [[sup:1]].";

/** A CV with one publication (with a DOI) and one supervision record. */
function makeCv(): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "hidden_sections",
    owner: {
      orcid: "0000-0002-7483-2489",
      openAlexAuthorIds: ["A1"],
      displayName: "Basile Chrétien",
      links: [],
      countsByYear: [],
    },
    display: { locale: "en-US", cslStyle: "apa" },
    sections: [
      section("publications", [
        item("W1", {
          source: "openalex",
          sourceId: "https://openalex.org/W1",
          csl: {
            id: "W1",
            type: "article-journal",
            title: "Hepatotoxicity signal",
            author: [{ family: "Chrétien", given: "Basile" }],
            issued: { "date-parts": [[2022]] },
            "container-title": "Revue fictive",
          },
          meta: { year: 2022, doi: "10.0000/fictif.1" },
        }),
      ]),
      section("supervision", [
        item("sup:1", {
          authoredBySelf: false,
          selfNameVariants: [],
          displayText: "PhD: Priya Kaur",
          meta: { superviseeName: "Priya Kaur", degreeLevel: "phd" },
        }),
      ]),
      section("narrative-knowledge", [], BODY),
    ].map((s, i) => ({ ...s, order: i })),
    presets: [],
    provenance: { generatedAt: "2026-09-16T00:00:00.000Z", sources: ["manual"] },
  });
}

/** The same CV under CV-FRQ (English): the lists are hidden, the prose kept. */
function frqCv(): CanonicalCv {
  const frq = applyCvModel(makeCv(), "frq-en");
  const knowledge = frq.sections.find((s) => s.type === "narrative-knowledge")!;
  return setSectionBody(frq, knowledge.id, BODY);
}

describe("citing an entry whose list the layout hides", () => {
  it("the picker offers the whole record under CV-FRQ, the module's own evidence first", () => {
    const frq = frqCv();
    expect(frq.sections.find((s) => s.type === "publications")!.visible).toBe(false);
    const offered = evidenceCandidates(frq, "narrative-knowledge");
    expect(offered.map((c) => c.id)).toEqual(["W1", "sup:1"]);
    expect(offered.map((c) => c.relevant)).toEqual([true, false]);
    // And the health count sees both references as linked, none as unresolved.
    expect(evidenceRefCounts(frq, BODY)).toEqual({ linked: 2, unresolved: 0 });
  });

  it.skipIf(!hasApa)(
    "HTML links a listed entry to the page, an unlisted one to its DOI, and marks one with no link as a span",
    () => {
      // Default layout: the publication is listed, so the reference is a page anchor.
      expect(renderCvHtml(makeCv())).toContain('<a class="cv-evidence" href="#item-w1">');
      // CV-FRQ: the lists are off the page; the DOI carries the check instead.
      const html = renderCvHtml(frqCv());
      expect(html).not.toContain('href="#item-w1"');
      expect(html).toContain(
        '<a class="cv-evidence" href="https://doi.org/10.0000/fictif.1" rel="noopener" target="_blank">Chrétien 2022</a>',
      );
      expect(html).toContain('<span class="cv-evidence">PhD: Priya Kaur</span>');
      // The raw tokens never reach the page.
      expect(html).not.toContain("[[");
    },
  );

  it("Markdown: a URL that could close the angle-bracket destination is percent-encoded", () => {
    const crafted = "https://x.example/a b>[click](javascript:alert(1))\\>";
    const cv = makeCv();
    const pubs = cv.sections.find((s) => s.type === "publications")!;
    const edited = {
      ...cv,
      sections: cv.sections.map((s) =>
        s.id !== pubs.id
          ? s
          : {
              ...s,
              visible: false,
              items: s.items.map((it) => ({
                ...it,
                meta: { ...it.meta, entryUrlOverride: crafted },
              })),
            },
      ),
    };
    const md = evidenceMarkdown(edited, "See [[W1]].", {});
    expect(md).toBe(
      "See [Chrétien 2022](<https://x.example/a%20b%3E[click]%28javascript:alert%281%29%29%5C%3E>).",
    );
    expect(md).not.toContain("](javascript:");
  });

  it.skipIf(!hasApa)("Markdown and DOCX carry the DOI link for an unlisted entry", async () => {
    const md = renderCvMarkdown(frqCv());
    expect(md).toContain("[Chrétien 2022](<https://doi.org/10.0000/fictif.1>)");
    expect(md).toContain("(PhD: Priya Kaur)");
    const zip = await JSZip.loadAsync(await renderCvDocxBuffer(frqCv()));
    const doc = await zip.file("word/document.xml")!.async("string");
    const rels = await zip.file("word/_rels/document.xml.rels")!.async("string");
    expect(doc).toContain("(Chrétien 2022)");
    expect(rels).toContain("https://doi.org/10.0000/fictif.1");
  });
});
