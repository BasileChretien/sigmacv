/**
 * Rate-limit dispatcher: in-memory by default, Postgres-backed when opted in.
 *
 * A single app instance (the default Hetzner deployment) uses the fast in-memory
 * fixed-window limiter in `./rateLimit`. When the app is run as MULTIPLE
 * instances behind a load balancer, in-memory buckets diverge per instance, so
 * set `RATE_LIMIT_PERSIST=true` to share one fixed-window counter through the
 * `RateLimitWindow` table — limits then hold across instances and survive
 * restarts.
 *
 * Degraded mode: if the persistent store is briefly unreachable we DON'T fail
 * open (which would disable throttling on every expensive route under DB
 * pressure) — we fall back to the in-memory limiter, so requests stay
 * conservatively throttled until the DB recovers. The limiter is a guardrail
 * against abuse, not an auth boundary.
 */
import { prisma } from "@/lib/db";
import { logger } from "@/lib/log";
import { rateLimit, type RateLimitResult } from "@/lib/rateLimit";

/** Persistent fixed-window limiter. A single atomic `INSERT … ON CONFLICT DO
 *  UPDATE` so concurrent requests for the same key can't both slip past the cap.
 *
 *  A read-then-write (findUnique then upsert) has a TOCTOU gap: two requests can
 *  both read "no row" (or a stale window) and both open a fresh window at
 *  `count = 1`, letting both through. Folding the read and the conditional write
 *  into ONE statement closes that gap — `ON CONFLICT` takes a row lock and the
 *  CASE re-evaluates against the freshly-committed row, so a stale/elapsed
 *  window resets to 1 while an active one counts up. The request is allowed iff
 *  the resulting count is within the cap (an over-cap request still increments,
 *  but `resetAt` is pinned so it only ever reports "limited"). */
async function prismaRateLimit(
  key: string,
  max: number,
  windowMs: number,
  now: number,
): Promise<RateLimitResult> {
  const nowDate = new Date(now);
  const resetAt = new Date(now + windowMs);
  const rows = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimitWindow" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitWindow"."resetAt" <= ${nowDate} THEN 1
        ELSE "RateLimitWindow"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitWindow"."resetAt" <= ${nowDate} THEN ${resetAt}
        ELSE "RateLimitWindow"."resetAt"
      END
    RETURNING "count", "resetAt"
  `;
  const row = rows[0]!;
  if (row.count <= max) return { ok: true, retryAfterSec: 0 };
  return { ok: false, retryAfterSec: Math.ceil((row.resetAt.getTime() - now) / 1000) };
}

/** True when persistent (cross-instance) rate limiting is requested. */
export function rateLimitPersistenceEnabled(): boolean {
  return process.env.RATE_LIMIT_PERSIST === "true";
}

/**
 * Enforce a fixed-window rate limit for `key`. Uses Postgres when
 * `RATE_LIMIT_PERSIST=true`, otherwise the in-memory limiter. Always resolves
 * (never rejects): on a DB error in the persistent path it logs and allows.
 */
export async function enforceRateLimit(
  key: string,
  max: number,
  windowMs: number,
  now: number = Date.now(),
): Promise<RateLimitResult> {
  if (!rateLimitPersistenceEnabled()) {
    return rateLimit(key, max, windowMs, now);
  }
  try {
    return await prismaRateLimit(key, max, windowMs, now);
  } catch (err) {
    // Don't fail open: degrade to the in-memory limiter so the route stays
    // throttled (conservatively) during a DB blip instead of becoming unbounded.
    logger.warn("ratelimit.persist_failed_degraded", { key, err });
    return rateLimit(key, max, windowMs, now);
  }
}
