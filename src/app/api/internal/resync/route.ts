import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { resyncDueCvs } from "@/lib/cv/resync";
import { getEnv } from "@/lib/env";
import { logger } from "@/lib/log";
import { enforceRateLimit } from "@/lib/rateLimitStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Coarse minimum interval between scans: each runs an expensive fan-out to the
// external APIs, so even an authorized caller can't trigger overlapping batches.
const RESYNC_MIN_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  // Pad both to equal length so timingSafeEqual doesn't early-return on a length
  // mismatch (which would leak the secret's length via timing).
  const len = Math.max(ab.length, bb.length, 1);
  const pa = Buffer.alloc(len);
  const pb = Buffer.alloc(len);
  ab.copy(pa);
  bb.copy(pb);
  return timingSafeEqual(pa, pb) && ab.length === bb.length;
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

  const header = req.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ")
    ? header.slice(7)
    : (req.headers.get("x-resync-secret") ?? "");
  if (!provided || !safeEqual(provided, secret)) {
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

  try {
    const summary = await resyncDueCvs();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    logger.error("api.internal_resync_failed", { err });
    return NextResponse.json({ error: "Resync failed" }, { status: 500 });
  }
}
