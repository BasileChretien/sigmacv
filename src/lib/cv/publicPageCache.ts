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
  /**
   * Precomputed FAIR Signposting `Link` header value for this page. Cached
   * alongside the HTML because the cache-HIT path has no `CanonicalCv` to rebuild
   * it from. Optional only so cache-mechanics tests need not synthesize one — the
   * public route always populates it on the render path.
   */
  signposting?: string;
}

interface CacheRecord extends PublicPageEntry {
  expires: number; // epoch ms
}

const cache = new Map<string, CacheRecord>();
const MAX_ENTRIES = 2000;
const TTL_MS = 60_000; // 1 minute
// Total in-memory budget for cached rendered HTML. Bounds the heap the cache can
// hold regardless of individual entry sizes — so a few multi-MB CV renders can't
// pin gigabytes — WHILE still caching large/expensive renders so repeat anonymous
// hits stay O(1) (the main DoS defence for the public page: an expensive render
// is paid at most once per TTL, not on every hit).
const MAX_TOTAL_BYTES = 256_000_000;

/** Sum of cached HTML lengths (chars). */
function cachedHtmlBytes(): number {
  let total = 0;
  for (const rec of cache.values()) total += rec.html.length;
  return total;
}

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
  return { html: rec.html, indexable: rec.indexable, signposting: rec.signposting };
}

/** Cache a rendered page for a slug (only ever called for a published 200). */
export function setCachedPublicPage(
  slug: string,
  entry: PublicPageEntry,
  now: number = Date.now(),
): void {
  cache.set(slug, {
    html: entry.html,
    indexable: entry.indexable,
    signposting: entry.signposting,
    expires: now + TTL_MS,
  });
  // Evict oldest insertions until within BOTH the entry-count and total-byte
  // budgets, so large/expensive renders stay cached without letting a few
  // multi-MB CVs pin unbounded heap.
  let total = cachedHtmlBytes();
  while (cache.size > MAX_ENTRIES || total > MAX_TOTAL_BYTES) {
    const oldest = cache.keys().next().value;
    /* v8 ignore next -- defensive: never evict the just-set entry / empty map */
    if (oldest === undefined || oldest === slug) break;
    total -= cache.get(oldest)!.html.length;
    cache.delete(oldest);
  }
}

/**
 * In-flight renders, keyed by slug. Coalesces concurrent anonymous hits on the
 * SAME uncached slug so an expensive citeproc render runs once, not once per
 * request — without this, N concurrent requests that all miss the cache before
 * the first finishes would each run the full (event-loop-blocking) render.
 */
const inFlightRenders = new Map<string, Promise<PublicPageEntry>>();

/**
 * Run `render` for `slug` unless one is already in flight, in which case await
 * the existing one and return its result. The in-flight entry clears when the
 * render settles (success or failure), so a later request renders fresh.
 */
export function dedupePublicRender(
  slug: string,
  render: () => Promise<PublicPageEntry>,
): Promise<PublicPageEntry> {
  const existing = inFlightRenders.get(slug);
  if (existing) return existing;
  const p = (async () => {
    try {
      return await render();
    } finally {
      inFlightRenders.delete(slug);
    }
  })();
  inFlightRenders.set(slug, p);
  return p;
}

// ─── OG social-card image cache ──────────────────────────────────────────────
// The per-CV OG card is rendered to a PNG by a CPU-heavy rasterizer (Satori →
// Resvg). Without a server cache, a flood of `/p/<slug>/og` hits (social-unfurl
// scrapers or a synthetic flood) spends the shared public rate-limit budget on
// image renders and starves the HTML page. Cache the PNG bytes per slug for a
// short TTL (matching the client `max-age`) and single-flight concurrent renders.

export interface OgImageEntry {
  bytes: Uint8Array;
  indexable: boolean;
}

interface OgRecord extends OgImageEntry {
  expires: number;
}

const ogCache = new Map<string, OgRecord>();
const OG_TTL_MS = 300_000; // 5 minutes — matches the route's Cache-Control max-age
const OG_MAX_ENTRIES = 1000;
const OG_MAX_TOTAL_BYTES = 64_000_000; // OG PNGs are ~50–150 KB; bound the store
const ogInFlight = new Map<string, Promise<OgImageEntry>>();

/** Cached OG PNG for a slug, or null on miss/expiry. */
export function getCachedOgImage(slug: string, now: number = Date.now()): OgImageEntry | null {
  const rec = ogCache.get(slug);
  if (!rec) return null;
  if (now >= rec.expires) {
    ogCache.delete(slug);
    return null;
  }
  return { bytes: rec.bytes, indexable: rec.indexable };
}

/** Cache an OG PNG for a slug, bounded by entry count + total bytes. */
export function setCachedOgImage(
  slug: string,
  entry: OgImageEntry,
  now: number = Date.now(),
): void {
  ogCache.set(slug, { bytes: entry.bytes, indexable: entry.indexable, expires: now + OG_TTL_MS });
  let total = 0;
  for (const r of ogCache.values()) total += r.bytes.length;
  while (ogCache.size > OG_MAX_ENTRIES || total > OG_MAX_TOTAL_BYTES) {
    const oldest = ogCache.keys().next().value;
    /* v8 ignore next -- defensive: never evict the just-set entry / empty map */
    if (oldest === undefined || oldest === slug) break;
    total -= ogCache.get(oldest)!.bytes.length;
    ogCache.delete(oldest);
  }
}

/** Single-flight the (CPU-heavy) OG render for a slug, like dedupePublicRender. */
export function dedupeOgImage(
  slug: string,
  render: () => Promise<OgImageEntry>,
): Promise<OgImageEntry> {
  const existing = ogInFlight.get(slug);
  if (existing) return existing;
  const p = (async () => {
    try {
      return await render();
    } finally {
      ogInFlight.delete(slug);
    }
  })();
  ogInFlight.set(slug, p);
  return p;
}

/** Drop a slug from the cache — call on any publish/unpublish/index change so
 *  the new state (including 404 after unpublish) takes effect immediately. Also
 *  clears the negative cache so a freshly-published slug appears at once. */
export function invalidatePublicPage(slug: string): void {
  cache.delete(slug);
  missCache.delete(slug);
  ogCache.delete(slug);
}

/** Test-only: clear the cache. */
export function __resetPublicPageCache(): void {
  cache.clear();
  missCache.clear();
  ogCache.clear();
  ogInFlight.clear();
}
