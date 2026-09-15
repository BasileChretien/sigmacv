import { afterEach, describe, expect, it, vi } from "vitest";

Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
});

import { fetchAuthorRepositories } from "@/lib/openalex/repositories";

/**
 * The repositories an author's works sit in: one grouped works call, one batched
 * sources call, repository-typed sources only. Mocked fetch only; fail-soft.
 */

const json = (value: unknown, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { "Content-Type": "application/json" } });

const GROUPS = {
  group_by: [
    { key: "https://openalex.org/S4306525036", key_display_name: "PubMed", count: 85 },
    { key: "https://openalex.org/S4306402512", key_display_name: "HAL (CCSD)", count: 34 },
    {
      key: "https://openalex.org/S13842274",
      key_display_name: "British Journal of Clinical Pharmacology",
      count: 3,
    },
    { key: "https://openalex.org/I123", key_display_name: "not a source", count: 9 },
    { key: "https://openalex.org/S77", count: "many" },
    { key: "https://openalex.org/S78", key_display_name: "Only in the group", count: 2 },
  ],
};
const SOURCES = {
  results: [
    {
      id: "https://openalex.org/S4306525036",
      display_name: "PubMed",
      type: "repository",
      homepage_url: "https://pubmed.ncbi.nlm.nih.gov",
    },
    {
      id: "https://openalex.org/S4306402512",
      display_name: " HAL ",
      type: "repository",
      homepage_url: "ftp://hal.science",
    },
    {
      id: "https://openalex.org/S13842274",
      display_name: "BJCP",
      type: "journal",
      homepage_url: null,
    },
    { id: "https://openalex.org/S78", type: "repository" },
    "junk",
  ],
};

function stubFetch(...responses: Array<Response | Error>) {
  const fn = vi.fn();
  for (const r of responses) {
    if (r instanceof Error) fn.mockRejectedValueOnce(r);
    else fn.mockResolvedValueOnce(r);
  }
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchAuthorRepositories", () => {
  it("keeps the repository-typed sources of the grouped works, most works first", async () => {
    const fetchMock = stubFetch(json(GROUPS), json(SOURCES));
    const out = await fetchAuthorRepositories([
      "https://openalex.org/A5001069481",
      "A5136414971",
      "A5001069481",
    ]);
    expect(out).toEqual([
      {
        sourceId: "S4306525036",
        name: "PubMed",
        homepageUrl: "https://pubmed.ncbi.nlm.nih.gov",
        works: 85,
      },
      { sourceId: "S4306402512", name: "HAL", works: 34 },
      { sourceId: "S78", name: "Only in the group", works: 2 },
    ]);
    const first = new URL(String(fetchMock.mock.calls[0]![0]));
    expect(first.pathname).toBe("/works");
    expect(first.searchParams.get("filter")).toBe(
      "authorships.author.id:A5001069481|A5136414971,locations.source.type:repository",
    );
    expect(first.searchParams.get("group_by")).toBe("locations.source.id");
    const second = new URL(String(fetchMock.mock.calls[1]![0]));
    expect(second.pathname).toBe("/sources");
    expect(second.searchParams.get("filter")).toBe(
      "openalex:S4306525036|S4306402512|S13842274|S78",
    );
    expect(second.searchParams.get("select")).toBe("id,display_name,type,homepage_url");
  });

  it("drops a repository with no name anywhere", async () => {
    stubFetch(
      json({ group_by: [{ key: "https://openalex.org/S5", count: 4 }] }),
      json({ results: [{ id: "https://openalex.org/S5", type: "repository" }] }),
    );
    expect(await fetchAuthorRepositories(["A1"])).toEqual([]);
  });

  it("answers [] without an author id, and after one call when no work sits in a repository", async () => {
    const fetchMock = stubFetch(json({ group_by: [] }));
    expect(await fetchAuthorRepositories([])).toEqual([]);
    expect(await fetchAuthorRepositories(["not-an-author"])).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await fetchAuthorRepositories(["A1"])).toEqual([]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fails soft (undefined) on a refused call, an unreadable answer or a network error", async () => {
    stubFetch(json({}, 404));
    expect(await fetchAuthorRepositories(["A1"])).toBeUndefined();
    stubFetch(json(GROUPS), json({}, 404));
    expect(await fetchAuthorRepositories(["A1"])).toBeUndefined();
    stubFetch(json({ nope: true }));
    expect(await fetchAuthorRepositories(["A1"])).toBeUndefined();
    stubFetch(json(GROUPS), json({ nope: true }));
    expect(await fetchAuthorRepositories(["A1"])).toBeUndefined();
    stubFetch(new Error("ECONNRESET"), new Error("ECONNRESET"));
    expect(await fetchAuthorRepositories(["A1"])).toBeUndefined();
  });

  it("does not start the second call once the first has spent the budget, and never retries", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    try {
      const slow = vi.fn(async () => {
        vi.setSystemTime(Date.now() + 7_500);
        return json(GROUPS);
      });
      vi.stubGlobal("fetch", slow);
      expect(await fetchAuthorRepositories(["A1"], 8_000)).toBeUndefined();
      expect(slow).toHaveBeenCalledTimes(1);

      const refused = stubFetch(json({}, 503), json(GROUPS));
      expect(await fetchAuthorRepositories(["A1"])).toBeUndefined();
      expect(refused).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("gives up on a body that stalls after the headers, at the same deadline, and cancels its stream", async () => {
    const cancel = vi.fn();
    const stalled = new Response(new ReadableStream({ start() {}, cancel }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    stubFetch(stalled);
    const started = Date.now();
    expect(await fetchAuthorRepositories(["A1"], 60)).toBeUndefined();
    expect(Date.now() - started).toBeLessThan(2_000);
    await vi.waitFor(() => expect(cancel).toHaveBeenCalled());
  });
});
