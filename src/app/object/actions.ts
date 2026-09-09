"use server";

import { signIn } from "@/auth";
import { OBJECTION_DONE_PATH, OBJECTION_PROVIDER_ID } from "@/lib/auth/objectionProvider";

/**
 * The `/object` page's single consent action: send the visitor to ORCID through
 * the objection provider. Clicking the clearly labelled button IS the consent
 * (nothing is pre-ticked; nothing happens before the click). Auth.js's signIn
 * callback records the objection on the way back and aborts the sign-in, so no
 * account or session is ever created; the visitor lands on /object/done.
 */
export async function objectWithOrcid(): Promise<void> {
  await signIn(OBJECTION_PROVIDER_ID, { redirectTo: OBJECTION_DONE_PATH });
}
