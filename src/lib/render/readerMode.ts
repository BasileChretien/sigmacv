import type { DisplayChoices } from "@/lib/canonical/schema";

/**
 * "Reader mode" — the ASSESSOR'S view of the public living page (`/p/[slug]?view=reader`).
 *
 * A committee member opening a public SigmaCV page should be able to see every
 * trust and context signal the owner's data carries — provenance, verification,
 * open-access status, retraction flags — without the owner having to know which
 * display toggles to switch on. This module is the pure preset the public route
 * applies to the projected display choices when (a) the owner opted in
 * (`display.allowReaderMode`) AND (b) the visitor asked for the reader view.
 *
 * What it deliberately does NOT do: reader mode reveals context and provenance,
 * it never adds evaluative numbers the owner did not opt into. `showMetrics` and
 * the `metrics` selection are left exactly as the owner set them (a metric the
 * owner hid stays hidden), and the profile-level open-access SHARE is pinned to
 * the owner's effective choice before the per-work badges are forced on, so
 * forcing `showOpenAccess` cannot surface a headline figure by inheritance.
 * Exports never go through this preset — it is applied by the route only.
 */

/**
 * The display keys reader mode forces ON. Each is a trust/context signal already
 * present in the data (never a computed score): the data-provenance footer, the
 * institution-verified marks, the per-work open-access badge, the per-work
 * citation count with its context, the research-areas chip row, and the account
 * holder's authorship role.
 *
 * append here when a new trust/context toggle lands
 */
export const READER_MODE_KEYS = [
  "showProvenance",
  "showVerifiedBadges",
  "showOpenAccess",
  "showCitationCounts",
  "showResearchAreas",
  "showAuthorRole",
] as const satisfies readonly (keyof DisplayChoices)[];

/** A display key reader mode forces ON. */
export type ReaderModeKey = (typeof READER_MODE_KEYS)[number];

/**
 * The display keys reader mode forces OFF: `hideRetracted`, so a retracted work
 * is VISIBLE with its always-on "Retracted" badge rather than silently absent —
 * an assessor must be able to see the integrity flag, not an edited list.
 */
export const READER_MODE_OFF_KEYS = [
  "hideRetracted",
] as const satisfies readonly (keyof DisplayChoices)[];

/** True when `key` is one of the display keys reader mode overrides (on or off). */
export function isReaderModeKey(key: string): boolean {
  return (
    (READER_MODE_KEYS as readonly string[]).includes(key) ||
    (READER_MODE_OFF_KEYS as readonly string[]).includes(key)
  );
}

/**
 * The reader-mode display choices: a NEW object (the input is never mutated) with
 * every {@link READER_MODE_KEYS} entry forced true and every
 * {@link READER_MODE_OFF_KEYS} entry forced false. Everything else — template,
 * style, locale, metrics selection, per-view exclusions — passes through untouched.
 */
export function applyReaderMode(display: DisplayChoices): DisplayChoices {
  const forcedOn = Object.fromEntries(READER_MODE_KEYS.map((k) => [k, true])) as Record<
    ReaderModeKey,
    true
  >;
  const forcedOff = Object.fromEntries(READER_MODE_OFF_KEYS.map((k) => [k, false])) as Record<
    (typeof READER_MODE_OFF_KEYS)[number],
    false
  >;
  return {
    ...display,
    // The OA share inherits `showOpenAccess` when unset (render-time `??`); pin it to
    // the owner's EFFECTIVE value first so forcing the per-work badge on below can't
    // add a profile-level percentage the owner never chose to show.
    showOpenAccessShare: display.showOpenAccessShare ?? display.showOpenAccess,
    ...forcedOn,
    ...forcedOff,
  };
}
