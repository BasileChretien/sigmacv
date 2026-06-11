import { describe, expect, it } from "vitest";
import { DEFAULT_UI_LOCALE, LOCALE_SLUGS, SUPPORTED_LOCALES } from "@/lib/i18n";
import {
  HEAD_TERM_META,
  HEAD_TERM_PAGE_IDS,
  getHeadTermMeta,
  headTermContent,
  headTermPageForLocale,
  headTermRelated,
  headTermStrings,
  isHeadTermPageId,
} from "@/lib/i18n/headTermPages";
import {
  ALL_LANDING_PAGE_IDS,
  anyLandingPageContent,
  anyLandingPageStrings,
  anyLandingRelated,
  isLandingPageId,
} from "@/lib/i18n/landingAll";
import { LANDING_PAGE_IDS } from "@/lib/i18n/landingPages";
import { localeLandingPagePath } from "@/lib/seo";

describe("head-term pages", () => {
  it("has 9 unique native slugs, none colliding with the ×10 landing ids", () => {
    expect(HEAD_TERM_PAGE_IDS).toHaveLength(9);
    expect(new Set(HEAD_TERM_PAGE_IDS).size).toBe(9);
    for (const id of HEAD_TERM_PAGE_IDS) {
      expect(ALL_LANDING_PAGE_IDS).not.toContain(id);
    }
  });

  it("each page is single-locale (non-default) with valid cross-links", () => {
    const locales = new Set<string>();
    for (const slug of HEAD_TERM_PAGE_IDS) {
      const meta = getHeadTermMeta(slug);
      expect(meta.slug).toBe(slug);
      expect(SUPPORTED_LOCALES).toContain(meta.locale);
      expect(meta.locale).not.toBe(DEFAULT_UI_LOCALE);
      expect(meta.headTerm.trim().length).toBeGreaterThan(0);
      expect(meta.related.length).toBeGreaterThan(0);
      for (const r of meta.related) expect(LANDING_PAGE_IDS).toContain(r);
      locales.add(meta.locale);
    }
    // One page per non-English locale → 9 distinct locales.
    expect(locales.size).toBe(9);
    expect(locales.has(DEFAULT_UI_LOCALE)).toBe(false);
  });

  it("every page has well-formed native copy", () => {
    for (const slug of HEAD_TERM_PAGE_IDS) {
      const s = headTermStrings(slug);
      for (const v of [
        s.metaTitle,
        s.metaDescription,
        s.navLabel,
        s.heading,
        s.subhead,
        s.cta,
        s.backLink,
      ]) {
        expect(v.trim().length).toBeGreaterThan(0);
      }
      expect(s.bullets).toHaveLength(3);
      expect(s.faq).toHaveLength(2);
      const c = headTermContent(slug);
      expect(c.intro).toHaveLength(2);
      expect(c.steps).toHaveLength(4);
      expect(c.why).toHaveLength(2);
      expect(c.faqExtra).toHaveLength(3);
      expect(c.stepsHeading.trim().length).toBeGreaterThan(0);
      // The native head term should appear in the H1 (case-insensitive: some
      // languages capitalize the leading word).
      const firstToken = (getHeadTermMeta(slug).headTerm.split(" ")[0] ?? "").toLowerCase();
      expect(s.heading.toLowerCase()).toContain(firstToken);
    }
  });

  it("is reachable through the landingAll facade but excluded from isLandingPageId", () => {
    const slug = "cv-academique";
    const loc = getHeadTermMeta(slug).locale;
    expect(anyLandingPageStrings(slug, loc).heading).toBe(headTermStrings(slug).heading);
    expect(anyLandingPageContent(slug, loc).steps).toHaveLength(4);
    expect(anyLandingRelated(slug)).toEqual(headTermRelated(slug));
    // Excluded from the ×10 family set.
    expect(isLandingPageId(slug)).toBe(false);
    expect(isHeadTermPageId(slug)).toBe(true);
    expect(isHeadTermPageId("orcid-to-cv")).toBe(false);
  });

  it("resolves to a native-slug URL under its locale", () => {
    const slug = "wissenschaftlicher-lebenslauf";
    const loc = getHeadTermMeta(slug).locale;
    expect(localeLandingPagePath(slug, loc)).toBe(`/${LOCALE_SLUGS[loc]}/${slug}`);
    expect(localeLandingPagePath("cv-academique", "fr-FR")).toBe("/fr/cv-academique");
  });

  it("HEAD_TERM_META has an entry for every id", () => {
    expect(Object.keys(HEAD_TERM_META).sort()).toEqual([...HEAD_TERM_PAGE_IDS].sort());
  });

  it("maps a locale to its head-term page (en-US / unknown → none)", () => {
    expect(headTermPageForLocale("fr-FR")).toBe("cv-academique");
    expect(headTermPageForLocale("de-DE")).toBe("wissenschaftlicher-lebenslauf");
    expect(headTermPageForLocale("ja-JP")).toBe("gakujutsu-cv");
    expect(headTermPageForLocale("en-US")).toBeUndefined();
    expect(headTermPageForLocale("xx-XX")).toBeUndefined();
  });
});
