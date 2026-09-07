-- Retry queue for minted snapshot DOIs whose withdrawal at DataCite (hide +
-- repoint at /withdrawn) failed during account deletion. The cascade removes the
-- only other copy of the DOI with the account, so the DOI is parked here and
-- retried by the internal resync cron until DataCite accepts the hide, then the
-- row is deleted. No FK to "User" and no personal data: DOI + retry counter +
-- last machine reason only.
CREATE TABLE "DoiWithdrawal" (
    "doi"       TEXT NOT NULL,
    "attempts"  INTEGER NOT NULL DEFAULT 1,
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DoiWithdrawal_pkey" PRIMARY KEY ("doi")
);
