import { describe, expect, it } from "vitest";
import {
  COUNTED_WORK_TYPES,
  FULL_YEARS_BACK,
  MAX_FOLDED_IDS,
  OA_STATUS_ORDER,
  TOP_N,
  computeInstitutionAggregates,
  countedYears,
  foldedInstitutionIds,
  parseInstitutionAggregates,
  shortOpenAlexId,
  type CountedGroup,
  type InstitutionEntity,
  type InstitutionGroupCounts,
} from "@/lib/institutions/snapshot";

/**
 * The pure half of the OpenAlex organisation snapshot: what the refresh job
 * stores and the institution page renders. Counts only — the plan's
 * "Compliance verdicts" veto bans any share, and the panel's verified shapes
 * (2026-09-08) fix two facts: a hospital is a `related` associated institution,
 * not a lineage child, and the raw yearly series is swamped by datasets.
 */

const NOW = new Date("2026-09-09T10:00:00Z");
const FETCHED = new Date("2026-09-09T10:00:05Z");

/** Université de Caen Normandie as OpenAlex returns it: lineage = parent + self,
 *  the CHU as a `related` institution (a separate entity), a child lab. */
const CAEN: InstitutionEntity = {
  openalexId: "I98702875",
  displayName: "Université de Caen Normandie",
  lineage: ["I4210105918", "I98702875"],
  related: [
    { id: "I4210105918", name: "Normandie Université", relationship: "parent" },
    { id: "I4210114068", ror: "027arzy69", name: "CHU de Caen Normandie", relationship: "related" },
    { id: "I4210099999", name: "Cyceron", relationship: "child" },
  ],
  worksCount: 40_000,
};

const g = (key: string, count: number, label = key): CountedGroup => ({ key, label, count });

function groups(over: Partial<InstitutionGroupCounts> = {}): InstitutionGroupCounts {
  return {
    byYear: [g("2024", 1200), g("2025", 1100), g("2026", 300), g("2019", 900), g("2020", 1000)],
    oaByYear: [
      { year: 2025, groups: [g("gold", 400), g("closed", 500), g("green", 200)] },
      { year: 2026, groups: [g("hybrid", 100), g("bronze", 50), g("mystery", 3)] },
    ],
    countries: [
      g("https://openalex.org/countries/FR", 30_000, "France"),
      g("https://openalex.org/countries/US", 2_000, "United States"),
    ],
    coAffiliations: [
      g("https://openalex.org/I98702875", 40_000, "Université de Caen Normandie"),
      g("https://openalex.org/I4210105918", 39_000, "Normandie Université"),
      g("https://openalex.org/I4210114068", 9_000, "CHU de Caen Normandie"),
      g("https://openalex.org/I4210099999", 2_000, "Cyceron"),
      g("https://openalex.org/I1294671590", 5_000, "CNRS"),
      g("https://openalex.org/I35440088", 4_000, "INSERM"),
    ],
    ...over,
  };
}

describe("shortOpenAlexId / countedYears", () => {
  it("reduces an OpenAlex URI or country key to its last segment, leaving a bare id alone", () => {
    expect(shortOpenAlexId("https://openalex.org/I60134161")).toBe("I60134161");
    expect(shortOpenAlexId("https://openalex.org/countries/JP")).toBe("JP");
    expect(shortOpenAlexId("I60134161")).toBe("I60134161");
    expect(shortOpenAlexId("")).toBe("");
  });

  it("covers the last six full years plus the current one, by UTC year", () => {
    expect(FULL_YEARS_BACK).toBe(6);
    expect(countedYears(NOW)).toEqual([2020, 2021, 2022, 2023, 2024, 2025, 2026]);
    expect(countedYears(new Date("2027-01-01T00:30:00Z"))).toEqual([
      2021, 2022, 2023, 2024, 2025, 2026, 2027,
    ]);
  });
});

