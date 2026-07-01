import { afterEach, describe, expect, it } from "vitest";
import type { CanonicalCv } from "@/lib/canonical/schema";
import {
  __resetOrcidPreviewCache,
  dedupeOrcidPreview,
  getCachedOrcidPreview,
  isKnownEmptyPreview,
  rememberEmptyPreview,
  setCachedOrcidPreview,
  type OrcidPreviewEntry,
} from "@/lib/cv/orcidPreviewCache";

afterEach(() => __resetOrcidPreviewCache());

const ORCID = "0000-0002-7483-2489";
// The cache stores the built CV opaquely (it's handed to the client editor); its
// shape doesn't matter to the cache mechanics under test, so a stub is fine.
const CV = {} as CanonicalCv;
const entry = (html: string, name: string): OrcidPreviewEntry => ({ html, name, cv: CV });

describe("orcidPreviewCache — positive cache", () => {
  it("returns null on a miss and the entry on a hit", () => {
    expect(getCachedOrcidPreview(ORCID, 1000)).toBeNull();
    setCachedOrcidPreview(ORCID, entry("<x>", "A"), 1000);
    expect(getCachedOrcidPreview(ORCID, 1500)).toEqual(entry("<x>", "A"));
  });

  it("expires entries after the 10-minute TTL", () => {
    setCachedOrcidPreview(ORCID, entry("<x>", "A"), 1000);
    expect(getCachedOrcidPreview(ORCID, 1000 + 9 * 60_000)).not.toBeNull();
    expect(getCachedOrcidPreview(ORCID, 1000 + 11 * 60_000)).toBeNull();
  });

  it("evicts by entry count without unbounded growth", () => {
    // Fill well past the 500-entry cap at one timestamp.
    for (let i = 0; i < 520; i++) {
      setCachedOrcidPreview(`id-${i}`, entry(String(i), "n"), 5000);
    }
    expect(getCachedOrcidPreview("id-519", 5000)).not.toBeNull();
    expect(getCachedOrcidPreview("id-0", 5000)).toBeNull(); // oldest evicted
  });

  it("bounds total cached bytes by evicting the oldest renders", () => {
    // One 10 MB string stored by reference under 14 keys → 140 MB > 128 MB budget.
    const big = "x".repeat(10_000_000);
    for (let i = 0; i < 14; i++) {
      setCachedOrcidPreview(`big-${i}`, entry(big, "n"), 5000);
    }
    expect(getCachedOrcidPreview("big-0", 5000)).toBeNull();
    expect(getCachedOrcidPreview("big-13", 5000)).not.toBeNull();
  });
});

describe("orcidPreviewCache — negative cache", () => {
  it("remembers then forgets an empty ORCID after the miss TTL", () => {
    expect(isKnownEmptyPreview(ORCID, 1000)).toBe(false);
    rememberEmptyPreview(ORCID, 1000);
    expect(isKnownEmptyPreview(ORCID, 1000 + 4 * 60_000)).toBe(true);
    // MISS_TTL is 5 min → gone just after.
    expect(isKnownEmptyPreview(ORCID, 1000 + 6 * 60_000)).toBe(false);
  });

  it("evicts stale then oldest misses when the negative cache is full", () => {
    // 2000 non-expired misses at t=1000, then one more at t=1000 forces the
    // "still full after pruning" → drop-oldest path.
    for (let i = 0; i < 2000; i++) rememberEmptyPreview(`m-${i}`, 1000);
    rememberEmptyPreview("m-new", 1000);
    expect(isKnownEmptyPreview("m-new", 1000)).toBe(true);
    // Refilling much later prunes the now-expired entries (the `now >= exp` branch).
    rememberEmptyPreview("m-late", 1_000_000);
    expect(isKnownEmptyPreview("m-late", 1_000_000)).toBe(true);
  });
});

describe("dedupeOrcidPreview (single-flight)", () => {
  it("coalesces concurrent builds of the same ORCID into one", async () => {
    let calls = 0;
    const run = () =>
      new Promise<OrcidPreviewEntry>((resolve) => {
        calls++;
        setTimeout(() => resolve(entry("<x>", "A")), 5);
      });
    const results = await Promise.all(
      Array.from({ length: 5 }, () => dedupeOrcidPreview(ORCID, run)),
    );
    expect(calls).toBe(1);
    expect(results.every((r) => r.html === "<x>")).toBe(true);
  });

  it("runs fresh again once the in-flight build settles", async () => {
    let calls = 0;
    const run = () => Promise.resolve<OrcidPreviewEntry>(entry(String(++calls), "A"));
    await dedupeOrcidPreview("dup2", run);
    await dedupeOrcidPreview("dup2", run);
    expect(calls).toBe(2);
  });
});
