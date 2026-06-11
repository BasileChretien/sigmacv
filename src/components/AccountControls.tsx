"use client";

import { useEffect, useRef, useState } from "react";
import { ui } from "@/lib/i18n/ui";
import { workspaceUi } from "@/lib/i18n/workspaceUi";

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * GDPR/APPI self-service: withdraw research consent + data export + account
 * deletion. Opt-IN is handled by the onboarding prompt (ResearchConsentPrompt);
 * here we only surface a withdrawal control, and only when the user is currently
 * contributing — so withdrawal stays as easy as consent, without an always-on
 * topbar toggle.
 */
interface AccountControlsProps {
  researchConsent: boolean;
  /** Re-sync digest email opt-in (default false; toggled here). */
  digestOptIn?: boolean;
  locale: string;
}

export default function AccountControls({
  researchConsent,
  digestOptIn = false,
  locale,
}: AccountControlsProps) {
  const u = ui(locale);
  const wu = workspaceUi(locale);
  const [consenting, setConsenting] = useState(researchConsent);
  const [digest, setDigest] = useState(digestOptIn);
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState("");
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  // Modal a11y for the destructive confirm: move focus in, TRAP Tab inside the
  // dialog (WCAG 2.1.2 — focus must not escape a modal alertdialog), close on
  // Escape, and restore focus to the trigger on close (WCAG 2.4.3). Replaces the
  // native window.confirm, which broke the app's visual language.
  useEffect(() => {
    if (!confirmOpen) return;
    restoreFocusRef.current = (document.activeElement as HTMLElement) ?? null;
    cancelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) {
        setConfirmOpen(false);
        return;
      }
      const dialog = dialogRef.current;
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
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      restoreFocusRef.current?.focus?.();
    };
  }, [confirmOpen, busy]);

  async function stopContributing() {
    setConsenting(false); // optimistic
    setError("");
    try {
      const res = await fetch("/api/account/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: false }),
      });
      if (!res.ok) throw new Error("consent update failed");
    } catch {
      // Surface the failure: a silently-reverted toggle would leave the user
      // believing consent was withdrawn when the account flag is still set.
      setConsenting(true); // revert on failure
      setError(u.consentWithdrawFailed);
    }
  }

  async function toggleDigest(optIn: boolean) {
    setDigest(optIn); // optimistic
    setError("");
    try {
      const res = await fetch("/api/account/digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optIn }),
      });
      if (!res.ok) throw new Error("digest update failed");
    } catch {
      setDigest(!optIn); // revert on failure, and say so
      setError(wu.dgFailed);
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
      <label className="field-inline digest-toggle" title={wu.dgHint}>
        <input type="checkbox" checked={digest} onChange={(e) => toggleDigest(e.target.checked)} />
        <span>{wu.dgLabel}</span>
      </label>
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

      {error && !confirmOpen ? (
        <p className="consent-error" role="alert">
          {error}
        </p>
      ) : null}

      {confirmOpen ? (
        <div className="consent-overlay" role="presentation">
          <div
            className="consent-prompt"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            aria-describedby="delete-account-desc"
            ref={dialogRef}
          >
            <h2 id="delete-account-title">{u.deleteAccount}</h2>
            <p id="delete-account-desc">{u.deleteConfirm}</p>
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
