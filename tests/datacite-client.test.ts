import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchDataciteOutputs } from "@/lib/datacite/client";

function res(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

afterEach(() => vi.unstubAllGlobals());

const BODY = {
  data: [
    {
      attributes: {
        doi: "10.5281/ZENODO.1",
        titles: [{ title: "My dataset" }],
        publicationYear: 2023,
        publisher: "Zenodo",
        types: { resourceTypeGeneral: "Dataset" },
      },
    },
    {
      // No publisher, no year → exercises the optional-field branches.
      attributes: {
        doi: "10.5281/zenodo.2",
        titles: [{ title: "My software" }],
        types: { resourceTypeGeneral: "Software" },
      },
    },
    {
      // Article-like → excluded (already covered by Publications).
      attributes: {
        doi: "10.1/article",
        titles: [{ title: "A paper" }],
        types: { resourceTypeGeneral: "JournalArticle" },
      },
    },
    {
      // Duplicate of #1 (DOI differs only by case) → collapsed.
      attributes: {
        doi: "10.5281/zenodo.1",
        titles: [{ title: "dup" }],
        types: { resourceTypeGeneral: "Dataset" },
      },
    },
    {
      // No title (titles absent) → skipped.
      attributes: {
        doi: "10.5281/zenodo.3",
        types: { resourceTypeGeneral: "Dataset" },
      },
    },
  ],
};

describe("fetchDataciteOutputs", () => {
  it("keeps datasets/software, excludes articles, dedups by DOI", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(BODY)),
    );
    const out = await fetchDataciteOutputs("0000-0002-7483-2489");
    expect(out.map((o) => o.type)).toEqual(["Dataset", "Software"]);
    expect(out[0]).toMatchObject({
      title: "My dataset",
      publisher: "Zenodo",
      year: 2023,
      doi: "10.5281/zenodo.1",
    });
    // The software record had no publisher/year.
    expect(out[1]?.publisher).toBeUndefined();
    expect(out[1]?.year).toBeUndefined();
  });

  it("drops journal-minted figshare supplements but keeps real datasets/collections", async () => {
    const body = {
      data: [
        {
          // A BMC "Additional file N of <article>" — supplement, not a dataset.
          attributes: {
            doi: "10.6084/m9.figshare.32943867",
            titles: [{ title: "Additional file 3 of Influence of learning activities…" }],
            publisher: "figshare",
            types: { resourceTypeGeneral: "Dataset" },
          },
        },
        {
          // A Springer/Nature "Supplementary information" doc — supplement.
          attributes: {
            doi: "10.6084/m9.figshare.99",
            titles: [{ title: "Supplementary Information 1" }],
            publisher: "figshare",
            types: { resourceTypeGeneral: "Dataset" },
          },
        },
        {
          // The figshare COLLECTION that bundles a paper's supplements (title = the
          // article) — detected via the "figshare" publisher name.
          attributes: {
            doi: "10.6084/m9.figshare.c.8583732",
            titles: [{ title: "Influence of learning activities… the Pharmaquest study" }],
            publisher: "figshare",
            types: { resourceTypeGeneral: "Collection" },
          },
        },
        {
          // Another figshare collection with no publisher → detected via the
          // 10.6084/…figshare… DOI namespace instead.
          attributes: {
            doi: "10.6084/m9.figshare.c.7000000",
            titles: [{ title: "Another paper's supplement collection" }],
            types: { resourceTypeGeneral: "Collection" },
          },
        },
        {
          // A NON-figshare Collection (e.g. a curated data collection) → kept.
          attributes: {
            doi: "10.5281/zenodo.collection",
            titles: [{ title: "A curated dataset collection" }],
            publisher: "Zenodo",
            types: { resourceTypeGeneral: "Collection" },
          },
        },
        {
          // A REAL figshare dataset with a normal title → kept (we drop supplements,
          // not everything on figshare).
          attributes: {
            doi: "10.6084/m9.figshare.realdata",
            titles: [{ title: "Raw survey responses" }],
            publisher: "figshare",
            types: { resourceTypeGeneral: "Dataset" },
          },
        },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(body)),
    );
    const out = await fetchDataciteOutputs("0000-0002-7483-2489");
    expect(out.map((o) => o.title)).toEqual([
      "A curated dataset collection", // non-figshare collection survives
      "Raw survey responses", // real figshare dataset survives
    ]);
  });

  it("queries DataCite by the user's ORCID", async () => {
    const f = vi.fn(async (_url: URL | string) => res({ data: [] }));
    vi.stubGlobal("fetch", f);
    await fetchDataciteOutputs("https://orcid.org/0000-0002-7483-2489");
    expect(String(f.mock.calls[0]?.[0])).toContain("0000-0002-7483-2489");
  });

  it("matches BOTH the URL and bare forms of the ORCID nameIdentifier", async () => {
    // Zenodo (passing through a bare `.zenodo.json` orcid) registers the ORCID as
    // the bare "0000-…" value, while others use the "https://orcid.org/…" URL form;
    // the indexed value is matched verbatim, so querying only the URL form silently
    // misses every record stored bare. The query must cover both.
    const f = vi.fn(async (_url: URL | string) => res({ data: [] }));
    vi.stubGlobal("fetch", f);
    await fetchDataciteOutputs("0000-0002-7483-2489");
    const q = decodeURIComponent(String(f.mock.calls[0]?.[0]));
    expect(q).toContain('"https://orcid.org/0000-0002-7483-2489"'); // URL form
    expect(q).toContain('"0000-0002-7483-2489"'); // bare form (quote-delimited)
  });

  it("fails soft on an API error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({}, false, 500)),
    );
    expect(await fetchDataciteOutputs("0000-0002-7483-2489")).toEqual([]);
  });

  it("collects Zenodo concept/version sibling DOIs from relatedIdentifiers", async () => {
    const body = {
      data: [
        {
          attributes: {
            doi: "10.5281/zenodo.20594124", // a per-version DOI
            titles: [{ title: "SigmaCV v0.1.0" }],
            publicationYear: 2026,
            publisher: "Zenodo",
            types: { resourceTypeGeneral: "Software" },
            relatedIdentifiers: [
              // The concept DOI — the sibling we must reconcile (bare DOI form).
              {
                relatedIdentifier: "10.5281/zenodo.20594123",
                relatedIdentifierType: "DOI",
                relationType: "IsVersionOf",
              },
              // A non-DOI related id → ignored.
              {
                relatedIdentifier: "https://github.com/BasileChretien/sigmacv",
                relatedIdentifierType: "URL",
                relationType: "IsSupplementTo",
              },
              // A citation relation → ignored (not a version/identity link).
              {
                relatedIdentifier: "10.1/cited",
                relatedIdentifierType: "DOI",
                relationType: "Cites",
              },
              // URL form of a DOI with a version relation → normalized + kept.
              {
                relatedIdentifier: "https://doi.org/10.5281/ZENODO.20594125",
                relatedIdentifierType: "DOI",
                relationType: "HasVersion",
              },
              // Duplicate of the concept DOI under another relation → collapsed.
              {
                relatedIdentifier: "10.5281/zenodo.20594123",
                relatedIdentifierType: "DOI",
                relationType: "IsIdenticalTo",
              },
              // Empty identifier → skipped.
              {
                relatedIdentifier: "  ",
                relatedIdentifierType: "DOI",
                relationType: "IsVersionOf",
              },
            ],
          },
        },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(body)),
    );
    const out = await fetchDataciteOutputs("0000-0002-7483-2489");
    expect(out[0]?.relatedDois).toEqual(["10.5281/zenodo.20594123", "10.5281/zenodo.20594125"]);
  });

  it("omits relatedDois when there are no version/identity siblings", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(BODY)),
    );
    const out = await fetchDataciteOutputs("0000-0002-7483-2489");
    expect(out[0]?.relatedDois).toBeUndefined();
  });

  it("extracts the publisher name from the DataCite v2 object form", async () => {
    const body = {
      data: [
        {
          attributes: {
            doi: "10.5281/zenodo.v2",
            titles: [{ title: "v2 dataset" }],
            publicationYear: 2024,
            // Fabrica v2 returns a structured object instead of a plain string.
            publisher: { name: "Zenodo", publisherIdentifier: "https://ror.org/x" },
            types: { resourceTypeGeneral: "Dataset" },
          },
        },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(body)),
    );
    const out = await fetchDataciteOutputs("0000-0002-7483-2489");
    expect(out[0]?.publisher).toBe("Zenodo");
  });
});

