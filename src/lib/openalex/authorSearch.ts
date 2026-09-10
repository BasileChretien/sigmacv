import { AUTHOR_QUERY_MAX, AUTHOR_QUERY_MIN, normalizeAuthorQuery } from "./authorQuery";
import { openAlexResponse } from "./client";
import type { OpenAlexAuthor, OpenAlexListResponse } from "./types";
import { validOrcidOrNull } from "@/lib/orcid/validate";
import { logger } from "@/lib/log";

/**
 * "Find a researcher by name" — the public lookup's only upstream call.
 *
 * What it is: OpenAlex's own author search (`/authors?search=`), restricted to
 * authors who carry an ORCID iD, ten rows, relevance order, names and
 * affiliations OpenAlex already publishes. What it is NOT: a ranking. No
 * works count, no citation count, no sort by any figure — a row is a name, a
 * place, a span of years and the iD that leads to the automatic preview. Only
 * the person may put a number on their own record.
 *
 * Why `search=` and never `filter=display_name.search:`: the filter grammar
 * treats `,` `|` `!` `:` as operators, so an attacker-chosen string would
 * become arbitrary filter clauses sent under OUR polite-pool identity; the
 * `search` parameter has no grammar. The query is normalised and fenced here
 * ({@link normalizeAuthorQuery}) before it reaches the URL at all.
 *
 * Cost control: every distinct query is a request to a shared quota (the same
 * polite pool every user's sync depends on), so results — including "nothing
 * found" — are held in a bounded in-process cache, the call runs once with no
 * retry and a short timeout, and it is `no-store` for Next's data cache (an
 * attacker-chosen query must never write a disk cache entry).
 */
export interface AuthorSearchHit {
  /** Display name as OpenAlex has it. */
  name: string;
  /** Canonical ORCID iD — every hit has one; that is what makes it actionable. */
  orcid: string;
  /** Most recent affiliation OpenAlex infers from the works, or null. */
  affiliation: string | null;
  /** [first, last] year of that affiliation, or null when unknown. */
  years: [number, number] | null;
}

export const AUTHOR_SEARCH_PAGE_SIZE = 10;

// Query hygiene lives in ./authorQuery (pure, client-safe) and is re-exported
// here so existing imports keep working.
export { AUTHOR_QUERY_MAX, AUTHOR_QUERY_MIN, normalizeAuthorQuery };

// ── Bounded in-process result cache (positive AND negative) ─────────────────
const CACHE_MAX = 2000;
const CACHE_TTL_MS = 10 * 60_000;
const cache = new Map<string, { at: number; hits: AuthorSearchHit[] }>();

function cacheGet(key: string, now: number): AuthorSearchHit[] | null {
  const e = cache.get(key);
  if (!e) return null;
  if (now - e.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  // Refresh recency (Map iteration order = insertion order).
  cache.delete(key);
  cache.set(key, e);
  return e.hits;
}

function cacheSet(key: string, hits: AuthorSearchHit[], now: number): void {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { at: now, hits });
}

/** Test hook. */
export function __resetAuthorSearchCache(): void {
  cache.clear();
}

/** One OpenAlex author → one hit, or null when it has no valid ORCID iD. */
export function toAuthorSearchHit(a: OpenAlexAuthor): AuthorSearchHit | null {
  const orcid = validOrcidOrNull(a.orcid ?? "");
  const name = (a.display_name ?? "").trim();
  if (!orcid || !name) return null;
  const aff = a.affiliations?.find((x) => x.institution?.display_name);
  const years = (aff?.years ?? []).filter((y) => Number.isInteger(y));
  return {
    name,
    orcid,
    affiliation: aff?.institution?.display_name?.trim() || null,
    years: years.length > 0 ? [Math.min(...years), Math.max(...years)] : null,
  };
}

/** The last year of a hit's affiliation span, or -Infinity when unknown. */
function lastYear(h: AuthorSearchHit): number {
  return h.years ? h.years[1] : Number.NEGATIVE_INFINITY;
}

/**
 * OpenAlex keeps several author records for one person (one per affiliation
 * era, typically) and they all carry the same iD. One iD is one row, kept at
 * the position of the first record OpenAlex ranked — but the record that
 * stands for the person is the one with the most recent affiliation, because
 * the visitor most likely to search a name is its owner, and a 1975 institute
 * beside their name tells them "not you".
 */
function dedupeByOrcid(hits: AuthorSearchHit[]): AuthorSearchHit[] {
  const out: AuthorSearchHit[] = [];
  const at = new Map<string, number>();
  for (const h of hits) {
    const i = at.get(h.orcid);
    if (i === undefined) {
      at.set(h.orcid, out.length);
      out.push(h);
    } else if (lastYear(h) > lastYear(out[i]!)) {
      out[i] = h;
    }
  }
  return out;
}

/**
 * Search OpenAlex authors by name. `query` MUST already be the output of
 * {@link normalizeAuthorQuery}. Fail-soft: any upstream problem yields `[]`
 * (and is cached briefly, so a flapping upstream is not hammered).
 */
export async function searchAuthorsByName(
  query: string,
  now: number = Date.now(),
): Promise<AuthorSearchHit[]> {
  const cached = cacheGet(query, now);
  if (cached) return cached;
  let hits: AuthorSearchHit[] = [];
  try {
    const res = await openAlexResponse(
      "/authors",
      {
        search: query,
        // Identifier-only: a row without an ORCID iD could not lead anywhere
        // (the preview is keyed by iD) and could not honour an objection.
        filter: "has_orcid:true",
        "per-page": String(AUTHOR_SEARCH_PAGE_SIZE),
      },
      // One attempt, short budget, and never Next's data cache: an
      // attacker-chosen string must not write a disk entry per query.
      { retries: 0, timeoutMs: 8_000, cache: "no-store", next: undefined },
    );
    if (res.ok) {
      const data = (await res.json()) as OpenAlexListResponse<OpenAlexAuthor>;
      hits = dedupeByOrcid(
        (data.results ?? []).map(toAuthorSearchHit).filter((h): h is AuthorSearchHit => h !== null),
      ).slice(0, AUTHOR_SEARCH_PAGE_SIZE);
    } else {
      logger.warn("author_search.upstream_status", { status: res.status });
    }
  } catch (err) {
    logger.warn("author_search.failed", { err });
  }
  cacheSet(query, hits, now);
  return hits;
}
