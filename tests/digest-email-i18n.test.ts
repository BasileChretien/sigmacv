import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { digestEmail, type DigestEmailStrings } from "@/lib/i18n/digestEmail";

describe("digestEmail i18n", () => {
  it("defines every digest string for all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      const s = digestEmail(loc);
      for (const value of Object.values(s)) {
        expect(typeof value).toBe("string");
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the {n} placeholder in every count-bearing string", () => {
    const countKeys: Array<keyof DigestEmailStrings> = [
      "dgSubject",
      "dgAdded",
      "dgReview",
      "dgRemoved",
      "dgMore",
    ];
    for (const loc of SUPPORTED_LOCALES) {
      const s = digestEmail(loc);
      for (const key of countKeys) {
        expect(s[key], `${loc} ${key}`).toContain("{n}");
      }
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(digestEmail("xx-XX")).toEqual<DigestEmailStrings>(digestEmail("en-US"));
  });
});
