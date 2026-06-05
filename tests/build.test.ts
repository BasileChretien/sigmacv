import { describe, expect, it } from "vitest";
import {
  buildCanonicalCv,
  indexFundersByAward,
  resolveFunderIds,
} from "@/lib/canonical/build";
import { parseCanonicalCv, type CvItem } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import type { OrcidFunding } from "@/lib/orcid/client";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};

function build() {
  return buildCanonicalCv({
    id: "cv_test",
    resolved,
    works,
    now: "2026-06-02T00:00:00.000Z",
  });
}

describe("buildCanonicalCv", () => {
  it("produces a schema-valid canonical object", () => {
    const cv = build();
    expect(() => parseCanonicalCv(cv)).not.toThrow();
    expect(cv.schemaVersion).toBe(1);
    expect(cv.owner.orcid).toBe("0000-0002-7483-2489");
    expect(cv.sections).toHaveLength(1);
    expect(cv.sections[0]!.type).toBe("publications");
  });

  it("orders items newest-first with sequential order indices", () => {
    const items = build().sections[0]!.items;
    expect(items.map((i) => i.id)).toEqual([
      "W4300000002", // 2024
      "W4300000001", // 2023
      "W4300000003", // 2020
    ]);
    expect(items.map((i) => i.order)).toEqual([0, 1, 2]);
  });

  it("flags authoredBySelf by identifier — matches on OpenAlex id OR ORCID", () => {
    const items = build().sections[0]!.items;
    const byId = (id: string) => items.find((i) => i.id === id)!;
    // matched by primary author id
    expect(byId("W4300000001").authoredBySelf).toBe(true);
    // matched by secondary author id + orcid
    expect(byId("W4300000002").authoredBySelf).toBe(true);
  });

  it("does NOT flag a same-family-name work with a different identifier", () => {
    const namesake = build().sections[0]!.items.find(
      (i) => i.id === "W4300000003",
    )!;
    expect(namesake.authoredBySelf).toBe(false);
    expect(namesake.selfNameVariants).toEqual([]);
  });

  it("captures self name variants (incl. family name) only for own works", () => {
    const own = build().sections[0]!.items.find(
      (i) => i.id === "W4300000001",
    )!;
    expect(own.selfNameVariants).toContain("Basile Chrétien");
    expect(own.selfNameVariants).toContain("Chrétien");
  });

  it("defaults all items to included and metrics off", () => {
    const cv = build();
    expect(cv.sections[0]!.items.every((i) => i.included)).toBe(true);
    expect(cv.display.showMetrics).toBe(false);
    expect(cv.display.highlightSelf).toBe(true);
    expect(cv.display.cslStyle).toBe("apa");
  });

  it("preserves prior curation on re-sync (included flag survives)", () => {
    const first = build();
    const curated = {
      ...first,
      sections: first.sections.map((s) => ({
        ...s,
        items: s.items.map((it) =>
          it.id === "W4300000003" ? { ...it, included: false } : it,
        ),
      })),
    };
    const resynced = buildCanonicalCv({
      id: "cv_test",
      resolved,
      works,
      now: "2026-07-01T00:00:00.000Z",
      previous: curated,
    });
    const namesake = resynced.sections[0]!.items.find(
      (i) => i.id === "W4300000003",
    )!;
    expect(namesake.included).toBe(false);
  });

  it("preserves a 'not mine' assertion (+timestamp) across re-sync", () => {
    const first = build();
    const asserted = {
      ...first,
      sections: first.sections.map((s) => ({
        ...s,
        items: s.items.map((it) =>
          it.id === "W4300000003"
            ? { ...it, notMine: true, notMineAssertedAt: "2026-06-02T00:00:00.000Z" }
            : it,
        ),
      })),
    };
    const resynced = buildCanonicalCv({
      id: "cv_test",
      resolved,
      works,
      now: "2026-09-01T00:00:00.000Z",
      previous: asserted,
    });
    const item = resynced.sections[0]!.items.find((i) => i.id === "W4300000003")!;
    expect(item.notMine).toBe(true);
    expect(item.notMineAssertedAt).toBe("2026-06-02T00:00:00.000Z");
  });

  it("defaults notMine=false on a fresh build", () => {
    expect(build().sections[0]!.items.every((i) => i.notMine === false)).toBe(true);
  });

  function withExtraPubItems(base: ReturnType<typeof build>, extra: CvItem[]) {
    return {
      ...base,
      sections: base.sections.map((s) =>
        s.type === "publications" ? { ...s, items: [...s.items, ...extra] } : s,
      ),
    };
  }

  it("preserves user-added (claimed + manual) publications across re-sync", () => {
    const claimed: CvItem = {
      id: "W_CLAIMED",
      source: "openalex",
      sourceId: "https://openalex.org/W_CLAIMED",
      csl: { id: "W_CLAIMED", type: "article-journal", title: "A claimed CJK paper", DOI: "10.9999/claimed" },
      included: true,
      notMine: false,
      order: 99,
      authoredBySelf: true,
      selfNameVariants: ["Wei Zhang"],
      meta: { year: 2019, claimed: true, matchBasis: "claimed", authorPosition: 2, peerReviewed: true },
    };
    const manual: CvItem = {
      id: "publication:manual:abc",
      source: "manual",
      sourceId: "manual",
      csl: { id: "publication:manual:abc", type: "article-journal", title: "A hand-typed work" },
      included: true,
      notMine: false,
      order: 98,
      authoredBySelf: false,
      selfNameVariants: [],
      meta: { year: 2018 },
    };
    const resynced = buildCanonicalCv({
      id: "cv_test",
      resolved,
      works,
      now: "2026-08-01T00:00:00.000Z",
      previous: withExtraPubItems(build(), [claimed, manual]),
    });
    const ids = resynced.sections.find((s) => s.type === "publications")!.items.map((i) => i.id);
    expect(ids).toContain("W_CLAIMED"); // DOI-claimed work survives
    expect(ids).toContain("publication:manual:abc"); // manual entry survives (was a pre-existing loss)
  });

  it("a claimed work OpenAlex later attributes is superseded, not duplicated", () => {
    const first = build();
    const dupDoi = first.sections[0]!.items.find((i) => i.id === "W4300000001")!.csl!.DOI!;
    const staleClaim: CvItem = {
      id: "W_STALE",
      source: "openalex",
      sourceId: "https://openalex.org/W_STALE",
      csl: { id: "W_STALE", type: "article-journal", title: "Now properly attributed", DOI: dupDoi },
      included: true,
      notMine: false,
      order: 99,
      authoredBySelf: true,
      selfNameVariants: [],
      meta: { claimed: true, matchBasis: "claimed" },
    };
    const resynced = buildCanonicalCv({
      id: "cv_test",
      resolved,
      works,
      now: "2026-08-01T00:00:00.000Z",
      previous: withExtraPubItems(first, [staleClaim]),
    });
    const items = resynced.sections[0]!.items;
    expect(items.filter((i) => i.csl?.DOI?.toLowerCase() === dupDoi.toLowerCase())).toHaveLength(1);
    expect(items.find((i) => i.id === "W_STALE")).toBeUndefined();
  });

  it("appends newly-discovered works AFTER the user's curated order on re-sync", () => {
    const first = build();
    // Simulate the user reordering to: W3, W2, W1.
    const customOrder: Record<string, number> = {
      W4300000003: 0,
      W4300000002: 1,
      W4300000001: 2,
    };
    const previous = {
      ...first,
      sections: first.sections.map((s) => ({
        ...s,
        items: s.items.map((it) => ({
          ...it,
          order: customOrder[it.id] ?? it.order,
        })),
      })),
    };

    // A brand-new (and newest) work appears on re-sync.
    const newWork = {
      id: "https://openalex.org/W9000000009",
      title: "Brand new finding",
      display_name: "Brand new finding",
      publication_year: 2025,
      publication_date: "2025-03-01",
      type: "article",
      type_crossref: "journal-article",
      cited_by_count: 0,
      authorships: [
        {
          author_position: "first",
          author: {
            id: "https://openalex.org/A5001069481",
            display_name: "Basile Chrétien",
            orcid: "https://orcid.org/0000-0002-7483-2489",
          },
          raw_author_name: "Basile Chrétien",
        },
      ],
      primary_location: { source: { display_name: "New Journal" } },
      biblio: {},
    } as unknown as OpenAlexWork;

    const resynced = buildCanonicalCv({
      id: "cv_test",
      resolved,
      works: [newWork, ...works],
      now: "2026-08-01T00:00:00.000Z",
      previous,
    });

    const ordered = [...resynced.sections[0]!.items].sort(
      (a, b) => a.order - b.order,
    );
    // Curated order is preserved; the new (newest) work is appended last.
    expect(ordered.map((i) => i.id)).toEqual([
      "W4300000003",
      "W4300000002",
      "W4300000001",
      "W9000000009",
    ]);
  });

  it("populates per-work license (primary, else best_oa fallback, else none)", () => {
    const items = build().sections[0]!.items;
    const byId = (id: string) => items.find((i) => i.id === id)!;
    // primary_location.license
    expect(byId("W4300000001").meta.license).toBe("cc-by");
    // primary license is null → falls back to best_oa_location.license
    expect(byId("W4300000002").meta.license).toBe("cc-by-nc-nd");
    // neither location carries a license
    expect(byId("W4300000003").meta.license).toBeUndefined();
  });

  it("extracts the bare PubMed id from the OpenAlex ids.pmid URL", () => {
    const items = build().sections[0]!.items;
    const byId = (id: string) => items.find((i) => i.id === id)!;
    expect(byId("W4300000001").meta.pmid).toBe("123456");
    expect(byId("W4300000002").meta.pmid).toBeUndefined(); // no ids.pmid
  });

  it("stamps lastVerifiedAt with the build timestamp for live-sourced works", () => {
    const items = build().sections[0]!.items;
    expect(items.every((i) => i.meta.lastVerifiedAt === "2026-06-02T00:00:00.000Z")).toBe(true);
  });

  it("breaks recency ties alphabetically by title", () => {
    const sameYear = [
      {
        id: "https://openalex.org/W500",
        title: "Zeta study",
        publication_year: 2022,
        type: "article",
        authorships: [
          { author: { id: "https://openalex.org/A5001069481" }, raw_author_name: "Self" },
        ],
        primary_location: { source: { display_name: "Journal A", type: "journal" } },
      },
      {
        id: "https://openalex.org/W501",
        title: "Alpha study",
        publication_year: 2022,
        type: "article",
        authorships: [
          { author: { id: "https://openalex.org/A5001069481" }, raw_author_name: "Self" },
        ],
        primary_location: { source: { display_name: "Journal A", type: "journal" } },
      },
    ] as unknown as OpenAlexWork[];
    const cv = buildCanonicalCv({
      id: "tie",
      resolved,
      works: sameYear,
      now: "2026-06-02T00:00:00.000Z",
    });
    expect(cv.sections[0]!.items.map((i) => i.csl?.title)).toEqual([
      "Alpha study",
      "Zeta study",
    ]);
  });
});

