-- Per-CV opt-in to appear on the public institution page(s), pinned to the ROR
-- ids the owner ticked among their visible current positions (separate from the
-- search-indexing and OAI affiliation-listing consents; cleared with indexing).
ALTER TABLE "Cv" ADD COLUMN "showOnInstitutionPage" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Cv" ADD COLUMN "consentedRorIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
