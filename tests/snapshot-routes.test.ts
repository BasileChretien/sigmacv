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
  isSameOrigin: vi.fn(),
  listSnapshots: vi.fn(),
  createSnapshot: vi.fn(),
  updateSnapshot: vi.fn(),
  deleteSnapshot: vi.fn(),
  getOwnerSnapshot: vi.fn(),
  mintDoiForSnapshot: vi.fn(),
  doiMintingEnabled: vi.fn(),
  CvNotFoundError: class CvNotFoundError extends Error {},
  SnapshotLimitError: class SnapshotLimitError extends Error {},
  SnapshotDoiLockedError: class SnapshotDoiLockedError extends Error {},
}));
const { CvNotFoundError, SnapshotLimitError, SnapshotDoiLockedError } = mocks;

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock("@/lib/security/origin", () => ({ isSameOrigin: mocks.isSameOrigin }));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/cv/sync", () => ({ CvNotFoundError: mocks.CvNotFoundError }));
vi.mock("@/lib/cv/snapshotStore", () => ({
  SnapshotLimitError: mocks.SnapshotLimitError,
  SnapshotDoiLockedError: mocks.SnapshotDoiLockedError,
  listSnapshots: mocks.listSnapshots,
  createSnapshot: mocks.createSnapshot,
  updateSnapshot: mocks.updateSnapshot,
  deleteSnapshot: mocks.deleteSnapshot,
  getOwnerSnapshot: mocks.getOwnerSnapshot,
  mintDoiForSnapshot: mocks.mintDoiForSnapshot,
  snapshotPublicPath: (slug: string, token: string) => `p/${slug}/v/${token}`,
}));
vi.mock("@/lib/datacite/mint", () => ({ doiMintingEnabled: mocks.doiMintingEnabled }));

import { GET as listGet, POST as createPost } from "@/app/api/cv/snapshots/route";
import { DELETE as delOne, PATCH as patchOne } from "@/app/api/cv/snapshots/[id]/route";
import { GET as mintGet, POST as mintPost } from "@/app/api/cv/snapshots/[id]/mint/route";
import { GET as diffGet } from "@/app/api/cv/snapshots/[id]/diff/route";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { addManualEntry } from "@/lib/canonical/curate";

const BASE = "https://sigmacv.test/api/cv/snapshots";
const params = (id: string) => ({ params: Promise.resolve({ id }) });
const json = (url: string, method: string, body?: unknown) =>
  new Request(url, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

const SUMMARY = {
  id: "snap1",
  version: 1,
  label: "Tenure",
  createdAt: "2026-09-04T10:00:00.000Z",
  token: "abcdefghijklmnopqrstuvwx",
  isPublic: false,
  doi: null,
  doiState: "none",
};

beforeEach(() => {
  for (const m of Object.values(mocks)) if ("mockReset" in m) m.mockReset();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  mocks.enforceRateLimit.mockResolvedValue({ ok: true });
  mocks.isSameOrigin.mockReturnValue(true);
  mocks.doiMintingEnabled.mockReturnValue(false);
});

describe("guard (shared by every snapshot route)", () => {
  it("401s without a session", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await listGet(new Request(BASE))).status).toBe(401);
    expect((await createPost(json(BASE, "POST", { label: "x" }))).status).toBe(401);
  });
  it("403s a cross-origin mutation but not a read", async () => {
    mocks.isSameOrigin.mockReturnValue(false);
    mocks.listSnapshots.mockResolvedValue({ snapshots: [] });
    expect((await listGet(new Request(BASE))).status).toBe(200);
    expect((await createPost(json(BASE, "POST", { label: "x" }))).status).toBe(403);
    expect(
      (await delOne(new Request(`${BASE}/snap1`, { method: "DELETE" }), params("snap1"))).status,
    ).toBe(403);
  });
  it("429s with Retry-After when the per-user limit trips", async () => {
    mocks.enforceRateLimit.mockResolvedValue({ ok: false, retryAfterSec: 42 });
    const res = await createPost(json(BASE, "POST", { label: "x" }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("42");
    expect(mocks.enforceRateLimit.mock.calls[0]![0]).toBe("snapshot-create:u1");
  });
});

describe("GET /api/cv/snapshots", () => {
  it("returns the listing", async () => {
    mocks.listSnapshots.mockResolvedValue({
      snapshots: [SUMMARY],
      doiMintingEnabled: false,
      max: 20,
    });
    const res = await listGet(new Request(BASE));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ snapshots: [SUMMARY], max: 20 });
  });
  it("409s before the first sync and 500s on an unexpected failure", async () => {
    mocks.listSnapshots.mockRejectedValue(new CvNotFoundError("no cv"));
    expect((await listGet(new Request(BASE))).status).toBe(409);
    mocks.listSnapshots.mockRejectedValue(new Error("db down"));
    expect((await listGet(new Request(BASE))).status).toBe(500);
  });
});

