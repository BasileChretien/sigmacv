/**
 * Human-readable names of the data sources a CV item / a whole CV can come from
 * (`CvItem.source`, `provenance.sources`). Proper nouns — never translated; the
 * two descriptive values ("manual", "derived") are localized by the callers
 * (`renderStrings().sourceManualEntries` / `.sourceDerived`) and only fall back to
 * these English words. Shared by the provenance footer and the reader-view
 * per-item provenance mark so a source is named identically everywhere.
 */
export const SOURCE_LABEL: Readonly<Record<string, string>> = {
  openalex: "OpenAlex",
  orcid: "ORCID",
  oep: "Open Editors Plus",
  crossref: "Crossref",
  datacite: "DataCite",
  openaire: "OpenAIRE",
  dblp: "DBLP",
  ukri: "UKRI",
  nih: "NIH RePORTER",
  nsf: "NSF",
  clinicaltrials: "ClinicalTrials.gov",
  ctis: "EU CTIS",
  ictrp: "WHO ICTRP",
  epo: "EPO",
  ror: "ROR",
  derived: "derived",
  manual: "manual entries",
};

/** The display name of a source key, falling back to the raw key. */
export function sourceLabel(source: string): string {
  return SOURCE_LABEL[source] ?? source;
}
