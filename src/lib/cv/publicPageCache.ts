/**
 * Tiny in-process cache for fully-rendered PUBLIC CV pages.
 *
 * The /p/[slug] route runs a CPU-heavy citeproc render; without caching, anyone
 * holding a published URL can flood anonymous GETs and pin the single app
 * process (denial of service). We cache the rendered response per slug for a
 * short TTL so repeat anonymous hits are O(1) (no DB read, no Zod parse, no
 * render).
 *
 * Freshness: publish / unpublish / indexing changes call `invalidatePublicPage`
 * for immediate effect; owner edits and the scheduled re-sync reflect within the
 * TTL. The public page is a scheduled "living" page (not real-time), so brief
 * staleness is acceptable and unpublish is never delayed.
 *
 * Single-process only (matches the MVP's single container). A flood spread
 * across many distinct IPs is additionally bounded by the route's per-IP rate
 * limit; this cache neutralises a flood of a single (or few) published slug(s).
 */
export interface PublicPageEntry {
  html: string;
  indexable: boolean;
}

interface CacheRecord extends PublicPageEntry {
  expires: number; // epoch ms
}

const cache = new Map<string, CacheRecord>();
const MAX_ENTRIES = 2000;
const TTL_MS = 60_000; // 1 minute
// Don't cache an unusually large render: a few multi-MB CVs (thousands of items)
// could otherwise pin hundreds of MB of heap in the single app process. Such a
// page still renders fresh on each hit, bounded by the route's per-IP + global
// rate limits — only its in-memory caching is skipped.
const MAX_CACHED_HTML_BYTES = 2_000_000;

// Short negative cache for slugs that resolved to "not found" — so a flood of
// random/invalid slugs (which bypass the render cache) doesn't hit the DB on
// every request. Kept brief so a freshly-published slug appears quickly.
const missCache = new Map<string, number>(); // slug -> expiry epoch ms
const MISS_TTL_MS = 30_000;
const MISS_MAX = 5000;

/** True if this slug recently resolved to "not found" (skip the DB read). */
export function isKnownMiss(slug: string, now: number = Date.now()): boolean {
  const exp = missCache.get(slug);
  if (exp === undefined) return false;
  if (now >= exp) {
    missCache.delete(slug);
    return false;
  }
  return true;
}

/** Record that a slug resolved to "not found" (negative cache). */
export function rememberMiss(slug: string, now: number = Date.now()): void {
  if (missCache.size >= MISS_MAX) {
    for (const [k, exp] of missCache) if (now >= exp) missCache.delete(k);
    if (missCache.size >= MISS_MAX) {
      const oldest = missCache.keys().next().value;
      if (oldest !== undefined) missCache.delete(oldest);
    }
  }
  missCache.set(slug, now + MISS_TTL_MS);
}

/** Return the cached rendered page for a slug, or null on miss/expiry. */
export function getCachedPublicPage(
  slug: string,
  now: number = Date.now(),
): PublicPageEntry | null {
  const rec = cache.get(slug);
  if (!rec) return null;
  if (now >= rec.expires) {
    cache.delete(slug);
    return null;
  }
  return { html: rec.html, indexable: rec.indexable };
}

/** Cache a rendered page for a slug (only ever called for a published 200). */
export function setCachedPublicPage(
  slug: string,
  entry: PublicPageEntry,
  now: number = Date.now(),
): void {
  if (entry.html.length > MAX_CACHED_HTML_BYTES) {
    // Too large to cache safely — drop any stale entry and skip caching this one.
    cache.delete(slug);
    return;
  }
  if (cache.size >= MAX_ENTRIES && !cache.has(slug)) {
    // Prune expired first; if still full, evict the oldest insertion.
    for (const [k, v] of cache) {
      if (now >= v.expires) cache.delete(k);
    }
    if (cache.size >= MAX_ENTRIES) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) cache.delete(oldest);
    }
  }
  cache.set(slug, { html: entry.html, indexable: entry.indexable, expires: now + TTL_MS });
}

/** Drop a slug from the cache — call on any publish/unpublish/index change so
 *  the new state (including 404 after unpublish) takes effect immediately. Also
 *  clears the negative cache so a freshly-published slug appears at once. */
export function invalidatePublicPage(slug: string): void {
  cache.delete(slug);
  missCache.delete(slug);
}

/** Test-only: clear the cache. */
export function __resetPublicPageCache(): void {
  cache.clear();
  missCache.clear();
}
