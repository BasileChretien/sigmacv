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
  enforceRateLimit: vi.fn(),
  isSameOrigin: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  prisma: { user: { findUnique: mocks.userFindUnique, delete: mocks.userDelete } },
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
