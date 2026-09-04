import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchCrossrefGapFields: vi.fn(),
  fetchCrossrefAbstract: vi.fn(),
  fetchRetractionStatus: vi.fn(),
  fetchCrossrefDataLinks: vi.fn(),
  fetchEuropePmcByDoi: vi.fn(),
  fetchEuropePmcDataLinks: vi.fn(),
  resolveInstitution: vi.fn(),
  fetchRcrByPmids: vi.fn(),
}));
vi.mock("@/lib/crossref/client", () => ({
  fetchCrossrefGapFields: mocks.fetchCrossrefGapFields,
  fetchCrossrefAbstract: mocks.fetchCrossrefAbstract,
  fetchRetractionStatus: mocks.fetchRetractionStatus,
  fetchCrossrefDataLinks: mocks.fetchCrossrefDataLinks,
}));
vi.mock("@/lib/europepmc/client", () => ({
  fetchEuropePmcByDoi: mocks.fetchEuropePmcByDoi,
  fetchEuropePmcDataLinks: mocks.fetchEuropePmcDataLinks,
}));
vi.mock("@/lib/ror/client", () => ({
  resolveInstitution: mocks.resolveInstitution,
}));
vi.mock("@/lib/icite/client", () => ({
  fetchRcrByPmids: mocks.fetchRcrByPmids,
}));

import {
  DATA_LINKS_MAX_CHECK,
  canonicalizeInstitutions,
  enrichCvWithAbstracts,
  enrichCvWithCrossref,
  enrichCvWithDataLinks,
  enrichCvWithIcite,
  enrichCvWithRetractions,
  mergeCslGaps,
  withRorProvenance,
  type InstitutionBundle,
} from "@/lib/canonical/enrich";
import { DisplayChoicesSchema } from "@/lib/canonical/schema";
import type { CanonicalCv, CvItem, DataLink } from "@/lib/canonical/schema";
import type { CslItem } from "@/types/csl";
import type { ResolvedAffiliation } from "@/lib/openalex/resolveAuthor";
import type { OrcidPosition } from "@/lib/orcid/client";

beforeEach(() => {
  mocks.fetchCrossrefGapFields.mockReset();
  mocks.fetchCrossrefAbstract.mockReset();
  mocks.fetchRetractionStatus.mockReset();
  mocks.fetchCrossrefDataLinks.mockReset();
  mocks.fetchEuropePmcByDoi.mockReset();
  mocks.fetchEuropePmcDataLinks.mockReset();
  mocks.resolveInstitution.mockReset();
  mocks.fetchRcrByPmids.mockReset();
});

// ─── test fixtures ───────────────────────────────────────────────────────────

function csl(over: Partial<CslItem> = {}): CslItem {
  return { id: "W1", type: "article-journal", title: "A title", ...over };
}
function pub(id: string, c?: CslItem): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: id,
    csl: c,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    meta: {},
  };
}
function makeCv(items: CvItem[]): CanonicalCv {
  return {
    schemaVersion: 2,
    id: "x",
    owner: {
      orcid: "0000-0002-7483-2489",
      openAlexAuthorIds: [],
      displayName: "X",
      links: [],
      countsByYear: [],
    },
    display: DisplayChoicesSchema.parse({}),
    sections: [
      {
        id: "publications",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items,
      },
    ],
    presets: [],
    provenance: { generatedAt: "t0", lastSyncedAt: "t0", sources: ["openalex"] },
  };
}

const emptyBundle: InstitutionBundle = {
  employments: [],
  education: [],
  distinctions: [],
  service: [],
  invitedPositions: [],
  affiliations: [],
};

// ─── mergeCslGaps (pure) ──────────────────────────────────────────────────────

describe("mergeCslGaps", () => {
  it("fills only fields the base lacks", () => {
    const base = csl({ "container-title": "Existing Journal" });
    const merged = mergeCslGaps(base, {
      "container-title": "Crossref Journal", // base has it → NOT overwritten
      volume: "10",
      page: "1-9",
    });
    expect(merged["container-title"]).toBe("Existing Journal");
    expect(merged.volume).toBe("10");
    expect(merged.page).toBe("1-9");
  });

  it("treats empty strings as gaps and fills ISSN/publisher", () => {
    const merged = mergeCslGaps(csl({ "container-title": "   " }), {
      "container-title": "Filled",
      ISSN: ["1234-5678"],
      publisher: "Elsevier",
      issue: "2",
    });
    expect(merged["container-title"]).toBe("Filled");
    expect(merged.ISSN).toEqual(["1234-5678"]);
    expect(merged.publisher).toBe("Elsevier");
    expect(merged.issue).toBe("2");
  });

  it("does not mutate the base item", () => {
    const base = csl();
    const merged = mergeCslGaps(base, { "container-title": "J" });
    expect(base["container-title"]).toBeUndefined();
    expect(merged).not.toBe(base);
  });
});

