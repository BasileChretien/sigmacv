import { NextResponse } from "next/server";
import { sendDueDigests } from "@/lib/email/digest";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/log";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { isAuthorizedInternalRequest } from "@/lib/security/internalAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The cron pings daily; the real cadence is per-user (digestSentAt, ~monthly).
// This guard only stops a misfiring cron from stacking overlapping batches.
const DIGEST_MIN_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

/**
 * Machine-to-machine endpoint hit by the digest-cron container on the internal
 * Docker network (same trust + secret as the resync cron). NOT a user route:
 * guarded by the shared Bearer secret, no Auth.js session. Returns 503 when
 * the secret is unconfigured (feature off); a configured secret but no SMTP
 * reports `configured: false` and sends nothing.
 */
export async function POST(req: Request) {
  const secret = getEnv().RESYNC_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Internal jobs are not enabled." }, { status: 503 });
  }
  if (!isAuthorizedInternalRequest(req, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await enforceRateLimit("internal-digest", 1, DIGEST_MIN_INTERVAL_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: true, skipped: "ran too recently" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  try {
    const summary = await sendDueDigests();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    logger.error("api.internal_digest_failed", { err });
    return NextResponse.json({ error: "Digest run failed" }, { status: 500 });
  }
}
