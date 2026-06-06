/**
 * Audit record for an upstream OpenAlex curation push (Phase 5).
 *
 * We REUSE the existing structured logger rather than adding a Prisma table:
 * a curation push is an OPERATIONAL event (did we attempt an upstream write, how
 * many assertions, what was the outcome), not research data, so it belongs in
 * the application log stream — not the consent-gated `ResearchEvent` store.
 *
 * Privacy: the audit line carries a pseudonymous subject (keyed-HMAC of the user
 * id, same convention as research/export.ts) when a salt is available, else a
 * short non-reversible hash — NEVER the raw user id, name, email or ORCID. Only
 * counts + the result status accompany it.
 */

import { createHmac, createHash } from "node:crypto";
import { logger } from "@/lib/log";
import type { CurationSubmitResult } from "./assert";

/**
 * Pseudonymise the user id for the audit line. Prefers a keyed HMAC with the
 * research pseudonym salt (so curation audits join the research dataset's
 * `subject` column when both exist); falls back to a plain SHA-256 prefix when no
 * salt is configured. Either way the raw id never reaches the log.
 */
export function auditSubject(
  userId: string,
  salt: string | undefined = process.env.RESEARCH_EXPORT_PSEUDONYM_SALT,
): string {
  if (salt && salt.length > 0) {
    return createHmac("sha256", salt).update(userId).digest("hex").slice(0, 16);
  }
  return createHash("sha256").update(userId).digest("hex").slice(0, 16);
}

/** The minimized, non-identifying fields recorded for one curation attempt. */
export interface CurationAuditRecord {
  /** Pseudonymous subject (never the raw user id). */
  subject: string;
  /** How many pending "not mine" assertions the user had. */
  assertionCount: number;
  /** Outcome of the submit attempt. */
  status: CurationSubmitResult["status"];
}

/**
 * Write the audit record for a curation push via the structured logger and
 * return it. The logger never throws (it hardens its own serialisation), so the
 * audit can't break the request that triggered it.
 */
export function recordCurationAudit(
  userId: string,
  assertionCount: number,
  result: CurationSubmitResult,
): CurationAuditRecord {
  const record: CurationAuditRecord = {
    subject: auditSubject(userId),
    assertionCount,
    status: result.status,
  };
  // The logger is itself dependency-free + internally hardened (it try/catches
  // its own JSON serialisation), so this single call won't throw into the route.
  logger.info("openalex.curation_audit", { ...record });
  return record;
}
