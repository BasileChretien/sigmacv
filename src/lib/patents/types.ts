/**
 * A patent record from a public patent source, normalized for the CV's Patents
 * section. Two provenance lanes with different trust levels:
 *  - `epo` — EPO OPS, matched by inventor NAME + applicant organization (patents
 *    carry no ORCID), so every hit is a REVIEW CANDIDATE the user confirms.
 *  - `orcid` — a patent the owner self-asserted on their OWN ORCID record (an
 *    identifier match at the person level), so it is AUTO-INCLUDED.
 */
export interface PatentRecord {
  /** Which source produced this record. */
  source: "epo" | "orcid";
  /**
   * Publication number in epodoc form, e.g. "EP1234567A1" / "WO2020123456A1".
   * Optional: an ORCID-asserted patent may carry no patent-number external id.
   */
  publicationNumber?: string;
  /** Invention title (English when available). */
  title: string;
  /** Applicant / assignee organization names (often the institution or company). */
  applicants: string[];
  /** Inventor names as printed on the patent. */
  inventors: string[];
  /** Publication year. */
  year?: number;
  /**
   * DOCDB simple patent-family id (EPO OPS `exchange-document/@family-id`). The
   * same invention filed in several jurisdictions (US/EP/JP/WO…) shares one id;
   * it collapses those equivalents into a single CV entry. Absent when the
   * source response carried no family id.
   */
  familyId?: string;
  /**
   * Stable per-source id used for the CV item id / re-sync dedupe when there is
   * no publication number — the ORCID put-code for an `orcid` record.
   */
  sourceId?: string;
}
