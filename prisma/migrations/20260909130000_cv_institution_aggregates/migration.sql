-- Counts-only aggregate of the works a CV's public page lists (by year x
-- open-access state, and by section), computed from the document at every
-- write beside currentRorId and summed under k-anonymity on the public
-- institution page(s) for the CVs whose owners gave the pinned institution-page
-- consent. Additive; null until the row's next write (no backfill).
ALTER TABLE "Cv" ADD COLUMN "institutionAggregates" JSONB;

-- The bare ROR ids of all visible current positions, rewritten from the
-- document on every write beside currentRorId. The institution-page reader
-- filters on it together with consentedRorIds (a consent is active only while
-- its id is still a visible current position) instead of parsing every
-- candidate document. Additive; [] until the row's next write (no backfill).
ALTER TABLE "Cv" ADD COLUMN "visibleCurrentRorIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
