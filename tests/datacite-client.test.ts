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
    vi.stubGlobal("fetch", vi.fn(async () => res(BODY)));
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
    vi.stubGlobal("fetch", vi.fn(async () => res({}, false, 500)));
    expect(await fetchDataciteOutputs("0000-0002-7483-2489")).toEqual([]);
  });
});
