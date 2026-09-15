const DAY_MS = 86_400_000;

/**
 * Whether a lookup answered at `checkedAt` is recent enough, at `now`, not to be
 * asked again: within `days`, never in the future, and never for a missing or
 * unreadable timestamp (which always asks).
 */
export function answeredWithin(checkedAt: string | undefined, now: string, days: number): boolean {
  if (!checkedAt) return false;
  const age = Date.parse(now) - Date.parse(checkedAt);
  return Number.isFinite(age) && age >= 0 && age < days * DAY_MS;
}
