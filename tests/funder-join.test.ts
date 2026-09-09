import { describe, expect, it } from "vitest";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import {
  fundrefDoiOf,
  joinOwnerFunding,
  normalizeAwardId,
  shortOpenAlexFunderId,
  toCrosswalk,
  workFunderIds,
  type FunderRow,
} from "@/lib/funders/join";
import { hasWorklistContent } from "@/lib/cv/worklist";

/**
 * The funder join: the owner's OWN grants (the grants section) against the
 * funders printed on each work (`meta.funders`, OpenAlex `awards[]`). The two
 * carry ids in DIFFERENT namespaces (ORCID FUNDREF/ROR/GRID or a Crossref
 * FundRef DOI on the grant; an OpenAlex `F…` on the work), so a join goes
 * through the `/funders` crosswalk or an award number — never string equality.
 * Pure, deterministic, and it never touches a hidden grant or a hidden work.
 */

const ANR_OA = "F4320332161";
const ANR_URL = `https://openalex.org/${ANR_OA}`;
const ANR_FUNDREF = "10.13039/501100001665";
const ANR_ROR = "00rbzpz17";
const JSPS_OA = "F4320334764";
const JSPS_URL = `https://openalex.org/${JSPS_OA}`;
const JSPS_FUNDREF = "10.13039/501100001691";

const ROWS: FunderRow[] = [
  {
    openalexId: ANR_OA,
    fundrefDoi: ANR_FUNDREF,
    rorId: ANR_ROR,
    name: "Agence Nationale de la Recherche",
  },
  {
    openalexId: JSPS_OA,
    fundrefDoi: JSPS_FUNDREF,
    name: "Japan Society for the Promotion of Science",
  },
];
const CROSSWALK = toCrosswalk(ROWS);
const EMPTY = new Map<string, FunderRow>();

function work(
  id: string,
  funders: NonNullable<CvItem["meta"]["funders"]>,
  over: Partial<CvItem> & { meta?: CvItem["meta"] } = {},
): CvItem {
  const { meta, ...rest } = over;
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id, type: "article-journal", title: `Work ${id}`, "container-title": "J. Ex." },
    // An explicit `meta` replaces the default wholesale (so a test can drop the year).
    meta: meta ?? { year: 2023, oaIsOpen: false, funders },
    ...rest,
  };
}

function grant(id: string, meta: CvItem["meta"], over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "orcid",
    sourceId: id,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    displayText: `Grant ${id}`,
    meta,
    ...over,
  };
}

function makeCv(works: CvItem[], grants: CvItem[]): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "fj",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Basile Chrétien" },
    display: {},
    sections: [
      {
        id: "pubs",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items: works,
      },
      { id: "grants", type: "grants", title: "Grants", visible: true, order: 1, items: grants },
    ],
    provenance: { generatedAt: "2026-09-09T00:00:00.000Z", sources: ["openalex", "orcid"] },
  });
}

