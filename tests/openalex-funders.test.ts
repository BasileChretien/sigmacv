import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getEnv: () => ({ OPENALEX_MAILTO: "test@example.org" }),
}));
const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  upsert: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  prisma: { funder: { findMany: mocks.findMany, upsert: mocks.upsert } },
}));
vi.mock("@/lib/log", () => ({ logger: { info: mocks.info, warn: mocks.warn, error: vi.fn() } }));

import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import {
  FUNDER_BUDGET_MS,
  FUNDER_FETCH_BOUND,
  FUNDER_FETCH_OPTIONS,
  FUNDER_FRESHNESS_MS,
  fetchFunder,
  recordWorkFunders,
} from "@/lib/openalex/funders";

const NO_WORK = { fetched: 0, stoppedForBudget: false };

/**
 * The OpenAlex funder crosswalk: `GET /funders/F…?select=id,display_name,ids`
 * (`ids.crossref` is the bare FundRef id, canonicalised to the DOI;
 * `ids.ror` / `ids.wikidata` are URLs, stored bare), and the sync-time writer
 * that keeps a `Funder` row per funder printed on the owner's works — bounded,
 * stalest first, fail-soft, never a blocker for the sync. No network: `fetch`
 * is stubbed.
 */

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

const JSPS = {
  id: "https://openalex.org/F4320334764",
  display_name: "Japan Society for the Promotion of Science",
  ids: {
    openalex: "https://openalex.org/F4320334764",
    ror: "https://ror.org/03vhdva43",
    wikidata: "https://www.wikidata.org/wiki/Q1180431",
    crossref: "501100001691",
  },
};

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  mocks.findMany.mockResolvedValue([]);
  mocks.upsert.mockResolvedValue({});
});
afterEach(() => {
  vi.unstubAllGlobals();
});

const calledUrl = (i = 0) => new URL(fetchMock.mock.calls[i]![0].toString());

describe("fetchFunder", () => {
  it("GETs /funders/<id> with the verified select and the polite-pool mailto, canonicalising the ids", async () => {
    fetchMock.mockResolvedValue(jsonResponse(JSPS));
    const funder = await fetchFunder("F4320334764");
    const url = calledUrl();
    expect(url.origin).toBe("https://api.openalex.org");
    expect(url.pathname).toBe("/funders/F4320334764");
    expect(url.searchParams.get("select")).toBe("id,display_name,ids");
    expect(url.searchParams.get("mailto")).toBe("test@example.org");
    expect(funder).toEqual({
      openalexId: "F4320334764",
      name: "Japan Society for the Promotion of Science",
      fundrefDoi: "10.13039/501100001691",
      rorId: "03vhdva43",
      wikidataId: "Q1180431",
    });
  });

  it("leaves an id undefined when OpenAlex has none, or it is not the expected shape", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({
        id: "https://openalex.org/F1",
        display_name: "  Some Funder ",
        ids: { crossref: "not-digits", ror: "https://example.org/x", wikidata: "junk" },
      }),
    );
    expect(await fetchFunder("F1")).toEqual({ openalexId: "F1", name: "Some Funder" });
    fetchMock.mockResolvedValue(jsonResponse({ id: "https://openalex.org/F2" }));
    expect(await fetchFunder("F2")).toEqual({ openalexId: "F2", name: "" });
    // A FundRef DOI in `ids.crossref` is accepted as-is.
    fetchMock.mockResolvedValue(
      jsonResponse({ id: "https://openalex.org/F3", ids: { crossref: "10.13039/501100001691" } }),
    );
    expect((await fetchFunder("F3"))?.fundrefDoi).toBe("10.13039/501100001691");
  });

  it("answers null for a 404, for an entity without an id, and for an id that is not funder-shaped (no request)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "not found" }, 404));
    expect(await fetchFunder("F404")).toBeNull();
    fetchMock.mockResolvedValue(jsonResponse({ display_name: "x" }));
    expect(await fetchFunder("F5")).toBeNull();
    fetchMock.mockClear();
    expect(await fetchFunder("I60134161")).toBeNull();
    expect(await fetchFunder("https://openalex.org/F1")).toBeNull();
    expect(await fetchFunder("")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("throws on any other failure (the caller's fail-soft path owns it)", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ error: "boom" }, 400));
    await expect(fetchFunder("F1")).rejects.toThrow(/OpenAlex request failed \(400/);
  });

  it("makes ONE attempt per lookup — a 5xx is not retried, so a hung fetch cannot hold the interactive sync past its own timeout", async () => {
    expect(FUNDER_FETCH_OPTIONS).toEqual({ retries: 0, timeoutMs: FUNDER_BUDGET_MS });
    fetchMock.mockResolvedValue(jsonResponse({ error: "down" }, 503));
    await expect(fetchFunder("F1")).rejects.toThrow(/OpenAlex request failed \(503/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // …and the timeout rides the request as an abort signal.
    const init = fetchMock.mock.calls[0]![1] as RequestInit;
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });
});

