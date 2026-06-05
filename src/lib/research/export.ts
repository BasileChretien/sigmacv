import { createHmac } from "node:crypto";

/**
 * IRB-gated researcher export of the consent-gated research dataset
 * (the author-disambiguation study, paper #2, and the self-presentation /
 * metric-norms study, paper #3).
 *
 * This module is the PURE, testable core: it turns raw consenting-user records
 * into a de-identified dataset and decides whether the export is even allowed to
 * run. The actual DB read + file write lives in the offline operator script
 * `scripts/export-research-data.ts`; there is deliberately NO network route.
 *
 * Safety properties (so this can ship while still DISABLED):
 *   • Hard-gated — `researchExportGate()` is OFF unless an explicit IRB-approval
 *     env triad is set (see below). The shipped default is off.
 *   • Pseudonymous — subjects are keyed-HMAC pseudonyms, never the user id.
 *   • Minimal — only the pre-registered event types are emitted, and the
 *     payloads are already the data-minimized structured signals produced by
 *     `diff.ts` (no names / emails / ORCIDs).
 */

/**
 * Event types the studies pre-register. MUST stay in sync with the `type`
 * values written in `research/log.ts`. Anything else is dropped from the export
 * as defence in depth.
 */
export const PRE_REGISTERED_EVENT_TYPES = [
  "curation_correction",
  "disambiguation_assertion",
  "composition_snapshot",
] as const;

export type ResearchEventType = (typeof PRE_REGISTERED_EVENT_TYPES)[number];

const PRE_REGISTERED = new Set<string>(PRE_REGISTERED_EVENT_TYPES);

/** A consenting user's research record, as read from the DB (minimal shape). */
export interface ResearchSubjectInput {
  userId: string;
  researchConsent: boolean;
  researchConsentVersion: number | null;
  /**
   * Identity fields. Used ONLY to build the separate re-identification key table
   * (対照表, `buildKeyTable`) that the 個人情報管理者 holds — NEVER the de-identified
   * analysis dataset. Optional so the de-identified path can be exercised without
   * ever loading identifiers.
   */
  identity?: {
    name?: string | null;
    email?: string | null;
    orcid?: string | null;
    consentAt?: Date | null;
  };
  events: ReadonlyArray<{
    type: string;
    payload: unknown;
    createdAt: Date;
  }>;
}

/** One de-identified row of the exported dataset. Carries NO direct identifier. */
export interface ResearchExportRow {
  /** Keyed-HMAC pseudonym — stable across runs, not reversible without the salt. */
  subject: string;
  /** Which version of the consent notice the subject agreed under (audit trail). */
  consentVersion: number | null;
  eventType: string;
  /** ISO-8601 timestamp of the event. */
  at: string;
  /** The structured research signal (from `diff.ts`); already minimized. */
  payload: unknown;
}

/**
 * Pseudonymise a user id: HMAC-SHA256(userId, salt), truncated to 64 bits of hex.
 * Deterministic given the salt (so repeated exports link longitudinally) but not
 * reversible without it. The salt is a secret held only by the study team.
 */
export function pseudonymise(userId: string, salt: string): string {
  if (!salt) throw new Error("pseudonymisation salt is required");
  return createHmac("sha256", salt).update(userId).digest("hex").slice(0, 16);
}

/**
 * Build the de-identified research dataset from raw consenting-user records.
 * Pure + deterministic given `(subjects, salt)`. Drops, as defence in depth:
 *   • any subject without `researchConsent` (the query already filters these),
 *   • any event whose type is not pre-registered.
 * Emits NO direct identifiers and NO raw work identifiers — the subject is a
 * keyed-HMAC pseudonym and every DOI / OpenAlex source id in the payload is
 * HMAC-pseudonymised too (so a distinctive own-work DOI can't re-identify a
 * subject by public lookup). Rows are sorted (subject, then time) so exports
 * are reproducible / diffable.
 */
/**
 * Pseudonymise the quasi-identifying WORK identifiers inside an event payload —
 * a publication DOI / OpenAlex source id resolves (via Crossref/OpenAlex) to a
 * public author list, so a single distinctive own-work DOI could re-identify a
 * pseudonymous subject WITHOUT the key table. We HMAC them with the same salt so
 * the analyst keeps a consistent per-work token (work-level grouping is the
 * disambiguation signal) but cannot resolve it to a real publication or author.
 */
function deidentifyPayload(payload: unknown, salt: string): unknown {
  if (!payload || typeof payload !== "object") return payload;
  const p = payload as Record<string, unknown>;
  const out: Record<string, unknown> = { ...p };
  if (typeof p.sourceId === "string") out.sourceId = pseudonymise(p.sourceId, salt);
  if (typeof p.itemId === "string") out.itemId = pseudonymise(p.itemId, salt);
  if (p.meta && typeof p.meta === "object") {
    const meta = p.meta as Record<string, unknown>;
    if (typeof meta.doi === "string") {
      out.meta = { ...meta, doi: pseudonymise(meta.doi, salt) };
    }
  }
  return out;
}

