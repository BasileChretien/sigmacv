/**
 * OpenAlex upstream curation WRITE-client (Phase 5 — "give back to the commons").
 *
 * Pushes the account holder's "not mine" disambiguation corrections UPSTREAM to
 * OpenAlex's curation API so the shared record improves for everyone. This is a
 * DEFERRED v2 feature and ships DISABLED.
 *
 * ┌─ SAFETY POSTURE (read before touching) ───────────────────────────────────┐
 * │ • OFF by default. With `OPENALEX_CURATION_ENABLED` unset/false this module  │
 * │   makes NO external network write — ever. `submitCurationAssertions`        │
 * │   returns `{ status: "disabled" }` WITHOUT calling fetch. Proven by a test  │
 * │   (mock fetch, assert not called) in tests/openalex-assert.test.ts.         │
 * │ • Fails CLOSED + SOFT: on any network/HTTP error it returns                 │
 * │   `{ status: "error" }` and NEVER throws into the caller.                   │
 * │ • The payload shape + endpoint are PROVISIONAL — see the comment block on   │
 * │   `buildCurationPayload`. The real OpenAlex curation API contract is        │
 * │   UNCONFIRMED; nothing here should be treated as the final wire format.     │
 * └────────────────────────────────────────────────────────────────────────────┘
 */

import type { PendingNotMineAssertion } from "@/lib/canonical/assertions";
import { getEnv } from "@/lib/env";
import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";

/*
 * ── PROVISIONAL — pending the real OpenAlex curation API contract ────────────
 *
 * OpenAlex has not (as of this writing) published a stable public contract for
 * programmatically asserting "this author did NOT write this work". The shape
 * below is our BEST-GUESS request body, deliberately simple and self-describing
 * so it's trivial to remap once the real schema is known:
 *
 *   {
 *     source: "sigmacv",
 *     assertionType: "author_disambiguation",
 *     assertions: [
 *       {
 *         work: "<OpenAlex work id/url>",
 *         claim: "not_authored_by",
 *         authorIds: ["<OpenAlex author id>", ...],   // identifier-anchored
 *         assertedAt: "<ISO-8601 | undefined>"
 *       },
 *       ...
 *     ]
 *   }
 *
 * Identifier-anchored per the project invariant: an assertion is ALWAYS keyed by
 * OpenAlex author id(s), never by a name string. Do NOT add names/emails here.
 */

/** A single PROVISIONAL curation assertion line in the request body. */
export interface CurationAssertionEntry {
  /** OpenAlex work id/url the correction is about. */
  work: string;
  /** What is being asserted. Fixed for the "not mine" flow. */
  claim: "not_authored_by";
  /** The account holder's OpenAlex author id(s) — the disputed attribution. */
  authorIds: string[];
  /** When the user made the assertion, if recorded. */
  assertedAt?: string;
}

/** The PROVISIONAL request body POSTed to the curation endpoint. */
export interface CurationPayload {
  /** Identifies these assertions as coming from SigmaCV (audit on OpenAlex's side). */
  source: "sigmacv";
  assertionType: "author_disambiguation";
  assertions: CurationAssertionEntry[];
}

/**
 * Map the read-only pending assertions → the PROVISIONAL curation request body.
 * PURE: no I/O, deterministic, fully unit-tested. Drops any assertion missing a
 * work id or carrying no author ids (an unanchored assertion is meaningless and
 * must never be pushed by name).
 */
export function buildCurationPayload(
  assertions: readonly PendingNotMineAssertion[],
): CurationPayload {
  const entries: CurationAssertionEntry[] = [];
  for (const a of assertions) {
    if (!a.openAlexWorkId) continue;
    const authorIds = a.authorIds.filter(Boolean);
    if (authorIds.length === 0) continue;
    entries.push({
      work: a.openAlexWorkId,
      claim: "not_authored_by",
      authorIds,
      ...(a.assertedAt ? { assertedAt: a.assertedAt } : {}),
    });
  }
  return {
    source: "sigmacv",
    assertionType: "author_disambiguation",
    assertions: entries,
  };
}

/**
 * Master switch for the upstream curation push. OFF by default.
 *
 * Read straight from `process.env` (same rationale as research/enabled.ts): a
 * single deliberate opt-in that a malformed UNRELATED env var can never flip on
 * implicitly, and that does not require the rest of the validated env to be
 * present just to answer "is this feature on?".
 */
export function isOpenAlexCurationEnabled(): boolean {
  return process.env.OPENALEX_CURATION_ENABLED === "true";
}

/** Structured, non-throwing result of an upstream curation submission. */
export type CurationSubmitResult =
  | { status: "disabled" }
  | { status: "noop"; submitted: 0 }
  | { status: "ok"; submitted: number; httpStatus: number }
  | { status: "error"; submitted: number; reason: string; httpStatus?: number };

export interface SubmitCurationOptions {
  /** Override the network call in tests / future callers. Defaults to the shared
   *  polite-pool fetch wrapper. */
  fetchImpl?: typeof resilientFetch;
}

/**
 * Submit "not mine" corrections to OpenAlex's curation API. GUARDED:
 *   • Disabled (default) → returns `{ status: "disabled" }`, makes NO fetch call.
 *   • Enabled but no endpoint configured → `{ status: "error" }` (never guesses a URL).
 *   • Enabled + nothing to submit → `{ status: "noop" }`, makes NO fetch call.
 *   • Enabled + endpoint set → POSTs the PROVISIONAL payload via the polite-pool
 *     wrapper (mailto + User-Agent). Any network/HTTP failure → `{ status: "error" }`.
 *
 * NEVER throws: fails closed and soft so a caller (e.g. the API route) can record
 * an audit line regardless of the outcome.
 */
export async function submitCurationAssertions(
  assertions: readonly PendingNotMineAssertion[],
  opts: SubmitCurationOptions = {},
): Promise<CurationSubmitResult> {
  // Fail CLOSED: the disabled path must not touch the network under any input.
  if (!isOpenAlexCurationEnabled()) {
    return { status: "disabled" };
  }

  const payload = buildCurationPayload(assertions);
  const submitted = payload.assertions.length;
  if (submitted === 0) {
    return { status: "noop", submitted: 0 };
  }

  // Read config through the validated boundary (URL-checked). Wrapped so a
  // missing/invalid env never throws past us.
  let endpoint: string | undefined;
  let mailto: string;
  try {
    const env = getEnv();
    endpoint = env.OPENALEX_CURATION_ENDPOINT;
    mailto = env.OPENALEX_MAILTO;
  } catch (err) {
    logger.error("openalex.curation_env_invalid", { err });
    return { status: "error", submitted, reason: "env_invalid" };
  }

  if (!endpoint) {
    // Fail closed: enabled but unconfigured endpoint → do NOT invent a URL.
    return { status: "error", submitted, reason: "endpoint_unconfigured" };
  }

  const doFetch = opts.fetchImpl ?? resilientFetch;
  try {
    const res = await doFetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Polite-pool identification (mirrors the read client).
        "User-Agent": `SigmaCV (mailto:${mailto})`,
      },
      body: JSON.stringify(payload),
      timeoutMs: 15_000,
    });
    if (!res.ok) {
      logger.warn("openalex.curation_http_error", { httpStatus: res.status, submitted });
      return {
        status: "error",
        submitted,
        reason: "http_error",
        httpStatus: res.status,
      };
    }
    return { status: "ok", submitted, httpStatus: res.status };
  } catch (err) {
    // Network error / timeout: fail soft.
    logger.error("openalex.curation_request_failed", { err, submitted });
    return { status: "error", submitted, reason: "network_error" };
  }
}