// ── recordWorkFunders ────────────────────────────────────────────────────────

const NOW = new Date("2026-09-09T10:00:00.000Z");
const DAY = 24 * 3600 * 1000;

function work(id: string, funderIds: string[], over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id, type: "article-journal", title: `Work ${id}` },
    meta: { funders: funderIds.map((f) => ({ id: `https://openalex.org/${f}` })) },
    ...over,
  };
}

function makeCv(works: CvItem[]): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "rf",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "B" },
    display: {},
    sections: [
      {
        id: "pubs",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items: works,
      },
    ],
    provenance: { generatedAt: "2026-09-09T00:00:00.000Z", sources: ["openalex"] },
  });
}

const entity = (id: string) => ({ id: `https://openalex.org/${id}`, display_name: `Funder ${id}` });

describe("recordWorkFunders", () => {
  it("does nothing — not even a query — when no included work names a funder", async () => {
    const summary = await recordWorkFunders(
      makeCv([work("W1", []), work("W2", ["F1"], { included: false })]),
      NOW,
    );
    expect(summary).toEqual(NO_WORK);
    expect(mocks.findMany).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fetches nothing when every funder has a row younger than the freshness window", async () => {
    mocks.findMany.mockResolvedValue([
      { openalexId: "F1", fetchedAt: new Date(NOW.getTime() - 10 * DAY) },
      { openalexId: "F2", fetchedAt: new Date(NOW.getTime() - FUNDER_FRESHNESS_MS + 1000) },
    ]);
    await recordWorkFunders(makeCv([work("W1", ["F1", "F2"])]), NOW);
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { openalexId: { in: ["F1", "F2"] } },
      select: { openalexId: true, fetchedAt: true },
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("fetches the missing and stale funders, missing first then oldest, bounded per sync, and upserts each", async () => {
    // 30 funders: F00..F29. Rows: F00–F04 fresh; F05–F14 stale (F14 oldest);
    // F15–F29 missing. Expect the 15 missing (by id), then the 10 stale oldest
    // first — cut at the bound (25).
    const ids = Array.from({ length: 30 }, (_, i) => `F${String(i).padStart(2, "0")}`);
    const rows = ids.slice(0, 15).map((id, i) => ({
      openalexId: id,
      fetchedAt:
        i < 5
          ? new Date(NOW.getTime() - DAY)
          : new Date(NOW.getTime() - FUNDER_FRESHNESS_MS - (i - 4) * DAY),
    }));
    mocks.findMany.mockResolvedValue(rows);
    fetchMock.mockImplementation((u: URL | string) => {
      const id = new URL(u.toString()).pathname.split("/").pop()!;
      return Promise.resolve(jsonResponse(entity(id)));
    });
    const summary = await recordWorkFunders(
      makeCv([work("W1", ids.slice(0, 20)), work("W2", ids.slice(20))]),
      NOW,
    );
    expect(FUNDER_FETCH_BOUND).toBe(25);
    expect(summary).toEqual({ fetched: 25, stoppedForBudget: false });
    const fetched = fetchMock.mock.calls.map((c) =>
      new URL(c[0].toString()).pathname.split("/").pop(),
    );
    expect(fetched).toEqual([
      ...ids.slice(15), // missing, by id
      ...ids.slice(5, 15).reverse(), // stale, oldest first (F14 … F05)
    ]);
    expect(mocks.upsert).toHaveBeenCalledTimes(25);
    expect(mocks.upsert.mock.calls[0]![0]).toEqual({
      where: { openalexId: "F15" },
      create: {
        openalexId: "F15",
        name: "Funder F15",
        fundrefDoi: null,
        rorId: null,
        wikidataId: null,
        fetchedAt: NOW,
      },
      update: {
        name: "Funder F15",
        fundrefDoi: null,
        rorId: null,
        wikidataId: null,
        fetchedAt: NOW,
      },
    });
  });

  it("stores the canonicalised ids on the row", async () => {
    fetchMock.mockResolvedValue(jsonResponse(JSPS));
    await recordWorkFunders(makeCv([work("W1", ["F4320334764"])]), NOW);
    expect(mocks.upsert.mock.calls[0]![0].create).toEqual({
      openalexId: "F4320334764",
      name: "Japan Society for the Promotion of Science",
      fundrefDoi: "10.13039/501100001691",
      rorId: "03vhdva43",
      wikidataId: "Q1180431",
      fetchedAt: NOW,
    });
  });

  it("skips a funder OpenAlex no longer has (404) and carries on with the rest", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, 404))
      .mockResolvedValueOnce(jsonResponse(entity("F2")));
    await recordWorkFunders(makeCv([work("W1", ["F1", "F2"])]), NOW);
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    expect(mocks.upsert.mock.calls[0]![0].where).toEqual({ openalexId: "F2" });
    expect(mocks.warn).not.toHaveBeenCalled();
  });

  it("is fail-soft per funder: a failed fetch or a failed write is logged and the rest still lands", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({}, 400))
      .mockResolvedValueOnce(jsonResponse(entity("F2")))
      .mockResolvedValueOnce(jsonResponse(entity("F3")));
    mocks.upsert.mockRejectedValueOnce(new Error("db down")).mockResolvedValueOnce({});
    await expect(recordWorkFunders(makeCv([work("W1", ["F1", "F2", "F3"])]), NOW)).resolves.toEqual(
      { fetched: 2, stoppedForBudget: false },
    );
    expect(mocks.upsert).toHaveBeenCalledTimes(2);
    expect(mocks.warn).toHaveBeenCalledTimes(2);
    expect(mocks.warn.mock.calls[0]![0]).toBe("funder.record_failed");
    expect(mocks.warn.mock.calls[0]![1]).toMatchObject({ openalexId: "F1" });
    expect(mocks.warn.mock.calls[1]![1]).toMatchObject({ openalexId: "F2" });
  });

  it("is fail-soft as a whole: a failed freshness query is logged and nothing is fetched", async () => {
    mocks.findMany.mockRejectedValue(new Error("db down"));
    await expect(recordWorkFunders(makeCv([work("W1", ["F1"])]), NOW)).resolves.toEqual(NO_WORK);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(mocks.warn).toHaveBeenCalledWith("funder.record_failed", expect.anything());
  });

  it("stops at the wall-clock budget (checked before every fetch; an info-level event), leaving the rest for the next sync", async () => {
    // The clock is read once at the start and once before each fetch: the
    // first fetch is inside the budget, the second is not.
    let ticks = 0;
    const clock = () => (ticks++ < 2 ? 1_000 : 1_000 + 10_001);
    fetchMock.mockImplementation((u: URL | string) => {
      const id = new URL(u.toString()).pathname.split("/").pop()!;
      return Promise.resolve(jsonResponse(entity(id)));
    });
    const summary = await recordWorkFunders(makeCv([work("W1", ["F1", "F2", "F3"])]), NOW, {
      clock,
      budgetMs: 10_000,
    });
    expect(summary).toEqual({ fetched: 1, stoppedForBudget: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    expect(mocks.upsert.mock.calls[0]![0].where).toEqual({ openalexId: "F1" });
    expect(mocks.info).toHaveBeenCalledWith("funder.record_budget", {
      budgetMs: 10_000,
      remaining: 2,
    });
    expect(mocks.warn).not.toHaveBeenCalled();
  });

  it("defaults the budget to 10 s on the interactive path and the clock to Date.now", async () => {
    expect(FUNDER_BUDGET_MS).toBe(10_000);
    const spy = vi.spyOn(Date, "now").mockReturnValue(5_000);
    fetchMock.mockResolvedValue(jsonResponse(entity("F1")));
    const summary = await recordWorkFunders(makeCv([work("W1", ["F1"])]), NOW);
    expect(summary).toEqual({ fetched: 1, stoppedForBudget: false });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
