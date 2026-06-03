import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { resyncDueCvs } from "@/lib/cv/resync";
import { getEnv } from "@/lib/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  try {
    const summary = await resyncDueCvs();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("[api/internal/resync]", err);
    return NextResponse.json({ error: "Resync failed" }, { status: 500 });
  }
}
