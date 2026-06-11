import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { setDigestOptIn } from "@/lib/email/digest";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { readJsonBodyWithLimit } from "@/lib/readBody";
import { isSameOrigin } from "@/lib/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ optIn: z.boolean() });
const MAX_BODY_BYTES = 2_000;
const TOGGLE_MAX = 30;
const TOGGLE_WINDOW_MS = 60 * 60 * 1000;

/** Set the signed-in user's re-sync digest opt-in (account-settings toggle). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const rl = await enforceRateLimit(`digest:${session.user.id}`, TOGGLE_MAX, TOGGLE_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const read = await readJsonBodyWithLimit(req, MAX_BODY_BYTES);
  if (!read.ok) {
    return read.tooLarge
      ? NextResponse.json({ error: "Request too large" }, { status: 413 })
      : NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(read.value);
  if (!parsed.success) {
    return NextResponse.json({ error: "Expected { optIn: boolean }" }, { status: 422 });
  }

  await setDigestOptIn(session.user.id, parsed.data.optIn);
  return NextResponse.json({ ok: true, optIn: parsed.data.optIn });
}
