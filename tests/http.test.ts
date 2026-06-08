import { afterEach, describe, expect, it, vi } from "vitest";
import { resilientFetch } from "@/lib/http";

function res(status: number, headers: Record<string, string> = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    text: async () => "ok",
  } as unknown as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe("resilientFetch", () => {
  it("returns a successful response without retrying", async () => {
    const f = vi.fn(async () => res(200));
    vi.stubGlobal("fetch", f);
    const r = await resilientFetch("https://x.test", { retries: 2 });
    expect(r.status).toBe(200);
    expect(f).toHaveBeenCalledTimes(1);
  });

  it("retries on a 5xx then succeeds", async () => {
    let n = 0;
    const f = vi.fn(async () => (++n < 2 ? res(503) : res(200)));
    vi.stubGlobal("fetch", f);
    const r = await resilientFetch("https://x.test", { retries: 2 });
    expect(r.status).toBe(200);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("returns the last response when 5xx retries are exhausted", async () => {
    const f = vi.fn(async () => res(500));
    vi.stubGlobal("fetch", f);
    const r = await resilientFetch("https://x.test", { retries: 1 });
    expect(r.status).toBe(500);
    expect(f).toHaveBeenCalledTimes(2); // initial + 1 retry
  });

  it("retries on a network error then throws after exhaustion", async () => {
    const f = vi.fn(async () => {
      throw new Error("ECONNRESET");
    });
    vi.stubGlobal("fetch", f);
    await expect(resilientFetch("https://x.test", { retries: 1 })).rejects.toThrow(/ECONNRESET/);
    expect(f).toHaveBeenCalledTimes(2);
  });

  it("honors Retry-After on 429", async () => {
    let n = 0;
    const f = vi.fn(async () => (++n < 2 ? res(429, { "retry-after": "0" }) : res(200)));
    vi.stubGlobal("fetch", f);
    const r = await resilientFetch("https://x.test", { retries: 1 });
    expect(r.status).toBe(200);
  });

  it("times out a hung request", async () => {
    const f = vi.fn(
      (_url: string | URL, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          (init.signal as AbortSignal).addEventListener("abort", () =>
            reject(Object.assign(new Error("aborted"), { name: "AbortError" })),
          );
        }),
    );
    vi.stubGlobal("fetch", f);
    await expect(resilientFetch("https://x.test", { retries: 0, timeoutMs: 30 })).rejects.toThrow();
  });
});
