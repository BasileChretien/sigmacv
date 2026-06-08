import { describe, expect, it } from "vitest";
import {
  __MAX_BUCKETS,
  __rateLimitBucketCount,
  __resetRateLimits,
  rateLimit,
} from "@/lib/rateLimit";

describe("rateLimit", () => {
  it("allows up to max within the window, then blocks", () => {
    __resetRateLimits();
    const t = 1000;
    expect(rateLimit("k1", 3, 1000, t).ok).toBe(true);
    expect(rateLimit("k1", 3, 1000, t).ok).toBe(true);
    expect(rateLimit("k1", 3, 1000, t).ok).toBe(true);
    const blocked = rateLimit("k1", 3, 1000, t);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("resets once the window elapses", () => {
    __resetRateLimits();
    expect(rateLimit("k2", 1, 1000, 1000).ok).toBe(true);
    expect(rateLimit("k2", 1, 1000, 1500).ok).toBe(false); // still in window
    expect(rateLimit("k2", 1, 1000, 2000).ok).toBe(true); // window elapsed
  });

  it("tracks separate keys independently", () => {
    __resetRateLimits();
    expect(rateLimit("a", 1, 1000, 1000).ok).toBe(true);
    expect(rateLimit("b", 1, 1000, 1000).ok).toBe(true);
    expect(rateLimit("a", 1, 1000, 1000).ok).toBe(false);
  });

  it("prunes expired buckets once the map grows past the cap", () => {
    __resetRateLimits();
    // Fill past MAX_BUCKETS (10000) with buckets that expire at t=2000.
    for (let i = 0; i < 10001; i++) rateLimit(`k${i}`, 1, 1000, 1000);
    // A new key at t=5000 trips the size cap → pruneExpired removes the stale ones.
    expect(rateLimit("trigger", 1, 1000, 5000).ok).toBe(true);
  });

  it("hard-bounds the bucket map even when no buckets are expired", () => {
    __resetRateLimits();
    // A flood of distinct keys all FRESH within one long window — pruneExpired
    // finds nothing to remove, so the map must be capped by eviction instead.
    for (let i = 0; i < __MAX_BUCKETS + 50; i++) rateLimit(`fresh-${i}`, 1, 60_000, 1000);
    expect(__rateLimitBucketCount()).toBeLessThanOrEqual(__MAX_BUCKETS);
  });
});
