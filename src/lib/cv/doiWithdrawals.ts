import { prisma } from "@/lib/db";
import { doiMintingEnabled, tombstoneSnapshotDoi } from "@/lib/datacite/mint";
import { logger } from "@/lib/log";

/**
 * Retry queue for minted snapshot DOIs whose withdrawal at DataCite failed at
 * the moment the account was deleted (`DoiWithdrawal` rows).
 *
 * WHY: `withdrawMintedSnapshotDois` (snapshotStore.ts) runs BEFORE the
 * `User → Cv → CvSnapshot` cascade, and that cascade removes the only other copy
 * of the DOI. Without this queue a DataCite outage during deletion would leave
 * the record findable — name, ORCID, affiliation, references — forever, with
 * nothing left to retry from. So every DOI NOT confirmed withdrawn is parked
 * here (DOI + retry counter + last machine reason, no user FK, no personal
 * data) and the internal resync cron drains the queue until DataCite accepts
 * the hide, then deletes the row.
 *
 * The retry cannot send the owner's name — the queue deliberately holds none —
 * so a drained withdrawal minimises the record further (placeholder creator,
 * see `tombstoneSnapshotDoi`). That is the right direction: the owner asked
 * for erasure.
 *
 * Fail-soft throughout: nothing here ever throws into a caller.
 */

/** Queued DOIs retried per cron run (each is one DataCite PUT). */
export const DOI_WITHDRAWAL_DRAIN_LIMIT = 20;

/**
 * A DOI that has failed this many times is left in the table for the
 * maintainer (a permanent DataCite refusal — e.g. the DOI is not ours — would
 * otherwise be retried on every run forever). The row itself is the alert.
 */
export const DOI_WITHDRAWAL_MAX_ATTEMPTS = 30;

/**
 * Park a DOI whose withdrawal was not confirmed. Idempotent: a second failure
 * for the same DOI bumps `attempts` and refreshes `lastError`. Never throws —
 * the account deletion it runs inside must proceed regardless — but a queue
 * write that fails IS the one case where the DOI is genuinely lost, hence the
 * error-level log.
 */
export async function recordPendingDoiWithdrawal(doi: string, reason: string): Promise<void> {
  try {
    await prisma.doiWithdrawal.upsert({
      where: { doi },
      create: { doi, lastError: reason },
      update: { attempts: { increment: 1 }, lastError: reason },
    });
  } catch (err) {
    logger.error("snapshot.doi_withdrawal_queue_failed", { err, doi, reason });
  }
}

/**
 * Retry the queued withdrawals, oldest first, at most `limit` per run, skipping
 * DOIs that already hit {@link DOI_WITHDRAWAL_MAX_ATTEMPTS}. A confirmed hide
 * deletes the row; a failure bumps the counter. A no-op (not even a DB read)
 * while minting is disabled: the tombstone call would only report "disabled".
 */
export async function drainPendingDoiWithdrawals(
  opts: { limit?: number } = {},
): Promise<{ attempted: number; withdrawn: number }> {
  if (!doiMintingEnabled()) return { attempted: 0, withdrawn: 0 };
  let attempted = 0;
  let withdrawn = 0;
  try {
    const rows = await prisma.doiWithdrawal.findMany({
      where: { attempts: { lt: DOI_WITHDRAWAL_MAX_ATTEMPTS } },
      orderBy: { updatedAt: "asc" },
      take: opts.limit ?? DOI_WITHDRAWAL_DRAIN_LIMIT,
      select: { doi: true },
    });
    for (const { doi } of rows) {
      attempted += 1;
      const result = await tombstoneSnapshotDoi({ doi });
      if (result.ok) {
        await prisma.doiWithdrawal.delete({ where: { doi } });
        withdrawn += 1;
      } else {
        await prisma.doiWithdrawal.update({
          where: { doi },
          data: { attempts: { increment: 1 }, lastError: result.reason },
        });
      }
    }
  } catch (err) {
    logger.error("snapshot.doi_withdrawal_drain_failed", { err, attempted, withdrawn });
  }
  if (attempted > 0) {
    const level = attempted === withdrawn ? "info" : "warn";
    logger[level]("snapshot.doi_withdrawals_drained", { attempted, withdrawn });
  }
  return { attempted, withdrawn };
}
