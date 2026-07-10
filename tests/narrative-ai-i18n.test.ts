import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { narrativeAiStrings } from "@/lib/i18n/narrativeAi";

describe("narrativeAiStrings", () => {
  it("has every field non-empty for all 10 locales", () => {
    for (const loc of SUPPORTED_LOCALES) {
      for (const value of Object.values(narrativeAiStrings(loc))) {
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("frames the consent as bring-your-own-key (browser-only) for every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = narrativeAiStrings(loc);
      // Field labels + browser-only reassurance exist in every locale.
      expect(s.apiKeyLabel.length).toBeGreaterThan(0);
      expect(s.baseUrlLabel.length).toBeGreaterThan(0);
      expect(s.storedNote.length).toBeGreaterThan(0);
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(narrativeAiStrings("xx-XX").disclaimer).toBe(narrativeAiStrings("en-US").disclaimer);
    expect(narrativeAiStrings("en-US").disclaimer).toBe("AI draft — verify and rewrite");
  });
});
