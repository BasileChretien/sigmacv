import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { publishNudgeStrings } from "@/lib/i18n/publishNudge";

describe("publish nudge i18n", () => {
  it("defines complete copy for all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      const s = publishNudgeStrings(loc);
      for (const v of [s.title, s.body, s.cta, s.dismiss]) {
        expect(v.length).toBeGreaterThan(0);
      }
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(publishNudgeStrings("xx-XX")).toEqual(publishNudgeStrings("en-US"));
  });

  it("actually translates non-English locales", () => {
    expect(publishNudgeStrings("fr-FR").cta).not.toBe(publishNudgeStrings("en-US").cta);
    expect(publishNudgeStrings("de-DE").title).not.toBe(publishNudgeStrings("en-US").title);
  });
});
