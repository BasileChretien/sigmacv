/**
 * A patent record from a public patent source, normalized for the CV's Patents
 * section. Patents carry NO ORCID, so they are matched by inventor NAME +
 * applicant organization and surface as review candidates the user confirms.
 */
export interface PatentRecord {
  /** Which source produced this record (only EPO OPS today). */
  source: "epo";
  /** Publication number in epodoc form, e.g. "EP1234567A1" / "WO2020123456A1". */
  publicationNumber: string;
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
}
