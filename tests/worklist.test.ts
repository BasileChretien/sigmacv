import { describe, expect, it } from "vitest";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import {
  OPEN_POLICY_FINDER_URL,
  affiliationGaps,
  hasWorklistContent,
  openAccessState,
  openAccessStates,
  policyFinderUrl,
} from "@/lib/cv/worklist";

/**
 * The owner worklist: help with the record, never a verdict. The affiliation
 * check is the one with a verb — a current position without a ROR record — and
 * the open-access states are derived ONLY from stored fields (`oaIsOpen`,
 * `license`). Nothing here reads as compliance.
 */

const NAGOYA = "04chrp450";

function work(
  id: string,
  over: Partial<CvItem> & { meta?: CvItem["meta"]; title?: string } = {},
): CvItem {
  const { title, meta, ...rest } = over;
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id, type: "article-journal", title: title ?? `Work ${id}`, "container-title": "J. Ex." },
    meta: { year: 2022, ...(meta ?? {}) },
    ...rest,
  };
}

function position(
  id: string,
  meta: CvItem["meta"],
  over: Partial<CvItem> = {},
  displayText = `Role at ${meta.institution ?? "somewhere"}`,
): CvItem {
  return {
    id,
    source: "orcid",
    sourceId: id,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    displayText,
    meta,
    ...over,
  };
}

function makeCv(opts: {
  works?: CvItem[];
  preprints?: CvItem[];
  positions?: CvItem[];
  display?: Record<string, unknown>;
}): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "wl",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Basile Chrétien" },
    display: opts.display ?? {},
    sections: [
      {
        id: "positions",
        type: "positions",
        title: "Positions",
        visible: true,
        order: 0,
        items: opts.positions ?? [],
      },
      {
        id: "publications",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 1,
        items: opts.works ?? [],
      },
      {
        id: "preprints",
        type: "preprints",
        title: "Preprints",
        visible: true,
        order: 2,
        items: opts.preprints ?? [],
      },
    ],
    provenance: { generatedAt: "2026-09-08T00:00:00.000Z", sources: ["openalex"] },
  });
}

const nagoyaNow = position("p-nagoya", {
  institution: "Nagoya University",
  rorId: NAGOYA,
  startYear: 2020,
});
describe("affiliationGaps — current positions without a ROR record", () => {
  it("lists visible current positions whose ROR is unresolved, with the institution as the CV shows it", () => {
    const noRor = position("p-noror", { institution: "Some Hospital", startYear: 2021 });
    const renamed = position("p-renamed", {
      institution: "Some Lab",
      institutionOverride: "My Lab",
      startYear: 2021,
    });
    const junk = position("p-junk", { institution: "Junk", rorId: "not-a-ror", startYear: 2021 });
    const ended = position("p-ended", { institution: "Past", startYear: 2000, endYear: 2001 });
    const bare = position("p-bare", {}, {}, "Visiting fellow, Somewhere");
    const cv = makeCv({ positions: [nagoyaNow, noRor, renamed, junk, ended, bare] });
    const gaps = affiliationGaps(cv);
    expect(gaps.currentPositions).toBe(5);
    expect(gaps.positionsWithoutRor).toEqual([
      { itemId: "p-noror", label: "Some Hospital" },
      { itemId: "p-renamed", label: "My Lab" },
      { itemId: "p-junk", label: "Junk" },
      { itemId: "p-bare", label: "Visiting fellow, Somewhere" },
    ]);
  });

  it("labels a position with neither institution nor text with an empty string rather than failing", () => {
    const empty = position("p-empty", {}, { displayText: undefined });
    expect(affiliationGaps(makeCv({ positions: [empty] })).positionsWithoutRor).toEqual([
      { itemId: "p-empty", label: "" },
    ]);
  });
});

describe("openAccessState — four states from stored fields only", () => {
  it("derives each state", () => {
    expect(openAccessState({ meta: { oaIsOpen: true, license: "cc-by" } })).toBe("open-cc");
    expect(openAccessState({ meta: { oaIsOpen: true, license: " CC-BY-NC-ND " } })).toBe("open-cc");
    // The two edges: CC0 is a Creative Commons instrument with no "cc-" prefix;
    // public domain is open but not Creative Commons.
    expect(openAccessState({ meta: { oaIsOpen: true, license: "cc0" } })).toBe("open-cc");
    expect(openAccessState({ meta: { oaIsOpen: true, license: "public-domain" } })).toBe(
      "open-other",
    );
    expect(openAccessState({ meta: { oaIsOpen: true, license: "publisher-specific-oa" } })).toBe(
      "open-other",
    );
    expect(openAccessState({ meta: { oaIsOpen: true } })).toBe("open-other");
    expect(openAccessState({ meta: { oaIsOpen: false, license: "cc-by" } })).toBe(
      "no-open-copy-found",
    );
    expect(openAccessState({ meta: {} })).toBe("not-determined");
    expect(openAccessState({ meta: { oaStatus: "gold" } })).toBe("not-determined");
  });
});

