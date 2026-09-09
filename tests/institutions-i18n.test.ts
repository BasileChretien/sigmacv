import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { FAQ_REQUEST_LINK_INDEX, faqItemAnchor, faqStrings } from "@/lib/i18n/faq";
import { fillInstitutionString, institutionStrings } from "@/lib/i18n/institutions";
import { privacyStrings } from "@/lib/i18n/privacy";
import { ui } from "@/lib/i18n/ui";

describe("institutionStrings", () => {
  it("localizes the institution pages and falls back to English", () => {
    expect(institutionStrings("en-US").indexHeading).toBe("Institutions");
    expect(institutionStrings("fr-FR").indexHeading).toBe("Établissements");
    expect(institutionStrings("ja-JP").indexHeading).toBe("研究機関");
    expect(institutionStrings("xx-XX")).toEqual(institutionStrings("en-US"));
  });

  it("has every field non-empty for all 10 locales", () => {
    for (const loc of SUPPORTED_LOCALES) {
      for (const [key, value] of Object.entries(institutionStrings(loc))) {
        expect(value.length, `${loc}.${key}`).toBeGreaterThan(0);
      }
    }
  });

  it("actually translates the non-English locales", () => {
    const en = institutionStrings("en-US");
    for (const loc of SUPPORTED_LOCALES.filter((l) => l !== "en-US")) {
      expect(institutionStrings(loc).aboutNoRanking, loc).not.toBe(en.aboutNoRanking);
      expect(institutionStrings(loc).listedMany, loc).not.toBe(en.listedMany);
    }
  });

  it("keeps the placeholders the pages fill in, in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = institutionStrings(loc);
      expect(s.listedMany, loc).toContain("{count}");
      expect(s.metaDescription, loc).toContain("{name}");
      expect(s.oaiLink, loc).toContain("{id}");
      for (const ph of ["{id}", "{entityName}", "{lineage}", "{related}"]) {
        expect(s.openalexCountedEntity, `${loc} ${ph}`).toContain(ph);
      }
      expect(s.openalexScope, loc).toContain("{from}");
      expect(s.openalexScope, loc).toContain("{to}");
      expect(s.openalexCountriesHeading, loc).toContain("{n}");
      expect(s.openalexCoAffiliationsHeading, loc).toContain("{n}");
      expect(s.openalexAsOf, loc).toContain("{date}");
    }
  });

  it("the OpenAlex section's copy is translated, names OpenAlex, and states the type filter and that nothing is fetched on open", () => {
    const en = institutionStrings("en-US");
    for (const loc of SUPPORTED_LOCALES) {
      const s = institutionStrings(loc);
      expect(s.openalexHeading, loc).toContain("OpenAlex");
      expect(s.openalexAsOf, loc).toContain("OpenAlex");
      expect(s.openalexNotFetched, loc).toContain("OpenAlex");
      // OpenAlex's own status vocabulary stays untranslated in the OA note.
      for (const status of ["gold", "hybrid", "diamond", "green", "bronze", "closed"]) {
        expect(s.openalexOaNote, `${loc} ${status}`).toContain(status);
      }
      if (loc !== "en-US") {
        expect(s.openalexScope, loc).not.toBe(en.openalexScope);
        expect(s.openalexNotCompared, loc).not.toBe(en.openalexNotCompared);
      }
    }
  });

  it("states the counts-only scope positively: no locale's copy carries share or ratio vocabulary, even as a negation", () => {
    const banned = [
      "share",
      "ratio",
      "percent",
      "%",
      "比例",
      "proporci",
      "proporç",
      "parts",
      "Anteil",
      "割合",
      "quote",
      "quota",
      "비율",
      "дол",
      "процент",
    ];
    for (const loc of SUPPORTED_LOCALES) {
      const scope = institutionStrings(loc).openalexScope;
      for (const word of banned) expect(scope, `${loc} ${word}`).not.toContain(word);
    }
  });

  it("names the controller and keeps the proper nouns in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = institutionStrings(loc);
      // The controller line mirrors the privacy notice: same person, same role.
      expect(s.aboutController, loc).toContain("Basile Chrétien");
      expect(privacyStrings(loc).controller).toContain("Basile Chrétien");
      expect(s.oaiBody, loc).toContain("OAI-PMH");
      expect(s.rorLabel, loc).toContain("ROR");
    }
  });

  it("never uses assessment vocabulary the plan bans on an institution page", () => {
    // Institution pages carry counts only: no compliance verdicts, no ranking,
    // no "evaluate their researchers" framing (the plan's vetoes).
    const banned = ["compliant", "non-compliant", "overdue", "evaluate their researchers"];
    for (const loc of SUPPORTED_LOCALES) {
      const all = Object.values(institutionStrings(loc)).join(" ").toLowerCase();
      for (const word of banned) expect(all, `${loc}: ${word}`).not.toContain(word);
    }
  });
});

describe("fillInstitutionString", () => {
  it("substitutes every occurrence of each placeholder", () => {
    expect(fillInstitutionString("{count} at {name} ({name})", { count: 3, name: "X" })).toBe(
      "3 at X (X)",
    );
  });
  it("leaves unknown placeholders alone", () => {
    expect(fillInstitutionString("{other}", { name: "X" })).toBe("{other}");
  });
});

describe("listing-consent copy names the public count", () => {
  it("tells the researcher, in every locale, that the count of listed researchers is public on /i/", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const body = ui(loc).listUnderAffiliationBody;
      // The one sentence PR 1 adds: the institution page shows how many
      // researchers are listed (a count only). The path is the locale-free anchor.
      expect(body, loc).toContain("/i/");
    }
  });

  it("the privacy notice states the per-institution count as a purpose, after the OAI sentence, in every locale", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const sharing = privacyStrings(loc).sharing;
      expect(sharing, loc).toContain("/i/<ror>");
      expect(sharing.indexOf("OAI-PMH"), loc).toBeLessThan(sharing.indexOf("/i/<ror>"));
      expect(sharing.indexOf("ROR"), loc).toBeLessThan(sharing.indexOf("/i/<ror>"));
    }
  });

  it("never puts an ASCII space after a CJK full stop in the appended sentences", () => {
    for (const loc of ["zh-CN", "ja-JP"] as const) {
      expect(ui(loc).listUnderAffiliationBody, loc).not.toMatch(/。 /);
      expect(privacyStrings(loc).sharing, loc).not.toMatch(/。 /);
    }
  });
});

describe("FAQ anchor for request links", () => {
  it("points at the FAQ entry that explains request links, in every locale", () => {
    expect(faqItemAnchor(FAQ_REQUEST_LINK_INDEX)).toBe("q8");
    for (const loc of SUPPORTED_LOCALES) {
      const item = faqStrings(loc).items[FAQ_REQUEST_LINK_INDEX];
      expect(item?.a, loc).toContain("freeze=");
    }
  });
});
