import { describe, expect, it } from "vitest";
import {
  asLocale,
  DEFAULT_UI_LOCALE,
  isDefaultSectionTitle,
  LOCALE_LABELS,
  reasonLabel,
  sectionTitle,
  SUPPORTED_LOCALES,
  t,
} from "@/lib/i18n";

describe("asLocale", () => {
  it("passes through supported locales", () => {
    expect(asLocale("fr-FR")).toBe("fr-FR");
    expect(asLocale("ja-JP")).toBe("ja-JP");
    expect(asLocale("en-US")).toBe("en-US");
  });
  it("falls back to the default for unknown / undefined", () => {
    expect(asLocale("de-DE")).toBe(DEFAULT_UI_LOCALE);
    expect(asLocale(undefined)).toBe(DEFAULT_UI_LOCALE);
    expect(asLocale("")).toBe(DEFAULT_UI_LOCALE);
  });
});

describe("LOCALE_LABELS", () => {
  it("has a native label for every supported locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      expect(LOCALE_LABELS[loc].length).toBeGreaterThan(0);
    }
    expect(LOCALE_LABELS["ja-JP"]).toBe("日本語");
  });
});

describe("t (chrome dictionary)", () => {
  it("translates a key per locale", () => {
    expect(t("en-US", "save")).toBe("Save");
    expect(t("fr-FR", "save")).toBe("Enregistrer");
    expect(t("ja-JP", "save")).toBe("保存");
  });
  it("falls back to English for an unknown locale", () => {
    expect(t("de-DE", "save")).toBe("Save");
  });
  it("resolves a spread of keys to a non-empty string in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      for (const k of ["save", "resync", "notMine", "noItems", "exportLabel"] as const) {
        expect(t(loc, k).length).toBeGreaterThan(0);
      }
    }
  });
});

describe("sectionTitle", () => {
  it("returns localized default headings", () => {
    expect(sectionTitle("en-US", "grants")).toBe("Grants & Funding");
    expect(sectionTitle("fr-FR", "grants")).toBe("Financements et bourses");
    expect(sectionTitle("ja-JP", "education")).toBe("学歴");
  });
  it("falls back to English for an unknown locale", () => {
    expect(sectionTitle("de-DE", "publications")).toBe("Publications");
  });
});

describe("isDefaultSectionTitle", () => {
  it("recognises a default heading in any locale", () => {
    expect(isDefaultSectionTitle("education", "Education")).toBe(true); // en
    expect(isDefaultSectionTitle("education", "Formation")).toBe(true); // fr
    expect(isDefaultSectionTitle("education", "学歴")).toBe(true); // ja
  });
  it("returns false for a genuine user rename", () => {
    expect(isDefaultSectionTitle("education", "My Degrees")).toBe(false);
  });
});

describe("reasonLabel", () => {
  it("localizes the not-mine reasons", () => {
    expect(reasonLabel("en-US", "duplicate")).toBe("Duplicate of another listed work");
    expect(reasonLabel("fr-FR", "duplicate")).toBe("Doublon d’une autre référence");
    expect(reasonLabel("ja-JP", "different-person")).toBe("別の研究者（同姓同名・ID の衝突）");
  });
});
