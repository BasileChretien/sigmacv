import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  deleteMany: vi.fn(),
  createMany: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  cvFindUnique: vi.fn(),
  cvCount: vi.fn(),
  cvUpdateMany: vi.fn(),
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
    cv: { findUnique: mocks.cvFindUnique, count: mocks.cvCount, updateMany: mocks.cvUpdateMany },
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
  readOaiWithdrawal,
} from "@/lib/cv/oaiDeletions";
import { MIN_SET_MEMBERS } from "@/lib/cv/listed";
import { K_ANONYMITY } from "@/lib/institutions/aggregateSum";
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
  // Every set touched is well above the floor unless a test says otherwise.
  mocks.cvCount.mockResolvedValue(MIN_SET_MEMBERS + 5);
  mocks.cvUpdateMany.mockResolvedValue({ count: 0 });
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
    // A key deleted again moves to the new date: its old row goes first, set by
    // set (exact keys, never a cross product), before anything is written.
    expect(mocks.deleteMany.mock.calls[1]![0]).toEqual({
      where: { identifier: { in: ["oai:sigmacv.org:a/w/1"] }, setSpec: "" },
    });
    expect(mocks.deleteMany.mock.calls[2]![0]).toEqual({
      where: { identifier: { in: ["oai:sigmacv.org:a/w/1"] }, setSpec: "ror:04chrp450" },
    });
    expect(mocks.deleteMany.mock.invocationCallOrder[2]!).toBeLessThan(
      mocks.createMany.mock.invocationCallOrder[0]!,
    );
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

describe("readOaiWithdrawal (account deletion)", () => {
  it("reads everything the stored exposure says the CV served, as a change to apply after the deletion", async () => {
    const exposure = { ids: ["oai:sigmacv.org:a", "oai:sigmacv.org:a/w/1"], set: "ror:04chrp450" };
    mocks.cvFindUnique.mockResolvedValue({ ...ROW, oaiExposure: exposure, document: CV });
    const change = await readOaiWithdrawal("u1", NOW);
    expect(mocks.cvFindUnique.mock.calls[0]![0].where).toEqual({ userId: "u1" });
    // Nothing is written yet: the deletion has not happened.
    expect(mocks.createMany).not.toHaveBeenCalled();
    expect(change!.deletions).toHaveLength(4);
    expect(change!.deletions).toContainEqual({ identifier: "oai:sigmacv.org:a", setSpec: "" });
    expect(change!.deletions).toContainEqual({
      identifier: "oai:sigmacv.org:a/w/1",
      setSpec: "ror:04chrp450",
    });
    expect(change!.served).toEqual({ ids: [], set: null });
    // Once the row is gone the CV is out of its set's count: it departed.
    expect(change!.departed).toBe("ror:04chrp450");
    expect(change!.joined).toBeNull();
  });

  it("derives it from the document for a row written before the column existed", async () => {
    mocks.cvFindUnique.mockResolvedValue({ ...ROW, oaiExposure: null, document: CV });
    const change = await readOaiWithdrawal("u1", NOW);
    const expected = harvestExposure(harvestRecord(ROW, CV, NOW)).ids;
    expect(new Set(change!.deletions.map((d) => d.identifier))).toEqual(new Set(expected));
  });

  it("is null for an account with no CV, and empty for a CV that served nothing", async () => {
    mocks.cvFindUnique.mockResolvedValue(null);
    expect(await readOaiWithdrawal("u1", NOW)).toBeNull();
    mocks.cvFindUnique.mockResolvedValue({
      ...ROW,
      published: false,
      oaiExposure: null,
      document: { bad: 1 },
    });
    expect((await readOaiWithdrawal("u1", NOW))!.deletions).toEqual([]);
  });

  it("never throws: the erasure never waits on it", async () => {
    mocks.cvFindUnique.mockRejectedValue(new Error("db down"));
    expect(await readOaiWithdrawal("u1", NOW)).toBeNull();
    expect(mocks.warn).toHaveBeenCalledWith("oai.withdraw_failed", expect.anything());
  });
});