describe("fetchDataciteOutputs — publication links (linkedDois)", () => {
  it("collects the DOIs of the publications a deposit declares itself attached to", async () => {
    const body = {
      data: [
        {
          attributes: {
            doi: "10.5281/zenodo.77",
            titles: [{ title: "Trial data" }],
            types: { resourceTypeGeneral: "Dataset" },
            relatedIdentifiers: [
              {
                relatedIdentifierType: "DOI",
                relationType: "IsSupplementTo",
                relatedIdentifier: "https://doi.org/10.1/PAPER",
              },
              {
                relatedIdentifierType: "DOI",
                relationType: "isReferencedBy",
                relatedIdentifier: "10.1/paper",
              }, // dup → once
              {
                relatedIdentifierType: "DOI",
                relationType: "IsCitedBy",
                relatedIdentifier: "10.1/review",
              },
              {
                relatedIdentifierType: "DOI",
                relationType: "IsSourceOf",
                relatedIdentifier: "10.1/derived",
              },
              {
                relatedIdentifierType: "DOI",
                relationType: "IsVersionOf",
                relatedIdentifier: "10.5281/zenodo.76",
              }, // sibling → relatedDois
              {
                relatedIdentifierType: "DOI",
                relationType: "Cites",
                relatedIdentifier: "10.1/cited",
              }, // citation → neither
              {
                relatedIdentifierType: "URL",
                relationType: "IsSupplementTo",
                relatedIdentifier: "https://x",
              }, // not a DOI
              { relatedIdentifierType: "DOI", relationType: "IsSupplementTo" }, // no id
            ],
          },
        },
        {
          attributes: {
            doi: "10.5281/zenodo.78",
            titles: [{ title: "Standalone" }],
            types: { resourceTypeGeneral: "Software" },
          },
        },
      ],
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(body)),
    );
    const out = await fetchDataciteOutputs("0000-0002-7483-2489");
    expect(out[0]?.linkedDois).toEqual(["10.1/paper", "10.1/review", "10.1/derived"]);
    expect(out[0]?.relatedDois).toEqual(["10.5281/zenodo.76"]);
    // No publication relation → the field is omitted, not an empty array.
    expect(out[1]?.linkedDois).toBeUndefined();
  });
});

