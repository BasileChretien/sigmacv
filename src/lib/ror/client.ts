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

// ROR's **v2** API. The legacy v1 endpoint now also serves v2-shaped
// organizations (names in a `names[]` array, country under `locations[]`), and
// v1 is being retired — so we target v2 explicitly and parse that schema.
const ROR_API = "https://api.ror.org/v2/organizations";

export interface RorOrg {
  /** ROR id, e.g. "https://ror.org/04xxxxxx". */
  id: string;
  /** Canonical organization name. */
  name: string;
  /** ISO country code, when available. */
  countryCode?: string;
}

/** One name entry in the ROR **v2** schema: a value tagged with one or more
 *  types ("ror_display", "label", "alias") and an optional language. */
interface RorV2Name {
  value?: string;
  types?: string[];
  lang?: string | null;
}

interface RorAffiliationItem {
  score?: number;
  chosen?: boolean;
  /**
   * ROR's **v2** organization object. The display name moved from a single
   * `name` string (v1) into a typed `names[]` array, and the country moved under
   * `locations[].geonames_details` — reading the old v1 shape silently dropped
   * EVERY match (`organization.name` was always undefined). See {@link rorDisplayName}.
   */
  organization?: {
    id?: string;
    names?: RorV2Name[];
    locations?: Array<{ geonames_details?: { country_code?: string } }>;
  };
}

/**
 * The display name from a ROR v2 `names[]` array. ROR tags exactly one entry
 * `ror_display`; fall back to a `label`, then to any value. Returns undefined
 * when there is no usable name (such a match is ignored by the caller).
 */
function rorDisplayName(names: RorV2Name[] | undefined): string | undefined {
  if (!Array.isArray(names)) return undefined;
  const byType = (type: string) =>
    names.find((n) => Array.isArray(n.types) && n.types.includes(type) && n.value)?.value;
  return byType("ror_display") ?? byType("label") ?? names.find((n) => n.value)?.value;
}

const cache = new Map<string, RorOrg | null>();

function cacheKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Trust ONLY ROR's own confident single match (`chosen: true`).
 *
 * ROR's affiliation matcher sets `chosen` when one organization is the clear
 * best match. When it is ABSENT the candidates are ambiguous — typically several
 * near-tied hits (e.g. "CHU de Caen" returns Nice / Rennes / Nantes all at 0.86,
 * none of them Caen). A self-rolled score threshold over those manufactures a
 * confident-looking WRONG link, which is worse than no link — so we link nothing
 * unless ROR chose one. The user keeps their original institution string.
 */
function pickMatch(items: RorAffiliationItem[]): RorAffiliationItem | undefined {
  return items.find((i) => i.chosen === true);
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
      headers: {
        Accept: "application/json",
        // Polite-pool identification (shared convention across all clients).
        "User-Agent": "SigmaCV (+https://github.com/BasileChretien/sigmacv)",
      },
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
    const name = rorDisplayName(org?.names);
    const result: RorOrg | null =
      org?.id && name
        ? { id: org.id, name, countryCode: org.locations?.[0]?.geonames_details?.country_code }
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
