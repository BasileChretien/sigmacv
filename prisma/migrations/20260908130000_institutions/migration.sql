-- ROR's own record of an institution (name + country), written during sync from
-- the ROR client's confident match for every ROR that appears on a position. The
-- only source of an institution's public name: an owner controls the text of a
-- manual position, so no name derived from a CV may name a real ROR's page.
CREATE TABLE "Institution" (
    "rorId"     TEXT NOT NULL,
    "name"      TEXT NOT NULL,
    "country"   TEXT,
    "source"    TEXT NOT NULL DEFAULT 'ror',
    "fetchedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Institution_pkey" PRIMARY KEY ("rorId")
);
