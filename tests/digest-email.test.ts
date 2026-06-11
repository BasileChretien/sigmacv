import { beforeEach, describe, expect, it, vi } from "vitest";

// getEnv() needs the minimal valid env; AUTH_SECRET also keys the unsubscribe
// token HMAC. EMAIL_* make the mailer "configured" (transport is mocked below).
Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "test-secret-test-secret-123",
  AUTH_URL: "https://cv.example.org",
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
  EMAIL_SERVER: "smtp://user:pass@mail.example.org:587",
  EMAIL_FROM: "SigmaCV <no-reply@example.org>",
});

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  sendMail: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findMany: mocks.findMany,
      findUnique: mocks.findUnique,
      update: mocks.update,
      updateMany: mocks.updateMany,
    },
  },
}));
vi.mock("nodemailer", () => ({
  default: { createTransport: () => ({ sendMail: mocks.sendMail }) },
}));

import {
  DIGEST_MIN_INTERVAL_MS,
  DIGEST_TITLES_MAX,
  buildDigestContent,
  digestEligible,
  getDigestOptIn,
  sendDueDigests,
  setDigestOptIn,
  unsubscribeByToken,
} from "@/lib/email/digest";
import { buildUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/email/unsubscribeToken";
import { isMailerConfigured, sendMail } from "@/lib/email/mailer";
import { isAuthorizedInternalRequest, safeSecretEqual } from "@/lib/security/internalAuth";
import type { SyncReport } from "@/lib/cv/syncReport";

const NOW = new Date("2026-06-11T12:00:00.000Z");

function makeReport(over: Partial<SyncReport> = {}): SyncReport {
  return {
    syncedAt: "2026-06-10T00:00:00.000Z",
    initial: false,
    addedTotal: 3,
    removedTotal: 1,
    added: [
      { sectionType: "publications", itemId: "W1", title: "A new paper" },
      { sectionType: "grants", itemId: "G1", title: "A new grant", reviewFlag: "name-matched" },
    ],
    reviewCandidates: 1,
    ...over,
  };
}

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  mocks.sendMail.mockResolvedValue({});
  mocks.update.mockResolvedValue({});
  mocks.updateMany.mockResolvedValue({ count: 1 });
});

describe("unsubscribe token", () => {
  it("round-trips and rejects tampering", () => {
    const token = buildUnsubscribeToken("user_123");
    expect(verifyUnsubscribeToken(token)).toBe("user_123");
    expect(verifyUnsubscribeToken(`${token}x`)).toBeNull(); // bad signature
    const [id, sig] = token.split(".") as [string, string];
    const otherId = Buffer.from("user_456", "utf8").toString("base64url");
    expect(verifyUnsubscribeToken(`${otherId}.${sig}`)).toBeNull(); // swapped user
    expect(verifyUnsubscribeToken(`${id}.`)).toBeNull();
  });

  it("rejects malformed input outright", () => {
    expect(verifyUnsubscribeToken(null)).toBeNull();
    expect(verifyUnsubscribeToken(42)).toBeNull();
    expect(verifyUnsubscribeToken("")).toBeNull();
    expect(verifyUnsubscribeToken("no-dot")).toBeNull();
    expect(verifyUnsubscribeToken(".sig-only")).toBeNull();
    expect(verifyUnsubscribeToken("x".repeat(600))).toBeNull(); // over the cap
    const longId = Buffer.from("u".repeat(200), "utf8").toString("base64url");
    expect(verifyUnsubscribeToken(`${longId}.abcd`)).toBeNull(); // userId too long
  });
});

