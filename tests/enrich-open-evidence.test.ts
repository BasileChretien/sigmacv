import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchOpenCitationsCount: vi.fn(),
  fetchSoftwareHeritageArchival: vi.fn(),
  fetchScietyEvaluations: vi.fn(),
}));
vi.mock("@/lib/opencitations/client", () => ({
  fetchOpenCitationsCount: mocks.fetchOpenCitationsCount,
}));
vi.mock("@/lib/softwareheritage/client", () => ({
  fetchSoftwareHeritageArchival: mocks.fetchSoftwareHeritageArchival,
}));
vi.mock("@/lib/sciety/client", () => ({
  fetchScietyEvaluations: mocks.fetchScietyEvaluations,
}));
// `canonical/enrich.ts` also imports the FORRT client (unrelated to this file's
// OpenCitations/Software Heritage/Sciety coverage) — mocking `@/lib/db` (its
// transitive dependency) keeps this suite from requiring real env vars, same as
// `tests/forrt-client.test.ts`.
vi.mock("@/lib/db", () => ({ prisma: { forrtReplication: { findMany: vi.fn() } } }));

import {
  enrichCvWithOpenCitations,
  enrichCvWithSciety,
  enrichCvWithSoftwareHeritage,
} from "@/lib/canonical/enrich";
import { DisplayChoicesSchema } from "@/lib/canonical/schema";
import type { CanonicalCv, CvItem, CvSection } from "@/lib/canonical/schema";
import type { CslItem } from "@/types/csl";

beforeEach(() => {
  mocks.fetchOpenCitationsCount.mockReset();
  mocks.fetchSoftwareHeritageArchival.mockReset();
  mocks.fetchScietyEvaluations.mockReset();
});

function csl(over: Partial<CslItem> = {}): CslItem {
  return { id: "W1", type: "article-journal", title: "A title", ...over };
}

function item(id: string, over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: id,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    meta: {},
    ...over,
  };
}

function makeCv(sections: CvSection[]): CanonicalCv {
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
    sections,
    presets: [],
    provenance: { generatedAt: "t0", lastSyncedAt: "t0", sources: ["openalex"] },
  };
}

function section(type: CvSection["type"], items: CvItem[], id = type): CvSection {
  return { id, type, title: id, visible: true, order: 0, items };
}

const NOW = "2026-09-07T00:00:00.000Z";

// ─── enrichCvWithOpenCitations ────────────────────────────────────────────────

describe("enrichCvWithOpenCitations", () => {
  it("folds an OpenCitations count onto DOI-bearing, non-hidden items", async () => {
    mocks.fetchOpenCitationsCount.mockImplementation(async (doi: string) =>
      doi === "10.1/x" ? 42 : null,
    );
    const cv = makeCv([
      section("publications", [
        item("W1", { csl: csl({ id: "W1", DOI: "10.1/x" }) }),
        item("W2", { csl: csl({ id: "W2", DOI: "10.1/y" }) }),
        item("W3", { csl: csl({ id: "W3" }) }), // no DOI
      ]),
    ]);
    const out = await enrichCvWithOpenCitations(cv);
    expect(out.sections[0]!.items[0]!.meta.citedByOpenCitations).toBe(42);
    expect(out.sections[0]!.items[1]!.meta.citedByOpenCitations).toBeUndefined();
    expect(out.sections[0]!.items[2]!.meta.citedByOpenCitations).toBeUndefined();
    expect(out.provenance.sources).toContain("opencitations");
    expect(mocks.fetchOpenCitationsCount).toHaveBeenCalledTimes(2);
  });

  it("stamps the sentinel only (no provenance) when nothing came back, keeping an earlier count", async () => {
    mocks.fetchOpenCitationsCount.mockResolvedValue(null);
    const cv = makeCv([
      section("publications", [
        item("W1", { csl: csl({ DOI: "10.1/x" }) }),
        item("W2", { csl: csl({ DOI: "10.1/y" }), meta: { citedByOpenCitations: 7 } }),
      ]),
    ]);
    const out = await enrichCvWithOpenCitations(cv, NOW);
    expect(out.sections[0]!.items[0]!.meta).toEqual({ openCitationsCheckedAt: NOW });
    // A miss never clears the count found on an earlier sync.
    expect(out.sections[0]!.items[1]!.meta).toEqual({
      citedByOpenCitations: 7,
      openCitationsCheckedAt: NOW,
    });
    expect(out.provenance.sources).not.toContain("opencitations");
    expect(cv.sections[0]!.items[0]!.meta).toEqual({}); // immutable
  });

  it("queues never-checked works first, then oldest-checked", async () => {
    mocks.fetchOpenCitationsCount.mockResolvedValue(null);
    const cv = makeCv([
      section("publications", [
        item("W1", {
          csl: csl({ DOI: "10.1/newer" }),
          meta: { openCitationsCheckedAt: "2026-02-01T00:00:00.000Z" },
        }),
        item("W2", {
          csl: csl({ DOI: "10.1/older" }),
          meta: { openCitationsCheckedAt: "2026-01-01T00:00:00.000Z" },
        }),
        item("W3", { csl: csl({ DOI: "10.1/fresh" }) }),
      ]),
    ]);
    await enrichCvWithOpenCitations(cv, NOW);
    expect(mocks.fetchOpenCitationsCount.mock.calls.map((c) => c[0])).toEqual([
      "10.1/fresh",
      "10.1/older",
      "10.1/newer",
    ]);
  });

  it("skips hidden items and items with no DOI, making no call", async () => {
    const f = mocks.fetchOpenCitationsCount;
    const cv = makeCv([
      section("publications", [
        item("W1", { csl: csl({ DOI: "10.1/x" }), included: false }),
        item("W2", { csl: csl() }),
      ]),
    ]);
    expect(await enrichCvWithOpenCitations(cv)).toBe(cv);
    expect(f).not.toHaveBeenCalled();
  });
});