export function buildResearchExport(
  subjects: readonly ResearchSubjectInput[],
  salt: string,
): ResearchExportRow[] {
  const rows: ResearchExportRow[] = [];
  for (const s of subjects) {
    if (!s.researchConsent) continue;
    const subject = pseudonymise(s.userId, salt);
    for (const e of s.events) {
      if (!PRE_REGISTERED.has(e.type)) continue;
      rows.push({
        subject,
        consentVersion: s.researchConsentVersion,
        eventType: e.type,
        at: e.createdAt.toISOString(),
        payload: deidentifyPayload(e.payload, salt),
      });
    }
  }
  rows.sort((a, b) =>
    a.subject === b.subject ? a.at.localeCompare(b.at) : a.subject.localeCompare(b.subject),
  );
  return rows;
}

/**
 * One row of the re-identification key table (対照表) — **IDENTIFYING**.
 * Maps each pseudonym back to the account identity, so that (and only that) the
 * 個人情報管理者 (personal-information manager) can honour a withdrawal/erasure
 * request. This table is held under access control by the personal-information
 * manager and is **never** given to the analyst, who works from the de-identified
 * dataset (`ResearchExportRow`) alone. (Matches the protocol §4.2.1.)
 */
export interface KeyTableRow {
  /** The same keyed-HMAC pseudonym used in the de-identified dataset. */
  subject: string;
  /** Internal account id. */
  userId: string;
  /** Account identity (any field may be null). */
  name: string | null;
  email: string | null;
  orcid: string | null;
  /** Consent-notice version the subject agreed under, and when (audit trail). */
  consentVersion: number | null;
  consentAt: string | null;
}

/**
 * Build the re-identification key table (対照表) from raw consenting-user records.
 * Pure + deterministic given `(subjects, salt)`; the `subject` column equals the
 * pseudonym in `buildResearchExport`, so the two outputs join on `subject`.
 *
 * This is the SEPARATE artifact the personal-information manager keeps; the
 * de-identified analysis dataset (`buildResearchExport`) carries none of these
 * identifiers. Keeping them in two functions/files is what makes the analyst's
 * copy non-re-identifiable without the manager's key table.
 */
export function buildKeyTable(
  subjects: readonly ResearchSubjectInput[],
  salt: string,
): KeyTableRow[] {
  const rows: KeyTableRow[] = [];
  for (const s of subjects) {
    if (!s.researchConsent) continue;
    const consentAt = s.identity?.consentAt;
    rows.push({
      subject: pseudonymise(s.userId, salt),
      userId: s.userId,
      name: s.identity?.name ?? null,
      email: s.identity?.email ?? null,
      orcid: s.identity?.orcid ?? null,
      consentVersion: s.researchConsentVersion,
      consentAt: consentAt ? consentAt.toISOString() : null,
    });
  }
  rows.sort((a, b) => a.subject.localeCompare(b.subject));
  return rows;
}

/** Serialise rows as JSON Lines (one object per line). Used for both the
 *  de-identified dataset and the key table. */
export function toJsonl(rows: readonly object[]): string {
  if (rows.length === 0) return "";
  return rows.map((r) => JSON.stringify(r)).join("\n") + "\n";
}

/** Minimum acceptable length for the pseudonymisation salt. */
export const MIN_SALT_LENGTH = 16;

/**
 * Result of the hard gate. A discriminated union so callers that pass the
 * `enabled` check get `irbRef` + `salt` without optional-chaining.
 */
export type ResearchExportGate =
  | { enabled: false; reason: string }
  | { enabled: true; irbRef: string; salt: string };

/**
 * Hard gate for the researcher export. DISABLED unless ALL of:
 *   • `RESEARCH_EXPORT_ENABLED` === "true"
 *   • `RESEARCH_EXPORT_IRB_REF` is set (the approval number — recorded in the
 *     output filename for the audit trail)
 *   • `RESEARCH_EXPORT_PSEUDONYM_SALT` is set and ≥ `MIN_SALT_LENGTH` chars
 *
 * Read straight from `process.env` (same rationale as `enabled.ts`): a single
 * deliberate opt-in that an unrelated malformed env var can never flip on. The
 * `env` parameter is injectable for tests.
 */
export function researchExportGate(
  env: Record<string, string | undefined> = process.env,
): ResearchExportGate {
  if (env.RESEARCH_EXPORT_ENABLED !== "true") {
    return {
      enabled: false,
      reason: 'RESEARCH_EXPORT_ENABLED is not "true" (IRB-gated; off by default)',
    };
  }
  const irbRef = (env.RESEARCH_EXPORT_IRB_REF ?? "").trim();
  if (!irbRef) {
    return {
      enabled: false,
      reason: "RESEARCH_EXPORT_IRB_REF is required (record the IRB approval number)",
    };
  }
  const salt = env.RESEARCH_EXPORT_PSEUDONYM_SALT ?? "";
  if (salt.length < MIN_SALT_LENGTH) {
    return {
      enabled: false,
      reason: `RESEARCH_EXPORT_PSEUDONYM_SALT must be at least ${MIN_SALT_LENGTH} characters`,
    };
  }
  return { enabled: true, irbRef, salt };
}
