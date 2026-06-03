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
