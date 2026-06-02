import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CanonicalCvSchema } from "@/lib/canonical/schema";
import { renderCvHtml } from "@/lib/render/html";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Render a (possibly unsaved) canonical document to HTML for live preview. */
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

  const parsed = CanonicalCvSchema.safeParse(
    (body as { document?: unknown } | null)?.document,
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid CV document", issues: parsed.error.issues },
      { status: 422 },
    );
  }

  try {
    const html = renderCvHtml(parsed.data);
    return NextResponse.json({ html });
  } catch (err) {
    console.error("[api/cv/preview]", err);
    return NextResponse.json(
      { error: "Failed to render preview" },
      { status: 500 },
    );
  }
}
