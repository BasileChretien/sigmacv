import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchEditorialRoles } from "@/lib/oep/client";

const URL = "https://example.org/oep.json";
const ORCID = "0000-0002-7483-2489";

function mockFetch(impl: () => Promise<Response> | Response) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

beforeEach(() => {
  process.env.OEP_DATA_URL = URL;
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  delete process.env.OEP_DATA_URL;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchEditorialRoles", () => {
  it("returns [] when no dataset URL is configured", async () => {
    delete process.env.OEP_DATA_URL;
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await fetchEditorialRoles(ORCID)).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("maps matching records and drops non-matching / incomplete ones", async () => {
    mockFetch(() =>
      new Response(
        JSON.stringify([
          { orcid: ORCID, journal: "BMJ", role: "Associate Editor", startYear: 2021 },
          { orcid: "0000-0000-0000-0000", journal: "Other", role: "Editor" }, // different person
          { orcid: ORCID, role: "Editor" }, // missing journal
          { orcid: `https://orcid.org/${ORCID}`, journal: "Lancet", role: "Reviewer" }, // URL form matches
        ]),
        { status: 200 },
      ),
    );
    const roles = await fetchEditorialRoles(ORCID);
    expect(roles).toEqual([
      { journal: "BMJ", role: "Associate Editor", startYear: 2021, endYear: undefined },
      { journal: "Lancet", role: "Reviewer", startYear: undefined, endYear: undefined },
    ]);
  });

  it("returns [] on a non-OK response", async () => {
    mockFetch(() => new Response("nope", { status: 500 }));
    expect(await fetchEditorialRoles(ORCID)).toEqual([]);
  });

  it("returns [] when the fetch throws", async () => {
    mockFetch(() => {
      throw new Error("network down");
    });
    expect(await fetchEditorialRoles(ORCID)).toEqual([]);
  });

  it("re-validates the final URL host after the fetch (allowed → proceeds)", async () => {
    mockFetch(() => ({
      ok: true,
      status: 200,
      url: "https://cdn.example.org/oep.json", // redirected to another public host
      headers: new Headers(),
      json: async () => [{ orcid: ORCID, journal: "BMJ", role: "Editor" }],
    }) as unknown as Response);
    expect(await fetchEditorialRoles(ORCID)).toEqual([
      { journal: "BMJ", role: "Editor", startYear: undefined, endYear: undefined },
    ]);
  });

  it("returns [] when the fetch redirected onto a blocked host (link-local)", async () => {
    mockFetch(() => ({
      ok: true,
      status: 200,
      url: "http://169.254.169.254/oep.json",
      headers: new Headers(),
      json: async () => [{ orcid: ORCID, journal: "BMJ", role: "Editor" }],
    }) as unknown as Response);
    expect(await fetchEditorialRoles(ORCID)).toEqual([]);
  });

  it("returns [] when the final URL is unparseable", async () => {
    mockFetch(() => ({
      ok: true,
      status: 200,
      url: "http://exa mple.org/x", // space → invalid URL
      headers: new Headers(),
      json: async () => [],
    }) as unknown as Response);
    expect(await fetchEditorialRoles(ORCID)).toEqual([]);
  });
});
