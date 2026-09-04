import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchEuropePmcByDoi, fetchEuropePmcDataLinks } from "@/lib/europepmc/client";

function res(body: unknown, init: { status?: number; contentLength?: string } = {}): Response {
  const text = typeof body === "string" ? body : JSON.stringify(body);
  const headers = new Headers();
  if (init.contentLength) headers.set("content-length", init.contentLength);
  const status = init.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    headers,
    text: async () => text,
  } as unknown as Response;
}

afterEach(() => vi.unstubAllGlobals());

const SEARCH_HIT = {
  hitCount: 1,
  resultList: {
    result: [
      {
        id: "12345678",
        source: "MED",
        pmid: "12345678",
        pmcid: "pmc1234567",
        doi: "10.1234/ABC.1",
        hasData: "Y",
        hasSuppl: "N",
        isOpenAccess: "Y",
        dataLinksCount: 3,
      },
    ],
  },
};

describe("fetchEuropePmcByDoi", () => {
  it("resolves a DOI to its PMID/PMCID + open-science flags", async () => {
    const f = vi.fn(async () => res(SEARCH_HIT));
    vi.stubGlobal("fetch", f);
    const out = await fetchEuropePmcByDoi("https://doi.org/10.1234/ABC.1");
    expect(out).toEqual({
      pmid: "12345678",
      pmcid: "PMC1234567",
      hasData: true,
      hasSuppl: false,
      isOpenAccess: true,
    });
    const url = String((f.mock.calls[0] as unknown[])[0]);
    expect(url).toContain("/europepmc/webservices/rest/search?");
    expect(decodeURIComponent(url)).toContain('query=DOI:"10.1234/abc.1"');
    expect(url).toContain("resultType=core");
    expect(url).toContain("format=json");
    const init = (f.mock.calls[0] as unknown[])[1] as { headers: Record<string, string> };
    expect(init.headers["User-Agent"]).toContain("SigmaCV");
  });

  it("omits flags Europe PMC did not report and tolerates numeric/boolean forms", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({ resultList: { result: { pmid: 99, hasData: true, isOpenAccess: "maybe" } } }),
      ),
    );
    // A single-object `result` (not an array) is tolerated; unknown flag values dropped.
    expect(await fetchEuropePmcByDoi("10.1234/x")).toEqual({ pmid: "99", hasData: true });
  });

  it("returns null when the hit is a DIFFERENT DOI (never attaches a stranger's PMID)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ resultList: { result: [{ pmid: "1", doi: "10.1234/other" }] } })),
    );
    expect(await fetchEuropePmcByDoi("10.1234/x")).toBeNull();
  });

  it("returns null on no hit, malformed JSON, an HTTP error or an over-cap body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ hitCount: 0, resultList: { result: [] } })),
    );
    expect(await fetchEuropePmcByDoi("10.1234/x")).toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("not json")),
    );
    expect(await fetchEuropePmcByDoi("10.1234/x")).toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("[]")),
    );
    expect(await fetchEuropePmcByDoi("10.1234/x")).toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("{}", { status: 404 })),
    );
    expect(await fetchEuropePmcByDoi("10.1234/x")).toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(SEARCH_HIT, { contentLength: "999999999" })),
    );
    expect(await fetchEuropePmcByDoi("10.1234/x")).toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("x".repeat(600_000))),
    );
    expect(await fetchEuropePmcByDoi("10.1234/x")).toBeNull();
  });

  it("fails soft on a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    expect(await fetchEuropePmcByDoi("10.1234/x")).toBeNull();
  });

  it("skips a malformed DOI without any request", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await fetchEuropePmcByDoi("not-a-doi")).toBeNull();
    expect(await fetchEuropePmcByDoi("")).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
});

