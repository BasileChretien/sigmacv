import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn(async (): Promise<{ ok: boolean; retryAfterSec?: number }> => ({ ok: true })),
  search: vi.fn(),
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.9" }),
}));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: mocks.rateLimit }));
vi.mock("@/lib/openalex/authorSearch", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/openalex/authorSearch")>()),
  searchAuthorsByName: mocks.search,
}));

import { loadSearch, queryParam, searchRobots } from "@/app/search/searchLoad";

beforeEach(() => {
  mocks.rateLimit.mockClear();
  mocks.rateLimit.mockResolvedValue({ ok: true });
  mocks.search.mockReset();
});

describe("loadSearch", () => {
  it("is idle without a query, and spends no rate limit", async () => {
    expect(await loadSearch(undefined)).toEqual({ kind: "idle" });
    expect(await loadSearch("")).toEqual({ kind: "idle" });
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.search).not.toHaveBeenCalled();
  });

  it("reports an invalid query before touching the limiter or OpenAlex", async () => {
    expect(await loadSearch("a,b")).toEqual({ kind: "invalid", raw: "a,b" });
    expect(mocks.rateLimit).not.toHaveBeenCalled();
    expect(mocks.search).not.toHaveBeenCalled();
  });

  it("runs the normalised query behind the search buckets (never the preview's)", async () => {
    mocks.search.mockResolvedValue([
      { name: "N", orcid: "0000-0002-1825-0097", affiliation: null, years: null },
    ]);
    const out = await loadSearch("  Chrétien ");
    expect(out).toMatchObject({ kind: "ok", query: "chrétien" });
    expect(mocks.search).toHaveBeenCalledWith("chrétien");
    const keys = (mocks.rateLimit.mock.calls as unknown as unknown[][]).map((c) => String(c[0]));
    expect(keys).toEqual(["search:203.0.113.9", "search:global:minute", "search:global:hour"]);
    expect(keys.join(" ")).not.toContain("preview");
  });

  it("stops at the first exhausted bucket with its retry-after", async () => {
    mocks.rateLimit.mockResolvedValueOnce({ ok: false, retryAfterSec: 42 });
    expect(await loadSearch("someone")).toEqual({ kind: "rate-limited", retryAfterSec: 42 });
    expect(mocks.search).not.toHaveBeenCalled();
  });
});

describe("queryParam + searchRobots", () => {
  it("takes the first q, and marks every non-idle outcome noindex", () => {
    expect(queryParam({ q: ["a", "b"] })).toBe("a");
    expect(queryParam({ q: "x" })).toBe("x");
    expect(queryParam({})).toBeUndefined();
    expect(searchRobots({ kind: "idle" })).toBeUndefined();
    expect(searchRobots({ kind: "ok", query: "x", hits: [] })).toEqual({
      index: false,
      follow: false,
    });
    expect(searchRobots({ kind: "invalid", raw: "x" })).toEqual({ index: false, follow: false });
    expect(searchRobots({ kind: "rate-limited", retryAfterSec: 1 })).toEqual({
      index: false,
      follow: false,
    });
  });
});
