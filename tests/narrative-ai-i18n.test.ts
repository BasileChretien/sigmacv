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

  it("names the EU processor in the point-of-use consent for every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      expect(narrativeAiStrings(loc).consent).toContain("Mistral AI");
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(narrativeAiStrings("xx-XX").disclaimer).toBe(narrativeAiStrings("en-US").disclaimer);
    expect(narrativeAiStrings("en-US").disclaimer).toBe("AI draft — verify and rewrite");
  });
});
