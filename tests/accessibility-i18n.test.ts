import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { accessibilityStrings } from "@/lib/i18n/accessibility";

describe("accessibilityStrings", () => {
  it("localizes the Accessibility page and falls back to English", () => {
    expect(accessibilityStrings("en-US").heading).toBe("Accessibility");
    expect(accessibilityStrings("fr-FR").heading).toBe("Accessibilité");
    expect(accessibilityStrings("ja-JP").metaTitle).toBe("アクセシビリティ");
    expect(accessibilityStrings("xx-XX").heading).toBe(accessibilityStrings("en-US").heading);
  });

  it("has every field non-empty for all 10 locales", () => {
    for (const loc of SUPPORTED_LOCALES) {
      for (const value of Object.values(accessibilityStrings(loc))) {
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("cites the WCAG 2.1 conformance target in every locale's intro", () => {
    for (const loc of SUPPORTED_LOCALES) {
      expect(accessibilityStrings(loc).intro).toContain("WCAG");
    }
  });
});
