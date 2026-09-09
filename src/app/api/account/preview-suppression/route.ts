import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { isOrcidPreviewSuppressed, setOrcidPreviewSuppressed } from "@/lib/cv/previewSuppression";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { readJsonBodyWithLimit } from "@/lib/readBody";
import { isSameOrigin } from "@/lib/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ suppress: z.boolean() });
const MAX_BODY_BYTES = 2_000;
const TOGGLE_MAX = 30;
const TOGGLE_WINDOW_MS = 60 * 60 * 1000;

/**
 * The signed-in half of the objection route: an account holder with an ORCID
 * iD can hide (or show again) the no-login preview of their own iD without the
 * OAuth round trip `/object` needs for non-users. Same setting, same table —
 * keyed by the iD's HMAC, so it also reflects an objection the person made
 * BEFORE creating the account, and survives the account's deletion.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const orcid = session.user.orcid;
  if (!orcid) return NextResponse.json({ suppressed: false, applicable: false });
  const suppressed = await isOrcidPreviewSuppressed(orcid);
  return NextResponse.json(
    { suppressed, applicable: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }
  const orcid = session.user.orcid;
  if (!orcid) {
    return NextResponse.json({ error: "No ORCID iD on this account" }, { status: 409 });
  }

  const rl = await enforceRateLimit(
    `preview-suppression:${session.user.id}`,
    TOGGLE_MAX,
    TOGGLE_WINDOW_MS,
  );
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
    return NextResponse.json({ error: "Expected { suppress: boolean }" }, { status: 422 });
  }

  const result = await setOrcidPreviewSuppressed(orcid, parsed.data.suppress, "account");
  if (result === "unavailable") {
    return NextResponse.json({ error: "Preview suppression is not configured" }, { status: 503 });
  }
  return NextResponse.json({ ok: true, suppressed: parsed.data.suppress });
}
