import { describe, expect, it } from "vitest";

Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "test-secret-test-secret-123",
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
});

import {
  CONFIRM_TOKEN_TTL_MS,
  buildConfirmToken,
  verifyConfirmToken,
} from "@/lib/email/confirmToken";
import { buildUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/email/unsubscribeToken";

const NOW = Date.parse("2026-06-12T12:00:00.000Z");

describe("confirm token", () => {
  it("round-trips userId + email within the TTL", () => {
    const token = buildConfirmToken("u1", "me@lab.example", NOW);
    expect(verifyConfirmToken(token, NOW)).toEqual({ userId: "u1", email: "me@lab.example" });
    expect(verifyConfirmToken(token, NOW + CONFIRM_TOKEN_TTL_MS - 1000)).not.toBeNull();
  });

  it("expires after the TTL — a confirmation must be a fresh act", () => {
    const token = buildConfirmToken("u1", "me@lab.example", NOW);
    expect(verifyConfirmToken(token, NOW + CONFIRM_TOKEN_TTL_MS + 1000)).toBeNull();
  });

  it("rejects tampering with the payload or signature", () => {
    const token = buildConfirmToken("u1", "me@lab.example", NOW);
    const [payload, sig] = token.split(".") as [string, string];
    expect(verifyConfirmToken(`${payload}.${sig}x`, NOW)).toBeNull();
    // Re-encode a different email under the old signature.
    const forged = Buffer.from(
      JSON.stringify({ u: "u1", e: "attacker@evil.example", x: NOW + 1000 }),
      "utf8",
    ).toString("base64url");
    expect(verifyConfirmToken(`${forged}.${sig}`, NOW)).toBeNull();
  });

  it("rejects malformed input outright", () => {
    expect(verifyConfirmToken(null, NOW)).toBeNull();
    expect(verifyConfirmToken("", NOW)).toBeNull();
    expect(verifyConfirmToken("no-dot", NOW)).toBeNull();
    expect(verifyConfirmToken("x".repeat(1100), NOW)).toBeNull(); // over the cap
  });

  it("is purpose-separated from the unsubscribe token in BOTH directions", () => {
    const confirm = buildConfirmToken("u1", "me@lab.example", NOW);
    const unsub = buildUnsubscribeToken("u1");
    expect(verifyConfirmToken(unsub, NOW)).toBeNull();
    expect(verifyUnsubscribeToken(confirm)).toBeNull();
  });
});
