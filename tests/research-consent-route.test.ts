import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * /api/account/consent and /api/account/consent/record: the electronic consent
 * of study 2026-0310. Every grant and every withdrawal writes a
 * ResearchConsentRecord in the same transaction as the User fields.
 */

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  rateLimit: vi.fn(async (): Promise<{ ok: boolean; retryAfterSec?: number }> => ({ ok: true })),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
  eventDeleteMany: vi.fn(),
  recordCreate: vi.fn(),
  recordFindFirst: vi.fn(),
  recordFindMany: vi.fn(),
  recordCount: vi.fn(),
  transaction: vi.fn(),
}));

const tx = {
  user: { findUnique: mocks.userFindUnique, update: mocks.userUpdate },
  researchEvent: { deleteMany: mocks.eventDeleteMany },
  researchConsentRecord: { create: mocks.recordCreate },
};

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: mocks.rateLimit }));
vi.mock("@/lib/security/origin", () => ({
  isSameOrigin: (req: Request) =>
    (req.headers.get("origin") ?? "http://localhost:3000") === "http://localhost:3000",
}));
vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: mocks.userFindUnique, update: mocks.userUpdate },
    researchEvent: { deleteMany: mocks.eventDeleteMany },
    researchConsentRecord: {
      create: mocks.recordCreate,
      findFirst: mocks.recordFindFirst,
      findMany: mocks.recordFindMany,
      count: mocks.recordCount,
    },
    $transaction: mocks.transaction,
  },
}));

import { GET, POST } from "@/app/api/account/consent/route";
import { GET as GET_RECORD } from "@/app/api/account/consent/record/route";
import { RESEARCH_CONSENT_VERSION } from "@/lib/research/log";

