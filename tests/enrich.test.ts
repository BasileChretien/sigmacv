import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchCrossrefGapFields: vi.fn(),
  resolveInstitution: vi.fn(),
}));
vi.mock("@/lib/crossref/client", () => ({
  fetchCrossrefGapFields: mocks.fetchCrossrefGapFields,
}));
vi.mock("@/lib/ror/client", () => ({
  resolveInstitution: mocks.resolveInstitution,
}));

import {
  canonicalizeInstitutions,
  enrichCvWithCrossref,
  mergeCslGaps,
  withRorProvenance,
  type InstitutionBundle,
} from "@/lib/canonical/enrich";
import { DisplayChoicesSchema } from "@/lib/canonical/schema";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import type { CslItem } from "@/types/csl";
import type { ResolvedAffiliation } from "@/lib/openalex/resolveAuthor";
import type { OrcidPosition } from "@/lib/orcid/client";

beforeEach(() => {
  mocks.fetchCrossrefGapFields.mockReset();
  mocks.resolveInstitution.mockReset();
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
    schemaVersion: 1,
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
      { id: "publications", type: "publications", title: "Publications", visible: true, order: 0, items },
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

// ─── canonicalizeInstitutions (ROR) ───────────────────────────────────────────

function pos(org: string): OrcidPosition {
  return { putCode: org, organization: org };
}

describe("canonicalizeInstitutions", () => {
  it("rewrites institution names to ROR's canonical form across all arrays", async () => {
    mocks.resolveInstitution.mockImplementation(async (name: string) => {
      if (name === "Nagoya Univ.") return { id: "https://ror.org/04chrp450", name: "Nagoya University" };
      if (name === "CHU Caen") return { id: "https://ror.org/051kpcy16", name: "Caen University Hospital" };
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

  it("does not rewrite when ROR returns the same name", async () => {
    mocks.resolveInstitution.mockResolvedValue({ id: "https://ror.org/x", name: "Exact Name" });
    const { used } = await canonicalizeInstitutions({ ...emptyBundle, employments: [pos("Exact Name")] });
    expect(used).toBe(false);
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
