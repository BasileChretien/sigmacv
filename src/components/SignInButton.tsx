"use client";

import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics/track";

/**
 * Submit button for a sign-in form that fires a cookieless "Sign in" analytics
 * event (with the provider as a prop) before the form's server action runs — the
 * middle step of the landing → sign-in → publish funnel (M4). It does not call
 * `preventDefault`, so the form still submits normally; tracking is best-effort.
 *
 * No personal data is sent — only the auth method (orcid / google / email).
 */
interface SignInButtonProps {
  method: "orcid" | "google" | "email";
  className: string;
  children: ReactNode;
}

export default function SignInButton({ method, className, children }: SignInButtonProps) {
  return (
    <button type="submit" className={className} onClick={() => trackEvent("Sign in", { method })}>
      {children}
    </button>
  );
}
