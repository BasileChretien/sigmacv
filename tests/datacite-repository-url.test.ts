import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchDataciteOutputs } from "@/lib/datacite/client";

function res(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchDataciteOutputs — repositoryUrl extraction", () => {
  it("extracts a GitHub URL from a URL-typed relatedIdentifier under IsSupplementTo", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          data: [
            {
              attributes: {
                doi: "10.5281/zenodo.10",
                titles: [{ title: "My tool" }],
                types: { resourceTypeGeneral: "Software" },
                relatedIdentifiers: [
                  {
                    relatedIdentifierType: "URL",
                    relationType: "IsSupplementTo",
                    relatedIdentifier: "https://github.com/user/repo",
                  },
                ],
              },
            },
          ],
        }),
      ),
    );
    const out = await fetchDataciteOutputs("0000-0002-7483-2489");
    expect(out[0]?.repositoryUrl).toBe("https://github.com/user/repo");
  });

  it("also accepts IsDerivedFrom / HasVersion relation types", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          data: [
            {
              attributes: {
                doi: "10.5281/zenodo.11",
                titles: [{ title: "Tool A" }],
                types: { resourceTypeGeneral: "Software" },
                relatedIdentifiers: [
                  {
                    relatedIdentifierType: "URL",
                    relationType: "HasVersion",
                    relatedIdentifier: "https://gitlab.com/user/repo-a",
                  },
                ],
              },
            },
            {
              attributes: {
                doi: "10.5281/zenodo.12",
                titles: [{ title: "Tool B" }],
                types: { resourceTypeGeneral: "Software" },
                relatedIdentifiers: [
                  {
                    relatedIdentifierType: "URL",
                    relationType: "IsDerivedFrom",
                    relatedIdentifier: "https://codeberg.org/user/repo-b",
                  },
                ],
              },
            },
          ],
        }),
      ),
    );
    const out = await fetchDataciteOutputs("0000-0002-7483-2489");
    expect(out[0]?.repositoryUrl).toBe("https://gitlab.com/user/repo-a");
    expect(out[1]?.repositoryUrl).toBe("https://codeberg.org/user/repo-b");
  });

  it("ignores a relatedIdentifier under an unrecognized relation type", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          data: [
            {
              attributes: {
                doi: "10.5281/zenodo.13",
                titles: [{ title: "Tool" }],
                types: { resourceTypeGeneral: "Software" },
                relatedIdentifiers: [
                  {
                    relatedIdentifierType: "URL",
                    relationType: "Cites", // not a repo-pointing relation
                    relatedIdentifier: "https://github.com/user/repo",
                  },
                ],
              },
            },
          ],
        }),
      ),
    );
    const out = await fetchDataciteOutputs("0000-0002-7483-2489");
    expect(out[0]?.repositoryUrl).toBeUndefined();
  });

  it("ignores a relatedIdentifier whose host isn't a recognized code host", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          data: [
            {
              attributes: {
                doi: "10.5281/zenodo.14",
                titles: [{ title: "Tool" }],
                types: { resourceTypeGeneral: "Software" },
                relatedIdentifiers: [
                  {
                    relatedIdentifierType: "URL",
                    relationType: "IsSupplementTo",
                    relatedIdentifier: "https://example.com/not-a-repo",
                  },
                ],
              },
            },
          ],
        }),
      ),
    );
    const out = await fetchDataciteOutputs("0000-0002-7483-2489");
    expect(out[0]?.repositoryUrl).toBeUndefined();
  });

  it("falls back to the deposit's own landing-page url when it points at a repo host", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          data: [
            {
              attributes: {
                doi: "10.5281/zenodo.15",
                titles: [{ title: "Tool" }],
                types: { resourceTypeGeneral: "Software" },
                url: "https://github.com/user/repo",
              },
            },
          ],
        }),
      ),
    );
    const out = await fetchDataciteOutputs("0000-0002-7483-2489");
    expect(out[0]?.repositoryUrl).toBe("https://github.com/user/repo");
  });

  it("omits repositoryUrl entirely when nothing usable is found (Zenodo landing page)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          data: [
            {
              attributes: {
                doi: "10.5281/zenodo.16",
                titles: [{ title: "Tool" }],
                types: { resourceTypeGeneral: "Software" },
                url: "https://zenodo.org/record/16",
              },
            },
          ],
        }),
      ),
    );
    const out = await fetchDataciteOutputs("0000-0002-7483-2489");
    expect(out[0]?.repositoryUrl).toBeUndefined();
    expect("repositoryUrl" in out[0]!).toBe(false);
  });
});
