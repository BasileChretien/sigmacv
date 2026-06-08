import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { GRANT_PRESET_IDS } from "@/lib/canonical/cvModels";
import { grantPresetLabel, grantPresetList, grantPresetStrings } from "@/lib/i18n/grantPresets";
import { editorUi } from "@/lib/i18n/editorUi";

describe("grant-preset i18n", () => {
  it("defines a non-empty name + description for all four presets in all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      const strings = grantPresetStrings(loc);
      for (const id of GRANT_PRESET_IDS) {
        expect(strings[id].name.length, `${loc}/${id} name`).toBeGreaterThan(0);
        expect(strings[id].description.length, `${loc}/${id} description`).toBeGreaterThan(0);
      }
      // Exactly the four preset ids, no extras/missing.
      expect(Object.keys(strings).sort()).toEqual([...GRANT_PRESET_IDS].sort());
    }
  });

  // Each preset routes to its own funder portal — the proper noun is kept
  // untranslated in every locale, so a substring check works across all ten.
  const PORTAL_CAVEAT: Record<(typeof GRANT_PRESET_IDS)[number], string> = {
    erc: "EU Funding & Tenders",
    msca: "EU Funding & Tenders",
    nsf: "SciENcv",
    jsps: "e-Rad",
  };

  it("every description carries its own funder-portal caveat in all 10 locales", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const strings = grantPresetStrings(loc);
      for (const id of GRANT_PRESET_IDS) {
        expect(strings[id].description, `${loc}/${id} mentions its funder portal`).toContain(
          PORTAL_CAVEAT[id],
        );
      }
    }
  });

  it("uses the expected English names + framing for all four funders", () => {
    const en = grantPresetStrings("en-US");
    expect(en.erc.name).toBe("ERC");
    expect(en.msca.name).toBe("MSCA");
    expect(en.nsf.name).toBe("NSF");
    expect(en.jsps.name).toBe("JSPS");
    expect(en.erc.description).toContain("ERC");
    expect(en.msca.description).toContain("MSCA Postdoctoral Fellowships");
    expect(en.nsf.description).toContain("SciENcv");
    expect(en.nsf.description).toContain("Research.gov");
    expect(en.jsps.description).toContain("KAKENHI");
    expect(en.jsps.description).toContain("researchmap");
  });

  it("falls back to English for an unknown locale", () => {
    expect(grantPresetStrings("xx-XX").erc.name).toBe(grantPresetStrings("en-US").erc.name);
    expect(grantPresetLabel("zz-ZZ", "msca").description).toBe(
      grantPresetStrings("en-US").msca.description,
    );
  });

  it("grantPresetList returns all four presets in catalog order with labels", () => {
    const list = grantPresetList("en-US");
    expect(list.map((p) => p.id)).toEqual([...GRANT_PRESET_IDS]);
    expect(list.map((p) => p.name)).toEqual(["ERC", "MSCA", "NSF", "JSPS"]);
    for (const p of list) expect(p.description.length).toBeGreaterThan(0);
  });

  it("the editor control labels exist in every locale (legend, intro, apply)", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const eu = editorUi(loc);
      expect(eu.grantLegend.length, `${loc} grantLegend`).toBeGreaterThan(0);
      expect(eu.grantIntro.length, `${loc} grantIntro`).toBeGreaterThan(0);
      // The apply label interpolates the preset name.
      expect(eu.grantApply, `${loc} grantApply`).toContain("{name}");
    }
  });

  it("the CV-model picker chrome exists in every locale (legend, apply, snapshot, 3 optgroups)", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const eu = editorUi(loc);
      expect(eu.modelLegend.length, `${loc} modelLegend`).toBeGreaterThan(0);
      expect(eu.modelApply.length, `${loc} modelApply`).toBeGreaterThan(0);
      expect(eu.modelSnapshot.length, `${loc} modelSnapshot`).toBeGreaterThan(0);
      expect(eu.modelGrpGrant.length, `${loc} modelGrpGrant`).toBeGreaterThan(0);
      expect(eu.modelGrpInstitution.length, `${loc} modelGrpInstitution`).toBeGreaterThan(0);
      expect(eu.modelGrpIndustry.length, `${loc} modelGrpIndustry`).toBeGreaterThan(0);
    }
  });
});
