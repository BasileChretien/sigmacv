import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { isSameOrigin } from "@/lib/security/origin";

/**
 * Shared pre-flight for the snapshot routes: session → (same-origin for a
 * mutation) → per-user rate limit. Returns the userId to proceed, or the
 * error response to return as-is. Keeps each route handler to its own logic.
 */
export type Guarded = { ok: true; userId: string } | { ok: false; res: NextResponse };

export interface GuardOpts {
  /** State-changing request: enforce the same-origin (CSRF) check. */
  mutating: boolean;
  /** Rate-limit bucket + ceiling (per user, per hour). */
  bucket: string;
  max: number;
}

const HOUR_MS = 60 * 60 * 1000;

export async function guardSnapshotRequest(req: Request, opts: GuardOpts): Promise<Guarded> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, res: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (opts.mutating && !isSameOrigin(req)) {
    return {
      ok: false,
      res: NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 }),
    };
  }
  const rl = await enforceRateLimit(`${opts.bucket}:${session.user.id}`, opts.max, HOUR_MS);
  if (!rl.ok) {
    return {
      ok: false,
      res: NextResponse.json(
        { error: "Too many requests. Please wait a bit." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      ),
    };
  }
  return { ok: true, userId: session.user.id };
}
