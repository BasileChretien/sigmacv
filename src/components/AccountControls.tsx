"use client";

import { useState } from "react";

interface AccountControlsProps {
  initialConsent: boolean;
}

/**
 * Research-consent toggle + GDPR/APPI self-service (data export, account
 * deletion). Consent defaults OFF; no research data is logged until it's on.
 */
export default function AccountControls({
  initialConsent,
}: AccountControlsProps) {
  const [consent, setConsent] = useState(initialConsent);
  const [busy, setBusy] = useState(false);

  async function toggleConsent(next: boolean) {
    setConsent(next); // optimistic
    try {
      const res = await fetch("/api/account/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: next }),
      });
      if (!res.ok) throw new Error("consent update failed");
    } catch {
      setConsent(!next); // revert on failure
    }
  }

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
      <label className="field-inline" title="Optional. Helps research on author disambiguation and CV norms. No data is logged unless this is on.">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => toggleConsent(e.target.checked)}
        />
        <span>Contribute to research</span>
      </label>
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
