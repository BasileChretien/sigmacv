-- The reconciliation export's per-work rows, computed ONCE when the owner
-- designates the frozen version (src/lib/institutions/reconciliationRows.ts,
-- stored by snapshotStore.ts) and cleared when the designation is dropped, so
-- a public request reads this column and never parses the frozen document —
-- the same shape as Cv.institutionAggregates. Additive; null until designated.
ALTER TABLE "CvSnapshot" ADD COLUMN "reconciliationRows" JSONB;

-- At most ONE designated version per CV, enforced by the database: two
-- concurrent designations of different versions could otherwise both clear
-- the other and both commit. Partial (only designated rows are indexed), so
-- it costs nothing for the rest.
CREATE UNIQUE INDEX "CvSnapshot_cvId_forReconciliation_key" ON "CvSnapshot"("cvId") WHERE "forReconciliation";
