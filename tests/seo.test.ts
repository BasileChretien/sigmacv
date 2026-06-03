import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import {
  aboutLanguageAlternates,
  homeLanguageAlternates,
  localeAboutPath,
  localeHomePath,
  ogAlternateLocales,
  ogLocale,
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
