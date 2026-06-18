import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import {
  aboutLanguageAlternates,
  accessibilityLanguageAlternates,
  contactLanguageAlternates,
  fairLanguageAlternates,
  faqLanguageAlternates,
  homeLanguageAlternates,
  localeAboutPath,
  localeAccessibilityPath,
  localeContactPath,
  localeFairPath,
  localeFaqPath,
  localeHomePath,
  localePrinciplesPath,
  localePrivacyPath,
  localeTermsPath,
  localeTransparencyPath,
  ogAlternateLocales,
  ogLocale,
  principlesLanguageAlternates,
  privacyLanguageAlternates,
  termsLanguageAlternates,
  transparencyLanguageAlternates,
} from "@/lib/seo";

describe("localeHomePath", () => {
  it("serves the default locale at / and others at /{slug}", () => {
    expect(localeHomePath("en-US")).toBe("/");
    expect(localeHomePath("fr-FR")).toBe("/fr");
    expect(localeHomePath("ja-JP")).toBe("/ja");
  });
  it("treats unknown locales as the default", () => {
    expect(localeHomePath("xx-XX")).toBe("/");
  });
});

describe("homeLanguageAlternates", () => {
  it("maps every supported locale plus x-default", () => {
    const langs = homeLanguageAlternates();
    expect(langs["x-default"]).toBe("/");
    expect(langs["en-US"]).toBe("/");
    expect(langs["de-DE"]).toBe("/de");
    for (const loc of SUPPORTED_LOCALES) {
      expect(langs[loc]).toBeDefined();
    }
    // 10 locales + x-default
    expect(Object.keys(langs)).toHaveLength(SUPPORTED_LOCALES.length + 1);
  });
});

describe("localeAboutPath / aboutLanguageAlternates", () => {
  it("serves /about for the default and /{slug}/about for others", () => {
    expect(localeAboutPath("en-US")).toBe("/about");
    expect(localeAboutPath("fr-FR")).toBe("/fr/about");
    expect(localeAboutPath("ja-JP")).toBe("/ja/about");
    expect(localeAboutPath("xx-XX")).toBe("/about");
  });
  it("maps every locale plus x-default", () => {
    const langs = aboutLanguageAlternates();
    expect(langs["x-default"]).toBe("/about");
    expect(langs["en-US"]).toBe("/about");
    expect(langs["de-DE"]).toBe("/de/about");
    expect(Object.keys(langs)).toHaveLength(SUPPORTED_LOCALES.length + 1);
  });
});

describe("localePrivacyPath / privacyLanguageAlternates", () => {
  it("serves /privacy for the default and /{slug}/privacy for others", () => {
    expect(localePrivacyPath("en-US")).toBe("/privacy");
    expect(localePrivacyPath("fr-FR")).toBe("/fr/privacy");
    expect(localePrivacyPath("ja-JP")).toBe("/ja/privacy");
    expect(localePrivacyPath("xx-XX")).toBe("/privacy");
  });
  it("maps every locale plus x-default", () => {
    const langs = privacyLanguageAlternates();
    expect(langs["x-default"]).toBe("/privacy");
    expect(langs["en-US"]).toBe("/privacy");
    expect(langs["de-DE"]).toBe("/de/privacy");
    expect(Object.keys(langs)).toHaveLength(SUPPORTED_LOCALES.length + 1);
  });
});

describe("localeTermsPath / termsLanguageAlternates", () => {
  it("serves /terms for the default and /{slug}/terms for others", () => {
    expect(localeTermsPath("en-US")).toBe("/terms");
    expect(localeTermsPath("fr-FR")).toBe("/fr/terms");
    expect(localeTermsPath("ja-JP")).toBe("/ja/terms");
    expect(localeTermsPath("xx-XX")).toBe("/terms");
  });
  it("maps every locale plus x-default", () => {
    const langs = termsLanguageAlternates();
    expect(langs["x-default"]).toBe("/terms");
    expect(langs["en-US"]).toBe("/terms");
    expect(langs["de-DE"]).toBe("/de/terms");
    expect(Object.keys(langs)).toHaveLength(SUPPORTED_LOCALES.length + 1);
  });
});

describe("localeContactPath / contactLanguageAlternates", () => {
  it("serves /contact for the default and /{slug}/contact for others", () => {
    expect(localeContactPath("en-US")).toBe("/contact");
    expect(localeContactPath("fr-FR")).toBe("/fr/contact");
    expect(localeContactPath("ja-JP")).toBe("/ja/contact");
    expect(localeContactPath("xx-XX")).toBe("/contact");
  });
  it("maps every locale plus x-default", () => {
    const langs = contactLanguageAlternates();
    expect(langs["x-default"]).toBe("/contact");
    expect(langs["en-US"]).toBe("/contact");
    expect(langs["de-DE"]).toBe("/de/contact");
    expect(Object.keys(langs)).toHaveLength(SUPPORTED_LOCALES.length + 1);
  });
});

