import { describe, expect, it } from "vitest";
import { localeLanguageCode, SUPPORTED_LOCALES } from "@/lib/i18n";
import { GUIDES_CHROME, guidesChrome } from "@/lib/i18n/guidesChrome";
import {
  glossaryIndexLanguageAlternates,
  glossaryTermLanguageAlternates,
  guideLanguageAlternates,
  guidesIndexLanguageAlternates,
  localeGlossaryIndexPath,
  localeGlossaryTermPath,
  localeGuidePath,
  localeGuidesIndexPath,
  localizeContentHref,
} from "@/lib/seo";

describe("localeLanguageCode", () => {
  it("returns the bare language code, defaulting unknown to en", () => {
    expect(localeLanguageCode("fr-FR")).toBe("fr");
    expect(localeLanguageCode("zh-CN")).toBe("zh");
    expect(localeLanguageCode("xx-XX")).toBe("en");
  });
});

describe("guides/glossary locale paths", () => {
  it("uses bare paths for the default locale and a prefix otherwise", () => {
    expect(localeGuidesIndexPath("en-US")).toBe("/guides");
    expect(localeGuidesIndexPath("fr-FR")).toBe("/fr/guides");
    expect(localeGuidePath("how-to-write-an-academic-cv", "en-US")).toBe(
      "/guides/how-to-write-an-academic-cv",
    );
    expect(localeGuidePath("how-to-write-an-academic-cv", "de-DE")).toBe(
      "/de/guides/how-to-write-an-academic-cv",
    );
    expect(localeGlossaryIndexPath("en-US")).toBe("/glossary");
    expect(localeGlossaryIndexPath("ja-JP")).toBe("/ja/glossary");
    expect(localeGlossaryTermPath("orcid", "en-US")).toBe("/glossary/orcid");
    expect(localeGlossaryTermPath("orcid", "ko-KR")).toBe("/ko/glossary/orcid");
  });
});

describe("hreflang alternates", () => {
  const expectFullMap = (m: Record<string, string>, bare: string) => {
    expect(m["x-default"]).toBe(bare);
    for (const loc of SUPPORTED_LOCALES) expect(typeof m[loc]).toBe("string");
    // 10 locales + x-default.
    expect(Object.keys(m)).toHaveLength(SUPPORTED_LOCALES.length + 1);
  };

  it("cover every locale plus x-default", () => {
    expectFullMap(guidesIndexLanguageAlternates(), "/guides");
    expectFullMap(
      guideLanguageAlternates("how-to-write-an-academic-cv"),
      "/guides/how-to-write-an-academic-cv",
    );
    expectFullMap(glossaryIndexLanguageAlternates(), "/glossary");
    expectFullMap(glossaryTermLanguageAlternates("orcid"), "/glossary/orcid");
    expect(guideLanguageAlternates("x")["fr-FR"]).toBe("/fr/guides/x");
    expect(glossaryTermLanguageAlternates("orcid")["de-DE"]).toBe("/de/glossary/orcid");
  });
});

describe("localizeContentHref", () => {
  it("localizes internal CTA links for non-default locales", () => {
    expect(localizeContentHref("/", "fr-FR")).toBe("/fr");
    expect(localizeContentHref("/guides/x", "fr-FR")).toBe("/fr/guides/x");
    expect(localizeContentHref("/glossary/orcid", "fr-FR")).toBe("/fr/glossary/orcid");
    expect(localizeContentHref("/orcid-to-cv", "fr-FR")).toBe("/fr/orcid-to-cv");
  });

  it("is a no-op for the default locale and for external links", () => {
    expect(localizeContentHref("/", "en-US")).toBe("/");
    expect(localizeContentHref("/guides/x", "en-US")).toBe("/guides/x");
    expect(localizeContentHref("/orcid-to-cv", "en-US")).toBe("/orcid-to-cv");
    expect(localizeContentHref("https://orcid.org", "fr-FR")).toBe("https://orcid.org");
    expect(localizeContentHref("#faq", "fr-FR")).toBe("#faq");
  });
});

describe("guidesChrome", () => {
  it("is defined for all 10 locales with non-empty strings, and falls back to English", () => {
    expect(Object.keys(GUIDES_CHROME)).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      const c = guidesChrome(loc);
      for (const v of Object.values(c)) expect(v.trim().length).toBeGreaterThan(0);
    }
    expect(guidesChrome("xx-XX")).toEqual(GUIDES_CHROME["en-US"]);
  });
});
