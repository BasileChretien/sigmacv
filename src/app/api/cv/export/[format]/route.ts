import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getCvForUser } from "@/lib/cv/sync";
import { logger } from "@/lib/log";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { getRenderer } from "@/lib/render";
import { cvSlug } from "@/lib/render/slug";
import type { RenderFormat } from "@/lib/render/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPORTABLE: readonly RenderFormat[] = [
  "pdf",
  "docx",
  "latex",
  "latex-classic",
  "markdown",
  "bibtex",
  "webpage",
];
// "json" exports the canonical CV object verbatim (machine-readable, open).
const ALL_FORMATS: readonly string[] = [...EXPORTABLE, "json"];
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
  if (!ALL_FORMATS.includes(format)) {
    return NextResponse.json(
      { error: `Unsupported export format: ${format}` },
      { status: 400 },
    );
  }

  const rl = await enforceRateLimit(`export:${session.user.id}`, EXPORT_MAX, EXPORT_WINDOW_MS);
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

  // Machine-readable export: the canonical CV object itself (open schema).
  if (format === "json") {
    return new NextResponse(JSON.stringify(cv, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${cvSlug(cv.owner.displayName)}-cv.json"`,
        "Cache-Control": "no-store",
      },
    });
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
    logger.error("api.cv_export_failed", { format, err });
    return NextResponse.json(
      { error: "Failed to generate export." },
      { status: 500 },
    );
  }
}
