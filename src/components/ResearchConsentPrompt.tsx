"use client";

import { useEffect, useState } from "react";

/**
 * Research-consent onboarding.
 *
 * Consent is opt-in and OFF by default (GDPR + Japan APPI): nothing is ever
 * pre-checked or auto-enabled. We simply *ask* at the right moment:
 *   • first visit  → a one-time modal prompt explaining what would be logged;
 *   • later visits → if they still haven't accepted, a quiet dismissible banner
 *     once per browser session.
 *
 * Persistence is client-side only (no extra account field): localStorage records
 * that the one-time prompt was shown; sessionStorage records a per-session banner
 * dismissal. The authoritative consent flag lives on the account and is set via
 * /api/account/consent (same endpoint as the settings toggle).
 */

const SEEN_KEY = "sigmacv:researchPromptSeen";
const DISMISS_KEY = "sigmacv:researchBannerDismissed";

type Mode = "hidden" | "prompt" | "banner";

interface ResearchConsentPromptProps {
  /** The account's stored consent flag (server-rendered). */
  initialConsent: boolean;
}

export default function ResearchConsentPrompt({
  initialConsent,
}: ResearchConsentPromptProps) {
  const [mode, setMode] = useState<Mode>("hidden");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Decide what (if anything) to show — client-only, so SSR stays inert.
  useEffect(() => {
    if (initialConsent) return; // already opted in — never nag
    try {
      const seen = window.localStorage.getItem(SEEN_KEY);
      if (!seen) {
        setMode("prompt");
        return;
      }
      const dismissed = window.sessionStorage.getItem(DISMISS_KEY);
      if (!dismissed) setMode("banner");
    } catch {
      // Storage blocked (private mode / cookies off) → show the prompt once.
      setMode("prompt");
    }
  }, [initialConsent]);

  function markSeen() {
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* storage may be unavailable; non-fatal */
    }
  }

  async function accept() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true }),
      });
      if (!res.ok) throw new Error("consent update failed");
      markSeen();
      setMode("hidden");
    } catch {
      setError("Couldn’t save your choice — please try again.");
    } finally {
      setBusy(false);
    }
  }

  // "Not now" on the first-use prompt: remember it was shown, fall through to a
  // per-session banner on later visits until they decide.
  function declinePrompt() {
    markSeen();
    setMode("hidden");
  }

  function dismissBanner() {
    try {
      window.sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* non-fatal */
    }
    setMode("hidden");
  }

  if (mode === "hidden") return null;

  const blurb = (
    <>
      Help improve responsible research assessment. With your consent, SigmaCV
      logs your <strong>“mine / not mine” corrections</strong> and{" "}
      <strong>CV-composition choices</strong> (never your private data) to study
      author disambiguation and metric norms. It’s optional, off by default, and
      you can turn it off anytime in your account.
    </>
  );

  if (mode === "prompt") {
    return (
      <div className="consent-overlay" role="presentation">
        <div
          className="consent-prompt"
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-title"
        >
          <h2 id="consent-title">Contribute to open research?</h2>
          <p>{blurb}</p>
          {error ? <p className="consent-error">{error}</p> : null}
          <div className="consent-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={accept}
              disabled={busy}
            >
              {busy ? "Saving…" : "Yes, contribute"}
            </button>
            <button
              type="button"
              className="btn"
              onClick={declinePrompt}
              disabled={busy}
            >
              Not now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // banner
  return (
    <div className="consent-banner" role="region" aria-label="Research consent">
      <p className="consent-banner-text">{blurb}</p>
      {error ? <span className="consent-error">{error}</span> : null}
      <div className="consent-actions">
        <button
          type="button"
          className="btn btn-small btn-primary"
          onClick={accept}
          disabled={busy}
        >
          {busy ? "Saving…" : "Contribute"}
        </button>
        <button
          type="button"
          className="btn btn-small"
          onClick={dismissBanner}
          disabled={busy}
          aria-label="Dismiss"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
