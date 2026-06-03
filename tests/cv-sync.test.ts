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
  upsert: vi.fn(),
  update: vi.fn(),
  fetchWorks: vi.fn(),
  resolveAuthor: vi.fn(),
  fetchEditorial: vi.fn(),
  logCvSave: vi.fn(),
  canonicalizeInstitutions: vi.fn(),
  enrichCvWithCrossref: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    cv: { findUnique: mocks.findUnique, upsert: mocks.upsert, update: mocks.update },
  },
}));
vi.mock("@/lib/openalex/client", () => ({ fetchWorksByAuthorIds: mocks.fetchWorks }));
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
  fetchOrcidPeerReviews: vi.fn(async () => []),
}));
vi.mock("@/lib/datacite/client", () => ({ fetchDataciteOutputs: vi.fn(async () => []) }));
// Enrichment (ROR + Crossref) is covered by enrich.test.ts; keep it a no-op here.
vi.mock("@/lib/canonical/enrich", () => ({
  canonicalizeInstitutions: mocks.canonicalizeInstitutions,
  enrichCvWithCrossref: mocks.enrichCvWithCrossref,
  withRorProvenance: (cv: unknown) => cv,
}));

import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  CvNotFoundError,
  getCvForUser,
  getPublicCv,
  getPublishState,
  saveCvForUser,
  setPublishState,
  syncCvForUser,
} from "@/lib/cv/sync";
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
  mocks.canonicalizeInstitutions.mockImplementation(async (input) => ({ result: input, used: false }));
  mocks.enrichCvWithCrossref.mockImplementation(async (cv) => cv);
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

  it("builds an empty CV when the ORCID resolves to no OpenAlex author", async () => {
    mocks.findUnique.mockResolvedValue(null);
    mocks.resolveAuthor.mockResolvedValue(null);
    const cv = await syncCvForUser({ userId: "u1", orcid: RESOLVED.orcid, fallbackName: "X" });
    expect(cv.owner.displayName).toBe("X");
    expect(mocks.fetchWorks).not.toHaveBeenCalled();
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
});

describe("publish state", () => {
  it("reports defaults when no row exists", async () => {
    mocks.findUnique.mockResolvedValue(null);
    expect(await getPublishState("u1")).toEqual({ published: false, publicSlug: null });
  });

  it("mints a slug on first publish", async () => {
    mocks.findUnique.mockResolvedValue({ id: "abcd1234ef", document: DOC, publicSlug: null });
    mocks.update.mockResolvedValue({ published: true, publicSlug: "basile-chretien-abcd1234" });
    const state = await setPublishState("u1", true);
    expect(state.published).toBe(true);
    const slugArg = mocks.update.mock.calls[0]![0].data.publicSlug as string;
    expect(slugArg).toMatch(/^basile-chretien-/);
  });

  it("throws when publishing a non-existent CV", async () => {
    mocks.findUnique.mockResolvedValue(null);
    await expect(setPublishState("u1", true)).rejects.toBeInstanceOf(CvNotFoundError);
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
