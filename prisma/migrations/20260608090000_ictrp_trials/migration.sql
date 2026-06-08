-- WHO ICTRP reference data: clinical trials from the national registries that
-- ClinicalTrials.gov + EU CTIS do not cover. Static, bulk-imported reference data
-- (npm run ictrp:import); replaced wholesale on each import. Not user data — no FK
-- to "User". Indexed by the lowercased contact name for the per-researcher surname
-- lookup at CV-sync time. DORMANT until the maintainer provisions the WHO export.
CREATE TABLE "IctrpTrial" (
    "id" SERIAL NOT NULL,
    "trialId" TEXT NOT NULL,
    "sourceRegister" TEXT NOT NULL,
    "publicTitle" TEXT NOT NULL,
    "scientificTitle" TEXT,
    "primarySponsor" TEXT,
    "contactName" TEXT NOT NULL,
    "contactNameLower" TEXT NOT NULL,
    "recruitmentStatus" TEXT,
    "registrationYear" INTEGER,
    CONSTRAINT "IctrpTrial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IctrpTrial_contactNameLower_idx" ON "IctrpTrial"("contactNameLower");