describe("indexFundersByAward", () => {
  it("indexes OpenAlex grants by lower-cased award number (first wins)", () => {
    const ws = [
      {
        id: "https://openalex.org/W1",
        grants: [
          { funder: "https://openalex.org/F1", funder_display_name: "Funder One", award_id: "AB-1" },
          // Duplicate award number → the first entry is kept.
          { funder: "https://openalex.org/F2", funder_display_name: "Funder Two", award_id: "ab-1" },
          // No award id → skipped (can't be keyed).
          { funder: "https://openalex.org/F3", award_id: null },
        ],
      },
      // A work with no grants array at all.
      { id: "https://openalex.org/W2" },
    ] as unknown as OpenAlexWork[];
    const idx = indexFundersByAward(ws);
    expect(idx.get("ab-1")).toEqual({
      funderId: "https://openalex.org/F1",
      funderName: "Funder One",
    });
    expect(idx.size).toBe(1); // only the one keyable, de-duped award
  });
});

describe("resolveFunderIds", () => {
  const idx = indexFundersByAward([
    {
      id: "https://openalex.org/W1",
      grants: [{ funder: "https://openalex.org/F1", funder_display_name: "OA Funder", award_id: "AB-1" }],
    },
  ] as unknown as OpenAlexWork[]);

  it("prefers ORCID's own funder id + org name over the OpenAlex match", () => {
    const f: OrcidFunding = {
      putCode: "1",
      title: "Grant",
      organization: "ORCID Org",
      funderId: "FUNDREF:10.13039/x",
      awardId: "AB-1",
    };
    expect(resolveFunderIds(f, idx)).toEqual({
      funderId: "FUNDREF:10.13039/x",
      funderName: "ORCID Org",
      awardId: "AB-1",
    });
  });

  it("borrows the OpenAlex funder id (by award) when ORCID lacks one", () => {
    const f: OrcidFunding = { putCode: "2", title: "Grant", awardId: "AB-1" };
    expect(resolveFunderIds(f, idx)).toEqual({
      funderId: "https://openalex.org/F1",
      // No ORCID org + no need to fall back? funderName falls back to OA name.
      funderName: "OA Funder",
      awardId: "AB-1",
    });
  });

  it("invents nothing when neither ORCID nor OpenAlex carries identifiers", () => {
    const f: OrcidFunding = { putCode: "3", title: "Grant" };
    expect(resolveFunderIds(f, idx)).toEqual({
      funderId: undefined,
      funderName: undefined,
      awardId: undefined,
    });
  });
});