const ORIGIN = "http://localhost:3000";
function post(body: unknown, origin = ORIGIN) {
  return POST(
    new Request(`${ORIGIN}/api/account/consent`, {
      method: "POST",
      headers: { "content-type": "application/json", origin },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

const GRANT = {
  consent: true,
  version: RESEARCH_CONSENT_VERSION,
  locale: "en-US",
  agreeRequired: true,
};
/** The user row the transactions read first. */
const NOT_CONSENTING = { researchConsent: false, researchConsentVersion: null };
const CONSENTING = { researchConsent: true, researchConsentVersion: RESEARCH_CONSENT_VERSION };
const STALE = { researchConsent: true, researchConsentVersion: 1 };

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  mocks.auth.mockResolvedValue({ user: { id: "u1" } });
  mocks.rateLimit.mockResolvedValue({ ok: true });
  // The array form records the queued calls; the callback form runs on `tx`.
  mocks.transaction.mockImplementation(async (arg: unknown) =>
    typeof arg === "function" ? (arg as (t: typeof tx) => Promise<unknown>)(tx) : arg,
  );
  mocks.userUpdate.mockReturnValue("user.update");
  mocks.recordCreate.mockReturnValue("record.create");
  process.env.RESEARCH_LOGGING_ENABLED = "true";
});

afterEach(() => {
  delete process.env.RESEARCH_LOGGING_ENABLED;
});

describe("POST /api/account/consent — grant", () => {
  it("stamps the user and writes a grant record in ONE transaction (checkbox ② unticked)", async () => {
    mocks.userFindUnique.mockResolvedValue(NOT_CONSENTING);
    const order: string[] = [];
    mocks.eventDeleteMany.mockImplementation(async () => order.push("events.deleteMany"));
    mocks.userUpdate.mockImplementation(async () => order.push("user.update"));
    mocks.recordCreate.mockImplementation(async () => order.push("record.create"));
    const res = await post(GRANT);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, consent: true });

    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(typeof mocks.transaction.mock.calls[0]![0]).toBe("function");
    // Only a consent already current keeps its events; anything else starts clean.
    expect(order).toEqual(["events.deleteMany", "user.update", "record.create"]);
    const update = mocks.userUpdate.mock.calls[0]![0] as {
      where: unknown;
      data: { researchConsentAt: Date };
    };
    expect(update.where).toEqual({ id: "u1" });
    expect(update.data).toMatchObject({
      researchConsent: true,
      researchConsentVersion: RESEARCH_CONSENT_VERSION,
    });
    const record = mocks.recordCreate.mock.calls[0]![0] as { data: Record<string, unknown> };
    expect(record.data).toEqual({
      userId: "u1",
      action: "grant",
      at: update.data.researchConsentAt,
      version: RESEARCH_CONSENT_VERSION,
      locale: "en-US",
      agreeRequired: true,
      secondaryUse: false,
    });
  });

  it("deletes the events collected under an older consent when the approved one is given", async () => {
    // A version-1 consent was the notice shown before approval: its events must
    // not travel on under the version-2 consent the person now gives.
    mocks.userFindUnique.mockResolvedValue(STALE);
    const order: string[] = [];
    mocks.eventDeleteMany.mockImplementation(async () => order.push("events.deleteMany"));
    mocks.userUpdate.mockImplementation(async () => order.push("user.update"));
    mocks.recordCreate.mockImplementation(async () => order.push("record.create"));
    expect((await post(GRANT)).status).toBe(200);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(order).toEqual(["events.deleteMany", "user.update", "record.create"]);
    expect(mocks.eventDeleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });

  it("deletes stray events of a user holding no consent but an older version on record", async () => {
    mocks.userFindUnique.mockResolvedValue({ researchConsent: false, researchConsentVersion: 1 });
    expect((await post(GRANT)).status).toBe(200);
    expect(mocks.eventDeleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });

  it("keeps the events of a current consent given again (a second tab)", async () => {
    mocks.userFindUnique.mockResolvedValue(CONSENTING);
    expect((await post(GRANT)).status).toBe(200);
    expect(mocks.eventDeleteMany).not.toHaveBeenCalled();
    expect(mocks.recordCreate).toHaveBeenCalledTimes(1);
  });

  it("records checkbox ② and the Japanese text when that is what was shown", async () => {
    mocks.userFindUnique.mockResolvedValue(NOT_CONSENTING);
    expect((await post({ ...GRANT, locale: "ja-JP", secondaryUse: true })).status).toBe(200);
    const record = mocks.recordCreate.mock.calls[0]![0] as { data: Record<string, unknown> };
    expect(record.data).toMatchObject({ locale: "ja-JP", secondaryUse: true });
  });

  it("refuses a grant for a replaced consent version (409 stale_version) and records nothing", async () => {
    const res = await post({ ...GRANT, version: RESEARCH_CONSENT_VERSION - 1 });
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code: "stale_version" });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("refuses a grant while the study is closed (the master switch off)", async () => {
    delete process.env.RESEARCH_LOGGING_ENABLED;
    const res = await post(GRANT);
    expect(res.status).toBe(409);
    expect(await res.json()).toMatchObject({ code: "closed" });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

describe("POST /api/account/consent — withdrawal", () => {
  it("deletes the events, clears the user and writes the withdraw record in the same transaction", async () => {
    mocks.userFindUnique.mockResolvedValue(CONSENTING);
    const order: string[] = [];
    mocks.eventDeleteMany.mockImplementation(async () => order.push("events.deleteMany"));
    mocks.userUpdate.mockImplementation(async () => order.push("user.update"));
    mocks.recordCreate.mockImplementation(async () => order.push("record.create"));

    const res = await post({ consent: false, locale: "ja-JP" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, consent: false, withdrawn: true });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(typeof mocks.transaction.mock.calls[0]![0]).toBe("function");
    expect(order).toEqual(["events.deleteMany", "user.update", "record.create"]);
    expect(mocks.eventDeleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { researchConsent: false, researchConsentAt: null, researchConsentVersion: null },
    });
    expect(mocks.recordCreate).toHaveBeenCalledWith({
      data: {
        userId: "u1",
        action: "withdraw",
        version: RESEARCH_CONSENT_VERSION,
        locale: "ja-JP",
        agreeRequired: null,
        secondaryUse: null,
      },
    });
  });

  it("names the version withdrawn from: an older consent stays an older consent", async () => {
    mocks.userFindUnique.mockResolvedValue(STALE);
    expect((await post({ consent: false })).status).toBe(200);
    expect(mocks.recordCreate.mock.calls[0]![0]).toMatchObject({
      data: { action: "withdraw", version: 1, locale: null },
    });
  });

  it("stays possible while the study is closed", async () => {
    delete process.env.RESEARCH_LOGGING_ENABLED;
    mocks.userFindUnique.mockResolvedValue(CONSENTING);
    expect((await post({ consent: false })).status).toBe(200);
    expect(mocks.recordCreate.mock.calls[0]![0]).toMatchObject({
      data: { action: "withdraw", version: RESEARCH_CONSENT_VERSION },
    });
  });

  it.each([
    ["a user who never consented", NOT_CONSENTING],
    ["an account that is gone", null],
  ])("is a no-op for %s: no record, no user write, the events still swept", async (_l, row) => {
    // E.g. a second tab confirming "Stop" again: nothing was granted, so no
    // withdrawal is recorded.
    mocks.userFindUnique.mockResolvedValue(row);
    const res = await post({ consent: false });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, consent: false, withdrawn: false });
    expect(mocks.eventDeleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
    expect(mocks.userUpdate).not.toHaveBeenCalled();
    expect(mocks.recordCreate).not.toHaveBeenCalled();
  });
});

describe("POST /api/account/consent — refusals", () => {
  it("401 signed out, 403 cross-origin, 429 rate-limited", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await post(GRANT)).status).toBe(401);

    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    expect((await post(GRANT, "https://evil.example")).status).toBe(403);

    mocks.rateLimit.mockResolvedValue({ ok: false, retryAfterSec: 60 });
    const limited = await post(GRANT);
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("60");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("400 invalid JSON, 413 too large", async () => {
    expect((await post("{not json")).status).toBe(400);
    expect((await post({ ...GRANT, pad: "x".repeat(3_000) })).status).toBe(413);
  });

  it.each([
    ["no consent field", {}],
    ["a non-boolean consent", { consent: "yes" }],
    ["a grant without a version", { consent: true, locale: "en-US", agreeRequired: true }],
    [
      "a grant without the language shown",
      { consent: true, version: RESEARCH_CONSENT_VERSION, agreeRequired: true },
    ],
    [
      "a grant without checkbox ①",
      { consent: true, version: RESEARCH_CONSENT_VERSION, locale: "en-US" },
    ],
    ["a grant with checkbox ① unticked", { ...GRANT, agreeRequired: false }],
    ["checkbox ① on a withdrawal", { consent: false, agreeRequired: true }],
    ["a language the committee has not approved", { ...GRANT, locale: "fr-FR" }],
    ["a non-boolean checkbox ②", { ...GRANT, secondaryUse: "true" }],
    ["an unknown key", { ...GRANT, name: "Ada" }],
    ["checkbox ② on a withdrawal", { consent: false, secondaryUse: true }],
  ])("422 for %s, and nothing is written", async (_label, body) => {
    const res = await post(body);
    expect(res.status).toBe(422);
    expect((await res.json()).error).toMatch(/consent: true/);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

describe("GET /api/account/consent", () => {
  it("401 signed out, 429 rate-limited", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await GET()).status).toBe(401);
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    mocks.rateLimit.mockResolvedValue({ ok: false, retryAfterSec: 9 });
    expect((await GET()).status).toBe(429);
  });

  it("reports current participation with the language, document and checkbox ② of the grant", async () => {
    mocks.userFindUnique.mockResolvedValue({
      researchConsent: true,
      researchConsentAt: new Date("2026-10-22T07:31:00Z"),
      researchConsentVersion: RESEARCH_CONSENT_VERSION,
    });
    mocks.recordFindFirst.mockResolvedValue({
      action: "grant",
      at: new Date("2026-10-22T07:31:00Z"),
      version: RESEARCH_CONSENT_VERSION,
      locale: "ja-JP",
      secondaryUse: true,
    });
    mocks.recordCount.mockResolvedValue(1);
    const res = await GET();
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({
      open: true,
      state: "current",
      since: "2026-10-22T07:31:00.000Z",
      version: RESEARCH_CONSENT_VERSION,
      locale: "ja-JP",
      documentVersion: "第1.1版, 2026-07-08",
      documentLabel: "説明文書 第1.1版（2026-07-08）",
      secondaryUse: true,
      hasRecords: true,
    });
    expect(mocks.recordFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u1", action: "grant" },
        orderBy: { at: "desc" },
      }),
    );
  });

  it("reports a consent under the replaced version as stale, and the study as closed while off", async () => {
    delete process.env.RESEARCH_LOGGING_ENABLED;
    mocks.userFindUnique.mockResolvedValue({
      researchConsent: true,
      researchConsentAt: new Date("2026-06-01T00:00:00Z"),
      researchConsentVersion: 1,
    });
    mocks.recordFindFirst.mockResolvedValue(null);
    mocks.recordCount.mockResolvedValue(0);
    expect(await (await GET()).json()).toMatchObject({
      open: false,
      state: "stale",
      version: 1,
      documentVersion: null,
      documentLabel: null,
      hasRecords: false,
    });
  });
});

describe("GET /api/account/consent/record", () => {
  it("401 signed out, 429 rate-limited", async () => {
    mocks.auth.mockResolvedValue(null);
    expect((await GET_RECORD()).status).toBe(401);
    mocks.auth.mockResolvedValue({ user: { id: "u1" } });
    mocks.rateLimit.mockResolvedValue({ ok: false, retryAfterSec: 5 });
    expect((await GET_RECORD()).status).toBe(429);
  });

  it("downloads the user's grants and withdrawals, oldest first, naming no one", async () => {
    mocks.recordFindMany.mockResolvedValue([
      {
        action: "grant",
        at: new Date("2026-10-22T07:31:00Z"),
        version: 2,
        locale: "en-US",
        agreeRequired: true,
        secondaryUse: false,
      },
      {
        action: "withdraw",
        at: new Date("2026-10-23T08:00:00Z"),
        version: 2,
        locale: null,
        agreeRequired: null,
        secondaryUse: null,
      },
    ]);
    const res = await GET_RECORD();
    expect(res.status).toBe(200);
    expect(res.headers.get("content-disposition")).toMatch(/attachment; filename=/);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body.study).toMatchObject({ approvalNumber: "2026-0310" });
    expect(body.records).toEqual([
      {
        action: "grant",
        at: "2026-10-22T07:31:00.000Z",
        consentVersion: 2,
        language: "en-US",
        document: "Version 1.0, 2026-06-05",
        agreeRequired: true,
        secondaryUse: false,
      },
      {
        action: "withdraw",
        at: "2026-10-23T08:00:00.000Z",
        consentVersion: 2,
        language: null,
        document: null,
        agreeRequired: null,
        secondaryUse: null,
      },
    ]);
    expect(mocks.recordFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "u1" }, orderBy: { at: "asc" } }),
    );
    expect(JSON.stringify(body)).not.toMatch(/u1/);
  });
});
