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

/** Persistent fixed-window limiter. Read-modify-write inside one transaction so
 *  concurrent requests for the same key can't both slip past the cap. */
async function prismaRateLimit(
  key: string,
  max: number,
  windowMs: number,
  now: number,
): Promise<RateLimitResult> {
  return prisma.$transaction(async (tx) => {
    const row = await tx.rateLimitWindow.findUnique({ where: { key } });

    // Fresh window: no row yet, or the previous window has elapsed.
    if (!row || now >= row.resetAt.getTime()) {
      const resetAt = new Date(now + windowMs);
      await tx.rateLimitWindow.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
      return { ok: true, retryAfterSec: 0 };
    }

    if (row.count >= max) {
      return {
        ok: false,
        retryAfterSec: Math.ceil((row.resetAt.getTime() - now) / 1000),
      };
    }

    // Atomic check-and-increment: the cap is enforced INSIDE the UPDATE's WHERE
    // (`count < max`), and `resetAt` pins the window we read. The row lock the
    // UPDATE takes serializes concurrent requests for the same key, and READ
    // COMMITTED re-evaluates the WHERE against the freshly-committed row — so two
    // requests can't both slip past the cap (the lost update a separate
    // read-then-write would allow). 0 rows updated means a concurrent request
    // just took the last slot → treat this one as limited.
    const res = await tx.rateLimitWindow.updateMany({
      where: { key, count: { lt: max }, resetAt: row.resetAt },
      data: { count: { increment: 1 } },
    });
    if (res.count === 0) {
      return {
        ok: false,
        retryAfterSec: Math.ceil((row.resetAt.getTime() - now) / 1000),
      };
    }
    return { ok: true, retryAfterSec: 0 };
  });
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
