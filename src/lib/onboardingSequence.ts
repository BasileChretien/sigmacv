/**
 * First-run onboarding prompts used to stack — a new user could face the
 * "what changed" sync banner, the disambiguation coachmark, and the publish
 * nudge all at once. This module is the single source of truth for which ONE
 * prompt is shown at a time, and in what order.
 *
 * Pure (no React, no DOM) so the priority logic is unit-tested directly; the
 * editor computes each prompt's `active` flag (its condition met AND not yet
 * dismissed) and asks here which one wins.
 */

export type OnboardingStep = "syncReport" | "coachmark" | "publishNudge";

/**
 * Priority order, highest first:
 *  1. `syncReport`  — what the latest sync changed (incl. the first-import
 *     summary): the most timely, "here's what just happened" context.
 *  2. `coachmark`   — the one-time hint to check the matches are yours.
 *  3. `publishNudge`— share your page; least urgent, last.
 */
export const ONBOARDING_PRIORITY: readonly OnboardingStep[] = [
  "syncReport",
  "coachmark",
  "publishNudge",
];

/** Each step is "active" when its own condition is met AND it isn't dismissed. */
export type OnboardingActivity = Record<OnboardingStep, boolean>;

/**
 * The single onboarding prompt to show right now (highest-priority active step),
 * or null when none is active.
 */
export function selectOnboardingStep(activity: OnboardingActivity): OnboardingStep | null {
  return ONBOARDING_PRIORITY.find((step) => activity[step]) ?? null;
}
