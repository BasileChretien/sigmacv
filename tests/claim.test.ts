import { describe, expect, it } from "vitest";
import {
  buildClaimedItem,
  claimAuthors,
  claimedIsPreprint,
  selfIndexById,
} from "@/lib/canonical/claim";
import { bareDoiInput } from "@/lib/openalex/client";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";

const ME = "0000-0002-7483-2489";

function work(over: Partial<OpenAlexWork> = {}): OpenAlexWork {
  return {
    id: "https://openalex.org/W999",
    doi: "https://doi.org/10.1234/abc",
    title: "A worldwide pharmacoepidemiologic study",
    display_name: "A worldwide pharmacoepidemiologic study",
    publication_year: 2022,
    type: "article",
    cited_by_count: 7,
    fwci: 1.8,
    // A real published article carries its journal venue; isPreprint() treats a
    // work with no venue as unpublished, so the fixture needs one.
    primary_location: {
      source: { type: "journal", display_name: "British Journal of Clinical Pharmacology" },
    },
    open_access: { is_oa: true, oa_status: "gold" },
    authorships: [
      {
        author: { id: "https://openalex.org/A111", display_name: "Alice Other" },
        author_position: "first",
      },
      {
        author: {
          id: "https://openalex.org/A222",
          display_name: "Basile Chrétien",
          orcid: "https://orcid.org/0000-0002-7483-2489",
        },
        author_position: "middle",
        is_corresponding: true,
      },
    ],
    ...over,
  } as unknown as OpenAlexWork;
}

const meById: ResolvedAuthor = { orcid: ME, authorIds: [], displayName: "Basile Chrétien" };
const stranger: ResolvedAuthor = {
  orcid: "0000-0000-0000-0000",
  authorIds: [],
  displayName: "Nobody",
};

describe("bareDoiInput", () => {
  it("strips scheme / doi.org / doi: prefixes and lower-cases", () => {
    expect(bareDoiInput("https://doi.org/10.1234/ABC")).toBe("10.1234/abc");
    expect(bareDoiInput("doi:10.1234/abc")).toBe("10.1234/abc");
    expect(bareDoiInput("  10.1234/abc  ")).toBe("10.1234/abc");
  });
  it("rejects non-DOI input", () => {
    expect(bareDoiInput("")).toBeNull();
    expect(bareDoiInput("not a doi")).toBeNull();
    expect(bareDoiInput("https://example.org/x")).toBeNull();
  });
  it("rejects payloads that could re-target the OpenAlex request path/query", () => {
    // The bare DOI is interpolated into `/works/doi:<bare>` — these must not pass.
    expect(bareDoiInput("10.1234/../../authors/A123")).toBeNull(); // path traversal
    expect(bareDoiInput("10.1234/x?per-page=1&foo=bar")).toBeNull(); // query injection
    expect(bareDoiInput("10.1234/x#frag")).toBeNull(); // fragment
    expect(bareDoiInput("10.1234/x%2e%2e")).toBeNull(); // encoded separator
    expect(bareDoiInput("10.1234/x\\y")).toBeNull(); // backslash
  });
  it("still accepts legitimate DOIs with slashes, dots and punctuation", () => {
    expect(bareDoiInput("10.1136/bmj.314.7079.497")).toBe("10.1136/bmj.314.7079.497");
    expect(bareDoiInput("10.1000/xyz123(abc):def")).toBe("10.1000/xyz123(abc):def");
  });
});

describe("claimAuthors / selfIndexById", () => {
  it("lists authors with their position and flags the id-matched self", () => {
    expect(claimAuthors(work(), meById)).toEqual([
      { position: 1, name: "Alice Other", isSelfById: false },
      { position: 2, name: "Basile Chrétien", isSelfById: true },
    ]);
    expect(selfIndexById(work(), meById)).toBe(1);
    expect(selfIndexById(work(), stranger)).toBe(-1);
  });
});

describe("buildClaimedItem", () => {
  it("attributes by identifier when the work already carries the user's ORCID", () => {
    const item = buildClaimedItem(work(), meById);
    expect(item.authoredBySelf).toBe(true);
    expect(item.meta.authorPosition).toBe(2);
    expect(item.meta.authorCount).toBe(2);
    expect(item.meta.matchBasis).toBe("orcid");
    expect(item.meta.isCorresponding).toBe(true);
    expect(item.meta.claimed).toBe(true);
    // Metadata comes from the source — un-paddable.
    expect(item.meta.citedByCount).toBe(7);
    expect(item.meta.fwci).toBe(1.8);
    expect(item.meta.peerReviewed).toBe(true);
    expect(item.selfNameVariants).toContain("Basile Chrétien");
    expect(item.id).toBe("W999");
    expect(item.meta.doi).toBe("10.1234/abc");
  });

  it("uses the user-chosen author (matchBasis 'claimed') when there's no id match", () => {
    const item = buildClaimedItem(work(), stranger, { selfAuthorIndex: 0 });
    expect(item.authoredBySelf).toBe(true);
    expect(item.meta.authorPosition).toBe(1);
    expect(item.meta.matchBasis).toBe("claimed");
    expect(item.selfNameVariants).toEqual(["Alice Other"]);
    expect(item.meta.reviewFlag).toBeUndefined(); // orcid-conflict only for id matches
    expect(item.meta.claimed).toBe(true);
  });

  it("adds the work unattributed when there's no id match and no chosen author", () => {
    const item = buildClaimedItem(work(), stranger);
    expect(item.authoredBySelf).toBe(false);
    expect(item.meta.authorPosition).toBeUndefined();
    expect(item.meta.matchBasis).toBeUndefined();
    expect(item.selfNameVariants).toEqual([]);
    expect(item.meta.claimed).toBe(true);
  });

  it("handles a work with no authorships", () => {
    const item = buildClaimedItem(work({ authorships: [] }), stranger, { selfAuthorIndex: 0 });
    expect(item.authoredBySelf).toBe(false); // index out of range → unattributed
    expect(item.meta.authorCount).toBeUndefined();
  });

  it("leaves optional meta undefined when the source omits it (sparse work)", () => {
    const sparse = {
      id: "https://openalex.org/W7",
      title: "Sparse work",
      type: "article",
      primary_location: { source: { display_name: "Some Journal" } },
      authorships: [{ author: { display_name: "Wei Zhang" } }],
    } as unknown as OpenAlexWork;
    const item = buildClaimedItem(sparse, stranger, { selfAuthorIndex: 0 });
    expect(item.authoredBySelf).toBe(true);
    expect(item.meta.matchBasis).toBe("claimed");
    expect(item.meta.year).toBeUndefined();
    expect(item.meta.fwci).toBeUndefined();
    expect(item.meta.oaStatus).toBeUndefined();
    expect(item.meta.isCorresponding).toBeUndefined();
    expect(item.meta.citedByCount).toBeUndefined();
    expect(item.selfNameVariants).toEqual(["Wei Zhang"]);
  });

  it("flags a claimed preprint for the Preprints section", () => {
    expect(claimedIsPreprint(work({ type: "preprint" }))).toBe(true);
    expect(claimedIsPreprint(work())).toBe(false);
  });
});
