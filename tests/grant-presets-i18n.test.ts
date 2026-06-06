import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { GRANT_PRESET_IDS } from "@/lib/canonical/grantPresets";
import {
  grantPresetLabel,
  grantPresetList,
  grantPresetStrings,
} from "@/lib/i18n/grantPresets";
import { editorUi } from "@/lib/i18n/editorUi";

describe("grant-preset i18n", () => {
  it("defines a non-empty name + description for both presets in all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      const strings = grantPresetStrings(loc);
      for (const id of GRANT_PRESET_IDS) {
        expect(strings[id].name.length, `${loc}/${id} name`).toBeGreaterThan(0);
        expect(
          strings[id].description.length,
          `${loc}/${id} description`,
        ).toBeGreaterThan(0);
      }
      // Exactly the two preset ids, no extras/missing.
      expect(Object.keys(strings).sort()).toEqual([...GRANT_PRESET_IDS].sort());
    }
  });

  it("every description carries the funder-portal caveat in all 10 locales", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const strings = grantPresetStrings(loc);
      for (const id of GRANT_PRESET_IDS) {
        // The portal name is a proper noun kept untranslated in every locale.
        expect(
          strings[id].description,
          `${loc}/${id} mentions the EU portal`,
        ).toContain("EU Funding & Tenders");
      }
    }
  });

  it("uses the expected English names + ERC framing", () => {
    const en = grantPresetStrings("en-US");
    expect(en.erc.name).toBe("ERC");
    expect(en.msca.name).toBe("MSCA");
    expect(en.erc.description).toContain("ERC");
    expect(en.msca.description).toContain("MSCA Postdoctoral Fellowships");
  });

  it("falls back to English for an unknown locale", () => {
    expect(grantPresetStrings("xx-XX").erc.name).toBe(
      grantPresetStrings("en-US").erc.name,
    );
    expect(grantPresetLabel("zz-ZZ", "msca").description).toBe(
      grantPresetStrings("en-US").msca.description,
    );
  });

  it("grantPresetList returns both presets in catalog order with labels", () => {
    const list = grantPresetList("en-US");
    expect(list.map((p) => p.id)).toEqual([...GRANT_PRESET_IDS]);
    expect(list[0]!.name).toBe("ERC");
    expect(list[0]!.description.length).toBeGreaterThan(0);
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
});
