import { createHmac } from "node:crypto";
import { prisma } from "@/lib/db";
import { getEnv } from "@/lib/env";
import { invalidateOrcidPreview } from "@/lib/cv/orcidPreviewCache";
import { logger } from "@/lib/log";

/**
 * Objection list for the no-login `/preview/[orcid]` route (GDPR Art. 21).
 *
 * A researcher who never used SigmaCV can ask not to be shown in the automatic
 * preview. Their iD is stored ONLY as `HMAC-SHA256(PREVIEW_SUPPRESSION_KEY,
 * ORCID)` in the `PREVIEW_SUPPRESSED_ORCID_HMACS` environment variable
 * (comma-separated lowercase hex) — never in plaintext, because a list of iDs
 * is itself a personal-information database under the APPI. The key is
 * DEDICATED (not AUTH_SECRET) so a routine secret rotation cannot silently
 * void every objection; `env.ts` refuses a list without its key.
 *
 * A suppressed iD is answered by {@link previewCvFromOrcid} with the SAME
 * `empty` result as an iD with no public record: no distinct status, no
 * "this person objected" tell. (A timing difference remains — a suppressed iD
 * answers before the sources are queried — and is accepted: processing an
 * objector's data to hide the timing would defeat the objection.)
 *
 * Two stores, one key: the `PreviewSuppression` table (written by the
 * self-service `/object` route and the signed-in account toggle) and the
 * `PREVIEW_SUPPRESSED_ORCID_HMACS` env list (the manual fallback for an
 * email objection). Both hold the same HMAC; {@link isOrcidPreviewSuppressed}
 * consults the list first (no I/O) and the table second.
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

/** The configured key, or null when this instance cannot hash iDs (then no
 *  objection can be recorded or matched — the pages say so). */
function suppressionKey(): string | null {
  return getEnv().PREVIEW_SUPPRESSION_KEY ?? null;
}

/**
 * Is the no-login preview of this iD suppressed? The env list first (pure,
 * no I/O), then the table by HMAC. FAIL-SOFT on a DB error — the preview must
 * not go dark for everyone when the database hiccups — and false when no key
 * is configured (nothing could have been recorded).
 */
export async function isOrcidPreviewSuppressed(orcid: string): Promise<boolean> {
  const env = getEnv();
  const key = env.PREVIEW_SUPPRESSION_KEY;
  if (isPreviewSuppressed(orcid, parseSuppressionList(env.PREVIEW_SUPPRESSED_ORCID_HMACS), key ?? "")) {
    return true;
  }
  if (!key) return false;
  try {
    const row = await prisma.previewSuppression.findUnique({
      where: { orcidHmac: previewSuppressionHmac(orcid, key) },
      select: { orcidHmac: true },
    });
    return row !== null;
  } catch (err) {
    logger.error("preview.suppression_lookup_failed", { err });
    return false;
  }
}

/**
 * Record (`suppress: true`) or lift (`false`) an objection for an iD, and drop
 * the cached preview so it takes effect on the next request. Stores the HMAC
 * only. "unavailable" when no key is configured (nothing written); throws on
 * a write error so the caller can tell the person it did not happen.
 */
export async function setOrcidPreviewSuppressed(
  orcid: string,
  suppress: boolean,
  source: "orcid-oauth" | "account",
): Promise<"set" | "cleared" | "unavailable"> {
  const key = suppressionKey();
  if (!key) return "unavailable";
  const orcidHmac = previewSuppressionHmac(orcid, key);
  if (suppress) {
    await prisma.previewSuppression.upsert({
      where: { orcidHmac },
      create: { orcidHmac, source },
      update: { source },
    });
  } else {
    await prisma.previewSuppression.deleteMany({ where: { orcidHmac } });
  }
  invalidateOrcidPreview(orcid);
  return suppress ? "set" : "cleared";
}