describe("openAccessStates — over the countable works", () => {
  it("counts every state with the countable-works denominator; retracted, hidden, preprints and non-peer-reviewed are excluded", () => {
    const cv = makeCv({
      works: [
        work("open-cc", { meta: { year: 2020, oaIsOpen: true, license: "cc-by" } }),
        work("open-other", { meta: { year: 2020, oaIsOpen: true } }),
        work("closed", { meta: { year: 2020, oaIsOpen: false } }),
        work("unknown", { meta: { year: 2020 } }),
        work("retracted", { meta: { year: 2020, oaIsOpen: false, retracted: true } }),
        work("hidden", { included: false, meta: { year: 2020, oaIsOpen: false } }),
        work("editorial", { meta: { year: 2020, oaIsOpen: false, peerReviewed: false } }),
      ],
      preprints: [work("pp", { meta: { year: 2020, oaIsOpen: false } })],
    });
    const oa = openAccessStates(cv);
    expect(oa.total).toBe(4);
    expect(oa.counts).toEqual({
      "open-cc": 1,
      "open-other": 1,
      "no-open-copy-found": 1,
      "not-determined": 1,
    });
    expect(oa.rows.map((r) => [r.itemId, r.state])).toEqual([
      ["open-cc", "open-cc"],
      ["open-other", "open-other"],
      ["closed", "no-open-copy-found"],
      ["unknown", "not-determined"],
    ]);
  });

  it("carries the venue, licence, year and the funder NAMES as context only (deduped, nameless entries dropped)", () => {
    const cv = makeCv({
      works: [
        work("W1", {
          meta: {
            year: 2021,
            oaIsOpen: false,
            license: "cc-by",
            venueOverride: "PNAS",
            funders: [
              { id: "https://openalex.org/F1", name: "Agence Nationale de la Recherche" },
              {
                id: "https://openalex.org/F1",
                name: "Agence Nationale de la Recherche",
                awardId: "x",
              },
              { id: "https://openalex.org/F2" },
              { id: "https://openalex.org/F3", name: "Wellcome Trust" },
            ],
          },
        }),
        work("W2", { meta: { year: 2021, oaIsOpen: true } }),
      ],
    });
    const [w1, w2] = openAccessStates(cv).rows;
    expect(w1).toEqual({
      itemId: "W1",
      title: "Work W1",
      year: 2021,
      state: "no-open-copy-found",
      license: "cc-by",
      venue: "PNAS",
      funderNames: ["Agence Nationale de la Recherche", "Wellcome Trust"],
      // Nothing stored by the owner's sync, no country on the paper: no rights inputs.
      statutory: [],
    });
    expect(w2!.venue).toBe("J. Ex.");
    expect(w2!.funderNames).toEqual([]);
    expect(w2!.license).toBeUndefined();
    // No route, no mandate, no "applies" — the row carries names and nothing else.
    expect(Object.keys(w1!)).not.toContain("route");
    expect(Object.keys(w1!)).not.toContain("mandate");
  });
});

describe("policyFinderUrl", () => {
  it("links Open Policy Finder with the journal name in the search parameter, URL-encoded", () => {
    expect(policyFinderUrl("Journal of Clinical Pharmacology & Therapeutics")).toBe(
      `${OPEN_POLICY_FINDER_URL}?q=Journal%20of%20Clinical%20Pharmacology%20%26%20Therapeutics`,
    );
    expect(policyFinderUrl("  PNAS ")).toBe(`${OPEN_POLICY_FINDER_URL}?q=PNAS`);
  });

  it("returns undefined without a journal name (no ISSN is stored, so there is nothing to search)", () => {
    expect(policyFinderUrl(undefined)).toBeUndefined();
    expect(policyFinderUrl("   ")).toBeUndefined();
  });
});

describe("hasWorklistContent", () => {
  it("is true when any group has a row, false otherwise", () => {
    const empty = { positionsWithoutRor: [], currentPositions: 1 };
    expect(hasWorklistContent(empty, 0)).toBe(false);
    expect(
      hasWorklistContent({ ...empty, positionsWithoutRor: [{ itemId: "p", label: "X" }] }, 0),
    ).toBe(true);
    // A paper the owner can deposit today is a reason; a closed work with no
    // ground is not (the list shows only what can be acted on).
    expect(hasWorklistContent(empty, 1)).toBe(true);
    // A grant join is a reason.
    expect(hasWorklistContent(empty, 0, 1)).toBe(true);
    expect(hasWorklistContent(empty, 0, 0)).toBe(false);
  });
});