describe("POST /api/cv/snapshots", () => {
  it("creates with a trimmed label and returns 201", async () => {
    mocks.createSnapshot.mockResolvedValue(SUMMARY);
    const res = await createPost(json(BASE, "POST", { label: "  Tenure " }));
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ snapshot: SUMMARY });
    expect(mocks.createSnapshot).toHaveBeenCalledWith("u1", "Tenure");
  });
  it("validates the body: 400 bad JSON, 413 too large, 422 bad shape", async () => {
    expect((await createPost(new Request(BASE, { method: "POST", body: "{nope" }))).status).toBe(
      400,
    );
    expect((await createPost(json(BASE, "POST", { label: "x".repeat(3000) }))).status).toBe(413);
    expect((await createPost(json(BASE, "POST", { label: "" }))).status).toBe(422);
    expect((await createPost(json(BASE, "POST", { label: "x".repeat(81) }))).status).toBe(422);
    expect((await createPost(json(BASE, "POST", {}))).status).toBe(422);
    expect(mocks.createSnapshot).not.toHaveBeenCalled();
  });
  it("maps the limit to 409 snapshot-limit, no-CV to 409, others to 500", async () => {
    mocks.createSnapshot.mockRejectedValue(new SnapshotLimitError("cap"));
    const res = await createPost(json(BASE, "POST", { label: "x" }));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "snapshot-limit" });
    mocks.createSnapshot.mockRejectedValue(new CvNotFoundError("no cv"));
    expect((await createPost(json(BASE, "POST", { label: "x" }))).status).toBe(409);
    mocks.createSnapshot.mockRejectedValue(new Error("boom"));
    expect((await createPost(json(BASE, "POST", { label: "x" }))).status).toBe(500);
  });
});

describe("PATCH /api/cv/snapshots/[id]", () => {
  it("updates visibility / label", async () => {
    mocks.updateSnapshot.mockResolvedValue({ ...SUMMARY, isPublic: true });
    const res = await patchOne(json(`${BASE}/snap1`, "PATCH", { isPublic: true }), params("snap1"));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ snapshot: { ...SUMMARY, isPublic: true } });
    expect(mocks.updateSnapshot).toHaveBeenCalledWith("u1", "snap1", { isPublic: true });
  });
  it("rejects an empty patch, bad JSON, oversize, and unknown ids", async () => {
    expect((await patchOne(json(`${BASE}/s`, "PATCH", {}), params("s"))).status).toBe(422);
    expect(
      (await patchOne(new Request(`${BASE}/s`, { method: "PATCH", body: "{" }), params("s")))
        .status,
    ).toBe(400);
    expect(
      (await patchOne(json(`${BASE}/s`, "PATCH", { label: "x".repeat(3000) }), params("s"))).status,
    ).toBe(413);
    mocks.updateSnapshot.mockResolvedValue(null);
    expect((await patchOne(json(`${BASE}/s`, "PATCH", { label: "L" }), params("s"))).status).toBe(
      404,
    );
  });
  it("409s doi-minted when un-publicing a minted version; maps other errors", async () => {
    mocks.updateSnapshot.mockRejectedValue(new SnapshotDoiLockedError("locked"));
    const res = await patchOne(json(`${BASE}/s`, "PATCH", { isPublic: false }), params("s"));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "doi-minted" });
    mocks.updateSnapshot.mockRejectedValue(new CvNotFoundError("no cv"));
    expect((await patchOne(json(`${BASE}/s`, "PATCH", { label: "L" }), params("s"))).status).toBe(
      409,
    );
    mocks.updateSnapshot.mockRejectedValue(new Error("boom"));
    expect((await patchOne(json(`${BASE}/s`, "PATCH", { label: "L" }), params("s"))).status).toBe(
      500,
    );
  });
});

describe("DELETE /api/cv/snapshots/[id]", () => {
  const del = (id: string) =>
    delOne(new Request(`${BASE}/${id}`, { method: "DELETE" }), params(id));
  it("deletes the owner's snapshot, 404 otherwise", async () => {
    mocks.deleteSnapshot.mockResolvedValue(true);
    expect((await del("snap1")).status).toBe(200);
    expect(mocks.deleteSnapshot).toHaveBeenCalledWith("u1", "snap1");
    mocks.deleteSnapshot.mockResolvedValue(false);
    expect((await del("other")).status).toBe(404);
  });
  it("maps errors", async () => {
    mocks.deleteSnapshot.mockRejectedValue(new CvNotFoundError("no cv"));
    expect((await del("s")).status).toBe(409);
    mocks.deleteSnapshot.mockRejectedValue(new Error("boom"));
    expect((await del("s")).status).toBe(500);
  });
});

