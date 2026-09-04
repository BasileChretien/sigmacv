import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchCrossrefTitleYear } from "@/lib/crossref/client";
import { fetchDataciteTitleYear } from "@/lib/datacite/client";

/**
 * The two DOI → title/year lookups behind the supervision record's thesis
 * gap-fill (`enrichCvWithSupervision`). Both are polite-pool, size-capped and
 * fail-soft: every path that is not a clean record answers `null`, never throws.
 */

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

describe("fetchCrossrefTitleYear", () => {
  it("reads the title (string or array) and the issued year, via the polite pool", async () => {
    const fetchMock = vi.fn(async (_url: URL | string) =>
      res(JSON.stringify({ title: ["A thesis"], issued: { "date-parts": [[2022, 6]] } })),
    );
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchCrossrefTitleYear("https://doi.org/10.5555/ABC", MAILTO)).toEqual({
      title: "A thesis",
      year: 2022,
    });
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("mailto=ci%40example.org");
    expect(url).toContain("10.5555%2Fabc"); // bare + lower-cased DOI, path-encoded

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(JSON.stringify({ title: "Plain title" }))),
    );
    expect(await fetchCrossrefTitleYear("10.5555/abc", MAILTO)).toEqual({ title: "Plain title" });
  });

  it("falls back through the CSL date fields, accepts a string year, caps the title", async () => {
    const long = "t".repeat(400);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res(
          JSON.stringify({
            title: long,
            issued: { "date-parts": [[null]] },
            "published-print": { "date-parts": [["2019"]] },
          }),
        ),
      ),
    );
    const out = await fetchCrossrefTitleYear("10.5555/abc", MAILTO);
    expect(out?.year).toBe(2019);
    expect(out?.title).toHaveLength(300);

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(JSON.stringify({ "published-online": { "date-parts": [[2018]] } }))),
    );
    expect(await fetchCrossrefTitleYear("10.5555/abc", MAILTO)).toEqual({ year: 2018 });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(JSON.stringify({ created: { "date-parts": [[2017]] } }))),
    );
    expect(await fetchCrossrefTitleYear("10.5555/abc", MAILTO)).toEqual({ year: 2017 });
  });

  it("answers null for a malformed DOI (no request), a non-2xx, an oversized body, or nothing usable", async () => {
    const fetchMock = vi.fn(async () => res("{}"));
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchCrossrefTitleYear("not-a-doi", MAILTO)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("nope", { status: 404 })),
    );
    expect(await fetchCrossrefTitleYear("10.5555/abc", MAILTO)).toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("{}", { headers: { "content-length": String(300_000) } })),
    );
    expect(await fetchCrossrefTitleYear("10.5555/abc", MAILTO)).toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("x".repeat(200_001))),
    );
    expect(await fetchCrossrefTitleYear("10.5555/abc", MAILTO)).toBeNull();

    // A record with neither a title nor any date → nothing to fill.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(JSON.stringify({ issued: { "date-parts": [] } }))),
    );
    expect(await fetchCrossrefTitleYear("10.5555/abc", MAILTO)).toBeNull();
  });

  it("fails soft on a network error or invalid JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("boom");
      }),
    );
    expect(await fetchCrossrefTitleYear("10.5555/abc", MAILTO)).toBeNull();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("<html>")),
    );
    expect(await fetchCrossrefTitleYear("10.5555/abc", MAILTO)).toBeNull();
  });
});

describe("fetchDataciteTitleYear", () => {
  const record = (attributes: unknown) => JSON.stringify({ data: { attributes } });

  it("reads the first title and the publication year (number or string) from the JSON:API record", async () => {
    const fetchMock = vi.fn(async (_url: URL | string) =>
      res(record({ titles: [{ title: "Repo thesis" }], publicationYear: 2021 })),
    );
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchDataciteTitleYear("https://doi.org/10.5555/XYZ")).toEqual({
      title: "Repo thesis",
      year: 2021,
    });
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("api.datacite.org/dois/10.5555%2Fxyz");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(record({ titles: [{ title: " " }], publicationYear: "2020" }))),
    );
    expect(await fetchDataciteTitleYear("10.5555/xyz")).toEqual({ year: 2020 });

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(record({ titles: [{ title: "t".repeat(400) }] }))),
    );
    expect((await fetchDataciteTitleYear("10.5555/xyz"))?.title).toHaveLength(300);
  });

  it("answers null for a malformed DOI (no request), a non-2xx, an oversized body, a bare record, or a network error", async () => {
    const fetchMock = vi.fn(async () => res("{}"));
    vi.stubGlobal("fetch", fetchMock);
    expect(await fetchDataciteTitleYear("10.x/bad")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("nope", { status: 404 })),
    );
    expect(await fetchDataciteTitleYear("10.5555/xyz")).toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("{}", { headers: { "content-length": String(300_000) } })),
    );
    expect(await fetchDataciteTitleYear("10.5555/xyz")).toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("x".repeat(200_001))),
    );
    expect(await fetchDataciteTitleYear("10.5555/xyz")).toBeNull();

    // No attributes at all / a record with nothing usable / a string body.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(JSON.stringify({ data: null }))),
    );
    expect(await fetchDataciteTitleYear("10.5555/xyz")).toBeNull();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(record({ titles: "not a list" }))),
    );
    expect(await fetchDataciteTitleYear("10.5555/xyz")).toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("boom");
      }),
    );
    expect(await fetchDataciteTitleYear("10.5555/xyz")).toBeNull();
  });
});
