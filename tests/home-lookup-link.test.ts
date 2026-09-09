import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { landingStrings } from "@/lib/i18n/landing";
import { searchStrings } from "@/lib/i18n/search";

/**
 * The homepage's entry to the lookup: one quiet line under the sign-in card's
 * preview form, linking the locale's /search. It must never compete with the
 * sign-in call to action, and its wording must exist in every locale.
 */
describe("homepage lookup entry", () => {
  it("links the localized /search from under the preview form, and nowhere near the hero", () => {
    const src = readFileSync("src/components/Landing.tsx", "utf8");
    const form = src.indexOf("<OrcidPreviewForm locale={loc} />");
    const link = src.indexOf('data-testid="home-lookup-link"');
    expect(form).toBeGreaterThan(-1);
    expect(link).toBeGreaterThan(form);
    expect(src.slice(link - 200, link + 200)).toContain("localeSearchPath(loc)");
    // Not in the hero: the hero title renders well before the sign-in card.
    expect(link).toBeGreaterThan(src.indexOf("heroTitle"));
  });

  it("has a lookup line in every locale that names neither a score nor a metric", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const line = landingStrings(loc).lookupLink;
      expect(line.length, loc).toBeGreaterThan(0);
      expect(line, loc).not.toMatch(
        /h-index|score|rank|citation|引用|Zitation|citações|citazioni|인용|цитир/i,
      );
      // The lookup page itself exists for the locale (its copy is non-empty).
      expect(searchStrings(loc).heading.length, loc).toBeGreaterThan(0);
    }
  });
});
