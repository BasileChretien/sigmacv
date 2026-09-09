import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
  AUTH_URL: "https://sigmacv.test",
});

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  countListedCvsByRor: vi.fn(),
  fetchInstitutionByRor: vi.fn(),
  groupWorks: vi.fn(),
  purgeInstitutionPages: vi.fn(),
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    institution: { findMany: mocks.findMany, update: mocks.update, updateMany: mocks.updateMany },
  },
}));
vi.mock("@/lib/cv/listed", () => ({ countListedCvsByRor: mocks.countListedCvsByRor }));
vi.mock("@/lib/openalex/institutions", () => ({
  fetchInstitutionByRor: mocks.fetchInstitutionByRor,
  groupWorks: mocks.groupWorks,
}));
vi.mock("@/lib/cv/publicPageCache", () => ({ purgeInstitutionPages: mocks.purgeInstitutionPages }));
vi.mock("@/lib/log", () => ({ logger: mocks.log }));

import { Prisma } from "@/generated/prisma/client";
import { COUNTED_WORK_TYPES } from "@/lib/institutions/snapshot";
import {
  INSTITUTION_REFRESH_BACKOFF_MS,
  INSTITUTION_REFRESH_INTERVAL_MS,
  refreshInstitutionProfiles,
} from "@/lib/openalex/institutionRefresh";

/**
 * The weekly OpenAlex snapshot job, run on the internal resync tick: stalest
 * rows first among the opted-in ROR sets, a bounded number of rows and calls,
 * fail-soft per row with a one-day back-off, OpenAlex columns cleared for RORs
 * that left the set, and a wall-clock budget.
 */

const T0 = Date.parse("2026-09-09T10:00:00Z");
const NOW = new Date(T0);
const DAY = 24 * 3600 * 1000;
const NAGOYA = "04chrp450";
const CAEN = "051kpcy16";
const TYPE_FILTER = `type:${COUNTED_WORK_TYPES.join("|")}`;

const entity = (id: string) => ({
  openalexId: id,
  displayName: `Org ${id}`,
  lineage: [id],
  related: [{ id: "I999", name: "Hospital", relationship: "related" }],
  worksCount: 10,
});

function sets(...rorIds: string[]) {
  mocks.countListedCvsByRor.mockResolvedValue(new Map(rorIds.map((r) => [r, 2])));
}

/** The `Institution` rows the job sees: the due query (ordered, capped)
 *  returns `due`; the bare existence query returns `existing`. */
function dbRows(due: string[], existing: string[] = due) {
  mocks.findMany.mockImplementation(async (args: { orderBy?: unknown }) =>
    ("orderBy" in args ? due : existing).map((rorId) => ({ rorId })),
  );
}

const EMPTY_SUMMARY = {
  candidates: 0,
  refreshed: 0,
  failed: 0,
  cleared: 0,
  missingRows: 0,
  missingRowIds: [],
  stoppedForBudget: false,
};

beforeEach(() => {
  for (const m of [
    mocks.findMany,
    mocks.update,
    mocks.updateMany,
    mocks.countListedCvsByRor,
    mocks.fetchInstitutionByRor,
    mocks.groupWorks,
    mocks.purgeInstitutionPages,
  ]) {
    m.mockReset();
  }
  for (const fn of Object.values(mocks.log)) fn.mockReset();
  mocks.update.mockResolvedValue({});
  mocks.updateMany.mockResolvedValue({ count: 0 });
  mocks.fetchInstitutionByRor.mockImplementation(async (ror: string) =>
    entity(ror === NAGOYA ? "I60134161" : "I98702875"),
  );
  mocks.groupWorks.mockResolvedValue({
    total: 3,
    groups: [{ key: "2025", label: "2025", count: 3 }],
  });
});
afterEach(() => vi.useRealTimers());

const opts = (over: Record<string, unknown> = {}) => ({
  maxRows: 20,
  paceMs: 0,
  clock: () => T0,
  ...over,
});

