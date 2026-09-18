import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  getEnv: () => ({ OPENALEX_MAILTO: "test@example.org" }),
}));

import { authorshipName, normalizeWorkAuthors } from "@/lib/openalex/authorNames";
import { fetchWorkByDoi, fetchWorksByAuthorIds } from "@/lib/openalex/client";
import { workToCsl } from "@/lib/openalex/toCsl";
import type { OpenAlexAuthorship, OpenAlexWork } from "@/lib/openalex/types";

/**
 * OpenAlex author lists, repaired where the payload arrives: the name printed on
 * the work wins over a profile name that is garbled (U+FFFD) or in another script
 * (a Cyrillic profile for a Latin byline); casing is repaired; an author list the
 * publisher deposited twice (RECOVER, 10.3171/2025.1.jns242509) is collapsed.
 */

const au = (
  display: string | undefined,
  raw: string | undefined,
  extra: Partial<OpenAlexAuthorship> & { id?: string; orcid?: string } = {},
): OpenAlexAuthorship => {
  const { id, orcid, ...rest } = extra;
  return {
    author_position: "middle",
    ...(display !== undefined || id
      ? { author: { id, display_name: display, orcid: orcid ?? null } }
      : {}),
    ...(raw !== undefined ? { raw_author_name: raw } : {}),
    ...rest,
  };
};

describe("authorshipName", () => {
  it("prefers the profile name when it is sound", () => {
    expect(authorshipName(au("Basile Chrétien", "B. Chretien"))).toBe("Basile Chrétien");
  });

  it("falls back to the printed name when the profile name carries a U+FFFD", () => {
    expect(authorshipName(au("Kenji U\uFFFDda", "Kenji Uda"))).toBe("Kenji Uda");
    // Stripping would lose the letters; the byline still has them.
    expect(authorshipName(au("Jos\uFFFD M\uFFFDller", "José Müller"))).toBe("José Müller");
  });

  it("falls back to the printed name when the profile is in another script", () => {
    expect(authorshipName(au("Осаму Сузукі", "Osamu Suzuki"))).toBe("Osamu Suzuki");
  });

  it("keeps a non-Latin profile name when the byline is not Latin either", () => {
    expect(authorshipName(au("Осаму Сузукі", "Осаму Сузукі"))).toBe("Осаму Сузукі");
    expect(authorshipName(au("山田太郎", "山田太郎"))).toBe("山田太郎");
  });

  it("keeps the Latin profile name for a byline printed in another script", () => {
    // The current behaviour for a Japanese-language paper: the romanised profile.
    expect(authorshipName(au("Taro Yamada", "山田太郎"))).toBe("Taro Yamada");
  });

  it("repairs the casing of whichever name it picks", () => {
    expect(authorshipName(au("Basile ChréTien", "B. Chretien"))).toBe("Basile Chrétien");
    expect(authorshipName(au(undefined, "Basile ChréTien"))).toBe("Basile Chrétien");
  });

  it("strips the U+FFFD when neither name is clean", () => {
    expect(authorshipName(au("Kenji U\uFFFDda", "K. U\uFFFDda"))).toBe("Kenji Uda");
  });

  it("uses the printed name when the profile name is empty", () => {
    // `display_name ?? raw` keeps an EMPTY display name, which toCsl then drops.
    expect(authorshipName(au("", "Ada Lovelace"))).toBe("Ada Lovelace");
    const out = normalizeWorkAuthors(work([au("", "Ada Lovelace", { id: "A1" })]));
    expect(workToCsl(out).author).toEqual([{ family: "Lovelace", given: "Ada" }]);
  });

  it("returns undefined for a nameless authorship", () => {
    expect(authorshipName(au(undefined, undefined))).toBeUndefined();
    expect(authorshipName(au("  ", ""))).toBeUndefined();
  });
});

const work = (authorships: OpenAlexAuthorship[]): OpenAlexWork => ({
  id: "https://openalex.org/W4410429520",
  title: "RECOVER study",
  authorships,
});

/** The RECOVER byline as OpenAlex serves it (positions 8–12 repeated at 14–18,
 *  the second Osamu Suzuki under a Cyrillic profile), shortened around the run. */
