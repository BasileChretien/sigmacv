import { describe, expect, it } from "vitest";
import { faqPageJsonLd } from "@/lib/faqJsonLd";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import {
  LANDING_PAGE_IDS,
  type LandingPageStrings,
  landingPageStrings,
} from "@/lib/i18n/landingPages";
import { landingPageLanguageAlternates, localeLandingPagePath } from "@/lib/seo";

/** Every scalar (non-array) field on the strings object. */
function scalarFields(s: LandingPageStrings): string[] {
  const { bullets, faq, ...scalars } = s;
  void bullets;
  void faq;
  return Object.values(scalars);
}

describe("landingPageStrings", () => {
  it("localizes both pages and falls back to English for unknown locales", () => {
    expect(landingPageStrings("orcid-to-cv", "en-US").heading).toBe(
      "Turn your ORCID iD into an academic CV",
    );
    expect(landingPageStrings("nih-biosketch", "en-US").heading).toBe(
      "Generate an NIH biosketch from ORCID and OpenAlex",
    );
    // Unknown locale → English.
    for (const page of LANDING_PAGE_IDS) {
      expect(landingPageStrings(page, "xx-XX")).toEqual(landingPageStrings(page, "en-US"));
    }
    // A non-default locale is actually translated (differs from English).
    expect(landingPageStrings("orcid-to-cv", "fr-FR").heading).not.toBe(
      landingPageStrings("orcid-to-cv", "en-US").heading,
    );
  });

  it("defines every key, non-empty, for all 10 locales and both pages", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      for (const page of LANDING_PAGE_IDS) {
        const s = landingPageStrings(page, loc);
        for (const value of scalarFields(s)) {
          expect(value.length).toBeGreaterThan(0);
        }
        // Exactly 3 non-empty bullets.
        expect(s.bullets).toHaveLength(3);
        for (const bullet of s.bullets) {
          expect(bullet.length).toBeGreaterThan(0);
        }
        // Exactly 2 FAQ items with non-empty q/a.
        expect(s.faq).toHaveLength(2);
        for (const item of s.faq) {
          expect(item.q.length).toBeGreaterThan(0);
          expect(item.a.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("keeps proper nouns untranslated in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const orcid = landingPageStrings("orcid-to-cv", loc);
      expect(orcid.metaDescription).toContain("ORCID");
      expect(orcid.metaDescription).toContain("OpenAlex");

      const nih = landingPageStrings("nih-biosketch", loc);
      expect(nih.metaDescription).toContain("NIH");
      expect(nih.metaDescription).toContain("ORCID");
      expect(nih.heading).toContain("NIH");
    }
  });

  it("produces valid FAQPage JSON-LD from each page's FAQ items", () => {
    for (const loc of SUPPORTED_LOCALES) {
      for (const page of LANDING_PAGE_IDS) {
        const html = faqPageJsonLd(landingPageStrings(page, loc).faq);
        expect(html).toContain('"@type":"FAQPage"');
        expect(html).toContain("<script");
      }
    }
  });
});

describe("SEO helpers for landing pages", () => {
  it("serves the bare segment for the default locale and /{slug}/segment otherwise", () => {
    expect(localeLandingPagePath("orcid-to-cv", "en-US")).toBe("/orcid-to-cv");
    expect(localeLandingPagePath("orcid-to-cv", "fr-FR")).toBe("/fr/orcid-to-cv");
    expect(localeLandingPagePath("nih-biosketch", "ja-JP")).toBe("/ja/nih-biosketch");
    // Unknown locale → default (bare) path.
    expect(localeLandingPagePath("nih-biosketch", "xx-XX")).toBe("/nih-biosketch");
  });

  it("maps every locale plus x-default for each landing page", () => {
    for (const page of LANDING_PAGE_IDS) {
      const langs = landingPageLanguageAlternates(page);
      expect(langs["x-default"]).toBe(`/${page}`);
      expect(langs["en-US"]).toBe(`/${page}`);
      expect(langs["de-DE"]).toBe(`/de/${page}`);
      for (const loc of SUPPORTED_LOCALES) {
        expect(langs[loc]).toBeDefined();
      }
      expect(Object.keys(langs)).toHaveLength(SUPPORTED_LOCALES.length + 1);
    }
  });
});
