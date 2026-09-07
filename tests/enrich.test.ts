import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchCrossrefGapFields: vi.fn(),
  fetchCrossrefAbstract: vi.fn(),
  fetchRetractionStatus: vi.fn(),
  fetchCrossrefCreditRoles: vi.fn(),
  fetchCrossrefDataLinks: vi.fn(),
  fetchEuropePmcByDoi: vi.fn(),
  fetchEuropePmcDataLinks: vi.fn(),
  resolveInstitution: vi.fn(),
  fetchIciteByPmids: vi.fn(),
  fetchReplicationsForDois: vi.fn(),
}));
vi.mock("@/lib/crossref/client", () => ({
  fetchCrossrefGapFields: mocks.fetchCrossrefGapFields,
  fetchCrossrefAbstract: mocks.fetchCrossrefAbstract,
  fetchRetractionStatus: mocks.fetchRetractionStatus,
  fetchCrossrefCreditRoles: mocks.fetchCrossrefCreditRoles,
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
  ICITE_BATCH_SIZE: 200,
  fetchIciteByPmids: mocks.fetchIciteByPmids,
}));
vi.mock("@/lib/forrt/client", () => ({
  fetchReplicationsForDois: mocks.fetchReplicationsForDois,
}));
vi.mock("@/lib/log", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { logger } from "@/lib/log";
import {
  DATA_LINKS_BREAKER_THRESHOLD,
  DATA_LINKS_MAX_CHECK,
  ENRICH_PASS_BUDGET_MS,
  canonicalizeInstitutions,
  enrichCvWithAbstracts,
  enrichCvWithCreditRoles,
  enrichCvWithCrossref,
  enrichCvWithDataLinks,
  enrichCvWithForrtReplications,
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
  mocks.fetchCrossrefCreditRoles.mockReset();
  mocks.fetchCrossrefDataLinks.mockReset();
  mocks.fetchEuropePmcByDoi.mockReset();
  mocks.fetchEuropePmcDataLinks.mockReset();
  mocks.resolveInstitution.mockReset();
  mocks.fetchIciteByPmids.mockReset();
  mocks.fetchReplicationsForDois.mockReset();
  vi.mocked(logger.info).mockReset();
  vi.mocked(logger.warn).mockReset();
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

  const NOW = "2026-09-07T00:00:00.000Z";

  it("folds RCR onto works with a PMID, stamping every examined work and leaving others untouched", async () => {
    mocks.fetchIciteByPmids.mockResolvedValue(
      new Map([
        ["111", { rcr: 1.5 }],
        ["333", { rcr: 2.0 }],
      ]),
    );
    const cv = makeCv([
      withPmid("W1", "111"), // looked up + filled
      withPmid("W2"), // no PMID → never looked up, never filled, never stamped
      withPmid("W3", "333"), // looked up + filled
      withPmid("W4", "999"), // looked up but iCite has no record → stays empty, still stamped
      withPmid("W5", "555", 0.5), // carries an RCR from a prior sync → re-examined (refresh), kept on a miss
    ]);
    const out = await enrichCvWithIcite(cv, NOW);
    const items = out.sections[0]!.items;
    expect(items[0]!.meta).toEqual({ pmid: "111", rcr: 1.5, iciteCheckedAt: NOW });
    expect(items[1]!.meta).toEqual({});
    expect(items[2]!.meta).toEqual({ pmid: "333", rcr: 2.0, iciteCheckedAt: NOW });
    // A miss is still a checked work: no figure, but the sentinel moves it to "known".
    expect(items[3]!.meta).toEqual({ pmid: "999", iciteCheckedAt: NOW });
    // A miss never clears an earlier value.
    expect(items[4]!.meta).toEqual({ pmid: "555", rcr: 0.5, iciteCheckedAt: NOW });
    // Never-checked works first; the pre-sentinel work with data counts as
    // checked (oldest) and is queued last.
    expect(mocks.fetchIciteByPmids).toHaveBeenCalledWith(["111", "333", "999", "555"]);
  });

  it("folds the translational fields (clinical citations, is-clinical, APT); a fresh hit overwrites an earlier value", async () => {
    mocks.fetchIciteByPmids.mockResolvedValue(
      new Map([
        ["111", { rcr: 1.8, clinicalCitations: 4, isClinical: false, apt: 0.75 }],
        ["222", { clinicalCitations: 0, isClinical: true }],
        ["333", { apt: 0.1 }],
      ]),
    );
    const already: CvItem = { ...pub("W3"), meta: { pmid: "333", clinicalCitations: 2 } };
    const cv = makeCv([withPmid("W1", "111"), withPmid("W2", "222"), already]);
    const out = await enrichCvWithIcite(cv, NOW);
    const items = out.sections[0]!.items;
    expect(items[0]!.meta).toMatchObject({
      pmid: "111",
      rcr: 1.8,
      clinicalCitations: 4,
      isClinical: false,
      apt: 0.75,
    });
    // A record without RCR still lands (no RCR, but the translational fields).
    expect(items[1]!.meta).toEqual({
      pmid: "222",
      clinicalCitations: 0,
      isClinical: true,
      iciteCheckedAt: NOW,
    });
    // The pre-existing field is kept and the fresh record merges on top.
    expect(items[2]!.meta).toEqual({
      pmid: "333",
      clinicalCitations: 2,
      apt: 0.1,
      iciteCheckedAt: NOW,
    });
    // Immutable: the input CV is untouched.
    expect(cv.sections[0]!.items[0]!.meta.rcr).toBeUndefined();
    expect(cv.sections[0]!.items[0]!.meta.iciteCheckedAt).toBeUndefined();
  });

  it("stamps the sentinel on a total miss (iCite yields nothing) so the work leaves the fresh queue", async () => {
    mocks.fetchIciteByPmids.mockResolvedValue(new Map());
    const cv = makeCv([withPmid("W1", "111")]);
    const out = await enrichCvWithIcite(cv, NOW);
    expect(out).not.toBe(cv);
    expect(out.sections[0]!.items[0]!.meta).toEqual({ pmid: "111", iciteCheckedAt: NOW });
  });

  it("returns the original CV (no lookup) when no work has a PMID", async () => {
    const cv = makeCv([withPmid("W1")]);
    expect(await enrichCvWithIcite(cv)).toBe(cv);
    expect(mocks.fetchIciteByPmids).not.toHaveBeenCalled();
  });

  it("rotates under the cap: never-checked first, then oldest-checked, so the tail is reached on the next run", async () => {
    mocks.fetchIciteByPmids.mockResolvedValue(new Map());
    // 500 works checked on an earlier sync (the cap), at staggered times, plus
    // ONE never-checked work at the very END of the list. Position alone would
    // starve it forever; the rotation must queue it first.
    const known = Array.from({ length: 500 }, (_, k) => ({
      ...withPmid(`K${k}`, `${1000 + k}`),
      meta: {
        pmid: `${1000 + k}`,
        iciteCheckedAt: `2026-01-01T00:00:00.${String(k).padStart(3, "0")}Z`,
      },
    }));
    const tail = withPmid("TAIL", "9999");
    const first = await enrichCvWithIcite(makeCv([...known, tail]), NOW);
    // The 500 targets go out in pass-level batches of the client's page size
    // (200 + 200 + 100), in queue order.
    const firstRunCalls = mocks.fetchIciteByPmids.mock.calls.length;
    expect(firstRunCalls).toBe(3);
    const queried = mocks.fetchIciteByPmids.mock.calls.flatMap((c) => c[0] as string[]);
    expect(queried).toHaveLength(500);
    expect(queried[0]).toBe("9999"); // the never-checked tail goes first
    // The 499 remaining slots go to the OLDEST-checked works; the single newest
    // (largest timestamp) is the one left out for this run.
    const newest = [...known].sort((a, b) =>
      b.meta.iciteCheckedAt.localeCompare(a.meta.iciteCheckedAt),
    )[0]!;
    expect(queried).not.toContain(newest.meta.pmid);
    const items = first.sections[0]!.items;
    expect(items.at(-1)!.meta.iciteCheckedAt).toBe(NOW); // the tail is now stamped
    expect(items.find((i) => i.id === newest.id)!.meta.iciteCheckedAt).toBe(
      newest.meta.iciteCheckedAt,
    ); // the skipped one keeps its old stamp…

    // …so on the NEXT run it is the oldest and goes first.
    const LATER = "2026-09-08T00:00:00.000Z";
    await enrichCvWithIcite(first, LATER);
    const queriedNext = mocks.fetchIciteByPmids.mock.calls[firstRunCalls]![0] as string[];
    expect(queriedNext[0]).toBe(newest.meta.pmid);
    expect(queriedNext).not.toContain("9999"); // the tail (stamped NOW) is now the newest → skipped
  });
});

