-- Open Editors Plus rows may now reach a CV by OpenAlex author ID as well as by
-- ORCID, with a trust tier deciding auto-include vs review candidate.
-- Existing rows are all ORCID-scraped, so they take the default tier.
ALTER TABLE "OepEditorialRole" ALTER COLUMN "orcid" DROP NOT NULL;
ALTER TABLE "OepEditorialRole" ADD COLUMN "openalexAuthorId" TEXT;
ALTER TABLE "OepEditorialRole" ADD COLUMN "trust" TEXT NOT NULL DEFAULT 'scraped';

CREATE INDEX "OepEditorialRole_openalexAuthorId_idx" ON "OepEditorialRole"("openalexAuthorId");
