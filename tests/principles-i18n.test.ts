import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { principlesStrings } from "@/lib/i18n/principles";

describe("principlesStrings", () => {
  it("localizes the Standards & principles page and falls back to English", () => {
    expect(principlesStrings("en-US").heading).toBe("Standards & principles we align with");
    expect(principlesStrings("fr-FR").heading).toBe("Normes et principes que nous suivons");
    expect(principlesStrings("ja-JP").metaTitle).toBe("基準と原則");
    expect(principlesStrings("xx-XX").heading).toBe(principlesStrings("en-US").heading);
  });

  it("has every field non-empty for all 10 locales", () => {
    for (const loc of SUPPORTED_LOCALES) {
      for (const value of Object.values(principlesStrings(loc))) {
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("references FAIR4RS in every locale's FAIR line (software is FAIR too)", () => {
    for (const loc of SUPPORTED_LOCALES) {
      expect(principlesStrings(loc).fair).toContain("FAIR4RS");
    }
  });
});
