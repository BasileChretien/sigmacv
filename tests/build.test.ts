import { describe, expect, it } from "vitest";
import {
  buildCanonicalCv,
  indexFundersByAward,
  openalexTypeClass,
  orcidTypeClass,
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
import { sectionTitle } from "@/lib/i18n";
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
    const namesake = build().sections[0]!.items.find((i) => i.id === "W4300000003")!;
    expect(namesake.authoredBySelf).toBe(false);
    expect(namesake.selfNameVariants).toEqual([]);
  });

  it("captures self name variants (incl. family name) only for own works", () => {
    const own = build().sections[0]!.items.find((i) => i.id === "W4300000001")!;
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
        items: s.items.map((it) => (it.id === "W4300000003" ? { ...it, included: false } : it)),
      })),
    };
    const resynced = buildCanonicalCv({
      id: "cv_test",
      resolved,
      works,
      now: "2026-07-01T00:00:00.000Z",
      previous: curated,
    });
    const namesake = resynced.sections[0]!.items.find((i) => i.id === "W4300000003")!;
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
      csl: {
        id: "W_CLAIMED",
        type: "article-journal",
        title: "A claimed CJK paper",
        DOI: "10.9999/claimed",
      },
      included: true,
      notMine: false,
      order: 99,
      authoredBySelf: true,
      selfNameVariants: ["Wei Zhang"],
      meta: {
        year: 2019,
        claimed: true,
        matchBasis: "claimed",
        authorPosition: 2,
        peerReviewed: true,
      },
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
      csl: {
        id: "W_STALE",
        type: "article-journal",
        title: "Now properly attributed",
        DOI: dupDoi,
      },
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

  it("a claimed PREPRINT OpenAlex later publishes is not listed in BOTH sections", () => {
    const first = build();
    const dupDoi = first.sections[0]!.items.find((i) => i.id === "W4300000001")!.csl!.DOI!;
    // The user previously claimed this work while it was a preprint, so it sits
    // in a Preprints section. OpenAlex now returns it as a published article
    // (in `works` → Publications). It must appear once, not in both sections.
    const stalePreprintClaim: CvItem = {
      id: "W_PREPRINT_STALE",
      source: "openalex",
      sourceId: "https://openalex.org/W_PREPRINT_STALE",
      csl: {
        id: "W_PREPRINT_STALE",
        type: "article-journal",
        title: "Was a preprint",
        DOI: dupDoi,
      },
      included: true,
      notMine: false,
      order: 0,
      authoredBySelf: true,
      selfNameVariants: [],
      meta: { claimed: true, matchBasis: "claimed" },
    };
    const previous = {
      ...first,
      sections: [
        ...first.sections,
        {
          id: "preprints",
          type: "preprints" as const,
          title: "Preprints",
          visible: true,
          order: 1,
          items: [stalePreprintClaim],
        },
      ],
    };
    const resynced = buildCanonicalCv({
      id: "cv_test",
      resolved,
      works,
      now: "2026-08-01T00:00:00.000Z",
      previous,
    });
    const allItems = resynced.sections.flatMap((s) => s.items);
    expect(allItems.filter((i) => i.csl?.DOI?.toLowerCase() === dupDoi.toLowerCase())).toHaveLength(
      1,
    );
    expect(allItems.find((i) => i.id === "W_PREPRINT_STALE")).toBeUndefined();
  });

  it("preserves a hide when the same DOI sat in two prior sections (no clobber)", () => {
    const dupDoi = "10.1000/example1"; // the DOI of fetched work W4300000001
    const hiddenOld: CvItem = {
      id: "OLD_HIDDEN",
      source: "openalex",
      sourceId: "https://openalex.org/OLD_HIDDEN",
      csl: { id: "OLD_HIDDEN", type: "article-journal", DOI: dupDoi },
      included: true,
      notMine: true, // user asserted "not mine" on this copy
      notMineAssertedAt: "2026-01-01T00:00:00.000Z",
      order: 0,
      authoredBySelf: false,
      selfNameVariants: [],
      meta: { doi: dupDoi },
    };
    const visibleOld: CvItem = {
      id: "OLD_VISIBLE",
      source: "dblp",
      sourceId: "dblp",
      csl: { id: "OLD_VISIBLE", type: "paper-conference", DOI: dupDoi },
      included: true,
      notMine: false,
      order: 0,
      authoredBySelf: false,
      selfNameVariants: [],
      meta: { doi: dupDoi },
    };
    // Same DOI in two sections; the non-hidden copy is iterated LAST. With the
    // old "last wins" DOI index, the hide would be lost on re-sync.
    const previous = {
      ...build(),
      sections: [
        {
          id: "publications",
          type: "publications" as const,
          title: "Publications",
          visible: true,
          order: 0,
          items: [hiddenOld],
        },
        {
          id: "conference",
          type: "conference" as const,
          title: "Conference",
          visible: true,
          order: 4,
          items: [visibleOld],
        },
      ],
    };
    const resynced = buildCanonicalCv({
      id: "cv_test",
      resolved,
      works,
      now: "2026-08-01T00:00:00.000Z",
      previous,
    });
    // The fetched work (matched by DOI, not id) must inherit the "not mine" hide.
    const rebuilt = resynced.sections
      .flatMap((s) => s.items)
      .find((i) => i.csl?.DOI?.toLowerCase() === dupDoi.toLowerCase())!;
    expect(rebuilt.notMine).toBe(true);
  });

  it("disambiguates peer-review item ids for two ISSN-less venues with the same name", () => {
    const cv = buildCanonicalCv({
      id: "cv_pr",
      resolved,
      works: [],
      now: "2026-06-02T00:00:00.000Z",
      peerReviews: [
        { organization: "Nature Publishing Group", count: 3 },
        { organization: "Nature Publishing Group", count: 5 },
      ],
    });
    const pr = cv.sections.find((s) => s.type === "peer-review")!;
    const ids = pr.items.map((i) => i.id);
    expect(pr.items).toHaveLength(2);
    expect(new Set(ids).size).toBe(ids.length); // distinct ids, no collision
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

    const ordered = [...resynced.sections[0]!.items].sort((a, b) => a.order - b.order);
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
    expect(cv.sections[0]!.items.map((i) => i.csl?.title)).toEqual(["Alpha study", "Zeta study"]);
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
      {
        doi: "10.5281/datacite.X",
        title: "DC output",
        type: "Dataset",
        year: 2023,
        publisher: "DataCite pub",
      },
    ] as unknown as DataciteOutput[];
    const openaireOutputs: OpenaireOutput[] = [
      {
        openaireId: "oa::1",
        title: "OpenAIRE dataset",
        type: "dataset",
        doi: "10.5281/zenodo.1",
        year: 2024,
        publisher: "Zenodo",
      },
      {
        openaireId: "oa::2",
        title: "Dup of DataCite",
        type: "software",
        doi: "10.5281/datacite.X",
        year: 2023,
      },
      { openaireId: "oa::3", title: "No DOI, no publisher", type: "software", year: 2022 },
    ];
    const ds = section(buildWith({ dataciteOutputs, openaireOutputs }), "datasets")!;
    expect(ds.items).toHaveLength(3); // DataCite X + oa::1 + oa::3 (oa::2 deduped out)
    const sources = ds.items.map((i) => i.source);
    expect(sources.filter((s) => s === "openaire")).toHaveLength(2);
    expect(sources.filter((s) => s === "datacite")).toHaveLength(1);
    expect(ds.items.find((i) => i.id === "dataset:openaire:oa-1")!.meta.doi).toBe(
      "10.5281/zenodo.1",
    );
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
      {
        doi: "10.35802/1",
        award: "GR-1",
        title: "CR grant",
        funderName: "Wellcome",
        funderId: "10.13039/x",
        startYear: 2022,
        endYear: 2025,
      },
    ];
    const nationalGrants: FunderGrant[] = [
      {
        source: "ukri",
        externalId: "AH/Y00325X/1",
        title: "UKRI grant",
        funder: "AHRC",
        org: "Univ",
        startYear: 2024,
        endYear: 2026,
      },
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
      {
        source: "clinicaltrials",
        registryId: "NCT123",
        title: "A trial",
        sponsor: "Acme",
        phase: "PHASE2",
        role: "PRINCIPAL_INVESTIGATOR",
        org: "Univ",
        startYear: 2020,
        endYear: 2022,
      },
      { source: "clinicaltrials", registryId: "NCT999", title: "Sponsorless trial" }, // no sponsor/phase/years
      {
        source: "ctis",
        registryId: "2022-500001-30-00",
        title: "An EU trial",
        sponsor: "Columbia University",
        role: "INVESTIGATOR",
        org: "Columbia University",
        startYear: 2022,
      },
    ];
    const cv = buildWith({ clinicalTrials });
    const trials = section(cv, "clinical-trials")!;
    const t = trials.items.find((i) => i.id === "trial:clinicaltrials:NCT123")!;
    expect(t.source).toBe("clinicaltrials");
    expect(t.included).toBe(false);
    expect(t.meta.reviewFlag).toBe("name-matched");
    expect(t.meta.type).toBe("PHASE2");
    expect(t.displayText).toContain("NCT123");
    // The EU CTIS trial keeps its own source + id.
    const eu = trials.items.find((i) => i.id === "trial:ctis:2022-500001-30-00")!;
    expect(eu.source).toBe("ctis");
    expect(eu.included).toBe(false);
    expect(cv.provenance.sources).toContain("clinicaltrials");
    expect(cv.provenance.sources).toContain("ctis");
  });

  it("builds a Patents section from EPO records (hidden review candidates)", () => {
    const patents: PatentRecord[] = [
      {
        source: "epo",
        publicationNumber: "EP1234567",
        title: "A device",
        applicants: ["University of York"],
        inventors: ["Helen Smith"],
        year: 2021,
      },
      {
        source: "epo",
        publicationNumber: "EP7654321B1",
        title: "Untitled-year patent",
        applicants: [],
        inventors: ["Helen Smith"],
      }, // no applicant, no year
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
      {
        source: "nih",
        externalId: "5R01-1",
        title: "NIH grant",
        funder: "NIGMS",
        org: "JHU",
        startYear: 2021,
      },
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
  it("indexes OpenAlex awards by lower-cased award number (first wins)", () => {
    const ws = [
      {
        id: "https://openalex.org/W1",
        awards: [
          {
            funder_id: "https://openalex.org/F1",
            funder_display_name: "Funder One",
            funder_award_id: "AB-1",
          },
          // Duplicate award number → the first entry is kept.
          {
            funder_id: "https://openalex.org/F2",
            funder_display_name: "Funder Two",
            funder_award_id: "ab-1",
          },
          // No award id → skipped (can't be keyed).
          { funder_id: "https://openalex.org/F3", funder_award_id: null },
        ],
      },
      // A work with no awards array at all.
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
      awards: [
        {
          funder_id: "https://openalex.org/F1",
          funder_display_name: "OA Funder",
          funder_award_id: "AB-1",
        },
      ],
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

describe("ORCID-discovered review candidates", () => {
  /** A minimal OpenAlex work (published article unless `type`/no-venue says else). */
  function discWork(
    shortId: string,
    bareDoi: string,
    over: { type?: string; venue?: string | null } = {},
  ): OpenAlexWork {
    return {
      id: `https://openalex.org/${shortId}`,
      doi: `https://doi.org/${bareDoi}`,
      title: `Work ${shortId}`,
      display_name: `Work ${shortId}`,
      publication_year: 2022,
      type: over.type ?? "article",
      authorships: [],
      primary_location:
        over.venue === null
          ? null
          : { source: { display_name: over.venue ?? "J. Test", type: "journal" } },
    } as unknown as OpenAlexWork;
  }

  const pubItems = (cv: ReturnType<typeof build>) =>
    cv.sections.find((s) => s.type === "publications")?.items ?? [];
  const find = (cv: ReturnType<typeof build>, id: string) =>
    cv.sections.flatMap((s) => s.items).find((i) => i.id === id);

  it("adds a discovered work as a hidden 'orcid-doi' review candidate", () => {
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [],
      orcidDiscoveredWorks: [discWork("W900", "10.9/a")],
      now: "2026-06-02T00:00:00.000Z",
    });
    const cand = find(cv, "W900")!;
    expect(cand.included).toBe(false);
    expect(cand.notMine).toBe(false);
    expect(cand.source).toBe("openalex");
    expect(cand.meta.reviewFlag).toBe("orcid-doi");
    expect(cand.csl?.DOI).toBe("10.9/a");
    expect(pubItems(cv).map((i) => i.id)).toContain("W900");
  });

  it("routes a discovered preprint to the Preprints section", () => {
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [],
      orcidDiscoveredWorks: [discWork("W901", "10.9/b", { type: "preprint" })],
      now: "2026-06-02T00:00:00.000Z",
    });
    const pre = cv.sections.find((s) => s.type === "preprints");
    expect(pre?.items.find((i) => i.id === "W901")?.meta.reviewFlag).toBe("orcid-doi");
    expect(pubItems(cv).find((i) => i.id === "W901")).toBeUndefined();
  });

  it("skips a discovered work the primary author pull already returned (attributed wins)", () => {
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [discWork("W902", "10.9/c")], // attributed via author id
      orcidDiscoveredWorks: [discWork("W902b", "10.9/c")], // same DOI, different id
      now: "2026-06-02T00:00:00.000Z",
    });
    const ids = pubItems(cv).map((i) => i.id);
    expect(ids).toContain("W902");
    expect(ids).not.toContain("W902b");
    expect(find(cv, "W902")!.meta.reviewFlag).toBeUndefined(); // a normal included work
    expect(find(cv, "W902")!.included).toBe(true);
  });

  it("persists a discovered candidate across re-sync when discovery returns nothing", () => {
    const first = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [],
      orcidDiscoveredWorks: [discWork("W903", "10.9/d")],
      now: "2026-06-02T00:00:00.000Z",
    });
    const second = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [],
      orcidDiscoveredWorks: [], // ORCID hiccup — nothing discovered this sync
      now: "2026-07-01T00:00:00.000Z",
      previous: first,
    });
    const cand = find(second, "W903");
    expect(cand?.included).toBe(false);
    expect(cand?.meta.reviewFlag).toBe("orcid-doi");
  });

  it("does not rebuild a candidate already in the CV (no duplication)", () => {
    const first = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [],
      orcidDiscoveredWorks: [discWork("W904", "10.9/e")],
      now: "2026-06-02T00:00:00.000Z",
    });
    const second = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [],
      orcidDiscoveredWorks: [discWork("W904", "10.9/e")], // same one re-offered
      now: "2026-07-01T00:00:00.000Z",
      previous: first,
    });
    expect(pubItems(second).filter((i) => i.id === "W904")).toHaveLength(1);
  });

  it("does not resurface an unconfirmed (hidden) candidate when OpenAlex later attributes it", () => {
    const first = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [],
      orcidDiscoveredWorks: [discWork("W905", "10.9/f")],
      now: "2026-06-02T00:00:00.000Z",
    });
    const second = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [discWork("W905", "10.9/f")], // now attributed via author id
      orcidDiscoveredWorks: [],
      now: "2026-07-01T00:00:00.000Z",
      previous: first,
    });
    const items = pubItems(second).filter((i) => i.id === "W905");
    expect(items).toHaveLength(1); // not double-listed
    expect(items[0]!.included).toBe(false); // stays as the user left it (hidden)
    // The "orcid-doi" flag is dropped: it's now a normal (if hidden) attributed work.
    expect(items[0]!.meta.reviewFlag).toBeUndefined();
  });

  it("keeps an explicit 'not mine' on a candidate after attribution", () => {
    const first = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [],
      orcidDiscoveredWorks: [discWork("W906", "10.9/g")],
      now: "2026-06-02T00:00:00.000Z",
    });
    const asserted = {
      ...first,
      sections: first.sections.map((s) => ({
        ...s,
        items: s.items.map((it) =>
          it.id === "W906"
            ? { ...it, notMine: true, notMineAssertedAt: "2026-06-03T00:00:00.000Z" }
            : it,
        ),
      })),
    };
    const second = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [discWork("W906", "10.9/g")],
      orcidDiscoveredWorks: [],
      now: "2026-07-01T00:00:00.000Z",
      previous: asserted,
    });
    const item = find(second, "W906")!;
    expect(item.notMine).toBe(true);
    expect(item.included).toBe(false); // not resurfaced
  });

  it("keeps a confirmed (shown) candidate included after attribution", () => {
    const first = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [],
      orcidDiscoveredWorks: [discWork("W907", "10.9/h")],
      now: "2026-06-02T00:00:00.000Z",
    });
    const confirmed = {
      ...first,
      sections: first.sections.map((s) => ({
        ...s,
        items: s.items.map((it) => (it.id === "W907" ? { ...it, included: true } : it)),
      })),
    };
    const second = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [discWork("W907", "10.9/h")],
      orcidDiscoveredWorks: [],
      now: "2026-07-01T00:00:00.000Z",
      previous: confirmed,
    });
    expect(find(second, "W907")!.included).toBe(true);
  });
});

