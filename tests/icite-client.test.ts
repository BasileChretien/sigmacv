import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRcrByPmids } from "@/lib/icite/client";

function res(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchRcrByPmids", () => {
  it("maps PMID → RCR, dropping null RCRs (recent papers) and keeping reals", async () => {
    // iCite returns the RCR under the SHORT alias `rcr` in a field-filtered
    // response (what this client requests) — NOT `relative_citation_ratio`.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          data: [
            { pmid: 111, rcr: 1.5 },
            { pmid: 222, rcr: null }, // too recent → no RCR
            { pmid: 333, rcr: 2.0 },
          ],
        }),
      ),
    );
    const map = await fetchRcrByPmids(["111", "222", "333"]);
    expect(map.get("111")).toBe(1.5);
    expect(map.get("333")).toBe(2.0);
    expect(map.has("222")).toBe(false);
    expect(map.size).toBe(2);
  });

  it("falls back to the full-record `relative_citation_ratio` field name", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ data: [{ pmid: 999, relative_citation_ratio: 4.2 }] })),
    );
    const map = await fetchRcrByPmids(["999"]);
    expect(map.get("999")).toBe(4.2);
  });

  it("ignores non-numeric PMIDs and makes no call when none are valid", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const map = await fetchRcrByPmids(["abc", "", "12x"]);
    expect(map.size).toBe(0);
    expect(f).not.toHaveBeenCalled();
  });

  it("sends the validated PMIDs in the query", async () => {
    const f = vi.fn(async (_url: URL | string) => res({ data: [] }));
    vi.stubGlobal("fetch", f);
    await fetchRcrByPmids(["111", "111", "222"]); // also de-duplicates
    const url = String(f.mock.calls[0]?.[0]);
    expect(url).toContain("111");
    expect(url).toContain("222");
  });

  it("fails soft on an API error (empty map)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({}, false, 500)),
    );
    expect((await fetchRcrByPmids(["111"])).size).toBe(0);
  });

  it("tolerates a string PMID and skips records with no PMID", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          data: [
            { pmid: "444", rcr: 3.0 }, // string pmid form
            { rcr: 9.9 }, // no pmid → skipped
          ],
        }),
      ),
    );
    const map = await fetchRcrByPmids(["444"]);
    expect(map.get("444")).toBe(3.0);
    expect(map.size).toBe(1);
  });

  it("tolerates a malformed (non-array) payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ data: null })),
    );
    expect((await fetchRcrByPmids(["111"])).size).toBe(0);
  });
});
