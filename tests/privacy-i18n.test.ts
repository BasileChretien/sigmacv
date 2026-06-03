import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { privacyStrings } from "@/lib/i18n/privacy";

describe("privacyStrings", () => {
  it("localizes the privacy notice and falls back to English", () => {
    expect(privacyStrings("en-US").heading).toBe("Privacy & Data Protection");
    expect(privacyStrings("fr-FR").heading).toBe(
      "Confidentialité et protection des données",
    );
    expect(privacyStrings("ja-JP").metaTitle).toBe("プライバシー");
    expect(privacyStrings("xx-XX").heading).toBe(privacyStrings("en-US").heading);
  });

  it("has every field non-empty for all 10 locales", () => {
    for (const loc of SUPPORTED_LOCALES) {
      for (const value of Object.values(privacyStrings(loc))) {
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("preserves brand/legal proper nouns in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = privacyStrings(loc);
      // Identity/legal anchors must survive translation.
      expect(s.controller).toContain("Basile Chrétien");
      expect(s.intro).toContain("GDPR");
      expect(s.intro).toContain("APPI");
      expect(s.data).toContain("OpenAlex");
      // The opt-in research clause must cite the consent legal basis.
      expect(s.research).toContain("Art. 6(1)(a)");
    }
  });
});
