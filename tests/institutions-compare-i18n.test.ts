import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { institutionStrings } from "@/lib/i18n/institutions";
import { institutionCompareStrings } from "@/lib/i18n/institutionsCompare";

describe("institutionCompareStrings", () => {
  it("localizes and falls back to English", () => {
    expect(institutionCompareStrings("en-US").heading).toBe("Organisations side by side");
    expect(institutionCompareStrings("fr-FR").heading).toBe("Organismes côte à côte");
    expect(institutionCompareStrings("xx-XX")).toEqual(institutionCompareStrings("en-US"));
  });

  it("has every field non-empty and translated in all 10 locales", () => {
    const en = institutionCompareStrings("en-US");
    for (const loc of SUPPORTED_LOCALES) {
      const s = institutionCompareStrings(loc);
      for (const [key, value] of Object.entries(s)) {
        expect(value.length, `${loc}.${key}`).toBeGreaterThan(0);
      }
      if (loc !== "en-US") {
        expect(s.method, loc).not.toBe(en.method);
        expect(s.disclaimer, loc).not.toBe(en.disclaimer);
        expect(s.promise, loc).not.toBe(en.promise);
      }
    }
  });

  it("keeps the placeholders the page fills in, in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = institutionCompareStrings(loc);
      expect(s.method, loc).toContain("{floor}");
      expect(s.skewNote, loc).toContain("{days}");
      expect(s.asOf, loc).toContain("{date}");
      expect(s.entity, loc).toContain("{id}");
      expect(s.entity, loc).toContain("{n}");
      expect(s.dropped, loc).toContain("{ror}");
      expect(s.dropped, loc).toContain("{floor}");
      expect(s.overCap, loc).toContain("{max}");
      expect(s.caveatFolding, loc).toContain("{max}");
      expect(s.disclaimer, loc).toContain("{contact}");
    }
  });

  it("names OpenAlex where the method and the closed caveat rest on its classification, and says nothing is fetched on open", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = institutionCompareStrings(loc);
      expect(s.method, loc).toContain("OpenAlex");
      expect(s.caveatClosed, loc).toContain("OpenAlex");
      expect(s.disclaimer, loc).toContain("OpenAlex");
      expect(s.method, loc).toContain("v1");
    }
  });

  it("uses 並置 / 并列 for the ja and zh headings, never 比較 / 比较 (which read as ranking)", () => {
    const ja = institutionCompareStrings("ja-JP");
    const zh = institutionCompareStrings("zh-CN");
    expect(ja.heading).toContain("並置");
    expect(ja.heading).not.toContain("比較");
    expect(zh.heading).toContain("并列");
    expect(zh.heading).not.toContain("比较");
  });

  it("carries no assessment vocabulary in any locale — the page describes, it never judges", () => {
    // The panel's ban list for every surface that sets organisations side by
    // side: no rank, no verdict, no comparative adjective, no compliance word.
    const latin =
      /\b(rank(ing|ed|s)?|top|bottom|league|scores?|scored|grades?|graded|leaders?|laggards?|lagging|leading|best|worst|ahead|behind|outperform\w*|underperform\w*|performance|targets?|gaps?|coverage|benchmarks?|complian\w*|mandates?|overdue|violations?|breach\w*|closed access)\b/i;
    const cjk = [
      "ランキング",
      "順位",
      "排名",
      "评分",
      "评级",
      "最高",
      "最低",
      "落后",
      "领先",
      "순위",
      "랭킹",
      "점수",
      "최고",
      "최저",
      "рейтинг",
      "лидер",
      "отста",
    ];
    for (const loc of SUPPORTED_LOCALES) {
      for (const [key, value] of Object.entries(institutionCompareStrings(loc))) {
        expect(value, `${loc}.${key}`).not.toMatch(latin);
        for (const w of cjk) expect(value, `${loc}.${key} ${w}`).not.toContain(w);
      }
    }
  });

  it("uses the same share term as the institution page in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const share = institutionStrings(loc).openalexShareFew;
      // Both surfaces say "too few works to state a share" the same way.
      expect(institutionCompareStrings(loc).shareFew, loc).toBe(share);
    }
  });
});
