import { beforeEach, describe, expect, it, vi } from "vitest";

Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
  AUTH_URL: "https://sigmacv.test",
});

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  enforceRateLimit: vi.fn(),
  isSameOrigin: vi.fn(),
  getPublishState: vi.fn(),
  setPublishState: vi.fn(),
  CvNotFoundError: class CvNotFoundError extends Error {},
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock("@/lib/security/origin", () => ({ isSameOrigin: mocks.isSameOrigin }));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/cv/sync", () => ({
  CvNotFoundError: mocks.CvNotFoundError,
  getPublishState: mocks.getPublishState,
  setPublishState: mocks.setPublishState,
}));

import { GET, POST } from "@/app/api/cv/publish/route";
import { InstitutionConsentError } from "@/lib/cv/institutionConsent";

const STATE = {
  published: true,
  publicSlug: "ada-x7",
  indexable: true,
  listUnderAffiliation: true,
  affiliationRorId: "04chrp450",
  showOnInstitutionPage: true,
  consentedRorIds: ["04chrp450"],
  currentAffiliations: [{ rorId: "04chrp450", name: "Nagoya University" }],
  visibleCurrentRorIds: ["04chrp450"],
  lapsedRorIds: [],
};

function post(body: unknown): Request {
  return new Request("https://sigmacv.test/api/cv/publish", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  for (const m of Object.values(mocks))
    if (typeof m === "function" && "mockReset" in m) m.mockReset();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  mocks.enforceRateLimit.mockResolvedValue({ ok: true });
  mocks.isSameOrigin.mockReturnValue(true);
  mocks.getPublishState.mockResolvedValue(STATE);
  mocks.setPublishState.mockResolvedValue(STATE);
});

describe("/api/cv/publish", () => {
  it("GET returns the full publish state, incl. the affiliation-listing opt-in + ROR key", async () => {
    expect(await (await GET()).json()).toEqual(STATE);
  });

  it("POST forwards the affiliation-listing opt-in (default false) to the state setter", async () => {
    const res = await POST(post({ published: true, indexable: true, listUnderAffiliation: true }));
    expect(res.status).toBe(200);
    expect(mocks.setPublishState).toHaveBeenCalledWith("u1", true, true, true, undefined);
    expect(await res.json()).toEqual(STATE);

    mocks.setPublishState.mockClear();
    await POST(post({ published: true }));
    expect(mocks.setPublishState).toHaveBeenCalledWith("u1", true, false, false, undefined);
  });

  describe("institution-page consent", () => {
    it("forwards the toggle + ticked ROR ids, and leaves the stored choice alone when unmentioned", async () => {
      const res = await POST(
        post({
          published: true,
          indexable: true,
          showOnInstitutionPage: true,
          consentedRorIds: ["04chrp450", "04d9jrx35"],
        }),
      );
      expect(res.status).toBe(200);
      expect(mocks.setPublishState).toHaveBeenCalledWith("u1", true, true, false, {
        show: true,
        rorIds: ["04chrp450", "04d9jrx35"],
      });
      // The response carries the picker + the re-ask so the UI needs no second call.
      expect(await res.json()).toMatchObject({
        showOnInstitutionPage: true,
        consentedRorIds: ["04chrp450"],
        visibleCurrentRorIds: ["04chrp450"],
        lapsedRorIds: [],
      });

      mocks.setPublishState.mockClear();
      await POST(post({ published: true, indexable: true, showOnInstitutionPage: false }));
      expect(mocks.setPublishState).toHaveBeenCalledWith("u1", true, true, false, {
        show: false,
        rorIds: [],
      });

      mocks.setPublishState.mockClear();
      await POST(post({ published: true, indexable: true, consentedRorIds: ["04chrp450"] }));
      expect(mocks.setPublishState).toHaveBeenCalledWith("u1", true, true, false, {
        show: true,
        rorIds: ["04chrp450"],
      });
    });

    it("rejects a malformed ROR id, a non-array, or more than five ids with 422 before touching the store", async () => {
      for (const consentedRorIds of [
        ["https://ror.org/04chrp450"],
        ["04CHRP450"],
        "04chrp450",
        ["04chrp450", "04d9jrx35", "02kpeqv85", "03vek6s52", "05f0yaq80", "01an7q238"],
      ]) {
        const res = await POST(
          post({ published: true, showOnInstitutionPage: true, consentedRorIds }),
        );
        expect(res.status).toBe(422);
      }
      expect(mocks.setPublishState).not.toHaveBeenCalled();
    });

    it("answers 422 naming the ids that are not visible current affiliations of the stored CV", async () => {
      mocks.setPublishState.mockRejectedValue(
        new InstitutionConsentError("Not a visible current affiliation of this CV: 02kpeqv85", [
          "02kpeqv85",
        ]),
      );
      const res = await POST(
        post({
          published: true,
          indexable: true,
          showOnInstitutionPage: true,
          consentedRorIds: ["02kpeqv85"],
        }),
      );
      expect(res.status).toBe(422);
      expect(await res.json()).toEqual({
        error: "Not a visible current affiliation of this CV: 02kpeqv85",
        unknownRorIds: ["02kpeqv85"],
      });
    });
  });

  it("rejects a non-boolean opt-in with 422", async () => {
    const res = await POST(post({ published: true, listUnderAffiliation: "yes" }));
    expect(res.status).toBe(422);
    expect(mocks.setPublishState).not.toHaveBeenCalled();
  });

  it("requires a session and a same-origin request", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await POST(post({ published: true }))).status).toBe(401);
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    mocks.isSameOrigin.mockReturnValue(false);
    expect((await POST(post({ published: true }))).status).toBe(403);
  });
});