describe("localeFaqPath / faqLanguageAlternates", () => {
  it("serves /faq for the default and /{slug}/faq for others", () => {
    expect(localeFaqPath("en-US")).toBe("/faq");
    expect(localeFaqPath("fr-FR")).toBe("/fr/faq");
    expect(localeFaqPath("ja-JP")).toBe("/ja/faq");
    expect(localeFaqPath("xx-XX")).toBe("/faq");
  });
  it("maps every locale plus x-default", () => {
    const langs = faqLanguageAlternates();
    expect(langs["x-default"]).toBe("/faq");
    expect(langs["en-US"]).toBe("/faq");
    expect(langs["de-DE"]).toBe("/de/faq");
    expect(Object.keys(langs)).toHaveLength(SUPPORTED_LOCALES.length + 1);
  });
});

describe("localeAccessibilityPath / accessibilityLanguageAlternates", () => {
  it("serves /accessibility for the default and /{slug}/accessibility for others", () => {
    expect(localeAccessibilityPath("en-US")).toBe("/accessibility");
    expect(localeAccessibilityPath("fr-FR")).toBe("/fr/accessibility");
    expect(localeAccessibilityPath("ja-JP")).toBe("/ja/accessibility");
    expect(localeAccessibilityPath("xx-XX")).toBe("/accessibility");
  });
  it("maps every locale plus x-default", () => {
    const langs = accessibilityLanguageAlternates();
    expect(langs["x-default"]).toBe("/accessibility");
    expect(langs["en-US"]).toBe("/accessibility");
    expect(langs["de-DE"]).toBe("/de/accessibility");
    expect(Object.keys(langs)).toHaveLength(SUPPORTED_LOCALES.length + 1);
  });
});

describe("localePrinciplesPath / principlesLanguageAlternates", () => {
  it("serves /principles for the default and /{slug}/principles for others", () => {
    expect(localePrinciplesPath("en-US")).toBe("/principles");
    expect(localePrinciplesPath("fr-FR")).toBe("/fr/principles");
    expect(localePrinciplesPath("ja-JP")).toBe("/ja/principles");
    expect(localePrinciplesPath("xx-XX")).toBe("/principles");
  });
  it("maps every locale plus x-default", () => {
    const langs = principlesLanguageAlternates();
    expect(langs["x-default"]).toBe("/principles");
    expect(langs["en-US"]).toBe("/principles");
    expect(langs["de-DE"]).toBe("/de/principles");
    expect(Object.keys(langs)).toHaveLength(SUPPORTED_LOCALES.length + 1);
  });
});

describe("localeFairPath / fairLanguageAlternates", () => {
  it("serves /fair for the default and /{slug}/fair for others", () => {
    expect(localeFairPath("en-US")).toBe("/fair");
    expect(localeFairPath("fr-FR")).toBe("/fr/fair");
    expect(localeFairPath("ja-JP")).toBe("/ja/fair");
    expect(localeFairPath("xx-XX")).toBe("/fair");
  });
  it("maps every locale plus x-default", () => {
    const langs = fairLanguageAlternates();
    expect(langs["x-default"]).toBe("/fair");
    expect(langs["en-US"]).toBe("/fair");
    expect(langs["de-DE"]).toBe("/de/fair");
    expect(Object.keys(langs)).toHaveLength(SUPPORTED_LOCALES.length + 1);
  });
});

describe("localeTransparencyPath / transparencyLanguageAlternates", () => {
  it("serves /transparency for the default and /{slug}/transparency for others", () => {
    expect(localeTransparencyPath("en-US")).toBe("/transparency");
    expect(localeTransparencyPath("fr-FR")).toBe("/fr/transparency");
    expect(localeTransparencyPath("ja-JP")).toBe("/ja/transparency");
    expect(localeTransparencyPath("xx-XX")).toBe("/transparency");
  });
  it("maps every locale plus x-default", () => {
    const langs = transparencyLanguageAlternates();
    expect(langs["x-default"]).toBe("/transparency");
    expect(langs["en-US"]).toBe("/transparency");
    expect(langs["de-DE"]).toBe("/de/transparency");
    expect(Object.keys(langs)).toHaveLength(SUPPORTED_LOCALES.length + 1);
  });
});

describe("ogLocale", () => {
  it("underscores the BCP-47 tag and falls back to en", () => {
    expect(ogLocale("fr-FR")).toBe("fr_FR");
    expect(ogLocale("pt-BR")).toBe("pt_BR");
    expect(ogLocale("xx")).toBe("en_US");
  });
});

describe("ogAlternateLocales", () => {
  it("lists every locale except the current one", () => {
    const alts = ogAlternateLocales("en-US");
    expect(alts).toContain("fr_FR");
    expect(alts).not.toContain("en_US");
    expect(alts).toHaveLength(SUPPORTED_LOCALES.length - 1);
  });
  it("defaults to excluding the default locale", () => {
    expect(ogAlternateLocales()).not.toContain("en_US");
  });
});