describe("helpers", () => {
  it("normalises an award number by case, whitespace, hyphens and slashes only — and refuses short ones", () => {
    expect(normalizeAwardId(" anr-21 ce17/0001 ")).toBe("ANR21CE170001");
    expect(normalizeAwardId("ANR-21-CE17-0001")).toBe("ANR21CE170001");
    // Leading zeros in numeric runs are kept: "0001" and "1" stay different.
    expect(normalizeAwardId("0001")).not.toBe(normalizeAwardId("1"));
    expect(normalizeAwardId(undefined)).toBeUndefined();
    expect(normalizeAwardId("  ")).toBeUndefined();
    expect(normalizeAwardId("1-")).toBeUndefined();
  });

  it("extracts a FundRef DOI from ORCID's FUNDREF form, a doi.org URL or a bare DOI", () => {
    expect(fundrefDoiOf("FUNDREF:http://dx.doi.org/10.13039/501100001665")).toBe(ANR_FUNDREF);
    expect(fundrefDoiOf("https://doi.org/10.13039/501100001665")).toBe(ANR_FUNDREF);
    expect(fundrefDoiOf("10.13039/501100001665")).toBe(ANR_FUNDREF);
    expect(fundrefDoiOf("GRID:grid.457015.7")).toBeUndefined();
    expect(fundrefDoiOf("10.5281/zenodo.1")).toBeUndefined();
    expect(fundrefDoiOf(undefined)).toBeUndefined();
  });

  it("reads a short OpenAlex funder id from the URL or the bare form, and nothing else", () => {
    expect(shortOpenAlexFunderId(ANR_URL)).toBe(ANR_OA);
    expect(shortOpenAlexFunderId(ANR_OA)).toBe(ANR_OA);
    expect(shortOpenAlexFunderId("https://openalex.org/f4320332161")).toBe(ANR_OA);
    expect(shortOpenAlexFunderId(ANR_FUNDREF)).toBeUndefined();
    expect(shortOpenAlexFunderId("https://openalex.org/I60134161")).toBeUndefined();
    expect(shortOpenAlexFunderId(undefined)).toBeUndefined();
  });

  it("indexes rows by short OpenAlex id, dropping ids that are not funder-shaped", () => {
    const map = toCrosswalk([...ROWS, { openalexId: "I1", name: "not a funder" }]);
    expect([...map.keys()]).toEqual([ANR_OA, JSPS_OA]);
  });
});

describe("workFunderIds", () => {
  it("lists the distinct short ids over the non-hidden works, sorted, malformed ids dropped", () => {
    const cv = makeCv(
      [
        work("W2", [{ id: JSPS_URL }, { id: "https://openalex.org/I1" }]),
        work("W1", [
          { id: ANR_URL, awardId: "X-1" },
          { id: ANR_URL, awardId: "X-2" },
        ]),
        work("W3", [{ id: "https://openalex.org/F999" }], { included: false }),
        work("W4", [{ id: "https://openalex.org/F998" }], { notMine: true }),
      ],
      [],
    );
    expect(workFunderIds(cv)).toEqual([ANR_OA, JSPS_OA]);
  });

  it("is empty for a CV whose works carry no funders", () => {
    expect(workFunderIds(makeCv([work("W1", [])], []))).toEqual([]);
  });
});