describe("refreshInstitutionProfiles", () => {
  it("picks the stalest rows first among the opted-in sets, capped at maxRows, and clears rows that left the set", async () => {
    sets(NAGOYA, CAEN, "not-a-ror");
    dbRows([NAGOYA], [NAGOYA, CAEN]);
    mocks.updateMany.mockResolvedValue({ count: 2 });

    const summary = await refreshInstitutionProfiles(opts({ maxRows: 5 }));

    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { rorId: { notIn: [NAGOYA, CAEN] }, openalexNextRefreshAt: { not: null } },
      data: {
        openalexId: null,
        openalexAggregates: Prisma.DbNull,
        openalexFetchedAt: null,
        openalexLastError: null,
        openalexNextRefreshAt: null,
      },
    });
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: {
        rorId: { in: [NAGOYA, CAEN] },
        OR: [{ openalexNextRefreshAt: null }, { openalexNextRefreshAt: { lte: NOW } }],
      },
      orderBy: { openalexNextRefreshAt: { sort: "asc", nulls: "first" } },
      take: 5,
      select: { rorId: true },
    });
    expect(summary).toEqual({ ...EMPTY_SUMMARY, candidates: 1, refreshed: 1, cleared: 2 });
  });

  it("counts and names (capped at 20) the opted-in sets with no Institution row, warns once with the ids, and never creates a row without a trusted ROR name", async () => {
    const missing = Array.from({ length: 22 }, (_, i) => `0aaaaaa${String(i).padStart(2, "0")}`);
    sets(NAGOYA, ...missing);
    dbRows([NAGOYA]);

    const summary = await refreshInstitutionProfiles(opts());

    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { rorId: { in: [NAGOYA, ...missing] } },
      select: { rorId: true },
    });
    expect(summary).toMatchObject({ candidates: 1, refreshed: 1, missingRows: 22 });
    expect(summary.missingRowIds).toEqual(missing.slice(0, 20));
    expect(mocks.log.warn).toHaveBeenCalledTimes(1);
    expect(mocks.log.warn).toHaveBeenCalledWith("institution.openalex_refresh_missing_rows", {
      missingRows: 22,
      missingRowIds: missing.slice(0, 20),
    });
    // The only write is the existing row's update — no upsert, no create.
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.update.mock.calls[0]![0].where).toEqual({ rorId: NAGOYA });
  });

  it("makes ~10 OpenAlex calls per institution — entity, works by year, OA status per year of the window, countries, co-affiliations — all type-filtered on the folded ids", async () => {
    sets(NAGOYA);
    dbRows([NAGOYA]);

    await refreshInstitutionProfiles(opts());

    expect(mocks.fetchInstitutionByRor).toHaveBeenCalledWith(NAGOYA);
    const calls = mocks.groupWorks.mock.calls.map((c) => c[0]);
    expect(calls).toHaveLength(1 + 7 + 1 + 1);
    const folded = ["I60134161", "I999"];
    expect(calls[0]).toEqual({
      lineageIds: folded,
      filters: [TYPE_FILTER, "publication_year:2020-2026"],
      groupBy: "publication_year",
    });
    for (let i = 0; i < 7; i++) {
      expect(calls[1 + i]).toEqual({
        lineageIds: folded,
        filters: [TYPE_FILTER, `publication_year:${2020 + i}`],
        groupBy: "open_access.oa_status",
      });
    }
    expect(calls[8]).toEqual({
      lineageIds: folded,
      filters: [TYPE_FILTER, "publication_year:2020-2026"],
      groupBy: "authorships.countries",
    });
    expect(calls[9]).toEqual({
      lineageIds: folded,
      filters: [TYPE_FILTER, "publication_year:2020-2026"],
      groupBy: "authorships.institutions.lineage",
    });
  });

  it("stores the counts-only aggregates with a weekly next refresh, clears the last error, and purges the cached page", async () => {
    sets(NAGOYA);
    dbRows([NAGOYA]);

    await refreshInstitutionProfiles(opts());

    expect(INSTITUTION_REFRESH_INTERVAL_MS).toBe(7 * DAY);
    expect(mocks.update).toHaveBeenCalledTimes(1);
    const { where, data } = mocks.update.mock.calls[0]![0];
    expect(where).toEqual({ rorId: NAGOYA });
    expect(data.openalexId).toBe("I60134161");
    expect(data.openalexFetchedAt).toEqual(NOW);
    expect(data.openalexLastError).toBeNull();
    expect(data.openalexNextRefreshAt).toEqual(new Date(T0 + 7 * DAY));
    expect(data.openalexAggregates.countedEntity.openalexId).toBe("I60134161");
    expect(data.openalexAggregates.worksByYear).toContainEqual({ year: 2025, count: 3 });
    expect(JSON.stringify(data.openalexAggregates)).not.toMatch(/share|pct|%/);
    expect(mocks.purgeInstitutionPages).toHaveBeenCalledWith([NAGOYA]);
    expect(mocks.log.info).toHaveBeenCalledWith(
      "institution.openalex_refreshed",
      expect.objectContaining({ refreshed: 1 }),
    );
  });

  it("is fail-soft per row: a failing row records the error and backs off one day, the next row still runs", async () => {
    sets(NAGOYA, CAEN);
    dbRows([NAGOYA, CAEN]);
    mocks.fetchInstitutionByRor.mockImplementation(async (ror: string) => {
      if (ror === NAGOYA) throw new Error("OpenAlex request failed (503)");
      return entity("I98702875");
    });

    const summary = await refreshInstitutionProfiles(opts());

    expect(INSTITUTION_REFRESH_BACKOFF_MS).toBe(DAY);
    expect(summary).toMatchObject({ candidates: 2, refreshed: 1, failed: 1 });
    const failing = mocks.update.mock.calls.find((c) => c[0].where.rorId === NAGOYA)![0];
    expect(failing.data).toEqual({
      openalexLastError: "OpenAlex request failed (503)",
      openalexNextRefreshAt: new Date(T0 + DAY),
    });
    expect(mocks.purgeInstitutionPages).toHaveBeenCalledTimes(1);
    expect(mocks.purgeInstitutionPages).toHaveBeenCalledWith([CAEN]);
    expect(mocks.log.warn).toHaveBeenCalledWith(
      "institution.openalex_refresh_failed",
      expect.objectContaining({ rorId: NAGOYA }),
    );
  });

  it("treats a ROR with no OpenAlex entity as a failure (backed off, error stated), and never trusts an unbounded error string", async () => {
    sets(NAGOYA);
    dbRows([NAGOYA]);
    mocks.fetchInstitutionByRor.mockResolvedValue(null);
    await refreshInstitutionProfiles(opts());
    expect(mocks.update.mock.calls[0]![0].data.openalexLastError).toMatch(
      /no OpenAlex institution/,
    );

    mocks.update.mockClear();
    mocks.fetchInstitutionByRor.mockRejectedValue(new Error("x".repeat(2000)));
    await refreshInstitutionProfiles(opts());
    expect(mocks.update.mock.calls[0]![0].data.openalexLastError).toHaveLength(500);

    mocks.update.mockClear();
    mocks.fetchInstitutionByRor.mockRejectedValue("not an Error");
    await refreshInstitutionProfiles(opts());
    expect(mocks.update.mock.calls[0]![0].data.openalexLastError).toBe("not an Error");
  });

  it("stops at the wall-clock budget (an info-level, steady-state event), leaving the remaining candidates for the next tick", async () => {
    sets(NAGOYA, CAEN);
    dbRows([NAGOYA, CAEN]);
    let ticks = 0;
    // The clock is read once at the start and once before each row.
    const clock = () => (ticks++ < 2 ? T0 : T0 + 61_000);

    const summary = await refreshInstitutionProfiles(opts({ clock, budgetMs: 60_000 }));

    expect(summary).toEqual({
      ...EMPTY_SUMMARY,
      candidates: 2,
      refreshed: 1,
      stoppedForBudget: true,
    });
    expect(mocks.fetchInstitutionByRor).toHaveBeenCalledTimes(1);
    expect(mocks.log.info).toHaveBeenCalledWith(
      "institution.openalex_refresh_budget",
      expect.objectContaining({ remaining: 1 }),
    );
    expect(mocks.log.warn).not.toHaveBeenCalled();
  });

  it("sleeps exactly paceMs before every OpenAlex works call (default 200 ms), defaulting the clock to Date.now and maxRows to 20", async () => {
    vi.useFakeTimers();
    sets(NAGOYA);
    dbRows([NAGOYA]);
    const before = Date.now();

    const run = refreshInstitutionProfiles({});
    await vi.advanceTimersByTimeAsync(199);
    expect(mocks.groupWorks).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(mocks.groupWorks).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(8 * 200);
    expect(mocks.groupWorks).toHaveBeenCalledTimes(9);
    await vi.advanceTimersByTimeAsync(199);
    expect(mocks.groupWorks).toHaveBeenCalledTimes(9);
    await vi.advanceTimersByTimeAsync(1);
    expect(mocks.groupWorks).toHaveBeenCalledTimes(10);

    const summary = await run;
    expect(summary.refreshed).toBe(1);
    const fetchedAt: Date = mocks.update.mock.calls[0]![0].data.openalexFetchedAt;
    expect(fetchedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(mocks.findMany.mock.calls[0]![0].take).toBe(20);
  });

  it("does nothing but clear when no set is opted in, and never throws on a database failure", async () => {
    sets();
    dbRows([]);
    expect(await refreshInstitutionProfiles(opts())).toEqual(EMPTY_SUMMARY);
    expect(mocks.fetchInstitutionByRor).not.toHaveBeenCalled();
    expect(mocks.log.info).not.toHaveBeenCalled();

    mocks.countListedCvsByRor.mockRejectedValue(new Error("db down"));
    expect(await refreshInstitutionProfiles(opts())).toMatchObject({ candidates: 0, refreshed: 0 });
    expect(mocks.log.error).toHaveBeenCalledWith(
      "institution.openalex_refresh_job_failed",
      expect.objectContaining({ err: expect.any(Error) }),
    );
  });

  it("logs and moves on when even the failure record cannot be written", async () => {
    sets(NAGOYA, CAEN);
    dbRows([NAGOYA, CAEN]);
    mocks.fetchInstitutionByRor.mockImplementationOnce(async () => {
      throw new Error("boom");
    });
    mocks.update.mockRejectedValueOnce(new Error("db write failed"));

    const summary = await refreshInstitutionProfiles(opts());

    expect(summary).toMatchObject({ refreshed: 1, failed: 1 });
    expect(mocks.log.error).toHaveBeenCalledWith(
      "institution.openalex_refresh_record_failed",
      expect.objectContaining({ rorId: NAGOYA }),
    );
  });
});
