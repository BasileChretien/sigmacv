import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { aboutStrings } from "@/lib/i18n/about";

describe("aboutStrings", () => {
  it("localizes the About page and falls back to English", () => {
    expect(aboutStrings("en-US").heading).toBe("About SigmaCV");
    expect(aboutStrings("fr-FR").heading).toBe("À propos de SigmaCV");
    expect(aboutStrings("ja-JP").metaTitle).toBe(
      "概要 — 無料・オープンソースの学術 CV ジェネレーター",
    );
    expect(aboutStrings("xx-XX").heading).toBe(aboutStrings("en-US").heading);
  });

  it("has every field non-empty for all 10 locales", () => {
    for (const loc of SUPPORTED_LOCALES) {
      for (const value of Object.values(aboutStrings(loc))) {
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps brand/proper nouns in every locale's intro", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const intro = aboutStrings(loc).intro;
      expect(intro).toContain("OpenAlex");
      expect(intro).toContain("Apache-2.0");
    }
  });
});