describe("joinOwnerFunding — award number", () => {
  it("matches a work's award number against the owner's grant after normalisation, carrying the policy key", () => {
    const cv = makeCv(
      [work("W1", [{ id: ANR_URL, name: "ANR", awardId: "anr 21 ce17/0001" }])],
      [
        grant("G1", {
          funderId: "FUNDREF:http://dx.doi.org/10.13039/501100001665",
          funderName: "Agence Nationale de la Recherche",
          awardId: "ANR-21-CE17-0001",
        }),
      ],
    );
    expect(joinOwnerFunding(cv, CROSSWALK)).toEqual([
      {
        workId: "W1",
        grantId: "G1",
        funderName: "Agence Nationale de la Recherche",
        awardId: "ANR-21-CE17-0001",
        matchBasis: "award-number",
        fundrefDoi: ANR_FUNDREF,
        title: "Work W1",
        year: 2023,
        venue: "J. Ex.",
        openAccess: "no-open-copy-found",
      },
    ]);
  });

  it("refuses an award-number match when both sides resolve to DIFFERENT funders", () => {
    const cv = makeCv(
      [work("W1", [{ id: ANR_URL, awardId: "12345678" }])],
      [grant("G1", { funderId: JSPS_FUNDREF, funderName: "JSPS", awardId: "12345678" })],
    );
    expect(joinOwnerFunding(cv, CROSSWALK)).toEqual([]);
  });

  it("refuses an award-number match when the grant's FundRef DOI disagrees with the work row's, even when the grant's funder is NOT in the crosswalk", () => {
    // The reproduction: a JSPS grant (FundRef DOI) and an ANR-funded work
    // sharing the award number "2020", with a crosswalk that holds ANR's row
    // only. JSPS resolves to nothing, but its DOI is still comparable with the
    // DOI on ANR's row — and it disagrees. Before the fix this joined as
    // "award-number", named JSPS and carried ANR's policy key.
    const anrOnly = toCrosswalk([ROWS[0]!]);
    const cv = makeCv(
      [work("W1", [{ id: ANR_URL, name: "ANR", awardId: "2020" }])],
      [grant("G1", { funderId: JSPS_FUNDREF, funderName: "JSPS", awardId: "2020" })],
    );
    expect(joinOwnerFunding(cv, anrOnly)).toEqual([]);
    // ORCID's FUNDREF form of the same DOI is the same disagreement.
    const orcidForm = makeCv(
      [work("W1", [{ id: ANR_URL, awardId: "2020" }])],
      [grant("G1", { funderId: `FUNDREF:http://dx.doi.org/${JSPS_FUNDREF}`, awardId: "2020" })],
    );
    expect(joinOwnerFunding(orcidForm, anrOnly)).toEqual([]);
  });

  it("accepts the same award-number match when the FundRef DOIs on both sides agree, with a one-row crosswalk", () => {
    const anrOnly = toCrosswalk([ROWS[0]!]);
    const cv = makeCv(
      [work("W1", [{ id: ANR_URL, name: "ANR", awardId: "2020" }])],
      [grant("G1", { funderId: ANR_FUNDREF, funderName: "ANR (grant)", awardId: "2020" })],
    );
    expect(
      joinOwnerFunding(cv, anrOnly).map((r) => [r.matchBasis, r.funderName, r.fundrefDoi]),
    ).toEqual([["award-number", "ANR (grant)", ANR_FUNDREF]]);
  });

  it("refuses an award-number match when the grant's ROR id disagrees with the work row's, and accepts it when they agree", () => {
    const anrOnly = toCrosswalk([ROWS[0]!]);
    const disagree = makeCv(
      [work("W1", [{ id: ANR_URL, awardId: "2020" }])],
      // JSPS's ROR id, which no crosswalk row carries.
      [grant("G1", { funderId: "ROR:https://ror.org/03vhdva43", awardId: "2020" })],
    );
    expect(joinOwnerFunding(disagree, anrOnly)).toEqual([]);
    const agree = makeCv(
      [work("W1", [{ id: ANR_URL, awardId: "2020" }])],
      [grant("G1", { funderId: `ROR:https://ror.org/${ANR_ROR}`, awardId: "2020" })],
    );
    expect(joinOwnerFunding(agree, anrOnly).map((r) => [r.matchBasis, r.fundrefDoi])).toEqual([
      ["award-number", ANR_FUNDREF],
    ]);
  });

  it("refuses an award-number match when the grant carries a DIFFERENT OpenAlex id than the work, crosswalk or not", () => {
    const cv = makeCv(
      [work("W1", [{ id: ANR_URL, awardId: "2020" }])],
      [grant("G1", { funderId: JSPS_URL, awardId: "2020" })],
    );
    expect(joinOwnerFunding(cv, EMPTY)).toEqual([]);
    expect(joinOwnerFunding(cv, CROSSWALK)).toEqual([]);
  });

  it("accepts an award-number match when the grant's funder id cannot be resolved (GRID, RINGGOLD, unknown), keying the policy by the crosswalk row's DOI", () => {
    const cv = makeCv(
      [work("W1", [{ id: ANR_URL, name: "ANR", awardId: "ANR-21-CE17-0001" }])],
      [
        grant("G1", { funderId: "GRID:grid.457015.7", awardId: "ANR-21-CE17-0001" }),
        grant("G2", { funderId: "RINGGOLD:12345", awardId: "ANR-21-CE17-0001" }),
        grant("G3", { awardId: "ANR-21-CE17-0001" }),
      ],
    );
    const rows = joinOwnerFunding(cv, CROSSWALK);
    expect(rows.map((r) => [r.grantId, r.matchBasis, r.fundrefDoi])).toEqual([
      ["G1", "award-number", ANR_FUNDREF],
      ["G2", "award-number", ANR_FUNDREF],
      ["G3", "award-number", ANR_FUNDREF],
    ]);
    // The funder name falls back to the name printed on the work.
    expect(rows[0]!.funderName).toBe("ANR");
  });

  it("keys the policy by the grant's OWN FundRef DOI when it carries one, even when the work row has none", () => {
    // ANR's row without a FundRef DOI: nothing to disagree with, and the
    // grant's own DOI is the better policy key.
    const rowWithoutDoi = toCrosswalk([{ openalexId: ANR_OA, rorId: ANR_ROR, name: "ANR" }]);
    const cv = makeCv(
      [work("W1", [{ id: ANR_URL, awardId: "2020" }])],
      [grant("G1", { funderId: ANR_FUNDREF, awardId: "2020" })],
    );
    expect(joinOwnerFunding(cv, rowWithoutDoi).map((r) => [r.matchBasis, r.fundrefDoi])).toEqual([
      ["award-number", ANR_FUNDREF],
    ]);
  });

  it("does not match a grant whose award number differs from the work's, even for the same funder", () => {
    const cv = makeCv(
      [work("W1", [{ id: ANR_URL, awardId: "ANR-21-CE17-0001" }])],
      [grant("G1", { funderId: ANR_FUNDREF, awardId: "ANR-19-CE17-0009" })],
    );
    expect(joinOwnerFunding(cv, CROSSWALK)).toEqual([]);
  });

  it("matches award numbers even when the funder crosswalk is empty (award-only, no funder check possible)", () => {
    const cv = makeCv(
      [work("W1", [{ id: ANR_URL, awardId: "ANR-21-CE17-0001" }])],
      [grant("G1", { funderId: ANR_FUNDREF, awardId: "ANR-21-CE17-0001" })],
    );
    const [row] = joinOwnerFunding(cv, EMPTY);
    expect(row?.matchBasis).toBe("award-number");
    // The grant's own FundRef DOI still keys the policy lookup.
    expect(row?.fundrefDoi).toBe(ANR_FUNDREF);
  });
});

