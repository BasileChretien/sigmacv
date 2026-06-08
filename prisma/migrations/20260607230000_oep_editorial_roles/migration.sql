-- Open Editors Plus reference data: journal editorial roles keyed by ORCID.
-- Static, bulk-imported reference data (npm run oep:import); replaced wholesale
-- on each import. Not user data — no FK to "User". Indexed by orcid for the
-- per-researcher lookup at CV-sync time.
CREATE TABLE "OepEditorialRole" (
    "id" SERIAL NOT NULL,
    "orcid" TEXT NOT NULL,
    "journal" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "roleStd" TEXT,
    "publisher" TEXT,
    "issn" TEXT,
    CONSTRAINT "OepEditorialRole_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OepEditorialRole_orcid_idx" ON "OepEditorialRole"("orcid");
