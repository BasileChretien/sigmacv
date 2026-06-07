import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the env boundary (hoisted) so the OPS credentials are test-controlled.
const { getEnvMock } = vi.hoisted(() => ({ getEnvMock: vi.fn() }));
vi.mock("@/lib/env", () => ({ getEnv: getEnvMock }));

import { getEpoAccessToken, resetEpoTokenCache } from "@/lib/epo/auth";

function mockFetch(impl: (url: unknown, init?: RequestInit) => Response | Promise<Response>) {
  vi.stubGlobal("fetch", vi.fn(impl));
}
function tokenResponse(token: string, expiresIn: number | string = "1199") {
  return new Response(
    JSON.stringify({ access_token: token, expires_in: expiresIn }),
    { status: 200 },
  );
}

beforeEach(() => {
  resetEpoTokenCache();
  getEnvMock.mockReturnValue({ EPO_OPS_KEY: "key-1", EPO_OPS_SECRET: "secret-1" });
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getEpoAccessToken", () => {
  it("returns null (dormant) when either credential is missing", async () => {
    getEnvMock.mockReturnValue({ EPO_OPS_KEY: "key-1", EPO_OPS_SECRET: undefined });
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await getEpoAccessToken()).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("POSTs client_credentials with Basic base64(key:secret)", async () => {
    let init: RequestInit | undefined;
    mockFetch((_url, i) => {
      init = i;
      return tokenResponse("access-1");
    });
    expect(await getEpoAccessToken(1000)).toBe("access-1");
    expect(init?.method).toBe("POST");
    expect(init?.body).toBe("grant_type=client_credentials");
    const headers = init?.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Basic ${Buffer.from("key-1:secret-1").toString("base64")}`);
  });

  it("caches the token until shortly before its ~20 min expiry", async () => {
    const fetchFn = vi.fn(() => tokenResponse("access-1", "1199"));
    vi.stubGlobal("fetch", fetchFn);
    expect(await getEpoAccessToken(0)).toBe("access-1");
    expect(await getEpoAccessToken(15 * 60_000)).toBe("access-1"); // 15 min < ~20 min
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("caches with a default TTL when expires_in is absent", async () => {
    const fetchFn = vi.fn(
      () => new Response(JSON.stringify({ access_token: "access-x" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchFn);
    expect(await getEpoAccessToken(0)).toBe("access-x");
    expect(await getEpoAccessToken(1000)).toBe("access-x");
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("re-exchanges once the cached token reaches expiry", async () => {
    let n = 0;
    const fetchFn = vi.fn(() => tokenResponse(`access-${++n}`, "1199"));
    vi.stubGlobal("fetch", fetchFn);
    expect(await getEpoAccessToken(0)).toBe("access-1");
    expect(await getEpoAccessToken(1_200_000)).toBe("access-2");
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it("fails soft (null) on non-OK, missing token, or a thrown fetch", async () => {
    mockFetch(() => new Response("nope", { status: 403 }));
    expect(await getEpoAccessToken()).toBeNull();
    resetEpoTokenCache();
    mockFetch(() => new Response(JSON.stringify({ status: "approved" }), { status: 200 }));
    expect(await getEpoAccessToken()).toBeNull();
    resetEpoTokenCache();
    mockFetch(() => {
      throw new Error("network down");
    });
    expect(await getEpoAccessToken()).toBeNull();
  });
});
