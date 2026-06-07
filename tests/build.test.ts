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
import type { DataciteOutput } from "@/lib/datacite/client";
import type { OpenaireOutput } from "@/lib/openaire/client";
import type { DblpConferencePaper } from "@/lib/dblp/client";
import type { CrossrefGrant } from "@/lib/crossref/client";
import type { FunderGrant } from "@/lib/grants/match";
import type { ExternalTrial } from "@/lib/trials/types";
import type { PatentRecord } from "@/lib/patents/types";
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
    expect(cv.schemaVersion).toBe(2);
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

describe("buildCanonicalCv — external-source sections", () => {
  function buildWith(extra: Partial<Parameters<typeof buildCanonicalCv>[0]>) {
    return buildCanonicalCv({
      id: "cv_test",
      resolved,
      works,
      now: "2026-06-02T00:00:00.000Z",
      ...extra,
    });
  }
  const section = (cv: ReturnType<typeof build>, type: string) =>
    cv.sections.find((s) => s.type === type);

  it("merges OpenAIRE into Datasets, deduping DataCite DOIs, auto-included", () => {
    const dataciteOutputs = [
      { doi: "10.5281/datacite.X", title: "DC output", type: "Dataset", year: 2023, publisher: "DataCite pub" },
    ] as unknown as DataciteOutput[];
    const openaireOutputs: OpenaireOutput[] = [
      { openaireId: "oa::1", title: "OpenAIRE dataset", type: "dataset", doi: "10.5281/zenodo.1", year: 2024, publisher: "Zenodo" },
      { openaireId: "oa::2", title: "Dup of DataCite", type: "software", doi: "10.5281/datacite.X", year: 2023 },
      { openaireId: "oa::3", title: "No DOI, no publisher", type: "software", year: 2022 },
    ];
    const ds = section(buildWith({ dataciteOutputs, openaireOutputs }), "datasets")!;
    expect(ds.items).toHaveLength(3); // DataCite X + oa::1 + oa::3 (oa::2 deduped out)
    const sources = ds.items.map((i) => i.source);
    expect(sources.filter((s) => s === "openaire")).toHaveLength(2);
    expect(sources.filter((s) => s === "datacite")).toHaveLength(1);
    expect(ds.items.find((i) => i.id === "dataset:openaire:oa-1")!.meta.doi).toBe("10.5281/zenodo.1");
    expect(ds.items.every((i) => i.included)).toBe(true); // ORCID-matched → auto-included
  });

  it("builds Conference Presentations from DBLP (auto-included, newest first)", () => {
    const dblpConferencePapers: DblpConferencePaper[] = [
      { key: "conf/x/1", title: "Paper A", venue: "JCDL", year: 2021, doi: "10.1/abc" },
      { key: "conf/x/2", title: "Paper B", year: 2019 }, // no venue, no doi
    ];
    const conf = section(buildWith({ dblpConferencePapers }), "conference")!;
    expect(conf.items.map((i) => i.id)).toEqual([
      "conference:dblp:conf-x-1",
      "conference:dblp:conf-x-2",
    ]);
    expect(conf.items[0]!.source).toBe("dblp");
    expect(conf.items[0]!.meta.doi).toBe("10.1/abc");
    expect(conf.items[1]!.meta.doi).toBeUndefined();
    expect(conf.items.every((i) => i.included)).toBe(true);
  });

  it("adds Crossref grants (auto-included) + national grants (hidden review candidates)", () => {
    const crossrefGrants: CrossrefGrant[] = [
      { doi: "10.35802/1", award: "GR-1", title: "CR grant", funderName: "Wellcome", funderId: "10.13039/x", startYear: 2022, endYear: 2025 },
    ];
    const nationalGrants: FunderGrant[] = [
      { source: "ukri", externalId: "AH/Y00325X/1", title: "UKRI grant", funder: "AHRC", org: "Univ", startYear: 2024, endYear: 2026 },
      { source: "nsf", externalId: "2218427", title: "NSF grant (no funder)", startYear: 2022 }, // no funder
    ];
    const grants = section(buildWith({ crossrefGrants, nationalGrants }), "grants")!;
    const cr = grants.items.find((i) => i.source === "crossref")!;
    expect(cr.included).toBe(true); // ORCID-matched → auto-included
    expect(cr.meta.funderName).toBe("Wellcome");
    const ukri = grants.items.find((i) => i.source === "ukri")!;
    expect(ukri.included).toBe(false); // name-matched → hidden review candidate
    expect(ukri.meta.reviewFlag).toBe("name-matched");
    expect(grants.items.find((i) => i.source === "nsf")!.displayText).toContain("NSF grant");
  });

  it("dedupes a Crossref grant against an ORCID funding by award number", () => {
    const fundings = [
      { putCode: "1", title: "Mine", awardId: "GR-1", startYear: 2022 },
    ] as OrcidFunding[];
    const crossrefGrants: CrossrefGrant[] = [
      { doi: "10.35802/1", award: "gr-1", title: "Same grant", startYear: 2022 },
    ];
    const grants = section(buildWith({ fundings, crossrefGrants }), "grants")!;
    expect(grants.items.filter((i) => i.source === "crossref")).toHaveLength(0); // deduped
    expect(grants.items.filter((i) => i.source === "orcid")).toHaveLength(1);
  });

  it("builds a Clinical Trials section (hidden review candidates) + records provenance", () => {
    const clinicalTrials: ExternalTrial[] = [
      { source: "clinicaltrials", registryId: "NCT123", title: "A trial", sponsor: "Acme", phase: "PHASE2", role: "PRINCIPAL_INVESTIGATOR", org: "Univ", startYear: 2020, endYear: 2022 },
      { source: "clinicaltrials", registryId: "NCT999", title: "Sponsorless trial" }, // no sponsor/phase/years
    ];
    const cv = buildWith({ clinicalTrials });
    const trials = section(cv, "clinical-trials")!;
    const t = trials.items.find((i) => i.id === "trial:clinicaltrials:NCT123")!;
    expect(t.source).toBe("clinicaltrials");
    expect(t.included).toBe(false);
    expect(t.meta.reviewFlag).toBe("name-matched");
    expect(t.meta.type).toBe("PHASE2");
    expect(t.displayText).toContain("NCT123");
    expect(cv.provenance.sources).toContain("clinicaltrials");
  });

  it("builds a Patents section from EPO records (hidden review candidates)", () => {
    const patents: PatentRecord[] = [
      { source: "epo", publicationNumber: "EP1234567", title: "A device", applicants: ["University of York"], inventors: ["Helen Smith"], year: 2021 },
      { source: "epo", publicationNumber: "EP7654321B1", title: "Untitled-year patent", applicants: [], inventors: ["Helen Smith"] }, // no applicant, no year
    ];
    const cv = buildWith({ patents });
    const sec = section(cv, "patents")!;
    const p = sec.items.find((i) => i.id === "patent:epo:EP1234567")!;
    expect(p.source).toBe("epo");
    expect(p.included).toBe(false); // name-matched → hidden review candidate
    expect(p.meta.reviewFlag).toBe("name-matched");
    expect(p.displayText).toContain("EP1234567");
    expect(p.displayText).toContain("University of York");
    expect(cv.provenance.sources).toContain("epo");
  });

  it("preserves a user-confirmed (un-hidden) review candidate across re-sync", () => {
    const nationalGrants: FunderGrant[] = [
      { source: "nih", externalId: "5R01-1", title: "NIH grant", funder: "NIGMS", org: "JHU", startYear: 2021 },
    ];
    const first = buildWith({ nationalGrants });
    const id = section(first, "grants")!.items.find((i) => i.source === "nih")!.id;
    // User confirms it IS theirs → un-hides it.
    const confirmed = {
      ...first,
      sections: first.sections.map((s) =>
        s.type === "grants"
          ? { ...s, items: s.items.map((it) => (it.id === id ? { ...it, included: true } : it)) }
          : s,
      ),
    };
    const resynced = buildCanonicalCv({
      id: "cv_test",
      resolved,
      works,
      now: "2026-09-01T00:00:00.000Z",
      nationalGrants,
      previous: confirmed,
    });
    const item = section(resynced, "grants")!.items.find((i) => i.id === id)!;
    expect(item.included).toBe(true); // confirmation survives re-sync
    expect(item.meta.reviewFlag).toBe("name-matched");
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
