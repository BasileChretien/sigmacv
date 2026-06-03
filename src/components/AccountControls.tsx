"use client";

import { useState } from "react";

/**
 * GDPR/APPI self-service: withdraw research consent + data export + account
 * deletion. Opt-IN is handled by the onboarding prompt (ResearchConsentPrompt);
 * here we only surface a withdrawal control, and only when the user is currently
 * contributing — so withdrawal stays as easy as consent, without an always-on
 * topbar toggle.
 */
interface AccountControlsProps {
  researchConsent: boolean;
}

export default function AccountControls({
  researchConsent,
}: AccountControlsProps) {
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
      {consenting ? (
        <button
          type="button"
          className="link-btn"
          onClick={stopContributing}
          title="You're currently contributing anonymised curation data to research. Click to stop and turn it off."
        >
          Stop contributing to research
        </button>
      ) : null}
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
