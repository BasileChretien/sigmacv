"use client";

import { useEffect, useRef, useState } from "react";
import { ui } from "@/lib/i18n/ui";

/**
 * GDPR/APPI self-service: withdraw research consent + data export + account
 * deletion. Opt-IN is handled by the onboarding prompt (ResearchConsentPrompt);
 * here we only surface a withdrawal control, and only when the user is currently
 * contributing — so withdrawal stays as easy as consent, without an always-on
 * topbar toggle.
 */
interface AccountControlsProps {
  researchConsent: boolean;
  locale: string;
}

export default function AccountControls({
  researchConsent,
  locale,
}: AccountControlsProps) {
  const u = ui(locale);
  const [consenting, setConsenting] = useState(researchConsent);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Move focus into the confirm dialog and close it on Escape (a11y; replaces
  // the native window.confirm, which broke the app's visual language).
  useEffect(() => {
    if (!confirmOpen) return;
    cancelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) setConfirmOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirmOpen, busy]);

  async function stopContributing() {
    setConsenting(false); // optimistic
    try {
      const res = await fetch("/api/account/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: false }),
      });
      if (!res.ok) throw new Error("consent update failed");
    } catch {
      setConsenting(true); // revert on failure
    }
  }

  async function confirmDelete() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      window.location.href = "/";
    } catch {
      setBusy(false);
      setError(u.deleteFailed);
    }
  }

  return (
    <div className="account-controls">
      {consenting ? (
        <button
          type="button"
          className="link-btn"
          onClick={stopContributing}
          title={u.stopContributingTitle}
        >
          {u.stopContributing}
        </button>
      ) : null}
      <a className="link-btn" href="/api/account/export">
        {u.exportData}
      </a>
      <button
        type="button"
        className="link-btn danger"
        onClick={() => {
          setError("");
          setConfirmOpen(true);
        }}
        disabled={busy}
      >
        {u.deleteAccount}
      </button>

      {confirmOpen ? (
        <div className="consent-overlay" role="presentation">
          <div
            className="consent-prompt"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <h2 id="delete-account-title">{u.deleteAccount}</h2>
            <p>{u.deleteConfirm}</p>
            {error ? <p className="consent-error">{error}</p> : null}
            <div className="consent-actions">
              <button
                type="button"
                className="btn btn-danger"
                onClick={confirmDelete}
                disabled={busy}
              >
                {u.deleteAccount}
              </button>
              <button
                ref={cancelRef}
                type="button"
                className="btn"
                onClick={() => setConfirmOpen(false)}
                disabled={busy}
              >
                {u.cancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
