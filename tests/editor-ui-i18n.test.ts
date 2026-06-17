import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { editorUi, type EditorExtraStrings } from "@/lib/i18n/editorUi";

describe("editorUi", () => {
  it("defines every editor-extra string for all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      const s = editorUi(loc);
      for (const value of Object.values(s)) {
        expect(typeof value).toBe("string");
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });

  it("falls back to English for an unknown locale", () => {
    const s = editorUi("xx-XX");
    const en = editorUi("en-US");
    expect(s).toEqual<EditorExtraStrings>(en);
    expect(s.tabPreview).toBe("Preview");
  });

  it("localizes a sample of keys", () => {
    expect(editorUi("fr-FR").tabPreview).toBe("Aperçu");
    expect(editorUi("de-DE").grpLook).toBe("Aussehen & Typografie");
    expect(editorUi("ja-JP").feTitle).toBe("タイトル");
  });
});
