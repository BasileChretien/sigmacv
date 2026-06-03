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
    const de = getLocaleXml("de-DE");
    expect(en).not.toBe(fr);
    expect(en).not.toBe(ja);
    expect(en).not.toBe(de);
    expect(fr).not.toBe(ja);
    // Sanity: each is a CSL locale document.
    for (const xml of [en, fr, ja, de]) {
      expect(xml).toContain("<locale");
    }
  });

  it("matches on the primary language subtag (e.g. 'fr' -> fr-FR)", () => {
    expect(getLocaleXml("fr")).toBe(getLocaleXml("fr-FR"));
    expect(getLocaleXml("ja")).toBe(getLocaleXml("ja-JP"));
    expect(getLocaleXml("de")).toBe(getLocaleXml("de-DE"));
    expect(getLocaleXml("ko")).toBe(getLocaleXml("ko-KR"));
  });

  it("falls back to en-US for an unbundled locale and for no argument", () => {
    const en = getLocaleXml("en-US");
    expect(getLocaleXml("nl-NL")).toBe(en); // Dutch is not bundled
    expect(getLocaleXml("xx-XX")).toBe(en);
    expect(getLocaleXml()).toBe(en);
  });

  it("exposes the bundled locale set (all 10 academic languages)", () => {
    expect(BUNDLED_LOCALES).toHaveLength(10);
    for (const loc of ["en-US", "fr-FR", "ja-JP", "zh-CN", "ru-RU"]) {
      expect(BUNDLED_LOCALES).toContain(loc);
    }
  });
});
