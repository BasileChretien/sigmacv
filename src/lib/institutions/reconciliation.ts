import {
  reconciliationSources,
  type ReconciliationSource,
  type ReconciliationSources,
} from "@/lib/cv/listed";
import { logger } from "@/lib/log";
import {
  parseReconciliationWorkRows,
  withIdentity,
  type ReconciliationRow,
} from "./reconciliationRows";

/**
 * The institution reconciliation export (`/i/<ror>/reconciliation.csv|json`):
 * the per-work rows of every researcher who opted in a SECOND time under this
 * ROR and designated a public frozen version — assembled from the database
 * alone (`@/lib/cv/listed`, the institution surfaces' only reader), never from
 * the live document, never from the frozen document either, and never from
 * the network (both invariant suites cover this module and the two route
 * handlers). Each source's rows were computed ONCE, when its owner designated
 * the version (`CvSnapshot.reconciliationRows`, written by `snapshotStore.ts`
 * from the frozen document); a public request only parses that stored value
 * back (a stored row is external data) and adds the two identity columns —
 * the owner's ORCID iD and the consented ids still current — from columns the
 * reader already selected, so serving the export costs no document parse.
 *
 * No aggregate, no ratio, no comparison with anything: the envelope carries
 * the rows, how many, how many researchers, and whether the reader's bound
 * was hit. A CV whose owner has no ORCID iD, or whose stored rows no longer
 * validate, contributes nothing and is not counted.
 */
export interface ReconciliationExport {
  /** Bare ROR id. */
  ror: string;
  /** When the export was assembled (ISO). */
  generatedAt: string;
  rowCount: number;
  /** How many researchers' designated versions the rows come from. */
  contributorCount: number;
  /** True when more opted-in CVs exist past the reader's bound. */
  truncated: boolean;
  rows: ReconciliationRow[];
}

/** The rows of one source, or null when it cannot contribute. */
function rowsOf(rorId: string, source: ReconciliationSource): ReconciliationRow[] | null {
  if (!source.orcid) return null;
  const rows = parseReconciliationWorkRows(source.snapshot.reconciliationRows);
  if (rows === null) {
    logger.warn("reconciliation.stored_rows_invalid", {
      rorId,
      version: source.snapshot.version,
    });
    return null;
  }
  // The lapse rule, applied on the same two columns the reader filtered on:
  // only a consented id that is still a visible current position rides a row.
  const current = new Set(source.visibleCurrentRorIds);
  const activeRorIds = source.consentedRorIds.filter((id) => current.has(id));
  return withIdentity(rows, { orcid: source.orcid, activeRorIds });
}

/** Assemble the export for one ROR id from the reader's sources. */
export function assembleReconciliationExport(
  rorId: string,
  sources: ReconciliationSources,
  now: Date = new Date(),
): ReconciliationExport {
  const rows: ReconciliationRow[] = [];
  let contributorCount = 0;
  for (const source of sources.sources) {
    const contributed = rowsOf(rorId, source);
    if (contributed === null) continue;
    contributorCount += 1;
    rows.push(...contributed);
  }
  return {
    ror: rorId,
    generatedAt: now.toISOString(),
    rowCount: rows.length,
    contributorCount,
    truncated: sources.truncated,
    rows,
  };
}

/** The export for one ROR id, read from the database. */
export async function reconciliationExport(
  rorId: string,
  now: Date = new Date(),
): Promise<ReconciliationExport> {
  return assembleReconciliationExport(rorId, await reconciliationSources(rorId), now);
}
