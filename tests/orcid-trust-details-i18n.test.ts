import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { orcidTrustDetails, type OrcidTrustDetails } from "@/lib/i18n/orcidTrustDetails";

/**
 * Guards the "What we access — and what we never do" ORCID trust disclosure.
 * Typing forces every locale/field to exist; these checks pin non-emptiness, the
 * EN fallback, actual translation, and that the ORCID / openid / Apache-2.0
 * proper nouns survive untranslated in every locale (they're load-bearing claims).
 */
describe("orcidTrustDetails", () => {
  it("defines non-empty strings for every field in all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      const d: OrcidTrustDetails = orcidTrustDetails(loc);
      for (const value of Object.values(d)) {
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(orcidTrustDetails("xx-XX")).toEqual(orcidTrustDetails("en-US"));
  });

  it("actually translates non-English locales", () => {
    expect(orcidTrustDetails("fr-FR").summary).not.toBe(orcidTrustDetails("en-US").summary);
  });

  it("keeps the ORCID / openid / Apache-2.0 nouns intact in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const d = orcidTrustDetails(loc);
      expect(d.access).toContain("ORCID");
      expect(d.access).toContain("openid");
      // `credentials` also names ORCID in every locale ("sign in through ORCID") —
      // pin it so a future edit can't silently drop/translate the brand there.
      expect(d.credentials).toContain("ORCID");
      expect(d.open).toContain("Apache-2.0");
    }
  });
});
