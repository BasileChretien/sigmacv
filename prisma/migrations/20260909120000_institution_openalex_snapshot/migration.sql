-- OpenAlex's record of an institution, refreshed weekly on the internal resync
-- tick for the ROR ids with an opted-in researcher, and read by /i/[ror] from
-- this row only (never fetched at request time). Additive: the trusted ROR
-- name stays the page's name; these columns hold the counted OpenAlex entity,
-- the counts-only aggregates, when they were fetched, the last failure, and
-- when the next refresh is due (weekly on success, one day on failure).
ALTER TABLE "Institution" ADD COLUMN "openalexId" TEXT;
ALTER TABLE "Institution" ADD COLUMN "openalexAggregates" JSONB;
ALTER TABLE "Institution" ADD COLUMN "openalexFetchedAt" TIMESTAMP(3);
ALTER TABLE "Institution" ADD COLUMN "openalexLastError" TEXT;
ALTER TABLE "Institution" ADD COLUMN "openalexNextRefreshAt" TIMESTAMP(3);

CREATE INDEX "Institution_openalexNextRefreshAt_idx" ON "Institution"("openalexNextRefreshAt");
