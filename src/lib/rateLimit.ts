/**
 * Minimal in-memory fixed-window rate limiter.
 *
 * Scope: single-process (the MVP runs one app container). It is NOT shared
 * across instances — move to Redis/Upstash if the app is ever horizontally
 * scaled. Good enough to stop a single authenticated client from hammering the
 * expensive routes (OpenAlex sync, Chromium PDF export).
 */

interface Bucket {
  count: number;
  resetAt: number; // epoch ms
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000; // safety cap against unbounded growth

export interface RateLimitResult {
  ok: boolean;
  /** Seconds until the window resets (only meaningful when ok === false). */
  retryAfterSec: number;
}

export function rateLimit(
  key: string,
  max: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    if (buckets.size >= MAX_BUCKETS) {
      pruneExpired(now);
      // Pruning frees nothing when every window is still fresh (e.g. a flood of
      // distinct IPs within one window), so hard-bound the map by evicting the
      // oldest bucket(s) — `buckets.set` below must never push size past the cap.
      while (buckets.size >= MAX_BUCKETS) {
        const oldest = buckets.keys().next().value;
        if (oldest === undefined) break;
        buckets.delete(oldest);
      }
    }
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterSec: 0 };
  }

  if (existing.count >= max) {
    return { ok: false, retryAfterSec: Math.ceil((existing.resetAt - now) / 1000) };
  }

  existing.count += 1;
  return { ok: true, retryAfterSec: 0 };
}

function pruneExpired(now: number): void {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

/** Test-only: clear all buckets. */
export function __resetRateLimits(): void {
  buckets.clear();
}

/** Test-only: current number of live buckets (to assert the hard bound). */
export function __rateLimitBucketCount(): number {
  return buckets.size;
}

/** Test-only: the map's hard cap. */
export const __MAX_BUCKETS = MAX_BUCKETS;
