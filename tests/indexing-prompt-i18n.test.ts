import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { indexingPromptStrings } from "@/lib/i18n/indexingPrompt";
import { workspaceUi } from "@/lib/i18n/workspaceUi";

describe("indexingPromptStrings", () => {
  it("has every field non-empty for all 10 locales and falls back to English", () => {
    for (const loc of SUPPORTED_LOCALES) {
      for (const [k, v] of Object.entries(indexingPromptStrings(loc))) {
        expect(v.length, `${loc}.${k}`).toBeGreaterThan(0);
      }
      const wu = workspaceUi(loc);
      for (const k of ["wlIndexingHeading", "wlIndexingHelp", "wlIndexingUndecided", "wlIndexingOff", "wlIndexingOn"] as const) {
        expect(wu[k].length, `${loc}.${k}`).toBeGreaterThan(0);
      }
    }
    expect(indexingPromptStrings("xx-XX")).toEqual(indexingPromptStrings("en-US"));
    expect(indexingPromptStrings("de-DE").yes).not.toBe(indexingPromptStrings("en-US").yes);
  });

  it("names the OAI-PMH harvest an indexable page allows, and keeps the institution listing separate", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = indexingPromptStrings(loc);
      expect(s.what).toContain("OAI-PMH");
      expect(s.what).toContain("SigmaCV");
      expect(s.separate.length).toBeGreaterThan(10);
      // "Not now" is a real option, never phrased as a loss.
      expect(s.notNow).not.toMatch(/\?|!/);
    }
  });
});
