import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchWikidataIdentity } from "@/lib/wikidata/client";

const ORCID = "0000-0001-7580-4351";

function mockSparql(body: unknown, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status }))),
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchWikidataIdentity", () => {
  it("returns null for an empty ORCID without fetching", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await fetchWikidataIdentity("")).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it("aggregates the Wikidata URI, VIAF/ISNI sameAs and named awards", async () => {
    mockSparql({
      results: {
        bindings: [
          {
            person: { type: "uri", value: "http://www.wikidata.org/entity/Q6832241" },
            viaf: { value: "305009965" },
            isni: { value: "0000000114567890" },
            awardLabel: { value: "ACM Distinguished Service Award" },
          },
          {
            person: { type: "uri", value: "http://www.wikidata.org/entity/Q6832241" },
            viaf: { value: "305009965" },
            awardLabel: { value: "Q12345" }, // unresolved id label → dropped
          },
        ],
      },
    });
    const identity = await fetchWikidataIdentity(`https://orcid.org/${ORCID}`);
    expect(identity).toEqual({
      wikidataUri: "http://www.wikidata.org/entity/Q6832241",
      sameAs: [
        "http://www.wikidata.org/entity/Q6832241",
        "https://viaf.org/viaf/305009965",
        "https://isni.org/isni/0000000114567890",
      ],
      awards: ["ACM Distinguished Service Award"],
    });
  });

  it("returns null when there's no Wikidata item, and fails soft on errors", async () => {
    mockSparql({ results: { bindings: [] } });
    expect(await fetchWikidataIdentity(ORCID)).toBeNull();
    mockSparql({}, 500);
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(await fetchWikidataIdentity(ORCID)).toBeNull();
  });

  it("returns null when bindings exist but carry no person", async () => {
    mockSparql({ results: { bindings: [{ award: { value: "x" } }] } });
    expect(await fetchWikidataIdentity(ORCID)).toBeNull();
  });

  it("fails soft when the request throws", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("network down");
      }),
    );
    expect(await fetchWikidataIdentity(ORCID)).toBeNull();
  });
});
