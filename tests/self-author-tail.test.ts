import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import { renderCvDocxBuffer } from "@/lib/render/docx";
import { buildRenderedSections, renderCvHtml } from "@/lib/render/html";
import { renderCvLatex } from "@/lib/render/latex";
import { renderCvMarkdown } from "@/lib/render/markdown";
import { selfAuthorTail, withSelfAuthorTail } from "@/lib/render/selfTail";

const styles = listAvailableStyles();
const hasStyles = styles.includes("chicago-author-date") && styles.includes("apa");

const SELF = "https://openalex.org/A5001069481";
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

/** A 12-author work with the account holder at 1-based `position`. */
function work(position: number, total = 12): OpenAlexWork {
  const authorships = Array.from({ length: total }, (_, i) =>
    i === position - 1
      ? {
          author: { id: SELF, display_name: "Basile Chrétien" },
          raw_author_name: "Basile Chrétien",
        }
      : {
          author: { id: `https://openalex.org/A${9000 + i}`, display_name: `Coauthor Number${i}` },
          raw_author_name: `Coauthor Number${i}`,
        },
  );
  return {
    id: "https://openalex.org/W1",
    doi: "https://doi.org/10.1/tail",
    title: "A twelve-author study",
    display_name: "A twelve-author study",
    type: "article",
    publication_year: 2024,
    authorships,
    primary_location: { source: { display_name: "Journal A", type: "journal" } },
  } as unknown as OpenAlexWork;
}

function makeCv(position: number, cslStyle: string): CanonicalCv {
  const cv = buildCanonicalCv({
    id: "tail",
    resolved,
    works: [work(position)],
    now: "2026-06-02T00:00:00.000Z",
  });
  return { ...cv, display: { ...cv.display, cslStyle } };
}

const pubHtml = (cv: CanonicalCv, extras = false): string =>
  buildRenderedSections(cv, extras ? { publicExtras: true, slug: "abc" } : undefined).find(
    (s) => s.section.type === "publications",
  )!.items[0]!.html;

// Each case runs citeproc at least once (~1–2 s, far more under coverage contention).
describe.skipIf(!hasStyles)(
  "owner past the et-al cut (needs vendored CSL assets)",
  { timeout: 120_000 },
  () => {
    it("appends the tail when Chicago truncates the author list before the owner", () => {
      const cv = makeCv(9, "chicago-author-date");
      const item = cv.sections.find((s) => s.type === "publications")!.items[0]!;
      expect(item.meta.authorPosition).toBe(9);
      expect(item.meta.authorCount).toBe(12);

      const html = pubHtml(cv);
      // Chicago author-date prints the first three of seven-plus authors, then "et al."
      expect(html).toContain("et al.");
      expect(html).toContain('<span class="cv-self-tail">[incl. B. ');
      expect(html).toContain("author 9 of 12]</span>");
      // The identifier-driven highlight still marks the owner — inside the tail.
      expect(html).toContain('<span class="cv-self">Chrétien</span>');
      // The tail sits INSIDE citeproc's entry wrapper, running on from the citation.
      expect(html).toMatch(/author 9 of 12\]<\/span><\/div>/);
    });

    it("never fires when the owner is printed (first author under Chicago; any author under APA's 20-author limit)", () => {
      expect(pubHtml(makeCv(1, "chicago-author-date"))).not.toContain("cv-self-tail");
      expect(renderCvHtml(makeCv(9, "apa"))).not.toContain("cv-self-tail");
    });

    it("sits INSIDE the entry, ahead of the public per-item tools", () => {
      const html = pubHtml(makeCv(9, "chicago-author-date"), true);
      const tail = html.indexOf('class="cv-self-tail"');
      const tools = html.indexOf('class="cv-itemtools"');
      expect(tail).toBeGreaterThan(-1);
      expect(tools).toBeGreaterThan(tail);
    });

    it("renders as plain text in Markdown, LaTeX and DOCX through the shared prepare path", async () => {
      const cv = makeCv(9, "chicago-author-date");
      const md = renderCvMarkdown(cv);
      expect(md).toContain("author 9 of 12\\]");
      expect(md).toContain("**Chrétien**");
      expect(md).not.toContain("cv-self-tail");

      const tex = renderCvLatex(cv);
      expect(tex).toContain("author 9 of 12]");
      expect(tex).not.toContain("cv-self-tail");

      const zip = await JSZip.loadAsync(await renderCvDocxBuffer(cv));
      const xml = await zip.file("word/document.xml")!.async("string");
      expect(xml).toContain("author 9 of 12]");
      expect(xml).toContain("[incl. B. ");
    });

    it("uses the owner's preferred publication name when one is set", () => {
      const base = makeCv(9, "chicago-author-date");
      const cv: CanonicalCv = {
        ...base,
        owner: { ...base.owner, publicationName: { family: "Peyro-Saint-Paul", given: "Laure" } },
      };
      // (The highlight marks the renamed family inside the tail.)
      expect(pubHtml(cv)).toMatch(
        /\[incl\. L\. <span class="cv-self">Peyro-Saint-Paul<\/span>, author 9 of 12\]/,
      );
    });

    it("is localized", () => {
      const base = makeCv(9, "chicago-author-date");
      const fr = { ...base, display: { ...base.display, locale: "fr-FR" } };
      expect(renderCvMarkdown(fr)).toContain("dont B. **Chrétien**, auteur 9 sur 12");
    });
  },
);

