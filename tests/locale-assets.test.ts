import { describe, expect, it } from "vitest";
import {
  BUNDLED_LOCALES,
  __customStyleCacheSize,
  __resetCustomStyleCache,
  getLocaleXml,
  getStyleXml,
  listAvailableStyles,
  registerStyleXml,
} from "@/lib/citeproc/assets";

describe("registerStyleXml — custom-style cache is bounded (LRU)", () => {
  it("evicts oldest entries under a flood of distinct custom styles", () => {
    __resetCustomStyleCache();
    for (let i = 0; i < 300; i++) registerStyleXml(`evict-${i}`, `<style>${i}</style>`);
    // The cache is hard-bounded (no unbounded heap growth)…
    expect(__customStyleCacheSize()).toBeLessThanOrEqual(256);
    // …and still accepts/serves the most-recent style.
    expect(getStyleXml("evict-299")).toBe("<style>299</style>");
    __resetCustomStyleCache();
  });
});

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
