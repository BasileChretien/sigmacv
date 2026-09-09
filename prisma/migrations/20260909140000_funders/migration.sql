-- The OpenAlex funder crosswalk: one row per funder printed on an owner's works
-- (`meta.funders[].id`, OpenAlex `F…`), with the ids OpenAlex records for it —
-- the FundRef DOI (`10.13039/…`), the bare ROR id and the Wikidata item — so an
-- owner's ORCID / Crossref grant (FundRef / ROR ids) can be compared with a
-- work's OpenAlex funder id without string-equalling the two namespaces.
-- Reference data about funders, not about a person; written at sync (bounded,
-- fail-soft, refreshed every 90 days), read by the owner's editor only.
CREATE TABLE "Funder" (
    "openalexId" TEXT NOT NULL,
    "fundrefDoi" TEXT,
    "rorId"      TEXT,
    "wikidataId" TEXT,
    "name"       TEXT NOT NULL,
    "fetchedAt"  TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Funder_pkey" PRIMARY KEY ("openalexId")
);

CREATE INDEX "Funder_fundrefDoi_idx" ON "Funder"("fundrefDoi");
CREATE INDEX "Funder_rorId_idx" ON "Funder"("rorId");
