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
    // Recurse so nested records (e.g. authError.messages) are checked too: every
    // leaf string must be non-empty, every array must have length, in every locale.
    const expectNonEmpty = (value: unknown): void => {
      if (typeof value === "string") {
        expect(value.length).toBeGreaterThan(0);
      } else if (Array.isArray(value)) {
        expect(value.length).toBeGreaterThan(0);
        for (const item of value) expectNonEmpty(item);
      } else if (value && typeof value === "object") {
        for (const v of Object.values(value)) expectNonEmpty(v);
      }
    };
    for (const loc of SUPPORTED_LOCALES) {
      expectNonEmpty(landingStrings(loc));
    }
  });

  it("carries a SigmaCV-branded SEO title + a substantial description per locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = landingStrings(loc);
      expect(s.metaTitle).toContain("SigmaCV");
      expect(s.metaDescription.length).toBeGreaterThan(40);
    }
  });

  it("has matching feature + trust card counts with non-empty title/body in every locale", () => {
    const en = landingStrings("en-US");
    for (const loc of SUPPORTED_LOCALES) {
      const s = landingStrings(loc);
      // Same number of cards across locales (the showcase must line up).
      expect(s.features).toHaveLength(en.features.length);
      expect(s.trust).toHaveLength(en.trust.length);
      for (const card of [...s.features, ...s.trust]) {
        expect(card.title.length).toBeGreaterThan(0);
        expect(card.body.length).toBeGreaterThan(0);
      }
      // Creator + explore strings present.
      expect(s.creatorTitle.length).toBeGreaterThan(0);
      expect(s.creatorBody).toContain("Basile Chrétien");
      expect(s.exploreOrcid.length).toBeGreaterThan(0);
      expect(s.exploreNih.length).toBeGreaterThan(0);
    }
  });
});
