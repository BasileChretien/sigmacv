import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { searchStrings } from "@/lib/i18n/search";
import { previewStrings } from "@/lib/i18n/preview";

describe("searchStrings", () => {
  it("has every field non-empty for all 10 locales and falls back to English", () => {
    for (const loc of SUPPORTED_LOCALES) {
      for (const [k, v] of Object.entries(searchStrings(loc))) {
        expect(v.length, `${loc}.${k}`).toBeGreaterThan(0);
      }
    }
    expect(searchStrings("xx-XX")).toEqual(searchStrings("en-US"));
    expect(searchStrings("fr-FR").submit).not.toBe(searchStrings("en-US").submit);
  });

  it("keeps the brand names, names the identifier-only rule, and repeats the preview's promise verbatim", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = searchStrings(loc);
      expect(s.hint).toContain("OpenAlex");
      expect(s.hint).toContain("ORCID");
      expect(s.sourceNote).toContain("OpenAlex");
      expect(s.sourceNote).toContain("ORCID");
      expect(s.orcidMark).toBe("ORCID iD");
      // One promise, one wording: the search page and the preview banner agree.
      expect(s.promise).toBe(previewStrings(loc).promise);
    }
  });
});
