-- Persistent fixed-window rate-limit counters (opt-in via RATE_LIMIT_PERSIST).
-- A single app instance uses the in-memory limiter; this table lets multiple
-- instances share one window per key (and survive restarts).
CREATE TABLE "RateLimitWindow" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateLimitWindow_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "RateLimitWindow_resetAt_idx" ON "RateLimitWindow"("resetAt");
