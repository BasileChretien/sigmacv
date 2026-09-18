import { describe, expect, it } from "vitest";
import {
  cleanCslName,
  cleanPersonName,
  hasNonLatinLetter,
  hasReplacementChar,
  isLatinScriptOnly,
  personNameKey,
} from "@/lib/text/personName";
import { repeatedRunTwins } from "@/lib/text/authorRuns";

/**
 * Person-name repair: the defects scholarly metadata carries into a CV (a capital
 * after an accented letter, a U+FFFD, UTF-8 read as Windows-1252, decomposed
 * accents, stray invisibles), and the repeated-run check that finds an author
 * list printed twice. The samples are real ones from OpenAlex / Crossref, and the
 * "left alone" lists hold the real names a looser rule misprinted.
 */

/** UTF-8 bytes read as Latin-1: the classic mojibake, `times` over. */
const mojibake = (s: string, times = 1): string =>
  times === 0 ? s : mojibake(Buffer.from(s, "utf8").toString("latin1"), times - 1);
const NBSP = String.fromCharCode(0xa0);

describe("cleanPersonName — casing", () => {
  it("lowers a capital a broken title-caser put after an accented letter", () => {
    expect(cleanPersonName("Basile ChréTien")).toBe("Basile Chrétien");
    expect(cleanPersonName("JöRg MüLler")).toBe("Jörg Müller");
    expect(cleanPersonName("HaïT")).toBe("Haït");
    expect(cleanPersonName("NguyễN")).toBe("Nguyễn");
  });

  it("raises a word's accented initial the same title-caser left lowercase", () => {
    expect(cleanPersonName("éMile Durkheim")).toBe("Émile Durkheim");
    expect(cleanPersonName("Mehmet öZtüRk")).toBe("Mehmet Öztürk");
    expect(cleanPersonName("AyşE çElik")).toBe("Ayşe Çelik");
  });

  it("repairs the same capital after a DECOMPOSED accent (e + combining acute)", () => {
    expect(cleanPersonName("Chre\u0301Tien")).toBe("Chrétien");
    expect(cleanPersonName("Chre\u0301tien")).toBe("Chrétien");
  });

  it("keeps legitimate internal capitals and all-caps or stylised names", () => {
    for (const name of [
      "Ronald McDonald",
      "Leonardo DiCaprio",
      "Jean LeBlanc",
      "Conan O'Brien",
      "MacÉoin",
      "Jean-Étienne Dupré",
      "CHRÉTIEN",
      "Ó hUiginn",
      "Ó hÉigeartaigh",
      "IJsbrand van IJzendoorn",
      "Леонардо ДиКаприо",
      // ASCII-only upper-casing: left as is rather than made worse.
      "GONZáLEZ",
      "MUñOZ",
      "JOãO",
      "ANTôNIO",
      // A stylised name, and two given names without a space: not a title-caser's.
      "PréDiCT",
      "JoséLuis García",
      // The saltillo is a letter used as an apostrophe.
      `O${String.fromCharCode(0xa78c)}Neill`,
    ]) {
      expect(cleanPersonName(name)).toBe(name);
    }
  });
});

describe("cleanPersonName — encoding", () => {
  it("re-decodes UTF-8 that was read as Windows-1252 / Latin-1", () => {
    expect(cleanPersonName("Basile ChrÃ©tien")).toBe("Basile Chrétien");
    expect(cleanPersonName("JÃ¼rgen MÃ¼ller")).toBe("Jürgen Müller");
    // É is C3 89; 0x89 decodes to "‰" in Windows-1252.
    expect(cleanPersonName("Ã‰lise")).toBe("Élise");
    // Romanian comma-below letters, and a Cyrillic name.
    expect(cleanPersonName("IonuÈ›")).toBe("Ionuț");
    expect(cleanPersonName("Ð˜Ð²Ð°Ð½")).toBe("Иван");
  });

  it("decodes names encoded twice, or more", () => {
    expect(cleanPersonName("ChrÃƒÂ©tien")).toBe("Chrétien");
    expect(cleanPersonName(mojibake("Chrétien", 4))).toBe("Chrétien");
  });

  it("keeps a name's punctuation through the decode", () => {
    expect(cleanPersonName(mojibake("O’Müller"))).toBe("O’Müller");
    expect(cleanPersonName(mojibake("O'Müller-Lüdenscheidt"))).toBe("O'Müller-Lüdenscheidt");
  });

  it("leaves a word that mixes mojibake with a letter Windows-1252 cannot hold", () => {
    // "Ł" has no Windows-1252 byte, so the word was never one decoded string.
    expect(cleanPersonName("Łódź-MÃ¼ller")).toBe("Łódź-MÃ¼ller");
  });

  it("decodes word by word, so one sound word does not block the rest", () => {
    expect(cleanPersonName("Zoë ChrÃ©tien")).toBe("Zoë Chrétien");
    expect(cleanPersonName("Łukasz MÃ¼ller")).toBe("Łukasz Müller");
  });

  it("leaves real names alone when their bytes only happen to be valid UTF-8", () => {
    // Í Š = CD 8A is valid UTF-8 — a combining mark. These are live OpenAlex names.
    for (const name of ["D. LÍŠKA", "Ondrej LÍŠKA", "V. VÍŠEK", "KRÍŽ", "Strauß–Meyer", "Groß’"]) {
      expect(cleanPersonName(name)).toBe(name);
    }
  });

  it("does not decode a no-break space into a letter", () => {
    expect(cleanPersonName(`Weiß${NBSP}`)).toBe("Weiß");
    expect(cleanPersonName(`JOSÉ${NBSP}SILVA`)).toBe("JOSÉ SILVA");
    expect(cleanPersonName(`Paré${NBSP}${NBSP}`)).toBe("Paré");
  });

  it("leaves real Latin-1 names alone (they are not valid UTF-8 as bytes)", () => {
    for (const name of ["José Müller", "Ãngela", "JOÃO", "São Paulo", "Côté–Smith"]) {
      expect(cleanPersonName(name)).toBe(name);
    }
  });

  it("keeps the CJK compatibility ideographs people choose for their names", () => {
    const variant = `${String.fromCharCode(0xfa10)}本 太郎`; // 塚 (U+FA10), not U+585A
    expect(cleanPersonName(variant)).toBe(variant);
    // Still composed around them.
    expect(cleanPersonName(`${String.fromCharCode(0xfa10)} Chre\u0301tien`)).toBe(
      `${String.fromCharCode(0xfa10)} Chrétien`,
    );
  });
});

