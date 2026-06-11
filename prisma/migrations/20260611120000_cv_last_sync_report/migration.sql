-- "What changed" report of the last sync (added/removed items, review
-- candidates, per-source counts + timings), shown in the editor. Nullable:
-- rows synced before this feature simply have no report.
ALTER TABLE "Cv" ADD COLUMN "lastSyncReport" JSONB;
