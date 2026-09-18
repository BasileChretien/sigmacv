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
 * list printed twice. The samples are the real ones from OpenAlex / Crossref.
 */

describe("cleanPersonName", () => {
  it("lowers a capital that follows an accented lowercase letter (ChréTien)", () => {
    expect(cleanPersonName("Basile ChréTien")).toBe("Basile Chrétien");
    expect(cleanPersonName("JöRg MüLler")).toBe("Jörg Müller");
    expect(cleanPersonName("Haït")).toBe("Haït");
    expect(cleanPersonName("HaïT")).toBe("Haït");
    expect(cleanPersonName("NguyễN")).toBe("Nguyễn");
  });

  it("repairs the same capital after a DECOMPOSED accent (e + combining acute)", () => {
    const nfd = "Chre\u0301Tien";
    expect(cleanPersonName(nfd)).toBe("Chrétien");
    // Composed to NFC either way.
    expect(cleanPersonName("Chre\u0301tien")).toBe("Chrétien");
  });

  it("keeps legitimate internal capitals", () => {
    for (const name of [
      "Ronald McDonald",
      "Leonardo DiCaprio",
      "Jean LeBlanc",
      "Conan O'Brien",
      "MacÉoin",
      "Jean-Étienne Dupré",
      "CHRÉTIEN",
      "Ó hUiginn",
      "Леонардо ДиКаприо",
    ]) {
      expect(cleanPersonName(name)).toBe(name);
    }
  });

  it("drops a U+FFFD, but never empties a name that is nothing else", () => {
    expect(cleanPersonName("Kenji U\uFFFDda")).toBe("Kenji Uda");
    expect(cleanPersonName("\uFFFD\uFFFD \uFFFD")).toBe("\uFFFD\uFFFD \uFFFD");
  });

  it("re-decodes UTF-8 that was read as Windows-1252 / Latin-1", () => {
    expect(cleanPersonName("Basile ChrÃ©tien")).toBe("Basile Chrétien");
    expect(cleanPersonName("JÃ¼rgen MÃ¼ller")).toBe("Jürgen Müller");
    // É is C3 89; 0x89 decodes to "‰" in Windows-1252.
    expect(cleanPersonName("Ã‰lise")).toBe("Élise");
    // Double-encoded.
    expect(cleanPersonName("ChrÃƒÂ©tien")).toBe("Chrétien");
  });

  it("leaves a name alone when a character could not have come from Windows-1252", () => {
    // "Ł" has no Windows-1252 byte, so the name was never one decoded string.
    expect(cleanPersonName("Ã©ric Łukasz")).toBe("Ã©ric Łukasz");
  });

  it("leaves real Latin-1 names alone (they are not valid UTF-8 as bytes)", () => {
    for (const name of ["José Müller", "Ãngela", "JOÃO", "São Paulo", "Côté–Smith"]) {
      expect(cleanPersonName(name)).toBe(name);
    }
  });

  it("strips invisibles and collapses whitespace", () => {
    expect(cleanPersonName("\uFEFF  Ada\u200B   Lovelace \n")).toBe("Ada Lovelace");
    expect(cleanPersonName("Ada\u0007 Lovelace")).toBe("Ada Lovelace");
    // Joiners carry meaning in Indic / Persian scripts: kept.
    expect(cleanPersonName("क्\u200Dष")).toBe("क्\u200Dष");
  });

  it("stays correct past the memo's bound (the cache is cleared, not grown)", () => {
    const name = (i: number) => `ChréTien ${String.fromCharCode(0x4e00 + i)}`;
    for (let i = 0; i < 10_050; i++) {
      expect(cleanPersonName(name(i))).toBe(`Chrétien ${String.fromCharCode(0x4e00 + i)}`);
    }
    expect(cleanPersonName(name(0))).toBe(`Chrétien ${String.fromCharCode(0x4e00)}`);
    expect(personNameKey(name(1))).toBe(`chretien${String.fromCharCode(0x4e01)}`);
  });

  it("is idempotent and total", () => {
    const once = cleanPersonName("  Basile ChrÃ©Tien ");
    expect(cleanPersonName(once)).toBe(once);
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
  it("folds case, accents, punctuation and spacing", () => {
    expect(personNameKey("Basile Chrétien")).toBe(personNameKey("BASILE CHRETIEN"));
    expect(personNameKey("Jean-Étienne  Dupré")).toBe("jeanetiennedupre");
    expect(personNameKey("Basile ChréTien")).toBe(personNameKey("Basile Chrétien"));
  });

  it("keeps different scripts apart, and is empty for a name with no letters", () => {
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
    const twins = repeatedRunTwins(recover);
    expect([...twins]).toEqual([
      [14, 8],
      [15, 9],
      [16, 10],
      [17, 11],
      [18, 12],
    ]);
  });

  it("finds a whole list printed twice", () => {
    expect([...repeatedRunTwins(["a", "b", "c", "a", "b", "c"])]).toEqual([
      [3, 0],
      [4, 1],
      [5, 2],
    ]);
  });

  it("never touches a single repeated name (two people can share one)", () => {
    expect(repeatedRunTwins(["wang", "li", "zhang", "wang"]).size).toBe(0);
    expect(repeatedRunTwins(["a", "a"]).size).toBe(0);
  });

  it("never touches a run of one identical name (an alphabetical consortium byline)", () => {
    expect(repeatedRunTwins(["wangj", "wangj", "wangj", "wangj", "wangy"]).size).toBe(0);
  });

  it("ignores empty keys (nameless authors are not evidence)", () => {
    expect(repeatedRunTwins(["", "", "a", "", ""]).size).toBe(0);
    expect(repeatedRunTwins(["a", "", "a", ""]).size).toBe(0);
  });

  it("collapses a list printed three times onto its first copy", () => {
    expect([...repeatedRunTwins(["a", "b", "a", "b", "a", "b"])]).toEqual([
      [2, 0],
      [3, 1],
      [4, 0],
      [5, 1],
    ]);
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
});
