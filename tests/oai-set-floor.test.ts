import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  count: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  deleteMany: vi.fn(),
  createMany: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    cv: {
      count: mocks.count,
      findMany: mocks.findMany,
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
    oaiDeletion: { deleteMany: mocks.deleteMany, createMany: mocks.createMany },
  },
}));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: mocks.warn, error: vi.fn() } }));

import { buildCanonicalCv } from "@/lib/canonical/build";
import { MIN_SET_MEMBERS } from "@/lib/cv/listed";
import {
  applyOaiWithdrawal,
  applySetCrossings,
  listedSet,
  readOaiWithdrawal,
  readSetFloor,
} from "@/lib/cv/oaiSetFloor";
import { harvestExposure, harvestRecord, harvestWrite } from "@/lib/cv/oaiState";
import { K_ANONYMITY } from "@/lib/institutions/aggregateSum";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const NOW = new Date("2026-10-15T08:00:00.000Z");
const SET = "ror:04chrp450";
const CV = buildCanonicalCv({
  id: "cv_1",
  resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A5001069481"], displayName: "Ada" },
  works: worksFixture as unknown as OpenAlexWork[],
  now: "2026-06-02T00:00:00.000Z",
});
const LISTED = {
  published: true,
  publicIndexable: true,
  publicSlug: "ada-x7",
  listUnderAffiliation: true,
  currentRorId: "04chrp450",
};
const OUT = { ...LISTED, listUnderAffiliation: false };

/** An in-memory OaiDeletion table behind the mocked client. */
function table() {
  const rows = new Map<string, Date>();
  // A set spec holds no space, so "<set> <identifier>" is unambiguous.
  const key = (setSpec: string, identifier: string) => `${setSpec} ${identifier}`;
  const matches = (v: string, f: string | { in: string[] }) =>
    typeof f === "string" ? v === f : f.in.includes(v);
  mocks.deleteMany.mockImplementation(
    async ({
      where,
    }: {
      where: { identifier: { in: string[] }; setSpec: string | { in: string[] } };
    }) => {
      for (const k of [...rows.keys()]) {
        const [setSpec, identifier] = [k.slice(0, k.indexOf(" ")), k.slice(k.indexOf(" ") + 1)];
        if (matches(identifier, where.identifier) && matches(setSpec, where.setSpec))
          rows.delete(k);
      }
      return { count: 0 };
    },
  );
  mocks.createMany.mockImplementation(
    async ({ data }: { data: Array<{ identifier: string; setSpec: string; deletedAt: Date }> }) => {
      for (const r of data) rows.set(key(r.setSpec, r.identifier), r.deletedAt);
      return { count: data.length };
    },
  );
  return {
    seed: (setSpec: string, identifier: string) => rows.set(key(setSpec, identifier), NOW),
    has: (setSpec: string, identifier: string) => rows.has(key(setSpec, identifier)),
  };
}

/** A member row of the set, as the crossing reads it. */
const member = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  ...LISTED,
  publicSlug: `${id}-slug`,
  oaiExposure: { ids: [`oai:sigmacv.org:${id}-slug`, `oai:sigmacv.org:${id}-slug/w/1`], set: SET },
  document: CV,
  ...extra,
});

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  mocks.update.mockResolvedValue({});
  mocks.deleteMany.mockResolvedValue({ count: 0 });
  mocks.createMany.mockResolvedValue({ count: 0 });
});

describe("the floor", () => {
  it("is the same k as the institution page's figures", () => {
    expect(MIN_SET_MEMBERS).toBe(K_ANONYMITY);
  });

  it("a CV is in a set only while published, indexable and listed with a key", () => {
    expect(listedSet(LISTED)).toBe("04chrp450");
    expect(listedSet(OUT)).toBeNull();
    expect(listedSet({ ...LISTED, publicIndexable: false })).toBeNull();
    expect(listedSet({ ...LISTED, currentRorId: null })).toBeNull();
    expect(listedSet(null)).toBeNull();
  });
});

