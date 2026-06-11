import { createHmac, timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/env";

/**
 * Signed one-click unsubscribe tokens for the digest email. The link must work
 * WITHOUT a session (RFC 8058 one-click lands from any mail client), so the
 * token itself is the authorization: `base64url(userId).base64url(HMAC)`,
 * keyed off AUTH_SECRET with a purpose prefix. No expiry — an unsubscribe link
 * should keep working indefinitely, and the only action it authorizes is
 * turning OFF an opt-in.
 */

const PURPOSE = "digest-unsubscribe";
const TOKEN_MAX = 512;
const USER_ID_MAX = 128;

function sign(userId: string): Buffer {
  return createHmac("sha256", getEnv().AUTH_SECRET).update(`${PURPOSE}:${userId}`).digest();
}

/** Token for the unsubscribe URL (`?token=…`). */
export function buildUnsubscribeToken(userId: string): string {
  const id = Buffer.from(userId, "utf8").toString("base64url");
  return `${id}.${sign(userId).toString("base64url")}`;
}

/** The userId a valid token authorizes, or null for anything malformed/forged. */
export function verifyUnsubscribeToken(token: unknown): string | null {
  if (typeof token !== "string" || token.length === 0 || token.length > TOKEN_MAX) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  // Buffer.from(.., "base64url") never throws — invalid characters are skipped,
  // so a garbled token simply fails the HMAC comparison below.
  const userId = Buffer.from(token.slice(0, dot), "base64url").toString("utf8");
  const sig = Buffer.from(token.slice(dot + 1), "base64url");
  if (!userId || userId.length > USER_ID_MAX) return null;
  const expected = sign(userId);
  if (sig.length !== expected.length) return null;
  return timingSafeEqual(sig, expected) ? userId : null;
}
