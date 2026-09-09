import { describe, expect, it } from "vitest";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import {
  OPEN_POLICY_FINDER_URL,
  affiliationGaps,
  groupByRor,
  hasWorklistContent,
  openAccessState,
  openAccessStates,
  policyFinderUrl,
} from "@/lib/cv/worklist";

/**
 * The owner worklist: help with the record, never a verdict. Affiliation gaps
 * are computed STRICTLY against the ROR ids the researcher consented to (no
 * lineage folding — that belongs to the institution page), and the open-access
 * states are derived ONLY from stored fields (`oaIsOpen`, `license`). Nothing
 * here reads as compliance.
 */

const NAGOYA = "04chrp450";
const CAEN = "04d9jrx35";
const OTHER = "02kpeqv85";

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
const caenPast = position("p-caen", {
  institution: "CHU de Caen Normandie",
  rorId: `https://ror.org/${CAEN}`,
  startYear: 2015,
  endYear: 2019,
});

describe("affiliationGaps — works inside consented position windows", () => {
  it("flags a work dated in the window whose printed affiliation carries none of the consented ids", () => {
    const cv = makeCv({
      positions: [nagoyaNow],
      works: [work("W1", { meta: { year: 2022, workInstitutions: [`https://ror.org/${OTHER}`] } })],
    });
    const gaps = affiliationGaps(cv, [NAGOYA]);
    expect(gaps.consideredWorks).toBe(1);
    expect(gaps.missing).toEqual([{ itemId: "W1", title: "Work W1", year: 2022, rorIds: [OTHER] }]);
    expect(gaps.noAffiliationData).toEqual([]);
  });

  it("accepts the consented id in either the IRI or the bare form, and never flags it", () => {
    const cv = makeCv({
      positions: [nagoyaNow],
      works: [
        work("W1", { meta: { year: 2022, workInstitutions: [`https://ror.org/${NAGOYA}`] } }),
        work("W2", {
          meta: { year: 2023, workInstitutions: [NAGOYA, `https://ror.org/${OTHER}`] },
        }),
      ],
    });
    const gaps = affiliationGaps(cv, [NAGOYA]);
    expect(gaps.consideredWorks).toBe(2);
    expect(gaps.missing).toEqual([]);
  });

  it("puts works with EMPTY affiliation data in their own bucket — never 'missing'", () => {
    const cv = makeCv({
      positions: [nagoyaNow],
      works: [
        work("W1", { meta: { year: 2022 } }),
        work("W2", { meta: { year: 2022, workInstitutions: [] } }),
      ],
    });
    const gaps = affiliationGaps(cv, [NAGOYA]);
    expect(gaps.missing).toEqual([]);
    expect(gaps.noAffiliationData.map((r) => r.itemId)).toEqual(["W1", "W2"]);
    expect(gaps.consideredWorks).toBe(2);
  });

  it("ignores works outside every consented window (source dates: start..end inclusive; no end = ongoing)", () => {
    const cv = makeCv({
      positions: [nagoyaNow, caenPast],
      works: [
        work("W-before", { meta: { year: 2014, workInstitutions: [`https://ror.org/${OTHER}`] } }),
        work("W-caen-edge", {
          meta: { year: 2019, workInstitutions: [`https://ror.org/${OTHER}`] },
        }),
        work("W-between", {
          meta: { year: 2019, workInstitutions: [`https://ror.org/${NAGOYA}`] },
        }),
        work("W-nagoya-start", {
          meta: { year: 2020, workInstitutions: [`https://ror.org/${OTHER}`] },
        }),
        work("W-far-future", {
          meta: { year: 2099, workInstitutions: [`https://ror.org/${OTHER}`] },
        }),
      ],
    });
    const gaps = affiliationGaps(cv, [NAGOYA, CAEN]);
    expect(gaps.missing.map((r) => r.itemId)).toEqual([
      "W-caen-edge",
      "W-nagoya-start",
      "W-far-future",
    ]);
    // W-between (2019) is inside Caen's window and carries Nagoya — a consented
    // id — so it is fine: multi-ROR consent matches ANY consented id.
    expect(gaps.consideredWorks).toBe(4);
  });

  it("uses the owner's date-range override INSTEAD of the source dates", () => {
    const overridden = position("p-over", {
      institution: "Nagoya University",
      rorId: NAGOYA,
      startYear: 2010,
      endYear: 2012,
      dateRangeOverride: { startYear: 2020 },
    });
    const cv = makeCv({
      positions: [overridden],
      works: [
        work("W-2011", { meta: { year: 2011, workInstitutions: [`https://ror.org/${OTHER}`] } }),
        work("W-2021", { meta: { year: 2021, workInstitutions: [`https://ror.org/${OTHER}`] } }),
      ],
    });
    expect(affiliationGaps(cv, [NAGOYA]).missing.map((r) => r.itemId)).toEqual(["W-2021"]);
  });

  it("uses the owner's year override for the work, skips undated works, and skips hidden / not-mine works", () => {
    const cv = makeCv({
      positions: [nagoyaNow],
      works: [
        work("W-override", {
          meta: { year: 2010, yearOverride: 2022, workInstitutions: [`https://ror.org/${OTHER}`] },
        }),
        // The helper defaults `year`; drop it entirely for a truly undated work.
        { ...work("W-undated"), meta: { workInstitutions: [`https://ror.org/${OTHER}`] } },
        work("W-hidden", {
          included: false,
          meta: { year: 2022, workInstitutions: [`https://ror.org/${OTHER}`] },
        }),
        work("W-notmine", {
          notMine: true,
          meta: { year: 2022, workInstitutions: [`https://ror.org/${OTHER}`] },
        }),
      ],
    });
    const gaps = affiliationGaps(cv, [NAGOYA]);
    expect(gaps.missing.map((r) => r.itemId)).toEqual(["W-override"]);
    expect(gaps.consideredWorks).toBe(1);
  });

  it("considers preprints too (affiliation is about the paper, not the figures)", () => {
    const cv = makeCv({
      positions: [nagoyaNow],
      preprints: [
        work("PP1", { meta: { year: 2022, workInstitutions: [`https://ror.org/${OTHER}`] } }),
      ],
    });
    expect(affiliationGaps(cv, [NAGOYA]).missing.map((r) => r.itemId)).toEqual(["PP1"]);
  });

  it("has no windows without consent, from a hidden position, or from a position with no start year", () => {
    const hidden = position(
      "p-hidden",
      { institution: "Nagoya University", rorId: NAGOYA, startYear: 2020 },
      { included: false },
    );
    const undated = position("p-undated", { institution: "Nagoya University", rorId: NAGOYA });
    const works = [
      work("W1", { meta: { year: 2022, workInstitutions: [`https://ror.org/${OTHER}`] } }),
    ];
    expect(affiliationGaps(makeCv({ positions: [nagoyaNow], works }), []).missing).toEqual([]);
    expect(affiliationGaps(makeCv({ positions: [hidden], works }), [NAGOYA]).missing).toEqual([]);
    expect(affiliationGaps(makeCv({ positions: [undated], works }), [NAGOYA]).missing).toEqual([]);
    expect(affiliationGaps(makeCv({ positions: [undated], works }), [NAGOYA]).consideredWorks).toBe(
      0,
    );
  });

  it("keeps a non-ROR affiliation value as printed (lower-cased) so the group is still explainable", () => {
    const cv = makeCv({
      positions: [nagoyaNow],
      works: [work("W1", { meta: { year: 2022, workInstitutions: ["https://example.org/X "] } })],
    });
    expect(affiliationGaps(cv, [NAGOYA]).missing[0]!.rorIds).toEqual(["https://example.org/x"]);
  });

  it("falls back to an untitled row when the CSL has no title", () => {
    const cv = makeCv({
      positions: [nagoyaNow],
      works: [
        {
          ...work("W1", { meta: { year: 2022, workInstitutions: [`https://ror.org/${OTHER}`] } }),
          csl: { id: "W1", type: "article-journal" },
        },
      ],
    });
    expect(affiliationGaps(cv, [NAGOYA]).missing[0]!.title).toBeUndefined();
  });
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
    const gaps = affiliationGaps(cv, []);
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
    expect(affiliationGaps(makeCv({ positions: [empty] }), []).positionsWithoutRor).toEqual([
      { itemId: "p-empty", label: "" },
    ]);
  });
});

