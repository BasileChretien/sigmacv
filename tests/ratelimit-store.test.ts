import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the DB + logger so the persistent path is exercised without a real
// Postgres. $transaction runs its callback against a fake transaction client.
const mocks = vi.hoisted(() => ({
  transaction: vi.fn(),
  findUnique: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { $transaction: mocks.transaction },
}));
vi.mock("@/lib/log", () => ({
  logger: { warn: mocks.warn, info: vi.fn(), error: vi.fn() },
}));

import { __resetRateLimits } from "@/lib/rateLimit";
import { enforceRateLimit, rateLimitPersistenceEnabled } from "@/lib/rateLimitStore";

const tx = {
  rateLimitWindow: {
    findUnique: mocks.findUnique,
    upsert: mocks.upsert,
    update: mocks.update,
    updateMany: mocks.updateMany,
  },
};

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  mocks.transaction.mockImplementation((cb: (t: typeof tx) => unknown) => cb(tx));
  mocks.upsert.mockResolvedValue({});
  mocks.update.mockResolvedValue({});
  mocks.updateMany.mockResolvedValue({ count: 1 });
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
    expect(mocks.transaction).not.toHaveBeenCalled();
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

  it("opens a fresh window when no row exists", async () => {
    mocks.findUnique.mockResolvedValue(null);
    const r = await enforceRateLimit("sync:u1", 5, 60_000, 1000);
    expect(r.ok).toBe(true);
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
    const arg = mocks.upsert.mock.calls[0]![0] as {
      create: { count: number; resetAt: Date };
    };
    expect(arg.create.count).toBe(1);
    expect(arg.create.resetAt).toEqual(new Date(61_000));
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("atomically check-and-increments within an active window", async () => {
    mocks.findUnique.mockResolvedValue({
      key: "k",
      count: 2,
      resetAt: new Date(61_000),
    });
    const r = await enforceRateLimit("k", 5, 60_000, 1000);
    expect(r.ok).toBe(true);
    // The cap is enforced inside the UPDATE's WHERE (count < max), pinned to the
    // window we read — not a separate read-then-write that could lose an update.
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { key: "k", count: { lt: 5 }, resetAt: new Date(61_000) },
      data: { count: { increment: 1 } },
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("denies when a concurrent request took the last slot (0 rows updated)", async () => {
    mocks.findUnique.mockResolvedValue({
      key: "k",
      count: 4, // looked below the cap when read…
      resetAt: new Date(61_000),
    });
    // …but the atomic conditional UPDATE affected 0 rows (another request
    // already incremented to the cap), so this one is limited — no lost update.
    mocks.updateMany.mockResolvedValue({ count: 0 });
    const r = await enforceRateLimit("k", 5, 60_000, 1000);
    expect(r.ok).toBe(false);
    expect(r.retryAfterSec).toBe(60);
  });

  it("blocks at the cap and reports Retry-After (seconds)", async () => {
    mocks.findUnique.mockResolvedValue({
      key: "k",
      count: 5,
      resetAt: new Date(61_000),
    });
    const r = await enforceRateLimit("k", 5, 60_000, 1000);
    expect(r.ok).toBe(false);
    expect(r.retryAfterSec).toBe(60); // (61000 - 1000) / 1000
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("resets once the previous window has elapsed", async () => {
    mocks.findUnique.mockResolvedValue({
      key: "k",
      count: 5,
      resetAt: new Date(1000),
    });
    const r = await enforceRateLimit("k", 5, 60_000, 2000); // now >= resetAt
    expect(r.ok).toBe(true);
    expect(mocks.upsert).toHaveBeenCalledTimes(1);
  });

  it("degrades to the in-memory limiter (does NOT fail open) and logs when the DB errors", async () => {
    mocks.transaction.mockRejectedValue(new Error("db unreachable"));
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
