import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteMany: vi.fn(),
  createMany: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  cvFindUnique: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    oaiDeletion: {
      deleteMany: mocks.deleteMany,
      createMany: mocks.createMany,
      findFirst: mocks.findFirst,
      findMany: mocks.findMany,
      findUnique: mocks.findUnique,
    },
    cv: { findUnique: mocks.cvFindUnique },
  },
}));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: mocks.warn, error: vi.fn() } }));

import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  OAI_DELETION_RETENTION_DAYS,
  applyOaiDeletions,
  findOaiDeletion,
  hasOaiDeletions,
  listOaiDeletions,
  purgeExpiredOaiDeletions,
  withdrawOaiRecords,
} from "@/lib/cv/oaiDeletions";
import { harvestExposure, harvestRecord } from "@/lib/cv/oaiState";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const NOW = new Date("2026-10-15T08:00:00.000Z");
const CV = buildCanonicalCv({
  id: "cv_1",
  resolved: {
    orcid: "0000-0002-7483-2489",
    authorIds: ["A5001069481"],
    displayName: "Ada",
  },
  works: worksFixture as unknown as OpenAlexWork[],
  now: "2026-06-02T00:00:00.000Z",
});
const ROW = {
  published: true,
  publicIndexable: true,
  publicSlug: "ada-x7",
  listUnderAffiliation: true,
  currentRorId: "04chrp450",
};

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  mocks.deleteMany.mockResolvedValue({ count: 0 });
  mocks.createMany.mockResolvedValue({ count: 0 });
});

