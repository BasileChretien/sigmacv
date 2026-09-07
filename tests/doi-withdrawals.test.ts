import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  upsert: vi.fn(),
  findMany: vi.fn(),
  del: vi.fn(),
  update: vi.fn(),
  doiMintingEnabled: vi.fn(),
  tombstoneSnapshotDoi: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    doiWithdrawal: {
      upsert: mocks.upsert,
      findMany: mocks.findMany,
      delete: mocks.del,
      update: mocks.update,
    },
  },
}));
vi.mock("@/lib/datacite/mint", () => ({
  doiMintingEnabled: mocks.doiMintingEnabled,
  tombstoneSnapshotDoi: mocks.tombstoneSnapshotDoi,
}));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { logger } from "@/lib/log";
import {
  DOI_WITHDRAWAL_DRAIN_LIMIT,
  DOI_WITHDRAWAL_MAX_ATTEMPTS,
  drainPendingDoiWithdrawals,
  recordPendingDoiWithdrawal,
} from "@/lib/cv/doiWithdrawals";

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  for (const fn of Object.values(logger)) vi.mocked(fn).mockReset();
  mocks.doiMintingEnabled.mockReturnValue(true);
  mocks.upsert.mockResolvedValue({});
  mocks.del.mockResolvedValue({});
  mocks.update.mockResolvedValue({});
});

describe("recordPendingDoiWithdrawal", () => {
  it("upserts the DOI with the failure reason (a retry bumps the counter, never duplicates)", async () => {
    await recordPendingDoiWithdrawal("10.1/a", "http-502");
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    expect(mocks.upsert.mock.calls[0]![0]).toEqual({
      where: { doi: "10.1/a" },
      create: { doi: "10.1/a", lastError: "http-502" },
      update: { attempts: { increment: 1 }, lastError: "http-502" },
    });
  });

  it("holds no personal data: only the DOI and the machine reason are written", async () => {
    await recordPendingDoiWithdrawal("10.1/a", "network");
    const arg = JSON.stringify(mocks.upsert.mock.calls[0]![0]);
    expect(Object.keys((mocks.upsert.mock.calls[0]![0] as { create: object }).create)).toEqual([
      "doi",
      "lastError",
    ]);
    expect(arg).not.toMatch(/user|orcid|name/i);
  });

  it("is fail-soft: a DB error is logged at error level, never thrown", async () => {
    mocks.upsert.mockRejectedValue(new Error("db down"));
    await expect(recordPendingDoiWithdrawal("10.1/a", "network")).resolves.toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith(
      "snapshot.doi_withdrawal_queue_failed",
      expect.objectContaining({ doi: "10.1/a" }),
    );
  });
});

describe("drainPendingDoiWithdrawals", () => {
  it("is a no-op — not even a DB read — while minting is disabled", async () => {
    mocks.doiMintingEnabled.mockReturnValue(false);
    expect(await drainPendingDoiWithdrawals()).toEqual({ attempted: 0, withdrawn: 0 });
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("retries each queued DOI (oldest first, bounded batch, below the attempt cap) and clears it on success", async () => {
    mocks.findMany.mockResolvedValue([{ doi: "10.1/a" }, { doi: "10.1/b" }]);
    mocks.tombstoneSnapshotDoi.mockResolvedValue({ ok: true });
    expect(await drainPendingDoiWithdrawals()).toEqual({ attempted: 2, withdrawn: 2 });
    expect(mocks.findMany.mock.calls[0]![0]).toEqual({
      where: { attempts: { lt: DOI_WITHDRAWAL_MAX_ATTEMPTS } },
      orderBy: { updatedAt: "asc" },
      take: DOI_WITHDRAWAL_DRAIN_LIMIT,
      select: { doi: true },
    });
    // The queue holds no name, so the retry sends the DOI alone.
    expect(mocks.tombstoneSnapshotDoi.mock.calls.map((c) => c[0])).toEqual([
      { doi: "10.1/a" },
      { doi: "10.1/b" },
    ]);
    expect(mocks.del.mock.calls.map((c) => c[0])).toEqual([
      { where: { doi: "10.1/a" } },
      { where: { doi: "10.1/b" } },
    ]);
    expect(mocks.update).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith("snapshot.doi_withdrawals_drained", {
      attempted: 2,
      withdrawn: 2,
    });
  });

  it("keeps a still-failing DOI queued with the attempt bumped and the last error recorded", async () => {
    mocks.findMany.mockResolvedValue([{ doi: "10.1/a" }, { doi: "10.1/b" }]);
    mocks.tombstoneSnapshotDoi
      .mockResolvedValueOnce({ ok: false, reason: "http-503" })
      .mockResolvedValueOnce({ ok: true });
    expect(await drainPendingDoiWithdrawals({ limit: 5 })).toEqual({ attempted: 2, withdrawn: 1 });
    expect(mocks.findMany.mock.calls[0]![0]).toMatchObject({ take: 5 });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { doi: "10.1/a" },
      data: { attempts: { increment: 1 }, lastError: "http-503" },
    });
    expect(mocks.del).toHaveBeenCalledTimes(1);
    expect(mocks.del).toHaveBeenCalledWith({ where: { doi: "10.1/b" } });
    expect(logger.warn).toHaveBeenCalledWith("snapshot.doi_withdrawals_drained", {
      attempted: 2,
      withdrawn: 1,
    });
  });

  it("is fail-soft: a DB error mid-batch is logged and the counts so far are returned", async () => {
    mocks.findMany.mockResolvedValue([{ doi: "10.1/a" }, { doi: "10.1/b" }]);
    mocks.tombstoneSnapshotDoi.mockResolvedValue({ ok: true });
    mocks.del.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error("db"));
    expect(await drainPendingDoiWithdrawals()).toEqual({ attempted: 2, withdrawn: 1 });
    expect(logger.error).toHaveBeenCalledWith(
      "snapshot.doi_withdrawal_drain_failed",
      expect.objectContaining({ attempted: 2, withdrawn: 1 }),
    );
    mocks.findMany.mockRejectedValue(new Error("db down"));
    expect(await drainPendingDoiWithdrawals()).toEqual({ attempted: 0, withdrawn: 0 });
  });

  it("does nothing (and logs nothing) when the queue is empty", async () => {
    mocks.findMany.mockResolvedValue([]);
    expect(await drainPendingDoiWithdrawals()).toEqual({ attempted: 0, withdrawn: 0 });
    expect(mocks.tombstoneSnapshotDoi).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });
});

describe("DoiWithdrawal (schema + migration)", () => {
  it("is a standalone table: no FK to User, no personal column, DOI as the key", async () => {
    const { readFileSync } = await import("node:fs");
    const path = await import("node:path");
    const root = process.cwd();
    const schema = readFileSync(path.join(root, "prisma", "schema.prisma"), "utf8");
    const model = /model DoiWithdrawal \{([\s\S]*?)\n\}/.exec(schema)?.[1];
    expect(model).toBeDefined();
    expect(model).toMatch(/doi\s+String\s+@id/);
    expect(model).not.toMatch(/@relation|userId|User\b/);
    const migration = readFileSync(
      path.join(root, "prisma", "migrations", "20260907120000_doi_withdrawals", "migration.sql"),
      "utf8",
    );
    expect(migration).toContain('CREATE TABLE "DoiWithdrawal"');
    expect(migration).toContain('PRIMARY KEY ("doi")');
    expect(migration).not.toContain("REFERENCES");
  });
});
