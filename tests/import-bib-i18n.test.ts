import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { importBibStrings, type ImportBibStrings } from "@/lib/i18n/importBib";

/**
 * Guards the editor "Import a .bib file" copy. Typing forces every locale/field to
 * exist; these checks pin non-emptiness, the EN fallback, actual translation, the
 * BibTeX/Zotero/Mendeley/JabRef proper nouns, and — load-bearing — that the
 * `result` template keeps its `{added}`/`{duplicates}`/`{skipped}` placeholders so
 * the component's substitution works in every locale.
 */
describe("importBibStrings", () => {
  it("defines non-empty strings for every field in all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      const s: ImportBibStrings = importBibStrings(loc);
      for (const value of Object.values(s)) {
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(importBibStrings("xx-XX")).toEqual(importBibStrings("en-US"));
  });

  it("actually translates non-English locales", () => {
    expect(importBibStrings("fr-FR").label).not.toBe(importBibStrings("en-US").label);
  });

  it("keeps brand nouns and result placeholders intact in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = importBibStrings(loc);
      for (const brand of ["BibTeX", "Zotero", "Mendeley", "JabRef"]) {
        expect(s.note).toContain(brand);
      }
      for (const token of ["{added}", "{duplicates}", "{skipped}"]) {
        expect(s.result).toContain(token);
      }
    }
  });
});
