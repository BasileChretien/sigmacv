import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { narrativeGuidance } from "@/lib/i18n/narrativeGuidance";

const NARRATIVE = [
  "narrative-knowledge",
  "narrative-individuals",
  "narrative-community",
  "narrative-society",
] as const;

describe("narrativeGuidance", () => {
  it("provides a non-empty prompt for each narrative module in all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      for (const type of NARRATIVE) {
        const g = narrativeGuidance(loc, type);
        expect(g, `${loc}/${type}`).toBeTruthy();
        expect((g ?? "").trim().length, `${loc}/${type}`).toBeGreaterThan(20);
      }
    }
  });

  it("returns undefined for non-narrative section types (no prompt forced on them)", () => {
    expect(narrativeGuidance("en-US", "statement")).toBeUndefined();
    expect(narrativeGuidance("en-US", "publications")).toBeUndefined();
    expect(narrativeGuidance("en-US", "positions")).toBeUndefined();
  });

  it("falls back to English for an unknown locale", () => {
    expect(narrativeGuidance("xx-XX", "narrative-knowledge")).toBe(
      narrativeGuidance("en-US", "narrative-knowledge"),
    );
  });
});