describe("applyOaiDeletions", () => {
  it("clears the deletions of what is served, then records what went, dated now", async () => {
    await applyOaiDeletions(
      {
        served: { ids: ["oai:sigmacv.org:a"], set: "ror:04chrp450" },
        deletions: [
          { identifier: "oai:sigmacv.org:a/w/1", setSpec: "" },
          { identifier: "oai:sigmacv.org:a/w/1", setSpec: "ror:04chrp450" },
        ],
      },
      NOW,
    );
    // A record served again is no longer deleted, in the repository or its set.
    expect(mocks.deleteMany.mock.calls[0]![0]).toEqual({
      where: { identifier: { in: ["oai:sigmacv.org:a"] }, setSpec: { in: ["", "ror:04chrp450"] } },
    });
    // A key deleted again moves to the new date: its old row goes first.
    expect(mocks.deleteMany.mock.calls[1]![0]).toEqual({
      where: {
        identifier: { in: ["oai:sigmacv.org:a/w/1"] },
        setSpec: { in: ["", "ror:04chrp450"] },
      },
    });
    expect(mocks.createMany).toHaveBeenCalledWith({
      data: [
        { identifier: "oai:sigmacv.org:a/w/1", setSpec: "", deletedAt: NOW },
        { identifier: "oai:sigmacv.org:a/w/1", setSpec: "ror:04chrp450", deletedAt: NOW },
      ],
      skipDuplicates: true,
    });
  });

  it("a CV outside any set clears only repository deletions; nothing to do is no query", async () => {
    await applyOaiDeletions({ served: { ids: ["x"], set: null }, deletions: [] }, NOW);
    expect(mocks.deleteMany).toHaveBeenCalledTimes(1);
    expect(mocks.deleteMany.mock.calls[0]![0].where.setSpec).toEqual({ in: [""] });
    expect(mocks.createMany).not.toHaveBeenCalled();
    mocks.deleteMany.mockClear();
    await applyOaiDeletions({ served: { ids: [], set: null }, deletions: [] }, NOW);
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("writes in chunks a statement can bind, for a CV near the item cap", async () => {
    const ids = Array.from({ length: 2500 }, (_, i) => `oai:sigmacv.org:a/w/${i}`);
    await applyOaiDeletions(
      {
        served: { ids: [], set: null },
        deletions: ids.map((identifier) => ({ identifier, setSpec: "" })),
      },
      NOW,
    );
    expect(mocks.createMany).toHaveBeenCalledTimes(3);
    expect(mocks.createMany.mock.calls.map((c) => c[0].data.length)).toEqual([1000, 1000, 500]);
  });

  it("never throws: a failed write is logged, the owner's write stands", async () => {
    mocks.deleteMany.mockRejectedValue(new Error("db down"));
    await expect(
      applyOaiDeletions({ served: { ids: ["x"], set: null }, deletions: [] }, NOW),
    ).resolves.toBeUndefined();
    expect(mocks.warn).toHaveBeenCalledWith("oai.deletions_failed", expect.anything());
  });
});

describe("withdrawOaiRecords (account deletion)", () => {
  it("deletes everything the stored exposure says the CV served", async () => {
    const exposure = { ids: ["oai:sigmacv.org:a", "oai:sigmacv.org:a/w/1"], set: "ror:04chrp450" };
    mocks.cvFindUnique.mockResolvedValue({ ...ROW, oaiExposure: exposure, document: CV });
    await withdrawOaiRecords("u1", NOW);
    expect(mocks.cvFindUnique.mock.calls[0]![0].where).toEqual({ userId: "u1" });
    const data = mocks.createMany.mock.calls[0]![0].data;
    expect(data).toHaveLength(4);
    expect(data).toContainEqual({ identifier: "oai:sigmacv.org:a", setSpec: "", deletedAt: NOW });
    expect(data).toContainEqual({
      identifier: "oai:sigmacv.org:a/w/1",
      setSpec: "ror:04chrp450",
      deletedAt: NOW,
    });
  });

  it("derives it from the document for a row written before the column existed", async () => {
    mocks.cvFindUnique.mockResolvedValue({ ...ROW, oaiExposure: null, document: CV });
    await withdrawOaiRecords("u1", NOW);
    const expected = harvestExposure(harvestRecord(ROW, CV, NOW)).ids;
    const data = mocks.createMany.mock.calls[0]![0].data as Array<{ identifier: string }>;
    expect(new Set(data.map((d) => d.identifier))).toEqual(new Set(expected));
  });

  it("does nothing for an account with no CV, or a CV that served nothing", async () => {
    mocks.cvFindUnique.mockResolvedValue(null);
    await withdrawOaiRecords("u1", NOW);
    mocks.cvFindUnique.mockResolvedValue({
      ...ROW,
      published: false,
      oaiExposure: null,
      document: { bad: 1 },
    });
    await withdrawOaiRecords("u1", NOW);
    expect(mocks.createMany).not.toHaveBeenCalled();
  });

  it("never throws: the erasure never waits on it", async () => {
    mocks.cvFindUnique.mockRejectedValue(new Error("db down"));
    await expect(withdrawOaiRecords("u1", NOW)).resolves.toBeUndefined();
    expect(mocks.warn).toHaveBeenCalledWith("oai.withdraw_failed", expect.anything());
  });
});

describe("reading the deleted records", () => {
  it("lists one set's deletions by row id after a cursor, filtered on the date, until inclusive", async () => {
    mocks.findMany.mockResolvedValue([
      { id: "c1", identifier: "oai:sigmacv.org:a", deletedAt: NOW },
      { id: "c2", identifier: "oai:sigmacv.org:b", deletedAt: NOW },
      { id: "c3", identifier: "oai:sigmacv.org:c", deletedAt: NOW },
    ]);
    const from = new Date("2026-10-01T00:00:00Z");
    const until = new Date("2026-10-15T23:59:59Z");
    const page = await listOaiDeletions({ setSpec: "", from, until, after: "c0", limit: 2 });
    expect(mocks.findMany.mock.calls[0]![0]).toEqual({
      where: {
        setSpec: "",
        deletedAt: { gte: from, lt: new Date("2026-10-16T00:00:00Z") },
        id: { gt: "c0" },
      },
      select: { id: true, identifier: true, deletedAt: true },
      orderBy: { id: "asc" },
      take: 3,
    });
    expect(page).toEqual({
      rows: [
        { identifier: "oai:sigmacv.org:a", deletedAt: NOW },
        { identifier: "oai:sigmacv.org:b", deletedAt: NOW },
      ],
      next: "c2",
    });
  });

  it("starts from the first with no cursor and no dates, and says when none follows", async () => {
    mocks.findMany.mockResolvedValue([
      { id: "c1", identifier: "oai:sigmacv.org:a", deletedAt: NOW },
    ]);
    const page = await listOaiDeletions({ setSpec: "ror:04chrp450", after: "", limit: 2 });
    expect(mocks.findMany.mock.calls[0]![0].where).toEqual({ setSpec: "ror:04chrp450" });
    expect(page.next).toBeNull();
    mocks.findMany.mockClear();
    await listOaiDeletions({ setSpec: "", from: NOW, after: "", limit: 2 });
    expect(mocks.findMany.mock.calls[0]![0].where).toEqual({
      setSpec: "",
      deletedAt: { gte: NOW },
    });
  });

  it("tells whether any deletion matches", async () => {
    mocks.findFirst.mockResolvedValueOnce({ identifier: "x" }).mockResolvedValueOnce(null);
    expect(await hasOaiDeletions({ setSpec: "", until: NOW })).toBe(true);
    expect(mocks.findFirst.mock.calls[0]![0].where).toEqual({
      setSpec: "",
      deletedAt: { lt: new Date(NOW.getTime() + 1000) },
    });
    expect(await hasOaiDeletions({ setSpec: "" })).toBe(false);
  });

  it("finds when an identifier left the repository", async () => {
    mocks.findUnique.mockResolvedValueOnce({ deletedAt: NOW }).mockResolvedValueOnce(null);
    expect(await findOaiDeletion("oai:sigmacv.org:a")).toEqual(NOW);
    expect(mocks.findUnique.mock.calls[0]![0].where).toEqual({
      identifier_setSpec: { identifier: "oai:sigmacv.org:a", setSpec: "" },
    });
    expect(await findOaiDeletion("oai:sigmacv.org:b")).toBeNull();
  });
});

describe("purgeExpiredOaiDeletions", () => {
  it("drops what is older than the retention period", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 7 });
    expect(await purgeExpiredOaiDeletions(NOW)).toBe(7);
    expect(mocks.deleteMany).toHaveBeenCalledWith({
      where: {
        deletedAt: {
          lt: new Date(NOW.getTime() - OAI_DELETION_RETENTION_DAYS * 86_400_000),
        },
      },
    });
    expect(OAI_DELETION_RETENTION_DAYS).toBe(30);
  });

  it("never throws", async () => {
    mocks.deleteMany.mockRejectedValue(new Error("db down"));
    expect(await purgeExpiredOaiDeletions(NOW)).toBe(0);
    expect(mocks.warn).toHaveBeenCalledWith("oai.deletions_purge_failed", expect.anything());
  });
});
