import { beforeEach, describe, expect, it, vi } from "vitest";

// previewFromOrcid pulls in @/lib/cv/sync (for buildCvFromOrcid + cvItemCount).
// Provide the minimal env so getEnv() doesn't throw at import; the DB + the heavy
// build + the citeproc render are mocked below, so no network/DB is touched.
Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
  // GDPR Art. 21 objection list: HMAC-SHA256(PREVIEW_SUPPRESSION_KEY, SUPPRESSED_ORCID).
  PREVIEW_SUPPRESSION_KEY: "x".repeat(20),
  PREVIEW_SUPPRESSED_ORCID_HMACS:
    "ba8feb6a1dc35f25cef729f4f66c12be0f9cd345cd0ff893bde5c5f9915a24fd",
});

const mocks = vi.hoisted(() => ({ build: vi.fn(), render: vi.fn(), recordWorkFunders: vi.fn() }));

// Keep the REAL cvItemCount (pure, operates on the CV the mock returns); only
// stub the DB-and-network build. projectCvForPreview runs for real.
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/cv/sync", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/cv/sync")>()),
  buildCvFromOrcid: mocks.build,
}));
vi.mock("@/lib/render/html", () => ({ renderCvHtml: mocks.render }));
// The OpenAlex funder crosswalk writer belongs to the AUTHENTICATED sync only:
// spied here so the anonymous preview path can be shown never to reach it.
vi.mock("@/lib/openalex/funders", () => ({ recordWorkFunders: mocks.recordWorkFunders }));

import { buildCanonicalCv } from "@/lib/canonical/build";
import { __resetOrcidPreviewCache } from "@/lib/cv/orcidPreviewCache";
import { normalizeOrcidForPreview, previewCvFromOrcid } from "@/lib/cv/previewFromOrcid";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const ORCID = "0000-0002-7483-2489";
/** On the objection list (see the env above); never built, never cached. */
const SUPPRESSED_ORCID = "0000-0002-1825-0097";

const okCv = buildCanonicalCv({
  id: "cv_ok",
  resolved: { orcid: ORCID, authorIds: ["A1"], displayName: "Basile Chrétien" },
  works,
  now: "2026-06-02T00:00:00.000Z",
});
const emptyCv = buildCanonicalCv({
  id: "cv_empty",
  resolved: { orcid: ORCID, authorIds: [], displayName: "" },
  works: [],
  now: "2026-06-02T00:00:00.000Z",
});

beforeEach(() => {
  mocks.build.mockReset();
  mocks.render.mockReset().mockReturnValue("<html>RENDERED</html>");
  mocks.recordWorkFunders.mockReset();
  __resetOrcidPreviewCache();
});

describe("normalizeOrcidForPreview", () => {
  it("accepts a bare iD, a URL, and a lowercase x check digit", () => {
    expect(normalizeOrcidForPreview(ORCID)).toBe(ORCID);
    expect(normalizeOrcidForPreview("https://orcid.org/0000-0002-7483-2489")).toBe(ORCID);
    expect(normalizeOrcidForPreview("0000-0002-1694-233x")).toBe("0000-0002-1694-233X");
  });
  it("rejects malformed input", () => {
    expect(normalizeOrcidForPreview("not-an-orcid")).toBeNull();
    expect(normalizeOrcidForPreview("1234")).toBeNull();
    expect(normalizeOrcidForPreview("")).toBeNull();
  });
  it("rejects a well-formed but checksum-invalid iD (a typo)", () => {
    // Correct check digit is 9 — this transposes it to 0.
    expect(normalizeOrcidForPreview("0000-0002-7483-2480")).toBeNull();
  });
});