const LINKS = {
  hitCount: 4,
  dataLinkList: {
    Category: [
      {
        Name: "Nucleotide Sequences",
        CategoryLinkCount: 1,
        Section: [
          {
            ObtainedBy: "tm_accession",
            Linklist: {
              Link: [
                {
                  ObtainedBy: "tm_accession",
                  Target: {
                    Type: "ENA",
                    Identifier: {
                      ID: "MN908947",
                      IDScheme: "ENA",
                      IDURL: "https://www.ebi.ac.uk/ena/browser/view/MN908947",
                    },
                    Title: "Severe acute respiratory syndrome coronavirus 2 isolate",
                  },
                },
              ],
            },
          },
        ],
      },
      {
        Name: "Data Citations",
        // A single-object Section / Link (not arrays) — tolerated.
        Section: {
          ObtainedBy: "publisher",
          Linklist: {
            Link: {
              Target: {
                Identifier: {
                  ID: "10.5281/zenodo.123",
                  IDScheme: "DOI",
                  IDURL: "https://doi.org/10.5281/zenodo.123",
                },
              },
            },
          },
        },
      },
      {
        Name: "Altmetric",
        Section: [
          {
            Linklist: {
              Link: [
                { Target: { Identifier: { ID: "1", IDScheme: "altmetric", IDURL: "https://a" } } },
              ],
            },
          },
        ],
      },
      {
        Name: "Protein Structures",
        Section: [
          {
            Linklist: {
              Link: [
                // No ID → dropped; no scheme → dropped; malformed entry → dropped.
                { Target: { Identifier: { IDScheme: "PDB", IDURL: "https://x" } } },
                { Target: { Identifier: { ID: "7ABC", IDURL: "https://x" } } },
                "junk",
                { Target: { Identifier: { ID: "7ABC", IDScheme: "PDB" } } },
              ],
            },
          },
        ],
      },
    ],
  },
};

describe("fetchEuropePmcDataLinks", () => {
  it("flattens the Category/Section/Linklist/Link tree into raw links", async () => {
    const f = vi.fn(async () => res(LINKS));
    vi.stubGlobal("fetch", f);
    const out = await fetchEuropePmcDataLinks("12345678");
    expect(out).toEqual([
      {
        id: "MN908947",
        scheme: "ENA",
        url: "https://www.ebi.ac.uk/ena/browser/view/MN908947",
        title: "Severe acute respiratory syndrome coronavirus 2 isolate",
        category: "Nucleotide Sequences",
      },
      {
        id: "10.5281/zenodo.123",
        scheme: "DOI",
        url: "https://doi.org/10.5281/zenodo.123",
        category: "Data Citations",
      },
      // The Altmetric category is skipped; the PDB link without a URL is kept
      // (the URL may be derivable downstream) — the id-less/scheme-less ones drop.
      { id: "7ABC", scheme: "PDB", category: "Protein Structures" },
    ]);
    expect(String((f.mock.calls[0] as unknown[])[0])).toContain(
      "/europepmc/webservices/rest/MED/12345678/datalinks?format=json",
    );
  });

  it("caps the list at 20 links per work", async () => {
    const link = (i: number) => ({
      Target: { Identifier: { ID: `GSE${i}`, IDScheme: "GEO", IDURL: `https://geo/${i}` } },
    });
    const body = {
      dataLinkList: {
        Category: [
          { Section: [{ Linklist: { Link: Array.from({ length: 30 }, (_, i) => link(i)) } }] },
        ],
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(body)),
    );
    expect((await fetchEuropePmcDataLinks("1")).length).toBe(20);
  });

  it("returns [] on an empty list, malformed JSON, an HTTP error, an over-cap body or a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ hitCount: 0, dataLinkList: { Category: [] } })),
    );
    expect(await fetchEuropePmcDataLinks("1")).toEqual([]);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ dataLinkList: { Category: [null, { Section: [null] }] } })),
    );
    expect(await fetchEuropePmcDataLinks("1")).toEqual([]);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("<html>")),
    );
    expect(await fetchEuropePmcDataLinks("1")).toEqual([]);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("{}", { status: 500 })),
    );
    expect(await fetchEuropePmcDataLinks("1")).toEqual([]);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("{}", { contentLength: "99999999" })),
    );
    expect(await fetchEuropePmcDataLinks("1")).toEqual([]);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    expect(await fetchEuropePmcDataLinks("1")).toEqual([]);
  });

  it("rejects a non-numeric PMID without any request", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await fetchEuropePmcDataLinks("PMC123")).toEqual([]);
    expect(await fetchEuropePmcDataLinks(" ")).toEqual([]);
    expect(f).not.toHaveBeenCalled();
  });
});

describe("fetchEuropePmcByDoi — identifier validation", () => {
  it("drops a non-numeric PMID and a malformed PMCID rather than storing junk", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({ resultList: { result: [{ pmid: "PMID:1", pmcid: "junk", hasData: "N" }] } }),
      ),
    );
    expect(await fetchEuropePmcByDoi("10.1234/x")).toEqual({ hasData: false });
  });
});
