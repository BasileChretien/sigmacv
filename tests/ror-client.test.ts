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

// Mirrors ROR's **v2** affiliation-match item: the name lives in a typed
// `names[]` array (not a `name` string) and the country under `locations[]`.
// Building the v1 shape here is exactly what masked the production bug.
function item(name: string, opts: { id?: string; score?: number; chosen?: boolean; cc?: string }) {
  return {
    score: opts.score,
    chosen: opts.chosen,
    organization: {
      id: opts.id ?? `https://ror.org/${name.replace(/\s+/g, "")}`,
      names: [{ types: ["ror_display", "label"], value: name, lang: "en" }],
      locations: opts.cc ? [{ geonames_details: { country_code: opts.cc } }] : undefined,
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
      names: { en: "Nagoya University" },
    });
  });

  it("links NOTHING when no candidate is chosen, even with high scores (ambiguous)", async () => {
    // Mirrors "CHU de Caen": several near-tied, NON-chosen hits for the wrong
    // cities. A score threshold here picks a wrong institution, so we require
    // ROR's own `chosen` flag and leave the position unlinked when it's absent.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          items: [
            item("Centre Hospitalier Universitaire de Nice", { score: 0.86, chosen: false }),
            item("Centre Hospitalier Universitaire de Rennes", { score: 0.86, chosen: false }),
            item("Centre Hospitalier Universitaire de Nantes", { score: 0.86, chosen: false }),
          ],
        }),
      ),
    );
    expect(await resolveInstitution("CHU de Caen")).toBeNull();
  });

  it("returns null when there are no matches at all", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ items: [item("Weak", { score: 0.4, chosen: false })] })),
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

  it("ignores a match that lacks an id (has a v2 name but no id)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          items: [
            { chosen: true, organization: { names: [{ types: ["ror_display"], value: "No Id" }] } },
          ],
        }),
      ),
    );
    expect(await resolveInstitution("no id org")).toBeNull();
  });

  it("ignores a match that lacks any name (has an id but no names[])", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({ items: [{ chosen: true, organization: { id: "https://ror.org/x" } }] }),
      ),
    );
    expect(await resolveInstitution("no name org")).toBeNull();
  });

  // REGRESSION (prod bug): ROR moved to the v2 schema — name in `names[]`
  // (tagged "ror_display"), country under `locations[]`. The client used to read
  // the v1 `organization.name`/`country`, which were undefined, so it discarded
  // EVERY match and no position was ever ROR-linked. This pins the real v2 shape.
  it("parses the real ROR v2 response (names[] ror_display + locations[])", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          items: [
            {
              score: 1.0,
              chosen: true,
              organization: {
                id: "https://ror.org/04chrp450",
                names: [
                  { lang: null, types: ["alias"], value: "Nagoya Daigaku" },
                  { lang: "en", types: ["ror_display", "label"], value: "Nagoya University" },
                  { lang: "ja", types: ["label"], value: "名古屋大学" },
                ],
                locations: [{ geonames_details: { country_code: "JP" } }],
              },
            },
          ],
        }),
      ),
    );
    expect(await resolveInstitution("Nagoya Univ.")).toEqual({
      id: "https://ror.org/04chrp450",
      name: "Nagoya University", // ror_display chosen over the alias / ja label
      countryCode: "JP",
      // The multilingual labels are captured for locale-aware rendering (the
      // `alias` is langless → ignored).
      names: { en: "Nagoya University", ja: "名古屋大学" },
    });
  });

  it("falls back through the v2 name types (label, then any value)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          items: [
            {
              chosen: true,
              organization: {
                id: "https://ror.org/lbl",
                names: [{ types: ["label"], value: "Labelled U" }], // no ror_display
              },
            },
          ],
        }),
      ),
    );
    expect((await resolveInstitution("labelled"))?.name).toBe("Labelled U");

    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        res({
          items: [
            {
              chosen: true,
              organization: {
                id: "https://ror.org/val",
                names: [{ types: [], value: "Bare Value U" }], // neither ror_display nor label
              },
            },
          ],
        }),
      ),
    );
    expect((await resolveInstitution("bare value"))?.name).toBe("Bare Value U");
  });
});
