import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { invalidateOrcidPreview } from "@/lib/cv/orcidPreviewCache";
import { logger } from "@/lib/log";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { isSameOrigin } from "@/lib/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Persisted rate-limit counters carry no FK to the user (shared infrastructure),
 * but every per-user limiter key ends in `:<userId>` — so the cascade misses
 * them and the internal id would otherwise sit in that table indefinitely.
 * Fail-soft: the account is already gone; a sweep failure is logged, not surfaced.
 */
async function sweepRateLimitCounters(userId: string): Promise<void> {
  try {
    await prisma.rateLimitWindow.deleteMany({ where: { key: { endsWith: `:${userId}` } } });
  } catch (err) {
    logger.warn("api.account_delete_ratelimit_sweep_failed", { err });
  }
}

/** Full account deletion. Cascades to accounts, sessions, CV, and research
 *  events (see schema onDelete: Cascade), then sweeps the user-keyed rate-limit
 *  counters. Irreversible. */
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const rl = await enforceRateLimit(`account-delete:${session.user.id}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a bit." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  try {
    // Read the iD BEFORE the row goes: the anonymous preview applies this
    // researcher's own corrections, and once the account is gone those must stop
    // shaping a public page. Withdrawal should take effect at once, not when a
    // ten-minute cache happens to expire.
    const deleting = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { orcid: true },
    });
    await prisma.user.delete({ where: { id: session.user.id } });
    if (deleting?.orcid) invalidateOrcidPreview(deleting.orcid);
    await sweepRateLimitCounters(session.user.id);
    // The DB session cascade-deletes with the user, but the browser still holds
    // the session cookie — clear it so no stale cookie can be re-associated
    // (e.g. if the same email later re-registers).
    const res = NextResponse.json({ ok: true });
    for (const name of ["authjs.session-token", "__Secure-authjs.session-token"]) {
      // Mirror the attributes Auth.js set the cookie with, so the browser
      // reliably overwrites/expires the original httpOnly+Secure session cookie.
      res.cookies.set(name, "", {
        maxAge: 0,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }
    return res;
  } catch (err) {
    logger.error("api.account_delete_failed", { err });
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
