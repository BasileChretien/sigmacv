import { createHmac, timingSafeEqual } from "node:crypto";
import { getEnv } from "@/lib/env";

/**
 * Signed tokens for the contact-email DOUBLE OPT-IN: the link mailed to a
 * newly-entered notification address proves the recipient controls it before
 * any digest is ever sent there. Same construction family as
 * `unsubscribeToken.ts` (AUTH_SECRET-keyed HMAC) but deliberately
 * incompatible: a different purpose string is part of the signed input AND the
 * payload is a JSON object (userId + email + expiry), so neither token kind
 * can ever verify as the other. Unlike unsubscribe links, these EXPIRE — a
 * confirmation must be a fresh, deliberate act.
 */

const PURPOSE = "confirm-contact-email";
export const CONFIRM_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const TOKEN_MAX = 1024;

interface ConfirmPayload {
  /** User id the confirmation belongs to. */
  u: string;
  /** The exact address being confirmed (must still be the pending one). */
  e: string;
  /** Expiry, epoch ms. */
  x: number;
}

function sign(payloadB64: string): Buffer {
  return createHmac("sha256", getEnv().AUTH_SECRET).update(`${PURPOSE}:${payloadB64}`).digest();
}

/** Token for the confirmation URL (`?token=…`). `now` injectable for tests. */
export function buildConfirmToken(userId: string, email: string, now = Date.now()): string {
  const payload: ConfirmPayload = { u: userId, e: email, x: now + CONFIRM_TOKEN_TTL_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${payloadB64}.${sign(payloadB64).toString("base64url")}`;
}

/** The {userId, email} a valid, unexpired token confirms — null otherwise. */
export function verifyConfirmToken(
  token: unknown,
  now = Date.now(),
): { userId: string; email: string } | null {
  if (typeof token !== "string" || token.length === 0 || token.length > TOKEN_MAX) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = token.slice(0, dot);
  const sig = Buffer.from(token.slice(dot + 1), "base64url");
  const expected = sign(payloadB64);
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null;

  let payload: unknown;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    /* signed garbage can't happen in practice, but never throw on input */
    return null;
  }
  const p = payload as Partial<ConfirmPayload> | null;
  if (
    !p ||
    typeof p.u !== "string" ||
    p.u.length === 0 ||
    typeof p.e !== "string" ||
    p.e.length === 0 ||
    typeof p.x !== "number"
  ) {
    return null;
  }
  if (now > p.x) return null; // expired
  return { userId: p.u, email: p.e };
}
