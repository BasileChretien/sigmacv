"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics/track";
import { publishNudgeStrings } from "@/lib/i18n/publishNudge";

/**
 * Per-browser flag so a dismissed (or acted-on) nudge stays gone across reloads.
 * The value is intentionally `…-v2` (the nudge moved from an early onboarding
 * prompt to a post-export one): a fresh key gives users who dismissed the old,
 * mistimed onboarding nudge one shot at the better-timed export prompt.
 */
export const PUBLISH_NUDGE_DISMISS_KEY = "sigmacv:publish-nudge-dismissed-v2";

interface PublishNudgeProps {
  /** Whether the CV is already published — the nudge never shows if so. */
  published: boolean;
  locale: string;
  /** Held back until armed (after a successful document export) so we never
      nudge someone to publish a freshly-imported, un-curated CV. */
  suppressed?: boolean;
  /** Notifies the host that the nudge was dismissed/acted on (disarm it). */
  onDismissed?: () => void;
}

/**
 * A gentle, dismissible prompt shown in the editor only while the CV is
 * unpublished, encouraging the user to publish a shareable public page. It is
 * armed by the host after a successful document export — the "this is
 * presentable, I'm about to show it to someone" moment — rather than on first
 * import, so we never push a raw, un-curated CV public. The CTA scrolls to,
 * focuses and briefly highlights the existing publish toggle; it never publishes
 * on the user's behalf, because publishing is a deliberate, consent-sensitive
 * action in this product. Dismissal persists per browser, and it is suppressed
 * entirely once the page is published.
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
    // The publish toggle lives inside the Publish popover, whose panel is
    // unmounted while the menu is closed — so open the menu via its always-present
    // trigger first, then focus the toggle once the panel has mounted. (Clicking
    // the nudge CTA with the menu already open would otherwise find nothing.)
    const trigger = document.querySelector<HTMLButtonElement>(".publish-trigger");
    if (trigger && trigger.getAttribute("aria-expanded") !== "true") trigger.click();
    // The panel mounts on the render after the trigger opens it; retry across a
    // few frames so the focus/scroll lands once the toggle is actually in the DOM.
    const MAX_FOCUS_RETRIES = 5;
    let tries = 0;
    const focusToggle = () => {
      const toggle = document.querySelector<HTMLInputElement>('[data-testid="publish-toggle"]');
      if (toggle) {
        toggle.scrollIntoView({ behavior: "smooth", block: "center" });
        toggle.focus();
        const label = toggle.closest("label");
        if (label) {
          label.classList.add("publish-toggle-highlight");
          window.setTimeout(() => label.classList.remove("publish-toggle-highlight"), 1800);
        }
      } else if (tries++ < MAX_FOCUS_RETRIES) {
        window.requestAnimationFrame(focusToggle);
      }
    };
    window.requestAnimationFrame(focusToggle);
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