describe("foldedInstitutionIds", () => {
  it("folds the entity itself plus its related and child institutions — never a parent", () => {
    // The CHU is `related`, not a lineage child: folding lineage alone would
    // miss every clinician on the hospital's works. The parent (Normandie
    // Université) would fold in every other member university, so it stays out.
    expect(foldedInstitutionIds(CAEN)).toEqual(["I98702875", "I4210114068", "I4210099999"]);
  });

  it("deduplicates, normalises URIs to short ids, and is capped", () => {
    const many: InstitutionEntity = {
      ...CAEN,
      related: Array.from({ length: 80 }, (_, i) => ({
        id: `https://openalex.org/I${i}`,
        name: `R${i}`,
        relationship: "related",
      })).concat([
        { id: "https://openalex.org/I98702875", name: "self again", relationship: "related" },
      ]),
    };
    const ids = foldedInstitutionIds(many);
    expect(ids).toHaveLength(MAX_FOLDED_IDS);
    expect(ids[0]).toBe("I98702875");
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.every((id) => /^I\d+$/.test(id))).toBe(true);
  });
});

describe("computeInstitutionAggregates", () => {
  const agg = computeInstitutionAggregates(CAEN, groups(), { fetchedAt: FETCHED, now: NOW });

  it("states the counted entity: short id, OpenAlex's name, lineage size, related count, folded ids, fetch time", () => {
    expect(agg.version).toBe(1);
    expect(agg.countedEntity).toEqual({
      openalexId: "I98702875",
      displayName: "Université de Caen Normandie",
      lineageSize: 2,
      relatedCount: 3,
      foldedIds: ["I98702875", "I4210114068", "I4210099999"],
      fetchedAt: "2026-09-09T10:00:05.000Z",
    });
  });

  it("labels the type filter that keeps datasets out of the yearly series", () => {
    expect(COUNTED_WORK_TYPES).toEqual(["article", "review", "book-chapter", "preprint"]);
    expect(agg.countedWorkTypes).toEqual([...COUNTED_WORK_TYPES]);
    expect(agg.countedWorkTypes).not.toContain("dataset");
  });

  it("gives every year of the window a works count (zero when OpenAlex returned no group), oldest first, and drops years outside it", () => {
    expect(agg.years).toEqual({ from: 2020, to: 2026 });
    expect(agg.worksByYear).toEqual([
      { year: 2020, count: 1000 },
      { year: 2021, count: 0 },
      { year: 2022, count: 0 },
      { year: 2023, count: 0 },
      { year: 2024, count: 1200 },
      { year: 2025, count: 1100 },
      { year: 2026, count: 300 },
    ]);
    expect(agg.worksByYear.some((r) => r.year === 2019)).toBe(false);
  });

  it("stores the OA status counts per year in OpenAlex's status order, unknown statuses last, years outside the window dropped", () => {
    expect(OA_STATUS_ORDER).toEqual(["gold", "hybrid", "diamond", "green", "bronze", "closed"]);
    expect(agg.oaByStatusByYear).toEqual([
      { year: 2025, status: "gold", count: 400 },
      { year: 2025, status: "green", count: 200 },
      { year: 2025, status: "closed", count: 500 },
      { year: 2026, status: "hybrid", count: 100 },
      { year: 2026, status: "bronze", count: 50 },
      { year: 2026, status: "mystery", count: 3 },
    ]);
    const out = computeInstitutionAggregates(
      CAEN,
      groups({ oaByYear: [{ year: 2010, groups: [g("gold", 1)] }] }),
      { fetchedAt: FETCHED, now: NOW },
    );
    expect(out.oaByStatusByYear).toEqual([]);
  });

  it("keeps the institution's own country in the top countries, as a code + name + count", () => {
    expect(agg.topCountries).toEqual([
      { code: "FR", name: "France", count: 30_000 },
      { code: "US", name: "United States", count: 2_000 },
    ]);
  });

  it("excludes every id of the entity's own lineage AND every related institution from the co-affiliations", () => {
    expect(agg.topCoAffiliations).toEqual([
      { openalexId: "I1294671590", name: "CNRS", count: 5_000 },
      { openalexId: "I35440088", name: "INSERM", count: 4_000 },
    ]);
  });

  it("caps both top lists at TOP_N, highest count first", () => {
    expect(TOP_N).toBe(15);
    const countries = Array.from({ length: 40 }, (_, i) =>
      g(`https://openalex.org/countries/C${i}`, 40 - i, `Country ${i}`),
    ).reverse();
    const coAff = Array.from({ length: 40 }, (_, i) =>
      g(`https://openalex.org/I9${i}`, 100 + i, `Org ${i}`),
    );
    const out = computeInstitutionAggregates(CAEN, groups({ countries, coAffiliations: coAff }), {
      fetchedAt: FETCHED,
      now: NOW,
    });
    expect(out.topCountries).toHaveLength(TOP_N);
    expect(out.topCountries[0]).toEqual({ code: "C0", name: "Country 0", count: 40 });
    expect(out.topCoAffiliations).toHaveLength(TOP_N);
    expect(out.topCoAffiliations[0]!.count).toBe(139);
  });

  it("defaults `now` to the wall clock and tolerates numeric group keys", () => {
    const out = computeInstitutionAggregates(
      CAEN,
      groups({ byYear: [{ key: String(new Date().getUTCFullYear()), label: "y", count: 7 }] }),
      { fetchedAt: FETCHED },
    );
    expect(out.worksByYear.at(-1)).toEqual({ year: new Date().getUTCFullYear(), count: 7 });
    expect(out.worksByYear).toHaveLength(FULL_YEARS_BACK + 1);
  });

  it("never stores a share, percentage or ratio — counts and their explicit denominators only", () => {
    const json = JSON.stringify(agg).toLowerCase();
    for (const banned of ["share", "pct", "percent", "%", "ratio", "rate", "score", "rank"]) {
      expect(json, banned).not.toContain(banned);
    }
    expect(Object.keys(agg).sort()).toEqual([
      "countedEntity",
      "countedWorkTypes",
      "oaByStatusByYear",
      "topCoAffiliations",
      "topCountries",
      "version",
      "worksByYear",
      "years",
    ]);
  });

  it("round-trips through the stored-JSON parser, which rejects anything else", () => {
    expect(parseInstitutionAggregates(JSON.parse(JSON.stringify(agg)))).toEqual(agg);
    expect(parseInstitutionAggregates(null)).toBeNull();
    expect(parseInstitutionAggregates({ version: 2 })).toBeNull();
    expect(
      parseInstitutionAggregates({ ...agg, worksByYear: [{ year: 2024, count: -1 }] }),
    ).toBeNull();
    expect(
      parseInstitutionAggregates({ ...agg, topCountries: [{ code: "FR", count: 1 }] }),
    ).toBeNull();
  });

  it("refuses ids and country codes that are not the OpenAlex shapes — they become hrefs and the JSON-LD sameAs", () => {
    const entity = (openalexId: string) => ({
      ...agg,
      countedEntity: { ...agg.countedEntity, openalexId },
    });
    for (const bad of ["javascript:alert(1)", "https://openalex.org/I1", "i1", "I", "I1 "]) {
      expect(parseInstitutionAggregates(entity(bad)), bad).toBeNull();
      expect(
        parseInstitutionAggregates({
          ...agg,
          topCoAffiliations: [{ openalexId: bad, name: "x", count: 1 }],
        }),
        bad,
      ).toBeNull();
    }
    for (const bad of ["fr", "FRA", "F", "javascript:", ""]) {
      expect(
        parseInstitutionAggregates({ ...agg, topCountries: [{ code: bad, name: "x", count: 1 }] }),
        bad,
      ).toBeNull();
    }
    expect(parseInstitutionAggregates(entity("I4210114068"))).not.toBeNull();
  });
});
