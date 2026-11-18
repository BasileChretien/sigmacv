# pubmed

The PubMed E-utilities client (`esummary`, keyless, `tool`/`email` polite params, at most 3 requests a second) and the owner sync's guideline-citations pass. The source's entry in the catalogue: `docs/DATA-SOURCES.md`.

- **What it finds:** for each PubMed-indexed work, the clinical practice guidelines that cite it: NIH iCite's clinical citers (`cited_by_clin`) typed through PubMed's publication types (Practice Guideline, Guideline, Consensus Development Conference), stored as `meta.guidelineCitations`.
- **Owner sync only** (`guidelineCitationsPass.ts`), never the anonymous preview. Shown as a chip on the editor's publication row and named in the starter drafts of the narrative sections (`guidelineText.ts`, client-safe so both share it). **Never rendered on the CV; stripped from every public surface.**
- **Identifiers only:** two hops (PMID → PMID), no name matching.
- **Partial by construction:** a guideline PubMed does not index is not seen, and the chip says so. This is the free part of what Overton indexes; legislation, court decisions and news are not covered.
