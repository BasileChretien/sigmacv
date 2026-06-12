-- User-set notification address for the digest emails (ORCID sign-in rarely
-- supplies a login email). Double opt-in: only an address whose confirmation
-- link was clicked (contactEmailVerifiedAt set) is ever used for sending.
ALTER TABLE "User" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "contactEmailVerifiedAt" TIMESTAMP(3);
