-- Counts-only aggregate of the works a CV's public page lists (by year x
-- open-access state, and by section), computed from the document at every
-- write beside currentRorId and summed under k-anonymity on the public
-- institution page(s) for the CVs whose owners gave the pinned institution-page
-- consent. Additive; null until the row's next write (no backfill).
ALTER TABLE "Cv" ADD COLUMN "institutionAggregates" JSONB;
