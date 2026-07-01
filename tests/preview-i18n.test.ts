import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { previewStrings, type PreviewStrings } from "@/lib/i18n/preview";

/**
 * Guards the no-login ORCID preview copy. Typing forces every locale/field to
 * exist; these checks pin non-emptiness, the EN fallback, actual translation, and
 * that the ORCID / OpenAlex / SigmaCV brand proper nouns survive in every locale.
 */
describe("previewStrings", () => {
  it("defines non-empty strings for every field in all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      const s: PreviewStrings = previewStrings(loc);
      for (const value of Object.values(s)) {
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(previewStrings("xx-XX")).toEqual(previewStrings("en-US"));
  });

  it("actually translates non-English locales", () => {
    expect(previewStrings("fr-FR").formCta).not.toBe(previewStrings("en-US").formCta);
  });

  it("keeps the OpenAlex / ORCID / SigmaCV brand names untranslated in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = previewStrings(loc);
      expect(s.builtFromPublic).toContain("OpenAlex");
      expect(s.builtFromPublic).toContain("ORCID");
      expect(s.back).toContain("SigmaCV");
    }
  });
});
