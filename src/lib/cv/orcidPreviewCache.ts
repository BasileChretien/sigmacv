/**
 * Tiny in-process cache for the anonymous no-login ORCID preview.
 *
 * The /preview/[orcid] route builds a CV from ~20 upstream sources and runs a
 * CPU-heavy citeproc render. Without caching, anyone could flood the route with a
 * single ORCID and both hammer OpenAlex (breaking the polite-pool contract) and
 * pin the single app process. We cache the rendered preview per NORMALIZED ORCID
 * for a short TTL so repeat anonymous hits are O(1), single-flight concurrent
 * builds of the same ORCID, and negatively cache ORCIDs with no public record so
 * a flood of unknown ids doesn't re-fetch every time.
 *
 * Single-process only (matches the single-container deploy); a flood spread
 * across many ORCIDs is additionally bounded by the route's per-IP + global rate
 * limits. Public data only — nothing here is ever persisted.
 */
import { normalizeOrcid } from "@/lib/openalex/types";
import type { CanonicalCv } from "@/lib/canonical/schema";

export interface OrcidPreviewEntry {
  html: string;
  name: string;
  /** The built canonical object — handed to the no-login interactive editor. */
  cv: CanonicalCv;
  /** Per-source item counts from the build, for the provenance panel. */
  sourceCounts?: Record<string, number>;
}

interface CacheRecord extends OrcidPreviewEntry {
  expires: number; // epoch ms
}

const cache = new Map<string, CacheRecord>();
const MAX_ENTRIES = 500;
// Public research records change slowly, so a longer TTL than the owner's living
// page (1 min) is fine and further blunts repeat OpenAlex fetches for a shared
// preview link.
const TTL_MS = 10 * 60_000; // 10 minutes
// Bounds the heap the cache can hold regardless of individual render sizes.
const MAX_TOTAL_BYTES = 128_000_000;

/** Sum of cached HTML lengths (chars). */
function cachedHtmlBytes(): number {
  let total = 0;
  for (const rec of cache.values()) total += rec.html.length;
  return total;
}

// Negative cache: ORCIDs that resolved to no public record. A valid-format but
// unknown ORCID won't gain a record imminently, so this TTL is longer than the
// positive one — a flood of random valid-looking ids can't re-fetch every source.
const missCache = new Map<string, number>(); // orcid -> expiry epoch ms
const MISS_TTL_MS = 5 * 60_000;
const MISS_MAX = 2000;

/** True if this ORCID recently resolved to "no public record" (skip the rebuild). */
export function isKnownEmptyPreview(orcid: string, now: number = Date.now()): boolean {
  const exp = missCache.get(orcid);
  if (exp === undefined) return false;
  if (now >= exp) {
    missCache.delete(orcid);
    return false;
  }
  return true;
}

/** Record that an ORCID resolved to "no public record" (negative cache). */
export function rememberEmptyPreview(
  orcid: string,
  now: number = Date.now(),
  /** Same staleness check as {@link setCachedOrcidPreview}: a researcher who
   *  registered mid-build must not be remembered as having no public record. */
  epoch?: number,
): void {
  if (epoch !== undefined && epoch !== orcidPreviewEpoch(orcid)) return;
  if (missCache.size >= MISS_MAX) {
    for (const [k, exp] of missCache) if (now >= exp) missCache.delete(k);
    if (missCache.size >= MISS_MAX) {
      const oldest = missCache.keys().next().value;
      if (oldest !== undefined) missCache.delete(oldest);
    }
  }
  missCache.set(orcid, now + MISS_TTL_MS);
}

/** Return the cached rendered preview for an ORCID, or null on miss/expiry. */
export function getCachedOrcidPreview(
  orcid: string,
  now: number = Date.now(),
): OrcidPreviewEntry | null {
  const rec = cache.get(orcid);
  if (!rec) return null;
  if (now >= rec.expires) {
    cache.delete(orcid);
    return null;
  }
  return { html: rec.html, name: rec.name, cv: rec.cv, sourceCounts: rec.sourceCounts };
}

