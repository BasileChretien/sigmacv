-- Per-CV opt-in to be listed under the owner's self-declared current affiliation
-- in the OAI-PMH `ror:<id>` set (separate from the search-indexing consent), plus
-- the denormalised bare ROR id of the first visible current position (the set
-- key, rewritten from the document on every save / sync / publish change).
ALTER TABLE "Cv" ADD COLUMN "listUnderAffiliation" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Cv" ADD COLUMN "currentRorId" TEXT;

-- CreateIndex
CREATE INDEX "Cv_listUnderAffiliation_currentRorId_idx" ON "Cv"("listUnderAffiliation", "currentRorId");
