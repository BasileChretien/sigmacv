import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SITE_URL } from "@/lib/siteUrl";

vi.mock("@/lib/log", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

import { logger } from "@/lib/log";
import { INDEXNOW_KEY, pingIndexNow } from "@/lib/cv/indexNow";

const OK = { ok: true, status: 200 } as Response;

beforeEach(() => {
  vi.clearAllMocks();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("pingIndexNow", () => {
  it("no-ops outside production (never pings live URLs from dev/test)", async () => {
    vi.stubEnv("NODE_ENV", "test");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await pingIndexNow([`${SITE_URL}/p/abc`]);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts host, key, keyLocation and the same-origin urlList in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const fetchMock = vi.fn().mockResolvedValue(OK);
    vi.stubGlobal("fetch", fetchMock);

    await pingIndexNow([`${SITE_URL}/p/abc`, "https://evil.example/p/x"]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]! as [string, RequestInit];
    expect(url).toBe("https://api.indexnow.org/indexnow");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body.host).toBe(new URL(SITE_URL).host);
    expect(body.key).toBe(INDEXNOW_KEY);
    expect(body.keyLocation).toBe(`${SITE_URL}/${INDEXNOW_KEY}.txt`);
    // The cross-origin URL is filtered out — only same-origin URLs are submitted.
    expect(body.urlList).toEqual([`${SITE_URL}/p/abc`]);
  });

  it("skips the request when no same-origin URLs remain", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const fetchMock = vi.fn().mockResolvedValue(OK);
    vi.stubGlobal("fetch", fetchMock);

    await pingIndexNow(["https://evil.example/p/x"]);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("logs (and swallows) a non-2xx response", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 429 } as Response));

    await expect(pingIndexNow([`${SITE_URL}/p/abc`])).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith("indexnow.ping_non_2xx", { status: 429, count: 1 });
  });

  it("logs (and swallows) a network error", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const err = new Error("boom");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(err));

    await expect(pingIndexNow([`${SITE_URL}/p/abc`])).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith("indexnow.ping_failed", { err });
  });
});
