import { beforeEach, describe, expect, it, vi } from "vitest";

// syncCvForUser reads OPENALEX_MAILTO (for Crossref's polite pool). Provide the
// minimal valid env so getEnv() doesn't throw; ORCID/DataCite/enrich are mocked
// below so no real network is attempted.
Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
});

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findMany: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  fetchWorks: vi.fn(),
  resolveAuthor: vi.fn(),
  fetchEditorial: vi.fn(),
  logCvSave: vi.fn(),
  canonicalizeInstitutions: vi.fn(),
  enrichCvWithCrossref: vi.fn(),
  enrichCvWithIcite: vi.fn(),
  fetchPeerReviews: vi.fn(),
  fetchJournalNames: vi.fn(),
  fetchOpenaire: vi.fn(),
  fetchDblp: vi.fn(),
  fetchCrossrefGrants: vi.fn(),
  fetchWikidata: vi.fn(),
  fetchUkri: vi.fn(),
  fetchNih: vi.fn(),
  fetchNsf: vi.fn(),
  fetchClinicalTrials: vi.fn(),
  fetchCtis: vi.fn(),
  fetchIctrp: vi.fn(),
  fetchEpo: vi.fn(),
  discoverOrcid: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    cv: {
      findUnique: mocks.findUnique,
      findMany: mocks.findMany,
      upsert: mocks.upsert,
      update: mocks.update,
    },
  },
}));
vi.mock("@/lib/openalex/client", () => ({
  fetchWorksByAuthorIds: mocks.fetchWorks,
  fetchJournalNamesByIssn: mocks.fetchJournalNames,
}));
vi.mock("@/lib/openalex/resolveAuthor", () => ({ resolveAuthorByOrcid: mocks.resolveAuthor }));
vi.mock("@/lib/oep/client", () => ({ fetchEditorialRoles: mocks.fetchEditorial }));
vi.mock("@/lib/research/log", () => ({ logCvSave: mocks.logCvSave }));
// ORCID + DataCite clients have their own tests; stub them to [] so this
// orchestration test makes no network calls.
vi.mock("@/lib/orcid/client", () => ({
  fetchOrcidPositions: vi.fn(async () => []),
  fetchOrcidFundings: vi.fn(async () => []),
  fetchOrcidInvitedPositions: vi.fn(async () => []),
  fetchOrcidEducation: vi.fn(async () => []),
  fetchOrcidDistinctions: vi.fn(async () => []),
  fetchOrcidService: vi.fn(async () => []),
  fetchOrcidPeerReviews: mocks.fetchPeerReviews,
}));
vi.mock("@/lib/datacite/client", () => ({ fetchDataciteOutputs: vi.fn(async () => []) }));
// New external-source clients have their own tests; stub them here so this
// orchestration test makes no network calls. Controllable via the hoisted mocks.
vi.mock("@/lib/openaire/client", () => ({ fetchOpenaireOutputs: mocks.fetchOpenaire }));
vi.mock("@/lib/dblp/client", () => ({ fetchDblpConferencePapers: mocks.fetchDblp }));
vi.mock("@/lib/crossref/client", () => ({ fetchCrossrefGrantsByOrcid: mocks.fetchCrossrefGrants }));
vi.mock("@/lib/wikidata/client", () => ({ fetchWikidataIdentity: mocks.fetchWikidata }));
vi.mock("@/lib/ukri/client", () => ({ fetchUkriGrants: mocks.fetchUkri }));
vi.mock("@/lib/nih/client", () => ({ fetchNihGrants: mocks.fetchNih }));
vi.mock("@/lib/nsf/client", () => ({ fetchNsfGrants: mocks.fetchNsf }));
vi.mock("@/lib/clinicaltrials/client", () => ({ fetchClinicalTrials: mocks.fetchClinicalTrials }));
vi.mock("@/lib/ctis/client", () => ({ fetchCtisTrials: mocks.fetchCtis }));
vi.mock("@/lib/ictrp/client", () => ({ fetchIctrpTrials: mocks.fetchIctrp }));
vi.mock("@/lib/epo/client", () => ({ fetchEpoPatents: mocks.fetchEpo }));
// ORCID-DOI discovery has its own tests (orcid-discovery.test.ts); stub it here so
// this orchestration test makes no network calls. Controllable via the hoisted mock.
vi.mock("@/lib/cv/orcidDiscovery", () => ({ discoverOrcidOnlyWorks: mocks.discoverOrcid }));
// Enrichment (ROR + Crossref) is covered by enrich.test.ts; keep it a no-op here.
vi.mock("@/lib/canonical/enrich", () => ({
  canonicalizeInstitutions: mocks.canonicalizeInstitutions,
  enrichCvWithCrossref: mocks.enrichCvWithCrossref,
  enrichCvWithIcite: mocks.enrichCvWithIcite,
  withRorProvenance: (cv: unknown) => cv,
}));

