import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { landingStrings } from "@/lib/i18n/landing";

describe("landingStrings", () => {
  it("localizes the landing copy and falls back to English", () => {
    expect(landingStrings("en-US").signInOrcid).toBe("Sign in with ORCID");
    expect(landingStrings("fr-FR").signInTitle).toBe("Se connecter");
    expect(landingStrings("de-DE").about).toBe("Über");
    expect(landingStrings("xx-XX").about).toBe(landingStrings("en-US").about);
  });

  it("has a non-empty value for every field in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      for (const value of Object.values(landingStrings(loc))) {
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("carries a SigmaCV-branded SEO title + a substantial description per locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = landingStrings(loc);
      expect(s.metaTitle).toContain("SigmaCV");
      expect(s.metaDescription.length).toBeGreaterThan(40);
    }
  });
});
