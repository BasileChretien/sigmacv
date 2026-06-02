import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  updateMany: vi.fn(),
  update: vi.fn(),
  syncCvForUser: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    cv: {
      findMany: mocks.findMany,
      updateMany: mocks.updateMany,
      update: mocks.update,
    },
  },
}));
vi.mock("@/lib/cv/sync", () => ({ syncCvForUser: mocks.syncCvForUser }));

import { acquireResyncLock, resyncDueCvs } from "@/lib/cv/resync";

beforeEach(() => {
  mocks.findMany.mockReset();
  mocks.updateMany.mockReset().mockResolvedValue({ count: 1 });
  mocks.update.mockReset().mockResolvedValue({});
  mocks.syncCvForUser.mockReset().mockResolvedValue(undefined);
});

describe("acquireResyncLock", () => {
  it("is acquired only when exactly one row was updated (atomic CAS)", async () => {
    mocks.updateMany.mockResolvedValueOnce({ count: 1 });
    expect(await acquireResyncLock("x", 1000)).toBe(true);
    mocks.updateMany.mockResolvedValueOnce({ count: 0 });
    expect(await acquireResyncLock("x", 1000)).toBe(false);
  });
});

describe("resyncDueCvs", () => {
  it("syncs due CVs, skips missing ORCID, and isolates per-row failures", async () => {
    mocks.findMany.mockResolvedValue([
      { id: "a", userId: "ua", lastSyncedAt: null, user: { orcid: "0000-A", name: "A" } },
      { id: "b", userId: "ub", lastSyncedAt: null, user: { orcid: null, name: "B" } },
      { id: "c", userId: "uc", lastSyncedAt: null, user: { orcid: "0000-C", name: "C" } },
    ]);
    mocks.syncCvForUser.mockImplementation(async ({ userId }: { userId: string }) => {
      if (userId === "uc") throw new Error("boom");
    });

    const s = await resyncDueCvs({ paceMs: 0 });

    expect(s.scanned).toBe(3);
    expect(s.skipped).toBe(1); // b has no orcid
    expect(s.synced).toBe(1); // a
    expect(s.failed).toBe(1); // c threw
    expect(s.errors[0]).toContain("c:");
    expect(mocks.syncCvForUser).toHaveBeenCalledTimes(2);
  });

  it("counts a CV as locked (and skips sync) when the lock isn't acquired", async () => {
    mocks.findMany.mockResolvedValue([
      { id: "a", userId: "ua", lastSyncedAt: null, user: { orcid: "0000-A", name: "A" } },
    ]);
    mocks.updateMany.mockResolvedValue({ count: 0 }); // already locked elsewhere

    const s = await resyncDueCvs({ paceMs: 0 });

    expect(s.locked).toBe(1);
    expect(s.synced).toBe(0);
    expect(mocks.syncCvForUser).not.toHaveBeenCalled();
  });

  it("returns an empty summary when nothing is due", async () => {
    mocks.findMany.mockResolvedValue([]);
    const s = await resyncDueCvs({ paceMs: 0 });
    expect(s).toMatchObject({ scanned: 0, synced: 0, skipped: 0, locked: 0, failed: 0 });
  });

  it("paces between rows and tolerates a lock-release failure", async () => {
    mocks.findMany.mockResolvedValue([
      { id: "a", userId: "ua", lastSyncedAt: null, user: { orcid: "0000-A", name: "A" } },
    ]);
    mocks.update.mockRejectedValue(new Error("release failed")); // release is best-effort
    const s = await resyncDueCvs({ paceMs: 1 }); // exercises the pacing delay
    expect(s.synced).toBe(1);
  });
});
