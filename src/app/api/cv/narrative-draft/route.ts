import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { AiDisabledError, AiRequestError, isNarrativeAiEnabled } from "@/lib/ai/provider";
import { NARRATIVE_AI_SECTIONS, generateNarrativeDraft } from "@/lib/ai/narrativeDraft";
import { getCvForUser } from "@/lib/cv/sync";
import { logger } from "@/lib/log";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { readJsonBodyWithLimit } from "@/lib/readBody";
import { isSameOrigin } from "@/lib/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The body is a section id + an explicit consent flag; reject anything larger.
const MAX_BODY_BYTES = 2_000;
const BodySchema = z.object({
  sectionType: z.enum(NARRATIVE_AI_SECTIONS),
  // The client sends this only after the user accepts the AI-drafting disclosure
  // (what is sent, to which EU processor). A literal `true` is required.
  consented: z.literal(true),
});
// AI drafting hits a paid/limited external provider, so cap it tightly per user.
const DRAFT_MAX = 20;
const DRAFT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Generate an AI FIRST DRAFT for one narrative-CV module from the caller's own
 * saved CV. Opt-in + consented + auth-gated; dormant unless the deployment
 * configured an (EU) AI provider. Never persists or auto-inserts — it returns
 * the draft for the user to verify and rewrite.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }
  // Feature dormant on this deployment (no provider configured) → behave as if the
  // endpoint doesn't exist. No CV is loaded, no external call is made.
  if (!isNarrativeAiEnabled()) {
    return NextResponse.json({ error: "AI drafting is not available." }, { status: 404 });
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
      { error: "Expected { sectionType: <narrative module>, consented: true }" },
      { status: 422 },
    );
  }

  const cv = await getCvForUser(session.user.id);
  if (!cv) {
    return NextResponse.json({ error: "No CV to draft from yet." }, { status: 404 });
  }

  try {
    const draft = await generateNarrativeDraft(cv, parsed.data.sectionType);
    return NextResponse.json({ draft });
  } catch (err) {
    if (err instanceof AiDisabledError) {
      return NextResponse.json({ error: "AI drafting is not available." }, { status: 404 });
    }
    if (err instanceof AiRequestError) {
      // The provider hiccuped / rate-limited us — retryable, not our bug.
      return NextResponse.json(
        { error: "The AI provider is unavailable right now. Please try again shortly." },
        { status: 503, headers: { "Retry-After": "30" } },
      );
    }
    logger.error("api.narrative_draft_failed", { err });
    return NextResponse.json({ error: "Failed to generate a draft." }, { status: 500 });
  }
}
