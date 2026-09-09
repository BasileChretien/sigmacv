import { createHmac } from "node:crypto";

/**
 * Objection list for the no-login `/preview/[orcid]` route (GDPR Art. 21).
 *
 * A researcher who never used SigmaCV can ask not to be shown in the automatic
 * preview. Their iD is stored ONLY as `HMAC-SHA256(AUTH_SECRET, ORCID)` in the
 * `PREVIEW_SUPPRESSED_ORCID_HMACS` environment variable (comma-separated
 * lowercase hex) — never in plaintext, because a list of iDs is itself a
 * personal-information database under the APPI, and an HMAC keyed by the
 * server secret cannot be reversed or joined by anyone holding the env alone.
 *
 * A suppressed iD is answered by {@link previewCvFromOrcid} with the SAME
 * `empty` result as an iD with no public record: no distinct status, no
 * "this person objected" tell. (A timing difference remains — a suppressed iD
 * answers before the sources are queried — and is accepted: processing an
 * objector's data to hide the timing would defeat the objection.)
 *
 * This is the interim, maintainer-operated mechanism; the self-service
 * ORCID-verified objection route replaces the env list when it lands.
 */

/** Canonical HMAC of an ORCID for the suppression list. The iD is upper-cased
 *  so a lowercase `x` check digit hashes the same as the canonical form. */
export function previewSuppressionHmac(orcid: string, secret: string): string {
  return createHmac("sha256", secret).update(orcid.trim().toUpperCase()).digest("hex");
}

const HEX_64 = /^[0-9a-f]{64}$/;

/** Parse the env value: comma-separated entries, whitespace-tolerant, lower-cased;
 *  anything that is not a 64-hex-char digest is ignored rather than trusted. */
export function parseSuppressionList(raw: string | undefined): ReadonlySet<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => HEX_64.test(s)),
  );
}

/** True when the (canonical) ORCID's HMAC is on the list. Empty list ⇒ never. */
export function isPreviewSuppressed(
  orcid: string,
  list: ReadonlySet<string>,
  secret: string,
): boolean {
  if (list.size === 0) return false;
  return list.has(previewSuppressionHmac(orcid, secret));
}
