import { describe, expect, it } from "vitest";
import { hasCjk, toCslName, workToCsl } from "@/lib/openalex/toCsl";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

// Build CJK strings from code points so the test source stays ASCII (and the
// assertions echo the very same literal, so byte-encoding can never drift).
const cp = (...points: number[]) => String.fromCodePoint(...points);
const YAMADA_TARO = cp(0x5c71, 0x7530, 0x592a, 0x90ce); //  山田太郎 (ja, no space)
const YAMADA_SPACED = cp(0x5c71, 0x7530, 0x20, 0x592a, 0x90ce); // 山田 太郎
const WANG_WEI = cp(0x738b, 0x4f1f); //                          王伟 (zh)
const HONG = cp(0xd64d, 0xae38, 0xb3d9); //                       홍길동 (ko)

const works = worksFixture as unknown as OpenAlexWork[];
const byId = (id: string) => works.find((w) => w.id.endsWith(id))!;

describe("toCslName", () => {
  it("splits a two-token name into family + given", () => {
    expect(toCslName("Basile Chrétien")).toEqual({
      family: "Chrétien",
      given: "Basile",
    });
  });

  it("treats the last token as the family name for multi-token names", () => {
    expect(toCslName("Anna Maria De La Cruz")).toEqual({
      family: "Cruz",
      given: "Anna Maria De La",
    });
  });

  it("parses the comma form 'Family, Given'", () => {
    expect(toCslName("Chrétien, B.")).toEqual({
      family: "Chrétien",
      given: "B.",
    });
    expect(toCslName("van den Berg, J.")).toEqual({
      family: "van den Berg",
      given: "J.",
    });
  });

  it("treats 'Family,' with no given as family-only", () => {
    expect(toCslName("Smith,")).toEqual({ family: "Smith" });
  });

  it("uses a literal for single-token / organization names", () => {
    expect(toCslName("WHO")).toEqual({ literal: "WHO" });
  });

  it("returns an empty literal for blank input", () => {
    expect(toCslName("  ")).toEqual({ literal: "" });
    expect(toCslName(null)).toEqual({ literal: "" });
  });

  it("keeps CJK names verbatim as a literal (family-first, never split)", () => {
    // A Western split would make 'family: 郎/太郎' and abbreviate the rest —
    // wrong for CJK. Preserve the whole name in its original order instead.
    expect(toCslName(YAMADA_TARO)).toEqual({ literal: YAMADA_TARO });
    expect(toCslName(YAMADA_SPACED)).toEqual({ literal: YAMADA_SPACED });
    expect(toCslName(WANG_WEI)).toEqual({ literal: WANG_WEI });
    expect(toCslName(HONG)).toEqual({ literal: HONG });
  });

  it("still splits accented Latin / Cyrillic names (not treated as CJK)", () => {
    expect(toCslName("Ülo Männik")).toEqual({ family: "Männik", given: "Ülo" });
    expect(toCslName("Владимир Иванов")).toEqual({
      family: "Иванов",
      given: "Владимир",
    });
  });
});

describe("hasCjk", () => {
  it("detects CJK characters and ignores non-CJK scripts", () => {
    expect(hasCjk(YAMADA_TARO)).toBe(true);
    expect(hasCjk(HONG)).toBe(true);
    expect(hasCjk("Basile Chrétien")).toBe(false);
    expect(hasCjk(cp(0x645, 0x62d, 0x645, 0x62f))).toBe(false); // محمد (arabic)
  });
});

describe("workToCsl", () => {
  it("maps a journal article to article-journal with full metadata", () => {
    const csl = workToCsl(byId("W4300000001"));
    expect(csl.id).toBe("W4300000001");
    expect(csl.type).toBe("article-journal");
    expect(csl.title).toBe("A study of adverse drug reactions");
    expect(csl["container-title"]).toBe(
      "British Journal of Clinical Pharmacology",
    );
    expect(csl.volume).toBe("89");
    expect(csl.issue).toBe("5");
    expect(csl.page).toBe("1500-1510");
    expect(csl.issued).toEqual({ "date-parts": [[2023, 5, 15]] });
    expect(csl.author).toEqual([
      { family: "Chrétien", given: "Basile" },
      { family: "Dolladille", given: "Charles" },
    ]);
  });

  it("strips the DOI prefix and sets a doi.org URL", () => {
    const csl = workToCsl(byId("W4300000001"));
    expect(csl.DOI).toBe("10.1000/example1");
    expect(csl.URL).toBe("https://doi.org/10.1000/example1");
  });

  it("maps posted-content/preprint to article and falls back to OpenAlex URL", () => {
    // Synthetic preprint (the shared fixture intentionally has no preprint, so
    // the build's publication/preprint split tests stay decoupled).
    const csl = workToCsl({
      id: "https://openalex.org/W4300000002",
      doi: null,
      title: "Pharmacovigilance signal detection methods",
      display_name: "Pharmacovigilance signal detection methods",
      publication_year: 2024,
      type: "preprint",
      type_crossref: "posted-content",
    } as OpenAlexWork);
    expect(csl.type).toBe("article");
    expect(csl.DOI).toBeUndefined();
    expect(csl.URL).toBe("https://openalex.org/W4300000002");
    expect(csl["container-title"]).toBeUndefined();
  });

  it("emits a single-page range when only first_page is present", () => {
    const csl = workToCsl(byId("W4300000003"));
    expect(csl.page).toBe("7");
  });

  it("falls back to publication_year when there's no full date", () => {
    const csl = workToCsl({
      id: "https://openalex.org/W777",
      title: "Year only",
      publication_year: 2019,
      type: "article",
    } as unknown as OpenAlexWork);
    expect(csl.issued).toEqual({ "date-parts": [[2019]] });
  });

  it("omits issued when there is no date at all", () => {
    const csl = workToCsl({
      id: "https://openalex.org/W778",
      title: "No date",
      type: "article",
    } as unknown as OpenAlexWork);
    expect(csl.issued).toBeUndefined();
  });
});
