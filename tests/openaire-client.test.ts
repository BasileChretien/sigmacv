import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the token exchange so no network/credential is needed.
const { getTokenMock } = vi.hoisted(() => ({ getTokenMock: vi.fn() }));
vi.mock("@/lib/openaire/auth", () => ({ getOpenaireAccessToken: getTokenMock }));

import { fetchOpenaireOutputs } from "@/lib/openaire/client";

const ORCID = "0000-0002-7483-2489";

function dataset(id: string, fields: Record<string, unknown>): Record<string, unknown> {
  return { id, type: "dataset", ...fields };
}

beforeEach(() => {
  getTokenMock.mockResolvedValue("access-token");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchOpenaireOutputs", () => {
  it("returns [] for an empty ORCID without fetching", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await fetchOpenaireOutputs("")).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });

  it("fetches datasets + software by authorOrcid, maps + dedups by id", async () => {
    const urls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn((url: unknown) => {
        const u = new URL(String(url));
        urls.push(u.toString());
        const type = u.searchParams.get("type");
        const results =
          type === "dataset"
            ? [
                dataset("oa::1", {
                  mainTitle: "Open Editors Plus 2026: Editorial Board Composition",
                  publicationDate: "2026-04-08",
                  publisher: "Zenodo",
                  pids: [{ scheme: "doi", value: "10.5281/zenodo.19468383" }],
                }),
                dataset("oa::1", { mainTitle: "dup", pids: [] }), // dup id dropped
                dataset("oa::2", { pids: [] }), // no title dropped
                dataset("oa::4", {
                  mainTitle: "Handle-only dataset",
                  pids: [{ scheme: "handle", value: "11234/x" }],
                }),
                null, // non-object element → mapProduct returns null
                { id: 999, type: "dataset", mainTitle: "Numeric id" }, // non-string id → null
                dataset("oa::5", { mainTitle: "No pids field" }), // pids missing → non-array branch
              ]
            : type === "software"
              ? [
                  {
                    id: "oa::3",
                    mainTitle: "My research tool",
                    type: "software",
                    publicationDate: "2023-01-15",
                    publisher: "GitHub",
                    pids: [{ scheme: "doi", value: "10.5281/zenodo.999" }],
                  },
                ]
              : [];
        return new Response(JSON.stringify({ results }), { status: 200 });
      }),
    );

    const out = await fetchOpenaireOutputs(`https://orcid.org/${ORCID}`);
    expect(
      urls.some((u) => u.includes("authorOrcid=0000-0002-7483-2489") && u.includes("type=dataset")),
    ).toBe(true);
    expect(urls.some((u) => u.includes("type=software"))).toBe(true);
    expect(out).toEqual([
      {
        openaireId: "oa::1",
        title: "Open Editors Plus 2026: Editorial Board Composition",
        type: "dataset",
        doi: "10.5281/zenodo.19468383",
        year: 2026,
        publisher: "Zenodo",
      },
      {
        openaireId: "oa::4",
        title: "Handle-only dataset",
        type: "dataset",
        doi: undefined,
        year: undefined,
        publisher: undefined,
      },
      {
        openaireId: "oa::5",
        title: "No pids field",
        type: "dataset",
        doi: undefined,
        year: undefined,
        publisher: undefined,
      },
      {
        openaireId: "oa::3",
        title: "My research tool",
        type: "software",
        doi: "10.5281/zenodo.999",
        year: 2023,
        publisher: "GitHub",
      },
    ]);
  });

  it("works anonymously when no access token is available", async () => {
    getTokenMock.mockResolvedValue(null);
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Response(JSON.stringify({ results: [] }), { status: 200 })),
    );
    expect(await fetchOpenaireOutputs(ORCID)).toEqual([]);
  });

  it("fails soft on non-OK and on thrown fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Response("err", { status: 500 })),
    );
    expect(await fetchOpenaireOutputs(ORCID)).toEqual([]);
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("network down");
      }),
    );
    expect(await fetchOpenaireOutputs(ORCID)).toEqual([]);
  });
});
