import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { CvNotFoundError, getPublishState, setPublishState } from "@/lib/cv/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({ published: z.boolean() });

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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Expected { published: boolean }" }, { status: 422 });
  }

  try {
    const state = await setPublishState(session.user.id, parsed.data.published);
    return NextResponse.json(state);
  } catch (err) {
    if (err instanceof CvNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("[api/cv/publish]", err);
    return NextResponse.json({ error: "Failed to update publish state" }, { status: 500 });
  }
}
