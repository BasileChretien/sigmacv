import { validOrcidOrNull } from "@/lib/orcid/validate";
import { setOrcidPreviewSuppressed } from "@/lib/cv/previewSuppression";
import { logger } from "@/lib/log";

/**
 * The self-service objection flow (`/object`), wired into Auth.js.
 *
 * A researcher who never used SigmaCV proves control of an ORCID iD by signing
 * in at ORCID through a SECOND provider id, {@link OBJECTION_PROVIDER_ID} —
 * the same ORCID app, client and issuer as the login provider, only a
 * different callback path (`/api/auth/callback/orcid-object`, registered on
 * the ORCID app as a second redirect URI). Auth.js's `signIn` callback runs
 * BEFORE the adapter creates a user, so returning a redirect string here
 * records the objection and aborts the sign-in: no User row, no session.
 *
 * Why a second provider rather than an intent cookie on the login provider:
 * a cookie left behind by an abandoned objection could hijack an ordinary
 * "Sign in with ORCID" minutes later; a provider id is bound to the very OAuth
 * round trip the visitor started from `/object`, and nothing else.
 *
 * Outcomes are carried in the redirect URL (`?outcome=…`), never the iD.
 */
import { OBJECTION_DONE_PATH, OBJECTION_PROVIDER_ID } from "./objectionProvider";

export { OBJECTION_PROVIDER_ID };

export type ObjectionOutcome = "suppressed" | "failed" | "unavailable";

export function objectionDonePath(outcome: ObjectionOutcome): string {
  return `${OBJECTION_DONE_PATH}?outcome=${outcome}`;
}

/**
 * Auth.js `signIn` callback half: `true` lets an ordinary sign-in proceed
 * unchanged; for the objection provider it returns the redirect that aborts
 * the sign-in, after recording (or failing to record) the objection.
 */
export async function handleObjectionSignIn(account: {
  provider?: string;
  providerAccountId?: string;
} | null): Promise<true | string> {
  if (account?.provider !== OBJECTION_PROVIDER_ID) return true;
  const orcid = validOrcidOrNull(account.providerAccountId ?? "");
  if (!orcid) return objectionDonePath("failed");
  try {
    const result = await setOrcidPreviewSuppressed(orcid, true, "orcid-oauth");
    return objectionDonePath(result === "unavailable" ? "unavailable" : "suppressed");
  } catch (err) {
    logger.error("objection.record_failed", { err });
    return objectionDonePath("failed");
  }
}
