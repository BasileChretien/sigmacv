import { describe, expect, it } from "vitest";
import { citeItem, isCiteFormat, CITE_FORMATS } from "@/lib/cv/citeItem";
import { cslItemsToRis, cslToRis } from "@/lib/render/ris";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { CslItem } from "@/types/csl";

const csl = (over: Partial<CslItem> = {}): CslItem => ({
  id: "W1",
  type: "article-journal",
  title: "A study of things",
  author: [{ family: "Chrétien", given: "Basile" }],
  issued: { "date-parts": [[2024, 5, 1]] },
  "container-title": "Journal of Things",
  volume: "3",
  issue: "2",
  page: "10-20",
  DOI: "10.1/abc",
  URL: "https://doi.org/10.1/abc",
  ...over,
});

function cvWith(items: { id: string; csl?: CslItem }[]): CanonicalCv {
  return {
    sections: [
      {
        id: "publications",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items: items.map((it, i) => ({
          id: it.id,
          source: "openalex",
          sourceId: it.id,
          csl: it.csl,
          included: true,
          notMine: false,
          order: i,
          authoredBySelf: true,
          selfNameVariants: [],
          meta: {},
        })),
      },
    ],
  } as unknown as CanonicalCv;
}

describe("isCiteFormat", () => {
  it("accepts only the supported formats", () => {
    expect(CITE_FORMATS).toContain("bibtex");
    expect(isCiteFormat("bibtex")).toBe(true);
    expect(isCiteFormat("ris")).toBe(true);
    expect(isCiteFormat("csljson")).toBe(true);
    expect(isCiteFormat("xml")).toBe(false);
  });
});

describe("citeItem", () => {
  const cv = cvWith([
    { id: "W1", csl: csl() },
    { id: "Pos", csl: undefined },
  ]);

  it("serializes one work to BibTeX", () => {
    const out = citeItem(cv, "W1", "bibtex")!;
    expect(out.extension).toBe("bib");
    expect(out.contentType).toContain("x-bibtex");
    expect(out.body).toContain("@article{");
    expect(out.body).toContain("A study of things");
  });

  it("serializes one work to RIS", () => {
    const out = citeItem(cv, "W1", "ris")!;
    expect(out.extension).toBe("ris");
    expect(out.body.startsWith("TY  - JOUR")).toBe(true);
    expect(out.body).toContain("ER  - ");
  });

  it("serializes one work to CSL-JSON", () => {
    const out = citeItem(cv, "W1", "csljson")!;
    expect(out.extension).toBe("csl.json");
    expect(JSON.parse(out.body).title).toBe("A study of things");
  });

  it("returns null for a missing id or a non-citation item", () => {
    expect(citeItem(cv, "nope", "bibtex")).toBeNull();
    expect(citeItem(cv, "Pos", "bibtex")).toBeNull();
  });
});

describe("cslToRis / cslItemsToRis", () => {
  it("maps core fields, splitting a page range into SP/EP", () => {
    const ris = cslToRis(csl());
    expect(ris).toContain("AU  - Chrétien, Basile");
    expect(ris).toContain("TI  - A study of things");
    expect(ris).toContain("T2  - Journal of Things");
    expect(ris).toContain("PY  - 2024");
    expect(ris).toContain("VL  - 3");
    expect(ris).toContain("SP  - 10");
    expect(ris).toContain("EP  - 20");
    expect(ris).toContain("DO  - 10.1/abc");
  });

  it("uses a literal author name and a single page, and an abstract", () => {
    const ris = cslToRis(
      csl({ author: [{ literal: "WHO Collaborators" }], page: "42", abstract: "Short abstract." }),
    );
    expect(ris).toContain("AU  - WHO Collaborators");
    expect(ris).toContain("SP  - 42");
    expect(ris).not.toContain("EP  - ");
    expect(ris).toContain("AB  - Short abstract.");
  });

  it("maps types and falls back to GEN for unknown", () => {
    expect(cslToRis(csl({ type: "dataset" }))).toContain("TY  - DATA");
    expect(cslToRis(csl({ type: "weird-thing" }))).toContain("TY  - GEN");
  });

  it("concatenates multiple records", () => {
    const doc = cslItemsToRis([csl({ id: "A" }), csl({ id: "B" })]);
    expect(doc.match(/TY {2}- JOUR/g)?.length).toBe(2);
  });

  it("omits empty fields and works with no authors", () => {
    const ris = cslToRis({ id: "X", type: "article-journal", title: "Bare" });
    expect(ris).toContain("TI  - Bare");
    expect(ris).toContain("ER  - ");
    expect(ris).not.toContain("AU  - ");
    expect(ris).not.toContain("DO  - ");
    expect(ris).not.toContain("SP  - ");
  });

  it("renders a family-only author name", () => {
    expect(cslToRis(csl({ author: [{ family: "Curie" }] }))).toContain("AU  - Curie");
  });
});
