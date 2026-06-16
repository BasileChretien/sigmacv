"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics/track";
import { publishNudgeStrings } from "@/lib/i18n/publishNudge";

/** Per-browser flag so a dismissed (or acted-on) nudge stays gone across reloads. */
export const PUBLISH_NUDGE_DISMISS_KEY = "sigmacv:publish-nudge-dismissed";

interface PublishNudgeProps {
  /** Whether the CV is already published — the nudge never shows if so. */
  published: boolean;
  locale: string;
  /** Held back by the onboarding sequencer so prompts don't stack. */
  suppressed?: boolean;
  /** Notifies the sequencer to advance to the next prompt. */
  onDismissed?: () => void;
}

/**
 * A gentle, dismissible prompt (F1) shown in the editor only while the CV is
 * unpublished, encouraging the user to publish a shareable public page. The CTA
 * scrolls to, focuses and briefly highlights the existing publish toggle — it
 * never publishes on the user's behalf, because publishing is a deliberate,
 * consent-sensitive action in this product. Dismissal persists per browser, and
 * it is suppressed entirely once the page is published.
 */
export default function PublishNudge({
  published,
  locale,
  suppressed = false,
  onDismissed,
}: PublishNudgeProps) {
  const s = publishNudgeStrings(locale);
  // Gate rendering on a client-side check so we never flash the nudge to someone
  // who dismissed it before (and avoid an SSR/client hydration mismatch).
  const [checked, setChecked] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(PUBLISH_NUDGE_DISMISS_KEY) === "1") setDismissed(true);
    } catch {
      /* localStorage blocked (private mode) — fine, just show the nudge */
    }
    setChecked(true);
  }, []);

  if (suppressed || published || dismissed || !checked) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(PUBLISH_NUDGE_DISMISS_KEY, "1");
    } catch {
      /* dismissal just won't persist across reloads — acceptable */
    }
    onDismissed?.();
  };

  const goToPublish = () => {
    trackEvent("Publish nudge", { action: "cta" });
    const toggle = document.querySelector<HTMLInputElement>('[data-testid="publish-toggle"]');
    if (toggle) {
      toggle.scrollIntoView({ behavior: "smooth", block: "center" });
      toggle.focus();
      const label = toggle.closest("label");
      if (label) {
        label.classList.add("publish-toggle-highlight");
        window.setTimeout(() => label.classList.remove("publish-toggle-highlight"), 1800);
      }
    }
    dismiss();
  };

  return (
    <aside className="publish-nudge" role="note" aria-label={s.title}>
      <div className="publish-nudge-text">
        <strong>{s.title}</strong>
        <p>{s.body}</p>
      </div>
      <div className="publish-nudge-actions">
        <button type="button" className="btn btn-primary" onClick={goToPublish}>
          {s.cta}
        </button>
        <button type="button" className="link-btn" onClick={dismiss}>
          {s.dismiss}
        </button>
      </div>
    </aside>
  );
}
