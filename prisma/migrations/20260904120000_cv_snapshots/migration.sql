-- Frozen, citable CV snapshots ("freeze & cite this version"), one row per
-- version per CV. Cascade-deleted with the CV (and so with the account).
CREATE TABLE "CvSnapshot" (
    "id" TEXT NOT NULL,
    "cvId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "canonical" JSONB NOT NULL,
    "token" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "doi" TEXT,
    "doiState" TEXT NOT NULL DEFAULT 'none',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CvSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CvSnapshot_token_key" ON "CvSnapshot"("token");
CREATE UNIQUE INDEX "CvSnapshot_cvId_version_key" ON "CvSnapshot"("cvId", "version");

ALTER TABLE "CvSnapshot" ADD CONSTRAINT "CvSnapshot_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "Cv"("id") ON DELETE CASCADE ON UPDATE CASCADE;