describe("the set floor on deleted records (2026-09-08 panel, defect 2)", () => {
  const SET = "ror:04chrp450";
  const left = (setSpec: string) => [
    { identifier: "oai:sigmacv.org:a", setSpec: "" },
    { identifier: "oai:sigmacv.org:a", setSpec },
  ];
  const written = () =>
    mocks.createMany.mock.calls.flatMap((c) => c[0].data) as Array<{ setSpec: string }>;

  it("is the same k as the institution page's figures", () => {
    expect(MIN_SET_MEMBERS).toBe(K_ANONYMITY);
  });

  it("a departure from a set that was never published is no deleted record in it (it would name a member)", async () => {
    // 3 left after the write, plus the CV that just left = 4: below the floor.
    mocks.cvCount.mockResolvedValue(MIN_SET_MEMBERS - 2);
    await applyOaiDeletions(
      { deletions: left(SET), served: { ids: [], set: null }, departed: SET, joined: null },
      NOW,
    );
    expect(mocks.cvCount.mock.calls[0]![0].where).toMatchObject({
      listUnderAffiliation: true,
      currentRorId: "04chrp450",
    });
    // The repository-level deletion is never held back.
    expect(written().map((d) => d.setSpec)).toEqual([""]);
  });

  it("a departure from an open set is one, counting the CV that just left", async () => {
    // 4 left after the write + the departed CV = 5: the set was open.
    mocks.cvCount.mockResolvedValue(MIN_SET_MEMBERS - 1);
    await applyOaiDeletions(
      { deletions: left(SET), served: { ids: [], set: null }, departed: SET, joined: null },
      NOW,
    );
    expect(
      written()
        .map((d) => d.setSpec)
        .sort(),
    ).toEqual(["", SET]);
  });

  it("a work taken off a CV that stays in its set counts the set as it stands", async () => {
    mocks.cvCount.mockResolvedValue(MIN_SET_MEMBERS - 1);
    await applyOaiDeletions(
      { deletions: left(SET), served: { ids: ["oai:sigmacv.org:a"], set: SET } },
      NOW,
    );
    expect(written().map((d) => d.setSpec)).toEqual([""]);
  });

  it("a write that brings a set up to the floor, or takes it below, moves every member's datestamp", async () => {
    mocks.cvCount.mockResolvedValue(MIN_SET_MEMBERS);
    await applyOaiDeletions(
      {
        deletions: [],
        served: { ids: ["oai:sigmacv.org:a"], set: SET },
        departed: null,
        joined: SET,
      },
      NOW,
    );
    expect(mocks.cvUpdateMany).toHaveBeenCalledWith({
      where: {
        published: true,
        publicIndexable: true,
        listUnderAffiliation: true,
        currentRorId: "04chrp450",
      },
      data: { publicChangedAt: NOW },
    });
    mocks.cvUpdateMany.mockClear();
    mocks.cvCount.mockResolvedValue(MIN_SET_MEMBERS - 1);
    await applyOaiDeletions(
      { deletions: left(SET), served: { ids: [], set: null }, departed: SET, joined: null },
      NOW,
    );
    expect(mocks.cvUpdateMany).toHaveBeenCalledTimes(1);
    // A write that leaves the set on the same side of the floor stamps nobody.
    mocks.cvUpdateMany.mockClear();
    mocks.cvCount.mockResolvedValue(MIN_SET_MEMBERS + 3);
    await applyOaiDeletions(
      { deletions: left(SET), served: { ids: [], set: null }, departed: SET, joined: null },
      NOW,
    );
    await applyOaiDeletions(
      { deletions: [], served: { ids: ["x"], set: SET }, departed: null, joined: SET },
      NOW,
    );
    expect(mocks.cvUpdateMany).not.toHaveBeenCalled();
  });

  it("a change with no set touches no count", async () => {
    await applyOaiDeletions(
      {
        deletions: [{ identifier: "oai:sigmacv.org:a", setSpec: "" }],
        served: { ids: [], set: null },
      },
      NOW,
    );
    expect(mocks.cvCount).not.toHaveBeenCalled();
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

describe("applyOaiDeletions against a table (review of #561)", () => {
  /** An in-memory OaiDeletion table behind the mocked client. */
  function table() {
    const rows = new Map<string, { identifier: string; setSpec: string; deletedAt: Date }>();
    // A set spec holds no space, so "<set> <identifier>" is unambiguous.
    const key = (identifier: string, setSpec: string) => `${setSpec} ${identifier}`;
    const inList = (v: string, f: string | { in: string[] }) =>
      typeof f === "string" ? v === f : f.in.includes(v);
    mocks.deleteMany.mockImplementation(
      async ({
        where,
      }: {
        where: { identifier: { in: string[] }; setSpec: string | { in: string[] } };
      }) => {
        let count = 0;
        for (const [k, r] of rows) {
          if (inList(r.identifier, where.identifier) && inList(r.setSpec, where.setSpec)) {
            rows.delete(k);
            count++;
          }
        }
        return { count };
      },
    );
    mocks.createMany.mockImplementation(
      async ({
        data,
      }: {
        data: Array<{ identifier: string; setSpec: string; deletedAt: Date }>;
      }) => {
        for (const r of data)
          if (!rows.has(key(r.identifier, r.setSpec))) rows.set(key(r.identifier, r.setSpec), r);
        return { count: data.length };
      },
    );
    return {
      has: (identifier: string, setSpec: string) => rows.has(key(identifier, setSpec)),
      size: () => rows.size,
    };
  }

  it("keeps every key when one record's two keys fall in different chunks", async () => {
    const t = table();
    // 999 works still served that left the set (one key each), then a work taken
    // off (two keys) straddling the 1,000-key chunk boundary, then another.
    const deletions = [
      ...Array.from({ length: 999 }, (_, i) => ({
        identifier: `oai:sigmacv.org:a/w/s${i}`,
        setSpec: "ror:04chrp450",
      })),
      { identifier: "oai:sigmacv.org:a/w/X", setSpec: "" },
      { identifier: "oai:sigmacv.org:a/w/X", setSpec: "ror:04chrp450" },
      { identifier: "oai:sigmacv.org:a/w/Y", setSpec: "" },
      { identifier: "oai:sigmacv.org:a/w/Y", setSpec: "ror:04chrp450" },
    ];
    await applyOaiDeletions({ served: { ids: [], set: null }, deletions }, NOW);
    expect(t.has("oai:sigmacv.org:a/w/X", "")).toBe(true);
    expect(t.has("oai:sigmacv.org:a/w/X", "ror:04chrp450")).toBe(true);
    expect(t.has("oai:sigmacv.org:a/w/Y", "")).toBe(true);
    expect(t.size()).toBe(deletions.length);
  });

  it("a key deleted again moves to the new date, and touches no other key", async () => {
    const t = table();
    const earlier = new Date("2026-10-01T00:00:00.000Z");
    await applyOaiDeletions(
      {
        served: { ids: [], set: null },
        deletions: [
          { identifier: "oai:sigmacv.org:a", setSpec: "" },
          { identifier: "oai:sigmacv.org:b", setSpec: "ror:04chrp450" },
        ],
      },
      earlier,
    );
    await applyOaiDeletions(
      {
        served: { ids: [], set: null },
        deletions: [{ identifier: "oai:sigmacv.org:a", setSpec: "" }],
      },
      NOW,
    );
    expect(t.has("oai:sigmacv.org:a", "")).toBe(true);
    expect(t.has("oai:sigmacv.org:b", "ror:04chrp450")).toBe(true);
    const created = mocks.createMany.mock.calls.at(-1)![0].data;
    expect(created).toEqual([{ identifier: "oai:sigmacv.org:a", setSpec: "", deletedAt: NOW }]);
  });
});
