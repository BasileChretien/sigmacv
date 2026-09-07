import { beforeEach, describe, expect, it, vi } from "vitest";

// The route pulls in auth, db and rate limiting; give it the minimal valid env
// so getEnv() doesn't throw, and mock the rest.
Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
  AUTH_URL: "https://sigmacv.test",
});

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  userFindUnique: vi.fn(),
  userDelete: vi.fn(),
  rateLimitDeleteMany: vi.fn(),
  enforceRateLimit: vi.fn(),
  isSameOrigin: vi.fn(),
  withdrawMintedSnapshotDois: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/cv/snapshotStore", () => ({
  withdrawMintedSnapshotDois: mocks.withdrawMintedSnapshotDois,
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique, delete: mocks.userDelete },
    rateLimitWindow: { deleteMany: mocks.rateLimitDeleteMany },
  },
}));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock("@/lib/security/origin", () => ({ isSameOrigin: mocks.isSameOrigin }));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { DELETE } from "@/app/api/account/route";
import {
  __resetOrcidPreviewCache,
  getCachedOrcidPreview,
  setCachedOrcidPreview,
} from "@/lib/cv/orcidPreviewCache";
import type { CanonicalCv } from "@/lib/canonical/schema";

const ORCID = "0000-0002-7483-2489";
const CV = {} as CanonicalCv;

beforeEach(() => {
  __resetOrcidPreviewCache();
  for (const m of Object.values(mocks)) m.mockReset();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  mocks.isSameOrigin.mockReturnValue(true);
  mocks.enforceRateLimit.mockResolvedValue({ ok: true });
  mocks.userDelete.mockResolvedValue({});
  mocks.withdrawMintedSnapshotDois.mockResolvedValue({ attempted: 0, withdrawn: 0 });
});

const req = () => new Request("https://sigmacv.test/api/account", { method: "DELETE" });

describe("deleting an account clears its anonymous preview", () => {
  it("drops the cached preview built from that researcher's corrections", async () => {
    // Withdrawal has to take effect at once. The anonymous preview applies the
    // owner's own corrections, so once the account is gone those must stop
    // shaping a public page — not linger until a ten-minute TTL expires.
    mocks.userFindUnique.mockResolvedValue({ orcid: ORCID });
    setCachedOrcidPreview(ORCID, { html: "<p>theirs</p>", name: "A Researcher", cv: CV });
    expect(getCachedOrcidPreview(ORCID)).not.toBeNull();

    const res = await DELETE(req());

    expect(res.status).toBe(200);
    expect(mocks.userDelete).toHaveBeenCalledTimes(1);
    expect(getCachedOrcidPreview(ORCID)).toBeNull();
  });

  it("reads the iD BEFORE the row is deleted", async () => {
    // Read order matters: after the delete the ORCID is unrecoverable, so the
    // lookup has to precede it.
    const order: string[] = [];
    mocks.userFindUnique.mockImplementation(async () => {
      order.push("read");
      return { orcid: ORCID };
    });
    mocks.userDelete.mockImplementation(async () => {
      order.push("delete");
      return {};
    });
    await DELETE(req());
    expect(order).toEqual(["read", "delete"]);
  });

  it("still deletes when the account has no ORCID (email sign-in)", async () => {
    mocks.userFindUnique.mockResolvedValue({ orcid: null });
    const res = await DELETE(req());
    expect(res.status).toBe(200);
    expect(mocks.userDelete).toHaveBeenCalledTimes(1);
  });

  it("leaves another researcher's cached preview alone", async () => {
    const other = "0000-0003-0449-6261";
    mocks.userFindUnique.mockResolvedValue({ orcid: ORCID });
    setCachedOrcidPreview(ORCID, { html: "<p>mine</p>", name: "A", cv: CV });
    setCachedOrcidPreview(other, { html: "<p>theirs</p>", name: "B", cv: CV });
    await DELETE(req());
    expect(getCachedOrcidPreview(other)).not.toBeNull();
  });
});

describe("deleting an account sweeps its persisted rate-limit counters", () => {
  // RateLimitWindow has no FK to User (shared infra), but every per-user limiter
  // key ends in `:<userId>` — so the cascade misses them and the internal id
  // would otherwise sit in that table indefinitely.
  it("deletes every RateLimitWindow row keyed by the user id, after the user row", async () => {
    const order: string[] = [];
    mocks.userFindUnique.mockResolvedValue({ orcid: null });
    mocks.userDelete.mockImplementation(async () => {
      order.push("delete");
      return {};
    });
    mocks.rateLimitDeleteMany.mockImplementation(async () => {
      order.push("sweep");
      return { count: 3 };
    });
    const res = await DELETE(req());
    expect(res.status).toBe(200);
    expect(mocks.rateLimitDeleteMany).toHaveBeenCalledWith({
      where: { key: { endsWith: ":u1" } },
    });
    expect(order).toEqual(["delete", "sweep"]);
  });

  it("is fail-soft: a sweep failure never turns a completed deletion into an error", async () => {
    mocks.userFindUnique.mockResolvedValue({ orcid: null });
    mocks.rateLimitDeleteMany.mockRejectedValue(new Error("table missing"));
    const res = await DELETE(req());
    expect(res.status).toBe(200);
    expect(mocks.userDelete).toHaveBeenCalledTimes(1);
  });
});

describe("deleting an account withdraws its minted snapshot DOIs first", () => {
  // A minted DOI record (name, ORCID, version URL) lives at DataCite and would
  // otherwise keep resolving to a 404 after the cascade removed the snapshot.
  // The tombstone call must run BEFORE the row goes (the DOIs are read from it).
  it("calls withdrawMintedSnapshotDois for the user before the user row is deleted", async () => {
    const order: string[] = [];
    mocks.userFindUnique.mockResolvedValue({ orcid: null });
    mocks.withdrawMintedSnapshotDois.mockImplementation(async () => {
      order.push("withdraw");
      return { attempted: 1, withdrawn: 1 };
    });
    mocks.userDelete.mockImplementation(async () => {
      order.push("delete");
      return {};
    });
    const res = await DELETE(req());
    expect(res.status).toBe(200);
    expect(mocks.withdrawMintedSnapshotDois).toHaveBeenCalledWith("u1");
    expect(order).toEqual(["withdraw", "delete"]);
  });

  it("is fail-soft: a DataCite outage never blocks account deletion", async () => {
    mocks.userFindUnique.mockResolvedValue({ orcid: null });
    mocks.withdrawMintedSnapshotDois.mockRejectedValue(new Error("datacite down"));
    const res = await DELETE(req());
    expect(res.status).toBe(200);
    expect(mocks.userDelete).toHaveBeenCalledTimes(1);
  });
});
