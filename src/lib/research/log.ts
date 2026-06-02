import type { Prisma } from "@/generated/prisma/client";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { prisma } from "@/lib/db";
import {
  compositionSnapshot,
  diffIncludedChanges,
  diffNotMineChanges,
} from "./diff";

/**
 * Consent-gated research logging.
 *
 * NOTHING is written unless the user has explicitly opted in
 * (`User.researchConsent === true`). Events are cascade-deleted with the
 * account and included in the data-export endpoint. Confirmatory analyses on
 * this data must be pre-registered under an IRB protocol (see CLAUDE.md).
 */
async function hasConsent(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { researchConsent: true },
  });
  return user?.researchConsent === true;
}

/**
 * Log curation corrections (mine/not-mine flips) + a composition snapshot on
 * each save. Best-effort and consent-gated; never throws into the save path.
 */
export async function logCvSave(
  userId: string,
  prev: CanonicalCv | null,
  next: CanonicalCv,
): Promise<void> {
  try {
    if (!(await hasConsent(userId))) return;

    const events: Prisma.ResearchEventCreateManyInput[] = diffIncludedChanges(
      prev,
      next,
    ).map((correction) => ({
      userId,
      type: "curation_correction",
      payload: correction as unknown as Prisma.InputJsonValue,
    }));

    // Disambiguation assertions ("not mine") are a distinct, stronger signal.
    for (const assertion of diffNotMineChanges(prev, next)) {
      events.push({
        userId,
        type: "disambiguation_assertion",
        payload: assertion as unknown as Prisma.InputJsonValue,
      });
    }

    events.push({
      userId,
      type: "composition_snapshot",
      payload: compositionSnapshot(next) as unknown as Prisma.InputJsonValue,
    });

    await prisma.researchEvent.createMany({ data: events });
  } catch (err) {
    console.error("[research] failed to log CV save", err);
  }
}
