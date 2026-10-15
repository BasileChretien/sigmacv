-- Deleted records for the OAI-PMH endpoint (the 2026-09-08 panel's defect 3).
-- Until now Identify said deletedRecord=no and nothing was kept, so a
-- harvester running deltas never learned that a CV was withdrawn, a work was
-- taken off a page, or a researcher left an institution set. Each row says
-- "this identifier is no longer served" (setSpec '') or "no longer served in
-- this set" (setSpec 'ror:<id>'), with the date. No user FK: a row must
-- outlive the account it came from, for 30 days, after which the resync cron
-- deletes it (deletedRecord=transient).
-- The listing resumes after "id" (unique and short); an identifier carries a
-- slug that may run to a thousand characters, so it is no cursor.
CREATE TABLE "OaiDeletion" (
    "id"         TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "setSpec"    TEXT NOT NULL DEFAULT '',
    "deletedAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OaiDeletion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OaiDeletion_identifier_setSpec_key" ON "OaiDeletion"("identifier", "setSpec");
CREATE INDEX "OaiDeletion_setSpec_deletedAt_idx" ON "OaiDeletion"("setSpec", "deletedAt");

-- What each CV served after its last write, the "before" the next write diffs
-- against. Additive; null until the row's next write, which derives it from
-- the previous document instead.
ALTER TABLE "Cv" ADD COLUMN "oaiExposure" JSONB;
