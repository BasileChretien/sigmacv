import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { termsStrings } from "@/lib/i18n/terms";

describe("termsStrings", () => {
  it("localizes the terms of use and falls back to English", () => {
    expect(termsStrings("en-US").heading).toBe("Terms of Use");
    expect(termsStrings("fr-FR").heading).toBe("Conditions d’utilisation");
    expect(termsStrings("ja-JP").metaTitle).toBe("利用規約");
    expect(termsStrings("xx-XX").heading).toBe(termsStrings("en-US").heading);
  });

  it("has every field non-empty for all 10 locales", () => {
    for (const loc of SUPPORTED_LOCALES) {
      for (const value of Object.values(termsStrings(loc))) {
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("preserves brand/legal proper nouns in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = termsStrings(loc);
      // Identity/legal anchors must survive translation.
      expect(s.service).toContain("Basile Chrétien");
      expect(s.service).toContain("SigmaCV");
      // The IP clause must point at the open-source licence on GitHub.
      expect(s.ip).toContain("GitHub");
      // The auto-generated-data disclaimer must name the upstream sources.
      expect(s.accuracy).toContain("OpenAlex");
      // The contact clause must expose the operator's e-mail verbatim.
      expect(s.contact).toContain("privacy@sigmacv.org");
    }
  });

  it("provides a short footer/nav label for every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      expect(termsStrings(loc).navLabel.length).toBeGreaterThan(0);
    }
  });
});
