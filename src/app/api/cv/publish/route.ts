import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { CvNotFoundError, getPublishState, setPublishState } from "@/lib/cv/sync";
import {
  InstitutionConsentError,
  MAX_CONSENTED_ROR_IDS,
  type InstitutionPageRequest,
} from "@/lib/cv/institutionConsent";
import { ROR_ID_PATTERN } from "@/lib/ror/id";
import { logger } from "@/lib/log";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { readJsonBodyWithLimit } from "@/lib/readBody";
import { isSameOrigin } from "@/lib/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  published: z.boolean(),
  indexable: z.boolean().optional(),
  /** Opt in to the OAI-PMH `ror:<id>` affiliation set — a consent separate from
   *  indexing; the state setter refuses it without indexing or a ROR key. */
  listUnderAffiliation: z.boolean().optional(),
  /** "Show me on my institution's page" — a consent PINNED to the ROR ids
   *  ticked among the visible current positions. The shape is checked here;
   *  membership is checked by the state setter against the STORED document
   *  (an unknown id is a 422). Omit both fields to leave the stored choice as is. */
  showOnInstitutionPage: z.boolean().optional(),
  consentedRorIds: z.array(z.string().regex(ROR_ID_PATTERN)).max(MAX_CONSENTED_ROR_IDS).optional(),
});
// Four booleans and at most five 9-char ids; reject anything larger early
// (streamed, not by header).
const MAX_BODY_BYTES = 2_000;

/** The institution-page part of the body, or undefined when it is not mentioned. */
function institutionPageRequest(
  body: z.infer<typeof BodySchema>,
): InstitutionPageRequest | undefined {
  const { showOnInstitutionPage, consentedRorIds } = body;
  if (showOnInstitutionPage === undefined && consentedRorIds === undefined) return undefined;
  return { show: showOnInstitutionPage ?? true, rorIds: consentedRorIds ?? [] };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getPublishState(session.user.id));
}

/** Publish or unpublish the living public CV page. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const rl = await enforceRateLimit(`publish:${session.user.id}`, 30, 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many publish changes. Please wait a bit." },
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
      {
        error:
          "Expected { published: boolean, indexable?: boolean, listUnderAffiliation?: boolean, showOnInstitutionPage?: boolean, consentedRorIds?: string[] (ROR ids, max 5) }",
      },
      { status: 422 },
    );
  }

  try {
    const state = await setPublishState(
      session.user.id,
      parsed.data.published,
      parsed.data.indexable ?? false,
      parsed.data.listUnderAffiliation ?? false,
      institutionPageRequest(parsed.data),
    );
    return NextResponse.json(state);
  } catch (err) {
    if (err instanceof CvNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof InstitutionConsentError) {
      return NextResponse.json(
        { error: err.message, unknownRorIds: err.unknownRorIds },
        { status: 422 },
      );
    }
    logger.error("api.cv_publish_failed", { err });
    return NextResponse.json({ error: "Failed to update publish state" }, { status: 500 });
  }
}