describe("cleanPersonName — lost characters and invisibles", () => {
  it("drops a U+FFFD, but never empties a name that is nothing else", () => {
    expect(cleanPersonName("Kenji U\uFFFDda")).toBe("Kenji Uda");
    expect(cleanPersonName("\uFFFD\uFFFD \uFFFD")).toBe("\uFFFD\uFFFD \uFFFD");
  });

  it("strips invisibles and collapses whitespace", () => {
    expect(cleanPersonName("\uFEFF  Ada\u200B   Lovelace \n")).toBe("Ada Lovelace");
    expect(cleanPersonName("Ada\u0007 Lovelace")).toBe("Ada Lovelace");
    // Joiners carry meaning in Indic / Persian scripts: kept.
    expect(cleanPersonName("क्\u200Dष")).toBe("क्\u200Dष");
  });

  it("stays correct past the memo's bounds (entries and key length)", () => {
    const name = (i: number) => `ChréTien ${String.fromCharCode(0x4e00 + i)}`;
    for (let i = 0; i < 10_050; i++) {
      expect(cleanPersonName(name(i))).toBe(`Chrétien ${String.fromCharCode(0x4e00 + i)}`);
    }
    expect(cleanPersonName(name(0))).toBe(`Chrétien ${String.fromCharCode(0x4e00)}`);
    expect(personNameKey(name(1))).toBe(`chrétien${String.fromCharCode(0x4e01)}`);
    const long = `${"Ada ".repeat(80)}ChréTien`;
    expect(cleanPersonName(long)).toBe(`${"Ada ".repeat(80)}Chrétien`);
  });

  it("is idempotent and total", () => {
    for (const raw of [
      "  Basile ChrÃ©Tien ",
      mojibake("Chrétien", 4),
      "éMile",
      `Weiß${NBSP}`,
      "Kenji U\uFFFDda",
    ]) {
      const once = cleanPersonName(raw);
      expect(cleanPersonName(once)).toBe(once);
    }
    expect(cleanPersonName("")).toBe("");
  });
});

describe("script and replacement checks", () => {
  it("recognises Latin-only and non-Latin names", () => {
    expect(isLatinScriptOnly("Osamu Suzuki")).toBe(true);
    expect(isLatinScriptOnly("Jean-Étienne Dupré")).toBe(true);
    expect(isLatinScriptOnly("Осаму Сузукі")).toBe(false);
    expect(isLatinScriptOnly("123 .")).toBe(false);
    expect(hasNonLatinLetter("Осаму Сузукі")).toBe(true);
    expect(hasNonLatinLetter("张伟 (Wei Zhang)")).toBe(true);
    expect(hasNonLatinLetter("Wei Zhang")).toBe(false);
  });

  it("detects a replacement character", () => {
    expect(hasReplacementChar("Kenji U\uFFFDda")).toBe(true);
    expect(hasReplacementChar("Kenji Uda")).toBe(false);
  });
});

describe("personNameKey", () => {
  it("folds case, punctuation and spacing", () => {
    expect(personNameKey("Basile Chrétien")).toBe(personNameKey("BASILE CHRÉTIEN"));
    expect(personNameKey("Chrétien, B.")).toBe("chrétienb");
    expect(personNameKey("Basile ChréTien")).toBe(personNameKey("Basile Chrétien"));
  });

  it("keeps accents and scripts apart: different letters, different people", () => {
    expect(personNameKey("Lü Wei")).not.toBe(personNameKey("Lu Wei"));
    expect(personNameKey("Basile Chrétien")).not.toBe(personNameKey("Basile Chretien"));
    expect(personNameKey("Осаму Сузукі")).not.toBe(personNameKey("Osamu Suzuki"));
    expect(personNameKey("  . ")).toBe("");
  });
});