describe("orcidTypeClass", () => {
  it("classifies publication / preprint / other-output, else undefined", () => {
    // Publications (incl. conference-paper).
    for (const t of ["journal-article", "conference-paper", "book-chapter", "report", "manual"]) {
      expect(orcidTypeClass(t)).toBe("publication");
    }
    // Preprints / working papers.
    expect(orcidTypeClass("preprint")).toBe("preprint");
    expect(orcidTypeClass("working-paper")).toBe("preprint");
    // Datasets / software → routed to "Datasets & Software".
    for (const t of [
      "data-set",
      "software",
      "research-tool",
      "data-management-plan",
      "physical-object",
    ]) {
      expect(orcidTypeClass(t)).toBe("dataset");
    }
    // Other non-publication outputs → routed to "Other Research Outputs".
    for (const t of ["conference-poster", "conference-abstract", "lecture-speech", "website"]) {
      expect(orcidTypeClass(t)).toBe("other-output");
    }
    // Case/whitespace-insensitive.
    expect(orcidTypeClass("  Journal-Article ")).toBe("publication");
    // No usable signal.
    expect(orcidTypeClass(undefined)).toBeUndefined();
    expect(orcidTypeClass("")).toBeUndefined();
    expect(orcidTypeClass("some-future-type")).toBeUndefined();
  });
});

