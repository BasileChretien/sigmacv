import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchIciteByPmids } from "@/lib/icite/client";

function res(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe("fetchIciteByPmids", () => {
  it("maps PMID → record, dropping all-null records (recent papers) and keeping reals", async () => {
    // iCite returns the RCR under the SHORT alias `rcr` in a field-filtered
    // response (what this client requests) — NOT `relative_citation_ratio`.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          data: [
            { pmid: 111, rcr: 1.5 },
            { pmid: 222, rcr: null, cited_by_clin: null, is_clinical: null, apt: null }, // too recent
            { pmid: 333, rcr: 2.0 },
          ],
        }),
      ),
    );
    const map = await fetchIciteByPmids(["111", "222", "333"]);
    expect(map.get("111")).toEqual({ rcr: 1.5 });
    expect(map.get("333")).toEqual({ rcr: 2.0 });
    expect(map.has("222")).toBe(false);
    expect(map.size).toBe(2);
  });

  it("reads every translational field: clinical-citation count, is_clinical, apt", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          data: [
            {
              pmid: 111,
              rcr: 1.8,
              cited_by_clin: [1001, 1002, 1003, 1004],
              is_clinical: false,
              apt: 0.75,
            },
            { pmid: 222, cited_by_clin: [], is_clinical: true, apt: 0 },
          ],
        }),
      ),
    );
    const map = await fetchIciteByPmids(["111", "222"]);
    expect(map.get("111")).toEqual({ rcr: 1.8, clinicalCitations: 4, isClinical: false, apt: 0.75 });
    // An empty citing list is a real 0; apt 0 and is_clinical true are kept.
    expect(map.get("222")).toEqual({ clinicalCitations: 0, isClinical: true, apt: 0 });
  });

  it("requests the translational fields in `fl`", async () => {
    const f = vi.fn(async (_url: URL | string) => res({ data: [] }));
    vi.stubGlobal("fetch", f);
    await fetchIciteByPmids(["111"]);
    const url = new URL(String(f.mock.calls[0]?.[0]));
    const fl = url.searchParams.get("fl")?.split(",") ?? [];
    expect(fl).toEqual(expect.arrayContaining(["pmid", "rcr", "cited_by_clin", "is_clinical", "apt"]));
  });

  it("accepts alternative spellings: delimited-string / numeric cited_by_clin, Yes/No / 1/0 is_clinical", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          data: [
            { pmid: 1, cited_by_clin: "1001 1002, 1003", is_clinical: "Yes" },
            { pmid: 2, cited_by_clin: 7, is_clinical: "no" },
            { pmid: 3, cited_by_clin: "", is_clinical: 1 },
            { pmid: 4, cited_by_clin: -1, is_clinical: 0 },
            { pmid: 5, cited_by_clin: 2.5, is_clinical: "maybe" },
            { pmid: 6, cited_by_clin: { nope: true }, is_clinical: 2 },
          ],
        }),
      ),
    );
    const map = await fetchIciteByPmids(["1", "2", "3", "4", "5", "6"]);
    expect(map.get("1")).toEqual({ clinicalCitations: 3, isClinical: true });
    expect(map.get("2")).toEqual({ clinicalCitations: 7, isClinical: false });
    expect(map.get("3")).toEqual({ clinicalCitations: 0, isClinical: true });
    // Negative / fractional counts and unknown booleans are treated as absent.
    expect(map.get("4")).toEqual({ isClinical: false });
    expect(map.has("5")).toBe(false);
    expect(map.has("6")).toBe(false);
  });

  it("drops an apt outside 0..1 and a non-numeric rcr", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          data: [
            { pmid: 1, apt: 1.5, rcr: "2.0" },
            { pmid: 2, apt: -0.1 },
            { pmid: 3, apt: 1, rcr: Number.NaN },
          ],
        }),
      ),
    );
    const map = await fetchIciteByPmids(["1", "2", "3"]);
    expect(map.has("1")).toBe(false);
    expect(map.has("2")).toBe(false);
    expect(map.get("3")).toEqual({ apt: 1 });
  });

  it("falls back to the full-record `relative_citation_ratio` field name", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ data: [{ pmid: 999, relative_citation_ratio: 4.2 }] })),
    );
    const map = await fetchIciteByPmids(["999"]);
    expect(map.get("999")?.rcr).toBe(4.2);
  });

  it("ignores non-numeric PMIDs and makes no call when none are valid", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    const map = await fetchIciteByPmids(["abc", "", "12x"]);
    expect(map.size).toBe(0);
    expect(f).not.toHaveBeenCalled();
  });

  it("sends the validated PMIDs in the query", async () => {
    const f = vi.fn(async (_url: URL | string) => res({ data: [] }));
    vi.stubGlobal("fetch", f);
    await fetchIciteByPmids(["111", "111", "222"]); // also de-duplicates
    const url = String(f.mock.calls[0]?.[0]);
    expect(url).toContain("111");
    expect(url).toContain("222");
  });

  it("fails soft on an API error (empty map)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({}, false, 500)),
    );
    expect((await fetchIciteByPmids(["111"])).size).toBe(0);
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
    const map = await fetchIciteByPmids(["444"]);
    expect(map.get("444")?.rcr).toBe(3.0);
    expect(map.size).toBe(1);
  });

  it("tolerates a malformed (non-array) payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ data: null })),
    );
    expect((await fetchIciteByPmids(["111"])).size).toBe(0);
  });
});
