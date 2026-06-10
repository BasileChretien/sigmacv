import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import {
  ALL_LANDING_PAGE_IDS,
  anyLandingPageContent,
  anyLandingPageStrings,
  anyLandingRelated,
  isLandingPageId,
} from "@/lib/i18n/landingAll";
import { LANDING_PAGE_IDS } from "@/lib/i18n/landingPages";
import {
  PERSONA_PAGE_IDS,
  PERSONA_RELATED,
  personaPageContent,
  personaPageStrings,
} from "@/lib/i18n/personaPages";

describe("persona pages", () => {
  it("defines complete thin + deep content for all 10 locales and every persona", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      for (const page of PERSONA_PAGE_IDS) {
        const s = personaPageStrings(page, loc);
        expect(s.bullets).toHaveLength(3);
        expect(s.faq).toHaveLength(2);
        for (const v of [
          s.metaTitle,
          s.metaDescription,
          s.navLabel,
          s.heading,
          s.subhead,
          s.cta,
          s.backLink,
        ]) {
          expect(v.length).toBeGreaterThan(0);
        }
        const c = personaPageContent(page, loc);
        expect(c.intro).toHaveLength(2);
        expect(c.why).toHaveLength(2);
        expect(c.steps).toHaveLength(4);
        expect(c.faqExtra).toHaveLength(3);
      }
    }
  });

  it("keeps proper nouns untranslated across every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const blob =
        JSON.stringify(personaPageStrings("phd-cv", loc)) +
        JSON.stringify(personaPageContent("phd-cv", loc));
      expect(blob).toContain("ORCID");
      expect(blob).toContain("OpenAlex");
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(personaPageStrings("phd-cv", "xx-XX")).toEqual(personaPageStrings("phd-cv", "en-US"));
    expect(personaPageContent("postdoc-cv", "xx-XX")).toEqual(
      personaPageContent("postdoc-cv", "en-US"),
    );
  });

  it("actually translates non-English locales", () => {
    expect(personaPageStrings("phd-cv", "fr-FR").heading).not.toBe(
      personaPageStrings("phd-cv", "en-US").heading,
    );
  });

  it("wires a related graph that points at real, non-self ids", () => {
    for (const page of PERSONA_PAGE_IDS) {
      const related = PERSONA_RELATED[page];
      expect(related.length).toBeGreaterThan(0);
      for (const id of related) {
        expect(ALL_LANDING_PAGE_IDS).toContain(id);
        expect(id).not.toBe(page);
      }
    }
  });
});

describe("landingAll facade", () => {
  it("includes both the original SEO pages and the persona pages", () => {
    for (const id of LANDING_PAGE_IDS) expect(ALL_LANDING_PAGE_IDS).toContain(id);
    for (const id of PERSONA_PAGE_IDS) expect(ALL_LANDING_PAGE_IDS).toContain(id);
    // ALL also includes the topic family (see tests/topic-pages-i18n.test.ts for
    // the exact 3-family count), so this is a lower bound, not an equality.
    expect(ALL_LANDING_PAGE_IDS.length).toBeGreaterThanOrEqual(
      LANDING_PAGE_IDS.length + PERSONA_PAGE_IDS.length,
    );
  });

  it("routes accessors correctly for both families", () => {
    // Original page resolves via the original records…
    expect(anyLandingPageStrings("orcid-to-cv", "en-US").heading).toBe(
      "Turn your ORCID iD into an academic CV",
    );
    // …and a persona page resolves via the persona records.
    expect(anyLandingPageStrings("phd-cv", "en-US").navLabel).toBe("PhD application CV");
    expect(anyLandingPageContent("phd-cv", "en-US").steps).toHaveLength(4);
    expect(anyLandingRelated("phd-cv").length).toBeGreaterThan(0);
    expect(anyLandingRelated("orcid-to-cv").length).toBeGreaterThan(0);
  });

  it("isLandingPageId accepts known ids and rejects unknown", () => {
    expect(isLandingPageId("phd-cv")).toBe(true);
    expect(isLandingPageId("orcid-to-cv")).toBe(true);
    expect(isLandingPageId("nope")).toBe(false);
  });
});
