-- Assessment-grade frozen versions: the provenance ledger computed before the
-- frozen copy is stripped of its attribution signals, the SHA-256 content hash
-- of the frozen document, and the owner's freeze-time "reader view" choice.
ALTER TABLE "CvSnapshot" ADD COLUMN "ledger" JSONB;
ALTER TABLE "CvSnapshot" ADD COLUMN "contentHash" TEXT;
ALTER TABLE "CvSnapshot" ADD COLUMN "readerMode" BOOLEAN NOT NULL DEFAULT false;
