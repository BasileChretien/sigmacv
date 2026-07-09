import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { AiConfigError, AiRequestError } from "@/lib/ai/provider";
import { NARRATIVE_AI_SECTIONS, generateNarrativeDraft } from "@/lib/ai/narrativeDraft";
import { getCvForUser } from "@/lib/cv/sync";
import { logger } from "@/lib/log";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { readJsonBodyWithLimit } from "@/lib/readBody";
import { isSameOrigin } from "@/lib/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The body is a section id + consent + the caller's own provider config (base URL,
// model, key). The key alone can be long; keep a generous-but-bounded cap.
const MAX_BODY_BYTES = 8_000;
const BodySchema = z.object({
  sectionType: z.enum(NARRATIVE_AI_SECTIONS),
  // Sent only after the user accepts the AI-drafting disclosure (what is sent, to
  // THEIR chosen provider under THEIR key). A literal `true` is required.
  consented: z.literal(true),
  // BRING-YOUR-OWN-KEY: the user's own provider, from their browser. Never stored
  // or logged. `baseUrl` is https-only + SSRF-hardened downstream in the provider.
  baseUrl: z.url().max(2_000),
  model: z.string().min(1).max(200),
  apiKey: z.string().min(1).max(500),
});
// Relaying to a user's provider still costs THEM and is an outbound call from our
// box, so cap it per user (also limits the SSRF-hardened relay's abuse surface).
const DRAFT_MAX = 30;
const DRAFT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate an AI FIRST DRAFT for one narrative-CV module. BRING-YOUR-OWN-KEY: the
 * caller supplies their own provider (base URL + model + key); this route is a
 * stateless relay that makes ONE call to that endpoint and retains nothing (no
 * key stored, no key/prompt logged). Auth + same-origin + rate-limited. Never
 * persists or auto-inserts — it returns the draft for the user to verify.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const rl = await enforceRateLimit(`ai-draft:${session.user.id}`, DRAFT_MAX, DRAFT_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many draft requests. Please wait a bit." },
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
    return NextResponse.json(
      { error: "Expected { sectionType, consented: true, baseUrl, model, apiKey }" },
      { status: 422 },
    );
  }

  const cv = await getCvForUser(session.user.id);
  if (!cv) {
    return NextResponse.json({ error: "No CV to draft from yet." }, { status: 404 });
  }

  const { sectionType, baseUrl, model, apiKey } = parsed.data;
  try {
    const draft = await generateNarrativeDraft(cv, sectionType, { baseUrl, model, apiKey });
    return NextResponse.json({ draft });
  } catch (err) {
    if (err instanceof AiConfigError) {
      // Bad key / unsafe or invalid endpoint — the user's config, not a server bug.
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    if (err instanceof AiRequestError) {
      // The user's provider hiccuped / rejected the key — retryable, not our bug.
      return NextResponse.json(
        { error: "Your AI provider didn't respond. Check your key/model and try again." },
        { status: 502 },
      );
    }
    // Log WITHOUT the error object — it could carry the key/prompt.
    logger.error("api.narrative_draft_failed", { name: (err as Error)?.name });
    return NextResponse.json({ error: "Failed to generate a draft." }, { status: 500 });
  }
}
