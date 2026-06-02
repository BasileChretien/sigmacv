import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCvForUser } from "@/lib/cv/sync";
import { rateLimit } from "@/lib/rateLimit";
import { getRenderer } from "@/lib/render";
import type { RenderFormat } from "@/lib/render/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPORTABLE: readonly RenderFormat[] = ["pdf", "docx", "latex", "markdown"];
const EXPORT_MAX = 60;
const EXPORT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/** Export the saved canonical CV in the requested format. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ format: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { format } = await params;
  if (!EXPORTABLE.includes(format as RenderFormat)) {
    return NextResponse.json(
      { error: `Unsupported export format: ${format}` },
      { status: 400 },
    );
  }

  const rl = rateLimit(`export:${session.user.id}`, EXPORT_MAX, EXPORT_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many exports. Please wait a bit." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const cv = await getCvForUser(session.user.id);
  if (!cv) {
    return NextResponse.json({ error: "No CV to export yet." }, { status: 404 });
  }

  try {
    const renderer = await getRenderer(format as RenderFormat);
    const result = await renderer.render({ cv });
    const body: BodyInit = result.buffer
      ? new Uint8Array(result.buffer)
      : (result.text ?? result.html ?? "");
    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error(`[api/cv/export/${format}]`, err);
    return NextResponse.json(
      { error: "Failed to generate export." },
      { status: 500 },
    );
  }
}
