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
 *  the new state (including 404 after unpublish) takes effect immediately. */
export function invalidatePublicPage(slug: string): void {
  cache.delete(slug);
}

/** Test-only: clear the cache. */
export function __resetPublicPageCache(): void {
  cache.clear();
}