// Shapes copied from live DataCite records (Recherche Data Gouv 10.57745/cbuolw
// and its files, Harvard Dataverse 10.7910/dvn/svc2fi), 2026-10-02.
describe("fetchDataciteOutputs — file-level DOIs", () => {
  const ORCID = "0000-0002-7483-2489";
  const rel = (relationType: string, relatedIdentifier: string) => ({
    relationType,
    relatedIdentifier,
    relatedIdentifierType: "DOI",
  });
  const file = (doi: string, title: string, attrs: Record<string, unknown>) => ({
    attributes: {
      doi,
      titles: [{ title }],
      publicationYear: 2026,
      publisher: "Recherche Data Gouv",
      types: { resourceTypeGeneral: "Dataset" },
      ...attrs,
    },
  });
  const stub = (data: unknown[]) =>
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ data })),
    );

  it("lists a Dataverse dataset once, with its files' DOIs on it", async () => {
    stub([
      file("10.57745/NJZEO0", "pH_acidity.html", {
        url: "https://entrepot.recherche.data.gouv.fr/file.xhtml?persistentId=doi:10.57745/NJZEO0",
        relatedIdentifiers: [rel("IsPartOf", "10.57745/cbuolw")],
      }),
      file("10.57745/CBUOLW", "Experimental results", {
        url: "https://entrepot.recherche.data.gouv.fr/citation?persistentId=doi:10.57745/CBUOLW",
        relatedIdentifiers: [
          rel("HasPart", "10.57745/NJZEO0"),
          rel("HasPart", "https://doi.org/10.57745/ry0gt0"),
        ],
      }),
      file("10.57745/RY0GT0", "Experimental_results.tab", {
        url: "https://entrepot.recherche.data.gouv.fr/file.xhtml?persistentId=doi:10.57745/RY0GT0",
        relatedIdentifiers: [rel("IsPartOf", "10.57745/cbuolw")],
      }),
    ]);
    const out = await fetchDataciteOutputs(ORCID);
    expect(out.map((o) => o.title)).toEqual(["Experimental results"]);
    expect(out[0]?.fileDois).toEqual(["10.57745/njzeo0", "10.57745/ry0gt0"]);
  });

  it("drops a Dataverse file that names no dataset (older installations)", async () => {
    stub([
      file("10.25625/DZHP4Z/DMUSEP", "scan_014.tif", {
        url: "https://data.goettingen-research-online.de/file.xhtml?version=2.0&persistentId=doi:10.25625/DZHP4Z/DMUSEP",
        relatedIdentifiers: [],
      }),
    ]);
    expect(await fetchDataciteOutputs(ORCID)).toEqual([]);
  });

  it("recognises a file by its DOI extending the deposit's, off Dataverse too", async () => {
    stub([
      file("10.5061/dryad.abc12", "Field survey", {
        url: "https://datadryad.org/dataset/doi:10.5061/dryad.abc12",
        relatedIdentifiers: [
          rel("HasPart", "10.5061/dryad.abc12/1"),
          // A part with a DOI of its own shape is not a file of this deposit.
          rel("HasPart", "10.5061/dryad.other9"),
        ],
      }),
      file("10.5061/dryad.abc12/1", "transects.csv", {
        url: "https://datadryad.org/dataset/doi:10.5061/dryad.abc12/1",
        // Harvard Dataverse writes the parent in this `doi:` form.
        relatedIdentifiers: [rel("isPartOf", "doi:10.5061/DRYAD.ABC12")],
      }),
    ]);
    const out = await fetchDataciteOutputs(ORCID);
    expect(out.map((o) => o.doi)).toEqual(["10.5061/dryad.abc12"]);
    expect(out[0]?.fileDois).toEqual(["10.5061/dryad.abc12/1"]);
  });

  it("drops a Dataverse file page addressed by fileId (DaRUS)", async () => {
    stub([
      file("10.18419/DARUS-2986/617", "run_617.h5", {
        url: "https://darus.uni-stuttgart.de/file.xhtml?fileId=171811&version=1.0",
      }),
      // Not a file page: a path that merely ends the same way.
      file("10.18419/darus-9", "Profile data", { url: "https://example.org/profile.xhtml?id=9" }),
    ]);
    expect((await fetchDataciteOutputs(ORCID)).map((o) => o.title)).toEqual(["Profile data"]);
  });

  it("keeps a deposit that is part of a larger one under a DOI of its own", async () => {
    stub([
      file("10.5281/zenodo.500", "Survey wave 2", {
        url: "https://zenodo.org/records/500",
        relatedIdentifiers: [rel("IsPartOf", "10.5281/zenodo.400")],
      }),
      file("10.5281/zenodo.400", "Survey, all waves", {
        url: "https://zenodo.org/records/400",
        relatedIdentifiers: [rel("HasPart", "10.5281/zenodo.500"), rel("HasPart", "10.5281/zenodo.4001")], // prettier-ignore
      }),
      // Its DOI merely BEGINS with the parent's: no "/" boundary, so not a file.
      file("10.5281/zenodo.4001", "Survey wave 3", {
        url: "https://zenodo.org/records/4001",
        relatedIdentifiers: [rel("IsPartOf", "10.5281/zenodo.400")],
      }),
    ]);
    const out = await fetchDataciteOutputs(ORCID);
    expect(out.map((o) => o.title)).toEqual(["Survey wave 2", "Survey, all waves", "Survey wave 3"]); // prettier-ignore
    // Neither is a file of the other → no fileDois, so the build drops nothing.
    expect(out.every((o) => o.fileDois === undefined)).toBe(true);
  });

  it("asks DataCite to leave Dataverse file records out of the page", async () => {
    const f = vi.fn(async (_url: URL | string) => res({ data: [] }));
    vi.stubGlobal("fetch", f);
    await fetchDataciteOutputs(ORCID);
    const q = new URL(String(f.mock.calls[0]?.[0])).searchParams.get("query");
    expect(q).toMatch(/^\(.*\) AND NOT url:\*file\.xhtml\*$/);
  });

  it("falls back to the plain ORCID query when DataCite refuses the file clause", async () => {
    const data = [
      file("10.57745/CBUOLW", "Experimental results", {
        url: "https://entrepot.recherche.data.gouv.fr/citation?persistentId=doi:10.57745/CBUOLW",
      }),
      file("10.57745/NJZEO0", "pH_acidity.html", {
        url: "https://entrepot.recherche.data.gouv.fr/file.xhtml?persistentId=doi:10.57745/NJZEO0",
      }),
    ];
    const f = vi.fn(async (url: URL | string) =>
      String(new URL(String(url)).searchParams.get("query")).includes("NOT url:")
        ? res({ errors: [{ status: "400" }] }, false, 400)
        : res({ data }),
    );
    vi.stubGlobal("fetch", f);
    const out = await fetchDataciteOutputs(ORCID);
    expect(f).toHaveBeenCalledTimes(2);
    // The file is still dropped, by the record's own landing page.
    expect(out.map((o) => o.title)).toEqual(["Experimental results"]);
  });

  it("asks again only for a refused query (400), not for any other failure", async () => {
    const f = vi.fn(async () => res({}, false, 403));
    vi.stubGlobal("fetch", f);
    expect(await fetchDataciteOutputs(ORCID)).toEqual([]);
    expect(f).toHaveBeenCalledTimes(1);
  });
});