describe("joinOwnerFunding — funder id only", () => {
  it("joins a work with NO award number to a grant whose funder resolves to the same OpenAlex funder, weaker basis", () => {
    const cv = makeCv(
      [work("W1", [{ id: ANR_URL, name: "ANR" }])],
      [
        grant("G-ror", { funderId: `ROR:https://ror.org/${ANR_ROR}`, funderName: "ANR (ROR)" }),
        grant("G-fundref", { funderId: ANR_FUNDREF, funderName: "ANR (FundRef)" }),
        grant("G-oa", { funderId: ANR_URL, funderName: "ANR (OpenAlex)" }),
        grant("G-jsps", { funderId: JSPS_FUNDREF, funderName: "JSPS" }),
      ],
    );
    const rows = joinOwnerFunding(cv, CROSSWALK);
    expect(rows.map((r) => [r.grantId, r.matchBasis, r.funderName])).toEqual([
      ["G-fundref", "funder-id", "ANR (FundRef)"],
      ["G-oa", "funder-id", "ANR (OpenAlex)"],
      ["G-ror", "funder-id", "ANR (ROR)"],
    ]);
    for (const r of rows) expect(r.awardId).toBeUndefined();
  });

  it("never falls back to the funder when the work DOES carry an award number that did not match", () => {
    const cv = makeCv(
      [work("W1", [{ id: ANR_URL, awardId: "ANR-21-CE17-0001" }])],
      [grant("G1", { funderId: ANR_FUNDREF, funderName: "ANR" })],
    );
    expect(joinOwnerFunding(cv, CROSSWALK)).toEqual([]);
  });

  it("never joins by funder when the grant's funder cannot be resolved", () => {
    const cv = makeCv(
      [work("W1", [{ id: ANR_URL }])],
      [
        grant("G1", { funderId: "GRID:grid.457015.7", funderName: "ANR" }),
        grant("G2", { funderName: "ANR" }),
        grant("G3", { funderId: `ROR:https://ror.org/not-a-ror`, funderName: "ANR" }),
      ],
    );
    expect(joinOwnerFunding(cv, CROSSWALK)).toEqual([]);
  });

  it("property: the two id namespaces never match by string equality — only the crosswalk joins them", () => {
    for (let i = 0; i < 60; i++) {
      const fundref = `10.13039/${100000000 + i}`;
      const oa = `F${4320000000 + i}`;
      // (a) A grant carrying the FundRef DOI and a work whose funder id is that
      //     SAME string: the work id is not OpenAlex-shaped, so it is skipped.
      const same = makeCv([work("W", [{ id: fundref }])], [grant("G", { funderId: fundref })]);
      expect(joinOwnerFunding(same, EMPTY)).toEqual([]);
      // (b) The grant's FundRef DOI and the work's OpenAlex id, no crosswalk: no join.
      const cross = makeCv(
        [work("W", [{ id: `https://openalex.org/${oa}` }])],
        [grant("G", { funderId: fundref })],
      );
      expect(joinOwnerFunding(cross, EMPTY)).toEqual([]);
      // (c) …and with the crosswalk row, the join exists — through the row, not the string.
      // A second row with no ids at all must neither index nor interfere.
      const walk = toCrosswalk([
        { openalexId: oa, fundrefDoi: fundref, name: `Funder ${i}` },
        { openalexId: "F0", name: "no ids" },
      ]);
      expect(
        joinOwnerFunding(cross, walk).map((r) => [r.matchBasis, r.fundrefDoi, r.funderName]),
      ).toEqual([["funder-id", fundref, `Funder ${i}`]]);
      // (d) A shared award number never overrides a KNOWN disagreement: the
      //     grant's FundRef DOI / ROR id / OpenAlex id against the work's, in
      //     every combination where both sides carry a comparable id — with
      //     the crosswalk holding the WORK's row only (the grant's funder
      //     absent from it), or holding both, or nothing (OpenAlex ids).
      const award = `AWD-${i}`;
      const otherFundref = `10.13039/${200000000 + i}`;
      const otherRor = `0${String(i).padStart(7, "0")}`;
      const otherOa = `F${5320000000 + i}`;
      const workRow = toCrosswalk([
        { openalexId: oa, fundrefDoi: fundref, rorId: `1${String(i).padStart(7, "0")}`, name: "W" },
      ]);
      const bothRows = toCrosswalk([
        ...workRow.values(),
        { openalexId: otherOa, fundrefDoi: otherFundref, rorId: otherRor, name: "G" },
      ]);
      const fundedWork = work("W", [{ id: `https://openalex.org/${oa}`, awardId: award }]);
      for (const funderId of [
        otherFundref,
        `FUNDREF:http://dx.doi.org/${otherFundref}`,
        `ROR:https://ror.org/${otherRor}`,
        `https://openalex.org/${otherOa}`,
      ]) {
        const pair = makeCv([fundedWork], [grant("G", { funderId, awardId: award })]);
        expect(joinOwnerFunding(pair, workRow)).toEqual([]);
        expect(joinOwnerFunding(pair, bothRows)).toEqual([]);
      }
      const oaPair = makeCv(
        [fundedWork],
        [grant("G", { funderId: `https://openalex.org/${otherOa}`, awardId: award })],
      );
      expect(joinOwnerFunding(oaPair, EMPTY)).toEqual([]);
      // …while the same award with the SAME ids on both sides does join.
      const agreeing = makeCv([fundedWork], [grant("G", { funderId: fundref, awardId: award })]);
      expect(joinOwnerFunding(agreeing, workRow).map((r) => r.matchBasis)).toEqual([
        "award-number",
      ]);
    }
  });
});

