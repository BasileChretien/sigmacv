import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCrossrefGapFields, fetchCrossrefRelations } from "@/lib/crossref/client";

function res(body: string, init?: { status?: number; headers?: Record<string, string> }): Response {
  const status = init?.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(init?.headers ?? {}),
    text: async () => body,
  } as unknown as Response;
}

const MAILTO = "ci@example.org";

afterEach(() => vi.unstubAllGlobals());

describe("fetchCrossrefGapFields", () => {
  it("extracts bibliographic gap fields from a CSL response", async () => {
    const csl = JSON.stringify({
      "container-title": ["Journal of Pharmacology"],
      volume: "12",
      issue: "3",
      page: "100-110",
      ISSN: ["1234-5678", "8765-4321"],
      publisher: "Elsevier",
    });
    const fetchMock = vi.fn(async (_url: URL | string) => res(csl));
    vi.stubGlobal("fetch", fetchMock);

    const out = await fetchCrossrefGapFields("10.1000/abc123", MAILTO);
    expect(out).toEqual({
      "container-title": "Journal of Pharmacology",
      volume: "12",
      issue: "3",
      page: "100-110",
      ISSN: ["1234-5678", "8765-4321"],
      publisher: "Elsevier",
    });
    // mailto joins the polite pool; the DOI is path-encoded.
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("mailto=ci%40example.org");
    expect(url).toContain("10.1000%2Fabc123");
  });

  it("accepts a string container-title and a single-string ISSN", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(JSON.stringify({ "container-title": "Nature", ISSN: "0028-0836" }))),
    );
    const out = await fetchCrossrefGapFields("https://doi.org/10.1038/x", MAILTO);
    expect(out).toEqual({ "container-title": "Nature", ISSN: "0028-0836" });
  });

  it("normalises a DOI URL to its bare form before requesting", async () => {
    const fetchMock = vi.fn(async (_url: URL | string) =>
      res(JSON.stringify({ "container-title": "X" })),
    );
    vi.stubGlobal("fetch", fetchMock);
    await fetchCrossrefGapFields("https://dx.doi.org/10.5555/Test", MAILTO);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("10.5555%2Ftest");
  });

  it("returns null for an invalid DOI without fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchCrossrefGapFields("not-a-doi", MAILTO)).toBeNull();
    expect(await fetchCrossrefGapFields("", MAILTO)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("", { status: 404 })),
    );
    expect(await fetchCrossrefGapFields("10.1000/x", MAILTO)).toBeNull();
  });

  it("returns null when no gap fields are present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(JSON.stringify({ title: "Only a title" }))),
    );
    expect(await fetchCrossrefGapFields("10.1000/x", MAILTO)).toBeNull();
  });

  it("rejects an oversized declared content-length", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res(JSON.stringify({ "container-title": "X" }), {
          headers: { "content-length": "999999" },
        }),
      ),
    );
    expect(await fetchCrossrefGapFields("10.1000/x", MAILTO)).toBeNull();
  });

  it("rejects an oversized body", async () => {
    const big = `{"container-title":"${"x".repeat(200_001)}"}`;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(big)),
    );
    expect(await fetchCrossrefGapFields("10.1000/x", MAILTO)).toBeNull();
  });

  it("returns null (fails soft) on a thrown fetch error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    expect(await fetchCrossrefGapFields("10.1000/x", MAILTO)).toBeNull();
  });

  it("returns null on unparseable JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("<<not json>>")),
    );
    expect(await fetchCrossrefGapFields("10.1000/x", MAILTO)).toBeNull();
  });
});

describe("fetchCrossrefRelations", () => {
  it("maps preprint/version relations to normalized targets", async () => {
    const body = JSON.stringify({
      message: {
        relation: {
          "has-preprint": [{ "id-type": "doi", id: "10.1101/Pre.123" }],
          "is-version-of": [{ "id-type": "doi", id: "https://doi.org/10.5555/VOR" }],
          "is-supplement-to": [{ "id-type": "doi", id: "10.9/ignored" }],
        },
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(body)),
    );
    const out = await fetchCrossrefRelations("10.1234/work", MAILTO);
    expect(out).toEqual([
      { target: "10.1101/pre.123", kind: "preprint-pair" },
      { target: "10.5555/vor", kind: "version" },
    ]);
  });

  it("returns [] for an invalid DOI without fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchCrossrefRelations("nope", MAILTO)).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns [] when there is no relation block, a non-ok response, or a throw", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(JSON.stringify({ message: {} }))),
    );
    expect(await fetchCrossrefRelations("10.1234/x", MAILTO)).toEqual([]);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("", { status: 500 })),
    );
    expect(await fetchCrossrefRelations("10.1234/x", MAILTO)).toEqual([]);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("down");
      }),
    );
    expect(await fetchCrossrefRelations("10.1234/x", MAILTO)).toEqual([]);
  });

  it("rejects an oversized body", async () => {
    const big = `{"message":{"relation":{}},"pad":"${"x".repeat(200_001)}"}`;
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(big)),
    );
    expect(await fetchCrossrefRelations("10.1234/x", MAILTO)).toEqual([]);
  });

  it("dedupes a target that appears under two relation keys", async () => {
    const body = JSON.stringify({
      message: {
        relation: {
          "is-preprint-of": [{ "id-type": "doi", id: "10.1/same" }],
          "has-version": [{ "id-type": "doi", id: "10.1/same" }],
        },
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(body)),
    );
    const out = await fetchCrossrefRelations("10.1234/x", MAILTO);
    expect(out).toEqual([{ target: "10.1/same", kind: "preprint-pair" }]);
  });
});
