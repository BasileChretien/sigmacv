-- Explicit opt-in to let search engines index a published public CV page.
-- Default false: publishing shares a capability URL; indexing (names/ORCID/
-- publications into search engines) is a distinct consent (GDPR/APPI).
ALTER TABLE "Cv" ADD COLUMN "publicIndexable" BOOLEAN NOT NULL DEFAULT false;