// ─── enrichCvWithSoftwareHeritage ─────────────────────────────────────────────

describe("enrichCvWithSoftwareHeritage", () => {
  const SWHID = { swhid: `swh:1:snp:${"a".repeat(40)}`, archivedAt: "2024-01-01T00:00:00.000Z" };

  it("archives software items with a repository URL in the datasets section", async () => {
    mocks.fetchSoftwareHeritageArchival.mockResolvedValue(SWHID);
    const cv = makeCv([
      section("datasets", [
        item("S1", {
          meta: { type: "Software", repositoryUrl: "https://github.com/user/repo" },
        }),
      ]),
    ]);
    const out = await enrichCvWithSoftwareHeritage(cv);
    expect(out.sections[0]!.items[0]!.meta.swhid).toBe(SWHID.swhid);
    expect(out.sections[0]!.items[0]!.meta.swhArchivedAt).toBe(SWHID.archivedAt);
    expect(out.provenance.sources).toContain("softwareheritage");
  });

  it("skips a Dataset-typed item (not software), a datasets item with no repo URL, an already-archived item, and any item outside the datasets section", async () => {
    const f = mocks.fetchSoftwareHeritageArchival;
    const cv = makeCv([
      section("datasets", [
        item("D1", { meta: { type: "Dataset", repositoryUrl: "https://github.com/u/r" } }),
        item("D2", { meta: { type: "Software" } }), // no repo URL
        item("D3", {
          meta: {
            type: "Software",
            repositoryUrl: "https://github.com/u/r",
            swhid: "swh:1:snp:already",
          },
        }),
      ]),
      section("publications", [
        item("P1", { meta: { type: "Software", repositoryUrl: "https://github.com/u/r" } }),
      ]),
    ]);
    expect(await enrichCvWithSoftwareHeritage(cv)).toBe(cv);
    expect(f).not.toHaveBeenCalled();
  });

  it("stamps the sentinel only (no provenance) when the lookup finds nothing archived", async () => {
    mocks.fetchSoftwareHeritageArchival.mockResolvedValue(null);
    const cv = makeCv([
      section("datasets", [
        item("S1", {
          meta: { type: "Software", repositoryUrl: "https://github.com/user/repo" },
        }),
      ]),
    ]);
    const out = await enrichCvWithSoftwareHeritage(cv, NOW);
    expect(out.sections[0]!.items[0]!.meta).toEqual({
      type: "Software",
      repositoryUrl: "https://github.com/user/repo",
      swhCheckedAt: NOW,
    });
    expect(out.provenance.sources).not.toContain("softwareheritage");
    expect(cv.sections[0]!.items[0]!.meta.swhCheckedAt).toBeUndefined(); // immutable
  });

  it("queues never-checked items first, then oldest-checked (an archived item leaves the queue)", async () => {
    mocks.fetchSoftwareHeritageArchival.mockResolvedValue(null);
    const cv = makeCv([
      section("software", [
        item("S1", {
          meta: {
            repositoryUrl: "https://github.com/u/newer",
            swhCheckedAt: "2026-02-01T00:00:00.000Z",
          },
        }),
        item("S2", {
          meta: {
            repositoryUrl: "https://github.com/u/older",
            swhCheckedAt: "2026-01-01T00:00:00.000Z",
          },
        }),
        item("S3", { meta: { repositoryUrl: "https://github.com/u/fresh" } }),
        item("S4", {
          meta: {
            repositoryUrl: "https://github.com/u/archived",
            swhid: `swh:1:snp:${"c".repeat(40)}`,
            swhCheckedAt: "2025-01-01T00:00:00.000Z",
          },
        }),
      ]),
    ]);
    await enrichCvWithSoftwareHeritage(cv, NOW);
    expect(mocks.fetchSoftwareHeritageArchival.mock.calls.map((c) => c[0])).toEqual([
      "https://github.com/u/fresh",
      "https://github.com/u/older",
      "https://github.com/u/newer",
    ]);
  });

  it("uses the csl.type field too (a software work routed via OpenAlex CSL)", async () => {
    mocks.fetchSoftwareHeritageArchival.mockResolvedValue(SWHID);
    const cv = makeCv([
      section("datasets", [
        item("S1", {
          csl: csl({ type: "software" }),
          meta: { repositoryUrl: "https://github.com/user/repo" },
        }),
      ]),
    ]);
    const out = await enrichCvWithSoftwareHeritage(cv);
    expect(out.sections[0]!.items[0]!.meta.swhid).toBe(SWHID.swhid);
  });
});