describe("readSetFloor", () => {
  it("counts the OTHER listed CVs, leaving the writer's own row out by id", async () => {
    mocks.count.mockResolvedValue(4);
    const floor = await readSetFloor("cv_a", OUT, LISTED);
    expect(mocks.count).toHaveBeenCalledTimes(1);
    expect(mocks.count.mock.calls[0]![0].where).toMatchObject({
      published: true,
      publicIndexable: true,
      listUnderAffiliation: true,
      currentRorId: "04chrp450",
      id: { not: "cv_a" },
    });
    // 4 others + this one = 5: joining opens the set.
    expect(floor).toEqual({ openBefore: false, openAfter: true, opens: "04chrp450", closes: null });
  });

  it("leaving a set of five closes it; leaving a smaller or larger one closes nothing", async () => {
    mocks.count.mockResolvedValue(MIN_SET_MEMBERS - 1);
    expect(await readSetFloor("cv_a", LISTED, OUT)).toEqual({
      openBefore: true,
      openAfter: false,
      opens: null,
      closes: "04chrp450",
    });
    mocks.count.mockResolvedValue(2);
    expect((await readSetFloor("cv_a", LISTED, OUT)).closes).toBeNull();
    mocks.count.mockResolvedValue(9);
    expect((await readSetFloor("cv_a", LISTED, null)).closes).toBeNull();
  });

  it("a write that stays in its set crosses nothing; a first write counts everyone", async () => {
    mocks.count.mockResolvedValue(MIN_SET_MEMBERS - 1);
    expect(await readSetFloor("cv_a", LISTED, LISTED)).toEqual({
      openBefore: true,
      openAfter: true,
      opens: null,
      closes: null,
    });
    mocks.count.mockClear();
    await readSetFloor(null, null, LISTED);
    expect(mocks.count.mock.calls[0]![0].where).not.toHaveProperty("id");
    // No set before or after: no count at all.
    mocks.count.mockClear();
    expect(await readSetFloor("cv_a", OUT, OUT)).toEqual({
      openBefore: false,
      openAfter: false,
      opens: null,
      closes: null,
    });
    expect(mocks.count).not.toHaveBeenCalled();
  });
});

describe("what a write stores follows the floor (review of #563)", () => {
  it("joining or leaving a closed set moves no datestamp: nothing anyone can harvest changed", () => {
    // Served without its set while the set is closed: the fingerprint and the
    // exposure are the same listed or not, so a watcher of the institution
    // page's count cannot match the change to this record.
    const stored = harvestWrite(OUT, CV, {}, () => null, NOW, false).columns;
    const joined = harvestWrite(LISTED, CV, stored, () => null, NOW, false);
    expect(joined.columns.publicChangedAt).toBeUndefined();
    expect(joined.columns.oaiExposure.set).toBeNull();
    expect(joined.deletions).toEqual([]);
    const left = harvestWrite(OUT, CV, joined.columns, () => null, NOW, false);
    expect(left.columns.publicChangedAt).toBeUndefined();
    expect(left.deletions).toEqual([]);
  });

  it("joining an open set is a change, and leaving it deletes each record from it", () => {
    const stored = harvestWrite(OUT, CV, {}, () => null, NOW, false).columns;
    const joined = harvestWrite(LISTED, CV, stored, () => null, NOW, true);
    expect(joined.columns.publicChangedAt).toEqual(NOW);
    expect(joined.columns.oaiExposure.set).toBe(SET);
    const left = harvestWrite(OUT, CV, joined.columns, () => null, NOW, false);
    expect(left.columns.publicChangedAt).toEqual(NOW);
    expect(left.deletions.every((d) => d.setSpec === SET)).toBe(true);
    expect(left.deletions).toHaveLength(joined.columns.oaiExposure.ids.length);
  });
});

describe("applySetCrossings", () => {
  it("closing a set deletes every other member's records from it, so its harvesters drop them (review of #563)", async () => {
    const t = table();
    mocks.findMany.mockResolvedValue([member("b"), member("c"), member("d"), member("e")]);
    await applySetCrossings(
      { openBefore: true, openAfter: false, opens: null, closes: "04chrp450" },
      "cv_a",
      NOW,
    );
    expect(mocks.findMany.mock.calls[0]![0].where).toMatchObject({
      listUnderAffiliation: true,
      currentRorId: "04chrp450",
      id: { not: "cv_a" },
    });
    for (const id of ["b", "c", "d", "e"]) {
      expect(t.has(SET, `oai:sigmacv.org:${id}-slug`)).toBe(true);
      expect(t.has(SET, `oai:sigmacv.org:${id}-slug/w/1`)).toBe(true);
      // Still served in the repository: no repository-level deletion.
      expect(t.has("", `oai:sigmacv.org:${id}-slug`)).toBe(false);
    }
    // Their stored exposure loses the set and their datestamp moves.
    expect(mocks.update).toHaveBeenCalledTimes(4);
    expect(mocks.update.mock.calls[0]![0]).toEqual({
      where: { id: "b" },
      data: {
        oaiExposure: { ids: ["oai:sigmacv.org:b-slug", "oai:sigmacv.org:b-slug/w/1"], set: null },
        publicChangedAt: NOW,
      },
    });
    // So a later departure of one of them (its set closed, its exposure without
    // it) deletes nothing more from the set, and its set deletion, written at
    // the closing, stays (it is never lost).
    const b = { ...LISTED, publicSlug: "b-slug" };
    const closed = harvestExposure(harvestRecord(b, CV, NOW, false));
    const later = harvestWrite(
      { ...b, listUnderAffiliation: false },
      CV,
      { oaiExposure: closed },
      () => null,
      NOW,
      false,
    );
    expect(later.deletions).toEqual([]);
    expect(t.has(SET, "oai:sigmacv.org:b-slug")).toBe(true);
  });

  it("opening a set gives every other member the set back and clears their deletions from it", async () => {
    const t = table();
    t.seed(SET, "oai:sigmacv.org:b-slug");
    t.seed("", "oai:sigmacv.org:gone");
    mocks.findMany.mockResolvedValue([
      member("b", { oaiExposure: { ids: ["oai:sigmacv.org:b-slug"], set: null } }),
    ]);
    await applySetCrossings(
      { openBefore: false, openAfter: true, opens: "04chrp450", closes: null },
      "cv_a",
      NOW,
    );
    expect(t.has(SET, "oai:sigmacv.org:b-slug")).toBe(false);
    expect(t.has("", "oai:sigmacv.org:gone")).toBe(true);
    expect(mocks.update.mock.calls[0]![0].data).toEqual({
      oaiExposure: { ids: ["oai:sigmacv.org:b-slug"], set: SET },
      publicChangedAt: NOW,
    });
  });

  it("a member written before the exposure column is read from its document", async () => {
    table();
    mocks.findMany.mockResolvedValue([member("b", { oaiExposure: null, publicSlug: "ada-x7" })]);
    await applySetCrossings(
      { openBefore: true, openAfter: false, opens: null, closes: "04chrp450" },
      null,
      NOW,
    );
    expect(mocks.findMany.mock.calls[0]![0].where).not.toHaveProperty("id");
    expect(mocks.update.mock.calls[0]![0].data.oaiExposure.ids).toEqual(
      harvestExposure(harvestRecord(LISTED, CV, NOW)).ids,
    );
  });

  it("does nothing without a crossing, and never throws", async () => {
    await applySetCrossings(
      { openBefore: true, openAfter: true, opens: null, closes: null },
      "cv_a",
      NOW,
    );
    expect(mocks.findMany).not.toHaveBeenCalled();
    mocks.findMany.mockRejectedValue(new Error("db down"));
    await expect(
      applySetCrossings(
        { openBefore: true, openAfter: false, opens: null, closes: "04chrp450" },
        "cv_a",
        NOW,
      ),
    ).resolves.toBeUndefined();
    expect(mocks.warn).toHaveBeenCalledWith("oai.set_floor_failed", expect.anything());
  });
});

