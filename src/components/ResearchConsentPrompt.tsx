"use client";

import { useEffect, useRef, useState } from "react";
import { consentStrings, t } from "@/lib/i18n";
import { localePrivacyPath } from "@/lib/seo";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

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
  /** UI locale (follows the CV's display language). */
  locale: string;
}

export default function ResearchConsentPrompt({
  initialConsent,
  locale,
}: ResearchConsentPromptProps) {
  const [mode, setMode] = useState<Mode>("hidden");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const s = consentStrings(locale);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Modal a11y for the first-use prompt: move focus in, trap Tab, close on
  // Escape (= "not now"), and restore focus to the trigger on close (WCAG 2.4.3).
  useEffect(() => {
    if (mode !== "prompt") return;
    restoreFocusRef.current = (document.activeElement as HTMLElement) ?? null;
    const dialog = dialogRef.current;
    dialog?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        markSeen();
        setMode("hidden");
        return;
      }
      if (e.key !== "Tab" || !dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      restoreFocusRef.current?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

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
      setError(s.error);
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

  if (mode === "prompt") {
    return (
      <div className="consent-overlay" role="presentation">
        <div
          className="consent-prompt"
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-title"
          aria-describedby="consent-desc"
          ref={dialogRef}
        >
          <h2 id="consent-title">{s.title}</h2>
          <p id="consent-desc">{s.blurb}</p>
          <p className="consent-learn-more">
            <a href={localePrivacyPath(locale)} target="_blank" rel="noopener noreferrer">
              {t(locale, "privacy")}
            </a>
          </p>
          {error ? (
            <p className="consent-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="consent-actions">
            <button type="button" className="btn btn-primary" onClick={accept} disabled={busy}>
              {s.yes}
            </button>
            <button type="button" className="btn" onClick={declinePrompt} disabled={busy}>
              {s.notNow}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // banner
  return (
    <div className="consent-banner" role="region" aria-label={s.title}>
      <p className="consent-banner-text">{s.blurb}</p>
      {error ? (
        <span className="consent-error" role="alert">
          {error}
        </span>
      ) : null}
      <div className="consent-actions">
        <button
          type="button"
          className="btn btn-small btn-primary"
          onClick={accept}
          disabled={busy}
        >
          {s.contribute}
        </button>
        <button
          type="button"
          className="btn btn-small"
          onClick={dismissBanner}
          disabled={busy}
          aria-label={s.dismiss}
        >
          {s.dismiss}
        </button>
      </div>
    </div>
  );
}
