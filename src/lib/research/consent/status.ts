import {
  documentLabelFor,
  documentVersionFor,
  isConsentLocale,
  RESEARCH_CONSENT_VERSION,
  STUDY,
  type ConsentLocale,
} from "./index";

/** A row of `ResearchConsentRecord`: one grant or one withdrawal, never edited. */
export interface ConsentRecordRow {
  action: string;
  at: Date;
  version: number;
  locale: string | null;
  /** Checkbox ① on a grant (always true: the server refuses a grant without it); null on a withdrawal. */
  agreeRequired: boolean | null;
  secondaryUse: boolean | null;
}

/** The consent columns of `User`. */
export interface ConsentUserRow {
  researchConsent: boolean;
  researchConsentAt: Date | null;
  researchConsentVersion: number | null;
}

/**
 * What the research panel shows: "none" (not taking part), "current" (taking
 * part under the current version) or "stale" (agreed to an older version,
 * which no longer authorises logging).
 */
export interface ConsentStatus {
  /** The study takes participants (the master switch is on). */
  open: boolean;
  state: "none" | "current" | "stale";
  since: string | null;
  version: number | null;
  /** The language of the text agreed to, its approved document, and that
   *  document's on-screen name (what the panel shows). */
  locale: ConsentLocale | null;
  documentVersion: string | null;
  documentLabel: string | null;
  /** Checkbox ②, future related research. */
  secondaryUse: boolean | null;
  /** Whether a record exists to download (a past grant or withdrawal). */
  hasRecords: boolean;
}

export interface ConsentStatusInput {
  open: boolean;
  user: ConsentUserRow | null;
  /** The newest grant record, which holds the language and checkbox ②. */
  latestGrant: ConsentRecordRow | null;
  recordCount: number;
}

export function consentStatus({
  open,
  user,
  latestGrant,
  recordCount,
}: ConsentStatusInput): ConsentStatus {
  const hasRecords = recordCount > 0;
  if (!user?.researchConsent) {
    return {
      open,
      state: "none",
      since: null,
      version: null,
      locale: null,
      documentVersion: null,
      documentLabel: null,
      secondaryUse: null,
      hasRecords,
    };
  }
  const version = user.researchConsentVersion;
  const grantLocale = latestGrant?.locale;
  const locale = isConsentLocale(grantLocale) ? grantLocale : null;
  return {
    open,
    state: version === RESEARCH_CONSENT_VERSION ? "current" : "stale",
    since: user.researchConsentAt?.toISOString() ?? null,
    version,
    locale,
    documentVersion: version === null ? null : documentVersionFor(version, locale),
    documentLabel: version === null ? null : documentLabelFor(version, locale),
    secondaryUse: latestGrant?.secondaryUse ?? null,
    hasRecords,
  };
}

/**
 * The participant's downloadable consent record: every grant and withdrawal,
 * oldest first, with the approved document each one refers to. It holds no
 * name, email or ORCID iD: the signed-in account is the link.
 */
export function consentRecordDocument(records: readonly ConsentRecordRow[], exportedAt: Date) {
  return {
    study: STUDY,
    exportedAt: exportedAt.toISOString(),
    currentConsentVersion: RESEARCH_CONSENT_VERSION,
    records: records.map((r) => ({
      action: r.action,
      at: r.at.toISOString(),
      consentVersion: r.version,
      language: r.locale,
      document: documentVersionFor(r.version, r.locale),
      agreeRequired: r.agreeRequired,
      secondaryUse: r.secondaryUse,
    })),
  };
}
