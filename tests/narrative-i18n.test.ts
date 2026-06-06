import { describe, expect, it } from "vitest";
import { NARRATIVE_MODULE_KEYS } from "@/lib/canonical/schema";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import {
  defaultNarrativeModules,
  narrativeModuleStrings,
  narrativeStrings,
} from "@/lib/i18n/narrative";

describe("narrative i18n", () => {
  it("defines a non-empty heading + prompt for every module key in all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      const strings = narrativeStrings(loc);
      for (const key of NARRATIVE_MODULE_KEYS) {
        expect(strings[key].heading.length).toBeGreaterThan(0);
        expect(strings[key].prompt.length).toBeGreaterThan(0);
      }
      // Exactly the six module keys, no extras/missing.
      expect(Object.keys(strings).sort()).toEqual([...NARRATIVE_MODULE_KEYS].sort());
    }
  });

  it("uses the standard funder framings in English", () => {
    const en = narrativeStrings("en-US");
    expect(en["personal-statement"].heading).toBe("Personal statement");
    expect(en.knowledge.heading).toBe("Contributions to the generation of knowledge");
    expect(en.individuals.heading).toBe("Contributions to the development of individuals");
    expect(en.community.heading).toBe("Contributions to the wider research community");
    expect(en.society.heading).toBe("Contributions to broader society");
    expect(en.additional.heading).toBe("Additional information");
  });

  it("falls back to English for an unknown locale", () => {
    expect(narrativeStrings("xx-XX")["personal-statement"].heading).toBe(
      narrativeStrings("en-US")["personal-statement"].heading,
    );
    expect(narrativeModuleStrings("zz-ZZ", "society").heading).toBe(
      "Contributions to broader society",
    );
  });

  it("localizes headings per locale (proof of real translations)", () => {
    expect(narrativeStrings("fr-FR")["personal-statement"].heading).toBe(
      "Présentation personnelle",
    );
    expect(narrativeStrings("de-DE").knowledge.heading).toBe(
      "Beiträge zur Schaffung von Wissen",
    );
    expect(narrativeStrings("ja-JP").additional.heading).toBe("補足情報");
  });

  describe("defaultNarrativeModules", () => {
    it("seeds the six standard modules with localized headings, empty bodies, included", () => {
      const mods = defaultNarrativeModules("fr-FR");
      expect(mods).toHaveLength(NARRATIVE_MODULE_KEYS.length);
      expect(mods.map((m) => m.key)).toEqual([...NARRATIVE_MODULE_KEYS]);
      for (const m of mods) {
        expect(m.body).toBe("");
        expect(m.included).toBe(true);
        expect(m.heading.length).toBeGreaterThan(0);
      }
      expect(mods[0]!.heading).toBe("Présentation personnelle");
    });
  });
});
