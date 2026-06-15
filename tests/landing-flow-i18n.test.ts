import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { landingFlow, type LandingFlow } from "@/lib/i18n/landingFlow";

/**
 * Guards the homepage "how it works" flow copy (Curate / Style / Export steps +
 * CTA). Typing forces every locale/field to exist; these checks pin the step and
 * bullet counts, non-emptiness, universal-token preservation, and the EN
 * fallback — same convention as landing-audience-i18n / orcid-help-i18n.
 */
describe("landingFlow", () => {
  it("defines heading, 3 steps (3 bullets each) and CTAs for all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      const f: LandingFlow = landingFlow(loc);
      expect(f.howTitle.length).toBeGreaterThan(0);
      expect(f.howSub.length).toBeGreaterThan(0);
      expect(f.templatesCta.length).toBeGreaterThan(0);
      expect(f.ctaTitle.length).toBeGreaterThan(0);
      expect(f.steps).toHaveLength(3);
      for (const step of f.steps) {
        expect(step.title.length).toBeGreaterThan(0);
        expect(step.body.length).toBeGreaterThan(0);
        expect(step.points).toHaveLength(3);
        for (const pt of step.points) {
          expect(pt.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(landingFlow("xx-XX")).toEqual(landingFlow("en-US"));
  });

  it("actually translates non-English locales", () => {
    expect(landingFlow("fr-FR").howTitle).not.toBe(landingFlow("en-US").howTitle);
  });

  it("keeps universal format/standard tokens in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const blob = JSON.stringify(landingFlow(loc));
      for (const token of ["58", "CSL", "DOI", "PDF", "DOCX", "LaTeX", "Markdown"]) {
        expect(blob).toContain(token);
      }
    }
  });
});
