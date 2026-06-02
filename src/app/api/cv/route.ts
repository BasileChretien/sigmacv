import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CanonicalCvSchema } from "@/lib/canonical/schema";
import { CvNotFoundError, getCvForUser, saveCvForUser } from "@/lib/cv/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Load the signed-in user's canonical CV. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cv = await getCvForUser(session.user.id);
  return NextResponse.json({ cv });
}

/** Save the curated canonical CV (display curation — writes nowhere external). */
export async function PATCH(req: Request) {
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

  const document = (body as { document?: unknown } | null)?.document;
  const parsed = CanonicalCvSchema.safeParse(document);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid CV document", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  try {
    const cv = await saveCvForUser(session.user.id, parsed.data);
    return NextResponse.json({ cv });
  } catch (err) {
    if (err instanceof CvNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("[api/cv PATCH]", err);
    return NextResponse.json({ error: "Failed to save CV" }, { status: 500 });
  }
}
