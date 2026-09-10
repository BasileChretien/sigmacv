"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";

/**
 * Fires one cookieless product event when the sign-in error page renders, so
 * the analytics say *which kind* of failure sends people there. The prop is our
 * own mapped bucket (never the raw `?error` value, never anything about the
 * person) — Plausible drops query strings, and neither Auth.js nor the proxy
 * logs the code, so without this the failures are invisible.
 */
export default function AuthErrorPing({ code }: { code: string }) {
  useEffect(() => {
    trackEvent("Sign-in error", { code });
  }, [code]);
  return null;
}
