import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { importBibtexIntoCv } from "@/lib/import/bibtex";
import { CvNotFoundError, CvTooLargeError, getCvForUser, saveCvForUser } from "@/lib/cv/sync";
import { logger } from "@/lib/log";
import { enforceRateLimit } from "@/lib/rateLimitStore";
import { readJsonBodyWithLimit } from "@/lib/readBody";
import { isSameOrigin } from "@/lib/security/origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Parsing is local (no upstream fetch), but each call reparses + resaves the CV, so
// bound it. A user rarely imports more than a few times.
const IMPORT_MAX = 20;
const IMPORT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
// A .bib with hundreds of entries is ~100 KB–1 MB; cap generously and reject the
// rest early (streamed).
const MAX_BODY_BYTES = 2_000_000;

const BodySchema = z.object({
  bibtex: z.string().min(1).max(2_000_000),
});

/**
 * Import a user-uploaded BibTeX library. POST { bibtex } parses it, merges the new
 * works into the caller's CV (deduped by DOI/id, appended to Publications /
 * Preprints), saves, and returns the updated CV plus a summary
 * (added / duplicates / skipped). Keyed by the session user — never a client id.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Cross-origin request rejected" }, { status: 403 });
  }

  const rl = await enforceRateLimit(`bibimport:${session.user.id}`, IMPORT_MAX, IMPORT_WINDOW_MS);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many imports. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const read = await readJsonBodyWithLimit(req, MAX_BODY_BYTES);
  if (!read.ok) {
    return read.tooLarge
      ? NextResponse.json({ error: "That .bib file is too large" }, { status: 413 })
      : NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(read.value);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 422 });
  }

  const cv = await getCvForUser(session.user.id);
  if (!cv) {
    return NextResponse.json({ error: "Sync your CV before importing." }, { status: 409 });
  }

  try {
    const outcome = importBibtexIntoCv(cv, parsed.data.bibtex);
    // Only persist when something actually changed (all-duplicate imports are a no-op).
    const cvOut = outcome.added > 0 ? await saveCvForUser(session.user.id, outcome.cv) : cv;
    return NextResponse.json({
      cv: cvOut,
      parsed: outcome.parsed,
      added: outcome.added,
      duplicates: outcome.duplicates,
      skipped: outcome.skipped,
    });
  } catch (err) {
    if (err instanceof CvNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof CvTooLargeError) {
      return NextResponse.json(
        { error: "CV would exceed the maximum number of items" },
        { status: 413 },
      );
    }
    logger.error("api.cv_bibtex_import_failed", { err });
    return NextResponse.json(
      { error: "Couldn't import that .bib file. Please check it and try again." },
      { status: 502 },
    );
  }
}
