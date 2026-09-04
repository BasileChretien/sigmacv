import { buildCvFromOrcid, cvItemCount, type SourceProgress } from "@/lib/cv/sync";
import { projectCvForPreview } from "@/lib/cv/publicProjection";
import { applyOwnerCorrections } from "@/lib/cv/ownerCorrections";
import { fetchOwnerCorrections } from "@/lib/cv/fetchOwnerCorrections";
import { renderCvHtml } from "@/lib/render/html";
import { validOrcidOrNull } from "@/lib/orcid/validate";
import { logger } from "@/lib/log";
import type { CanonicalCv } from "@/lib/canonical/schema";
import {
  dedupeOrcidPreview,
  getCachedOrcidPreview,
  isKnownEmptyPreview,
  rememberEmptyPreview,
  orcidPreviewEpoch,
  setCachedOrcidPreview,
} from "@/lib/cv/orcidPreviewCache";

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
  return validOrcidOrNull(raw);
}

/**
 * Build an ANONYMOUS, ephemeral CV from a public ORCID iD — no session, nothing
 * persisted. It does make ONE database read: if the iD belongs to a SigmaCV
 * account, the owner's own disambiguation corrections are applied, so a visitor
 * is not shown works the researcher has already said are not theirs. See
 * {@link fetchOwnerCorrections} for the privacy line that read observes. Uses only public data (OpenAlex / ORCID) and runs it through
 * {@link projectCvForPreview} — which strips owner-private/contact fields for the
 * anonymous viewer but keeps the review candidates + disambiguation flags so the
 * editor can surface them. Returns the canonical object (which the no-login
 * interactive editor loads) plus a first-paint HTML render. Cached per normalized
 * ORCID and single-flighted; ORCIDs with no public record are negatively cached so
 * a flood of unknown ids can't re-fetch every source.
 */
export async function previewCvFromOrcid(
  raw: string,
  opts?: {
    /** Live per-source progress sink for the streaming "searching" view. Fires
     *  only on a cache MISS (a hit returns instantly with no build to observe). */
    onProgress?: (event: SourceProgress) => void;
  },
): Promise<PreviewResult> {
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
    // Captured BEFORE the build. If the researcher corrects something while it
    // runs, the epoch moves and the writes below are dropped rather than
    // overwriting the invalidation with pre-correction output.
    const epoch = orcidPreviewEpoch(orcid);
    try {
      const { cv, report } = await buildCvFromOrcid({ orcid, onProgress: opts?.onProgress });
      // If this iD belongs to a SigmaCV account, honour the researcher's own
      // disambiguation corrections. A fresh build is raw machine output and
      // OpenAlex over-merges same-named people; the person whose work it is has
      // better information than any heuristic we run. Reads ONLY corrections that
      // remove a work ("not mine") or remove a warning (a confirmed work) — never
      // display choices, never anything that adds exposure. Fail-soft: no account,
      // or any error, and the build is used exactly as-is.
      const corrected = applyOwnerCorrections(cv, await fetchOwnerCorrections(orcid));
      // Preview projection (NOT the public one): strips owner-private/contact
      // fields for the anonymous viewer, but KEEPS review candidates + their
      // reviewFlag/duplicate/misattribution metadata so the editor surfaces the
      // same "probably not yours" / "probably a duplicate" cues as when signed in.
      const projected = projectCvForPreview(corrected);
      const name = projected.owner.displayName.trim();
      // Empty ⇒ a DETERMINISTIC not-found: OpenAlex answered with no matching
      // author (resolveAuthorByOrcid returns null only on a clean 200/zero-results),
      // and no source contributed an item. Safe to negatively cache so a flood of
      // unknown ids can't re-fetch every source.
      if (!name && cvItemCount(projected) === 0) {
        rememberEmptyPreview(orcid, Date.now(), epoch);
        return { status: "empty", orcid };
      }
      const html = renderCvHtml(projected);
      const { sourceCounts } = report;
      setCachedOrcidPreview(orcid, { html, name, cv: projected, sourceCounts }, Date.now(), epoch);
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
