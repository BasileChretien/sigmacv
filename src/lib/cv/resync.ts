import { prisma } from "@/lib/db";
import { syncCvForUser } from "./sync";

/**
 * Scheduled re-sync of published "living" CVs. Replaces the old on-view
 * best-effort re-sync: public-page GETs are now read-only, and a cron-triggered
 * batch (via /api/internal/resync) keeps published CVs fresh — sequentially,
 * with a DB lock and pacing to respect OpenAlex politeness.
 */

export const RESYNC_MIN_AGE_MS = 24 * 60 * 60 * 1000; // re-sync at most daily
const LOCK_STALE_MS = 10 * 60 * 1000; // auto-recover a lock left by a crash

export interface DueCv {
  id: string;
  userId: string;
  lastSyncedAt: Date | null;
  orcid: string | null;
  name: string | null;
}

/** Published CVs whose lastSyncedAt is null or older than minAgeMs (oldest first). */
export async function enumeratePublishedCvsDue(opts: {
  minAgeMs: number;
  limit: number;
  now?: number;
}): Promise<DueCv[]> {
  const now = opts.now ?? Date.now();
  const threshold = new Date(now - opts.minAgeMs);
  const rows = await prisma.cv.findMany({
    where: {
      published: true,
      OR: [{ lastSyncedAt: null }, { lastSyncedAt: { lt: threshold } }],
    },
    orderBy: { lastSyncedAt: "asc" },
    take: opts.limit,
    select: {
      id: true,
      userId: true,
      lastSyncedAt: true,
      user: { select: { orcid: true, name: true } },
    },
  });
  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    lastSyncedAt: r.lastSyncedAt,
    orcid: r.user.orcid,
    name: r.user.name,
  }));
}

/** Atomic compare-and-set lock; true if acquired. Re-acquires stale locks. */
export async function acquireResyncLock(
  cvId: string,
  now: number,
  staleMs: number = LOCK_STALE_MS,
): Promise<boolean> {
  const res = await prisma.cv.updateMany({
    where: {
      id: cvId,
      OR: [{ resyncLockedAt: null }, { resyncLockedAt: { lt: new Date(now - staleMs) } }],
    },
    data: { resyncLockedAt: new Date(now) },
  });
  return res.count === 1;
}

async function releaseResyncLock(cvId: string): Promise<void> {
  try {
    await prisma.cv.update({
      where: { id: cvId },
      data: { resyncLockedAt: null },
    });
  } catch {
    // best-effort; a stale lock self-recovers via LOCK_STALE_MS
  }
}

export interface ResyncSummary {
  scanned: number;
  synced: number;
  skipped: number;
  locked: number;
  failed: number;
  errors: string[];
}

const delay = (ms: number) =>
  ms > 0 ? new Promise<void>((r) => setTimeout(r, ms)) : Promise.resolve();

/**
 * Re-sync all due published CVs sequentially. Each is locked, synced via the
 * normal syncCvForUser path (which preserves curation and writes NO research
 * events — re-pulled works aren't curation flips), and paced between rows.
 */
export async function resyncDueCvs(
  opts: {
    minAgeMs?: number;
    batchLimit?: number;
    paceMs?: number;
    now?: number;
  } = {},
): Promise<ResyncSummary> {
  const minAgeMs = opts.minAgeMs ?? RESYNC_MIN_AGE_MS;
  const batchLimit = opts.batchLimit ?? 25;
  const paceMs = opts.paceMs ?? 1000;
  const now = opts.now ?? Date.now();

  const due = await enumeratePublishedCvsDue({ minAgeMs, limit: batchLimit, now });
  const summary: ResyncSummary = {
    scanned: due.length,
    synced: 0,
    skipped: 0,
    locked: 0,
    failed: 0,
    errors: [],
  };

  for (const cv of due) {
    if (!cv.orcid) {
      summary.skipped += 1;
      continue;
    }
    const acquired = await acquireResyncLock(cv.id, Date.now());
    if (!acquired) {
      summary.locked += 1;
      continue;
    }
    try {
      await syncCvForUser({
        userId: cv.userId,
        orcid: cv.orcid,
        fallbackName: cv.name ?? "",
      });
      summary.synced += 1;
    } catch (err) {
      summary.failed += 1;
      summary.errors.push(`${cv.id}: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      await releaseResyncLock(cv.id);
    }
    await delay(paceMs);
  }

  return summary;
}