describe("buildCanonicalCv — ORCID work-type section routing", () => {
  /** A work with a DOI but NO published venue, so `isPreprint` flags it. */
  function venuelessWork(shortId: string, bareDoi: string): OpenAlexWork {
    return {
      id: `https://openalex.org/${shortId}`,
      doi: `https://doi.org/${bareDoi}`,
      title: `Work ${shortId}`,
      display_name: `Work ${shortId}`,
      publication_year: 2024,
      type: "article",
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
      // No primary_location.source.display_name → isPreprint() === true.
      primary_location: null,
    } as unknown as OpenAlexWork;
  }
  const sectionOf = (cv: ReturnType<typeof build>, type: string) =>
    cv.sections.find((s) => s.type === type);
  const itemIn = (cv: ReturnType<typeof build>, type: string, id: string) =>
    sectionOf(cv, type)?.items.find((i) => i.id === id);

  it("rescues a venue-less work ORCID types as a journal-article into Publications", () => {
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [venuelessWork("WPUB", "10.7/rescue")],
      orcidWorkTypes: { "10.7/rescue": "journal-article" },
      now: "2026-06-02T00:00:00.000Z",
    });
    const item = itemIn(cv, "publications", "WPUB")!;
    expect(item).toBeDefined();
    expect(item.meta.peerReviewed).toBe(true); // forced consistent with a publication
    // NOT in Preprints (and there is no Preprints section since it was the only work).
    expect(sectionOf(cv, "preprints")).toBeUndefined();
  });

  it("keeps a non-journal publication type's source peerReviewed (book-chapter)", () => {
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [venuelessWork("WBC", "10.7/chapter")],
      orcidWorkTypes: { "10.7/chapter": "book-chapter" },
      now: "2026-06-02T00:00:00.000Z",
    });
    const item = itemIn(cv, "publications", "WBC")!;
    expect(item).toBeDefined();
    // Not forced true — a venue-less book-chapter keeps isPeerReviewed() === false.
    expect(item.meta.peerReviewed).toBe(false);
  });

  it("pulls a poster/lecture out of Preprints into Other Research Outputs (peerReviewed:false)", () => {
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [venuelessWork("WPOS", "10.7/poster")],
      orcidWorkTypes: { "10.7/poster": "lecture-speech" },
      now: "2026-06-02T00:00:00.000Z",
    });
    const other = sectionOf(cv, "other")!;
    // Heading is the localized DEFAULT for `other` (so it isn't stuck in English
    // on a non-English CV) — not a fixed "Other Research Outputs" string.
    expect(other.title).toBe(sectionTitle(cv.display.locale, "other"));
    expect(other.items.find((i) => i.id === "WPOS")?.meta.peerReviewed).toBe(false);
    // Not mis-filed as a preprint.
    expect(sectionOf(cv, "preprints")).toBeUndefined();
    expect(itemIn(cv, "publications", "WPOS")).toBeUndefined();
  });

  it("drops an ORCID 'data-set' output whose DOI is also a Datasets item (no double-list)", () => {
    const dupDoi = "10.5281/zenodo.dup";
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [venuelessWork("WDATA", dupDoi)],
      orcidWorkTypes: { [dupDoi]: "data-set" },
      dataciteOutputs: [
        {
          doi: dupDoi,
          title: "The dataset",
          type: "Dataset",
          year: 2024,
          publisher: "Zenodo",
        },
      ] as unknown as DataciteOutput[],
      now: "2026-06-02T00:00:00.000Z",
    });
    // The DataCite copy is in Datasets; the work-item is dropped from Other.
    const ds = sectionOf(cv, "datasets")!;
    expect(ds.items.some((i) => i.meta.doi?.toLowerCase() === dupDoi)).toBe(true);
    expect(sectionOf(cv, "other")).toBeUndefined(); // nothing left → no Other section
    expect(cv.sections.flatMap((s) => s.items).filter((i) => i.id === "WDATA")).toHaveLength(0);
  });

  it("keeps an ORCID 'preprint' in Preprints (unchanged)", () => {
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [venuelessWork("WPRE", "10.7/pre")],
      orcidWorkTypes: { "10.7/pre": "preprint" },
      now: "2026-06-02T00:00:00.000Z",
    });
    expect(itemIn(cv, "preprints", "WPRE")).toBeDefined();
    expect(sectionOf(cv, "other")).toBeUndefined();
  });

  it("leaves routing UNCHANGED when there is no ORCID type for the DOI (regression guard)", () => {
    // Same venue-less work, but no orcidWorkTypes entry → isPreprint() decides.
    const withType = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [venuelessWork("WNONE", "10.7/none")],
      now: "2026-06-02T00:00:00.000Z",
    });
    // Falls to Preprints exactly as today (venue-less → isPreprint true).
    expect(itemIn(withType, "preprints", "WNONE")).toBeDefined();
    expect(sectionOf(withType, "other")).toBeUndefined();
    expect(itemIn(withType, "publications", "WNONE")).toBeUndefined();
  });

  it("routes an ORCID-DISCOVERED poster into Other but keeps it a hidden 'orcid-doi' candidate", () => {
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [],
      orcidDiscoveredWorks: [venuelessWork("WDISC", "10.7/disc")],
      orcidWorkTypes: { "10.7/disc": "conference-poster" },
      now: "2026-06-02T00:00:00.000Z",
    });
    const item = itemIn(cv, "other", "WDISC")!;
    expect(item).toBeDefined();
    expect(item.included).toBe(false); // stays a hidden review candidate
    expect(item.meta.reviewFlag).toBe("orcid-doi"); // flag unchanged by routing
    expect(item.meta.peerReviewed).toBe(false);
  });

  it("preserves a user-hidden Datasets & Software item across re-sync", () => {
    const first = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [venuelessWork("WKEEP", "10.7/keep")],
      orcidWorkTypes: { "10.7/keep": "data-set" },
      now: "2026-06-02T00:00:00.000Z",
    });
    // User hides the Datasets & Software item.
    const curated = {
      ...first,
      sections: first.sections.map((s) =>
        s.type === "datasets"
          ? { ...s, items: s.items.map((it) => ({ ...it, included: false })) }
          : s,
      ),
    };
    const resynced = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [venuelessWork("WKEEP", "10.7/keep")],
      orcidWorkTypes: { "10.7/keep": "data-set" },
      now: "2026-07-01T00:00:00.000Z",
      previous: curated,
    });
    expect(itemIn(resynced, "datasets", "WKEEP")?.included).toBe(false); // hide survives
  });
});

