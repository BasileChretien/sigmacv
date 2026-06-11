import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the DB + logger so the persistent path is exercised without a real
// Postgres. The limiter issues ONE atomic `INSERT … ON CONFLICT DO UPDATE`
// (`$queryRaw`) whose RETURNING row we stub per test.
const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { $queryRaw: mocks.queryRaw },
}));
vi.mock("@/lib/log", () => ({
  logger: { warn: mocks.warn, info: vi.fn(), error: vi.fn() },
}));

import { __resetRateLimits } from "@/lib/rateLimit";
import { enforceRateLimit, rateLimitPersistenceEnabled } from "@/lib/rateLimitStore";

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  // Default: the upsert lands as the first hit in a fresh window.
  mocks.queryRaw.mockResolvedValue([{ count: 1, resetAt: new Date(61_000) }]);
  __resetRateLimits();
  delete process.env.RATE_LIMIT_PERSIST;
});

afterEach(() => {
  delete process.env.RATE_LIMIT_PERSIST;
});

describe("enforceRateLimit — in-memory default", () => {
  it("uses the in-memory limiter (no DB) when persistence is off", async () => {
    expect(rateLimitPersistenceEnabled()).toBe(false);
    const r = await enforceRateLimit("k", 2, 1000, 1000);
    expect(r.ok).toBe(true);
    expect(mocks.queryRaw).not.toHaveBeenCalled();
  });

  it("blocks past the cap on the in-memory path", async () => {
    await enforceRateLimit("mem", 1, 1000, 1000);
    const r = await enforceRateLimit("mem", 1, 1000, 1000);
    expect(r.ok).toBe(false);
    expect(r.retryAfterSec).toBeGreaterThan(0);
  });
});

describe("enforceRateLimit — persistent (Postgres)", () => {
  beforeEach(() => {
    process.env.RATE_LIMIT_PERSIST = "true";
  });

  it("reports persistence as enabled", () => {
    expect(rateLimitPersistenceEnabled()).toBe(true);
  });

  it("allows while within the cap via a single atomic upsert (no read-then-write)", async () => {
    // Active window, the upsert counts up to 3 of 5 — allowed.
    mocks.queryRaw.mockResolvedValue([{ count: 3, resetAt: new Date(61_000) }]);
    const r = await enforceRateLimit("k", 5, 60_000, 1000);
    expect(r.ok).toBe(true);
    // Exactly one statement — the read and the conditional write are folded into
    // one `INSERT … ON CONFLICT` so there is no TOCTOU gap.
    expect(mocks.queryRaw).toHaveBeenCalledTimes(1);
  });

  it("opens a fresh window at count 1 (allowed)", async () => {
    mocks.queryRaw.mockResolvedValue([{ count: 1, resetAt: new Date(61_000) }]);
    const r = await enforceRateLimit("sync:u1", 5, 60_000, 1000);
    expect(r.ok).toBe(true);
    expect(mocks.queryRaw).toHaveBeenCalledTimes(1);
  });

  it("fresh-window race: two concurrent first requests don't both pass the cap", async () => {
    // Model the atomic upsert: each call lands as the next count in the window
    // (what `ON CONFLICT DO UPDATE … count + 1` does under a row lock). With a
    // cap of 1, exactly one request may pass; the second is limited. The old
    // read-then-write let both open the window at count 1.
    let count = 0;
    mocks.queryRaw.mockImplementation(() => {
      count += 1;
      return Promise.resolve([{ count, resetAt: new Date(61_000) }]);
    });
    const r1 = await enforceRateLimit("race", 1, 60_000, 1000);
    const r2 = await enforceRateLimit("race", 1, 60_000, 1000);
    expect([r1.ok, r2.ok]).toEqual([true, false]);
    expect(r2.retryAfterSec).toBe(60); // (61000 - 1000) / 1000
  });

  it("limits when the atomic upsert pushes the count over the cap", async () => {
    // The upsert always increments; an over-cap request reports limited and the
    // Retry-After is derived from the pinned window reset.
    mocks.queryRaw.mockResolvedValue([{ count: 6, resetAt: new Date(61_000) }]);
    const r = await enforceRateLimit("k", 5, 60_000, 1000);
    expect(r.ok).toBe(false);
    expect(r.retryAfterSec).toBe(60); // (61000 - 1000) / 1000
  });

  it("degrades to the in-memory limiter (does NOT fail open) and logs when the DB errors", async () => {
    mocks.queryRaw.mockRejectedValue(new Error("db unreachable"));
    // Within the in-memory budget the request is allowed…
    for (let i = 0; i < 5; i++) {
      const r = await enforceRateLimit("degraded-key", 5, 60_000, 1000);
      expect(r.ok).toBe(true);
    }
    // …but it is NOT unbounded — the fallback still throttles past the cap.
    const denied = await enforceRateLimit("degraded-key", 5, 60_000, 1000);
    expect(denied.ok).toBe(false);
    expect(mocks.warn).toHaveBeenCalledWith(
      "ratelimit.persist_failed_degraded",
      expect.objectContaining({ key: "degraded-key" }),
    );
  });
});