describe("internal auth helper", () => {
  it("compares secrets in constant time without length leaks", () => {
    expect(safeSecretEqual("abc", "abc")).toBe(true);
    expect(safeSecretEqual("abc", "abd")).toBe(false);
    expect(safeSecretEqual("abc", "abcd")).toBe(false);
    expect(safeSecretEqual("", "")).toBe(true);
  });

  it("accepts the Bearer header and the optional fallback header", () => {
    const bearer = new Request("http://x", { headers: { authorization: "Bearer s3cret" } });
    expect(isAuthorizedInternalRequest(bearer, "s3cret")).toBe(true);
    expect(isAuthorizedInternalRequest(bearer, "other")).toBe(false);
    const fallback = new Request("http://x", { headers: { "x-resync-secret": "s3cret" } });
    expect(isAuthorizedInternalRequest(fallback, "s3cret", "x-resync-secret")).toBe(true);
    expect(isAuthorizedInternalRequest(fallback, "s3cret")).toBe(false); // no fallback allowed
    expect(isAuthorizedInternalRequest(new Request("http://x"), "s3cret")).toBe(false);
  });
});

describe("mailer", () => {
  it("is configured by the test env and sends with one-click unsubscribe headers", async () => {
    expect(isMailerConfigured()).toBe(true);
    const ok = await sendMail({
      to: "a@example.org",
      subject: "S",
      text: "T",
      unsubscribeUrl: "https://cv.example.org/api/email/unsubscribe?token=t",
    });
    expect(ok).toBe(true);
    const arg = mocks.sendMail.mock.calls[0]![0] as Record<string, unknown>;
    expect(arg.to).toBe("a@example.org");
    expect(arg.list).toMatchObject({ unsubscribe: { url: expect.stringContaining("token=t") } });
    expect(arg.headers).toMatchObject({ "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" });
  });

  it("fails soft when the transport throws", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.sendMail.mockRejectedValue(new Error("550"));
    expect(await sendMail({ to: "a@example.org", subject: "S", text: "T" })).toBe(false);
  });
});

describe("digestEligible", () => {
  it("requires a real, changed, post-initial report", () => {
    expect(digestEligible(null, null, NOW)).toBe(false);
    expect(digestEligible(makeReport({ initial: true }), null, NOW)).toBe(false);
    expect(
      digestEligible(
        makeReport({ addedTotal: 0, removedTotal: 0, reviewCandidates: 0, added: [] }),
        null,
        NOW,
      ),
    ).toBe(false);
    expect(digestEligible(makeReport(), null, NOW)).toBe(true);
  });

  it("enforces the per-user monthly floor and report freshness", () => {
    const recent = new Date(NOW.getTime() - DIGEST_MIN_INTERVAL_MS + 60_000);
    expect(digestEligible(makeReport(), recent, NOW)).toBe(false);
    const longAgo = new Date("2026-01-01T00:00:00.000Z");
    expect(digestEligible(makeReport(), longAgo, NOW)).toBe(true);
    // The report predates the last digest → already told; nothing new.
    const afterReport = new Date("2026-06-10T06:00:00.000Z");
    expect(
      digestEligible(makeReport({ syncedAt: "2026-05-01T00:00:00.000Z" }), afterReport, NOW),
    ).toBe(false);
    // An unparseable syncedAt can never satisfy "newer than the last digest".
    expect(digestEligible(makeReport({ syncedAt: "garbage" }), longAgo, NOW)).toBe(false);
  });
});

