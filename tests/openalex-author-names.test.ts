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
 * publisher deposited twice (RECOVER, 10.3171/2025.1.jns242509) is collapsed —
 * never across two different ORCID iDs, never for a run of fewer than three.
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

/** Same printed name as `au`, profile name included. */
const same = (name: string, extra: Parameters<typeof au>[2] = {}) => au(name, name, extra);

const ORCID_A = "https://orcid.org/0000-0001-0000-0001";
const ORCID_B = "https://orcid.org/0000-0001-0000-0002";
const OWNER_ORCID = "0000-0002-7483-2489";

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

  it("never swaps in a printed name that is itself garbled", () => {
    expect(authorshipName(au("Ганс Мюллер", "Hans M\uFFFDller"))).toBe("Ганс Мюллер");
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

  it("ignores names that are not strings", () => {
    const odd = { author: { display_name: 42 }, raw_author_name: ["x"] } as never;
    expect(authorshipName(odd)).toBeUndefined();
  });
});

function work(authorships: OpenAlexAuthorship[]): OpenAlexWork {
  return { id: "https://openalex.org/W4410429520", title: "RECOVER study", authorships };
}

/** The RECOVER byline as OpenAlex serves it (positions 8–12 repeated at 14–18,
 *  the second Osamu Suzuki under a Cyrillic profile), shortened around the run. */
function recover(): OpenAlexWork {
  return work([
    same("Shinsuke Muraoka", { author_position: "first", id: "A1" }),
    same("Basile Chrétien", {
      id: "https://openalex.org/A5001069481",
      orcid: `https://orcid.org/${OWNER_ORCID}`,
    }),
    same("Satoshi Maesawa", { id: "A3" }),
    same("Shinji Shimato", { id: "A4a" }),
    same("Takeshi Kinkori", { id: "A5" }),
    same("Takumi Asai", { id: "A6", is_corresponding: false }),
    same("Osamu Suzuki", { id: "A7a" }),
    same("Ryuta Saito", { id: "A8" }),
    same("Satoshi Maesawa", { id: "A3" }),
    same("Shinji Shimato", {
      id: "A4b",
      orcid: "https://orcid.org/0000-0001-9424-8389",
      institutions: [{ id: "I1", display_name: "Nagoya" }],
      countries: ["JP"],
    }),
    same("Takeshi Kinkori", { id: "A5" }),
    same("Takumi Asai", { id: "A6", is_corresponding: true }),
    au("Осаму Сузукі", "Osamu Suzuki", {
      id: "A7b",
      orcid: "https://orcid.org/0000-0002-2975-1452",
    }),
    same("Shigemasa Hayashi", { author_position: "last", id: "A9" }),
  ]);
}

