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
  enforceRateLimit: vi.fn(),
  getCvForUser: vi.fn(),
  getPublishState: vi.fn(),
  getRenderer: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/cv/sync", () => ({
  getCvForUser: mocks.getCvForUser,
  getPublishState: mocks.getPublishState,
}));
vi.mock("@/lib/render", () => ({ getRenderer: mocks.getRenderer }));

import { GET } from "@/app/api/cv/export/[format]/route";
import { buildCanonicalCv } from "@/lib/canonical/build";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const OWN = "https://openalex.org/W4300000001";
const DOC = buildCanonicalCv({
  id: "cv1",
  resolved: {
    orcid: "0000-0002-7483-2489",
    authorIds: ["A5001069481", "A5136414971"],
    displayName: "Basile Chrétien",
  },
  works: worksFixture as unknown as OpenAlexWork[],
  now: "2026-09-08T00:00:00.000Z",
});

function get(format: string) {
  return GET(new Request(`https://sigmacv.test/api/cv/export/${format}`), {
    params: Promise.resolve({ format }),
  });
}

function ownItem(cv: CanonicalCv) {
  return cv.sections.flatMap((s) => s.items).find((it) => it.sourceId === OWN)!;
}

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  mocks.enforceRateLimit.mockResolvedValue({ ok: true });
  mocks.getCvForUser.mockResolvedValue(DOC);
  mocks.getPublishState.mockResolvedValue({ published: false, publicSlug: null });
});

describe("GET /api/cv/export/json (the owner's own canonical document)", () => {
  it("requires a session and rejects an unknown format", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await get("json")).status).toBe(401);
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    expect((await get("xml")).status).toBe(400);
  });

  it("returns the stored document verbatim — meta.funders (stripped from every public surface) included", async () => {
    expect(ownItem(DOC).meta.funders).toHaveLength(2);
    const res = await get("json");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/json");
    expect(res.headers.get("Content-Disposition")).toContain("attachment");
    const body = (await res.json()) as CanonicalCv;
    expect(body).toEqual(JSON.parse(JSON.stringify(DOC)));
    expect(ownItem(body).meta.funders).toEqual(ownItem(DOC).meta.funders);
    // The owner path never goes through a renderer or the public projection.
    expect(mocks.getRenderer).not.toHaveBeenCalled();
  });

  it("404s when the account has no CV yet", async () => {
    mocks.getCvForUser.mockResolvedValue(null);
    expect((await get("json")).status).toBe(404);
  });
});
