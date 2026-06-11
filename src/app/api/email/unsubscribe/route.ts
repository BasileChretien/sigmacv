import { NextResponse } from "next/server";
import { unsubscribeByToken } from "@/lib/email/digest";
import { enforceRateLimit } from "@/lib/rateLimitStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Per-token throttle: the only action is turning OFF an opt-in, so this just
// bounds abuse of the endpoint as a request amplifier.
const UNSUB_MAX = 10;
const UNSUB_WINDOW_MS = 60 * 60 * 1000;

/** Tiny self-contained confirmation page (no session, no locale context). */
const PAGE = (body: string) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>SigmaCV</title><style>body{font-family:system-ui,sans-serif;max-width:36rem;margin:4rem auto;padding:0 1rem;color:#1f2430}a{color:#1f4fd8}</style></head><body><h1>SigmaCV</h1><p>${body}</p><p><a href="/">sigmacv.org</a></p></body></html>`;

function htmlResponse(body: string, status: number): NextResponse {
  return new NextResponse(PAGE(body), {
    status,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

/**
 * One-click digest unsubscribe. Deliberately session-LESS: the signed token in
 * the mailed link is the authorization (HMAC over the userId, see
 * `unsubscribeToken.ts`), because the click can come from any device or from a
 * mail client's automated one-click POST (RFC 8058). The only effect is
 * `digestOptIn = false` — idempotent and harmless to repeat.
 */
async function handle(req: Request): Promise<NextResponse> {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const rl = await enforceRateLimit(`unsub:${token.slice(0, 32)}`, UNSUB_MAX, UNSUB_WINDOW_MS);
  if (!rl.ok) {
    return htmlResponse("Too many requests — please try again later.", 429);
  }
  const ok = await unsubscribeByToken(token);
  return ok
    ? htmlResponse("You have been unsubscribed from the re-sync digest emails.", 200)
    : htmlResponse("This unsubscribe link is invalid.", 400);
}

export async function GET(req: Request) {
  return handle(req);
}

/** RFC 8058 one-click unsubscribe — mail clients POST to the same URL. */
export async function POST(req: Request) {
  return handle(req);
}
