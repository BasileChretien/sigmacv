-- Research-consent audit trail: record WHEN consent was granted and WHICH
-- version of the consent notice the user agreed to (IRB-defensible trail).
-- Both nullable; null = no active research consent.
ALTER TABLE "User" ADD COLUMN "researchConsentAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "researchConsentVersion" INTEGER;
