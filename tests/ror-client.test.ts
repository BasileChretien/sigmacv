import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __clearRorCache, resolveInstitution } from "@/lib/ror/client";

function res(body: unknown, init?: { status?: number }): Response {
  const status = init?.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    json: async () => body,
  } as unknown as Response;
}

function item(name: string, opts: { id?: string; score?: number; chosen?: boolean; cc?: string }) {
  return {
    score: opts.score,
    chosen: opts.chosen,
    organization: {
      id: opts.id ?? `https://ror.org/${name.replace(/\s+/g, "")}`,
      name,
      country: opts.cc ? { country_code: opts.cc } : undefined,
    },
  };
}

beforeEach(() => __clearRorCache());
afterEach(() => vi.unstubAllGlobals());

describe("resolveInstitution", () => {
  it("returns the explicitly chosen match", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          items: [
            item("Wrong Univ", { score: 0.95, chosen: false }),
            item("Nagoya University", {
              score: 0.9,
              chosen: true,
              cc: "JP",
              id: "https://ror.org/04chrp450",
            }),
          ],
        }),
      ),
    );
    const org = await resolveInstitution("Nagoya Univ.");
    expect(org).toEqual({
      id: "https://ror.org/04chrp450",
      name: "Nagoya University",
      countryCode: "JP",
    });
  });

  it("falls back to the highest score above threshold when nothing is chosen", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          items: [
            item("Low Match", { score: 0.5 }),
            item("Best Match", { score: 0.88 }),
            item("Mid Match", { score: 0.82 }),
          ],
        }),
      ),
    );
    const org = await resolveInstitution("best match institute");
    expect(org?.name).toBe("Best Match");
  });

  it("returns null when no match clears the score threshold", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ items: [item("Weak", { score: 0.4 })] })),
    );
    expect(await resolveInstitution("something obscure")).toBeNull();
  });

  it("caches results (a second lookup makes no further request)", async () => {
    const fetchMock = vi.fn(async () => res({ items: [item("Cached U", { chosen: true })] }));
    vi.stubGlobal("fetch", fetchMock);
    const a = await resolveInstitution("Cached U");
    const b = await resolveInstitution("cached u"); // same cache key (case/space-insensitive)
    expect(a).toEqual(b);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("caches a null result too (negative caching)", async () => {
    const fetchMock = vi.fn(async () => res({ items: [] }));
    vi.stubGlobal("fetch", fetchMock);
    expect(await resolveInstitution("no such place")).toBeNull();
    expect(await resolveInstitution("no such place")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns null for an empty name without fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await resolveInstitution("   ")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null on a non-ok response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({}, { status: 500 })),
    );
    expect(await resolveInstitution("server error org")).toBeNull();
  });

  it("returns null (fails soft) on a thrown fetch error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    expect(await resolveInstitution("offline org")).toBeNull();
  });

  it("ignores a match that lacks an id or name", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ items: [{ chosen: true, organization: { name: "No Id" } }] })),
    );
    expect(await resolveInstitution("no id org")).toBeNull();
  });
});
