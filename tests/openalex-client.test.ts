import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getEnv: () => ({ OPENALEX_MAILTO: "test@example.org" }),
}));

import { fetchAuthorsByOrcid, fetchWorksByAuthorIds } from "@/lib/openalex/client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchAuthorsByOrcid", () => {
  it("queries /authors with a bare orcid filter + polite mailto", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ results: [{ id: "https://openalex.org/A1" }] }));
    const authors = await fetchAuthorsByOrcid("https://orcid.org/0000-0002-7483-2489");
    expect(authors).toHaveLength(1);
    const url = new URL(fetchMock.mock.calls[0]![0].toString());
    expect(url.pathname).toBe("/authors");
    expect(url.searchParams.get("filter")).toBe("orcid:0000-0002-7483-2489");
    expect(url.searchParams.get("mailto")).toBe("test@example.org");
  });

  it("throws on a non-OK response", async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 429));
    await expect(fetchAuthorsByOrcid("0000-0002-7483-2489")).rejects.toThrow(/OpenAlex/);
  });
});

describe("fetchWorksByAuthorIds", () => {
  it("returns [] for no author ids (no request)", async () => {
    expect(await fetchWorksByAuthorIds([])).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("paginates with the cursor and OR-joins author ids", async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({ results: [{ id: "W1" }], meta: { next_cursor: "c2" } }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ results: [{ id: "W2" }], meta: { next_cursor: null } }),
      );
    const works = await fetchWorksByAuthorIds(["A1", "A2"]);
    expect(works.map((w) => w.id)).toEqual(["W1", "W2"]);
    const firstUrl = new URL(fetchMock.mock.calls[0]![0].toString());
    expect(firstUrl.searchParams.get("filter")).toBe("author.id:A1|A2");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("stops at maxPages and warns rather than truncating silently", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockResolvedValue(
      jsonResponse({ results: [{ id: "W1" }], meta: { next_cursor: "more" } }),
    );
    const works = await fetchWorksByAuthorIds(["A1"], 1);
    expect(works).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalled();
  });
});
