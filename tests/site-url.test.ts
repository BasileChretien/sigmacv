import { describe, expect, it } from "vitest";
import { absoluteUrl, resolveSiteUrl, SITE_URL } from "@/lib/siteUrl";

describe("resolveSiteUrl", () => {
  it("uses the provided origin and strips trailing slashes", () => {
    expect(resolveSiteUrl("https://example.org")).toBe("https://example.org");
    expect(resolveSiteUrl("https://example.org/")).toBe("https://example.org");
    expect(resolveSiteUrl("https://example.org///")).toBe("https://example.org");
  });
  it("falls back to the placeholder for empty / whitespace / undefined", () => {
    expect(resolveSiteUrl("")).toBe("https://sigmacv.org");
    expect(resolveSiteUrl("   ")).toBe("https://sigmacv.org");
    expect(resolveSiteUrl(undefined)).toBe("https://sigmacv.org");
  });
});

describe("absoluteUrl", () => {
  it("joins paths against the resolved origin", () => {
    expect(absoluteUrl("/")).toBe(`${SITE_URL}/`);
    expect(absoluteUrl()).toBe(`${SITE_URL}/`);
    expect(absoluteUrl("about")).toBe(`${SITE_URL}/about`);
    expect(absoluteUrl("/fr")).toBe(`${SITE_URL}/fr`);
    expect(absoluteUrl("sitemap.xml")).toBe(`${SITE_URL}/sitemap.xml`);
  });
});
