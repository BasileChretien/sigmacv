import { enforceRateLimit } from "@/lib/rateLimitStore";

/**
 * Shared rate-limit + client-IP helpers for the public living-page routes
 * (`/p/[slug]` and `/p/[slug]/og`). Both anonymous and render-heavy, so they
 * share ONE per-IP + global ceiling under the same `pubpage:` buckets — a flood
 * hitting either surface counts against the same limit.
 */

// Anonymous + render-heavy: bound per-IP request rate so a flood (especially of
// random/invalid slugs, which bypass the render cache) can't pin the process.
export const PUBPAGE_MAX = 120;
export const PUBPAGE_WINDOW_MS = 60_000; // 1 minute
// A second, GLOBAL ceiling across all IPs — bounds a distributed flood that
// rotates source IPs (each IP staying under the per-IP cap).
export const PUBPAGE_GLOBAL_MAX = 3_000;
export const PUBPAGE_GLOBAL_WINDOW_MS = 60_000;

/**
 * Real client IP from the proxy headers. Caddy is configured to OVERWRITE
 * X-Forwarded-For with the real peer (`header_up X-Forwarded-For {remote_host}`),
 * so the trusted value is the RIGHTMOST hop — never the leftmost client-supplied
 * one (which would let an attacker rotate it to evade the per-IP limit).
 */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const parts = fwd.split(",");
    return parts[parts.length - 1]!.trim();
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** The outcome of the shared public-page rate-limit check. */
export type PubRateLimitOutcome =
  | { ok: true }
  | { ok: false; retryAfterSec: number };

/**
 * Apply the per-IP then global public-page limit for `req`. Returns `{ ok: true }`
 * to proceed, or the `Retry-After` seconds when either ceiling is exceeded.
 */
export async function enforcePubPageRateLimit(
  req: Request,
): Promise<PubRateLimitOutcome> {
  const rl = await enforceRateLimit(
    `pubpage:${clientIp(req)}`,
    PUBPAGE_MAX,
    PUBPAGE_WINDOW_MS,
  );
  if (!rl.ok) return { ok: false, retryAfterSec: rl.retryAfterSec };
  const grl = await enforceRateLimit(
    "pubpage:global",
    PUBPAGE_GLOBAL_MAX,
    PUBPAGE_GLOBAL_WINDOW_MS,
  );
  if (!grl.ok) return { ok: false, retryAfterSec: grl.retryAfterSec };
  return { ok: true };
}

/** A 429 response with a `Retry-After` header (plain text body). */
export function tooManyRequests(retryAfterSec: number): Response {
  return new Response("Too many requests. Please try again shortly.", {
    status: 429,
    headers: {
      "Retry-After": String(retryAfterSec),
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

/**
 * Server-generated public slugs are always `^[a-z0-9][a-z0-9-]*$`. Reject
 * anything else BEFORE it reaches the DB lookup or a response header — a crafted
 * slug (quotes/CRLF/path chars) must never reach the Content-Disposition
 * filename (header-injection / quote-breakout) and is treated as not-found.
 */
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
export function isValidPublicSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}
