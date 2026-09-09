-- Second institution opt-in: share per-work reconciliation rows (ORCID iD, the
-- works the public page lists with DOI / year / type / licence / open-access
-- state, the consented ROR ids) in the public CSV/JSON export under
-- /i/<ror>/reconciliation. Offered only while showOnInstitutionPage is on and
-- cleared with it. Additive; default false.
ALTER TABLE "Cv" ADD COLUMN "shareReconciliationRows" BOOLEAN NOT NULL DEFAULT false;

-- The ONE frozen version per CV the owner designated as the source of that
-- export (only a public version; designating another clears the previous one
-- in the same transaction; making it private or deleting it drops it).
-- Additive; default false.
ALTER TABLE "CvSnapshot" ADD COLUMN "forReconciliation" BOOLEAN NOT NULL DEFAULT false;