// ─── enrichCvWithCrossref ─────────────────────────────────────────────────────

describe("enrichCvWithCrossref", () => {
  it("fills journal gaps from Crossref and flags provenance", async () => {
    mocks.fetchCrossrefGapFields.mockImplementation(async (doi: string) =>
      doi === "10.1/needs" ? { "container-title": "Filled Journal", volume: "7" } : null,
    );
    const cv = makeCv([
      pub("W1", csl({ DOI: "10.1/needs" })), // gap → enriched
      pub("W2", csl({ DOI: "10.1/has", "container-title": "Already" })), // no gap
      pub("W3", csl({})), // no DOI
      pub("W4"), // no csl (e.g. a non-citation item)
    ]);

    const out = await enrichCvWithCrossref(cv, "ci@example.org");
    const items = out.sections[0]!.items;
    expect(items[0]!.csl?.["container-title"]).toBe("Filled Journal");
    expect(items[0]!.csl?.volume).toBe("7");
    expect(items[0]!.meta.enriched).toBe(true); // marked for source display
    expect(items[1]!.meta.enriched).toBeUndefined(); // untouched item not marked
    expect(items[1]!.csl?.["container-title"]).toBe("Already");
    expect(out.provenance.sources).toContain("crossref");
    // Only the one gap-having work was looked up.
    expect(mocks.fetchCrossrefGapFields).toHaveBeenCalledTimes(1);
  });

  it("returns the same CV (no provenance change) when nothing needs enrichment", async () => {
    const cv = makeCv([pub("W1", csl({ DOI: "10.1/x", "container-title": "J" }))]);
    const out = await enrichCvWithCrossref(cv, "ci@example.org");
    expect(out).toBe(cv);
    expect(mocks.fetchCrossrefGapFields).not.toHaveBeenCalled();
  });

  it("returns the same CV when Crossref yields nothing for the gaps", async () => {
    mocks.fetchCrossrefGapFields.mockResolvedValue(null);
    const cv = makeCv([pub("W1", csl({ DOI: "10.1/x" }))]);
    const out = await enrichCvWithCrossref(cv, "ci@example.org");
    expect(out).toBe(cv);
    expect(out.provenance.sources).not.toContain("crossref");
  });

  it("caps the number of Crossref lookups per call", async () => {
    mocks.fetchCrossrefGapFields.mockResolvedValue(null);
    // 60 gap-having works, but only the first 50 should be looked up.
    const items = Array.from({ length: 60 }, (_, n) =>
      pub(`W${n}`, csl({ id: `W${n}`, DOI: `10.1000/gap${n}` })),
    );
    await enrichCvWithCrossref(makeCv(items), "ci@example.org");
    expect(mocks.fetchCrossrefGapFields).toHaveBeenCalledTimes(50);
  });
});

// ─── enrichCvWithAbstracts (Crossref abstract gap-fill) ───────────────────────

