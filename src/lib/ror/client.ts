import { resilientFetch } from "@/lib/http";
import { logger } from "@/lib/log";

/**
 * ROR (Research Organization Registry) — canonical institution names.
 *
 * ORCID employment / education records carry FREE-TEXT organization names that
 * vary ("Nagoya Univ.", "Nagoya University", "University of Nagoya"). ROR's
 * affiliation-matching endpoint maps such a string to a single registered
 * organization with a canonical name + a stable ROR id. Canonicalizing names
 * BEFORE the canonical CV is built means the same institution from ORCID and
 * from OpenAlex de-duplicates, and the rendered name is consistent.
 *
 * Free, no auth. Every call fails soft (returns null). Results are cached per
 * process to keep a re-sync from re-querying the same handful of institutions.
 */

const ROR_API = "https://api.ror.org/organizations";
// ROR scores its matches 0..1; only trust a confident hit when there's no
// explicitly "chosen" match. Below this we keep the user's original string.
const SCORE_THRESHOLD = 0.8;

export interface RorOrg {
  /** ROR id, e.g. "https://ror.org/04xxxxxx". */
  id: string;
  /** Canonical organization name. */
  name: string;
  /** ISO country code, when available. */
  countryCode?: string;
}

interface RorAffiliationItem {
  score?: number;
  chosen?: boolean;
  organization?: {
    id?: string;
    name?: string;
    country?: { country_code?: string };
  };
}

const cache = new Map<string, RorOrg | null>();

function cacheKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

function pickMatch(items: RorAffiliationItem[]): RorAffiliationItem | undefined {
  const chosen = items.find((i) => i.chosen === true);
  if (chosen) return chosen;
  const best = items
    .filter((i) => typeof i.score === "number" && i.score >= SCORE_THRESHOLD)
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))[0];
  return best;
}

/**
 * Resolve a free-text institution name to a canonical ROR organization, or null
 * if there is no confident match (or on any error). Cached per process.
 */
export async function resolveInstitution(name: string): Promise<RorOrg | null> {
  const key = cacheKey(name);
  if (!key) return null;
  if (cache.has(key)) return cache.get(key) ?? null;

  const url = new URL(ROR_API);
  url.searchParams.set("affiliation", name);

  try {
    const res = await resilientFetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 604_800 }, // the registry changes slowly
      timeoutMs: 10_000,
    });
    if (!res.ok) {
      cache.set(key, null);
      return null;
    }
    const data = (await res.json()) as { items?: RorAffiliationItem[] };
    const match = pickMatch(Array.isArray(data.items) ? data.items : []);
    const org = match?.organization;
    const result: RorOrg | null =
      org?.id && org.name
        ? { id: org.id, name: org.name, countryCode: org.country?.country_code }
        : null;
    cache.set(key, result);
    return result;
  } catch (err) {
    logger.warn("ror.fetch_failed", { err });
    cache.set(key, null);
    return null;
  }
}

/** Test-only: clear the in-process cache between cases. */
export function __clearRorCache(): void {
  cache.clear();
}
