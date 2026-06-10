import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { landingAudience, type LandingAudience } from "@/lib/i18n/landingAudience";

/**
 * Guards the homepage "who it's for" audience content (C2). Typing forces every
 * locale/field to exist; these checks pin the persona count, non-emptiness,
 * proper-noun preservation, and the EN fallback.
 */
describe("landingAudience", () => {
  it("defines a heading and exactly 4 non-empty personas for all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      const a: LandingAudience = landingAudience(loc);
      expect(a.heading.length).toBeGreaterThan(0);
      expect(a.personas).toHaveLength(4);
      for (const p of a.personas) {
        expect(p.title.length).toBeGreaterThan(0);
        expect(p.body.length).toBeGreaterThan(0);
      }
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(landingAudience("xx-XX")).toEqual(landingAudience("en-US"));
  });

  it("actually translates non-English locales", () => {
    expect(landingAudience("fr-FR").heading).not.toBe(landingAudience("en-US").heading);
  });

  it("keeps funder proper nouns untranslated in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const blob = JSON.stringify(landingAudience(loc));
      for (const token of ["NIH", "NSF", "ERC", "UKRI"]) {
        expect(blob).toContain(token);
      }
    }
  });
});
