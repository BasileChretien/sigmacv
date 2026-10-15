import { safeParseCanonicalCv } from "@/lib/canonical/schema";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/log";
import { MIN_SET_MEMBERS, countListedCvsExcept } from "@/lib/cv/listed";
import { applyOaiDeletions, type OaiDeletionChange } from "@/lib/cv/oaiDeletions";
import {
  NOTHING_EXPOSED,
  deletionsBetween,
  harvestExposure,
  harvestRecord,
  parseHarvestExposure,
  type HarvestColumns,
  type HarvestExposure,
} from "@/lib/cv/oaiState";
import { rorSetSpec } from "@/lib/oai/oai";

/**
 * The OAI-PMH set floor on the write side (`MIN_SET_MEMBERS`, `listed.ts`).
 *
 * What a write stores — `Cv.oaiFingerprint` and `Cv.oaiExposure` — is what the
 * endpoint SERVES, and a set below the floor is served to nobody. So a CV's
 * set enters its fingerprint and its exposure only while that set is open:
 * joining or leaving a closed set changes nothing anyone can harvest, and
 * moves no datestamp (a datestamp that moved with an invisible change would
 * tell a watcher of the institution page's count who had joined). Deleted
 * records follow from the exposure: a CV that leaves a set it was served in
 * is deleted from it; one that leaves a closed set was never in it.
 *
 * When a write takes a set across the floor, every OTHER member's served
 * record changes without a write of theirs: on opening their records gain the
 * set, on closing they lose it. Their stored exposure and datestamp move with
 * it, and on closing each of their records becomes a deleted record in the
 * set, so a harvester working through the set removes them (they were served
 * in it until then; nothing new is disclosed). This is {@link applySetCrossings}.
 */

/** The columns that decide a CV's set membership. */
export type SetColumns = Pick<
  HarvestColumns,
  "published" | "publicIndexable" | "listUnderAffiliation" | "currentRorId"
>;

/** The bare ROR id of the set a row is listed in, or null. */
export function listedSet(row: SetColumns | null): string | null {
  return row?.published && row.publicIndexable && row.listUnderAffiliation && row.currentRorId
    ? row.currentRorId
    : null;
}

/** A write's view of the floor: whether the CV's set was open before it and
 *  is open after it (false with no set), and the set it opens or closes. */
export interface SetFloor {
  openBefore: boolean;
  openAfter: boolean;
  /** Bare ROR id of a set this write brings up to the floor, or null. */
  opens: string | null;
  /** Bare ROR id of a set this write takes below the floor, or null. */
  closes: string | null;
}

/**
 * Read the floor for a write that takes a CV from `before` to `after` (null:
 * no row yet / no row any more). One count per set touched, of the OTHER
 * listed CVs (the writer's own row is left out by id, so the count does not
 * depend on whether its write has landed).
 */
export async function readSetFloor(
  cvId: string | null,
  before: SetColumns | null,
  after: SetColumns | null,
): Promise<SetFloor> {
  const prev = listedSet(before);
  const next = listedSet(after);
  const others = new Map<string, number>();
  for (const rorId of new Set([prev, next])) {
    if (rorId) others.set(rorId, await countListedCvsExcept(rorId, cvId));
  }
  const withThisCv = (rorId: string) => others.get(rorId)! + 1;
  return {
    openBefore: prev !== null && withThisCv(prev) >= MIN_SET_MEMBERS,
    openAfter: next !== null && withThisCv(next) >= MIN_SET_MEMBERS,
    opens: next !== null && next !== prev && withThisCv(next) === MIN_SET_MEMBERS ? next : null,
    closes:
      prev !== null && prev !== next && others.get(prev) === MIN_SET_MEMBERS - 1 ? prev : null,
  };
}

/**
 * After a write that opened or closed a set: move every other member with it
 * (see the module comment). Their stored exposure takes the set or loses it,
 * their datestamp moves, and on closing each of their records is a deleted
 * record in the set, while on opening their deletions from it are cleared.
 * Fail-soft: never fails the owner's write.
 */
