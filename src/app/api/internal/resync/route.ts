import { NextResponse } from "next/server";
import { drainPendingDoiWithdrawals } from "@/lib/cv/doiWithdrawals";
import { resyncDueCvs } from "@/lib/cv/resync";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/log";
import {
  refreshInstitutionProfiles,
  type RefreshInstitutionProfilesSummary,
} from "@/lib/openalex/institutionRefresh";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { isAuthorizedInternalRequest } from "@/lib/security/internalAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Coarse minimum interval between scans: each runs an expensive fan-out to the
// external APIs, so even an authorized caller can't trigger overlapping batches.
const RESYNC_MIN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// The institution snapshot's own guard (same shape as the resync's): a pass is
// up to 20 institutions × ~12 OpenAlex calls, so two must never overlap.
const INSTITUTION_PROFILES_MIN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
const INSTITUTION_PROFILES_MAX_ROWS = 20;
const INSTITUTION_PROFILES_PACE_MS = 200;

/**
 * The OpenAlex organisation snapshot, piggy-backed on the same tick after the
 * resync and the DOI-withdrawal drain (the only code path that asks OpenAlex
 * about an institution — the public page reads the stored row). Guarded by its
 * own minimum interval; never throws (the job is fail-soft by contract, and a
 * failure here must not fail the tick's response).
 */
async function refreshInstitutionProfilesGuarded(): Promise<
  RefreshInstitutionProfilesSummary | { skipped: "ran too recently" | "failed" }
> {
  const rl = await enforceRateLimit(
    "institution-profiles",
    1,
    INSTITUTION_PROFILES_MIN_INTERVAL_MS,
  );
  if (!rl.ok) return { skipped: "ran too recently" };
  try {
    return await refreshInstitutionProfiles({
      maxRows: INSTITUTION_PROFILES_MAX_ROWS,
      paceMs: INSTITUTION_PROFILES_PACE_MS,
    });
  } catch (err) {
    logger.error("api.internal_institution_profiles_failed", { err });
    return { skipped: "failed" };
  }
}

/**
 * Machine-to-machine endpoint hit by the resync-cron container on the internal
 * Docker network. NOT a user route: guarded by a shared Bearer secret, no
 * Auth.js session. Returns 503 when the secret is unconfigured (feature off).
 * Keep `/api/internal/*` off the public Caddy routes.
 */
export async function POST(req: Request) {
  const secret = getEnv().RESYNC_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Resync is not enabled." }, { status: 503 });
  }

  if (!isAuthorizedInternalRequest(req, secret, "x-resync-secret")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Minimum-interval guard: refuse to start a new scan if one ran very recently,
  // so a leaked secret / misfiring cron can't stack overlapping fan-outs.
  const rl = await enforceRateLimit("internal-resync", 1, RESYNC_MIN_INTERVAL_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: true, skipped: "ran too recently" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  // Piggy-backed on the same cron tick: retry the snapshot-DOI withdrawals
  // that failed at account-deletion time (see cv/doiWithdrawals.ts). Runs even
  // when the resync throws — the retry must not depend on it — and never throws
  // itself (fail-soft by contract).
  try {
    const summary = await resyncDueCvs();
    const doiWithdrawals = await drainPendingDoiWithdrawals();
    const institutionProfiles = await refreshInstitutionProfilesGuarded();
    return NextResponse.json({ ok: true, ...summary, doiWithdrawals, institutionProfiles });
  } catch (err) {
    logger.error("api.internal_resync_failed", { err });
    await drainPendingDoiWithdrawals();
    await refreshInstitutionProfilesGuarded();
    return NextResponse.json({ error: "Resync failed" }, { status: 500 });
  }
}