describe("buildDigestContent", () => {
  it("composes a localized plain-text mail with capped titles", () => {
    const many = Array.from({ length: DIGEST_TITLES_MAX + 3 }, (_, i) => ({
      sectionType: "publications" as const,
      itemId: `W${i}`,
      title: `Paper ${i}`,
    }));
    const { subject, text } = buildDigestContent({
      report: makeReport({ added: many, addedTotal: many.length }),
      locale: "en-US",
      editorUrl: "https://cv.example.org/cv",
      unsubscribeUrl: "https://cv.example.org/api/email/unsubscribe?token=t",
    });
    expect(subject).toBe(`SigmaCV: ${many.length + 1} updates to your CV`); // added + removed
    expect(text).toContain("Paper 0");
    expect(text).toContain(`Paper ${DIGEST_TITLES_MAX - 1}`);
    expect(text).not.toContain(`Paper ${DIGEST_TITLES_MAX}`); // capped
    expect(text).toContain("…and 3 more");
    expect(text).toContain("1 entries are waiting for your review");
    expect(text).toContain("https://cv.example.org/cv");
    expect(text).toContain("token=t");
  });

  it("speaks the CV's language and skips empty lines/titles", () => {
    const { subject, text } = buildDigestContent({
      report: makeReport({
        added: [{ sectionType: "publications", itemId: "W1", title: "" }],
        addedTotal: 1,
        removedTotal: 0,
        reviewCandidates: 0,
      }),
      locale: "fr-FR",
      editorUrl: "https://cv.example.org/cv",
      unsubscribeUrl: "https://cv.example.org/u",
    });
    expect(subject).toContain("nouveautés");
    expect(text).toContain("1 nouvelles entrées");
    expect(text).not.toContain("– "); // blank title not listed
    expect(text).not.toContain("vérification"); // no review line when zero
  });
});

describe("sendDueDigests", () => {
  const baseUser = {
    id: "u1",
    email: "a@example.org",
    digestSentAt: null as Date | null,
    cv: {
      lastSyncReport: makeReport(),
      document: { display: { locale: "fr-FR" } },
    },
  };

  it("sends to due users, stamps digestSentAt, and skips the not-due", async () => {
    mocks.findMany.mockResolvedValue([
      baseUser,
      { ...baseUser, id: "u2", cv: { lastSyncReport: null, document: null } }, // no report
      {
        ...baseUser,
        id: "u3",
        digestSentAt: new Date(NOW.getTime() - 1000), // told a second ago
      },
    ]);
    const summary = await sendDueDigests({ now: NOW });
    expect(summary).toEqual({ configured: true, considered: 3, sent: 1, notDue: 2, failed: 0 });
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    const mail = mocks.sendMail.mock.calls[0]![0] as { to: string; subject: string; text: string };
    expect(mail.to).toBe("a@example.org");
    expect(mail.subject).toContain("nouveautés"); // CV locale, not the default
    expect(mail.text).toContain("https://cv.example.org/cv");
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { digestSentAt: NOW },
    });
  });

  it("does not stamp digestSentAt when the send fails (retries next run)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.findMany.mockResolvedValue([baseUser]);
    mocks.sendMail.mockRejectedValue(new Error("smtp down"));
    const summary = await sendDueDigests({ now: NOW });
    expect(summary.failed).toBe(1);
    expect(summary.sent).toBe(0);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("reports unconfigured (and queries nothing) without SMTP env", async () => {
    const prevServer = process.env.EMAIL_SERVER;
    delete process.env.EMAIL_SERVER;
    // env is parsed per getEnv() call against process.env — reset module cache.
    vi.resetModules();
    const { sendDueDigests: fresh } = await import("@/lib/email/digest");
    const summary = await fresh({ now: NOW });
    expect(summary.configured).toBe(false);
    expect(summary.sent).toBe(0);
    expect(mocks.findMany).not.toHaveBeenCalled();
    process.env.EMAIL_SERVER = prevServer;
    vi.resetModules();
  });
});

describe("opt-in helpers", () => {
  it("getDigestOptIn defaults to false for an unknown user", async () => {
    mocks.findUnique.mockResolvedValue(null);
    expect(await getDigestOptIn("nobody")).toBe(false);
    mocks.findUnique.mockResolvedValue({ digestOptIn: true });
    expect(await getDigestOptIn("u1")).toBe(true);
  });

  it("setDigestOptIn writes the flag", async () => {
    await setDigestOptIn("u1", true);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { digestOptIn: true },
    });
  });

  it("unsubscribeByToken flips the flag for a valid token only", async () => {
    expect(await unsubscribeByToken("garbage")).toBe(false);
    expect(mocks.updateMany).not.toHaveBeenCalled();
    expect(await unsubscribeByToken(buildUnsubscribeToken("u1"))).toBe(true);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { digestOptIn: false },
    });
  });
});