// ─── enrichCvWithRetractions (Crossref / Retraction Watch) ───────────────────

describe("enrichCvWithRetractions", () => {
  const NOW = "2026-09-07T00:00:00.000Z";

  it("flags works Crossref reports as retracted, by DOI, stamping every checked work", async () => {
    mocks.fetchRetractionStatus.mockImplementation(async (doi: string) => doi === "10.1/x");
    const cv = makeCv([
      pub("W1", csl({ id: "W1", DOI: "10.1/x" })),
      pub("W2", csl({ id: "W2", DOI: "10.1/y" })),
      pub("W3", csl({ id: "W3" })), // no DOI → not checked, not stamped
    ]);
    const items = (await enrichCvWithRetractions(cv, "ci@example.org", NOW)).sections[0]!.items;
    expect(items[0]!.meta).toEqual({ retracted: true, retractionCheckedAt: NOW });
    expect(items[1]!.meta).toEqual({ retractionCheckedAt: NOW }); // a miss is still a checked work
    expect(items[2]!.meta).toEqual({});
    expect(mocks.fetchRetractionStatus).toHaveBeenCalledTimes(2); // only DOI-bearing items
  });

  it("stamps the sentinel (and nothing else) when nothing is retracted", async () => {
    mocks.fetchRetractionStatus.mockResolvedValue(false);
    const cv = makeCv([pub("W1", csl({ DOI: "10.1/x" }))]);
    const out = await enrichCvWithRetractions(cv, "ci@example.org", NOW);
    expect(out.sections[0]!.items[0]!.meta).toEqual({ retractionCheckedAt: NOW });
    expect(cv.sections[0]!.items[0]!.meta).toEqual({}); // immutable
  });

  it("rotates under the cap: never-checked first, then oldest-checked, across two runs", async () => {
    mocks.fetchRetractionStatus.mockResolvedValue(false);
    // 100 works (the cap) checked earlier at staggered times, then one
    // never-checked work at the END — it must be queued first, displacing the
    // most recently checked work to the next run.
    const known = Array.from({ length: 100 }, (_, k) => ({
      ...pub(`K${k}`, csl({ id: `K${k}`, DOI: `10.1/k${k}` })),
      meta: { retractionCheckedAt: `2026-01-01T00:00:00.${String(k).padStart(3, "0")}Z` },
    }));
    const tail = pub("TAIL", csl({ id: "TAIL", DOI: "10.1/tail" }));
    const first = await enrichCvWithRetractions(makeCv([...known, tail]), "ci@example.org", NOW);
    const queried = mocks.fetchRetractionStatus.mock.calls.map((c) => c[0] as string);
    expect(queried).toHaveLength(100);
    expect(queried[0]).toBe("10.1/tail");
    expect(queried).not.toContain("10.1/k99"); // the newest-checked is the one left out
    expect(first.sections[0]!.items.at(-1)!.meta.retractionCheckedAt).toBe(NOW);
    expect(first.sections[0]!.items[99]!.meta.retractionCheckedAt).toBe("2026-01-01T00:00:00.099Z");

    mocks.fetchRetractionStatus.mockClear();
    await enrichCvWithRetractions(first, "ci@example.org", "2026-09-08T00:00:00.000Z");
    const queriedNext = mocks.fetchRetractionStatus.mock.calls.map((c) => c[0] as string);
    expect(queriedNext[0]).toBe("10.1/k99"); // now the oldest → first
    expect(queriedNext).not.toContain("10.1/tail"); // stamped NOW → newest → skipped this run
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

// ─── enrichCvWithCreditRoles (Crossref deposit, owner by ORCID) ──────────────

describe("enrichCvWithCreditRoles", () => {
  const ORCID = "0000-0002-7483-2489";

  it("folds the owner's roles onto DOI works as crossref-sourced, flagging provenance", async () => {
    mocks.fetchCrossrefCreditRoles.mockImplementation(async (doi: string) =>
      doi === "10.1/x" ? ["conceptualization", "software"] : null,
    );
    const cv = makeCv([
      pub("W1", csl({ id: "W1", DOI: "10.1/x" })),
      pub("W2", csl({ id: "W2", DOI: "10.1/y" })), // Crossref has none → untouched
      pub("W3", csl({ id: "W3" })), // no DOI → not looked up
    ]);
    const out = await enrichCvWithCreditRoles(cv, ORCID, "ci@example.org");
    const items = out.sections[0]!.items;
    expect(items[0]!.meta.creditRoles).toEqual(["conceptualization", "software"]);
    expect(items[0]!.meta.creditRolesSource).toBe("crossref");
    expect(items[1]!.meta.creditRoles).toBeUndefined();
    expect(items[2]!.meta.creditRoles).toBeUndefined();
    expect(out.provenance.sources).toContain("crossref");
    expect(mocks.fetchCrossrefCreditRoles).toHaveBeenCalledTimes(2);
    expect(mocks.fetchCrossrefCreditRoles).toHaveBeenCalledWith("10.1/x", ORCID, "ci@example.org");
    // Immutable: the input is untouched.
    expect(cv.sections[0]!.items[0]!.meta.creditRoles).toBeUndefined();
  });

  it("never overwrites a SELF declaration (or an earlier fill), and skips hidden works", async () => {
    mocks.fetchCrossrefCreditRoles.mockResolvedValue(["software"]);
    const self = {
      ...pub("W1", csl({ DOI: "10.1/x" })),
      meta: { creditRoles: ["validation" as const], creditRolesSource: "self" as const },
    };
    const filled = {
      ...pub("W2", csl({ DOI: "10.1/y" })),
      meta: { creditRoles: ["software" as const], creditRolesSource: "crossref" as const },
    };
    const hidden = { ...pub("W3", csl({ DOI: "10.1/z" })), included: false };
    const cv = makeCv([self, filled, hidden]);
    expect(await enrichCvWithCreditRoles(cv, ORCID, "ci@example.org")).toBe(cv);
    expect(mocks.fetchCrossrefCreditRoles).not.toHaveBeenCalled();
  });

  it("returns the original CV when Crossref yields nothing", async () => {
    mocks.fetchCrossrefCreditRoles.mockResolvedValue(null);
    const cv = makeCv([pub("W1", csl({ DOI: "10.1/x" }))]);
    expect(await enrichCvWithCreditRoles(cv, ORCID, "ci@example.org")).toBe(cv);
  });

  it("caps the number of lookups per call", async () => {
    mocks.fetchCrossrefCreditRoles.mockResolvedValue(null);
    const many = Array.from({ length: 130 }, (_, i) =>
      pub(`W${i}`, csl({ id: `W${i}`, DOI: `10.1/${i}` })),
    );
    await enrichCvWithCreditRoles(makeCv(many), ORCID, "ci@example.org");
    expect(mocks.fetchCrossrefCreditRoles).toHaveBeenCalledTimes(100);
  });
});

// ─── enrichCvWithForrtReplications (FORRT/FReD) ───────────────────────────────

describe("enrichCvWithForrtReplications", () => {
  it("folds replications onto a work matched by DOI", async () => {
    mocks.fetchReplicationsForDois.mockResolvedValue({
      replicatedBy: new Map([
        [
          "10.1000/original",
          [
            { doi: "10.1000/rep-a", outcome: "success" },
            { doi: "10.1000/rep-b", outcome: "mixed" },
          ],
        ],
      ]),
      replicationOf: new Map(),
    });
    const cv = makeCv([pub("W1", csl({ DOI: "10.1000/original" }))]);
    const out = await enrichCvWithForrtReplications(cv);
    const items = out.sections[0]!.items;
    expect(items[0]!.meta.replications).toEqual([
      { doi: "10.1000/rep-a", outcome: "success" },
      { doi: "10.1000/rep-b", outcome: "mixed" },
    ]);
    expect(items[0]!.meta.replicationOf).toBeUndefined();
    expect(out.provenance.sources).toContain("forrt");
  });

  it("folds replicationOf onto a work that IS a replication", async () => {
    mocks.fetchReplicationsForDois.mockResolvedValue({
      replicatedBy: new Map(),
      replicationOf: new Map([
        ["10.1000/replication", { doi: "10.1000/original", ref: "Original 2019" }],
      ]),
    });
    const cv = makeCv([pub("W1", csl({ DOI: "10.1000/replication" }))]);
    const items = (await enrichCvWithForrtReplications(cv)).sections[0]!.items;
    expect(items[0]!.meta.replicationOf).toEqual({ doi: "10.1000/original", ref: "Original 2019" });
    expect(items[0]!.meta.replications).toBeUndefined();
  });

  it("caps replications at 10", async () => {
    const many = Array.from({ length: 15 }, (_, i) => ({
      doi: `10.1000/rep-${i}`,
      outcome: "success",
    }));
    mocks.fetchReplicationsForDois.mockResolvedValue({
      replicatedBy: new Map([["10.1000/original", many]]),
      replicationOf: new Map(),
    });
    const cv = makeCv([pub("W1", csl({ DOI: "10.1000/original" }))]);
    const items = (await enrichCvWithForrtReplications(cv)).sections[0]!.items;
    expect(items[0]!.meta.replications).toHaveLength(10);
  });

  it("a miss stamps replicationsCheckedAt without adding replications, and drops forrt from provenance", async () => {
    mocks.fetchReplicationsForDois.mockResolvedValue({
      replicatedBy: new Map(),
      replicationOf: new Map(),
    });
    const cv = makeCv([pub("W1", csl({ DOI: "10.1000/unrelated" }))]);
    const out = await enrichCvWithForrtReplications(cv);
    expect(out).not.toBe(cv);
    const item = out.sections[0]!.items[0]!;
    expect(item.meta.replications).toBeUndefined();
    expect(item.meta.replicationOf).toBeUndefined();
    expect(item.meta.replicationsCheckedAt).toEqual(expect.any(String));
    expect(out.provenance.sources).not.toContain("forrt");
  });

  it("returns the original CV untouched when there is no DOI-bearing item", async () => {
    const cv = makeCv([pub("W1", csl())]);
    expect(await enrichCvWithForrtReplications(cv)).toBe(cv);
    expect(mocks.fetchReplicationsForDois).not.toHaveBeenCalled();
  });

  it("does not target a hidden work", async () => {
    const hidden = { ...pub("W2", csl({ DOI: "10.1000/original" })), included: false };
    const cv = makeCv([hidden]);
    const out = await enrichCvWithForrtReplications(cv);
    expect(out).toBe(cv);
    expect(mocks.fetchReplicationsForDois).not.toHaveBeenCalled();
  });

  it("prefers never-checked works first: a third work is only checked once the cap frees up on a later run", async () => {
    // Cap the queue to 2 for this test by pre-marking two of three works as
    // "known" via replicationsCheckedAt from a prior run — the pass should
    // still fill any remaining room with known works up to the real cap, so
    // isolate the rotation by asserting the ORDER fresh-before-known targets
    // are queried in, which is what makes the third work reachable once the
    // first two graduate.
    mocks.fetchReplicationsForDois.mockResolvedValue({
      replicatedBy: new Map(),
      replicationOf: new Map(),
    });
    const checkedEarlier = {
      ...pub("W1", csl({ DOI: "10.1000/checked-1" })),
      meta: { replicationsCheckedAt: "2026-01-01T00:00:00.000Z" },
    };
    const alsoChecked = {
      ...pub("W2", csl({ DOI: "10.1000/checked-2" })),
      meta: { replicationsCheckedAt: "2026-01-01T00:00:00.000Z" },
    };
    const neverChecked = pub("W3", csl({ DOI: "10.1000/fresh" }));
    const cv = makeCv([checkedEarlier, alsoChecked, neverChecked]);
    await enrichCvWithForrtReplications(cv);
    const queried = mocks.fetchReplicationsForDois.mock.calls[0]![0] as string[];
    // The never-checked work is queried FIRST, ahead of the two already-known
    // ones — so under a cap smaller than the CV, it is never starved.
    expect(queried[0]).toBe("10.1000/fresh");
  });

  it("carries a previously-found match forward across a later miss (never removes)", async () => {
    mocks.fetchReplicationsForDois.mockResolvedValueOnce({
      replicatedBy: new Map([["10.1000/original", [{ doi: "10.1000/rep-a" }]]]),
      replicationOf: new Map(),
    });
    const cv = makeCv([pub("W1", csl({ DOI: "10.1000/original" }))]);
    const first = await enrichCvWithForrtReplications(cv);
    expect(first.sections[0]!.items[0]!.meta.replications).toEqual([{ doi: "10.1000/rep-a" }]);

    // A later run for the SAME (now "known") work returns nothing new — the
    // existing match is left untouched (only overwritten by a fresh hit).
    mocks.fetchReplicationsForDois.mockResolvedValueOnce({
      replicatedBy: new Map(),
      replicationOf: new Map(),
    });
    const second = await enrichCvWithForrtReplications(first);
    expect(second.sections[0]!.items[0]!.meta.replications).toEqual([{ doi: "10.1000/rep-a" }]);
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

// ─── Circuit breaker + per-pass time budget (production incident 2026-09-07) ──
//
// Europe PMC's `datalinks` endpoint hung for a day; with per-work retries the
// data-links pass alone took ~226 s per sync. Two guards now bound a pass:
// a per-pass breaker on that endpoint, and a wall-clock budget under which no
// pass LAUNCHES further lookups.

const NOW = "2026-09-07T00:00:00.000Z";
const START = Date.parse("2026-09-07T12:00:00.000Z");
const ZENODO_RAW = { id: "10.5281/zenodo.5", scheme: "doi" };
const ZENODO: DataLink = {
  id: "10.5281/zenodo.5",
  scheme: "doi",
  url: "https://doi.org/10.5281/zenodo.5",
  kind: "dataset",
};

/** `n` DOI-bearing works W<from>… (DOI 10.1/<i>). */
function doiWorks(n: number, from = 0): CvItem[] {
  return Array.from({ length: n }, (_, k) => {
    const i = from + k;
    return pub(`W${i}`, csl({ id: `W${i}`, DOI: `10.1/${i}` }));
  });
}

/** Europe PMC resolves DOI 10.1/<i> to PMID "1<i>" with data (→ a data-links call is due). */
function searchResolvesWithData(doi: string): { pmid: string; hasData: boolean } {
  return { pmid: `1${doi.split("/")[1]}`, hasData: true };
}

/** Freeze the clock at START; the returned mover jumps it past the pass budget. */
function freezeClock(): () => void {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(START);
  return () => vi.setSystemTime(START + ENRICH_PASS_BUDGET_MS);
}

describe("enrichCvWithDataLinks — Europe PMC data-links circuit breaker", () => {
  beforeEach(() => {
    mocks.fetchCrossrefDataLinks.mockResolvedValue([ZENODO_RAW]);
    mocks.fetchEuropePmcByDoi.mockImplementation(async (doi: string) =>
      searchResolvesWithData(doi),
    );
  });

  it("opens after 3 consecutive endpoint failures: later works skip the data-links call, still get search + Crossref, and stay UNSTAMPED", async () => {
    mocks.fetchEuropePmcDataLinks.mockResolvedValue(null); // endpoint down
    // W8 needs no data-links call at all (Europe PMC says: no data).
    mocks.fetchEuropePmcByDoi.mockImplementation(async (doi: string) =>
      doi === "10.1/8" ? { pmid: "18", hasData: false } : searchResolvesWithData(doi),
    );
    const cv = makeCv(doiWorks(9));
    const out = await enrichCvWithDataLinks(cv, "ci@example.org", NOW);

    // The cheap lookups still ran for EVERY work…
    expect(mocks.fetchEuropePmcByDoi).toHaveBeenCalledTimes(9);
    expect(mocks.fetchCrossrefDataLinks).toHaveBeenCalledTimes(9);
    // …but the data-links endpoint was only reached by the works already in
    // flight when the third failure landed — the 5-wide concurrency window —
    // and by none of the works launched after it.
    expect(mocks.fetchEuropePmcDataLinks).toHaveBeenCalledTimes(5);

    const items = out.sections[0]!.items;
    for (const item of items.slice(0, 8)) {
      // Nothing is known about their data links → NOT stamped (retried next sync)…
      expect(item.meta.dataLinksCheckedAt).toBeUndefined();
      // …but what the other lookups found is kept.
      expect(item.meta.pmid).toMatch(/^1\d$/);
      expect(item.meta.hasDataStatement).toBe(true);
      expect(item.meta.dataLinks).toEqual([ZENODO]);
    }
    // A work whose lookups ALL completed (no data-links call due) is stamped.
    expect(items[8]!.meta).toMatchObject({
      pmid: "18",
      hasDataStatement: false,
      dataLinksCheckedAt: NOW,
      dataLinks: [ZENODO],
    });
    // The outage is logged ONCE, not once per work.
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith("europepmc.datalinks_circuit_open", {
      consecutiveFailures: DATA_LINKS_BREAKER_THRESHOLD,
      skipped: 3,
      examined: 9,
    });
    expect(DATA_LINKS_BREAKER_THRESHOLD).toBe(3);
  });

  it("counts CONSECUTIVE failures only: an answer in between resets the count and the breaker stays closed", async () => {
    mocks.fetchEuropePmcDataLinks
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce([]) // answered: no links
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValue([]);
    const out = await enrichCvWithDataLinks(makeCv(doiWorks(7)), "ci@example.org", NOW);
    expect(mocks.fetchEuropePmcDataLinks).toHaveBeenCalledTimes(7);
    expect(logger.warn).not.toHaveBeenCalled();
    const stamped = out.sections[0]!.items.map((it) => it.meta.dataLinksCheckedAt === NOW);
    // Only the works whose data-links call actually ANSWERED are stamped.
    expect(stamped).toEqual([false, false, true, false, false, true, true]);
  });

  it("a single failed data-links call leaves that work unstamped and keeps the CV otherwise unchanged", async () => {
    mocks.fetchCrossrefDataLinks.mockResolvedValue([]);
    mocks.fetchEuropePmcByDoi.mockResolvedValue(null);
    mocks.fetchEuropePmcDataLinks.mockResolvedValue(null);
    const withPmid = { ...pub("W1", csl({ DOI: "10.1/x" })), meta: { pmid: "333" } };
    const cv = makeCv([withPmid]);
    // Nothing found and nothing stamped → the very same CV object comes back.
    expect(await enrichCvWithDataLinks(cv, "ci@example.org", NOW)).toBe(cv);
    expect(logger.warn).not.toHaveBeenCalled();
  });
});

describe("per-pass time budget (ENRICH_PASS_BUDGET_MS)", () => {
  afterEach(() => vi.useRealTimers());

  it("is 30 s", () => {
    expect(ENRICH_PASS_BUDGET_MS).toBe(30_000);
  });

  it("dataLinks: stops launching lookups once the budget is spent; unexamined works are left untouched and unstamped", async () => {
    const spend = freezeClock();
    mocks.fetchCrossrefDataLinks.mockResolvedValue([]);
    // The first lookup takes the whole budget (a hanging upstream); the workers
    // that would launch the next works see the budget expired.
    mocks.fetchEuropePmcByDoi.mockImplementation(async () => {
      spend();
      return null;
    });
    const cv = makeCv(doiWorks(4));
    const out = await enrichCvWithDataLinks(cv, "ci@example.org", NOW);
    expect(mocks.fetchEuropePmcByDoi).toHaveBeenCalledTimes(1);
    const items = out.sections[0]!.items;
    expect(items[0]!.meta.dataLinksCheckedAt).toBe(NOW);
    for (const k of [1, 2, 3]) {
      expect(items[k]).toBe(cv.sections[0]!.items[k]);
      expect(items[k]!.meta.dataLinksCheckedAt).toBeUndefined();
    }
    expect(logger.info).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith("enrich.pass_budget_exhausted", {
      pass: "dataLinks",
      budgetMs: ENRICH_PASS_BUDGET_MS,
      examined: 1,
      deferred: 3,
    });
  });

  it("dataLinks: logs nothing when every lookup fits in the budget", async () => {
    freezeClock();
    mocks.fetchCrossrefDataLinks.mockResolvedValue([]);
    mocks.fetchEuropePmcByDoi.mockResolvedValue(null);
    await enrichCvWithDataLinks(makeCv(doiWorks(4)), "ci@example.org", NOW);
    expect(mocks.fetchEuropePmcByDoi).toHaveBeenCalledTimes(4);
    expect(logger.info).not.toHaveBeenCalled();
  });

  it("retractions: the works past the budget are neither flagged nor stamped", async () => {
    const spend = freezeClock();
    mocks.fetchRetractionStatus.mockImplementation(async () => {
      spend();
      return true;
    });
    const cv = makeCv(doiWorks(3));
    const out = await enrichCvWithRetractions(cv, "ci@example.org", NOW);
    expect(mocks.fetchRetractionStatus).toHaveBeenCalledTimes(1);
    const items = out.sections[0]!.items;
    expect(items[0]!.meta).toEqual({ retracted: true, retractionCheckedAt: NOW });
    expect(items[1]).toBe(cv.sections[0]!.items[1]);
    expect(items[2]).toBe(cv.sections[0]!.items[2]);
    expect(logger.info).toHaveBeenCalledWith("enrich.pass_budget_exhausted", {
      pass: "retractions",
      budgetMs: ENRICH_PASS_BUDGET_MS,
      examined: 1,
      deferred: 2,
    });
  });

  it("icite: batches are launched one at a time so a later batch is skipped once the budget is spent", async () => {
    const spend = freezeClock();
    mocks.fetchIciteByPmids.mockImplementation(async () => {
      spend();
      return new Map([["10", { rcr: 1.5 }]]);
    });
    // 201 works with a PMID → two batches of the client's page size (200 + 1).
    const items = Array.from({ length: 201 }, (_, i) => ({
      ...pub(`W${i}`),
      meta: { pmid: `${i}` },
    }));
    const cv = makeCv(items);
    const out = await enrichCvWithIcite(cv, NOW);
    expect(mocks.fetchIciteByPmids).toHaveBeenCalledTimes(1);
    expect((mocks.fetchIciteByPmids.mock.calls[0] as unknown[])[0]).toHaveLength(200);
    const got = out.sections[0]!.items;
    expect(got[10]!.meta).toEqual({ pmid: "10", rcr: 1.5, iciteCheckedAt: NOW });
    expect(got[199]!.meta).toEqual({ pmid: "199", iciteCheckedAt: NOW });
    // The 201st work sat in the second batch, never launched → untouched.
    expect(got[200]).toBe(cv.sections[0]!.items[200]);
    expect(logger.info).toHaveBeenCalledWith("enrich.pass_budget_exhausted", {
      pass: "icite.batches",
      budgetMs: ENRICH_PASS_BUDGET_MS,
      examined: 1,
      deferred: 1,
    });
  });
});
