import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { workspaceUi, type WorkspaceUiStrings } from "@/lib/i18n/workspaceUi";

describe("workspaceUi", () => {
  it("defines every workspace string for all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      const s = workspaceUi(loc);
      for (const value of Object.values(s)) {
        expect(typeof value).toBe("string");
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the {n} placeholder in every count-bearing string", () => {
    const countKeys: Array<keyof WorkspaceUiStrings> = [
      "srInitial",
      "srAdded",
      "srRemoved",
      "srReview",
      "hpReview",
      "hpDuplicates",
      "hpConflicts",
      "hpRetracted",
      "bulkSelectAll",
      "bulkSelected",
    ];
    for (const loc of SUPPORTED_LOCALES) {
      const s = workspaceUi(loc);
      for (const key of countKeys) {
        expect(s[key], `${loc} ${key}`).toContain("{n}");
      }
    }
  });

  it("falls back to English for an unknown locale", () => {
    const s = workspaceUi("xx-XX");
    expect(s).toEqual<WorkspaceUiStrings>(workspaceUi("en-US"));
    expect(s.bulkDone).toBe("Done");
  });

  it("localizes a sample of keys", () => {
    expect(workspaceUi("fr-FR").srLastSync).toBe("Dernière synchronisation");
    expect(workspaceUi("ja-JP").bulkSelect).toBe("複数選択");
    expect(workspaceUi("de-DE").bulkDone).toBe("Fertig");
  });
});