import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  CvNotFoundError,
  CvTooLargeError,
  capCvItems,
  cvItemCount,
  getCvForUser,
  getPublicCv,
  getPublicCvForPage,
  getPublishState,
  listIndexablePublicSlugs,
  saveCvForUser,
  setPublishState,
  syncCvForUser,
} from "@/lib/cv/sync";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const RESOLVED = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};
const DOC = buildCanonicalCv({
  id: "cv_1",
  resolved: RESOLVED,
  works,
  now: "2026-06-02T00:00:00.000Z",
});

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  mocks.update.mockResolvedValue({});
  mocks.upsert.mockResolvedValue({});
  mocks.logCvSave.mockResolvedValue(undefined);
  mocks.fetchEditorial.mockResolvedValue([]);
  // Enrichment is a pass-through here (its own behaviour is in enrich.test.ts).
  mocks.canonicalizeInstitutions.mockImplementation(async (input) => ({
    result: input,
    used: false,
  }));
  mocks.enrichCvWithCrossref.mockImplementation(async (cv) => cv);
  mocks.enrichCvWithIcite.mockImplementation(async (cv) => cv);
  mocks.fetchPeerReviews.mockResolvedValue([]);
  mocks.fetchJournalNames.mockResolvedValue(new Map<string, string>());
  mocks.fetchOpenaire.mockResolvedValue([]);
  mocks.fetchDblp.mockResolvedValue([]);
  mocks.fetchCrossrefGrants.mockResolvedValue([]);
  mocks.fetchWikidata.mockResolvedValue(null);
  mocks.fetchUkri.mockResolvedValue([]);
  mocks.fetchNih.mockResolvedValue([]);
  mocks.fetchNsf.mockResolvedValue([]);
  mocks.fetchClinicalTrials.mockResolvedValue([]);
  mocks.fetchCtis.mockResolvedValue([]);
  mocks.fetchIctrp.mockResolvedValue([]);
  mocks.fetchEpo.mockResolvedValue([]);
  mocks.discoverOrcid.mockResolvedValue([]);
});

describe("getCvForUser", () => {
  it("returns the parsed CV", async () => {
    mocks.findUnique.mockResolvedValue({ document: DOC });
    const cv = await getCvForUser("u1");
    expect(cv?.owner.orcid).toBe("0000-0002-7483-2489");
  });
  it("returns null when absent", async () => {
    mocks.findUnique.mockResolvedValue(null);
    expect(await getCvForUser("u1")).toBeNull();
  });
  it("returns null (and logs) for a corrupt document", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.findUnique.mockResolvedValue({ document: { nope: true } });
    expect(await getCvForUser("u1")).toBeNull();
  });
});

