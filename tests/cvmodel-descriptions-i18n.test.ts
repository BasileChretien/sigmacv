import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { cvModelList } from "@/lib/canonical/cvModels";
import { cvModelDescription } from "@/lib/i18n/cvModelDescriptions";

describe("CV-model description i18n", () => {
  const models = cvModelList();

  it("covers all 58 models × 10 locales with a non-empty description", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    expect(models).toHaveLength(58);
    for (const m of models) {
      for (const loc of SUPPORTED_LOCALES) {
        expect(cvModelDescription(m.id, loc).length, `${loc}/${m.id}`).toBeGreaterThan(0);
      }
    }
  });

  it("en-US returns the catalog description verbatim (English is the source of truth)", () => {
    for (const m of models) {
      expect(cvModelDescription(m.id, "en-US"), m.id).toBe(m.description);
    }
  });

  it("falls back to English for an unsupported / empty locale", () => {
    for (const id of ["erc", "nih", "gcp-investigator", "heor"]) {
      const en = cvModelDescription(id, "en-US");
      expect(cvModelDescription(id, "xx-XX"), `${id} unknown locale`).toBe(en);
      expect(cvModelDescription(id, ""), `${id} empty locale`).toBe(en);
    }
  });

  it("returns an empty string for an unknown model id", () => {
    expect(cvModelDescription("does-not-exist", "en-US")).toBe("");
    expect(cvModelDescription("does-not-exist", "fr-FR")).toBe("");
  });

  // Funder / form / standard proper nouns are kept UNTRANSLATED in every locale
  // (same policy as the catalog `name` + `titleOverrides`).
  it("keeps funder / form proper nouns verbatim across all 10 locales", () => {
    const KEEP: Record<string, readonly string[]> = {
      erc: ["European Research Council", "EU Funding & Tenders"],
      nsf: ["SciENcv", "Research.gov", "Professional Preparation"],
      jsps: ["JSPS", "KAKENHI", "researchmap", "e-Rad"],
      snsf: ["SciCV", "DORA"],
      "gcp-investigator": ["ICH-GCP", "FDA Form 1572"],
      rirekisho: ["履歴書"],
      shokumu: ["職務経歴書", "JREC-IN"],
    };
    for (const [id, needles] of Object.entries(KEEP)) {
      for (const loc of SUPPORTED_LOCALES) {
        const d = cvModelDescription(id, loc);
        for (const needle of needles) {
          expect(d, `${loc}/${id} keeps “${needle}”`).toContain(needle);
        }
      }
    }
  });

  // Spot-check genuine native translations (distinct scripts + languages), so a
  // regression to English placeholders is caught.
  it("provides genuine native translations (spot checks)", () => {
    // French ERC — real French prose around the kept proper nouns.
    expect(cvModelDescription("erc", "fr-FR")).toContain("publications représentatives");
    // Japanese JSPS.
    expect(cvModelDescription("jsps", "ja-JP")).toContain("研究業績");
    // Simplified-Chinese HEOR.
    expect(cvModelDescription("heor", "zh-CN")).toContain("卫生经济学");
    // German Europass.
    expect(cvModelDescription("europass", "de-DE")).toContain("Berufserfahrung");
    // Russian SNSF.
    expect(cvModelDescription("snsf", "ru-RU")).toContain("Нарративный формат");
    // Korean pharmacovigilance.
    expect(cvModelDescription("pharmacovigilance", "ko-KR")).toContain("약물감시");
    // Spanish Europass differs from the English source.
    expect(cvModelDescription("europass", "es-ES")).not.toBe(
      cvModelDescription("europass", "en-US"),
    );
  });
});
