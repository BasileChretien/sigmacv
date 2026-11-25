import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  isSameOrigin: vi.fn(),
}));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/security/origin", () => ({ isSameOrigin: mocks.isSameOrigin }));
vi.mock("@/lib/security/clientIp", () => ({ clientIp: () => "203.0.113.9" }));

import { previewCaller } from "@/app/api/cv/previewGate";

/** The thumbnail and re-render routes key their bucket on this, and give a
 *  signed-in account today's limit rather than the event-day override. */
const req = () => new Request("http://localhost/api/cv/preview/gallery", { method: "POST" });

beforeEach(() => {
  mocks.auth.mockReset();
  mocks.isSameOrigin.mockReset();
  mocks.isSameOrigin.mockReturnValue(true);
});

describe("previewCaller", () => {
  it("keys a signed-in caller by account, and says so", async () => {
    mocks.auth.mockResolvedValue({ user: { id: "42" } });
    expect(await previewCaller(req())).toEqual({ ok: true, key: "u:42", signedIn: true });
  });

  it("keys an anonymous caller by IP, and says so", async () => {
    mocks.auth.mockResolvedValue(null);
    expect(await previewCaller(req())).toEqual({
      ok: true,
      key: "ip:203.0.113.9",
      signedIn: false,
    });
  });

  it("treats a session without a user id as anonymous", async () => {
    mocks.auth.mockResolvedValue({ user: {} });
    expect(await previewCaller(req())).toEqual({
      ok: true,
      key: "ip:203.0.113.9",
      signedIn: false,
    });
  });

  it("refuses a cross-origin request before reading the session", async () => {
    mocks.isSameOrigin.mockReturnValue(false);
    expect(await previewCaller(req())).toEqual({ ok: false, status: 403 });
    expect(mocks.auth).not.toHaveBeenCalled();
  });
});