describe("account deletion (readOaiWithdrawal, then applyOaiWithdrawal)", () => {
  it("reads what the CV served and the floor of its set, and writes nothing yet", async () => {
    const exposure = { ids: ["oai:sigmacv.org:a", "oai:sigmacv.org:a/w/1"], set: SET };
    mocks.findUnique.mockResolvedValue({
      id: "cv_a",
      ...LISTED,
      oaiExposure: exposure,
      document: CV,
    });
    mocks.count.mockResolvedValue(MIN_SET_MEMBERS - 1);
    const w = await readOaiWithdrawal("u1", NOW);
    expect(mocks.findUnique.mock.calls[0]![0].where).toEqual({ userId: "u1" });
    expect(mocks.createMany).not.toHaveBeenCalled();
    expect(w!.cvId).toBe("cv_a");
    expect(w!.change.deletions).toHaveLength(4);
    expect(w!.change.served).toEqual({ ids: [], set: null });
    // The account was the fifth: its deletion closes the set.
    expect(w!.floor.closes).toBe("04chrp450");
  });

  it("derives a row with no stored exposure, with its set only if the set was open", async () => {
    mocks.findUnique.mockResolvedValue({ id: "cv_a", ...LISTED, oaiExposure: null, document: CV });
    mocks.count.mockResolvedValue(2);
    const closed = await readOaiWithdrawal("u1", NOW);
    expect(closed!.change.deletions.every((d) => d.setSpec === "")).toBe(true);
    mocks.count.mockResolvedValue(9);
    const open = await readOaiWithdrawal("u1", NOW);
    expect(open!.change.deletions.some((d) => d.setSpec === SET)).toBe(true);
  });

  it("is null for an account with no CV, and on a failed read", async () => {
    mocks.findUnique.mockResolvedValue(null);
    expect(await readOaiWithdrawal("u1", NOW)).toBeNull();
    mocks.findUnique.mockRejectedValue(new Error("db down"));
    expect(await readOaiWithdrawal("u1", NOW)).toBeNull();
    expect(mocks.warn).toHaveBeenCalledWith("oai.withdraw_failed", expect.anything());
  });

  it("applying it records the deletions, then closes the set if the account kept it open", async () => {
    const t = table();
    mocks.findMany.mockResolvedValue([member("b")]);
    await applyOaiWithdrawal(
      {
        cvId: "cv_a",
        change: {
          deletions: [{ identifier: "oai:sigmacv.org:a", setSpec: "" }],
          served: { ids: [], set: null },
        },
        floor: { openBefore: true, openAfter: false, opens: null, closes: "04chrp450" },
      },
      NOW,
    );
    expect(t.has("", "oai:sigmacv.org:a")).toBe(true);
    expect(t.has(SET, "oai:sigmacv.org:b-slug")).toBe(true);
  });
});
