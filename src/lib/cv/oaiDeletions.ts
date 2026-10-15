import { prisma } from "@/lib/db";
import { logger } from "@/lib/log";
import { safeParseCanonicalCv } from "@/lib/canonical/schema";
import {
  NOTHING_EXPOSED,
  WHOLE_REPOSITORY,
  deletionsBetween,
  harvestExposure,
  harvestRecord,
  parseHarvestExposure,
  type HarvestExposure,
  type OaiDeletionKey,
} from "@/lib/cv/oaiState";

/**
 * The OAI-PMH endpoint's deleted records (`OaiDeletion`): what a write or an
 * account deletion stopped serving, answered as `status="deleted"` so that a
 * harvester running deltas removes its copy, and kept for
 * {@link OAI_DELETION_RETENTION_DAYS} days (Identify says
 * `deletedRecord=transient`: a harvester that comes back less often than that
 * should harvest in full).
 *
 * Each row holds an identifier, a set ("" for the repository) and a date —
 * nothing else. The identifier carries the page's slug, which carries the
 * owner's name, so the rows outlive an erased account for the retention
 * period only, for the one purpose of telling harvesters to delete their copy
 * (GDPR Art. 17(2)); the privacy notice says so.
 *
 * Writes are fail-soft: a missing deletion row degrades a harvester's delta,
 * and must never fail the owner's save, publish change or account deletion.
 */

/** How long a deleted record is answered for. */
export const OAI_DELETION_RETENTION_DAYS = 30;

const DAY_MS = 86_400_000;
/** One second, the repository's datestamp granularity (`until` is inclusive). */
const SECOND_MS = 1000;
/** Rows per statement: well under Postgres's bind-parameter limit at three
 *  parameters a row, for a CV near the 12,000-item cap. */
const CHUNK = 1000;

function chunks<T>(items: readonly T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += CHUNK) out.push(items.slice(i, i + CHUNK));
  return out;
}

/** What a write did to the harvest, as {@link applyOaiDeletions} needs it. */
export interface OaiDeletionChange {
  deletions: OaiDeletionKey[];
  served: HarvestExposure;
}

/**
 * Record what a write stopped serving, dated `now`, and clear the deletions of
 * everything it serves (a record that came back, in the repository or in its
 * set, is no longer deleted). A key deleted again moves to the new date. Runs
 * AFTER the CV write: until then the record is still served.
 */
export async function applyOaiDeletions(change: OaiDeletionChange, now: Date): Promise<void> {
  try {
    const servedSets = change.served.set
      ? [WHOLE_REPOSITORY, change.served.set]
      : [WHOLE_REPOSITORY];
    for (const ids of chunks(change.served.ids)) {
      await prisma.oaiDeletion.deleteMany({
        where: { identifier: { in: ids }, setSpec: { in: servedSets } },
      });
    }
    // A key deleted again moves to the new date: its old row goes first. Set
    // by set, so a delete matches exactly the keys it names (a cross product
    // of identifiers and sets would reach other keys), and every delete runs
    // before any write, so no chunk can remove a row another chunk wrote.
    const bySet = new Map<string, string[]>();
    for (const k of change.deletions)
      bySet.set(k.setSpec, [...(bySet.get(k.setSpec) ?? []), k.identifier]);
    for (const [setSpec, identifiers] of bySet) {
      for (const ids of chunks(identifiers)) {
        await prisma.oaiDeletion.deleteMany({ where: { identifier: { in: ids }, setSpec } });
      }
    }
    for (const keys of chunks(change.deletions)) {
      await prisma.oaiDeletion.createMany({
        data: keys.map((k) => ({ ...k, deletedAt: now })),
        skipDuplicates: true,
      });
    }
  } catch (err) {
    logger.warn("oai.deletions_failed", { deletions: change.deletions.length, err });
  }
}

/**
 * Before an account is deleted: record everything its CV serves as deleted
 * (the cascade is about to remove the row that knows it). Reads the stored
 * exposure, or derives it from the document for a row that has none.
 * Fail-soft: the erasure itself never waits on this.
 */
