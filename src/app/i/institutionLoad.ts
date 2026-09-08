import type { Metadata } from "next";
import { cache } from "react";
import { headers } from "next/headers";
import { enforcePubPageRateLimitForIp } from "@/app/p/[slug]/pubRateLimit";
import {
  institutionIndex,
  institutionSummary,
  isInstitutionIndexable,
  isKnownInstitutionMiss,
  isRorId,
  rememberInstitutionMiss,
  type InstitutionSummary,
} from "@/lib/institutions/institutions";
import { clientIpFromHeaders } from "@/lib/security/clientIp";

/**
 * Request-scoped loaders shared by the four institution routes (`/i`,
 * `/i/[ror]` and their localized twins). Wrapped in React `cache` so
 * `generateMetadata` and the page body — which Next runs separately for the
 * same request — share one rate-limit check and one database read.
 *
 * Order for a page: rate limit → id shape → negative cache → database. The
 * limit is the public CV pages' (`pubpage:` buckets, per IP + global), applied
 * first so that even a flood of malformed ids costs no render; an id that is
 * not ROR-shaped, or one recently found to have no page, costs no `Cv` read
 * (the rate-limit check itself is a Postgres-backed window, so "no database"
 * would overstate it). A page is "missing" both for a bad id and for a ROR
 * nobody is listed under — the 404 does not distinguish the two.
 */
export type InstitutionLookup =
  { kind: "ok"; summary: InstitutionSummary } | { kind: "missing" } | { kind: "rate-limited" };

export type InstitutionIndexLookup =
  { kind: "ok"; institutions: InstitutionSummary[] } | { kind: "rate-limited" };

async function rateLimited(): Promise<boolean> {
  const rl = await enforcePubPageRateLimitForIp(clientIpFromHeaders(await headers()));
  return !rl.ok;
}

/** Resolve one institution page for the current request. */
export const loadInstitution = cache(async (ror: string): Promise<InstitutionLookup> => {
  if (await rateLimited()) return { kind: "rate-limited" };
  if (!isRorId(ror) || isKnownInstitutionMiss(ror)) return { kind: "missing" };
  const summary = await institutionSummary(ror);
  if (!summary) {
    rememberInstitutionMiss(ror);
    return { kind: "missing" };
  }
  return { kind: "ok", summary };
});

/** Resolve the institution index for the current request. */
export const loadInstitutionIndex = cache(async (): Promise<InstitutionIndexLookup> => {
  if (await rateLimited()) return { kind: "rate-limited" };
  return { kind: "ok", institutions: await institutionIndex() };
});

/**
 * The robots directive for what a lookup will render. A server-component page
 * cannot send a 429 (or a response header), so a rate-limited hit — and any
 * other non-page outcome — is at least marked `noindex, nofollow`: a notice
 * must never be indexed under the institution's URL. A page for fewer than
 * `MIN_INDEXABLE_LISTED` researchers is served but `noindex` (links still
 * followed): see `isInstitutionIndexable`. `undefined` inherits the layout's
 * default (index, follow).
 */
export function institutionRobots(
  lookup: InstitutionLookup | InstitutionIndexLookup,
): Metadata["robots"] | undefined {
  if (lookup.kind !== "ok") return { index: false, follow: false };
  if ("summary" in lookup && !isInstitutionIndexable(lookup.summary)) {
    return { index: false, follow: true };
  }
  return undefined;
}
