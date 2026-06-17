"use server";

import { signIn } from "@/auth";

/**
 * Shared sign-in server actions used by both the default ("/") and the
 * localized ("/[locale]") landing pages, so the marketing markup can live in a
 * single <Landing> component without duplicating the auth wiring.
 */

export async function signInWithOrcid(): Promise<void> {
  await signIn("orcid", { redirectTo: "/cv" });
}

export async function signInWithGoogle(): Promise<void> {
  await signIn("google", { redirectTo: "/cv" });
}

export async function signInWithEmail(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  // On success Auth.js sends the one-time link and redirects to the
  // `verifyRequest` page (`/auth/check-email`, see auth.config.ts) — so the user
  // gets an explicit "check your inbox" confirmation rather than landing back on
  // the homepage. `redirectTo` is where the *link* lands after it's clicked.
  if (email) await signIn("email", { email, redirectTo: "/cv" });
}
