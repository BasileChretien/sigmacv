import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import {
  LANDING_RELATED,
  landingPageContent,
  type LandingPageContent,
} from "@/lib/i18n/landingContent";
import { LANDING_PAGE_IDS, landingPageStrings } from "@/lib/i18n/landingPages";

/**
 * Guards the deep landing-page content (C1). The typing already forces every
 * locale/page/field to exist; these checks pin the array shapes, non-emptiness,
 * proper-noun preservation, the related-link graph, and the EN fallback.
 */
describe("landingPageContent", () => {
  it("defines complete, non-empty deep content for all 10 locales and 7 pages", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      for (const page of LANDING_PAGE_IDS) {
        const c: LandingPageContent = landingPageContent(page, loc);
        expect(c.intro).toHaveLength(2);
        expect(c.why).toHaveLength(2);
        expect(c.steps).toHaveLength(4);
        expect(c.faqExtra).toHaveLength(3);
        for (const p of [...c.intro, ...c.why, c.stepsHeading, c.whyHeading, c.relatedHeading]) {
          expect(p.length).toBeGreaterThan(0);
        }
        for (const st of c.steps) {
          expect(st.title.length).toBeGreaterThan(0);
          expect(st.body.length).toBeGreaterThan(0);
        }
        for (const f of c.faqExtra) {
          expect(f.q.length).toBeGreaterThan(0);
          expect(f.a.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("falls back to English for an unknown locale", () => {
    for (const page of LANDING_PAGE_IDS) {
      expect(landingPageContent(page, "xx-XX")).toEqual(landingPageContent(page, "en-US"));
    }
  });

  it("actually translates non-English locales (differs from English)", () => {
    expect(landingPageContent("orcid-to-cv", "fr-FR").stepsHeading).not.toBe(
      landingPageContent("orcid-to-cv", "en-US").stepsHeading,
    );
    expect(landingPageContent("latex-cv", "de-DE").intro[0]).not.toBe(
      landingPageContent("latex-cv", "en-US").intro[0],
    );
  });

  it("keeps proper nouns untranslated across every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      // ORCID + OpenAlex appear in the orcid-to-cv steps in every language.
      const steps = landingPageContent("orcid-to-cv", loc)
        .steps.map((s) => s.body)
        .join(" ");
      expect(steps).toContain("ORCID");
      expect(steps).toContain("OpenAlex");
      // LaTeX page keeps the LaTeX/.tex/.bib tokens.
      const latex = JSON.stringify(landingPageContent("latex-cv", loc));
      expect(latex).toContain("LaTeX");
      expect(latex).toContain(".bib");
    }
  });

  it("wires a valid related-links graph (3 existing siblings, never itself)", () => {
    for (const page of LANDING_PAGE_IDS) {
      const related = LANDING_RELATED[page];
      expect(related).toHaveLength(3);
      for (const id of related) {
        expect(LANDING_PAGE_IDS).toContain(id);
        expect(id).not.toBe(page);
        // The link label must resolve to a real localized navLabel.
        expect(landingPageStrings(id, "en-US").navLabel.length).toBeGreaterThan(0);
      }
    }
  });
});
