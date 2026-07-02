import { buildCvFromOrcid, cvItemCount } from "@/lib/cv/sync";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import { renderCvHtml } from "@/lib/render/html";
import { normalizeOrcid } from "@/lib/openalex/types";
import { isValidOrcidChecksum } from "@/lib/orcid/checksum";
import { logger } from "@/lib/log";
import type { CanonicalCv } from "@/lib/canonical/schema";
import {
  dedupeOrcidPreview,
  getCachedOrcidPreview,
  isKnownEmptyPreview,
  rememberEmptyPreview,
  setCachedOrcidPreview,
} from "@/lib/cv/orcidPreviewCache";

/** A canonical ORCID iD: 16 digits in four groups; the final char is the ISO-7064
 *  MOD-11-2 checksum (a digit or `X`). Shape only — the check digit is verified
 *  separately by {@link isValidOrcidChecksum}. */
const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;

/** The outcome of an anonymous ORCID preview: a built CV (the object the
 *  interactive editor loads, plus a first-paint render), a valid-but-unknown
 *  ORCID (nothing to show), a transient build failure (retryable), or an
 *  un-parseable / checksum-invalid input. */
export type PreviewResult =
  | {
      status: "ok";
      orcid: string;
      name: string;
      html: string;
      cv: CanonicalCv;
      /** Per-source item counts from the build, for the provenance panel. */
      sourceCounts?: Record<string, number>;
    }
  | { status: "empty"; orcid: string }
  | { status: "error"; orcid: string }
  | { status: "invalid" };

/** Normalize a raw ORCID input to its canonical `0000-0000-0000-000X` form, or
 *  null when it isn't a well-formed, checksum-valid iD (so the caller can reject a
 *  typo cheaply — before any network work — instead of building an empty CV for a
 *  non-existent iD). */
export function normalizeOrcidForPreview(raw: string): string | null {
  const normalized = normalizeOrcid(raw);
  if (!ORCID_RE.test(normalized) || !isValidOrcidChecksum(normalized)) return null;
  return normalized;
}

/**
 * Build an ANONYMOUS, ephemeral CV from a public ORCID iD — no DB, no session,
 * nothing persisted. Uses only public data (OpenAlex / ORCID) and runs it through
 * {@link projectCvForPublic} — the same gate the living page uses — so no
 * consent-gated field can appear. Returns the canonical object (which the no-login
 * interactive editor loads) plus a first-paint HTML render. Cached per normalized
 * ORCID and single-flighted; ORCIDs with no public record are negatively cached so
 * a flood of unknown ids can't re-fetch every source.
 */
export async function previewCvFromOrcid(raw: string): Promise<PreviewResult> {
  const orcid = normalizeOrcidForPreview(raw);
  if (!orcid) return { status: "invalid" };

  const cached = getCachedOrcidPreview(orcid);
  if (cached)
    return {
      status: "ok",
      orcid,
      name: cached.name,
      html: cached.html,
      cv: cached.cv,
      sourceCounts: cached.sourceCounts,
    };
  if (isKnownEmptyPreview(orcid)) return { status: "empty", orcid };

  return dedupeOrcidPreview<PreviewResult>(orcid, async () => {
    try {
      const { cv, report } = await buildCvFromOrcid({ orcid });
      const projected = projectCvForPublic(cv);
      const name = projected.owner.displayName.trim();
      // Empty ⇒ a DETERMINISTIC not-found: OpenAlex answered with no matching
      // author (resolveAuthorByOrcid returns null only on a clean 200/zero-results),
      // and no source contributed an item. Safe to negatively cache so a flood of
      // unknown ids can't re-fetch every source.
      if (!name && cvItemCount(projected) === 0) {
        rememberEmptyPreview(orcid);
        return { status: "empty", orcid };
      }
      const html = renderCvHtml(projected);
      const { sourceCounts } = report;
      setCachedOrcidPreview(orcid, { html, name, cv: projected, sourceCounts });
      return { status: "ok", orcid, name, html, cv: projected, sourceCounts };
    } catch (err) {
      // ANY throw here — a transient upstream build failure (OpenAlex
      // author-resolve throws on a non-200) OR an unexpected projection/render
      // error — is a retryable "error". We never touch the negative cache, so a
      // passing hiccup can't hide a real record for the miss TTL.
      logger.warn("preview.build_failed", { err });
      return { status: "error", orcid };
    }
  });
}
