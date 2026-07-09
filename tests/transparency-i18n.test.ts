import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { transparencyStrings } from "@/lib/i18n/transparency";

describe("transparencyStrings", () => {
  it("localizes the Transparency page and falls back to English", () => {
    expect(transparencyStrings("en-US").heading).toBe("Transparency");
    expect(transparencyStrings("fr-FR").heading).toBe("Transparence");
    expect(transparencyStrings("ja-JP").metaTitle).toBe("透明性");
    expect(transparencyStrings("xx-XX").heading).toBe(transparencyStrings("en-US").heading);
  });

  it("has every field non-empty for all 10 locales", () => {
    for (const loc of SUPPORTED_LOCALES) {
      for (const value of Object.values(transparencyStrings(loc))) {
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("names ORCID + IRB in the matching/log copy of every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      expect(transparencyStrings(loc).matchingBody).toContain("ORCID");
      expect(transparencyStrings(loc).logBody).toContain("IRB");
    }
  });

  it("is honest about the OpenAlex cluster caveat + under-coverage in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = transparencyStrings(loc);
      // The cluster-vs-PID caveat names OpenAlex + ORCID (proper nouns untranslated).
      expect(s.clusterNote, loc).toContain("OpenAlex");
      expect(s.clusterNote, loc).toContain("ORCID");
      // The coverage disclaimer names the under-covered sources.
      expect(s.coverageBody, loc).toContain("OpenAlex");
      expect(s.coverageHeading.trim().length, loc).toBeGreaterThan(0);
    }
  });

  it("provides a populated 'Our promises' set + publish note for every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = transparencyStrings(loc);
      expect(s.promises.length, loc).toBeGreaterThanOrEqual(6);
      expect(
        s.promises.every((p) => p.trim().length > 0),
        loc,
      ).toBe(true);
      expect(s.promisesHeading.trim().length, loc).toBeGreaterThan(0);
      expect(s.publishNote.trim().length, loc).toBeGreaterThan(0);
      expect(s.promisesVerifyLink.trim().length, loc).toBeGreaterThan(0);
    }
  });
});