describe("normalizeWorkAuthors", () => {
  it("collapses RECOVER's repeated run and cleans the Cyrillic profile name", () => {
    const out = normalizeWorkAuthors(recover());
    expect(out.authorships!.map((a) => a.author?.display_name)).toEqual([
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

  it("never merges two copies that carry different ORCID iDs", () => {
    // Same names in the same order, but every pair is two identified people.
    const w = work([
      same("Yan Wang", { author_position: "first", id: "A1", orcid: ORCID_A }),
      same("Li Zhang", { id: "A2", orcid: ORCID_B }),
      same("Mei Chen", { id: "A3" }),
      same("Yan Wang", { id: "A9", orcid: `https://orcid.org/${OWNER_ORCID}` }),
      same("Li Zhang", { id: "A8", orcid: "https://orcid.org/0000-0001-0000-0008" }),
      same("Mei Chen", { id: "A3" }),
      same("Hui Liu", { author_position: "last" }),
    ]);
    expect(normalizeWorkAuthors(w)).toBe(w);
  });

  it("stops a run at the first pair with different ORCID iDs", () => {
    const w = work([
      same("A One", { author_position: "first" }),
      same("B Two"),
      same("C Three"),
      same("D Four", { orcid: ORCID_A }),
      same("A One"),
      same("B Two"),
      same("C Three"),
      same("D Four", { orcid: ORCID_B, author_position: "last" }),
    ]);
    expect(normalizeWorkAuthors(w).authorships!.map((a) => a.author?.display_name)).toEqual([
      "A One",
      "B Two",
      "C Three",
      "D Four",
      "D Four",
    ]);
  });

  it("never collapses a run of two: two names can recur for four people", () => {
    const w = work([
      same("J. Wang", { author_position: "first" }),
      same("Z. Wang"),
      same("X. Li"),
      same("J. Wang"),
      same("Z. Wang", { author_position: "last" }),
    ]);
    expect(normalizeWorkAuthors(w)).toBe(w);
  });

  it("prefers the copy carrying one of the account holder's author ids", () => {
    const w = work([
      same("Ada Lovelace", { author_position: "first", id: "A1", orcid: ORCID_A }),
      same("Basile Chrétien", { id: "A-other" }),
      same("Mary Somerville", { id: "A3" }),
      same("Ada Lovelace", { id: "A1", orcid: ORCID_A }),
      same("Basile Chrétien", { id: "https://openalex.org/A5001069481" }),
      same("Mary Somerville", { id: "A3", author_position: "last" }),
    ]);
    const out = normalizeWorkAuthors(w, { authorIds: ["A5001069481"] });
    expect(out.authorships!.map((a) => a.author?.id)).toEqual([
      "A1",
      "https://openalex.org/A5001069481",
      "A3",
    ]);
  });

  it("prefers a copy carrying an ORCID over one with an author id only", () => {
    const w = work([
      same("Ada Lovelace", { author_position: "first" }),
      same("Basile Chrétien", { id: "A-orphan" }),
      same("Mary Somerville"),
      same("Ada Lovelace"),
      same("Basile Chrétien", { orcid: `https://orcid.org/${OWNER_ORCID}` }),
      same("Mary Somerville", { author_position: "last" }),
    ]);
    const out = normalizeWorkAuthors(w);
    expect(out.authorships![1]!.author?.orcid).toBe(`https://orcid.org/${OWNER_ORCID}`);
  });

  it("keeps both copies' affiliations and countries, each once", () => {
    const w = work([
      same("A One", { author_position: "first", id: "A1" }),
      same("B Two", { id: "B2", countries: ["FR"] }),
      same("C Three", { id: "C3" }),
      same("A One", { id: "A1", institutions: [{ id: "I9" }], countries: ["JP"] }),
      same("B Two", { id: "B2", countries: ["DE"] }),
      same("C Three", { id: "C3", author_position: "last" }),
    ]);
    const [a, b] = normalizeWorkAuthors(w).authorships!;
    expect(a!.institutions).toEqual([{ id: "I9" }]);
    expect(a!.countries).toEqual(["JP"]);
    // The kept copy's own affiliation first, then what only the twin knew.
    expect(b!.countries).toEqual(["FR", "DE"]);
    expect(b!.is_corresponding).toBeUndefined();
  });

  it("keeps malformed affiliation entries once each, without throwing", () => {
    const odd = [null, {}, { id: "I1" }] as unknown as OpenAlexAuthorship["institutions"];
    const w = work([
      same("A One", { author_position: "first", institutions: odd }),
      same("B Two"),
      same("C Three"),
      same("A One", { institutions: [{}, { id: "I1" }] as never }),
      same("B Two"),
      same("C Three", { author_position: "last" }),
    ]);
    expect(normalizeWorkAuthors(w).authorships![0]!.institutions).toEqual([null, {}, { id: "I1" }]);
  });

  it("fills the kept identity's missing ORCID from its twin (the same iD, by the veto)", () => {
    const w = work([
      same("Ada Lovelace", { author_position: "first" }),
      same("Basile Chrétien", { id: "https://openalex.org/A5001069481" }),
      same("Mary Somerville"),
      same("Ada Lovelace"),
      same("Basile Chrétien", {
        id: "A-other",
        orcid: `https://orcid.org/${OWNER_ORCID}`,
        institutions: [{ id: "I1" }, { display_name: "Unnamed lab" }],
      }),
      same("Mary Somerville", { author_position: "last" }),
    ]);
    const basile = normalizeWorkAuthors(w, { authorIds: ["A5001069481"] }).authorships![1]!;
    expect(basile.author?.id).toBe("https://openalex.org/A5001069481");
    expect(basile.author?.orcid).toBe(`https://orcid.org/${OWNER_ORCID}`);
    expect(basile.institutions).toEqual([{ id: "I1" }, { display_name: "Unnamed lab" }]);
  });

  it("re-derives first/last once the tail copy of a whole list is dropped", () => {
    const w = work([
      same("A One", { author_position: "first" }),
      same("B Two"),
      same("C Three"),
      same("A One"),
      same("B Two"),
      same("C Three", { author_position: "last" }),
    ]);
    const out = normalizeWorkAuthors(w);
    expect(out.authorships!.map((a) => a.author_position)).toEqual(["first", "middle", "last"]);
  });

  it("keeps a single 'last': a kept copy's last author that is no longer last is middle", () => {
    const w = work([
      same("A One", { author_position: "first" }),
      same("B Two"),
      same("C Three", { author_position: "last" }),
      same("A One"),
      same("B Two"),
      same("C Three"),
      same("D Four", { author_position: "last" }),
    ]);
    expect(normalizeWorkAuthors(w).authorships!.map((a) => a.author_position)).toEqual([
      "first",
      "middle",
      "middle",
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

  it("tolerates malformed authorship entries and fields", () => {
    const w = work([
      same("A One", { author_position: "first" }),
      same("B Two"),
      same("C Three"),
      null as unknown as OpenAlexAuthorship,
      { author: "x", raw_author_name: 7 } as unknown as OpenAlexAuthorship,
      same("A One"),
      same("B Two"),
      same("C Three"),
    ]);
    expect(normalizeWorkAuthors(w).authorships).toEqual([
      same("A One", { author_position: "first" }),
      same("B Two"),
      same("C Three"),
      null,
      { author: "x", raw_author_name: 7 },
    ]);
    const empty: OpenAlexWork = { id: "W1", authorships: [] };
    expect(normalizeWorkAuthors(empty)).toBe(empty);
  });

  it("returns the very same work when there is nothing to repair", () => {
    const w = work([same("Ada Lovelace"), au("Basile Chrétien", "B. Chretien")]);
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

  const doubled = () =>
    work([
      au("Kenji U\uFFFDda", "Kenji Uda", { author_position: "first" }),
      au("Basile ChréTien", "Basile Chrétien", { id: "A-dup" }),
      same("Ada Lovelace"),
      same("Mary Somerville"),
      same("Basile Chrétien", { id: "https://openalex.org/A9" }),
      same("Ada Lovelace"),
      same("Mary Somerville", { author_position: "last" }),
    ]);

  it("fetchWorksByAuthorIds repairs names and keeps the account holder's copy", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ results: [doubled()], meta: { next_cursor: null } })),
    );
    const [w] = await fetchWorksByAuthorIds(["A9"]);
    expect(w!.authorships!.map((a) => [a.author?.display_name, a.author?.id])).toEqual([
      ["Kenji Uda", undefined],
      ["Basile Chrétien", "https://openalex.org/A9"],
      ["Ada Lovelace", undefined],
      ["Mary Somerville", undefined],
    ]);
  });

  it("fetchWorkByDoi repairs names and keeps the copy of the owner it is given", async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(doubled())));
    const w = await fetchWorkByDoi("10.1093/ehjcvp/pvaf027", { authorIds: ["A9"] });
    expect(w!.authorships!.map((a) => a.author?.id)).toEqual([
      undefined,
      "https://openalex.org/A9",
      undefined,
      undefined,
    ]);
    expect(w!.authorships![1]!.author?.display_name).toBe("Basile Chrétien");
  });
});
