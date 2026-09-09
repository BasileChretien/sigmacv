import type { ObjectionOutcome } from "./objection";

/** The `?outcome=` of /object/done, defaulting to "failed" for anything else. */
export function parseObjectionOutcome(raw: string | string[] | undefined): ObjectionOutcome {
  const v = Array.isArray(raw) ? raw[0] : raw;
  return v === "suppressed" || v === "unavailable" ? v : "failed";
}
