import { describe, expect, it } from "vitest";
import {
  BUNDLED_LOCALES,
  getLocaleXml,
  listAvailableStyles,
} from "@/lib/citeproc/assets";

// These assert against the vendored locale XML (committed by fetch-csl).
const vendored = listAvailableStyles().length > 0;

describe.skipIf(!vendored)("getLocaleXml (vendored CSL locales)", () => {
  it("returns distinct XML for each bundled locale", () => {
    const en = getLocaleXml("en-US");
    const fr = getLocaleXml("fr-FR");
    const ja = getLocaleXml("ja-JP");
    expect(en).not.toBe(fr);
    expect(en).not.toBe(ja);
    expect(fr).not.toBe(ja);
    // Sanity: each is a CSL locale document.
    for (const xml of [en, fr, ja]) {
      expect(xml).toContain("<locale");
    }
  });

  it("matches on the primary language subtag (e.g. 'fr' -> fr-FR)", () => {
    expect(getLocaleXml("fr")).toBe(getLocaleXml("fr-FR"));
    expect(getLocaleXml("ja")).toBe(getLocaleXml("ja-JP"));
  });

  it("falls back to en-US for an unknown locale and for no argument", () => {
    const en = getLocaleXml("en-US");
    expect(getLocaleXml("de-DE")).toBe(en);
    expect(getLocaleXml()).toBe(en);
  });

  it("exposes the bundled locale set", () => {
    expect(BUNDLED_LOCALES).toContain("en-US");
    expect(BUNDLED_LOCALES).toContain("fr-FR");
    expect(BUNDLED_LOCALES).toContain("ja-JP");
  });
});