describe("/api/cv/snapshots/[id]/mint", () => {
  const mint = (id = "snap1") =>
    mintPost(new Request(`${BASE}/${id}/mint`, { method: "POST" }), params(id));

  it("GET reports whether minting is enabled", async () => {
    let res = await mintGet(new Request(`${BASE}/snap1/mint`));
    expect(await res.json()).toEqual({ doiMintingEnabled: false });
    mocks.doiMintingEnabled.mockReturnValue(true);
    res = await mintGet(new Request(`${BASE}/snap1/mint`));
    expect(await res.json()).toEqual({ doiMintingEnabled: true });
    mocks.auth.mockResolvedValue(null);
    expect((await mintGet(new Request(`${BASE}/snap1/mint`))).status).toBe(401);
  });

  it("POST answers 409 doi-minting-disabled BEFORE auth/rate-limit when unconfigured (no work done)", async () => {
    const res = await mint();
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "doi-minting-disabled" });
    expect(mocks.mintDoiForSnapshot).not.toHaveBeenCalled();
    expect(mocks.auth).not.toHaveBeenCalled();
  });

  it("POST maps every mint outcome when enabled", async () => {
    mocks.doiMintingEnabled.mockReturnValue(true);
    const cases: Array<[unknown, number, unknown]> = [
      [{ state: "minted", doi: "10.1/x" }, 200, { doi: "10.1/x", doiState: "minted" }],
      [{ state: "already-minted", doi: "10.1/x" }, 200, { doi: "10.1/x", doiState: "minted" }],
      [{ state: "not-found" }, 404, { error: "Not found" }],
      [{ state: "not-public" }, 409, { error: "not-public" }],
      [{ state: "not-published" }, 409, { error: "not-published" }],
      [{ state: "disabled" }, 409, { error: "doi-minting-disabled" }],
      [{ state: "failed", reason: "http-500" }, 502, { error: "mint-failed", doiState: "failed" }],
    ];
    for (const [outcome, status, body] of cases) {
      mocks.mintDoiForSnapshot.mockResolvedValue(outcome);
      const res = await mint();
      expect(res.status, JSON.stringify(outcome)).toBe(status);
      expect(await res.json()).toEqual(body);
    }
    expect(mocks.enforceRateLimit.mock.calls.every((c) => c[0] === "snapshot-mint:u1")).toBe(true);
  });

  it("POST maps errors and guards", async () => {
    mocks.doiMintingEnabled.mockReturnValue(true);
    mocks.mintDoiForSnapshot.mockRejectedValue(new CvNotFoundError("no cv"));
    expect((await mint()).status).toBe(409);
    mocks.mintDoiForSnapshot.mockRejectedValue(new Error("boom"));
    expect((await mint()).status).toBe(500);
    mocks.isSameOrigin.mockReturnValue(false);
    expect((await mint()).status).toBe(403);
  });
});

describe("GET /api/cv/snapshots/[id]/diff (owner)", () => {
  const cv = buildCanonicalCv({
    id: "d",
    resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "Basile Chrétien" },
    works: [],
    now: "2026-06-02T00:00:00.000Z",
  });
  const live = addManualEntry(cv, "grants", "ERC grant", "g:1");

  it("renders the HTML diff with the public links when shareable", async () => {
    mocks.getOwnerSnapshot.mockResolvedValue({
      snapshot: { ...SUMMARY, isPublic: true },
      frozen: cv,
      live,
      publicSlug: "basile-x",
    });
    const res = await diffGet(new Request(`${BASE}/snap1/diff?locale=fr-FR`), params("snap1"));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    const html = await res.text();
    expect(html).toContain("Changements depuis la version 1");
    expect(html).toContain("ERC grant");
    expect(html).toMatch(/href="https:\/\/[^"]+\/p\/basile-x\/v\/abcdefghijklmnopqrstuvwx"/);
    expect(html).toMatch(/href="https:\/\/[^"]+\/p\/basile-x"/);
  });

  it("renders Markdown on request, without links when the version is private", async () => {
    mocks.getOwnerSnapshot.mockResolvedValue({
      snapshot: SUMMARY,
      frozen: cv,
      live,
      publicSlug: "basile-x",
    });
    const res = await diffGet(new Request(`${BASE}/snap1/diff?format=markdown`), params("snap1"));
    expect(res.headers.get("content-type")).toContain("text/markdown");
    const md = await res.text();
    expect(md).toContain("# Basile Chrétien — Changes since version 1");
    expect(md).toContain("- ERC grant");
    expect(md).not.toContain("](https://");
  });

  it("404s an unknown id, 409s with no CV, 500s otherwise", async () => {
    mocks.getOwnerSnapshot.mockResolvedValue(null);
    expect((await diffGet(new Request(`${BASE}/x/diff`), params("x"))).status).toBe(404);
    mocks.getOwnerSnapshot.mockRejectedValue(new CvNotFoundError("no cv"));
    expect((await diffGet(new Request(`${BASE}/x/diff`), params("x"))).status).toBe(409);
    mocks.getOwnerSnapshot.mockRejectedValue(new Error("boom"));
    expect((await diffGet(new Request(`${BASE}/x/diff`), params("x"))).status).toBe(500);
  });
});
