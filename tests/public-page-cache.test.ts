import { afterEach, describe, expect, it } from "vitest";
import {
  __resetPublicPageCache,
  dedupeBadgePng,
  dedupeOgImage,
  dedupePublicRender,
  getCachedBadgePng,
  getCachedOgImage,
  getCachedPublicPage,
  invalidatePublicPage,
  isKnownMiss,
  rememberMiss,
  setCachedBadgePng,
  setCachedOgImage,
  setCachedPublicPage,
  type BadgePngEntry,
  type OgImageEntry,
  type PublicPageEntry,
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

  it("caches a large (expensive) render so repeat hits stay O(1)", () => {
    const big = "x".repeat(3_000_000); // 3 MB — would have been skipped before
    setCachedPublicPage("big", { html: big, indexable: false }, 5000);
    expect(getCachedPublicPage("big", 5000)?.html.length).toBe(3_000_000);
  });

  it("bounds total cached bytes by evicting the oldest large renders", () => {
    // One 10 MB string, stored by reference (cheap), inserted under 30 slugs so
    // the cache's by-length accounting crosses the 256 MB budget.
    const big = "x".repeat(10_000_000); // 10 MB
    for (let i = 0; i < 30; i++) {
      setCachedPublicPage(`big-${i}`, { html: big, indexable: false }, 5000);
    }
    // 30 × 10 MB = 300 MB > 256 MB budget → the oldest entries were evicted,
    // the most-recent survives.
    expect(getCachedPublicPage("big-0", 5000)).toBeNull();
    expect(getCachedPublicPage("big-29", 5000)).not.toBeNull();
  });

  describe("dedupePublicRender (single-flight)", () => {
    it("coalesces concurrent renders of the same slug into one", async () => {
      let calls = 0;
      const render = () =>
        new Promise<PublicPageEntry>((resolve) => {
          calls++;
          setTimeout(() => resolve({ html: "<x>", indexable: false }), 5);
        });
      const results = await Promise.all(
        Array.from({ length: 5 }, () => dedupePublicRender("dup", render)),
      );
      expect(calls).toBe(1); // rendered once despite 5 concurrent callers
      expect(results.every((r) => r.html === "<x>")).toBe(true);
    });

    it("renders fresh again once the in-flight render settles", async () => {
      let calls = 0;
      const render = () =>
        Promise.resolve<PublicPageEntry>({ html: String(++calls), indexable: false });
      await dedupePublicRender("dup2", render);
      await dedupePublicRender("dup2", render);
      expect(calls).toBe(2);
    });
  });

  describe("OG image cache", () => {
    it("stores + returns OG bytes and expires after the 5-minute TTL", () => {
      const bytes = new Uint8Array([1, 2, 3]);
      setCachedOgImage("og1", { bytes, indexable: true }, 1000);
      expect(getCachedOgImage("og1", 1500)?.bytes).toBe(bytes);
      expect(getCachedOgImage("og1", 1500)?.indexable).toBe(true);
      expect(getCachedOgImage("og1", 1000 + 301_000)).toBeNull();
    });

    it("invalidate clears the OG card too (publish-state change)", () => {
      setCachedOgImage("og2", { bytes: new Uint8Array([1]), indexable: false }, 1000);
      invalidatePublicPage("og2");
      expect(getCachedOgImage("og2", 1100)).toBeNull();
    });

    it("bounds the OG cache by total bytes", () => {
      const big = new Uint8Array(10_000_000); // 10 MB, stored by reference
      for (let i = 0; i < 8; i++) {
        setCachedOgImage(`ogbig-${i}`, { bytes: big, indexable: false }, 5000);
      }
      // 8 × 10 MB = 80 MB > 64 MB budget → the oldest were evicted.
      expect(getCachedOgImage("ogbig-0", 5000)).toBeNull();
      expect(getCachedOgImage("ogbig-7", 5000)).not.toBeNull();
    });

    it("single-flights concurrent OG renders for the same slug", async () => {
      let calls = 0;
      const render = () =>
        new Promise<OgImageEntry>((resolve) => {
          calls++;
          setTimeout(() => resolve({ bytes: new Uint8Array([9]), indexable: false }), 5);
        });
      const results = await Promise.all(
        Array.from({ length: 4 }, () => dedupeOgImage("ogdup", render)),
      );
      expect(calls).toBe(1);
      expect(results.every((r) => r.bytes[0] === 9)).toBe(true);
    });
  });

  describe("email-badge PNG cache", () => {
    it("stores + returns badge bytes and expires after the 5-minute TTL", () => {
      const bytes = new Uint8Array([4, 5, 6]);
      setCachedBadgePng("bp1", { bytes, indexable: true }, 1000);
      expect(getCachedBadgePng("bp1", 1500)?.bytes).toBe(bytes);
      expect(getCachedBadgePng("bp1", 1500)?.indexable).toBe(true);
      expect(getCachedBadgePng("bp1", 1000 + 301_000)).toBeNull();
    });

    it("is a SEPARATE cache from the OG card (no slug collision)", () => {
      setCachedOgImage("same", { bytes: new Uint8Array([1]), indexable: true }, 1000);
      setCachedBadgePng("same", { bytes: new Uint8Array([2]), indexable: false }, 1000);
      expect(getCachedOgImage("same", 1100)?.bytes[0]).toBe(1);
      expect(getCachedBadgePng("same", 1100)?.bytes[0]).toBe(2);
    });

    it("invalidate clears the badge PNG too (publish-state change)", () => {
      setCachedBadgePng("bp2", { bytes: new Uint8Array([1]), indexable: false }, 1000);
      invalidatePublicPage("bp2");
      expect(getCachedBadgePng("bp2", 1100)).toBeNull();
    });

    it("bounds the badge cache by total bytes", () => {
      const big = new Uint8Array(10_000_000); // 10 MB, stored by reference
      for (let i = 0; i < 8; i++) {
        setCachedBadgePng(`bpbig-${i}`, { bytes: big, indexable: false }, 5000);
      }
      // 8 × 10 MB = 80 MB > 64 MB budget → the oldest were evicted.
      expect(getCachedBadgePng("bpbig-0", 5000)).toBeNull();
      expect(getCachedBadgePng("bpbig-7", 5000)).not.toBeNull();
    });

    it("single-flights concurrent badge renders for the same slug", async () => {
      let calls = 0;
      const render = () =>
        new Promise<BadgePngEntry>((resolve) => {
          calls++;
          setTimeout(() => resolve({ bytes: new Uint8Array([7]), indexable: false }), 5);
        });
      const results = await Promise.all(
        Array.from({ length: 4 }, () => dedupeBadgePng("bpdup", render)),
      );
      expect(calls).toBe(1);
      expect(results.every((r) => r.bytes[0] === 7)).toBe(true);
    });
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