describe("previewCvFromOrcid", () => {
  it("returns invalid for a malformed iD without building", async () => {
    const r = await previewCvFromOrcid("nope");
    expect(r).toEqual({ status: "invalid" });
    expect(mocks.build).not.toHaveBeenCalled();
  });

  it("returns invalid for a checksum-invalid iD without building", async () => {
    const r = await previewCvFromOrcid("0000-0002-7483-2480"); // valid shape, bad check digit
    expect(r).toEqual({ status: "invalid" });
    expect(mocks.build).not.toHaveBeenCalled();
  });

  it("returns a retryable error (never negative-cached) when the build throws", async () => {
    mocks.build.mockRejectedValueOnce(new Error("OpenAlex 503"));
    const r = await previewCvFromOrcid(ORCID);
    expect(r).toEqual({ status: "error", orcid: ORCID });
    // A transient failure must NOT poison the miss cache — a following build succeeds.
    mocks.build.mockResolvedValue({ cv: okCv, report: {} });
    const r2 = await previewCvFromOrcid(ORCID);
    expect(r2).toMatchObject({ status: "ok", name: "Basile Chrétien" });
    expect(mocks.build).toHaveBeenCalledTimes(2); // rebuilt, not short-circuited by a cache
  });

  it("builds, projects, renders, and caches an ok preview", async () => {
    mocks.build.mockResolvedValue({ cv: okCv, report: {} });
    const r = await previewCvFromOrcid(ORCID);
    expect(r).toMatchObject({
      status: "ok",
      orcid: ORCID,
      name: "Basile Chrétien",
      html: "<html>RENDERED</html>",
    });
    // The built CV object is returned (the interactive editor loads it).
    expect(r.status === "ok" && r.cv.owner.displayName).toBe("Basile Chrétien");
    // Second call is served from cache: no rebuild, no re-render.
    const r2 = await previewCvFromOrcid(ORCID);
    expect(r2).toMatchObject({ status: "ok", name: "Basile Chrétien" });
    expect(mocks.build).toHaveBeenCalledTimes(1);
    expect(mocks.render).toHaveBeenCalledTimes(1);
  });

  it("never writes the OpenAlex funder crosswalk — that is the authenticated sync's job, not the anonymous preview's", async () => {
    mocks.build.mockResolvedValue({ cv: okCv, report: {} });
    const r = await previewCvFromOrcid(ORCID);
    expect(r.status).toBe("ok");
    expect(mocks.recordWorkFunders).not.toHaveBeenCalled();
  });

  it("returns empty (and negatively caches) an ORCID with no public record", async () => {
    mocks.build.mockResolvedValue({ cv: emptyCv, report: {} });
    const r = await previewCvFromOrcid(ORCID);
    expect(r).toEqual({ status: "empty", orcid: ORCID });
    expect(mocks.render).not.toHaveBeenCalled();
    const r2 = await previewCvFromOrcid(ORCID);
    expect(r2).toEqual({ status: "empty", orcid: ORCID });
    expect(mocks.build).toHaveBeenCalledTimes(1); // negative cache short-circuits
  });

  it("answers an iD on the objection list exactly like an unknown iD, without building", async () => {
    mocks.build.mockResolvedValue({ cv: okCv, report: {} });
    const r = await previewCvFromOrcid(SUPPRESSED_ORCID);
    expect(r).toEqual({ status: "empty", orcid: SUPPRESSED_ORCID });
    expect(mocks.build).not.toHaveBeenCalled();
    expect(mocks.render).not.toHaveBeenCalled();
    // Same shape as a genuinely empty record — no "objected" tell.
    mocks.build.mockResolvedValue({ cv: emptyCv, report: {} });
    const unknown = await previewCvFromOrcid(ORCID);
    expect(Object.keys(unknown).sort()).toEqual(Object.keys(r).sort());
    expect(unknown.status).toBe(r.status);
  });

  it("normalizes URL/whitespace forms to the same cache key", async () => {
    mocks.build.mockResolvedValue({ cv: okCv, report: {} });
    await previewCvFromOrcid(`  https://orcid.org/${ORCID}  `);
    await previewCvFromOrcid(ORCID);
    expect(mocks.build).toHaveBeenCalledTimes(1); // one build for both forms
  });
});
