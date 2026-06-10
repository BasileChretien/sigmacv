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
import { PERSONA_PAGE_IDS } from "@/lib/i18n/personaPages";
import {
  TOPIC_PAGE_IDS,
  TOPIC_RELATED,
  topicPageContent,
  topicPageStrings,
} from "@/lib/i18n/topicPages";

describe("topic pages", () => {
  it("defines complete thin + deep content for all 10 locales and every topic", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      for (const page of TOPIC_PAGE_IDS) {
        const s = topicPageStrings(page, loc);
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
        const c = topicPageContent(page, loc);
        expect(c.intro).toHaveLength(2);
        expect(c.why).toHaveLength(2);
        expect(c.steps).toHaveLength(4);
        expect(c.faqExtra).toHaveLength(3);
      }
    }
  });

  it("keeps proper nouns untranslated across every locale (incl. Google Scholar)", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const blob =
        JSON.stringify(topicPageStrings("cv-from-google-scholar", loc)) +
        JSON.stringify(topicPageContent("cv-from-google-scholar", loc));
      expect(blob).toContain("Google Scholar");
      expect(blob).toContain("ORCID");
      expect(blob).toContain("OpenAlex");
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(topicPageStrings("erc-cv", "xx-XX")).toEqual(topicPageStrings("erc-cv", "en-US"));
    expect(topicPageContent("import-publications-to-cv", "xx-XX")).toEqual(
      topicPageContent("import-publications-to-cv", "en-US"),
    );
  });

  it("actually translates non-English locales", () => {
    expect(topicPageStrings("erc-cv", "fr-FR").heading).not.toBe(
      topicPageStrings("erc-cv", "en-US").heading,
    );
  });

  it("wires a related graph that points at real, non-self ids", () => {
    for (const page of TOPIC_PAGE_IDS) {
      const related = TOPIC_RELATED[page];
      expect(related.length).toBeGreaterThan(0);
      for (const id of related) {
        expect(ALL_LANDING_PAGE_IDS).toContain(id);
        expect(id).not.toBe(page);
      }
    }
  });
});

describe("landingAll facade (three families)", () => {
  it("includes original SEO pages, personas, and topics", () => {
    expect(ALL_LANDING_PAGE_IDS).toHaveLength(
      LANDING_PAGE_IDS.length + PERSONA_PAGE_IDS.length + TOPIC_PAGE_IDS.length,
    );
    for (const id of TOPIC_PAGE_IDS) expect(ALL_LANDING_PAGE_IDS).toContain(id);
  });

  it("routes accessors correctly across all three families", () => {
    expect(anyLandingPageStrings("orcid-to-cv", "en-US").heading).toBe(
      "Turn your ORCID iD into an academic CV",
    );
    expect(anyLandingPageStrings("phd-cv", "en-US").navLabel).toBe("PhD application CV");
    expect(anyLandingPageStrings("erc-cv", "en-US").navLabel).toBe("ERC CV");
    expect(anyLandingPageContent("cv-from-google-scholar", "en-US").steps).toHaveLength(4);
    expect(anyLandingRelated("erc-cv").length).toBeGreaterThan(0);
  });

  it("isLandingPageId accepts ids from every family and rejects unknown", () => {
    expect(isLandingPageId("orcid-to-cv")).toBe(true);
    expect(isLandingPageId("phd-cv")).toBe(true);
    expect(isLandingPageId("erc-cv")).toBe(true);
    expect(isLandingPageId("nope")).toBe(false);
  });
});
