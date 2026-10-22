import type { Prisma } from "@/generated/prisma/client";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { logger } from "@/lib/log";
import { prisma } from "@/lib/db";
import {
  compositionSnapshot,
  diffDuplicateDismissals,
  diffIncludedChanges,
  diffNotMineChanges,
} from "./diff";
import { isResearchLoggingEnabled } from "./enabled";
import { RESEARCH_CONSENT_VERSION } from "./consent";

/**
 * Version of the research consent (2 = study 2026-0310 as approved). Defined in
 * the client-safe `consent/` module beside the texts it versions, and
 * re-exported here: each user's stored `researchConsentVersion` records what
 * they agreed to, and logging needs it to be this one.
 */
export { RESEARCH_CONSENT_VERSION };

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
    select: { researchConsent: true, researchConsentVersion: true },
  });
  // Consent must be CURRENT: a bumped RESEARCH_CONSENT_VERSION (the documented
  // re-enable step) invalidates consent given under the old terms, so the user
  // re-consents before logging resumes. Stale consent never authorises logging.
  return user?.researchConsent === true && user.researchConsentVersion === RESEARCH_CONSENT_VERSION;
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
    // Programme-level switch: paused until an IRB protocol is in place. Checked
    // before consent so a stored `researchConsent: true` never logs while off.
    if (!isResearchLoggingEnabled()) return;
    if (!(await hasConsent(userId))) return;

    const events: Prisma.ResearchEventCreateManyInput[] = diffIncludedChanges(prev, next).map(
      (correction) => ({
        userId,
        type: "curation_correction",
        payload: correction as unknown as Prisma.InputJsonValue,
      }),
    );

    // Disambiguation assertions ("not mine") are a distinct, stronger signal.
    for (const assertion of diffNotMineChanges(prev, next)) {
      events.push({
        userId,
        type: "disambiguation_assertion",
        payload: assertion as unknown as Prisma.InputJsonValue,
      });
    }

    // "Keep both" dismissals — the detector's false-positive signal (a count
    // only, no identifiers), letting the de-duplication study measure precision.
    const dismissals = diffDuplicateDismissals(prev, next);
    if (dismissals > 0) {
      events.push({
        userId,
        type: "duplicate_dismissal",
        payload: { count: dismissals } as unknown as Prisma.InputJsonValue,
      });
    }

    events.push({
      userId,
      type: "composition_snapshot",
      payload: compositionSnapshot(next) as unknown as Prisma.InputJsonValue,
    });

    await prisma.researchEvent.createMany({ data: events });
  } catch (err) {
    logger.error("research.log_cv_save_failed", { err });
  }
}
