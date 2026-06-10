import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { fairCvStrings } from "@/lib/i18n/fairCv";

describe("fairCvStrings", () => {
  it("localizes the FAIR-for-your-CV page and falls back to English", () => {
    expect(fairCvStrings("en-US").heading).toBe("FAIR for your CV");
    expect(fairCvStrings("fr-FR").heading).toBe("FAIR pour votre CV");
    expect(fairCvStrings("ja-JP").metaTitle).toBe("あなたの履歴書を FAIR に");
    expect(fairCvStrings("xx-XX").heading).toBe(fairCvStrings("en-US").heading);
  });

  it("has every field non-empty for all 10 locales", () => {
    for (const loc of SUPPORTED_LOCALES) {
      for (const value of Object.values(fairCvStrings(loc))) {
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps FAIR + ORCID present in the intro/cite of every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      expect(fairCvStrings(loc).intro).toContain("FAIR");
      expect(fairCvStrings(loc).cite).toContain("ORCID");
    }
  });
});
