import { beforeEach, describe, expect, it, vi } from "vitest";

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
  accountFindMany: vi.fn(),
  sessionFindMany: vi.fn(),
  cvFindUnique: vi.fn(),
  eventFindMany: vi.fn(),
  eventCount: vi.fn(),
  snapshotFindMany: vi.fn(),
  enforceRateLimit: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique },
    account: { findMany: mocks.accountFindMany },
    session: { findMany: mocks.sessionFindMany },
    cv: { findUnique: mocks.cvFindUnique },
    researchEvent: { findMany: mocks.eventFindMany, count: mocks.eventCount },
    cvSnapshot: { findMany: mocks.snapshotFindMany },
  },
}));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: mocks.enforceRateLimit }));

import { GET } from "@/app/api/account/export/route";

const CV_ROW = {
  id: "cv1",
  userId: "u1",
  document: { schemaVersion: 2, owner: { displayName: "A Researcher" } },
  schemaVersion: 2,
  lastSyncedAt: new Date("2026-09-01T00:00:00Z"),
  lastSyncReport: { added: 1 },
  published: true,
  publicSlug: "a-researcher-abc123",
  publicIndexable: false,
  resyncLockedAt: null,
  createdAt: new Date("2026-06-01T00:00:00Z"),
  updatedAt: new Date("2026-09-01T00:00:00Z"),
};

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  mocks.enforceRateLimit.mockResolvedValue({ ok: true });
  mocks.userFindUnique.mockImplementation(async ({ select }: { select: Record<string, true> }) =>
    Object.fromEntries(Object.keys(select).map((k) => [k, `<${k}>`])),
  );
  mocks.accountFindMany.mockResolvedValue([]);
  mocks.sessionFindMany.mockResolvedValue([]);
  mocks.cvFindUnique.mockResolvedValue(CV_ROW);
  mocks.eventFindMany.mockResolvedValue([]);
  mocks.eventCount.mockResolvedValue(0);
  mocks.snapshotFindMany.mockResolvedValue([]);
});

describe("GET /api/account/export (GDPR / APPI data export)", () => {
  it("requires a session", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
  });

  it("includes the research-consent audit trail (what was agreed, when, which version)", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { user: Record<string, unknown> };
    for (const key of [
      "emailVerified",
      "researchConsent",
      "researchConsentAt",
      "researchConsentVersion",
      "digestOptIn",
      "digestSentAt",
      "contactEmail",
      "contactEmailVerifiedAt",
      "image",
      "createdAt",
      "updatedAt",
    ]) {
      expect(body.user, key).toHaveProperty(key);
    }
  });

  it("includes the CV row's public state, not only the document", async () => {
    const body = (await (await GET()).json()) as {
      cv: unknown;
      cvRecord: Record<string, unknown> | null;
    };
    // The curated document stays where existing consumers expect it…
    expect(body.cv).toEqual(CV_ROW.document);
    // …and the row metadata a user is entitled to see ships alongside it.
    expect(body.cvRecord).toMatchObject({
      published: true,
      publicSlug: "a-researcher-abc123",
      publicIndexable: false,
      schemaVersion: 2,
      lastSyncedAt: CV_ROW.lastSyncedAt.toISOString(),
      lastSyncReport: { added: 1 },
      createdAt: CV_ROW.createdAt.toISOString(),
      updatedAt: CV_ROW.updatedAt.toISOString(),
    });
    // Internal job bookkeeping and the document itself are not duplicated there.
    expect(body.cvRecord).not.toHaveProperty("resyncLockedAt");
    expect(body.cvRecord).not.toHaveProperty("document");
  });

  it("reports a null CV record for an account that never synced", async () => {
    mocks.cvFindUnique.mockResolvedValue(null);
    const body = (await (await GET()).json()) as { cv: unknown; cvRecord: unknown };
    expect(body.cv).toBeNull();
    expect(body.cvRecord).toBeNull();
  });

  it("includes every frozen CV version (the frozen document, label, visibility, token, DOI)", async () => {
    const SNAP = {
      id: "snap1",
      version: 1,
      label: "Tenure review",
      createdAt: new Date("2026-09-04T10:00:00Z"),
      token: "abcdefghijklmnopqrstuvwx",
      isPublic: true,
      doi: "10.12345/abcd",
      doiState: "minted",
      canonical: { schemaVersion: 2, owner: { displayName: "A Researcher" } },
    };
    mocks.snapshotFindMany.mockResolvedValue([SNAP]);
    const body = (await (await GET()).json()) as { snapshots: Array<Record<string, unknown>> };
    expect(body.snapshots).toEqual([{ ...SNAP, createdAt: SNAP.createdAt.toISOString() }]);
    // Scoped to this user's CV row, oldest version first.
    expect(mocks.snapshotFindMany.mock.calls[0]![0]).toMatchObject({
      where: { cvId: "cv1" },
      orderBy: { version: "asc" },
    });
  });

  it("exports an empty snapshot list for an account without a CV (no query made)", async () => {
    mocks.cvFindUnique.mockResolvedValue(null);
    const body = (await (await GET()).json()) as { snapshots: unknown[] };
    expect(body.snapshots).toEqual([]);
    expect(mocks.snapshotFindMany).not.toHaveBeenCalled();
  });

  it("never exports OAuth tokens or session token values", async () => {
    await GET();
    const accountSelect = mocks.accountFindMany.mock.calls[0]?.[0]?.select ?? {};
    const sessionSelect = mocks.sessionFindMany.mock.calls[0]?.[0]?.select ?? {};
    for (const k of ["access_token", "refresh_token", "id_token"]) {
      expect(accountSelect).not.toHaveProperty(k);
    }
    expect(sessionSelect).not.toHaveProperty("sessionToken");
  });
});
