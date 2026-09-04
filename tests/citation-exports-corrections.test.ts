import { describe, expect, it } from "vitest";
import { citeItem } from "@/lib/cv/citeItem";
import { renderCvBibtex } from "@/lib/render/bibtex";
import { citationCslItems, citationItems } from "@/lib/render/citationItems";
import { cvCslItems } from "@/lib/render/csljson";
import { prepareSections } from "@/lib/render/prepare";
import { DEFAULT_STYLE } from "@/lib/citeproc/assets";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import type { CslItem } from "@/types/csl";

/**
 * The machine citation exports (BibTeX / CSL-JSON / RIS / the public "Cite"
 * button) must list exactly the works the rendered CV lists, with the owner's
 * corrections applied — the same chokepoint every visual renderer uses. Before
 * this suite they read `item.csl` raw, so a corrected year, venue or publication
 * name showed on the PDF but not in the .bib a reference manager imported.
 */

const OLD: CslItem = {
  id: "W1",
  type: "article-journal",
  title: "A test paper",
  author: [
    { family: "Smith", given: "Jane" },
    { family: "Doe", given: "John" },
  ],
  "container-title": "Old Journal Name",
  issued: { "date-parts": [[2019, 3, 1]] },
  DOI: "10.1/old",
};
const RETRACTED: CslItem = {
  id: "W2",
  type: "article-journal",
  title: "A retracted paper",
  author: [{ family: "Smith", given: "Jane" }],
  "container-title": "Some Journal",
  issued: { "date-parts": [[2020]] },
};
const EXCLUDED: CslItem = {
  id: "W3",
  type: "article-journal",
  title: "A paper hidden from this view",
  author: [{ family: "Smith", given: "Jane" }],
  "container-title": "Some Journal",
  issued: { "date-parts": [[2021]] },
};

function item(csl: CslItem, meta: CvItem["meta"], order: number): CvItem {
  return {
    id: csl.id,
    source: "openalex",
    sourceId: csl.id,
    csl,
    included: true,
    notMine: false,
    order,
    authoredBySelf: true,
    selfNameVariants: ["Jane Smith"],
    meta,
  } as unknown as CvItem;
}

function cv(display: Record<string, unknown> = {}): CanonicalCv {
  return {
    owner: {
      displayName: "Jane Smith",
      publicationName: { family: "Nishikawa-Pacher" },
    },
    display: { locale: "en-US", cslStyle: DEFAULT_STYLE, ...display },
    sections: [
      {
        id: "publications",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items: [
          item(
            OLD,
            {
              authorPosition: 1,
              year: 2019,
              yearOverride: 2022,
              venueOverride: "Corrected Journal",
            },
            0,
          ),
          item(RETRACTED, { authorPosition: 1, year: 2020, retracted: true }, 1),
          item(EXCLUDED, { authorPosition: 1, year: 2021 }, 2),
        ],
      },
    ],
  } as unknown as CanonicalCv;
}

describe("citation exports apply the owner's corrections", () => {
  it("BibTeX carries the corrected year, venue and publication name", () => {
    const bib = renderCvBibtex(cv());
    expect(bib).toContain("year = {2022}");
    expect(bib).toContain("journal = {Corrected Journal}");
    expect(bib).toContain("author = {Nishikawa-Pacher, Jane and Doe, John}");
    expect(bib).not.toContain("Old Journal Name");
    expect(bib).not.toContain("2019");
  });

  it("CSL-JSON carries the same corrections", () => {
    const [first] = cvCslItems(cv());
    expect(first?.id).toBe("W1");
    expect(first?.issued).toEqual({ "date-parts": [[2022]] });
    expect(first?.["container-title"]).toBe("Corrected Journal");
    expect(first?.author?.[0]).toMatchObject({ family: "Nishikawa-Pacher", given: "Jane" });
  });

  it("the single-work Cite affordance carries them in every format", () => {
    const c = cv();
    expect(citeItem(c, "W1", "bibtex")?.body).toContain("year = {2022}");
    expect(citeItem(c, "W1", "bibtex")?.body).toContain("Nishikawa-Pacher, Jane");
    expect(citeItem(c, "W1", "ris")?.body).toContain("PY  - 2022");
    expect(citeItem(c, "W1", "ris")?.body).toContain("T2  - Corrected Journal");
    expect(citeItem(c, "W1", "ris")?.body).toContain("AU  - Nishikawa-Pacher, Jane");
    const json = JSON.parse(citeItem(c, "W1", "csljson")!.body) as CslItem;
    expect(json.issued).toEqual({ "date-parts": [[2022]] });
  });

  it("matches what the visual renderers print for the same item", () => {
    const [section] = prepareSections(cv(), "text");
    const entry = section?.items.find((p) => p.item.id === "W1")?.entry ?? "";
    expect(entry).toContain("2022");
    expect(entry).toContain("Corrected Journal");
    expect(entry).toContain("Nishikawa-Pacher");
    expect(entry).not.toContain("Smith");
  });

  it("leaves the canonical object untouched (pure)", () => {
    const c = cv();
    const before = JSON.stringify(c);
    renderCvBibtex(c);
    cvCslItems(c);
    citeItem(c, "W1", "csljson");
    expect(JSON.stringify(c)).toBe(before);
  });
});

describe("citation exports list exactly what the rendered CV lists", () => {
  it("drops a work hidden from this view (display.excludedItems) in every export", () => {
    const c = cv({ excludedItems: { publications: ["W3"] } });
    expect(citationItems(c).map((i) => i.id)).toEqual(["W1", "W2"]);
    expect(renderCvBibtex(c)).not.toContain("hidden from this view");
    expect(cvCslItems(c).map((i) => i.id)).toEqual(["W1", "W2"]);
    expect(citeItem(c, "W3", "bibtex")).toBeNull();
  });

  it("honours hideRetracted in BibTeX exactly as in CSL-JSON", () => {
    const c = cv({ hideRetracted: true });
    expect(renderCvBibtex(c)).not.toContain("A retracted paper");
    expect(cvCslItems(c).map((i) => i.id)).toEqual(["W1", "W3"]);
    expect(citeItem(c, "W2", "ris")).toBeNull();
    // Off (default): the retracted work is listed, as on the CV.
    expect(renderCvBibtex(cv())).toContain("A retracted paper");
  });

  it("honours the publication order and the Selected-publications cap", () => {
    const c = cv({ publicationOrder: "year-desc", publicationsLimit: 2 });
    expect(citationCslItems(c).map((i) => i.id)).toEqual(["W1", "W3"]);
    const bib = renderCvBibtex(c);
    expect(bib.indexOf("A test paper")).toBeLessThan(bib.indexOf("hidden from this view"));
    expect(bib).not.toContain("A retracted paper");
  });
});