function recover(): OpenAlexWork {
  return work([
    au("Shinsuke Muraoka", "Shinsuke Muraoka", { author_position: "first", id: "A1" }),
    au("Basile Chrétien", "Basile Chrétien", {
      id: "https://openalex.org/A5001069481",
      orcid: "https://orcid.org/0000-0002-7483-2489",
    }),
    au("Satoshi Maesawa", "Satoshi Maesawa", { id: "A3" }),
    au("Shinji Shimato", "Shinji Shimato", { id: "A4a" }),
    au("Takeshi Kinkori", "Takeshi Kinkori", { id: "A5" }),
    au("Takumi Asai", "Takumi Asai", { id: "A6", is_corresponding: false }),
    au("Osamu Suzuki", "Osamu Suzuki", { id: "A7a" }),
    au("Ryuta Saito", "Ryuta Saito", { id: "A8" }),
    au("Satoshi Maesawa", "Satoshi Maesawa", { id: "A3" }),
    au("Shinji Shimato", "Shinji Shimato", {
      id: "A4b",
      orcid: "https://orcid.org/0000-0001-9424-8389",
      institutions: [{ id: "I1", display_name: "Nagoya" }],
      countries: ["JP"],
    }),
    au("Takeshi Kinkori", "Takeshi Kinkori", { id: "A5" }),
    au("Takumi Asai", "Takumi Asai", { id: "A6", is_corresponding: true }),
    au("Осаму Сузукі", "Osamu Suzuki", {
      id: "A7b",
      orcid: "https://orcid.org/0000-0002-2975-1452",
    }),
    au("Shigemasa Hayashi", "Shigemasa Hayashi", { author_position: "last", id: "A9" }),
  ]);
}

