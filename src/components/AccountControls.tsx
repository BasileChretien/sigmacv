"use client";

import { useState } from "react";

/**
 * GDPR/APPI self-service: data export + account deletion. Research-consent
 * opt-in is handled by the onboarding prompt/banner (ResearchConsentPrompt),
 * not a topbar toggle.
 */
export default function AccountControls() {
  const [busy, setBusy] = useState(false);

  async function deleteAccount() {
    if (
      !window.confirm(
        "Permanently delete your account and all associated data? This cannot be undone.",
      )
    ) {
      return;
    }
    setBusy(true);
    const res = await fetch("/api/account", { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/";
    } else {
      setBusy(false);
      window.alert("Failed to delete account. Please try again.");
    }
  }

  return (
    <div className="account-controls">
      <a className="link-btn" href="/api/account/export">
        Export my data
      </a>
      <button
        type="button"
        className="link-btn danger"
        onClick={deleteAccount}
        disabled={busy}
      >
        Delete account
      </button>
    </div>
  );
}
