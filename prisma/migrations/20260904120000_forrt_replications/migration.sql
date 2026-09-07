-- FORRT Replication Database (FReD) reference data: original <-> replication study
-- pairs by DOI, CC-BY licensed. Static, bulk-imported reference data
-- (npm run forrt:import); replaced wholesale on each import. Not user data — no FK
-- to "User". Indexed by both DOI columns for the per-publication lookup at
-- CV-sync time (a publication can be looked up either as the original or as the
-- replication). DORMANT until the maintainer provisions a FReD export.
CREATE TABLE "ForrtReplication" (
    "id"             SERIAL NOT NULL,
    "originalDoi"    TEXT NOT NULL,
    "replicationDoi" TEXT,
    "outcome"        TEXT,
    "discipline"     TEXT,
    "description"    TEXT,
    "originalRef"    TEXT,
    "replicationRef" TEXT,
    "sourceUrl"      TEXT,
    "importedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ForrtReplication_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ForrtReplication_originalDoi_idx" ON "ForrtReplication"("originalDoi");
CREATE INDEX "ForrtReplication_replicationDoi_idx" ON "ForrtReplication"("replicationDoi");
