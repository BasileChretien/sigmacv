import { beforeEach, describe, expect, it, vi } from "vitest";

Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
  AUTH_URL: "https://sigmacv.test",
  RESYNC_SECRET: "resync-secret-resync-secret",
});

const mocks = vi.hoisted(() => ({
  resyncDueCvs: vi.fn(),
  drainPendingDoiWithdrawals: vi.fn(),
  refreshInstitutionProfiles: vi.fn(),
  enforceRateLimit: vi.fn(),
  isAuthorizedInternalRequest: vi.fn(),
}));

vi.mock("@/lib/cv/resync", () => ({ resyncDueCvs: mocks.resyncDueCvs }));
vi.mock("@/lib/cv/doiWithdrawals", () => ({
  drainPendingDoiWithdrawals: mocks.drainPendingDoiWithdrawals,
}));
vi.mock("@/lib/openalex/institutionRefresh", () => ({
  refreshInstitutionProfiles: mocks.refreshInstitutionProfiles,
}));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock("@/lib/security/internalAuth", () => ({
  isAuthorizedInternalRequest: mocks.isAuthorizedInternalRequest,
}));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { POST } from "@/app/api/internal/resync/route";

const req = () => new Request("https://sigmacv.test/api/internal/resync", { method: "POST" });

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  mocks.isAuthorizedInternalRequest.mockReturnValue(true);
  mocks.enforceRateLimit.mockResolvedValue({ ok: true });
  mocks.resyncDueCvs.mockResolvedValue({ scanned: 1, synced: 1, skipped: 0, locked: 0, failed: 0 });
  mocks.drainPendingDoiWithdrawals.mockResolvedValue({ attempted: 1, withdrawn: 1 });
  mocks.refreshInstitutionProfiles.mockResolvedValue({
    candidates: 2,
    refreshed: 2,
    failed: 0,
    cleared: 0,
    missingRows: 0,
    missingRowIds: [],
    stoppedForBudget: false,
  });
});

const PROFILES_SUMMARY = {
  candidates: 2,
  refreshed: 2,
  failed: 0,
  cleared: 0,
  missingRows: 0,
  missingRowIds: [],
  stoppedForBudget: false,
};

describe("POST /api/internal/resync", () => {
  it("drains the queued DOI withdrawals, then refreshes the institution snapshots, and reports all three", async () => {
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      ok: true,
      scanned: 1,
      synced: 1,
      skipped: 0,
      locked: 0,
      failed: 0,
      doiWithdrawals: { attempted: 1, withdrawn: 1 },
      institutionProfiles: PROFILES_SUMMARY,
    });
    expect(mocks.drainPendingDoiWithdrawals).toHaveBeenCalledTimes(1);
    expect(mocks.refreshInstitutionProfiles).toHaveBeenCalledWith({ maxRows: 20, paceMs: 200 });
    // Its own 5-minute guard, after the resync's.
    expect(mocks.enforceRateLimit).toHaveBeenNthCalledWith(2, "institution-profiles", 1, 300_000);
    expect(mocks.enforceRateLimit.mock.invocationCallOrder[1]).toBeGreaterThan(
      mocks.drainPendingDoiWithdrawals.mock.invocationCallOrder[0]!,
    );
  });

  it("skips the institution refresh (but nothing else) when its own guard says it ran too recently", async () => {
    mocks.enforceRateLimit.mockImplementation(async (key: string) =>
      key === "institution-profiles" ? { ok: false, retryAfterSec: 120 } : { ok: true },
    );
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect((await res.json()).institutionProfiles).toEqual({ skipped: "ran too recently" });
    expect(mocks.refreshInstitutionProfiles).not.toHaveBeenCalled();
    expect(mocks.drainPendingDoiWithdrawals).toHaveBeenCalledTimes(1);
  });

  it("reports a thrown institution refresh as skipped and still answers 200 (the tick's response never depends on it)", async () => {
    mocks.refreshInstitutionProfiles.mockRejectedValue(new Error("boom"));
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect((await res.json()).institutionProfiles).toEqual({ skipped: "failed" });
  });

  it("still drains the queue and refreshes the snapshots when the resync itself throws (neither depends on it)", async () => {
    mocks.resyncDueCvs.mockRejectedValue(new Error("boom"));
    const res = await POST(req());
    expect(res.status).toBe(500);
    expect(mocks.drainPendingDoiWithdrawals).toHaveBeenCalledTimes(1);
    expect(mocks.refreshInstitutionProfiles).toHaveBeenCalledTimes(1);
  });

  it("does no work when unauthorized or when a scan ran too recently", async () => {
    mocks.isAuthorizedInternalRequest.mockReturnValue(false);
    expect((await POST(req())).status).toBe(401);
    mocks.isAuthorizedInternalRequest.mockReturnValue(true);
    mocks.enforceRateLimit.mockResolvedValue({ ok: false, retryAfterSec: 60 });
    expect((await POST(req())).status).toBe(429);
    expect(mocks.resyncDueCvs).not.toHaveBeenCalled();
    expect(mocks.drainPendingDoiWithdrawals).not.toHaveBeenCalled();
    expect(mocks.refreshInstitutionProfiles).not.toHaveBeenCalled();
  });
});
