import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { requestContactEmail } from "@/lib/email/digest";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { readJsonBodyWithLimit } from "@/lib/readBody";
import { isSameOrigin } from "@/lib/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// "" clears the address; anything else must be a real email (it will receive
// the double-opt-in confirmation mail). `locale` only picks the mail language.
const BodySchema = z.object({
  email: z.union([z.literal(""), z.email().max(254)]),
  locale: z.string().max(35).optional(),
});
const MAX_BODY_BYTES = 2_000;
// Every set triggers an outbound confirmation mail — keep the cap tight so the
// endpoint can't be used to spray arbitrary inboxes from a logged-in account.
const SET_MAX = 5;
const SET_WINDOW_MS = 60 * 60 * 1000;

/** Set (pending, confirmation mailed) or clear the digest contact email. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const rl = await enforceRateLimit(`contact-email:${session.user.id}`, SET_MAX, SET_WINDOW_MS);
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
    return NextResponse.json({ error: "Expected { email: string }" }, { status: 422 });
  }

  const { confirmationSent } = await requestContactEmail(
    session.user.id,
    parsed.data.email,
    parsed.data.locale ?? "en-US",
  );
  return NextResponse.json({ ok: true, email: parsed.data.email, confirmationSent });
}
