import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  isSuppressed: vi.fn(),
  set: vi.fn(),
  rateLimit: vi.fn(async (): Promise<{ ok: boolean; retryAfterSec?: number }> => ({ ok: true })),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/cv/previewSuppression", () => ({
  isOrcidPreviewSuppressed: mocks.isSuppressed,
  setOrcidPreviewSuppressed: mocks.set,
}));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: mocks.rateLimit }));
// The real helper is permissive outside production when AUTH_URL is unset;
// pin the expected origin so the cross-origin case is meaningful here.
vi.mock("@/lib/security/origin", () => ({
  isSameOrigin: (req: Request) =>
    (req.headers.get("origin") ?? "http://localhost:3000") === "http://localhost:3000",
}));

import { GET, POST } from "@/app/api/account/preview-suppression/route";

const ORIGIN = "http://localhost:3000";
function post(body: unknown, origin = ORIGIN) {
  return POST(
    new Request(`${ORIGIN}/api/account/preview-suppression`, {
      method: "POST",
      headers: { "content-type": "application/json", origin, host: "localhost:3000" },
      body: JSON.stringify(body),
    }),
  );
}

beforeEach(() => {
  mocks.auth.mockReset();
  mocks.isSuppressed.mockReset();
  mocks.set.mockReset();
  mocks.rateLimit.mockClear();
});

describe("/api/account/preview-suppression", () => {
  it("GET: 401 signed out; state for an ORCID account; not applicable without an iD", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);

    mocks.auth.mockResolvedValue({ user: { id: "u1", orcid: "0000-0002-1825-0097" } });
    mocks.isSuppressed.mockResolvedValue(true);
    const res = await GET();
    expect(await res.json()).toEqual({ suppressed: true, applicable: true });
    expect(res.headers.get("cache-control")).toBe("no-store");

    mocks.auth.mockResolvedValue({ user: { id: "u2", orcid: null } });
    expect(await (await GET()).json()).toEqual({ suppressed: false, applicable: false });
  });

  it("POST: sets and clears the person's own iD, keyed by the session (never a posted iD)", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", orcid: "0000-0002-1825-0097" } });
    mocks.set.mockResolvedValue("set");
    let res = await post({ suppress: true, orcid: "0000-0001-0000-0000" });
    expect(res.status).toBe(200);
    expect(mocks.set).toHaveBeenCalledWith("0000-0002-1825-0097", true, "account");

    mocks.set.mockResolvedValue("cleared");
    res = await post({ suppress: false });
    expect(await res.json()).toEqual({ ok: true, suppressed: false });
    expect(mocks.set).toHaveBeenLastCalledWith("0000-0002-1825-0097", false, "account");
  });

  it("POST: 401 signed out, 403 cross-origin, 409 without an iD, 422 bad body, 503 unconfigured", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await post({ suppress: true })).status).toBe(401);

    mocks.auth.mockResolvedValue({ user: { id: "u1", orcid: "0000-0002-1825-0097" } });
    expect((await post({ suppress: true }, "https://evil.example")).status).toBe(403);

    mocks.auth.mockResolvedValue({ user: { id: "u2", orcid: null } });
    expect((await post({ suppress: true })).status).toBe(409);

    mocks.auth.mockResolvedValue({ user: { id: "u1", orcid: "0000-0002-1825-0097" } });
    expect((await post({ suppress: "yes" })).status).toBe(422);

    mocks.set.mockResolvedValue("unavailable");
    expect((await post({ suppress: true })).status).toBe(503);
  });

  it("POST: 429 when the per-user toggle limit is hit", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "u1", orcid: "0000-0002-1825-0097" } });
    mocks.rateLimit.mockResolvedValueOnce({ ok: false, retryAfterSec: 30 });
    const res = await post({ suppress: true });
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("30");
  });
});