export async function applySetCrossings(
  floor: SetFloor,
  cvId: string | null,
  now: Date,
): Promise<void> {
  try {
    if (floor.opens) await moveMembers(floor.opens, cvId, now, true);
    if (floor.closes) await moveMembers(floor.closes, cvId, now, false);
  } catch (err) {
    logger.warn("oai.set_floor_failed", { err });
  }
}

async function moveMembers(
  rorId: string,
  cvId: string | null,
  now: Date,
  opening: boolean,
): Promise<void> {
  const setSpec = rorSetSpec(rorId);
  const members = await prisma.cv.findMany({
    where: {
      published: true,
      publicIndexable: true,
      listUnderAffiliation: true,
      currentRorId: rorId,
      ...(cvId ? { id: { not: cvId } } : {}),
    },
    select: {
      id: true,
      published: true,
      publicIndexable: true,
      publicSlug: true,
      listUnderAffiliation: true,
      currentRorId: true,
      oaiExposure: true,
      document: true,
    },
  });
  for (const member of members) {
    const parsed = safeParseCanonicalCv(member.document);
    const ids = (
      parseHarvestExposure(member.oaiExposure) ??
      harvestExposure(harvestRecord(member, parsed.success ? parsed.data : null, now, !opening))
    ).ids;
    const served: HarvestExposure = { ids, set: opening ? setSpec : null };
    await prisma.cv.update({
      where: { id: member.id },
      data: { oaiExposure: served, publicChangedAt: now },
    });
    // Opening: served in the set again, so its deletions from the set go.
    // Closing: no longer served in it, so each record is deleted from it.
    await applyOaiDeletions(
      {
        deletions: opening ? [] : deletionsBetween({ ids, set: setSpec }, served),
        served,
      },
      now,
    );
  }
}

/** An account deletion's harvest side, read before the cascade. */
export interface OaiWithdrawal {
  change: OaiDeletionChange;
  floor: SetFloor;
  cvId: string;
}

/**
 * Before an account is deleted: what its CV serves (everything, all about to
 * be withdrawn) and the floor of its set, for {@link applyOaiWithdrawal} to
 * apply AFTER the deletion (the cascade removes the row that knows them; a
 * failed deletion then records nothing). Reads the stored exposure, or derives
 * it from the document for a row that has none. Null when there is no CV.
 * Fail-soft: the erasure itself never waits on this.
 */
export async function readOaiWithdrawal(userId: string, now: Date): Promise<OaiWithdrawal | null> {
  try {
    const row = await prisma.cv.findUnique({
      where: { userId },
      select: {
        id: true,
        published: true,
        publicIndexable: true,
        publicSlug: true,
        listUnderAffiliation: true,
        currentRorId: true,
        oaiExposure: true,
        document: true,
      },
    });
    if (!row) return null;
    const floor = await readSetFloor(row.id, row, null);
    const parsed = safeParseCanonicalCv(row.document);
    const before =
      parseHarvestExposure(row.oaiExposure) ??
      harvestExposure(
        harvestRecord(row, parsed.success ? parsed.data : null, now, floor.openBefore),
      );
    return {
      change: { deletions: deletionsBetween(before, NOTHING_EXPOSED), served: NOTHING_EXPOSED },
      floor,
      cvId: row.id,
    };
  } catch (err) {
    logger.warn("oai.withdraw_failed", { err });
    return null;
  }
}

/** After the account is deleted: record its withdrawal, and close its set if
 *  it was the one keeping the set at the floor. */
export async function applyOaiWithdrawal(withdrawal: OaiWithdrawal, now: Date): Promise<void> {
  await applyOaiDeletions(withdrawal.change, now);
  await applySetCrossings(withdrawal.floor, withdrawal.cvId, now);
}
