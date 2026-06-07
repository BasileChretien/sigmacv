import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the env boundary (hoisted) so the refresh token is test-controlled.
const { getEnvMock } = vi.hoisted(() => ({ getEnvMock: vi.fn() }));
vi.mock("@/lib/env", () => ({ getEnv: getEnvMock }));

import {
  getOpenaireAccessToken,
  resetOpenaireTokenCache,
} from "@/lib/openaire/auth";

function mockFetch(impl: (url: unknown) => Response | Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(impl));
}
function tokenResponse(token: string, expiresIn: number | string = 3600) {
  return new Response(
    JSON.stringify({ access_token: token, token_type: "Bearer", expires_in: expiresIn }),
    { status: 200 },
  );
}

beforeEach(() => {
  resetOpenaireTokenCache();
  getEnvMock.mockReturnValue({ OPENAIRE_REFRESH_TOKEN: "refresh-xyz" });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getOpenaireAccessToken", () => {
  it("returns null (anonymous) when no refresh token is configured", async () => {
    getEnvMock.mockReturnValue({ OPENAIRE_REFRESH_TOKEN: undefined });
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await getOpenaireAccessToken()).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("exchanges the refresh token (as the refreshToken query param)", async () => {
    let calledUrl = "";
    mockFetch((url) => {
      calledUrl = String(url);
      return tokenResponse("access-1");
    });
    expect(await getOpenaireAccessToken(1000)).toBe("access-1");
    expect(decodeURIComponent(calledUrl)).toContain(
      "getAccessToken?refreshToken=refresh-xyz",
    );
  });

  it("caches the access token until shortly before expiry", async () => {
    const fetchFn = vi.fn(() => tokenResponse("access-1", 3600));
    vi.stubGlobal("fetch", fetchFn);
    expect(await getOpenaireAccessToken(0)).toBe("access-1");
    // 30 min later → still cached, no second exchange.
    expect(await getOpenaireAccessToken(30 * 60_000)).toBe("access-1");
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("caches with a default TTL when expires_in is absent", async () => {
    const fetchFn = vi.fn(
      () => new Response(JSON.stringify({ access_token: "access-x" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchFn);
    expect(await getOpenaireAccessToken(0)).toBe("access-x");
    expect(await getOpenaireAccessToken(1000)).toBe("access-x"); // within default 1h
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("re-exchanges once the cached token reaches expiry", async () => {
    let n = 0;
    const fetchFn = vi.fn(() => tokenResponse(`access-${++n}`, 3600));
    vi.stubGlobal("fetch", fetchFn);
    expect(await getOpenaireAccessToken(0)).toBe("access-1");
    expect(await getOpenaireAccessToken(3_600_000)).toBe("access-2");
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("fails soft (null) on non-OK, missing token, or a thrown fetch", async () => {
    mockFetch(() => new Response("nope", { status: 500 }));
    expect(await getOpenaireAccessToken()).toBeNull();
    resetOpenaireTokenCache();
    mockFetch(() => new Response(JSON.stringify({ token_type: "Bearer" }), { status: 200 }));
    expect(await getOpenaireAccessToken()).toBeNull();
    resetOpenaireTokenCache();
    mockFetch(() => {
      throw new Error("network down");
    });
    expect(await getOpenaireAccessToken()).toBeNull();
  });
});