describe("normalizeWorkAuthors", () => {
  it("collapses RECOVER's repeated run and cleans the Cyrillic profile name", () => {
    const out = normalizeWorkAuthors(recover());
    const names = out.authorships!.map((a) => a.author?.display_name);
    expect(names).toEqual([
      "Shinsuke Muraoka",
      "Basile Chrétien",
      "Satoshi Maesawa",
      "Shinji Shimato",
      "Takeshi Kinkori",
      "Takumi Asai",
      "Osamu Suzuki",
      "Ryuta Saito",
      "Shigemasa Hayashi",
    ]);
    expect(workToCsl(out).author).toHaveLength(9);
  });

  it("keeps the better-identified copy of each twin, merging what the other knew", () => {
    const out = normalizeWorkAuthors(recover());
    const shimato = out.authorships![3]!;
    // The later copy carries an ORCID: its identity wins, in the first copy's place.
    expect(shimato.author?.id).toBe("A4b");
    expect(shimato.institutions).toEqual([{ id: "I1", display_name: "Nagoya" }]);
    expect(shimato.countries).toEqual(["JP"]);
    const suzuki = out.authorships![6]!;
    expect(suzuki.author?.id).toBe("A7b");
    expect(suzuki.author?.display_name).toBe("Osamu Suzuki");
    // Corresponding on either copy → corresponding.
    expect(out.authorships![5]!.is_corresponding).toBe(true);
    // Neither copy identified better: the first stays.
    expect(out.authorships![2]!.author?.id).toBe("A3");
  });

  it("fills the kept copy's missing affiliations from its twin", () => {
    const w = work([
      au("A One", "A One", { author_position: "first", id: "A1" }),
      au("B Two", "B Two", { id: "B2", countries: ["FR"] }),
      au("A One", "A One", { id: "A1", institutions: [{ id: "I9" }], countries: ["JP"] }),
      au("B Two", "B Two", { author_position: "last", id: "B2", countries: ["DE"] }),
    ]);
    const [a, b] = normalizeWorkAuthors(w).authorships!;
    expect(a!.institutions).toEqual([{ id: "I9" }]);
    expect(a!.countries).toEqual(["JP"]);
    // The kept copy's own affiliation is not overwritten.
    expect(b!.countries).toEqual(["FR"]);
    expect(b!.is_corresponding).toBeUndefined();
  });

  it("tolerates malformed authorship entries", () => {
    const w = work([
      au("A One", "A One", { author_position: "first" }),
      au("B Two", "B Two"),
      null as unknown as OpenAlexAuthorship,
      au("A One", "A One"),
      au("B Two", "B Two"),
    ]);
    expect(normalizeWorkAuthors(w).authorships).toEqual([
      au("A One", "A One", { author_position: "first" }),
      au("B Two", "B Two"),
      null,
    ]);
    const empty: OpenAlexWork = { id: "W1", authorships: [] };
    expect(normalizeWorkAuthors(empty)).toBe(empty);
  });

  it("prefers the copy carrying one of the account holder's author ids", () => {
    const w = work([
      au("Ada Lovelace", "Ada Lovelace", { author_position: "first", id: "A1", orcid: "o1" }),
      au("Basile Chrétien", "Basile Chrétien", { id: "A-other", orcid: "o2" }),
      au("Ada Lovelace", "Ada Lovelace", { id: "A1", orcid: "o1" }),
      au("Basile Chrétien", "Basile Chrétien", {
        author_position: "last",
        id: "https://openalex.org/A5001069481",
      }),
    ]);
    const out = normalizeWorkAuthors(w, new Set(["A5001069481"]));
    expect(out.authorships!.map((a) => a.author?.id)).toEqual([
      "A1",
      "https://openalex.org/A5001069481",
    ]);
  });

  it("re-derives first/last once the tail copy of a whole list is dropped", () => {
    const w = work([
      au("A One", "A One", { author_position: "first" }),
      au("B Two", "B Two"),
      au("C Three", "C Three"),
      au("A One", "A One"),
      au("B Two", "B Two"),
      au("C Three", "C Three", { author_position: "last" }),
    ]);
    const out = normalizeWorkAuthors(w);
    expect(out.authorships!.map((a) => a.author_position)).toEqual(["first", "middle", "last"]);
  });

  it("keeps a single 'last': a kept copy's last author that is no longer last is middle", () => {
    const w = work([
      au("A One", "A One", { author_position: "first" }),
      au("B Two", "B Two", { author_position: "last" }),
      au("A One", "A One"),
      au("B Two", "B Two"),
      au("C Three", "C Three", { author_position: "last" }),
    ]);
    expect(normalizeWorkAuthors(w).authorships!.map((a) => a.author_position)).toEqual([
      "first",
      "middle",
      "last",
    ]);
  });

  it("keeps first and last when a two-author list was printed twice", () => {
    const w = work([
      au("A One", "A One", { author_position: "first" }),
      au("B Two", "B Two", { author_position: "last" }),
      au("A One", "A One"),
      au("B Two", "B Two", { author_position: "last" }),
    ]);
    expect(normalizeWorkAuthors(w).authorships!.map((a) => a.author_position)).toEqual([
      "first",
      "last",
    ]);
  });

  it("cleans names without a profile (raw only) and leaves nameless entries be", () => {
    const w = work([au(undefined, "Basile ChréTien"), au(undefined, undefined)]);
    const out = normalizeWorkAuthors(w);
    expect(out.authorships![0]!.raw_author_name).toBe("Basile Chrétien");
    expect(out.authorships![0]!.author).toBeUndefined();
    expect(out.authorships![1]).toEqual(w.authorships![1]);
  });

  it("returns the very same work when there is nothing to repair", () => {
    const w = work([au("Ada Lovelace", "Ada Lovelace"), au("Basile Chrétien", "B. Chretien")]);
    expect(normalizeWorkAuthors(w)).toBe(w);
    const bare: OpenAlexWork = { id: "W1" };
    expect(normalizeWorkAuthors(bare)).toBe(bare);
  });

  it("never mutates its input", () => {
    const w = recover();
    const snapshot = JSON.parse(JSON.stringify(w));
    normalizeWorkAuthors(w);
    expect(w).toEqual(snapshot);
  });
});

describe("the client serves normalised works", () => {
  let fetchMock: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fetchWorksByAuthorIds repairs names and keeps the account holder's copy", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          results: [
            work([
              au("Kenji U\uFFFDda", "Kenji Uda", { author_position: "first" }),
              au("Basile ChréTien", "Basile Chrétien", { id: "A-dup" }),
              au("Ada Lovelace", "Ada Lovelace"),
              au("Basile Chrétien", "Basile Chrétien", { id: "https://openalex.org/A9" }),
              au("Ada Lovelace", "Ada Lovelace", { author_position: "last" }),
            ]),
          ],
          meta: { next_cursor: null },
        }),
      ),
    );
    const [w] = await fetchWorksByAuthorIds(["A9"]);
    expect(w!.authorships!.map((a) => [a.author?.display_name, a.author?.id])).toEqual([
      ["Kenji Uda", undefined],
      ["Basile Chrétien", "https://openalex.org/A9"],
      ["Ada Lovelace", undefined],
    ]);
  });

  it("fetchWorkByDoi repairs names too", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(work([au("Basile ChréTien", "B. Chretien")]))),
    );
    const w = await fetchWorkByDoi("10.1093/ehjcvp/pvaf027");
    expect(w!.authorships![0]!.author?.display_name).toBe("Basile Chrétien");
  });
});