describe("syncCvForUser", () => {
  it("resolves, pulls works + editorial, builds, and upserts", async () => {
    mocks.findUnique.mockResolvedValue(null); // no existing row
    mocks.resolveAuthor.mockResolvedValue(RESOLVED);
    mocks.fetchWorks.mockResolvedValue(works);
    const cv = await syncCvForUser({ userId: "u1", orcid: RESOLVED.orcid });
    expect(cv.sections[0]!.type).toBe("publications");
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    expect(mocks.fetchEditorial).toHaveBeenCalled();
  });

  it("labels peer reviews by resolved journal name, not the publisher", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.resolveAuthor.mockResolvedValue(RESOLVED);
    mocks.fetchWorks.mockResolvedValue([]);
    mocks.fetchPeerReviews.mockResolvedValue([
      { issn: "1471-2415", organization: "Springer Nature", count: 2 },
    ]);
    mocks.fetchJournalNames.mockResolvedValue(new Map([["1471-2415", "BMC Ophthalmology"]]));
    const cv = await syncCvForUser({ userId: "u1", orcid: RESOLVED.orcid });
    expect(mocks.fetchJournalNames).toHaveBeenCalledWith(["1471-2415"]);
    const pr = cv.sections.find((s) => s.type === "peer-review");
    expect(pr?.items[0]?.displayText).toBe("BMC Ophthalmology — 2 reviews");
  });

  it("keeps the publisher fallback for a peer review with no ISSN, without mutating the source", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.resolveAuthor.mockResolvedValue(RESOLVED);
    mocks.fetchWorks.mockResolvedValue([]);
    const groups = [
      { issn: "1471-2415", organization: "Springer Nature", count: 2 },
      { organization: "Some Society", count: 1 }, // no ISSN → the no-issn remap branch
    ];
    mocks.fetchPeerReviews.mockResolvedValue(groups);
    mocks.fetchJournalNames.mockResolvedValue(new Map([["1471-2415", "BMC Ophthalmology"]]));
    const cv = await syncCvForUser({ userId: "u1", orcid: RESOLVED.orcid });
    expect(mocks.fetchJournalNames).toHaveBeenCalledWith(["1471-2415"]);
    const texts =
      cv.sections.find((s) => s.type === "peer-review")?.items.map((i) => i.displayText) ?? [];
    expect(texts.some((t) => t?.includes("BMC Ophthalmology"))).toBe(true); // ISSN resolved
    expect(texts.some((t) => t?.includes("Some Society"))).toBe(true); // publisher fallback kept
    // The ORCID client's array was remapped immutably — the original is untouched.
    expect((groups[0] as { journal?: string }).journal).toBeUndefined();
  });

  it("feeds ORCID-discovered works in as hidden review candidates", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.resolveAuthor.mockResolvedValue(RESOLVED);
    mocks.fetchWorks.mockResolvedValue([]);
    mocks.discoverOrcid.mockResolvedValue([
      {
        id: "https://openalex.org/W9000001",
        doi: "https://doi.org/10.9/orphan",
        title: "An ORCID-listed paper OpenAlex missed",
        display_name: "An ORCID-listed paper OpenAlex missed",
        publication_year: 2022,
        type: "article",
        authorships: [],
        primary_location: { source: { display_name: "J. Orphans", type: "journal" } },
      },
    ]);
    const cv = await syncCvForUser({ userId: "u1", orcid: RESOLVED.orcid });
    // Discovery was queried with the freshly-pulled works + the (absent) previous CV.
    expect(mocks.discoverOrcid).toHaveBeenCalledWith({
      orcid: RESOLVED.orcid,
      openAlexWorks: [],
      previous: null,
    });
    const pubs = cv.sections.find((s) => s.type === "publications");
    const cand = pubs?.items.find((i) => i.id === "W9000001");
    expect(cand?.included).toBe(false);
    expect(cand?.meta.reviewFlag).toBe("orcid-doi");
  });

  it("builds an empty CV when the ORCID resolves to no OpenAlex author", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.resolveAuthor.mockResolvedValue(null);
    const cv = await syncCvForUser({ userId: "u1", orcid: RESOLVED.orcid, fallbackName: "X" });
    expect(cv.owner.displayName).toBe("X");
    expect(mocks.fetchWorks).not.toHaveBeenCalled();
  });

  it("wires datasets/conference/grant-candidates/trials, name+org matching, and Wikidata", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.resolveAuthor.mockResolvedValue({
      ...RESOLVED,
      affiliations: [{ institution: "Nagoya University" }],
    });
    mocks.fetchWorks.mockResolvedValue([]);
    mocks.fetchOpenaire.mockResolvedValue([
      { openaireId: "oa::1", title: "A dataset", type: "dataset", year: 2024 },
    ]);
    mocks.fetchDblp.mockResolvedValue([
      { key: "conf/x/1", title: "A paper", venue: "JCDL", year: 2021 },
    ]);
    mocks.fetchNih.mockResolvedValue([
      {
        source: "nih",
        externalId: "5R01",
        title: "NIH grant",
        funder: "NIGMS",
        org: "Nagoya University",
        startYear: 2021,
      },
    ]);
    mocks.fetchClinicalTrials.mockResolvedValue([
      {
        source: "clinicaltrials",
        registryId: "NCT1",
        title: "A trial",
        org: "Nagoya University",
        startYear: 2020,
      },
    ]);
    mocks.fetchEpo.mockResolvedValue([
      {
        source: "epo",
        publicationNumber: "EP1",
        title: "A patent",
        applicants: ["Nagoya University"],
        inventors: ["Basile Chrétien"],
        year: 2023,
      },
    ]);
    mocks.fetchWikidata.mockResolvedValue({
      wikidataUri: "http://www.wikidata.org/entity/Q1",
      sameAs: ["http://www.wikidata.org/entity/Q1", "https://viaf.org/viaf/1"],
      awards: [],
    });

    const cv = await syncCvForUser({ userId: "u1", orcid: RESOLVED.orcid });

    expect(cv.sections.find((s) => s.type === "datasets")).toBeDefined();
    expect(cv.sections.find((s) => s.type === "conference")).toBeDefined();
    // Name+org matched → review candidates, hidden by default.
    expect(cv.sections.find((s) => s.type === "clinical-trials")?.items[0]?.included).toBe(false);
    expect(cv.sections.find((s) => s.type === "patents")?.items[0]?.included).toBe(false);
    expect(mocks.fetchEpo).toHaveBeenCalledWith(
      "Basile Chrétien",
      expect.arrayContaining(["Nagoya University"]),
    );
    const nih = cv.sections.find((s) => s.type === "grants")?.items.find((i) => i.source === "nih");
    expect(nih?.included).toBe(false);
    expect(nih?.meta.reviewFlag).toBe("name-matched");
    // The registries were queried with the display name + an org.
    expect(mocks.fetchNih).toHaveBeenCalledWith(
      "Basile Chrétien",
      expect.arrayContaining(["Nagoya University"]),
    );
    // Wikidata is stored on the owner + recorded in provenance.
    expect(cv.owner.wikidataUri).toBe("http://www.wikidata.org/entity/Q1");
    expect(cv.owner.wikidataSameAs).toContain("https://viaf.org/viaf/1");
    expect(cv.provenance.sources).toContain("wikidata");
  });
});