describe("enrichCvWithAbstracts", () => {
  const MAILTO = "ci@example.org";

  it("fills missing abstracts for DOI works, skipping has-abstract / hidden / no-DOI", async () => {
    mocks.fetchCrossrefAbstract.mockImplementation(async (doi: string) =>
      doi === "10.1/needs" ? "A fetched abstract." : null,
    );
    const items: CvItem[] = [
      pub("W1", csl({ DOI: "10.1/needs" })), // no abstract → filled
      pub("W2", csl({ DOI: "10.1/has", abstract: "Already here." })), // has abstract → skipped
      { ...pub("W3", csl({ DOI: "10.1/hidden" })), included: false }, // hidden → skipped
      pub("W4", csl({})), // no DOI → skipped
    ];
    const out = await enrichCvWithAbstracts(makeCv(items), MAILTO);
    const abs = (id: string) => out.sections[0]!.items.find((i) => i.id === id)!.csl?.abstract;
    expect(abs("W1")).toBe("A fetched abstract.");
    expect(abs("W2")).toBe("Already here.");
    expect(abs("W3")).toBeUndefined();
    // Only the one needing work was fetched (hidden / has-abstract / no-DOI skipped).
    expect(mocks.fetchCrossrefAbstract).toHaveBeenCalledTimes(1);
    expect(mocks.fetchCrossrefAbstract).toHaveBeenCalledWith("10.1/needs", MAILTO);
    expect(out.provenance.sources).toContain("crossref");
  });

  it("returns the original CV when nothing needs an abstract", async () => {
    const cv = makeCv([pub("W1", csl({ DOI: "10.1/x", abstract: "Here." }))]);
    const out = await enrichCvWithAbstracts(cv, MAILTO);
    expect(out).toBe(cv);
    expect(mocks.fetchCrossrefAbstract).not.toHaveBeenCalled();
  });

  it("returns the original CV when Crossref yields no abstracts", async () => {
    mocks.fetchCrossrefAbstract.mockResolvedValue(null);
    const cv = makeCv([pub("W1", csl({ DOI: "10.1/x" }))]);
    const out = await enrichCvWithAbstracts(cv, MAILTO);
    expect(out).toBe(cv);
  });
});

// ─── enrichCvWithIcite (NIH iCite RCR) ────────────────────────────────────────

describe("enrichCvWithIcite", () => {
  const withPmid = (id: string, pmid?: string, rcr?: number): CvItem => ({
    ...pub(id),
    meta: { ...(pmid ? { pmid } : {}), ...(rcr !== undefined ? { rcr } : {}) },
  });

  it("folds RCR onto works with a PMID, leaving others untouched", async () => {
    mocks.fetchRcrByPmids.mockResolvedValue(
      new Map([
        ["111", 1.5],
        ["333", 2.0],
      ]),
    );
    const cv = makeCv([
      withPmid("W1", "111"), // looked up + filled
      withPmid("W2"), // no PMID → never looked up, never filled
      withPmid("W3", "333"), // looked up + filled
      withPmid("W4", "999"), // looked up but iCite has no RCR → stays empty
      withPmid("W5", "555", 0.5), // already has an RCR → not looked up, kept as-is
    ]);
    const out = await enrichCvWithIcite(cv);
    const items = out.sections[0]!.items;
    expect(items[0]!.meta.rcr).toBe(1.5);
    expect(items[1]!.meta.rcr).toBeUndefined();
    expect(items[2]!.meta.rcr).toBe(2.0);
    expect(items[3]!.meta.rcr).toBeUndefined(); // PMID not returned by iCite
    expect(items[4]!.meta.rcr).toBe(0.5); // pre-existing RCR preserved
    // Only PMIDs lacking an existing RCR are looked up.
    expect(mocks.fetchRcrByPmids).toHaveBeenCalledWith(["111", "333", "999"]);
  });

  it("does not look up works that already carry an RCR", async () => {
    const cv = makeCv([withPmid("W1", "111", 0.9)]);
    const out = await enrichCvWithIcite(cv);
    expect(out).toBe(cv);
    expect(mocks.fetchRcrByPmids).not.toHaveBeenCalled();
  });

  it("returns the original CV when iCite yields nothing", async () => {
    mocks.fetchRcrByPmids.mockResolvedValue(new Map());
    const cv = makeCv([withPmid("W1", "111")]);
    expect(await enrichCvWithIcite(cv)).toBe(cv);
  });

  it("returns the original CV (no lookup) when no work has a PMID", async () => {
    const cv = makeCv([withPmid("W1")]);
    expect(await enrichCvWithIcite(cv)).toBe(cv);
    expect(mocks.fetchRcrByPmids).not.toHaveBeenCalled();
  });
});

// ─── enrichCvWithRetractions (Crossref / Retraction Watch) ───────────────────

