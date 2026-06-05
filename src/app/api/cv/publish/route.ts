import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { CvNotFoundError, getPublishState, setPublishState } from "@/lib/cv/sync";
import { logger } from "@/lib/log";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { isSameOrigin } from "@/lib/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  published: z.boolean(),
  indexable: z.boolean().optional(),
});

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Expected { published: boolean, indexable?: boolean }" },
      { status: 422 },
    );
  }

  try {
    const state = await setPublishState(
      session.user.id,
      parsed.data.published,
      parsed.data.indexable ?? false,
    );
    return NextResponse.json(state);
  } catch (err) {
    if (err instanceof CvNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    logger.error("api.cv_publish_failed", { err });
    return NextResponse.json({ error: "Failed to update publish state" }, { status: 500 });
  }
}
