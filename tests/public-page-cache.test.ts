import { afterEach, describe, expect, it } from "vitest";
import {
  __resetPublicPageCache,
  getCachedPublicPage,
  invalidatePublicPage,
  isKnownMiss,
  rememberMiss,
  setCachedPublicPage,
} from "@/lib/cv/publicPageCache";

afterEach(() => __resetPublicPageCache());

describe("publicPageCache", () => {
  it("returns null on a miss and the entry on a hit", () => {
    expect(getCachedPublicPage("s1", 1000)).toBeNull();
    setCachedPublicPage("s1", { html: "<x>", indexable: true }, 1000);
    expect(getCachedPublicPage("s1", 1500)).toEqual({ html: "<x>", indexable: true });
  });

  it("expires entries after the TTL", () => {
    setCachedPublicPage("s1", { html: "<x>", indexable: false }, 1000);
    // TTL is 60s; just before vs. just after.
    expect(getCachedPublicPage("s1", 1000 + 59_000)).not.toBeNull();
    expect(getCachedPublicPage("s1", 1000 + 61_000)).toBeNull();
  });

  it("invalidate drops a slug immediately (e.g. unpublish)", () => {
    setCachedPublicPage("s1", { html: "<x>", indexable: false }, 1000);
    invalidatePublicPage("s1");
    expect(getCachedPublicPage("s1", 1100)).toBeNull();
  });

  it("evicts under pressure without unbounded growth", () => {
    // Fill well past the cap with non-expired entries at the same timestamp.
    for (let i = 0; i < 2100; i++) {
      setCachedPublicPage(`slug-${i}`, { html: String(i), indexable: false }, 5000);
    }
    // The most recent insert is present; the cache did not grow without bound.
    expect(getCachedPublicPage("slug-2099", 5000)).not.toBeNull();
  });

  it("skips caching an unusually large render (heap-pressure guard)", () => {
    const huge = "<p>".repeat(800_000); // > 2 MB
    setCachedPublicPage("big", { html: huge, indexable: false }, 5000);
    // Not cached — it still renders fresh each hit, but can't pin heap.
    expect(getCachedPublicPage("big", 5000)).toBeNull();
    // A normal-sized render still caches.
    setCachedPublicPage("small", { html: "<p>ok</p>", indexable: false }, 5000);
    expect(getCachedPublicPage("small", 5000)).not.toBeNull();
  });

  describe("negative cache (unknown slugs)", () => {
    it("remembers a miss, then expires it after the TTL", () => {
      expect(isKnownMiss("ghost", 1000)).toBe(false);
      rememberMiss("ghost", 1000);
      expect(isKnownMiss("ghost", 1000 + 29_000)).toBe(true);
      expect(isKnownMiss("ghost", 1000 + 31_000)).toBe(false); // 30s TTL elapsed
    });

    it("invalidate clears the miss so a freshly-published slug appears at once", () => {
      rememberMiss("soon", 1000);
      invalidatePublicPage("soon");
      expect(isKnownMiss("soon", 1100)).toBe(false);
    });

    it("bounds the miss cache under pressure", () => {
      for (let i = 0; i < 5200; i++) rememberMiss(`m-${i}`, 5000);
      expect(isKnownMiss("m-5199", 5000)).toBe(true);
    });
  });
});