describe("openalexTypeClass", () => {
  it("routes OpenAlex dataset → dataset, supplementary-materials → other-output, else undefined", () => {
    expect(openalexTypeClass({ type: "dataset" } as OpenAlexWork)).toBe("dataset");
    // Case/whitespace-insensitive.
    expect(openalexTypeClass({ type: " Dataset " } as OpenAlexWork)).toBe("dataset");
    expect(openalexTypeClass({ type: "supplementary-materials" } as OpenAlexWork)).toBe(
      "other-output",
    );
    // Article-like and preprints carry no non-article signal (must NOT leave their bucket).
    for (const t of ["article", "journal-article", "preprint", "posted-content", "other"]) {
      expect(openalexTypeClass({ type: t } as OpenAlexWork)).toBeUndefined();
    }
    expect(openalexTypeClass({} as OpenAlexWork)).toBeUndefined();
    expect(openalexTypeClass({ type: "" } as OpenAlexWork)).toBeUndefined();
  });

  it("treats a repository-hosted 'other' work as other-output (Zenodo deposit), not a venue 'other'", () => {
    // OpenAlex types a Zenodo software deposit as `other` on a `repository` source.
    const repoOther = {
      type: "other",
      primary_location: { source: { type: "repository", display_name: "Zenodo" } },
    } as unknown as OpenAlexWork;
    expect(openalexTypeClass(repoOther)).toBe("other-output");
    // "other" with a real venue (e.g. a journal) is miscellany — left untouched so it
    // doesn't get pulled out of Publications.
    const venueOther = {
      type: "other",
      primary_location: { source: { type: "journal", display_name: "Some Journal" } },
    } as unknown as OpenAlexWork;
    expect(openalexTypeClass(venueOther)).toBeUndefined();
    // A repository PREPRINT (arXiv/bioRxiv) is typed "preprint", not "other" → untouched.
    const repoPreprint = {
      type: "preprint",
      primary_location: { source: { type: "repository", display_name: "arXiv" } },
    } as unknown as OpenAlexWork;
    expect(openalexTypeClass(repoPreprint)).toBeUndefined();
  });
});

