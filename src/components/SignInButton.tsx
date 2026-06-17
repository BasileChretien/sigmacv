"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { trackEvent } from "@/lib/analytics/track";

/**
 * Submit button for a sign-in form that fires a cookieless "Sign in" analytics
 * event (with the provider as a prop) before the form's server action runs — the
 * middle step of the landing → sign-in → publish funnel (M4). It does not call
 * `preventDefault`, so the form still submits normally; tracking is best-effort.
 *
 * While the form's server action is in flight (`useFormStatus().pending`) — which
 * spans the multi-second OAuth redirect — the button disables itself, sets
 * `aria-busy`, and swaps to a "Signing in…" label. That stops a slow redirect
 * from looking frozen and prevents a double-submit kicking off a second OAuth
 * flow. `useFormStatus` reads the *enclosing* <form>, so each sign-in form gets
 * its own independent pending state.
 *
 * No personal data is sent — only the auth method (orcid / google / email).
 */
interface SignInButtonProps {
  method: "orcid" | "google" | "email";
  className: string;
  /** Localized busy label shown while the sign-in is redirecting. */
  pendingLabel: string;
  children: ReactNode;
}

export default function SignInButton({
  method,
  className,
  pendingLabel,
  children,
}: SignInButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={className}
      onClick={() => trackEvent("Sign in", { method })}
      disabled={pending}
      aria-busy={pending}
      data-pending={pending ? "" : undefined}
    >
      {pending ? <span aria-live="polite">{pendingLabel}</span> : children}
    </button>
  );
}
