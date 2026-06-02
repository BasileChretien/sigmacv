import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { resyncDueCvs } from "@/lib/cv/resync";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
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

  try {
    const summary = await resyncDueCvs();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("[api/internal/resync]", err);
    return NextResponse.json({ error: "Resync failed" }, { status: 500 });
  }
}
