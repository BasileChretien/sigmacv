import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { objectionStrings } from "@/lib/i18n/objection";

describe("objectionStrings", () => {
  it("has every field non-empty for all 10 locales and falls back to English", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      for (const [k, v] of Object.entries(objectionStrings(loc))) {
        expect(v.length, `${loc}.${k}`).toBeGreaterThan(0);
      }
    }
    expect(objectionStrings("xx-XX")).toEqual(objectionStrings("en-US"));
    expect(objectionStrings("fr-FR").cta).not.toBe(objectionStrings("en-US").cta);
  });

  it("keeps the brand, ORCID and the objection address untranslated, and promises no account", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = objectionStrings(loc);
      expect(s.intro).toContain("SigmaCV");
      expect(s.intro).toContain("ORCID");
      expect(s.emailFallback).toContain("privacy@sigmacv.org");
      expect(s.doneSuppressedBody).toContain("privacy@sigmacv.org");
      expect(s.doneFailedBody).toContain("privacy@sigmacv.org");
      expect(s.cta).toContain("ORCID");
      expect(s.ctaNote).toContain("orcid.org");
    }
  });
});
