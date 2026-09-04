import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  MAX_DATA_LINKS,
  attachDataciteLinks,
  inferDataLinkKind,
  isDataRepositoryDoi,
  isRepositoryUrl,
  mergeDataLinks,
  toDataLink,
  withDataLinks,
} from "@/lib/canonical/dataLinks";
import { DisplayChoicesSchema } from "@/lib/canonical/schema";
import type { CanonicalCv, CvItem, DataLink } from "@/lib/canonical/schema";
import type { DataciteOutput } from "@/lib/datacite/client";
import type { OpenAlexWork } from "@/lib/openalex/types";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import worksFixture from "./fixtures/openalex-works.json";

// ─── fixtures ────────────────────────────────────────────────────────────────

function link(over: Partial<DataLink> & Pick<DataLink, "id" | "scheme" | "url">): DataLink {
  return { kind: "dataset", ...over };
}

function pub(id: string, doi?: string, meta: CvItem["meta"] = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: id,
    csl: { id, type: "article-journal", title: `Title ${id}`, ...(doi ? { DOI: doi } : {}) },
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    meta,
  };
}

function makeCv(items: CvItem[]): CanonicalCv {
  return {
    schemaVersion: 2,
    id: "x",
    owner: {
      orcid: "0000-0002-7483-2489",
      openAlexAuthorIds: [],
      displayName: "X",
      links: [],
      countsByYear: [],
    },
    display: DisplayChoicesSchema.parse({}),
    sections: [
      { id: "publications", type: "publications", title: "P", visible: true, order: 0, items },
    ],
    presets: [],
    provenance: { generatedAt: "t0", lastSyncedAt: "t0", sources: ["openalex"] },
  };
}

// ─── kind inference ──────────────────────────────────────────────────────────

describe("inferDataLinkKind", () => {
  it("classes code hosts and software archives as software", () => {
    expect(inferDataLinkKind({ scheme: "swh", url: "https://x" })).toBe("software");
    expect(inferDataLinkKind({ scheme: "GitHub", url: "https://x" })).toBe("software");
    expect(inferDataLinkKind({ scheme: "url", url: "https://github.com/org/repo" })).toBe(
      "software",
    );
    expect(inferDataLinkKind({ scheme: "url", url: "https://gitlab.com/org/repo" })).toBe(
      "software",
    );
    expect(inferDataLinkKind({ scheme: "url", url: "https://codeberg.org/o/r" })).toBe("software");
    expect(
      inferDataLinkKind({ scheme: "url", url: "https://archive.softwareheritage.org/swh:1:dir:x" }),
    ).toBe("software");
  });

  it("classes accession schemes and data-repository DOIs as dataset", () => {
    expect(inferDataLinkKind({ scheme: "GEO", url: "https://x" })).toBe("dataset");
    expect(inferDataLinkKind({ scheme: "pdb" })).toBe("dataset");
    expect(inferDataLinkKind({ scheme: "UniProt" })).toBe("dataset");
    expect(inferDataLinkKind({ scheme: "doi", id: "10.5281/zenodo.1" })).toBe("dataset");
    expect(inferDataLinkKind({ scheme: "doi", id: "10.5061/dryad.abc" })).toBe("dataset");
    expect(inferDataLinkKind({ scheme: "doi", id: "10.17605/osf.io/abc" })).toBe("dataset");
    expect(inferDataLinkKind({ scheme: "url", url: "https://osf.io/abc" })).toBe("dataset");
    expect(inferDataLinkKind({ scheme: "url", url: "https://zenodo.org/records/1" })).toBe(
      "dataset",
    );
  });

  it("falls back to the source category, then to other", () => {
    expect(inferDataLinkKind({ scheme: "x", category: "Software tools" })).toBe("software");
    expect(inferDataLinkKind({ scheme: "x", category: "Nucleotide Sequences" })).toBe("dataset");
    expect(inferDataLinkKind({ scheme: "x", category: "Lab Protocols" })).toBe("other");
    expect(inferDataLinkKind({ scheme: "doi", id: "10.1000/journal.article" })).toBe("other");
    expect(inferDataLinkKind({ scheme: "x" })).toBe("other");
  });
});