// ─── enrichCvWithSciety ────────────────────────────────────────────────────────

describe("enrichCvWithSciety", () => {
  const EVAL = [{ group: "eLife", type: "evaluation-summary", url: "https://x/1", date: "2024" }];

  it("folds public evaluations onto DOI-bearing preprints", async () => {
    mocks.fetchScietyEvaluations.mockImplementation(async (doi: string) =>
      doi === "10.1/x" ? EVAL : [],
    );
    const cv = makeCv([
      section("preprints", [
        item("PP1", { csl: csl({ DOI: "10.1/x" }) }),
        item("PP2", { csl: csl({ DOI: "10.1/y" }) }),
      ]),
    ]);
    const out = await enrichCvWithSciety(cv);
    expect(out.sections[0]!.items[0]!.meta.publicEvaluations).toEqual(EVAL);
    expect(out.sections[0]!.items[1]!.meta.publicEvaluations).toBeUndefined();
    expect(out.provenance.sources).toContain("sciety");
  });

  it("only targets the preprints section", async () => {
    const f = mocks.fetchScietyEvaluations;
    const cv = makeCv([section("publications", [item("W1", { csl: csl({ DOI: "10.1/x" }) })])]);
    expect(await enrichCvWithSciety(cv)).toBe(cv);
    expect(f).not.toHaveBeenCalled();
  });

  it("stamps the sentinel only (no provenance) when there are no evaluations, keeping an earlier list", async () => {
    mocks.fetchScietyEvaluations.mockResolvedValue([]);
    const cv = makeCv([
      section("preprints", [
        item("PP1", { csl: csl({ DOI: "10.1/x" }) }),
        item("PP2", { csl: csl({ DOI: "10.1/y" }), meta: { publicEvaluations: EVAL } }),
      ]),
    ]);
    const out = await enrichCvWithSciety(cv, NOW);
    expect(out.sections[0]!.items[0]!.meta).toEqual({ publicEvaluationsCheckedAt: NOW });
    expect(out.sections[0]!.items[1]!.meta).toEqual({
      publicEvaluations: EVAL,
      publicEvaluationsCheckedAt: NOW,
    });
    expect(out.provenance.sources).not.toContain("sciety");
  });

  it("queues never-checked preprints first, then oldest-checked", async () => {
    mocks.fetchScietyEvaluations.mockResolvedValue([]);
    const cv = makeCv([
      section("preprints", [
        item("PP1", {
          csl: csl({ DOI: "10.1/newer" }),
          meta: { publicEvaluationsCheckedAt: "2026-02-01T00:00:00.000Z" },
        }),
        item("PP2", {
          csl: csl({ DOI: "10.1/older" }),
          meta: { publicEvaluationsCheckedAt: "2026-01-01T00:00:00.000Z" },
        }),
        item("PP3", { csl: csl({ DOI: "10.1/fresh" }) }),
      ]),
    ]);
    await enrichCvWithSciety(cv, NOW);
    expect(mocks.fetchScietyEvaluations.mock.calls.map((c) => c[0])).toEqual([
      "10.1/fresh",
      "10.1/older",
      "10.1/newer",
    ]);
  });

  it("skips hidden preprints", async () => {
    const f = mocks.fetchScietyEvaluations;
    const cv = makeCv([
      section("preprints", [item("PP1", { csl: csl({ DOI: "10.1/x" }), notMine: true })]),
    ]);
    expect(await enrichCvWithSciety(cv)).toBe(cv);
    expect(f).not.toHaveBeenCalled();
  });
});
