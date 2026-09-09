-- GDPR Art. 21 objections to the no-login ORCID preview (src/lib/cv/previewSuppression.ts).
-- One row per objecting iD, keyed by HMAC-SHA256(PREVIEW_SUPPRESSION_KEY, iD) —
-- never the plaintext iD (a list of iDs would itself be a personal-information
-- database under the APPI). Independent of User on purpose: a non-user can
-- object (ORCID-verified, no account created), and the row survives an account's
-- deletion. `source` records how it was made: 'orcid-oauth' (the /object route)
-- or 'account' (the signed-in toggle).
CREATE TABLE "PreviewSuppression" (
    "orcidHmac" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source"    TEXT NOT NULL,
    CONSTRAINT "PreviewSuppression_pkey" PRIMARY KEY ("orcidHmac")
);