describe("enrichCvWithRetractions", () => {
  it("flags works Crossref reports as retracted, by DOI", async () => {
    mocks.fetchRetractionStatus.mockImplementation(async (doi: string) => doi === "10.1/x");
    const cv = makeCv([
      pub("W1", csl({ id: "W1", DOI: "10.1/x" })),
      pub("W2", csl({ id: "W2", DOI: "10.1/y" })),
      pub("W3", csl({ id: "W3" })), // no DOI → not checked
    ]);
    const items = (await enrichCvWithRetractions(cv, "ci@example.org")).sections[0]!.items;
    expect(items[0]!.meta.retracted).toBe(true);
    expect(items[1]!.meta.retracted).toBeUndefined();
    expect(items[2]!.meta.retracted).toBeUndefined();
    expect(mocks.fetchRetractionStatus).toHaveBeenCalledTimes(2); // only DOI-bearing items
  });

  it("returns the original CV when nothing is retracted", async () => {
    mocks.fetchRetractionStatus.mockResolvedValue(false);
    const cv = makeCv([pub("W1", csl({ DOI: "10.1/x" }))]);
    expect(await enrichCvWithRetractions(cv, "ci@example.org")).toBe(cv);
  });

  it("does not re-check an already-flagged or hidden work", async () => {
    mocks.fetchRetractionStatus.mockResolvedValue(true);
    const flagged = { ...pub("W1", csl({ DOI: "10.1/x" })), meta: { retracted: true } };
    const hidden = { ...pub("W2", csl({ DOI: "10.1/y" })), included: false };
    const cv = makeCv([flagged, hidden]);
    const out = await enrichCvWithRetractions(cv, "ci@example.org");
    expect(out).toBe(cv);
    expect(mocks.fetchRetractionStatus).not.toHaveBeenCalled();
  });
});

// ─── canonicalizeInstitutions (ROR) ───────────────────────────────────────────

function pos(org: string): OrcidPosition {
  return { putCode: org, organization: org };
}

describe("canonicalizeInstitutions", () => {
  it("rewrites institution names to ROR's canonical form across all arrays", async () => {
    mocks.resolveInstitution.mockImplementation(async (name: string) => {
      if (name === "Nagoya Univ.")
        return { id: "https://ror.org/04chrp450", name: "Nagoya University" };
      if (name === "CHU Caen")
        return { id: "https://ror.org/051kpcy16", name: "Caen University Hospital" };
      return null;
    });
    const aff: ResolvedAffiliation = { institution: "Nagoya Univ.", startYear: 2024 };
    const { result, used } = await canonicalizeInstitutions({
      employments: [pos("Nagoya Univ.")],
      education: [pos("CHU Caen")],
      distinctions: [],
      service: [pos("Unknown Place")], // no ROR match → unchanged
      invitedPositions: [],
      affiliations: [aff],
    });

    expect(used).toBe(true);
    expect(result.employments[0]!.organization).toBe("Nagoya University");
    expect(result.education[0]!.organization).toBe("Caen University Hospital");
    expect(result.service[0]!.organization).toBe("Unknown Place");
    expect(result.affiliations[0]!.institution).toBe("Nagoya University");
    // The matched ROR id is persisted additively alongside the canonical name.
    expect(result.employments[0]!.rorId).toBe("https://ror.org/04chrp450");
    expect(result.education[0]!.rorId).toBe("https://ror.org/051kpcy16");
    expect(result.affiliations[0]!.rorId).toBe("https://ror.org/04chrp450");
    expect(result.service[0]!.rorId).toBeUndefined(); // no ROR match → no id
    // Distinct names resolved once each (Nagoya appears twice → dedup'd to 1 call).
    expect(mocks.resolveInstitution).toHaveBeenCalledTimes(3);
  });

  it("reports used=false and returns the input unchanged when no name changes", async () => {
    mocks.resolveInstitution.mockResolvedValue(null);
    const input: InstitutionBundle = { ...emptyBundle, employments: [pos("Some Place")] };
    const { result, used } = await canonicalizeInstitutions(input);
    expect(used).toBe(false);
    expect(result).toBe(input);
  });

  it("reports used=false for an empty bundle without any lookups", async () => {
    const { result, used } = await canonicalizeInstitutions(emptyBundle);
    expect(used).toBe(false);
    expect(result).toBe(emptyBundle);
    expect(mocks.resolveInstitution).not.toHaveBeenCalled();
  });

  it("does not rewrite when ROR returns the same name, but still persists its id", async () => {
    mocks.resolveInstitution.mockResolvedValue({ id: "https://ror.org/x", name: "Exact Name" });
    const { result, used } = await canonicalizeInstitutions({
      ...emptyBundle,
      employments: [pos("Exact Name")],
    });
    // No visible name change → not a "ror" provenance contribution…
    expect(used).toBe(false);
    // …yet the ROR id is captured additively (the name was already canonical).
    expect(result.employments[0]!.organization).toBe("Exact Name");
    expect(result.employments[0]!.rorId).toBe("https://ror.org/x");
  });

  it("threads the ROR-recorded website onto every matched array as institutionUrl", async () => {
    mocks.resolveInstitution.mockResolvedValue({
      id: "https://ror.org/04chrp450",
      name: "Nagoya University",
      website: "http://en.nagoya-u.ac.jp/",
    });
    const aff: ResolvedAffiliation = { institution: "Nagoya Univ.", startYear: 2024 };
    const { result } = await canonicalizeInstitutions({
      ...emptyBundle,
      employments: [pos("Nagoya Univ.")],
      affiliations: [aff],
    });
    expect(result.employments[0]!.institutionUrl).toBe("http://en.nagoya-u.ac.jp/");
    expect(result.affiliations[0]!.institutionUrl).toBe("http://en.nagoya-u.ac.jp/");
  });

  it("leaves institutionUrl undefined when ROR records no website", async () => {
    mocks.resolveInstitution.mockResolvedValue({ id: "https://ror.org/x", name: "No Site U" });
    const { result } = await canonicalizeInstitutions({
      ...emptyBundle,
      employments: [pos("No Site U")],
    });
    expect(result.employments[0]!.institutionUrl).toBeUndefined();
  });
});

