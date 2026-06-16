"use client";

import { useEffect, useState } from "react";
import { editorUi } from "@/lib/i18n/editorUi";

export const COACHMARK_DISMISS_KEY = "sigmacv:coachmarkDismissed";

/**
 * A one-time, dismissible hint pointing the user at the "Not mine" curation
 * flow — the disambiguation signal that powers the author-error study and keeps
 * the CV accurate. Shown only when the CV actually has publications, and never
 * again once dismissed (localStorage). Starts hidden so SSR and the first client
 * render agree (no hydration mismatch, no flash) — it reveals after mount if the
 * user hasn't dismissed it before.
 */
export default function DisambiguationCoachmark({
  locale,
  show,
  suppressed = false,
  onDismissed,
}: {
  locale: string;
  show: boolean;
  /** Held back by the onboarding sequencer so prompts don't stack. */
  suppressed?: boolean;
  /** Notifies the sequencer to advance to the next prompt. */
  onDismissed?: () => void;
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(COACHMARK_DISMISS_KEY) === "1");
    } catch {
      /* storage unavailable — leave it hidden */
    }
  }, []);

  if (suppressed || !show || dismissed) return null;

  const eu = editorUi(locale);
  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(COACHMARK_DISMISS_KEY, "1");
    } catch {
      /* non-fatal */
    }
    onDismissed?.();
  };

  return (
    <aside className="coachmark" role="note" aria-label={eu.coachTitle}>
      <div className="coachmark-body">
        <strong>{eu.coachTitle}</strong>
        <p className="muted">{eu.coachBody}</p>
      </div>
      <button type="button" className="btn btn-sm" onClick={dismiss}>
        {eu.coachGotIt}
      </button>
    </aside>
  );
}