describe("cleanCslName", () => {
  it("cleans every string part of a CSL name", () => {
    expect(
      cleanCslName({
        family: "ChréTien",
        given: "Basile\u200B",
        "non-dropping-particle": "de ",
      }),
    ).toEqual({ family: "Chrétien", given: "Basile", "non-dropping-particle": "de" });
    expect(cleanCslName({ literal: "Kenji U\uFFFDda" })).toEqual({ literal: "Kenji Uda" });
  });

  it("returns the very same object when nothing changes", () => {
    const n = { family: "Chrétien", given: "Basile" };
    expect(cleanCslName(n)).toBe(n);
  });

  it("keeps unknown passthrough fields", () => {
    const n = { family: "ChréTien", given: "B.", sequence: "first" } as never;
    expect(cleanCslName(n)).toEqual({ family: "Chrétien", given: "B.", sequence: "first" });
  });
});

describe("repeatedRunTwins", () => {
  const recover = [
    "muraoka",
    "izumi",
    "nishida",
    "chretien",
    "ishii",
    "takeuchi",
    "nishihori",
    "goto",
    "maesawa",
    "shimato",
    "kinkori",
    "asai",
    "suzuki",
    "saito",
    "maesawa",
    "shimato",
    "kinkori",
    "asai",
    "suzuki",
    "maki",
  ];

  it("maps each author of a repeated run to its first appearance (RECOVER)", () => {
    expect([...repeatedRunTwins(recover)]).toEqual([
      [14, 8],
      [15, 9],
      [16, 10],
      [17, 11],
      [18, 12],
    ]);
  });

  it("finds a whole list printed twice, and three times", () => {
    expect([...repeatedRunTwins(["a", "b", "c", "a", "b", "c"])]).toEqual([
      [3, 0],
      [4, 1],
      [5, 2],
    ]);
    expect([...repeatedRunTwins(["a", "b", "c", "a", "b", "c", "a", "b", "c"])]).toEqual([
      [3, 0],
      [4, 1],
      [5, 2],
      [6, 0],
      [7, 1],
      [8, 2],
    ]);
  });

  it("never collapses a run of two (CMS prints 'J. Wang, Z. Wang' twice: four people)", () => {
    expect(repeatedRunTwins(["jwang", "zwang", "x", "y", "jwang", "zwang", "z"]).size).toBe(0);
    expect(repeatedRunTwins(["a", "b", "a", "b"]).size).toBe(0);
  });

  it("never touches a single repeated name, or a run of one identical name", () => {
    expect(repeatedRunTwins(["wang", "li", "zhang", "wang"]).size).toBe(0);
    // Seven "Wang, J." in a row hold a run of three repeated — of one name only.
    expect(repeatedRunTwins([...Array<string>(7).fill("wangj"), "wangy"]).size).toBe(0);
  });

  it("ignores empty keys (nameless authors are not evidence)", () => {
    expect(repeatedRunTwins(["", "", "", "a", "", "", ""]).size).toBe(0);
    expect(repeatedRunTwins(["a", "b", "", "a", "b", ""]).size).toBe(0);
  });

  it("takes the longest earlier match when a name recurs", () => {
    // "a" recurs at 3 (a run of one: ignored) and 5; from 5, "a b c" matches the
    // copy at 0 for three names, the copy at 3 for one.
    expect([...repeatedRunTwins(["a", "b", "c", "a", "y", "a", "b", "c"])]).toEqual([
      [5, 0],
      [6, 1],
      [7, 2],
    ]);
  });

  it("stops a run at a pair the caller vetoes", () => {
    const keys = ["a", "b", "c", "d", "e", "a", "b", "c", "d", "e"];
    // Entries 3 and 8 are different people (say, two ORCID iDs).
    const twins = repeatedRunTwins(keys, (i, j) => !(i === 3 && j === 8));
    expect([...twins]).toEqual([
      [5, 0],
      [6, 1],
      [7, 2],
    ]);
    expect(repeatedRunTwins(keys, () => false).size).toBe(0);
  });

  it("never collapses a list longer than a collaboration's cutoff", () => {
    const long = Array.from({ length: 501 }, (_, i) => `n${i}`);
    long.splice(10, 3, "a", "b", "c");
    long.splice(20, 3, "a", "b", "c");
    expect(repeatedRunTwins(long).size).toBe(0);
    expect(repeatedRunTwins(long.slice(0, 500)).size).toBe(3);
  });

  it("stays cheap on a hostile list of one repeated name", () => {
    const hostile = Array.from({ length: 500 }, (_, i) => (i % 50 === 49 ? "x" : "wangj"));
    const t0 = performance.now();
    repeatedRunTwins(hostile);
    expect(performance.now() - t0).toBeLessThan(1000);
  });
});
