import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { profilePageJsonLd } from "@/lib/cv/publicJsonLd";
import type { CanonicalCv, CvItem, CvSection } from "@/lib/canonical/schema";

function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "j",
    resolved: {
      orcid: "0000-0002-7483-2489",
      authorIds: ["A5001069481"],
      displayName: "Basile Chrétien",
    },
    works: [],
    now: "2026-06-02T00:00:00.000Z",
  });
}

function mkItem(p: Partial<CvItem> & { id: string }): CvItem {
  return {
    source: "datacite",
    sourceId: p.id,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    meta: {},
    ...p,
  } as CvItem;
}

function withSections(cv: CanonicalCv, items: CvItem[]): CanonicalCv {
  const section: CvSection = {
    id: "datasets",
    type: "datasets",
    title: "Datasets & Software",
    visible: true,
    order: 0,
    items,
  };
  return { ...cv, sections: [section], display: { ...cv.display, sectionsCustomized: true } };
}

function worksOf(cv: CanonicalCv) {
  return JSON.parse(profilePageJsonLd(cv, "s")).mainEntity["@reverse"]?.author ?? [];
}

const SWHID = `swh:1:snp:${"a".repeat(40)}`;

describe("public JSON-LD — Software Heritage identifier", () => {
  it("adds the SWHID alongside a DOI identifier on a SoftwareSourceCode node", () => {
    const cv = withSections(makeCv(), [
      mkItem({
        id: "s1",
        csl: { id: "s1", type: "article", title: "My tool" },
        meta: { type: "Software", doi: "10.5281/zenodo.1", swhid: SWHID },
      }),
    ]);
    const [work] = worksOf(cv);
    expect(work["@type"]).toBe("SoftwareSourceCode");
    expect(work.identifier).toEqual(["https://doi.org/10.5281/zenodo.1", SWHID]);
    expect(work.sameAs).toEqual([
      "https://doi.org/10.5281/zenodo.1",
      `https://archive.softwareheritage.org/${SWHID}`,
    ]);
  });

  it("sets the SWHID as the sole identifier when the item has no DOI", () => {
    const cv = withSections(makeCv(), [
      mkItem({
        id: "s1",
        csl: { id: "s1", type: "article", title: "My tool" },
        meta: { type: "Software", swhid: SWHID },
      }),
    ]);
    const [work] = worksOf(cv);
    expect(work.identifier).toBe(SWHID);
    expect(work.sameAs).toEqual([`https://archive.softwareheritage.org/${SWHID}`]);
  });

  it("does not add a swhid identifier to a plain Dataset node", () => {
    const cv = withSections(makeCv(), [
      mkItem({
        id: "d1",
        csl: { id: "d1", type: "dataset", title: "My dataset" },
        // A "Dataset"-typed item carrying a swhid (shouldn't normally happen —
        // the enrichment only targets software items) must still be ignored here.
        meta: { type: "Dataset", doi: "10.5281/zenodo.2", swhid: SWHID },
      }),
    ]);
    const [work] = worksOf(cv);
    expect(work["@type"]).toBe("Dataset");
    expect(work.identifier).toBe("https://doi.org/10.5281/zenodo.2");
  });

  it("omits identifier/sameAs entirely for a software item with neither a DOI nor a swhid", () => {
    const cv = withSections(makeCv(), [
      mkItem({
        id: "s1",
        csl: { id: "s1", type: "article", title: "My tool" },
        meta: { type: "Software" },
      }),
    ]);
    const [work] = worksOf(cv);
    expect(work.identifier).toBeUndefined();
    expect(work.sameAs).toBeUndefined();
  });
});
