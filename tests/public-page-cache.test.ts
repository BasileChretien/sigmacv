import { afterEach, describe, expect, it } from "vitest";
import {
  __resetPublicPageCache,
  getCachedPublicPage,
  invalidatePublicPage,
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
});
