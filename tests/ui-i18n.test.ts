import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { ui } from "@/lib/i18n/ui";

describe("ui() editor/chrome dictionary", () => {
  it("falls back to English for an unknown locale", () => {
    expect(ui("xx-XX").styleLegend).toBe("Style");
    expect(ui("xx-XX")).toBe(ui("en-US"));
  });

  it("localizes per locale", () => {
    expect(ui("fr-FR").styleLegend).toBe("Style");
    expect(ui("fr-FR").deleteAccount).toBe("Supprimer le compte");
    expect(ui("ja-JP").metricsLabel).toContain("指標");
    expect(ui("de-DE").publishPublic).toBe("Öffentliche Seite veröffentlichen");
    expect(ui("zh-CN").copyLink).toBe("复制链接");
  });

  it("discloses OAI-PMH harvesting in the indexing consent and names the affiliation opt-in, in every locale", () => {
    // The indexing consent is what gates the OAI-PMH endpoint: its copy must
    // name the endpoint (harvesting is not "Google"), and say that listing under
    // the institution is a SEPARATE choice. The opt-in's own copy must name the
    // ROR-keyed set and be labelled as self-declared, never institutional output.
    for (const loc of SUPPORTED_LOCALES) {
      const d = ui(loc);
      expect(d.allowIndexingBody).toContain("OAI-PMH");
      expect(d.allowIndexingBody).toContain("/api/oai");
      // Both harvest formats are named: Dublin Core and OpenAIRE (`oaire`).
      expect(d.allowIndexingBody).toContain("Dublin Core");
      expect(d.allowIndexingBody).toContain("OpenAIRE");
      expect(d.allowIndexingTitle).toContain("OAI-PMH");
      expect(d.listUnderAffiliationTitle).toContain("ror:<id>");
      expect(d.listUnderAffiliationBody).toContain("OAI-PMH");
      expect(d.listUnderAffiliationBody).toContain("ROR");
      expect(d.listUnderAffiliationNoRor).toContain("ROR");
      // Distinct strings — the opt-in is not a restatement of the indexing toggle.
      expect(d.listUnderAffiliation).not.toBe(d.allowIndexing);
    }
  });

  it("defines every UI string for all 10 locales (no untranslated gaps)", () => {
    const keys = Object.keys(ui("en-US")) as (keyof ReturnType<typeof ui>)[];
    expect(keys.length).toBeGreaterThan(70);
    for (const loc of SUPPORTED_LOCALES) {
      const dict = ui(loc);
      for (const key of keys) {
        expect(dict[key].length).toBeGreaterThan(0);
      }
    }
  });
});
