import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { badgeUi, type BadgeUiStrings } from "@/lib/i18n/badgeUi";

const KEYS: (keyof BadgeUiStrings)[] = [
  "heading",
  "intro",
  "styleLabel",
  "themeLabel",
  "styleStandard",
  "styleCompact",
  "styleCard",
  "themeAuto",
  "themeLight",
  "themeDark",
  "copyMarkdown",
  "copyHtml",
  "copyLink",
  "previewAlt",
];

describe("badge panel i18n", () => {
  it("defines complete copy for all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      const s = badgeUi(loc);
      for (const k of KEYS) expect(s[k].length).toBeGreaterThan(0);
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(badgeUi("xx-XX")).toEqual(badgeUi("en-US"));
  });

  it("actually translates non-English locales", () => {
    expect(badgeUi("fr-FR").heading).not.toBe(badgeUi("en-US").heading);
    expect(badgeUi("ja-JP").intro).not.toBe(badgeUi("en-US").intro);
  });
});
