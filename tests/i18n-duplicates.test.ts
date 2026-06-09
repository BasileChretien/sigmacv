import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { dupReasonText, dupStrings } from "@/lib/i18n/duplicates";
import { DUPLICATE_RELATIONSHIPS, DUPLICATE_TIERS } from "@/lib/canonical/schema";

describe("dupStrings", () => {
  it("defines every key, non-empty, for all ten locales", () => {
    const keys = Object.keys(dupStrings("en-US")) as Array<keyof ReturnType<typeof dupStrings>>;
    for (const loc of SUPPORTED_LOCALES) {
      const s = dupStrings(loc);
      for (const k of keys) {
        expect(typeof s[k]).toBe("string");
        expect(s[k].length).toBeGreaterThan(0);
      }
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(dupStrings("xx-YY")).toEqual(dupStrings("en-US"));
  });

  it("keeps the {n} placeholder in the summary string for every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      expect(dupStrings(loc).summary).toContain("{n}");
    }
  });
});

describe("dupReasonText", () => {
  it("returns a relationship-specific phrase for each typed relationship", () => {
    const en = dupStrings("en-US");
    expect(dupReasonText("en-US", "strong", "preprint-of")).toBe(en.relPreprintOf);
    expect(dupReasonText("en-US", "strong", "published-version-of")).toBe(en.relPublishedVersionOf);
    expect(dupReasonText("en-US", "related", "version-of")).toBe(en.relVersionOf);
    expect(dupReasonText("en-US", "weak", "translation-of")).toBe(en.relTranslationOf);
    expect(dupReasonText("en-US", "weak", "erratum-of")).toBe(en.relErratumOf);
  });

  it("falls back to a tier phrase when there is no specific relationship", () => {
    const en = dupStrings("en-US");
    expect(dupReasonText("en-US", "exact", "same-work")).toBe(en.tierExact);
    expect(dupReasonText("en-US", "strong", undefined)).toBe(en.tierStrong);
    expect(dupReasonText("en-US", "related", "same-work")).toBe(en.relSameWork);
    expect(dupReasonText("en-US", "weak", undefined)).toBe(en.tierWeak);
  });

  it("produces a non-empty phrase for every tier × relationship × locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      for (const tier of DUPLICATE_TIERS) {
        for (const rel of [...DUPLICATE_RELATIONSHIPS, undefined]) {
          expect(dupReasonText(loc, tier, rel).length).toBeGreaterThan(0);
        }
      }
    }
  });
});