describe("isDataRepositoryDoi / isRepositoryUrl", () => {
  it("recognises known repository DOI prefixes, never figshare", () => {
    expect(isDataRepositoryDoi("https://doi.org/10.5281/ZENODO.42")).toBe(true);
    expect(isDataRepositoryDoi("10.7910/DVN/ABC")).toBe(true);
    expect(isDataRepositoryDoi("10.6084/m9.figshare.123")).toBe(false);
    expect(isDataRepositoryDoi("10.1000/xyz")).toBe(false);
    expect(isDataRepositoryDoi("")).toBe(false);
    expect(isDataRepositoryDoi(undefined)).toBe(false);
  });

  it("recognises repository / code-host URLs, never figshare", () => {
    expect(isRepositoryUrl("https://github.com/o/r")).toBe(true);
    expect(isRepositoryUrl("https://datadryad.org/stash/dataset/x")).toBe(true);
    expect(isRepositoryUrl("https://figshare.com/articles/1")).toBe(false);
    expect(isRepositoryUrl("https://example.org/paper")).toBe(false);
    expect(isRepositoryUrl("")).toBe(false);
    expect(isRepositoryUrl(null)).toBe(false);
  });
});

// ─── toDataLink ──────────────────────────────────────────────────────────────

describe("toDataLink", () => {
  it("normalises a DOI link to the canonical doi.org URL and infers its kind", () => {
    expect(
      toDataLink({ id: "https://doi.org/10.5281/Zenodo.9", scheme: "DOI", url: "https://z" }),
    ).toEqual({
      id: "10.5281/zenodo.9",
      scheme: "doi",
      url: "https://doi.org/10.5281/zenodo.9",
      kind: "dataset",
    });
  });

  it("keeps an accession link with its source URL, title and category-driven kind", () => {
    expect(
      toDataLink({
        id: " GSE1 ",
        scheme: "GEO",
        url: "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE1",
        title: " Expression data ",
        category: "Gene Expression",
      }),
    ).toEqual({
      id: "GSE1",
      scheme: "geo",
      url: "https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=GSE1",
      title: "Expression data",
      kind: "dataset",
    });
  });

  it("rejects links without an id/scheme/resolvable http(s) URL, and figshare", () => {
    expect(toDataLink({ id: "", scheme: "geo", url: "https://x" })).toBeNull();
    expect(toDataLink({ id: "GSE1", scheme: " ", url: "https://x" })).toBeNull();
    expect(toDataLink({ id: "GSE1", scheme: "geo" })).toBeNull();
    expect(toDataLink({ id: "GSE1", scheme: "geo", url: "ftp://x" })).toBeNull();
    expect(toDataLink({ id: "GSE1", scheme: "geo", url: "javascript:alert(1)" })).toBeNull();
    expect(toDataLink({ id: "doi:", scheme: "doi" })).toBeNull();
    expect(toDataLink({ id: "not a doi", scheme: "doi" })).toBeNull();
    expect(toDataLink({ id: "10.6084/m9.figshare.1", scheme: "doi" })).toBeNull();
    expect(
      toDataLink({ id: "1", scheme: "url", url: "https://figshare.com/articles/1" }),
    ).toBeNull();
  });

  it("truncates over-long fields to the schema caps", () => {
    const out = toDataLink({
      id: "G".repeat(600),
      scheme: "s".repeat(200),
      url: `https://x/${"p".repeat(3000)}`,
      title: "t".repeat(600),
    })!;
    expect(out.id.length).toBe(500);
    expect(out.scheme.length).toBe(100);
    expect(out.url.length).toBe(2048);
    expect(out.title?.length).toBe(500);
  });
});

// ─── merge / dedupe ──────────────────────────────────────────────────────────