describe("buildCanonicalCv — OpenAlex dataset/software routing & dedup", () => {
  /** A venue-less work (so `isPreprint` flags it) with a chosen OpenAlex `type`. */
  function typedWork(shortId: string, bareDoi: string, type: string): OpenAlexWork {
    return {
      id: `https://openalex.org/${shortId}`,
      doi: `https://doi.org/${bareDoi}`,
      title: `Work ${shortId}`,
      display_name: `Work ${shortId}`,
      publication_year: 2026,
      type,
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
      // Zenodo is a repository in OpenAlex; here we simulate the venue-less case
      // (no source.display_name) so isPreprint() === true without the fix.
      primary_location: null,
    } as unknown as OpenAlexWork;
  }
  const sectionOf = (cv: ReturnType<typeof build>, type: string) =>
    cv.sections.find((s) => s.type === type);
  const itemIn = (cv: ReturnType<typeof build>, type: string, id: string) =>
    sectionOf(cv, type)?.items.find((i) => i.id === id);
  const allItemsWithId = (cv: ReturnType<typeof build>, id: string) =>
    cv.sections.flatMap((s) => s.items).filter((i) => i.id === id);

  it("routes an OpenAlex dataset/software work into Datasets & Software (CSL item), not Preprints", () => {
    // A CRAN R package (or any software) OpenAlex types `dataset`, with no DataCite
    // record — it must land in Datasets & Software as a citeproc-rendered work item.
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [typedWork("WSOFT", "10.32614/cran.package.example", "dataset")],
      now: "2026-06-02T00:00:00.000Z",
    });
    const ds = sectionOf(cv, "datasets")!;
    const item = ds.items.find((i) => i.id === "WSOFT")!;
    expect(item).toBeDefined();
    expect(item.csl).toBeDefined(); // a CSL work item, rendered via citeproc
    expect(item.meta.peerReviewed).toBe(false);
    expect(sectionOf(cv, "preprints")).toBeUndefined();
    expect(sectionOf(cv, "other")).toBeUndefined();
    expect(itemIn(cv, "publications", "WSOFT")).toBeUndefined();
  });

  it("leaves a genuine OpenAlex preprint in Preprints (type-gated, not repository-gated)", () => {
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [typedWork("WPRE2", "10.7/pre2", "preprint")],
      now: "2026-06-02T00:00:00.000Z",
    });
    expect(itemIn(cv, "preprints", "WPRE2")).toBeDefined();
    expect(sectionOf(cv, "other")).toBeUndefined();
  });

  it("lets an ORCID publication type override the OpenAlex dataset type (→ Publications)", () => {
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [typedWork("WOV", "10.7/ov", "dataset")],
      orcidWorkTypes: { "10.7/ov": "journal-article" },
      now: "2026-06-02T00:00:00.000Z",
    });
    expect(itemIn(cv, "publications", "WOV")).toBeDefined();
    expect(sectionOf(cv, "other")).toBeUndefined();
    expect(sectionOf(cv, "preprints")).toBeUndefined();
  });

  it("drops the OpenAlex copy of a Zenodo deposit already in Datasets via a concept↔version DOI sibling", () => {
    const conceptDoi = "10.5281/zenodo.concept";
    const versionDoi = "10.5281/zenodo.version";
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      // OpenAlex indexed the VERSION DOI and (Zenodo = repository) would mis-file it.
      works: [typedWork("WZEN", versionDoi, "dataset")],
      dataciteOutputs: [
        {
          doi: conceptDoi,
          title: "SigmaCV",
          type: "Software",
          year: 2026,
          publisher: "Zenodo",
          relatedDois: [versionDoi],
        },
      ] as unknown as DataciteOutput[],
      now: "2026-06-02T00:00:00.000Z",
    });
    const ds = sectionOf(cv, "datasets")!;
    expect(ds.items.some((i) => i.meta.doi?.toLowerCase() === conceptDoi)).toBe(true);
    // The OpenAlex duplicate is DROPPED from every works section (not just relocated).
    expect(allItemsWithId(cv, "WZEN")).toHaveLength(0);
    expect(sectionOf(cv, "preprints")).toBeUndefined();
    expect(sectionOf(cv, "other")).toBeUndefined();
  });

  it("drops an OpenAlex dataset work whose own DOI matches a DataCite Datasets item", () => {
    const doi = "10.5281/zenodo.same";
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [typedWork("WSAME", doi, "dataset")],
      dataciteOutputs: [
        { doi, title: "Same", type: "Software", year: 2026, publisher: "Zenodo" },
      ] as unknown as DataciteOutput[],
      now: "2026-06-02T00:00:00.000Z",
    });
    expect(allItemsWithId(cv, "WSAME")).toHaveLength(0);
    expect(sectionOf(cv, "datasets")?.items.some((i) => i.meta.doi?.toLowerCase() === doi)).toBe(
      true,
    );
  });

  it("drops an OpenAlex dataset work whose DOI matches an OpenAIRE output", () => {
    const doi = "10.5281/zenodo.oa";
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [typedWork("WOA", doi, "dataset")],
      openaireOutputs: [
        { openaireId: "oai::1", title: "OA soft", type: "software", doi, year: 2026 },
      ] as unknown as OpenaireOutput[],
      now: "2026-06-02T00:00:00.000Z",
    });
    expect(allItemsWithId(cv, "WOA")).toHaveLength(0);
  });

  it("preserves a user-hidden OpenAlex dataset (Datasets & Software) item across re-sync", () => {
    const first = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [typedWork("WH", "10.7/h-data", "dataset")],
      now: "2026-06-02T00:00:00.000Z",
    });
    const curated = {
      ...first,
      sections: first.sections.map((s) =>
        s.type === "datasets"
          ? { ...s, items: s.items.map((it) => ({ ...it, included: false })) }
          : s,
      ),
    };
    const resynced = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [typedWork("WH", "10.7/h-data", "dataset")],
      now: "2026-07-01T00:00:00.000Z",
      previous: curated,
    });
    expect(itemIn(resynced, "datasets", "WH")?.included).toBe(false); // hide survives
  });

  it("routes an ORCID-typed software work into Datasets & Software (over the OpenAlex type)", () => {
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [typedWork("WORCSW", "10.7/orcid-sw", "article")], // OpenAlex type overridden by ORCID
      orcidWorkTypes: { "10.7/orcid-sw": "software" },
      now: "2026-06-02T00:00:00.000Z",
    });
    const item = itemIn(cv, "datasets", "WORCSW")!;
    expect(item).toBeDefined();
    expect(item.csl).toBeDefined();
    expect(item.meta.peerReviewed).toBe(false);
    expect(sectionOf(cv, "other")).toBeUndefined();
    expect(itemIn(cv, "publications", "WORCSW")).toBeUndefined();
  });

  it("merges DataCite entries and OpenAlex dataset works in one Datasets & Software section", () => {
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [typedWork("WCRAN", "10.32614/cran.package.x", "dataset")],
      dataciteOutputs: [
        {
          doi: "10.5281/zenodo.ds1",
          title: "A dataset",
          type: "Dataset",
          year: 2025,
          publisher: "Zenodo",
        },
      ] as unknown as DataciteOutput[],
      now: "2026-06-02T00:00:00.000Z",
    });
    const ds = sectionOf(cv, "datasets")!;
    // DataCite entry (displayText, no csl) + OpenAlex work (csl) coexist.
    expect(ds.items.some((i) => i.meta.doi?.toLowerCase() === "10.5281/zenodo.ds1" && !i.csl)).toBe(
      true,
    );
    expect(ds.items.some((i) => i.id === "WCRAN" && i.csl)).toBe(true);
    expect(ds.items).toHaveLength(2);
  });

  it("routes a repository-hosted OpenAlex 'other' deposit out of Preprints (no DataCite match)", () => {
    // OpenAlex types a Zenodo software deposit `other` on a `repository` source. When
    // DataCite hasn't indexed it (so it can't be deduped into Datasets & Software), it
    // must still leave Preprints for Other Research Outputs.
    const repoOther = {
      ...typedWork("WRO", "10.5281/zenodo.norient", "other"),
      primary_location: { source: { type: "repository", display_name: "Zenodo" } },
    } as unknown as OpenAlexWork;
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [repoOther],
      now: "2026-06-02T00:00:00.000Z",
    });
    expect(itemIn(cv, "other", "WRO")).toBeDefined();
    expect(sectionOf(cv, "preprints")).toBeUndefined();
    expect(itemIn(cv, "publications", "WRO")).toBeUndefined();
  });

  it("collapses Zenodo concept↔version DataCite siblings into one Datasets & Software entry", () => {
    const concept = "10.5281/zenodo.concept2";
    const version = "10.5281/zenodo.version2";
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      // OpenAlex indexed BOTH the concept and version DOIs (typed `other`).
      works: [typedWork("WC", concept, "other"), typedWork("WV", version, "other")],
      // DataCite returns both sibling records (concept self-refs; version → concept).
      dataciteOutputs: [
        {
          doi: concept,
          title: "SigmaCV",
          type: "Software",
          year: 2026,
          publisher: "Zenodo",
          relatedDois: [concept],
        },
        {
          doi: version,
          title: "SigmaCV",
          type: "Software",
          year: 2026,
          publisher: "Zenodo",
          relatedDois: [concept],
        },
      ] as unknown as DataciteOutput[],
      now: "2026-06-02T00:00:00.000Z",
    });
    const ds = sectionOf(cv, "datasets")!;
    // ONE entry per deposit (the concept DOI), not the concept AND the version.
    expect(ds.items).toHaveLength(1);
    expect(ds.items[0]?.meta.doi?.toLowerCase()).toBe(concept);
    // Both OpenAlex copies (concept + version) are dropped — nothing in Preprints/Other.
    expect(allItemsWithId(cv, "WC")).toHaveLength(0);
    expect(allItemsWithId(cv, "WV")).toHaveLength(0);
    expect(sectionOf(cv, "preprints")).toBeUndefined();
    expect(sectionOf(cv, "other")).toBeUndefined();
  });

  it("keeps the newest version when sibling records share a concept that's absent", () => {
    // Two versions of one deposit, neither being the concept record (concept DOI not
    // returned) → collapse to the NEWEST by year.
    const cv = buildCanonicalCv({
      id: "cv",
      resolved,
      works: [],
      dataciteOutputs: [
        {
          doi: "10.5281/zenodo.v1",
          title: "Thing",
          type: "Dataset",
          year: 2024,
          publisher: "Zenodo",
          relatedDois: ["10.5281/zenodo.cpt"],
        },
        {
          doi: "10.5281/zenodo.v2",
          title: "Thing",
          type: "Dataset",
          year: 2026,
          publisher: "Zenodo",
          relatedDois: ["10.5281/zenodo.cpt"],
        },
      ] as unknown as DataciteOutput[],
      now: "2026-06-02T00:00:00.000Z",
    });
    const ds = sectionOf(cv, "datasets")!;
    expect(ds.items).toHaveLength(1);
    expect(ds.items[0]?.meta.doi?.toLowerCase()).toBe("10.5281/zenodo.v2");
  });
});