/** Cache a rendered preview for an ORCID, bounded by entry count + total bytes. */
export function setCachedOrcidPreview(
  orcid: string,
  entry: OrcidPreviewEntry,
  now: number = Date.now(),
  /** The epoch the build started with. When it has moved on, the result is stale
   *  (the owner corrected something mid-build) and is DROPPED rather than cached.
   *  Omitted ⇒ no staleness check, for callers that did not begin a build. */
  epoch?: number,
): void {
  if (epoch !== undefined && epoch !== orcidPreviewEpoch(orcid)) return;
  cache.set(orcid, {
    html: entry.html,
    name: entry.name,
    cv: entry.cv,
    sourceCounts: entry.sourceCounts,
    expires: now + TTL_MS,
  });
  let total = cachedHtmlBytes();
  while (cache.size > MAX_ENTRIES || total > MAX_TOTAL_BYTES) {
    const oldest = cache.keys().next().value;
    /* v8 ignore next -- defensive: never evict the just-set entry / empty map */
    if (oldest === undefined || oldest === orcid) break;
    total -= cache.get(oldest)!.html.length;
    cache.delete(oldest);
  }
}

/**
 * Build generation per ORCID. Bumped on every invalidation.
 *
 * Without it an invalidation that lands DURING a build is silently lost: the
 * build started before the correction, finishes after it, and writes its stale
 * result into the cache we had just cleared — so the correction would not appear
 * for a further full TTL, which is worse than not invalidating at all. A writer
 * passes the epoch it started with and the write is dropped if it has moved.
 *
 * Unbounded growth is not a concern: the map is trimmed alongside the cache.
 */
const epochs = new Map<string, number>();

/** The current build generation for an ORCID; pass it back to {@link setCachedOrcidPreview}. */
export function orcidPreviewEpoch(orcid: string): number {
  const key = normalizeOrcid(orcid);
  return key ? (epochs.get(key) ?? 0) : 0;
}

/**
 * Drop any cached preview for an ORCID, so the next visitor triggers a rebuild.
 *
 * Called when the owner saves their CV. The preview applies the researcher's own
 * disambiguation corrections (see `fetchOwnerCorrections`), so without this a
 * correction they just made would not reach a visitor until the TTL expired —
 * they would mark a namesake's paper "not mine" and still see it on their own
 * public preview.
 *
 * Also clears the negative cache: a researcher whose iD had no public record
 * when it was last looked up may have one now.
 *
 * Returns whether anything was actually removed, which the tests assert on.
 */
export function invalidateOrcidPreview(orcid: string): boolean {
  const key = normalizeOrcid(orcid);
  if (!key) return false;
  const had = cache.delete(key);
  const hadMiss = missCache.delete(key);
  // Invalidate any build already in flight: it read the pre-correction state, so
  // its result must not land in the cache we are clearing.
  epochs.set(key, (epochs.get(key) ?? 0) + 1);
  return had || hadMiss;
}

/**
 * In-flight builds, keyed by ORCID. Coalesces concurrent anonymous hits on the
 * SAME uncached ORCID so the expensive (20-source fetch + citeproc) build runs
 * once, not once per request. The entry clears when the build settles (success
 * or failure), so a later request builds fresh.
 */
const inFlight = new Map<string, Promise<unknown>>();

/** Single-flight `run` for `orcid`; concurrent callers share one build. */
export function dedupeOrcidPreview<T>(orcid: string, run: () => Promise<T>): Promise<T> {
  const existing = inFlight.get(orcid) as Promise<T> | undefined;
  if (existing) return existing;
  const p = (async () => {
    try {
      return await run();
    } finally {
      inFlight.delete(orcid);
    }
  })();
  inFlight.set(orcid, p);
  return p;
}

/** Test-only: clear every cache. */
export function __resetOrcidPreviewCache(): void {
  cache.clear();
  missCache.clear();
  epochs.clear();
  inFlight.clear();
}
