/** A clinical trial the researcher appears on as an investigator (review
 *  candidate — matched by name + organization, never auto-trusted). */
export interface ExternalTrial {
  source: "clinicaltrials" | "ctis" | "ictrp";
  /** Registry id (NCT… for ClinicalTrials.gov, EUCT for CTIS, the source-register
   *  accession for WHO ICTRP — e.g. ISRCTN…, jRCT…, ChiCTR…). */
  registryId: string;
  title: string;
  status?: string;
  /** Study phase (e.g. "PHASE3"). */
  phase?: string;
  /** The investigator's role (e.g. "PRINCIPAL_INVESTIGATOR"). */
  role?: string;
  sponsor?: string;
  /** The matched investigator affiliation. */
  org?: string;
  startYear?: number;
  endYear?: number;
}
