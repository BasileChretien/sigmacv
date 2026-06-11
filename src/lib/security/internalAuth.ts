import { timingSafeEqual } from "node:crypto";

/**
 * Shared auth for the machine-to-machine `/api/internal/*` endpoints (resync,
 * digest): a Bearer secret compared in constant time. Extracted from the
 * resync route so every internal endpoint authenticates identically.
 */

/** Constant-time string compare that doesn't leak the secret's length. */
export function safeSecretEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  // Pad both to equal length so timingSafeEqual doesn't early-return on a length
  // mismatch (which would leak the secret's length via timing).
  const len = Math.max(ab.length, bb.length, 1);
  const pa = Buffer.alloc(len);
  const pb = Buffer.alloc(len);
  ab.copy(pa);
  bb.copy(pb);
  return timingSafeEqual(pa, pb) && ab.length === bb.length;
}

/**
 * Whether the request carries the configured internal secret — as
 * `Authorization: Bearer <secret>` or (optionally) a legacy fallback header.
 */
export function isAuthorizedInternalRequest(
  req: Request,
  secret: string,
  fallbackHeader?: string,
): boolean {
  const header = req.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ")
    ? header.slice(7)
    : fallbackHeader
      ? (req.headers.get(fallbackHeader) ?? "")
      : "";
  return Boolean(provided) && safeSecretEqual(provided, secret);
}