describe("selfAuthorTail (unit)", () => {
  const item = (over: Partial<CvItem> & { meta?: Partial<CvItem["meta"]> }): CvItem =>
    ({
      id: "W1",
      type: "publication",
      included: true,
      authoredBySelf: true,
      selfNameVariants: ["Chrétien"],
      csl: {
        id: "W1",
        type: "article-journal",
        author: [
          { family: "Alpha", given: "Ann" },
          { family: "Chrétien", given: "Basile Jean-Bernard" },
        ],
      },
      ...over,
      meta: { authorPosition: 2, authorCount: 2, ...(over.meta ?? {}) },
    }) as unknown as CvItem;
  const ENTRY = "Alpha, A. et al. 2024. A study.";

  it("builds a bracketed tail with hyphen-aware initials, in HTML and text form", () => {
    expect(selfAuthorTail(item({}), ENTRY, "en-US", "html")).toBe(
      ' <span class="cv-self-tail">[incl. B. J.-B. Chrétien, author 2 of 2]</span>',
    );
    expect(selfAuthorTail(item({}), ENTRY, "en-US", "text")).toBe(
      " [incl. B. J.-B. Chrétien, author 2 of 2]",
    );
  });

  it("is silent when the owner's name is printed — by any known variant, case-insensitively, text only", () => {
    expect(selfAuthorTail(item({}), "Alpha, A., and B. CHRÉTIEN. 2024.", "en-US", "html")).toBe("");
    expect(
      selfAuthorTail(
        item({ selfNameVariants: ["B. Chrétien"] }),
        "Alpha & B. Chrétien",
        "en-US",
        "text",
      ),
    ).toBe("");
    // A name inside a tag/attribute is not "printed".
    expect(
      selfAuthorTail(
        item({}),
        '<a href="https://x.org/Chr%C3%A9tien" title="Chrétien">Alpha</a>',
        "en-US",
        "html",
      ),
    ).not.toBe("");
    // Word boundaries: "Li" is not printed inside "Library".
    expect(
      selfAuthorTail(
        item({
          selfNameVariants: ["Li"],
          csl: {
            id: "W1",
            type: "article-journal",
            author: [{ family: "A" }, { family: "Li" }],
          } as never,
        }),
        "A. et al. The Library.",
        "en-US",
        "text",
      ),
    ).toBe(" [incl. Li, author 2 of 2]");
  });

  it("never fires without an identifier-derived position, an author list, or for a disowned/empty entry", () => {
    expect(
      selfAuthorTail(item({ meta: { authorPosition: undefined } }), ENTRY, "en-US", "html"),
    ).toBe("");
    expect(selfAuthorTail(item({ meta: { authorPosition: 0 } }), ENTRY, "en-US", "html")).toBe("");
    expect(selfAuthorTail(item({ meta: { authorPosition: 3 } }), ENTRY, "en-US", "html")).toBe("");
    expect(
      selfAuthorTail(item({ meta: { authorCount: 1, authorPosition: 1 } }), ENTRY, "en-US", "html"),
    ).toBe("");
    expect(selfAuthorTail(item({ csl: undefined }), ENTRY, "en-US", "html")).toBe("");
    expect(selfAuthorTail(item({ notMine: true }), ENTRY, "en-US", "html")).toBe("");
    expect(selfAuthorTail(item({}), "", "en-US", "html")).toBe("");
    // No CSL author at the position: a position past the CSL list, whether the
    // count falls back to that list (position > count) or a stored authorCount
    // exceeds the CSL list actually carried (the author lookup comes back empty).
    expect(
      selfAuthorTail(
        item({ meta: { authorCount: undefined, authorPosition: 5 } }),
        ENTRY,
        "en-US",
        "html",
      ),
    ).toBe("");
    expect(
      selfAuthorTail(
        item({ meta: { authorCount: 12, authorPosition: 5 } }),
        ENTRY,
        "en-US",
        "html",
      ),
    ).toBe("");
    expect(
      selfAuthorTail(
        item({
          csl: { id: "W1", type: "article-journal", author: [{ family: "Alpha" }, {}] } as never,
        }),
        ENTRY,
        "en-US",
        "html",
      ),
    ).toBe("");
  });

  it("falls back to authorCount from the CSL list, a bare family, or a literal name", () => {
    expect(selfAuthorTail(item({ meta: { authorCount: undefined } }), ENTRY, "en-US", "text")).toBe(
      " [incl. B. J.-B. Chrétien, author 2 of 2]",
    );
    expect(
      selfAuthorTail(
        item({
          csl: {
            id: "W1",
            type: "article-journal",
            author: [{ family: "Alpha" }, { family: "Chrétien" }],
          } as never,
        }),
        ENTRY,
        "en-US",
        "text",
      ),
    ).toBe(" [incl. Chrétien, author 2 of 2]");
    const literal = item({
      selfNameVariants: [],
      csl: {
        id: "W1",
        type: "article-journal",
        author: [{ family: "Alpha" }, { literal: "Consortium X" }],
      } as never,
    });
    expect(selfAuthorTail(literal, ENTRY, "en-US", "text")).toBe(
      " [incl. Consortium X, author 2 of 2]",
    );
    expect(selfAuthorTail(literal, "Alpha, A., and Consortium X.", "en-US", "text")).toBe("");
    // A one-letter literal has no matchable form → treated as not printed.
    const one = item({
      selfNameVariants: [],
      csl: {
        id: "W1",
        type: "article-journal",
        author: [{ family: "Alpha" }, { literal: "X" }],
      } as never,
    });
    expect(selfAuthorTail(one, "Alpha, A., and X.", "en-US", "text")).toBe(
      " [incl. X, author 2 of 2]",
    );
  });

  it("withSelfAuthorTail places the tail inside a trailing csl-entry wrapper, else appends", () => {
    expect(
      withSelfAuthorTail(
        item({}),
        '<div class="csl-entry">Alpha, A. et al.</div>\n',
        "en-US",
        "html",
      ),
    ).toBe(
      '<div class="csl-entry">Alpha, A. et al. <span class="cv-self-tail">[incl. B. J.-B. Chrétien, author 2 of 2]</span></div>\n',
    );
    expect(withSelfAuthorTail(item({}), ENTRY, "en-US", "text")).toBe(
      `${ENTRY} [incl. B. J.-B. Chrétien, author 2 of 2]`,
    );
    expect(withSelfAuthorTail(item({ notMine: true }), ENTRY, "en-US", "text")).toBe(ENTRY);
  });

  it("escapes the HTML form", () => {
    const evil = item({
      selfNameVariants: [],
      csl: {
        id: "W1",
        type: "article-journal",
        author: [{ family: "Alpha" }, { family: "<b>Z</b>" }],
      } as never,
    });
    const out = selfAuthorTail(evil, ENTRY, "en-US", "html");
    expect(out).toContain("&lt;b&gt;Z&lt;/b&gt;");
    expect(out).not.toContain("<b>");
  });
});
