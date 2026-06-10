import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { orcidHelp, type OrcidHelp } from "@/lib/i18n/orcidHelp";

/**
 * Guards the sign-in-card "don't have an ORCID iD yet?" helper. Typing forces
 * every locale/field to exist; these checks pin non-emptiness, the EN fallback,
 * actual translation, and that the ORCID / SigmaCV brand proper nouns survive in
 * every locale's explainer.
 */
describe("orcidHelp", () => {
  it("defines non-empty question / explainer / cta for all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      const h: OrcidHelp = orcidHelp(loc);
      expect(h.question.length).toBeGreaterThan(0);
      expect(h.explainer.length).toBeGreaterThan(0);
      expect(h.cta.length).toBeGreaterThan(0);
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(orcidHelp("xx-XX")).toEqual(orcidHelp("en-US"));
  });

  it("actually translates non-English locales", () => {
    expect(orcidHelp("fr-FR").question).not.toBe(orcidHelp("en-US").question);
  });

  it("keeps the ORCID and SigmaCV brand names untranslated in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      expect(orcidHelp(loc).explainer).toContain("ORCID");
      expect(orcidHelp(loc).explainer).toContain("SigmaCV");
    }
  });
});
