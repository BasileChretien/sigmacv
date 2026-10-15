-- When what the OAI-PMH endpoint serves for a CV last changed, and the hash it
-- is compared against. Until now a record's datestamp was the row's updatedAt,
-- which every write moves — the resync job's lock included — so each
-- incremental harvest re-sent every published CV (the 2026-09-08 panel's
-- defect 6). publicChangedAt moves only when oaiFingerprint changes.
ALTER TABLE "Cv" ADD COLUMN "publicChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Cv" ADD COLUMN "oaiFingerprint" TEXT;

-- Existing rows keep the datestamp harvesters have already seen. A raw UPDATE
-- leaves updatedAt alone (Prisma sets @updatedAt in the client, not here).
UPDATE "Cv" SET "publicChangedAt" = "updatedAt";

CREATE INDEX "Cv_publicChangedAt_idx" ON "Cv"("publicChangedAt");