describe("saveCvForUser", () => {
  it("throws when there is no existing CV row", async () => {
    mocks.findUnique.mockResolvedValue(null);
    await expect(saveCvForUser("u1", DOC)).rejects.toBeInstanceOf(CvNotFoundError);
  });
  it("updates and triggers consent-gated logging", async () => {
    mocks.findUnique.mockResolvedValue({ document: DOC });
    await saveCvForUser("u1", DOC);
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(mocks.logCvSave).toHaveBeenCalledTimes(1);
  });

  it("rejects a save that exceeds the total-item cap, before any DB write", async () => {
    const mkItem = (i: number): CvItem => ({
      id: `i${i}`,
      source: "manual",
      sourceId: "m",
      included: true,
      notMine: false,
      order: i,
      authoredBySelf: false,
      selfNameVariants: [],
      meta: {},
    });
    const bomb = {
      ...DOC,
      sections: [
        {
          id: "publications",
          type: "publications" as const,
          title: "P",
          visible: true,
          order: 0,
          items: Array.from({ length: 10_000 }, (_, i) => mkItem(i)),
        },
        {
          id: "preprints",
          type: "preprints" as const,
          title: "Pre",
          visible: true,
          order: 1,
          items: Array.from({ length: 2_001 }, (_, i) => mkItem(i + 10_000)),
        },
      ],
    };
    expect(cvItemCount(bomb)).toBe(12_001);
    // Each section is within the per-section cap, so Zod parse succeeds — the
    // total-item cap is what rejects it, and it does so before touching the DB.
    mocks.findUnique.mockResolvedValue({ document: DOC });
    await expect(saveCvForUser("u1", bomb)).rejects.toBeInstanceOf(CvTooLargeError);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("capCvItems", () => {
  const mkSection = (id: string, count: number) =>
    ({
      id,
      type: "publications",
      title: id,
      visible: true,
      order: 0,
      items: Array.from({ length: count }, (_, i) => ({ id: `${id}-${i}` })),
    }) as unknown as CanonicalCv["sections"][number];
  const mk = (counts: number[]) =>
    ({ sections: counts.map((c, i) => mkSection(`s${i}`, c)) }) as unknown as CanonicalCv;

  it("returns the same object when already under the cap", () => {
    const cv = mk([3]);
    expect(capCvItems(cv, 10)).toBe(cv);
  });

  it("trims later sections first, preserving section + item order", () => {
    const out = capCvItems(mk([5, 5]), 7);
    expect(out.sections[0]!.items).toHaveLength(5); // first section kept whole
    expect(out.sections[1]!.items).toHaveLength(2); // second trimmed to fill budget
    expect(cvItemCount(out)).toBe(7);
  });

  it("empties sections that fall entirely past the budget", () => {
    const out = capCvItems(mk([10, 5]), 8);
    expect(out.sections[0]!.items).toHaveLength(8);
    expect(out.sections[1]!.items).toHaveLength(0);
    expect(cvItemCount(out)).toBe(8);
  });
});

describe("publish state", () => {
  it("reports defaults when no row exists", async () => {
    mocks.findUnique.mockResolvedValue(null);
    expect(await getPublishState("u1")).toEqual({
      published: false,
      publicSlug: null,
      indexable: false,
    });
  });

  it("mints a slug on first publish", async () => {
    mocks.findUnique.mockResolvedValue({ id: "abcd1234ef", document: DOC, publicSlug: null });
    mocks.update.mockResolvedValue({
      published: true,
      publicSlug: "basile-chretien-abcd1234",
      publicIndexable: false,
    });
    const state = await setPublishState("u1", true);
    expect(state.published).toBe(true);
    expect(state.indexable).toBe(false);
    const slugArg = mocks.update.mock.calls[0]![0].data.publicSlug as string;
    expect(slugArg).toMatch(/^basile-chretien-/);
  });

  it("only allows indexing while published (and clears it on unpublish)", async () => {
    mocks.findUnique.mockResolvedValue({ id: "abcd1234ef", document: DOC, publicSlug: "s" });
    mocks.update.mockResolvedValue({
      published: true,
      publicSlug: "s",
      publicIndexable: true,
    });
    await setPublishState("u1", true, true);
    expect(mocks.update.mock.calls[0]![0].data.publicIndexable).toBe(true);

    mocks.update.mockClear();
    mocks.update.mockResolvedValue({ published: false, publicSlug: "s", publicIndexable: false });
    await setPublishState("u1", false, true); // indexable requested but not published
    expect(mocks.update.mock.calls[0]![0].data.publicIndexable).toBe(false);
  });

  it("throws when publishing a non-existent CV", async () => {
    mocks.findUnique.mockResolvedValue(null);
    await expect(setPublishState("u1", true)).rejects.toBeInstanceOf(CvNotFoundError);
  });
});

describe("getPublicCvForPage + listIndexablePublicSlugs", () => {
  it("returns the CV plus its indexing opt-in", async () => {
    mocks.findUnique.mockResolvedValue({
      published: true,
      publicIndexable: true,
      document: DOC,
    });
    const rec = await getPublicCvForPage("slug");
    expect(rec?.cv.owner.displayName).toBe("Basile Chrétien");
    expect(rec?.indexable).toBe(true);
  });
  it("returns null when unpublished", async () => {
    mocks.findUnique.mockResolvedValue({ published: false, document: DOC });
    expect(await getPublicCvForPage("slug")).toBeNull();
  });
  it("lists only opted-in published slugs", async () => {
    mocks.findMany.mockResolvedValue([
      { publicSlug: "a-1234" },
      { publicSlug: "b-5678" },
      { publicSlug: null },
    ]);
    expect(await listIndexablePublicSlugs()).toEqual(["a-1234", "b-5678"]);
  });
});

describe("getPublicCv", () => {
  it("returns the CV for a published slug", async () => {
    mocks.findUnique.mockResolvedValue({ published: true, document: DOC });
    expect((await getPublicCv("slug"))?.owner.displayName).toBe("Basile Chrétien");
  });
  it("returns null when unpublished or unknown", async () => {
    mocks.findUnique.mockResolvedValueOnce({ published: false, document: DOC });
    expect(await getPublicCv("slug")).toBeNull();
    mocks.findUnique.mockResolvedValueOnce(null);
    expect(await getPublicCv("nope")).toBeNull();
  });
  it("returns null for a corrupt stored document", async () => {
    mocks.findUnique.mockResolvedValue({ published: true, document: { bad: 1 } });
    expect(await getPublicCv("slug")).toBeNull();
  });
});
