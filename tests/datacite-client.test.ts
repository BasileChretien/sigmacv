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

  it("queries DataCite by the user's ORCID", async () => {
    const f = vi.fn(async (_url: URL | string) => res({ data: [] }));
    vi.stubGlobal("fetch", f);
    await fetchDataciteOutputs("https://orcid.org/0000-0002-7483-2489");
    expect(String(f.mock.calls[0]?.[0])).toContain("0000-0002-7483-2489");
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
