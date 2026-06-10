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
  /** Canonical organization name (ROR's `ror_display`). */
  name: string;
  /** ISO country code, when available. */
  countryCode?: string;
  /**
   * Localized display names by language subtag (e.g. `{ ja: "名古屋大学" }`),
   * restricted to the UI languages we support ({@link DISPLAY_NAME_LANGS}). Lets
   * a rendered CV show the institution in the CV's own language when ROR carries
   * one, falling back to `name` otherwise. Absent when ROR has no usable
   * localized variant.
   */
  names?: Record<string, string>;
}

/**
 * The language subtags we keep a localized institution name for — the subtags of
 * `SUPPORTED_LOCALES` (see `src/lib/i18n`). Held as a literal so this low-level
 * client doesn't pull in the UI i18n bundle; `tests/ror-localized-names.test.ts`
 * asserts the two stay in sync, so adding a UI locale fails the build until this
 * is updated too.
 */
export const DISPLAY_NAME_LANGS: ReadonlySet<string> = new Set([
  "en",
  "zh",
  "es",
  "fr",
  "de",
  "ja",
  "pt",
  "it",
  "ko",
  "ru",
]);

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

/**
 * Build a `lang → value` map of localized display names from a ROR v2 `names[]`
 * array, restricted to {@link DISPLAY_NAME_LANGS}. Prefers a `ror_display`/
 * `label` value over an `alias`, and the first usable value wins per language.
 * Returns undefined when there's no localized name in a supported language.
 */
function rorLocalizedNames(names: RorV2Name[] | undefined): Record<string, string> | undefined {
  if (!Array.isArray(names)) return undefined;
  const out: Record<string, string> = {};
  // Two passes so a `label`/`ror_display` always wins over an `alias` for a
  // given language, regardless of array order.
  for (const preferred of [true, false]) {
    for (const n of names) {
      const lang = n.lang?.toLowerCase().trim();
      const value = n.value?.trim();
      if (!lang || !value || !DISPLAY_NAME_LANGS.has(lang) || out[lang]) continue;
      const isPreferred =
        Array.isArray(n.types) && (n.types.includes("ror_display") || n.types.includes("label"));
      if (isPreferred === preferred) out[lang] = value;
    }
  }
  return Object.keys(out).length > 0 ? out : undefined;
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
        ? {
            id: org.id,
            name,
            countryCode: org.locations?.[0]?.geonames_details?.country_code,
            names: rorLocalizedNames(org.names),
          }
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
