import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchOpenCitationsCount } from "@/lib/opencitations/client";

function res(body: unknown, ok = true, status = 200): Response {
  return { ok, status, text: async () => JSON.stringify(body) } as unknown as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchOpenCitationsCount", () => {
  it("parses the documented shape: a one-element array with a STRING count", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res([{ count: "12" }])),
    );
    expect(await fetchOpenCitationsCount("10.1234/abc")).toBe(12);
  });

  it("tolerates a numeric count", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res([{ count: 7 }])),
    );
    expect(await fetchOpenCitationsCount("10.1234/abc")).toBe(7);
  });

  it("tolerates a bare object (no array wrapper)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ count: "3" })),
    );
    expect(await fetchOpenCitationsCount("10.1234/abc")).toBe(3);
  });

  it("rejects a malformed DOI without making a call", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await fetchOpenCitationsCount("not-a-doi")).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it("strips a doi.org URL prefix and lower-cases the DOI", async () => {
    const f = vi.fn(async (url: URL | string) => {
      expect(String(url)).toContain("doi:10.1234/abc");
      return res([{ count: "1" }]);
    });
    vi.stubGlobal("fetch", f);
    await fetchOpenCitationsCount("https://doi.org/10.1234/ABC");
  });

  it("fails soft on an HTTP error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res([{ count: "1" }], false, 500)),
    );
    expect(await fetchOpenCitationsCount("10.1234/abc")).toBeNull();
  });

  it("fails soft on a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network down");
      }),
    );
    expect(await fetchOpenCitationsCount("10.1234/abc")).toBeNull();
  });

  it("returns null for an empty array (no OpenCitations record)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res([])),
    );
    expect(await fetchOpenCitationsCount("10.1234/abc")).toBeNull();
  });

  it("returns null for a malformed count value", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res([{ count: "not-a-number" }])),
    );
    expect(await fetchOpenCitationsCount("10.1234/abc")).toBeNull();
  });

  it("returns null for a negative count", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res([{ count: "-5" }])),
    );
    expect(await fetchOpenCitationsCount("10.1234/abc")).toBeNull();
  });

  it("returns null when the body exceeds the byte cap", async () => {
    const huge = "x".repeat(20_000);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, text: async () => huge }) as unknown as Response),
    );
    expect(await fetchOpenCitationsCount("10.1234/abc")).toBeNull();
  });

  it("returns null on unparsable JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({ ok: true, status: 200, text: async () => "not json" }) as unknown as Response,
      ),
    );
    expect(await fetchOpenCitationsCount("10.1234/abc")).toBeNull();
  });
});
