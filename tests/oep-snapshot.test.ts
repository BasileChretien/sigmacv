import { describe, expect, it } from "vitest";
import { SUPPORTED_LOCALES, t } from "@/lib/i18n";
import { fill } from "@/lib/i18n/fill";
import { transparencyStrings } from "@/lib/i18n/transparency";
import { OEP_SNAPSHOT, oepSnapshotDate } from "@/lib/oep/snapshot";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

describe("Open Editors Plus snapshot date", () => {
  it("records when the edition behind the seed was collected", () => {
    expect(OEP_SNAPSHOT.collectedFrom).toMatch(ISO_DAY);
    expect(OEP_SNAPSHOT.collectedTo).toMatch(ISO_DAY);
    expect(OEP_SNAPSHOT.collectedFrom <= OEP_SNAPSHOT.collectedTo).toBe(true);
    expect(OEP_SNAPSHOT.dataVersion).toMatch(/^\d{4}\.\d+$/);
  });

  it("is shown as the month the collection ended, in the reader's language", () => {
    // Derived from the constant, never this edition's month typed out: these
    // must keep passing when the seed is rebuilt from the next edition.
    const year = OEP_SNAPSHOT.collectedTo.slice(0, 4);
    const month = Number(OEP_SNAPSHOT.collectedTo.slice(5, 7));
    // The month the collection ENDED (not the one it began), numeric in Japanese…
    expect(oepSnapshotDate("ja-JP")).toBe(`${year}年${month}月`);
    // …and a month name then the year in English and French, capitalised in
    // English only.
    expect(oepSnapshotDate("en-US")).toMatch(new RegExp(`^[A-Z][a-z]+ ${year}$`));
    expect(oepSnapshotDate("fr-FR")).toMatch(new RegExp(`^[a-zéû]+ ${year}$`));
    // An unknown locale falls back to English rather than throwing.
    expect(oepSnapshotDate("xx-not-a-locale")).toBe(oepSnapshotDate("en-US"));
  });

  it("names the year in every supported locale", () => {
    const year = OEP_SNAPSHOT.collectedTo.slice(0, 4);
    for (const locale of SUPPORTED_LOCALES) {
      expect(oepSnapshotDate(locale), locale).toContain(year);
    }
  });
});

describe("the notes that carry the date", () => {
  const texts = (locale: (typeof SUPPORTED_LOCALES)[number]) => ({
    editor: t(locale, "oepSnapshotNote"),
    transparency: transparencyStrings(locale).refreshSnapshot,
  });

  it("have exactly one {date} slot in every locale, and nothing left unfilled", () => {
    for (const locale of SUPPORTED_LOCALES) {
      for (const [where, text] of Object.entries(texts(locale))) {
        const label = `${locale} ${where}`;
        expect(text.match(/\{date\}/g), label).toHaveLength(1);
        const filled = fill(text, { date: oepSnapshotDate(locale) });
        expect(filled, label).not.toMatch(/[{}]/);
        expect(filled, label).toContain(oepSnapshotDate(locale));
        expect(filled, label).toContain("Open Editors Plus");
      }
    }
  });

  it("are translated, not English left in place", () => {
    const en = texts("en-US");
    for (const locale of SUPPORTED_LOCALES.filter((l) => l !== "en-US")) {
      expect(texts(locale).editor, locale).not.toBe(en.editor);
      expect(texts(locale).transparency, locale).not.toBe(en.transparency);
    }
  });
});