describe("mergeDataLinks", () => {
  it("dedupes by DOI and by normalised URL, earlier lists winning", () => {
    const a = link({
      id: "10.5281/zenodo.1",
      scheme: "doi",
      url: "https://doi.org/10.5281/zenodo.1",
    });
    const b = link({ id: "GSE1", scheme: "geo", url: "https://geo/GSE1/", title: "first" });
    const dupDoi = link({
      id: "10.5281/zenodo.1",
      scheme: "doi",
      url: "https://doi.org/10.5281/zenodo.1",
      title: "later title",
    });
    const dupUrl = link({ id: "gse1", scheme: "geo", url: "http://GEO/GSE1", title: "other" });
    const out = mergeDataLinks([a, b], [dupDoi, dupUrl]);
    expect(out).toHaveLength(2);
    // The kept DOI link gains the later title only because it had none.
    expect(out[0]).toEqual({ ...a, title: "later title" });
    expect(out[1]).toBe(b);
  });

  it("caps at MAX_DATA_LINKS", () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      link({ id: `GSE${i}`, scheme: "geo", url: `https://geo/${i}` }),
    );
    expect(mergeDataLinks(many).length).toBe(MAX_DATA_LINKS);
    expect(MAX_DATA_LINKS).toBe(20);
  });
});

describe("withDataLinks", () => {
  it("returns the same item when nothing new is added", () => {
    const a = link({ id: "GSE1", scheme: "geo", url: "https://geo/1" });
    const item = pub("W1", "10.1/x", { dataLinks: [a] });
    expect(withDataLinks(item, [])).toBe(item);
    expect(withDataLinks(item, [{ ...a }])).toBe(item);
  });

  it("merges new links onto the existing ones (immutable)", () => {
    const a = link({ id: "GSE1", scheme: "geo", url: "https://geo/1" });
    const b = link({ id: "GSE2", scheme: "geo", url: "https://geo/2" });
    const item = pub("W1", "10.1/x", { dataLinks: [a] });
    const out = withDataLinks(item, [b]);
    expect(out).not.toBe(item);
    expect(out.meta.dataLinks).toEqual([a, b]);
    expect(item.meta.dataLinks).toEqual([a]);
  });
});

// ─── DataCite: attach deposits to the papers they supplement ─────────────────

describe("attachDataciteLinks", () => {
  const dataset: DataciteOutput = {
    doi: "10.5281/zenodo.100",
    title: "Trial data",
    type: "Dataset",
    linkedDois: ["https://doi.org/10.1/PAPER", "10.5281/zenodo.100"], // self-ref skipped
  };
  const software: DataciteOutput = {
    doi: "10.5281/zenodo.200",
    title: "Analysis code",
    type: "Software",
    linkedDois: ["10.1/paper", "10.1/other"],
  };

  it("attaches the deposit to the matching paper, typed from resourceTypeGeneral", () => {
    const cv = makeCv([pub("W1", "10.1/paper"), pub("W2", "10.1/none"), pub("W3")]);
    const out = attachDataciteLinks(cv, [dataset, software]);
    expect(out).not.toBe(cv);
    const items = out.sections[0]!.items;
    expect(items[0]!.meta.dataLinks).toEqual([
      {
        id: "10.5281/zenodo.100",
        scheme: "doi",
        url: "https://doi.org/10.5281/zenodo.100",
        title: "Trial data",
        kind: "dataset",
      },
      {
        id: "10.5281/zenodo.200",
        scheme: "doi",
        url: "https://doi.org/10.5281/zenodo.200",
        title: "Analysis code",
        kind: "software",
      },
    ]);
    expect(items[1]!.meta.dataLinks).toBeUndefined();
    expect(items[2]!.meta.dataLinks).toBeUndefined();
    // Original untouched.
    expect(cv.sections[0]!.items[0]!.meta.dataLinks).toBeUndefined();
  });

  it("maps notebooks/workflows to software, collections to dataset, else other", () => {
    const mk = (type: string): DataciteOutput => ({
      doi: `10.5281/zenodo.${type}`,
      title: type,
      type,
      linkedDois: ["10.1/paper"],
    });
    const out = attachDataciteLinks(makeCv([pub("W1", "10.1/paper")]), [
      mk("ComputationalNotebook"),
      mk("Collection"),
      mk("Model"),
    ]);
    expect(out.sections[0]!.items[0]!.meta.dataLinks?.map((l) => l.kind)).toEqual([
      "software",
      "dataset",
      "other",
    ]);
  });

  it("returns the same CV when no deposit links to a paper, and skips figshare", () => {
    const cv = makeCv([pub("W1", "10.1/paper")]);
    expect(attachDataciteLinks(cv, [])).toBe(cv);
    expect(
      attachDataciteLinks(cv, [{ doi: "10.5281/zenodo.1", title: "t", type: "Dataset" }]),
    ).toBe(cv);
    expect(
      attachDataciteLinks(cv, [
        {
          doi: "10.6084/m9.figshare.1",
          title: "supp",
          type: "Dataset",
          linkedDois: ["10.1/paper"],
        },
      ]),
    ).toBe(cv);
    // A relation to a DOI not on the CV attaches nothing.
    expect(attachDataciteLinks(cv, [{ ...dataset, linkedDois: ["10.1/elsewhere"] }])).toBe(cv);
    // Already attached → unchanged.
    const attached = attachDataciteLinks(cv, [dataset]);
    expect(attachDataciteLinks(attached, [dataset])).toBe(attached);
  });
});

