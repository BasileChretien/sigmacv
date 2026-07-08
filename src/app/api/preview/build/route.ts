import { NextResponse } from "next/server";
import { previewCvFromOrcid } from "@/lib/cv/previewFromOrcid";
import { logger } from "@/lib/log";
import { readJsonBodyWithLimit } from "@/lib/readBody";
import { previewCaller } from "@/app/api/cv/previewGate";
import { enforcePreviewRateLimit } from "@/app/preview/[orcid]/previewRateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ORCID iDs are tiny; cap the body so this can't be used to ship a large payload.
const MAX_BODY_BYTES = 4096;

/**
 * Streaming twin of the /preview/[orcid] build. Runs the same anonymous,
 * ephemeral CV build but STREAMS a per-source progress event as each of the ~20
 * open sources settles (fastest-first), then a final `done` event carrying the
 * built CV + first-paint HTML. Consumed by <PreviewBuilder> via a fetch-stream
 * reader (NDJSON, one JSON object per line), so it reuses the POST same-origin +
 * per-IP gate. Nothing is persisted; the underlying build is cached +
 * single-flighted per ORCID (a cache hit streams just the `done` event, instantly).
 */
export async function POST(req: Request) {
  const gate = await previewCaller(req);
  if (!gate.ok) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }
  // Building fetches ~20 sources + runs a CPU-heavy citeproc render, so it uses the
  // tighter per-hour preview budget (with a global ceiling) — the same limit the
  // page applied before this moved client-driven.
  const rl = await enforcePreviewRateLimit();
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many previews. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const read = await readJsonBodyWithLimit(req, MAX_BODY_BYTES);
  const raw = read.ok ? (read.value as { orcid?: unknown } | null)?.orcid : undefined;
  if (typeof raw !== "string") {
    return NextResponse.json({ error: "Missing orcid" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (obj: unknown) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        } catch {
          // Client disconnected mid-stream — the build finishes and populates the
          // cache regardless, so the next request is instant. Nothing to flush.
        }
      };
      try {
        const result = await previewCvFromOrcid(raw, {
          onProgress: (e) => write({ type: "source", source: e.source, count: e.count }),
        });
        write(
          result.status === "ok"
            ? {
                type: "done",
                status: "ok",
                name: result.name,
                html: result.html,
                cv: result.cv,
                sourceCounts: result.sourceCounts,
              }
            : { type: "done", status: result.status },
        );
      } catch (err) {
        logger.error("api.preview_build_stream_failed", { err });
        write({ type: "done", status: "error" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      // Tell any intermediary proxy not to buffer, so events reach the client live.
      "X-Accel-Buffering": "no",
    },
  });
}
