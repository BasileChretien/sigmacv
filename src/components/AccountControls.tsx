"use client";

import { useState } from "react";
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

  async function deleteAccount() {
    if (!window.confirm(u.deleteConfirm)) {
      return;
    }
    setBusy(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/";
    } else {
      setBusy(false);
      window.alert(u.deleteFailed);
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
        onClick={deleteAccount}
        disabled={busy}
      >
        {u.deleteAccount}
      </button>
    </div>
  );
}
