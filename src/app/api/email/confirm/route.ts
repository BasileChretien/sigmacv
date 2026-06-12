import { NextResponse } from "next/server";
import { confirmContactEmailByToken } from "@/lib/email/digest";
import { enforceRateLimit } from "@/lib/rateLimitStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONFIRM_MAX = 10;
const CONFIRM_WINDOW_MS = 60 * 60 * 1000;

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
 * Contact-email confirmation landing (double opt-in). Session-LESS by design —
 * the click comes from the mailbox being verified, possibly on another device;
 * the signed, expiring token (HMAC over userId+email, see `confirmToken.ts`)
 * is the authorization. Only succeeds while the address is still the user's
 * pending contact email, so a stale link can't verify a replaced address.
 */
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const rl = await enforceRateLimit(
    `confirm:${token.slice(0, 32)}`,
    CONFIRM_MAX,
    CONFIRM_WINDOW_MS,
  );
  if (!rl.ok) {
    return htmlResponse("Too many requests — please try again later.", 429);
  }
  const ok = await confirmContactEmailByToken(token);
  return ok
    ? htmlResponse(
        "Your notification email is confirmed — re-sync digests will be sent to this address.",
        200,
      )
    : htmlResponse("This confirmation link is invalid or has expired.", 400);
}
