-- The electronic consent record of Nagoya University study 2026-0310 (the
-- approved consent-screen specification, 別添1 §4-5): one row per grant or
-- withdrawal, never updated. A withdrawal clears the User consent fields and
-- deletes the ResearchEvent rows, and writes its own row here in the same
-- transaction, so the history of what was agreed and when survives it. The
-- rows go with the account (cascade). No name, email or ORCID iD is stored.
-- "agreeRequired" is checkbox ① (18 or older, read and understood, agree):
-- true on every grant, which the server refuses without it; null on a
-- withdrawal.
CREATE TABLE "ResearchConsentRecord" (
    "id"            TEXT NOT NULL,
    "userId"        TEXT NOT NULL,
    "action"        TEXT NOT NULL,
    "at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version"       INTEGER NOT NULL,
    "locale"        TEXT,
    "agreeRequired" BOOLEAN,
    "secondaryUse"  BOOLEAN,
    CONSTRAINT "ResearchConsentRecord_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ResearchConsentRecord_userId_at_idx" ON "ResearchConsentRecord"("userId", "at");
ALTER TABLE "ResearchConsentRecord" ADD CONSTRAINT "ResearchConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
