-- Opt-in re-sync digest email: the flag (default OFF — GDPR/APPI data
-- minimization) and the last-sent timestamp (per-user monthly cadence; only a
-- sync report newer than this is ever mailed).
ALTER TABLE "User" ADD COLUMN "digestOptIn" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "digestSentAt" TIMESTAMP(3);