describe("joinOwnerFunding — selection and order", () => {
  it("is ordered by (workId, grantId) regardless of document order", () => {
    const cv = makeCv(
      // A work with no funders at all is skipped, not an error.
      [work("W2", [{ id: ANR_URL }]), work("W1", [{ id: ANR_URL }]), work("W0", [])],
      [grant("G2", { funderId: ANR_FUNDREF }), grant("G1", { funderId: ANR_FUNDREF })],
    );
    expect(joinOwnerFunding(cv, CROSSWALK).map((r) => `${r.workId}/${r.grantId}`)).toEqual([
      "W1/G1",
      "W1/G2",
      "W2/G1",
      "W2/G2",
    ]);
  });

  it("emits one row per (work, grant), preferring the award-number basis when a work names the funder twice", () => {
    const cv = makeCv(
      [
        work("W1", [{ id: ANR_URL }, { id: ANR_URL, awardId: "ANR-21-CE17-0001" }]),
        // …and in the other order: the award-number row is kept, the weaker one skipped.
        work("W2", [{ id: ANR_URL, awardId: "ANR-21-CE17-0001" }, { id: ANR_URL }]),
      ],
      [grant("G1", { funderId: ANR_FUNDREF, awardId: "ANR-21-CE17-0001" })],
    );
    const rows = joinOwnerFunding(cv, CROSSWALK);
    expect(rows.map((r) => [r.workId, r.matchBasis, r.awardId])).toEqual([
      ["W1", "award-number", "ANR-21-CE17-0001"],
      ["W2", "award-number", "ANR-21-CE17-0001"],
    ]);
  });

  it("never joins a hidden grant, a 'not mine' work, an excluded work, or an item outside the grants section", () => {
    const cv = makeCv(
      [
        work("W-off", [{ id: ANR_URL }], { included: false }),
        work("W-notmine", [{ id: ANR_URL }], { notMine: true }),
        work("W-ok", [{ id: ANR_URL }]),
      ],
      [
        grant("G-off", { funderId: ANR_FUNDREF }, { included: false }),
        grant("G-notmine", { funderId: ANR_FUNDREF }, { notMine: true }),
        grant("G-ok", { funderId: ANR_FUNDREF }),
      ],
    );
    expect(joinOwnerFunding(cv, CROSSWALK).map((r) => `${r.workId}/${r.grantId}`)).toEqual([
      "W-ok/G-ok",
    ]);
    // A funder-shaped id on a non-grant entry item is not a grant.
    const stray = CanonicalCvSchema.parse({
      ...cv,
      sections: [
        cv.sections[0],
        { ...cv.sections[1], id: "positions", type: "positions", title: "Positions" },
      ],
    });
    expect(joinOwnerFunding(stray, CROSSWALK)).toEqual([]);
  });

  it("carries the crosswalk name when neither the grant nor the work names the funder, else undefined", () => {
    const cv = makeCv(
      [work("W1", [{ id: ANR_URL }]), work("W2", [{ id: "https://openalex.org/F777" }])],
      [
        grant("G1", { funderId: ANR_FUNDREF }),
        grant("G2", { funderId: "https://openalex.org/F777" }),
      ],
    );
    const rows = joinOwnerFunding(cv, CROSSWALK);
    expect(rows.map((r) => [r.grantId, r.funderName, r.fundrefDoi])).toEqual([
      ["G1", "Agence Nationale de la Recherche", ANR_FUNDREF],
      ["G2", undefined, undefined],
    ]);
  });

  it("gives the work its untitled/undated shape when the CSL carries neither", () => {
    const cv = makeCv(
      [
        work("W1", [{ id: ANR_URL }], {
          csl: { id: "W1", type: "article-journal" },
          meta: { funders: [{ id: ANR_URL }] },
        }),
      ],
      [grant("G1", { funderId: ANR_FUNDREF })],
    );
    const [row] = joinOwnerFunding(cv, CROSSWALK);
    expect(row).toMatchObject({ title: undefined, year: undefined, venue: undefined });
    expect(row?.openAccess).toBe("not-determined");
  });
});

describe("hasWorklistContent with the funding join", () => {
  const noGaps = { positionsWithoutRor: [], missing: [], noAffiliationData: [] };
  const noClosed = {
    counts: { "open-cc": 0, "open-other": 0, "no-open-copy-found": 0, "not-determined": 0 },
  };
  it("shows the panel for a funding join alone, and still hides it with nothing at all", () => {
    expect(hasWorklistContent(noGaps, noClosed)).toBe(false);
    expect(hasWorklistContent(noGaps, noClosed, 0)).toBe(false);
    expect(hasWorklistContent(noGaps, noClosed, 1)).toBe(true);
  });
});
