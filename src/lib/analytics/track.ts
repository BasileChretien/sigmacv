/**
 * Cookieless product-analytics events (Plausible custom events).
 *
 * Client-only and best-effort: a no-op when the Plausible script isn't present
 * (local/dev, or analytics not configured) so it never throws into a UI handler.
 *
 * PRIVACY (mandatory): pass ONLY neutral product signals — an export format, a
 * template id, a publish flag. NEVER personal data, CV content, names, ORCIDs,
 * or a mine/not-mine correction. Those curation signals belong exclusively to
 * the consent + IRB-gated research pipeline (`src/lib/research/`); routing any of
 * them through here would bypass that gate. Keep props small and non-identifying.
 */

/** Plausible accepts only scalar custom-event props. */
export type EventProps = Record<string, string | number | boolean>;

interface PlausibleFn {
  (event: string, options?: { props?: EventProps }): void;
  q?: unknown[];
}

declare global {
  interface Window {
    plausible?: PlausibleFn;
  }
}

/**
 * Send a cookieless custom event to Plausible if it's loaded; otherwise do
 * nothing. Safe to call from any client event handler.
 */
export function trackEvent(event: string, props?: EventProps): void {
  if (typeof window === "undefined") return;
  const plausible = window.plausible;
  if (typeof plausible !== "function") return;
  plausible(event, props ? { props } : undefined);
}
