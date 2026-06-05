import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CanonicalCvSchema } from "@/lib/canonical/schema";
import { logger } from "@/lib/log";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { renderCvHtml } from "@/lib/render/html";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Preview runs a full citeproc render — throttle to blunt CPU abuse.
const PREVIEW_MAX = 240;
const PREVIEW_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_BODY_BYTES = 8_000_000;

/** Render a (possibly unsaved) canonical document to HTML for live preview. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rl = await enforceRateLimit(`preview:${session.user.id}`, PREVIEW_MAX, PREVIEW_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many preview requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "CV document too large" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = CanonicalCvSchema.safeParse(
    (body as { document?: unknown } | null)?.document,
  );
  if (!parsed.success) {
    // Generic message — don't echo raw Zod issues (schema internals) to clients.
    return NextResponse.json({ error: "Invalid CV document" }, { status: 422 });
  }

  try {
    const html = renderCvHtml(parsed.data);
    return NextResponse.json({ html });
  } catch (err) {
    logger.error("api.cv_preview_failed", { err });
    return NextResponse.json(
      { error: "Failed to render preview" },
      { status: 500 },
    );
  }
}
