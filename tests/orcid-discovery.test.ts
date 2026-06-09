import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import type { OpenAlexWork } from "@/lib/openalex/types";

const mocks = vi.hoisted(() => ({
  fetchOrcidWorkDois: vi.fn(),
  fetchWorkByDoi: vi.fn(),
}));

vi.mock("@/lib/orcid/client", () => ({ fetchOrcidWorkDois: mocks.fetchOrcidWorkDois }));
// Keep the real `bareDoiInput` (pure normalizer); only the network call is stubbed.
vi.mock("@/lib/openalex/client", async (importActual) => {
  const actual = await importActual<typeof import("@/lib/openalex/client")>();
  return { ...actual, fetchWorkByDoi: mocks.fetchWorkByDoi };
});

import { MAX_ORCID_DISCOVERY_LOOKUPS, discoverOrcidOnlyWorks } from "@/lib/cv/orcidDiscovery";

/** Minimal OpenAlex work with a DOI (URL form, as OpenAlex returns it). */
function work(shortId: string, bareDoi: string): OpenAlexWork {
  return {
    id: `https://openalex.org/${shortId}`,
    doi: `https://doi.org/${bareDoi}`,
  } as OpenAlexWork;
}

/** A previous CV carrying one item with the given bare DOI in publications. */
function cvWithDoi(bareDoi: string): CanonicalCv {
  const item = { meta: { doi: bareDoi } } as unknown as CvItem;
  return {
    sections: [{ id: "publications", type: "publications", items: [item] }],
  } as unknown as CanonicalCv;
}

beforeEach(() => {
  mocks.fetchOrcidWorkDois.mockReset();
  mocks.fetchWorkByDoi.mockReset();
});

describe("discoverOrcidOnlyWorks", () => {
  it("fetches back only ORCID DOIs the OpenAlex author pull missed", async () => {
    mocks.fetchOrcidWorkDois.mockResolvedValue(["10.1000/a", "10.2000/b"]);
    mocks.fetchWorkByDoi.mockImplementation(async (doi: string) =>
      doi === "10.2000/b" ? work("W2", "10.2000/b") : null,
    );
    const out = await discoverOrcidOnlyWorks({
      orcid: "0000-0002-7483-2489",
      openAlexWorks: [work("W1", "10.1000/a")], // 10.1000/a is already attributed
      previous: null,
    });
    expect(out.map((w) => w.id)).toEqual(["https://openalex.org/W2"]);
    expect(mocks.fetchWorkByDoi).toHaveBeenCalledTimes(1);
    expect(mocks.fetchWorkByDoi).toHaveBeenCalledWith("10.2000/b");
  });

  it("excludes DOIs already present anywhere in the previous CV", async () => {
    mocks.fetchOrcidWorkDois.mockResolvedValue(["10.3000/c"]);
    const out = await discoverOrcidOnlyWorks({
      orcid: "x",
      openAlexWorks: [],
      previous: cvWithDoi("10.3000/c"),
    });
    expect(out).toEqual([]);
    expect(mocks.fetchWorkByDoi).not.toHaveBeenCalled();
  });

  it("returns [] (no lookups) when ORCID lists no works", async () => {
    mocks.fetchOrcidWorkDois.mockResolvedValue([]);
    const out = await discoverOrcidOnlyWorks({ orcid: "x", openAlexWorks: [], previous: null });
    expect(out).toEqual([]);
    expect(mocks.fetchWorkByDoi).not.toHaveBeenCalled();
  });

  it("ignores malformed DOIs and drops unresolved (null) lookups", async () => {
    mocks.fetchOrcidWorkDois.mockResolvedValue(["not-a-doi", "10.4000/d", "10.5000/e"]);
    mocks.fetchWorkByDoi.mockImplementation(async (doi: string) =>
      doi === "10.5000/e" ? work("W5", "10.5000/e") : null,
    );
    const out = await discoverOrcidOnlyWorks({ orcid: "x", openAlexWorks: [], previous: null });
    expect(out.map((w) => w.id)).toEqual(["https://openalex.org/W5"]);
    // "not-a-doi" is never looked up; only the two valid DOIs are.
    expect(mocks.fetchWorkByDoi).toHaveBeenCalledTimes(2);
  });

  it("de-duplicates two ORCID DOIs that resolve to the same work", async () => {
    mocks.fetchOrcidWorkDois.mockResolvedValue(["10.6000/f", "10.7000/g"]);
    mocks.fetchWorkByDoi.mockResolvedValue(work("W8", "10.8000/h")); // both resolve here
    const out = await discoverOrcidOnlyWorks({ orcid: "x", openAlexWorks: [], previous: null });
    expect(out).toHaveLength(1);
  });

  it("drops a resolved work that turns out to already be in the CV", async () => {
    mocks.fetchOrcidWorkDois.mockResolvedValue(["10.2000/y"]); // missing by its ORCID DOI form
    // …but it resolves to a record already attributed under a different DOI form.
    mocks.fetchWorkByDoi.mockResolvedValue(work("W1", "10.1000/x"));
    const out = await discoverOrcidOnlyWorks({
      orcid: "x",
      openAlexWorks: [work("W1", "10.1000/x")],
      previous: null,
    });
    expect(out).toEqual([]);
  });

  it("caps lookups and never silently truncates", async () => {
    const many = Array.from({ length: MAX_ORCID_DISCOVERY_LOOKUPS + 5 }, (_, i) => `10.1000/n${i}`);
    mocks.fetchOrcidWorkDois.mockResolvedValue(many);
    mocks.fetchWorkByDoi.mockResolvedValue(null);
    await discoverOrcidOnlyWorks({ orcid: "x", openAlexWorks: [], previous: null });
    expect(mocks.fetchWorkByDoi).toHaveBeenCalledTimes(MAX_ORCID_DISCOVERY_LOOKUPS);
  });
});