// ─── withRorProvenance ────────────────────────────────────────────────────────

describe("withRorProvenance", () => {
  it("adds the ror source idempotently", () => {
    const cv = makeCv([]);
    const once = withRorProvenance(cv);
    expect(once.provenance.sources).toContain("ror");
    const twice = withRorProvenance(once);
    expect(twice.provenance.sources.filter((s) => s === "ror")).toHaveLength(1);
  });
});

// ─── enrichCvWithDataLinks (Europe PMC + Crossref relations) ──────────────────

describe("enrichCvWithDataLinks", () => {
  const geo = { id: "GSE1", scheme: "GEO", url: "https://geo/GSE1", category: "Gene Expression" };
  const zenodo = { id: "10.5281/zenodo.5", scheme: "doi" };
  const GEO_LINK: DataLink = {
    id: "GSE1",
    scheme: "geo",
    url: "https://geo/GSE1",
    kind: "dataset",
  };
  const ZENODO_LINK: DataLink = {
    id: "10.5281/zenodo.5",
    scheme: "doi",
    url: "https://doi.org/10.5281/zenodo.5",
    kind: "dataset",
  };

  it("attaches Europe PMC + Crossref links, hasDataStatement and a back-filled PMID", async () => {
    mocks.fetchEuropePmcByDoi.mockImplementation(async (doi: string) =>
      doi === "10.1/x" ? { pmid: "111", hasData: true } : null,
    );
    mocks.fetchEuropePmcDataLinks.mockResolvedValue([geo]);
    mocks.fetchCrossrefDataLinks.mockImplementation(async (doi: string) =>
      doi === "10.1/x" ? [zenodo] : [],
    );
    const cv = makeCv([
      pub("W1", csl({ id: "W1", DOI: "10.1/x" })),
      pub("W2", csl({ id: "W2", DOI: "10.1/y" })), // not in Europe PMC, no relations
      pub("W3", csl({ id: "W3" })), // no DOI → not checked
    ]);
    const now = "2026-01-01T00:00:00.000Z";
    const out = await enrichCvWithDataLinks(cv, "ci@example.org", now);
    const items = out.sections[0]!.items;
    // Europe PMC links first (they carry more context), then Crossref's.
    expect(items[0]!.meta.dataLinks).toEqual([GEO_LINK, ZENODO_LINK]);
    expect(items[0]!.meta.hasDataStatement).toBe(true);
    expect(items[0]!.meta.pmid).toBe("111");
    expect(items[0]!.meta.dataLinksCheckedAt).toBe(now);
    expect(items[1]!.meta.dataLinks).toBeUndefined();
    expect(items[1]!.meta.hasDataStatement).toBeUndefined();
    // W2 was examined (DOI-bearing) and came up empty — still marked checked, so
    // it rotates to the back of the queue rather than being re-queried forever.
    expect(items[1]!.meta.dataLinksCheckedAt).toBe(now);
    expect(items[2]!.meta.dataLinks).toBeUndefined();
    // W3 has no DOI, so it was never a target — no sentinel.
    expect(items[2]!.meta.dataLinksCheckedAt).toBeUndefined();
    expect(mocks.fetchEuropePmcByDoi).toHaveBeenCalledTimes(2);
    expect(mocks.fetchCrossrefDataLinks).toHaveBeenCalledTimes(2);
    // The data-links call only ran for the work Europe PMC resolved.
    expect(mocks.fetchEuropePmcDataLinks).toHaveBeenCalledTimes(1);
    expect(mocks.fetchEuropePmcDataLinks).toHaveBeenCalledWith("111");
    // Immutable: the input is untouched.
    expect(cv.sections[0]!.items[0]!.meta.dataLinks).toBeUndefined();
  });

  it("skips the data-links call when Europe PMC says the work has NO data, and records it", async () => {
    mocks.fetchEuropePmcByDoi.mockResolvedValue({ pmid: "222", hasData: false });
    mocks.fetchCrossrefDataLinks.mockResolvedValue([]);
    const cv = makeCv([pub("W1", csl({ DOI: "10.1/x" }))]);
    const out = await enrichCvWithDataLinks(cv, "ci@example.org");
    expect(out.sections[0]!.items[0]!.meta.hasDataStatement).toBe(false);
    expect(out.sections[0]!.items[0]!.meta.dataLinks).toBeUndefined();
    expect(mocks.fetchEuropePmcDataLinks).not.toHaveBeenCalled();
  });

  it("falls back to the work's own PMID when Europe PMC does not answer", async () => {
    mocks.fetchEuropePmcByDoi.mockResolvedValue(null);
    mocks.fetchEuropePmcDataLinks.mockResolvedValue([geo]);
    mocks.fetchCrossrefDataLinks.mockResolvedValue([]);
    const withPmid = { ...pub("W1", csl({ DOI: "10.1/x" })), meta: { pmid: "333" } };
    const out = await enrichCvWithDataLinks(makeCv([withPmid]), "ci@example.org");
    expect(mocks.fetchEuropePmcDataLinks).toHaveBeenCalledWith("333");
    expect(out.sections[0]!.items[0]!.meta.dataLinks).toEqual([GEO_LINK]);
    expect(out.sections[0]!.items[0]!.meta.pmid).toBe("333");
    expect(out.sections[0]!.items[0]!.meta.hasDataStatement).toBeUndefined();
  });

  it("merges new finds onto carried links, drops unusable raws, and returns the same CV when nothing changed", async () => {
    mocks.fetchEuropePmcByDoi.mockResolvedValue({ hasData: true }); // no pmid → no links call
    mocks.fetchCrossrefDataLinks.mockResolvedValue([
      zenodo,
      { id: "10.6084/m9.figshare.1", scheme: "doi" }, // figshare → dropped
      { id: "GSE9", scheme: "geo" }, // no URL → dropped
    ]);
    const carried = { ...pub("W1", csl({ DOI: "10.1/x" })), meta: { dataLinks: [GEO_LINK] } };
    const now = "2026-01-01T00:00:00.000Z";
    const out = await enrichCvWithDataLinks(makeCv([carried]), "ci@example.org", now);
    expect(out.sections[0]!.items[0]!.meta.dataLinks).toEqual([GEO_LINK, ZENODO_LINK]);
    expect(out.sections[0]!.items[0]!.meta.hasDataStatement).toBe(true);
    expect(out.sections[0]!.items[0]!.meta.dataLinksCheckedAt).toBe(now);
    expect(mocks.fetchEuropePmcDataLinks).not.toHaveBeenCalled();

    // Re-running with the same answers and the SAME `now` changes nothing →
    // identical object back (the sentinel doesn't drift on a repeat check).
    const again = await enrichCvWithDataLinks(out, "ci@example.org", now);
    expect(again).toBe(out);
  });

  it("marks a total miss as checked (dataLinksCheckedAt) even though nothing else changes, and skips hidden works", async () => {
    mocks.fetchEuropePmcByDoi.mockResolvedValue(null);
    mocks.fetchCrossrefDataLinks.mockResolvedValue([]);
    const hidden = { ...pub("W2", csl({ id: "W2", DOI: "10.1/y" })), included: false };
    const cv = makeCv([pub("W1", csl({ DOI: "10.1/x" })), hidden]);
    const now = "2026-01-01T00:00:00.000Z";
    const out = await enrichCvWithDataLinks(cv, "ci@example.org", now);
    // A total miss still changes the CV: the checked sentinel is set...
    expect(out).not.toBe(cv);
    expect(out.sections[0]!.items[0]!.meta.dataLinksCheckedAt).toBe(now);
    // ...but nothing was actually found.
    expect(out.sections[0]!.items[0]!.meta.dataLinks).toBeUndefined();
    expect(out.sections[0]!.items[0]!.meta.hasDataStatement).toBeUndefined();
    // The hidden work was never examined, so it carries no sentinel either.
    expect(out.sections[0]!.items[1]!.meta.dataLinksCheckedAt).toBeUndefined();
    expect(mocks.fetchEuropePmcByDoi).toHaveBeenCalledTimes(1);
    expect(mocks.fetchEuropePmcDataLinks).not.toHaveBeenCalled();
    // Nothing to check at all (no DOI) → no call, same CV.
    const none = makeCv([pub("W3", csl({ id: "W3" }))]);
    expect(await enrichCvWithDataLinks(none, "ci@example.org", now)).toBe(none);
  });

  it("is bounded to DATA_LINKS_MAX_CHECK works per sync, never-checked works first, then oldest-checked first", async () => {
    mocks.fetchEuropePmcByDoi.mockResolvedValue(null);
    mocks.fetchCrossrefDataLinks.mockResolvedValue([]);
    const items: CvItem[] = [];
    for (let i = 0; i < 120; i++) {
      const it = pub(`W${i}`, csl({ id: `W${i}`, DOI: `10.1/${i}` }));
      // The first 30 were already checked (in ascending checked-order) on a prior
      // sync — a permanent miss that recorded no dataLinks/hasDataStatement, only
      // the sentinel. Under the OLD bucketing (dataLinks/hasDataStatement
      // presence) these would look forever "unchecked"; they must NOT be treated
      // that way now.
      items.push(
        i < 30
          ? {
              ...it,
              meta: {
                dataLinksCheckedAt: `2020-01-${String(i + 1).padStart(2, "0")}T00:00:00.000Z`,
              },
            }
          : it,
      );
    }
    await enrichCvWithDataLinks(makeCv(items), "ci@example.org");
    expect(mocks.fetchEuropePmcByDoi).toHaveBeenCalledTimes(DATA_LINKS_MAX_CHECK);
    const dois = mocks.fetchEuropePmcByDoi.mock.calls.map((c) => c[0] as string);
    // All 90 never-checked works come first, then the 10 LEAST-recently-checked
    // of the already-checked ones (oldest sentinel first).
    expect(dois.slice(0, 90)).toEqual(Array.from({ length: 90 }, (_, i) => `10.1/${i + 30}`));
    expect(dois.slice(90)).toEqual(Array.from({ length: 10 }, (_, i) => `10.1/${i}`));
  });

  it("rotates the never-checked tail of a large CV to the front on the next sync", async () => {
    mocks.fetchEuropePmcByDoi.mockResolvedValue(null);
    mocks.fetchCrossrefDataLinks.mockResolvedValue([]);
    const items: CvItem[] = [];
    for (let i = 0; i < DATA_LINKS_MAX_CHECK + 3; i++) {
      items.push(pub(`W${i}`, csl({ id: `W${i}`, DOI: `10.1/${i}` })));
    }
    const cv = makeCv(items);
    const first = await enrichCvWithDataLinks(cv, "ci@example.org", "2026-01-01T00:00:00.000Z");
    expect(mocks.fetchEuropePmcByDoi).toHaveBeenCalledTimes(DATA_LINKS_MAX_CHECK);
    const firstDois = new Set(mocks.fetchEuropePmcByDoi.mock.calls.map((c) => c[0] as string));
    // Works 100/101/102 fell past the budget on the first sync.
    expect(firstDois.has("10.1/100")).toBe(false);
    expect(firstDois.has("10.1/101")).toBe(false);
    expect(firstDois.has("10.1/102")).toBe(false);
    mocks.fetchEuropePmcByDoi.mockClear();

    await enrichCvWithDataLinks(first, "ci@example.org", "2026-01-02T00:00:00.000Z");
    expect(mocks.fetchEuropePmcByDoi).toHaveBeenCalledTimes(DATA_LINKS_MAX_CHECK);
    const secondDois = mocks.fetchEuropePmcByDoi.mock.calls.map((c) => c[0] as string);
    // The 3 never-checked works from the first sync are examined FIRST this time.
    expect(secondDois.slice(0, 3).sort()).toEqual(["10.1/100", "10.1/101", "10.1/102"]);
  });
});
