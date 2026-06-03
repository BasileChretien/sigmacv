import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/log";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Full account deletion. Cascades to accounts, sessions, CV, and research
 *  events (see schema onDelete: Cascade). Irreversible. */
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`account-delete:${session.user.id}`, 5, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a bit." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  try {
    await prisma.user.delete({ where: { id: session.user.id } });
    // The DB session cascade-deletes with the user, but the browser still holds
    // the session cookie — clear it so no stale cookie can be re-associated
    // (e.g. if the same email later re-registers).
    const res = NextResponse.json({ ok: true });
    for (const name of [
      "authjs.session-token",
      "__Secure-authjs.session-token",
    ]) {
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
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 },
    );
  }
}
