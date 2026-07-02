import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { sourceProvenanceStrings, type SourceProvenanceStrings } from "@/lib/i18n/sourceProvenance";

/**
 * Guards the provenance-panel chrome. Typing forces every locale/field; these pin
 * non-emptiness, the EN fallback, actual translation, and that the `{items}` /
 * `{sources}` substitution tokens survive in every locale's summary line.
 */
describe("sourceProvenanceStrings", () => {
  it("defines non-empty strings for every field in all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      const s: SourceProvenanceStrings = sourceProvenanceStrings(loc);
      for (const value of Object.values(s)) {
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(sourceProvenanceStrings("xx-XX")).toEqual(sourceProvenanceStrings("en-US"));
  });

  it("actually translates non-English locales", () => {
    expect(sourceProvenanceStrings("fr-FR").title).not.toBe(sourceProvenanceStrings("en-US").title);
  });

  it("keeps the {items} and {sources} tokens in every locale's summary", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const { summary } = sourceProvenanceStrings(loc);
      expect(summary).toContain("{items}");
      expect(summary).toContain("{sources}");
    }
  });
});
