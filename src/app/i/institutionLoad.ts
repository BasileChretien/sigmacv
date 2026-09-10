import type { Metadata } from "next";
import { cache } from "react";
import { headers } from "next/headers";
import { chargeComparisonLimits } from "@/app/i/compareLimits";
import { enforcePubPageRateLimitForIp } from "@/app/p/[slug]/pubRateLimit";
import type { Locale } from "@/lib/i18n";
import { institutionCompareStrings } from "@/lib/i18n/institutionsCompare";
import {
  canonicalCompareQuery,
  institutionComparison,
  listComparableInstitutions,
  type ComparableInstitution,
  type InstitutionComparison,
} from "@/lib/institutions/compare";
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
import { localeInstitutionComparePath } from "@/lib/seo";

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

export type InstitutionCompareLookup =
  | { kind: "ok"; comparison: InstitutionComparison; picker: ComparableInstitution[] }
  | { kind: "rate-limited" };

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
 * Resolve the comparison view for the current request. `key` is the raw `ror`
 * query serialised (React `cache` keys on argument identity, and the two
 * callers of one request must share the check and the reads). The rate limit
 * is the comparison surfaces' shared one (`compareLimits.ts`); the picker's
 * list is read only when the page needs it.
 */
export const loadInstitutionComparison = cache(
  async (key: string): Promise<InstitutionCompareLookup> => {
    const raw = parseCompareKey(key);
    const ip = clientIpFromHeaders(await headers());
    const limited = await chargeComparisonLimits(ip, raw);
    if (!limited.ok) return { kind: "rate-limited" };
    const comparison = await institutionComparison(raw);
    const picker = comparison.columns.length < 2 ? await listComparableInstitutions() : [];
    return { kind: "ok", comparison, picker };
  },
);

/** The raw `ror` search param as a stable cache key, and back. */
export function compareKey(ror: string | string[] | undefined): string {
  return JSON.stringify(ror === undefined ? [] : Array.isArray(ror) ? ror : [ror]);
}

/**
 * The comparison view's metadata: never indexed (links followed), no hreflang,
 * and a canonical on the SORTED set of ids so every order of the same set is
 * one URL; with fewer than two columns the canonical is the bare picker. A
 * rate-limited notice is `noindex, nofollow` like the other institution routes.
 */
export function compareMetadata(locale: Locale, lookup: InstitutionCompareLookup): Metadata {
  if (lookup.kind !== "ok") return { robots: { index: false, follow: false } };
  const c = institutionCompareStrings(locale);
  const { columns, canonicalIds } = lookup.comparison;
  const query = columns.length >= 2 ? canonicalCompareQuery(canonicalIds) : "";
  return {
    // The root layout's title template appends " — SigmaCV".
    title: c.metaTitle,
    description: c.metaDescription,
    robots: { index: false, follow: true },
    alternates: { canonical: localeInstitutionComparePath(locale, query) },
  };
}

function parseCompareKey(key: string): string[] {
  const parsed: unknown = JSON.parse(key);
  return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
}

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
