import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CustomStyleError, resolveCslStyle } from "@/lib/citeproc/customStyle";
import { logger } from "@/lib/log";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { isSameOrigin } from "@/lib/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Each call makes 1–2 outbound fetches to the style repo — keep it modest.
const STYLE_MAX = 30;
const STYLE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Resolve a user-supplied CSL style (by repository id or URL) to an independent
 * style XML the renderer can use. Returns { id, title, xml }; the client stores
 * it in the canonical document's `display.customStyle` and saves.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const rl = await enforceRateLimit(`style:${session.user.id}`, STYLE_MAX, STYLE_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many style lookups. Please wait a bit." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = (body as { input?: unknown } | null)?.input;
  if (typeof input !== "string" || input.trim().length === 0) {
    return NextResponse.json(
      { error: "Provide a style id or URL (e.g. “nature”)." },
      { status: 400 },
    );
  }
  if (input.length > 2048) {
    return NextResponse.json({ error: "Input too long." }, { status: 400 });
  }

  try {
    const style = await resolveCslStyle(input);
    return NextResponse.json(style);
  } catch (err) {
    if (err instanceof CustomStyleError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    logger.error("api.cv_style_resolve_failed", { err });
    return NextResponse.json(
      { error: "Could not resolve that style." },
      { status: 500 },
    );
  }
}
