import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { siteFooterLinks, siteHeaderLinks } from "@/lib/siteNav";

describe("siteNav — shared header/footer link sets", () => {
  it("builds the compact header links (Guides, Examples, About) for en-US", () => {
    const links = siteHeaderLinks("en-US");
    expect(links.map((l) => l.href)).toEqual(["/guides", "/examples", "/about"]);
    // Labels come from i18n — assert they're non-empty rather than pinning copy.
    expect(links.every((l) => l.label.length > 0)).toBe(true);
  });

  it("builds the full footer link set (10 destinations) for en-US", () => {
    const links = siteFooterLinks("en-US");
    expect(links).toHaveLength(10);
    expect(links.map((l) => l.href)).toEqual([
      "/privacy",
      "/contact",
      "/faq",
      "/guides",
      "/glossary",
      "/examples",
      "/principles",
      "/fair",
      "/transparency",
      "/accessibility",
    ]);
  });

  it("localizes hrefs for a non-default locale (examples stays English-only)", () => {
    const header = siteHeaderLinks("fr-FR");
    expect(header.map((l) => l.href)).toEqual(["/fr/guides", "/examples", "/fr/about"]);

    const footer = siteFooterLinks("fr-FR");
    expect(footer.find((l) => l.label.length === 0)).toBeUndefined();
    // Localized destinations gain the /fr prefix; /examples is not localized.
    expect(footer.map((l) => l.href)).toContain("/fr/privacy");
    expect(footer.map((l) => l.href)).toContain("/examples");
  });

  it("produces a stable, fully-populated set for every supported locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const header = siteHeaderLinks(loc);
      const footer = siteFooterLinks(loc);
      expect(header).toHaveLength(3);
      expect(footer).toHaveLength(10);
      expect(
        [...header, ...footer].every((l) => l.label.length > 0 && l.href.startsWith("/")),
      ).toBe(true);
    }
  });
});