describe("groupByRor", () => {
  it("groups gap rows under EACH ROR they carry, largest group first, then by id", () => {
    const rows = [
      { itemId: "A", rorIds: ["z1", "a1"] },
      { itemId: "B", rorIds: ["a1"] },
      { itemId: "C", rorIds: ["m1"] },
    ];
    expect(groupByRor(rows)).toEqual([
      { rorId: "a1", rows: [rows[0], rows[1]] },
      { rorId: "m1", rows: [rows[2]] },
      { rorId: "z1", rows: [rows[0]] },
    ]);
  });
});

describe("openAccessState — four states from stored fields only", () => {
  it("derives each state", () => {
    expect(openAccessState({ meta: { oaIsOpen: true, license: "cc-by" } })).toBe("open-cc");
    expect(openAccessState({ meta: { oaIsOpen: true, license: " CC-BY-NC-ND " } })).toBe("open-cc");
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
    const empty = {
      positionsWithoutRor: [],
      currentPositions: 1,
      missing: [],
      noAffiliationData: [],
      consideredWorks: 3,
    };
    const oaEmpty = {
      rows: [{ itemId: "x", state: "open-cc" as const, funderNames: [] }],
      counts: { "open-cc": 1, "open-other": 0, "no-open-copy-found": 0, "not-determined": 0 },
      total: 1,
    };
    expect(hasWorklistContent(empty, oaEmpty)).toBe(false);
    expect(
      hasWorklistContent({ ...empty, positionsWithoutRor: [{ itemId: "p", label: "X" }] }, oaEmpty),
    ).toBe(true);
    expect(
      hasWorklistContent({ ...empty, missing: [{ itemId: "w", rorIds: ["a"] }] }, oaEmpty),
    ).toBe(true);
    expect(hasWorklistContent({ ...empty, noAffiliationData: [{ itemId: "w" }] }, oaEmpty)).toBe(
      true,
    );
    expect(
      hasWorklistContent(empty, {
        ...oaEmpty,
        counts: { ...oaEmpty.counts, "no-open-copy-found": 1 },
      }),
    ).toBe(true);
  });
});