// ─── build: links carry across re-sync ───────────────────────────────────────

describe("buildCanonicalCv carries data links across re-sync", () => {
  const works = worksFixture as unknown as OpenAlexWork[];
  const resolved: ResolvedAuthor = {
    orcid: "0000-0002-7483-2489",
    authorIds: ["A5001069481", "A5136414971"],
    displayName: "Basile Chrétien",
  };
  const build = (previous?: CanonicalCv) =>
    buildCanonicalCv({ id: "cv", resolved, works, now: "2026-06-02T00:00:00.000Z", previous });

  it("keeps meta.dataLinks / hasDataStatement and a back-filled PMID from the previous CV", () => {
    const first = build();
    const pubs = first.sections.find((s) => s.type === "publications")!;
    const target = pubs.items.find((it) => it.csl && !it.meta.pmid)!;
    const links = [link({ id: "GSE1", scheme: "geo", url: "https://geo/1" })];
    const previous: CanonicalCv = {
      ...first,
      sections: first.sections.map((s) =>
        s.id !== pubs.id
          ? s
          : {
              ...s,
              items: s.items.map((it) =>
                it.id === target.id
                  ? {
                      ...it,
                      meta: {
                        ...it.meta,
                        dataLinks: links,
                        hasDataStatement: true,
                        pmid: "424242",
                      },
                    }
                  : it,
              ),
            },
      ),
    };
    const second = build(previous);
    const again = second.sections
      .find((s) => s.type === "publications")!
      .items.find((it) => it.id === target.id)!;
    expect(again.meta.dataLinks).toEqual(links);
    expect(again.meta.hasDataStatement).toBe(true);
    expect(again.meta.pmid).toBe("424242");
    // A work with no prior finds stays undefined (nothing invented).
    const other = second.sections
      .find((s) => s.type === "publications")!
      .items.find((it) => it.id !== target.id && it.csl)!;
    expect(other.meta.dataLinks).toBeUndefined();
    expect(other.meta.hasDataStatement).toBeUndefined();
  });

  it("prefers OpenAlex's own PMID over a carried one", () => {
    const first = build();
    const withPmid = first.sections
      .find((s) => s.type === "publications")!
      .items.find((it) => it.meta.pmid)!;
    const previous: CanonicalCv = {
      ...first,
      sections: first.sections.map((s) => ({
        ...s,
        items: s.items.map((it) =>
          it.id === withPmid.id ? { ...it, meta: { ...it.meta, pmid: "1" } } : it,
        ),
      })),
    };
    const again = build(previous)
      .sections.find((s) => s.type === "publications")!
      .items.find((it) => it.id === withPmid.id)!;
    expect(again.meta.pmid).toBe(withPmid.meta.pmid);
  });
});

describe("inferDataLinkKind — edge cases", () => {
  it("treats a DOI-scheme link with no id as other", () => {
    expect(inferDataLinkKind({ scheme: "doi" })).toBe("other");
  });
});