export async function withdrawOaiRecords(userId: string, now: Date): Promise<void> {
  try {
    const row = await prisma.cv.findUnique({
      where: { userId },
      select: {
        published: true,
        publicIndexable: true,
        publicSlug: true,
        listUnderAffiliation: true,
        currentRorId: true,
        oaiExposure: true,
        document: true,
      },
    });
    if (!row) return;
    const parsed = safeParseCanonicalCv(row.document);
    const before =
      parseHarvestExposure(row.oaiExposure) ??
      harvestExposure(harvestRecord(row, parsed.success ? parsed.data : null, now));
    await applyOaiDeletions(
      { deletions: deletionsBetween(before, NOTHING_EXPOSED), served: NOTHING_EXPOSED },
      now,
    );
  } catch (err) {
    logger.warn("oai.withdraw_failed", { err });
  }
}

/** The filters of a deleted-records listing: one set ("" = the repository) and
 *  the request's dates (`until` inclusive to the second). */
export interface OaiDeletionFilters {
  setSpec: string;
  from?: Date;
  until?: Date;
}

function deletionWhere(f: OaiDeletionFilters) {
  return {
    setSpec: f.setSpec,
    ...(f.from || f.until
      ? {
          deletedAt: {
            ...(f.from ? { gte: f.from } : {}),
            ...(f.until ? { lt: new Date(f.until.getTime() + SECOND_MS) } : {}),
          },
        }
      : {}),
  };
}

/** Whether any deleted record matches (decides whether a list's last live
 *  page hands on to the deleted ones). */
export async function hasOaiDeletions(f: OaiDeletionFilters): Promise<boolean> {
  const row = await prisma.oaiDeletion.findFirst({
    where: deletionWhere(f),
    select: { identifier: true },
  });
  return row !== null;
}

/** A page of deleted records and where the next starts. */
export interface OaiDeletionPage {
  rows: Array<{ identifier: string; deletedAt: Date }>;
  /** The id of the last row on this page, or null when none follows. */
  next: string | null;
}

/** Deleted records in id order (unique and short, so no identifier can stall
 *  the list), after the row id `after` ("" = from the first); one row past the
 *  page tells whether another follows. */
export async function listOaiDeletions(
  f: OaiDeletionFilters & { after: string; limit: number },
): Promise<OaiDeletionPage> {
  const rows = await prisma.oaiDeletion.findMany({
    where: { ...deletionWhere(f), ...(f.after ? { id: { gt: f.after } } : {}) },
    select: { id: true, identifier: true, deletedAt: true },
    orderBy: { id: "asc" },
    take: f.limit + 1,
  });
  const page = rows.slice(0, f.limit);
  if (rows.length <= f.limit) return { rows: page.map(stripId), next: null };
  // `limit` ≥ 1, so when a row follows the page the page has a last row.
  return { rows: page.map(stripId), next: page[page.length - 1]!.id };
}

function stripId(row: { identifier: string; deletedAt: Date }) {
  return { identifier: row.identifier, deletedAt: row.deletedAt };
}

/** When an identifier was deleted from the repository, or null. */
export async function findOaiDeletion(identifier: string): Promise<Date | null> {
  const row = await prisma.oaiDeletion.findUnique({
    where: { identifier_setSpec: { identifier, setSpec: WHOLE_REPOSITORY } },
    select: { deletedAt: true },
  });
  return row?.deletedAt ?? null;
}

/** Drop the deleted records older than the retention period (the resync cron
 *  tick). Fail-soft; returns how many went, or 0. */
export async function purgeExpiredOaiDeletions(now: Date): Promise<number> {
  try {
    const res = await prisma.oaiDeletion.deleteMany({
      where: { deletedAt: { lt: new Date(now.getTime() - OAI_DELETION_RETENTION_DAYS * DAY_MS) } },
    });
    return res.count;
  } catch (err) {
    logger.warn("oai.deletions_purge_failed", { err });
    return 0;
  }
}
