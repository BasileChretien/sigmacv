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

  it("the institution-page consent states what appears, that absence means nothing, and that withdrawal is immediate, in every locale", () => {
    // One distinctive word per SENTENCE of the consent body, per locale, so a
    // dropped sentence fails here rather than passing on "ORCID" alone:
    // [what appears + counted in the figures, only counts where OpenAlex
    // differs, pinned to what you tick, a kept listing resumes, voluntary /
    // absence means nothing, withdrawal is immediate].
    const SENTENCES: Record<string, [string, string, string, string, string, string]> = {
      "en-US": ["figures", "OpenAlex", "Pinned", "resumes", "voluntary", "withdraw"],
      "zh-CN": ["统计", "OpenAlex", "勾选", "恢复", "自愿", "撤回"],
      "es-ES": ["cifras", "OpenAlex", "marques", "reanuda", "voluntario", "retirarlo"],
      "fr-FR": ["chiffres", "OpenAlex", "cochez", "reprend", "volontaire", "retirer"],
      "de-DE": ["Zahlen", "OpenAlex", "ankreuzen", "fortgesetzt", "freiwillig", "widerrufen"],
      "ja-JP": ["集計", "OpenAlex", "チェック", "再開", "任意", "撤回"],
      "pt-BR": ["números", "OpenAlex", "marcar", "retomada", "voluntário", "retirar"],
      "it-IT": ["cifre", "OpenAlex", "spunti", "riprende", "volontario", "revocare"],
      "ko-KR": ["집계", "OpenAlex", "선택한", "재개", "자발적", "철회"],
      "ru-RU": ["показателях", "OpenAlex", "отметите", "возобновляется", "добровольно", "отозвать"],
    };
    expect(Object.keys(SENTENCES).sort()).toEqual([...SUPPORTED_LOCALES].sort());
    for (const loc of SUPPORTED_LOCALES) {
      const d = ui(loc);
      // What appears: name, ORCID iD, position, works — and where counts come from.
      expect(d.showOnInstitutionPageBody).toContain("ORCID");
      expect(d.showOnInstitutionPageBody).toContain("SigmaCV");
      for (const word of SENTENCES[loc]!) expect(d.showOnInstitutionPageBody).toContain(word);
      // The figures are named (how many list it, open-access status), and the
      // OLD "counts only where … differ" reading is gone from the English.
      if (loc === "en-US") {
        expect(d.showOnInstitutionPageBody).toContain("open-access");
        expect(d.showOnInstitutionPageBody).toContain("only counts are shown");
        expect(d.showOnInstitutionPageBody).not.toContain("counts only where");
      }
      // fr-FR: OpenAlex's data, not its "register".
      if (loc === "fr-FR") {
        expect(d.showOnInstitutionPageBody).toContain("les données d'OpenAlex");
        expect(d.showOnInstitutionPageBody).not.toContain("registre");
      }
      expect(d.showOnInstitutionPageTitle).toContain("/i/<ROR id>");
      // The one-click, armed and kept-id lines carry their placeholders.
      expect(d.institutionPageSingle).toContain("{institution}");
      expect(d.institutionPageLapsedKept).toContain("ROR {rorId}");
      expect(d.institutionPageArmedHint.length).toBeGreaterThan(0);
      expect(d.institutionPageRemove.length).toBeGreaterThan(0);
      // The picker + re-ask lines carry the institution-name placeholder.
      expect(d.institutionPageListedUnder).toContain("{institutions}");
      expect(d.institutionPageLapsed).toContain("{institutions}");
      expect(d.institutionPageLapsedNone).toContain("ROR");
      expect(d.institutionPageUnavailable).toContain("ROR");
      // A fourth consent, not a restatement of the OAI listing.
      expect(d.showOnInstitutionPage).not.toBe(d.listUnderAffiliation);
      expect(d.showOnInstitutionPageBody).not.toBe(d.listUnderAffiliationBody);
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
