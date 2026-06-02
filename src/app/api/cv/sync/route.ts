import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncCvForUser } from "@/lib/cv/sync";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Sync fans out to many OpenAlex requests — keep it infrequent per user.
const SYNC_MAX = 10;
const SYNC_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/** Re-pull works from OpenAlex and rebuild the canonical CV (curation preserved). */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = rateLimit(`sync:${session.user.id}`, SYNC_MAX, SYNC_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many sync requests. Please wait a bit." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  if (!session.user.orcid) {
    return NextResponse.json(
      { error: "No ORCID iD associated with this account." },
      { status: 400 },
    );
  }

  try {
    const cv = await syncCvForUser({
      userId: session.user.id,
      orcid: session.user.orcid,
      fallbackName: session.user.name ?? "",
    });
    return NextResponse.json({ cv });
  } catch (err) {
    console.error("[api/cv/sync]", err);
    return NextResponse.json(
      { error: "Failed to sync from OpenAlex. Please try again." },
      { status: 502 },
    );
  }
}
