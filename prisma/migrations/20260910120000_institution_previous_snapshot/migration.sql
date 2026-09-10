-- The reading before the current one: when the weekly refresh stores a new
-- OpenAlex snapshot for an institution, the outgoing aggregates and their fetch
-- time move here, so the page can print what the last full year's open share
-- stood at one reading earlier — the honest stability signal the 2026-09-10
-- panel asked for (shares move between readings as OpenAlex's record does).
-- Additive; cleared together with the current snapshot when the ROR leaves the
-- opted-in sets. Counts only, like the snapshot it copies.
ALTER TABLE "Institution" ADD COLUMN "openalexPreviousAggregates" JSONB;
ALTER TABLE "Institution" ADD COLUMN "openalexPreviousFetchedAt" TIMESTAMP(3);
