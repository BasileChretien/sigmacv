import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemIncluded } from "@/lib/canonical/curate";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { OrcidPosition } from "@/lib/orcid/client";
import { currentAffiliation } from "@/lib/cv/publicJsonLd";
import {
  InstitutionConsentError,
  MAX_CONSENTED_ROR_IDS,
  NO_INSTITUTION_PAGE,
  institutionPageListing,
  institutionPageState,
  resolveInstitutionConsent,
  resolveReconciliationShare,
  visibleCurrentAffiliations,
  visibleCurrentRorIds,
} from "@/lib/cv/institutionConsent";
import { ROR_ID_PATTERN } from "@/lib/ror/id";

/**
 * Institution-page consent is PINNED to ROR ids the researcher ticks among
 * their visible current positions. Nothing here re-derives a consent from the
 * document: a consent given at one institution never migrates to the next —
 * when the position goes, the consent for that id LAPSES (kept, not shown,
 * re-asked), and the editor's picker offers exactly the affiliations the
 * canonical object says are current.
 */

const NAGOYA: OrcidPosition = {
  putCode: "cur",
  organization: "Nagoya University",
  roleTitle: "Researcher",
  startYear: 2024,
  rorId: "04chrp450",
};
const CAEN: OrcidPosition = {
  putCode: "caen",
  organization: "CHU de Caen Normandie",
  startYear: 2019,
  rorId: "04d9jrx35",
};
const PAST: OrcidPosition = {
  putCode: "past",
  organization: "Past University",
  startYear: 2015,
  endYear: 2020,
  rorId: "02kpeqv85",
};

function makeCv(employments: OrcidPosition[] = []): CanonicalCv {
  return buildCanonicalCv({
    id: "ic",
    resolved: {
      orcid: "0000-0002-7483-2489",
      authorIds: ["A5001069481"],
      displayName: "Basile Chrétien",
    },
    works: [],
    employments,
    now: "2026-06-02T00:00:00.000Z",
  });
}

/** Patch the first position item's meta (immutable). */
function patchPosition(cv: CanonicalCv, index: number, meta: Record<string, unknown>): CanonicalCv {
  const positions = cv.sections.find((s) => s.type === "positions")!;
  return {
    ...cv,
    sections: cv.sections.map((s) =>
      s.id !== positions.id
        ? s
        : {
            ...s,
            items: s.items.map((it, i) =>
              i === index ? { ...it, meta: { ...it.meta, ...meta } } : it,
            ),
          },
    ),
  };
}

describe("visibleCurrentRorIds / visibleCurrentAffiliations", () => {
  it("lists ALL visible ongoing positions (dual appointment), deduped, in CV order", () => {
    const cv = makeCv([NAGOYA, CAEN, PAST]);
    expect(visibleCurrentRorIds(cv)).toEqual(["04chrp450", "04d9jrx35"]);
    expect(visibleCurrentAffiliations(cv)).toEqual([
      { rorId: "04chrp450", name: "Nagoya University" },
      { rorId: "04d9jrx35", name: "CHU de Caen Normandie" },
    ]);
  });

  it("two positions at the same institution yield one id", () => {
    const cv = makeCv([NAGOYA, { ...NAGOYA, putCode: "cur2", roleTitle: "Lecturer" }]);
    expect(visibleCurrentRorIds(cv)).toEqual(["04chrp450"]);
  });

  it("skips ended positions, hidden positions and positions without a ROR record", () => {
    let cv = makeCv([PAST, NAGOYA, { putCode: "noror", organization: "No ROR Lab" }]);
    expect(visibleCurrentRorIds(cv)).toEqual(["04chrp450"]);
    const positions = cv.sections.find((s) => s.type === "positions")!;
    const nagoya = positions.items.find((it) => it.meta.rorId === "04chrp450")!;
    cv = setItemIncluded(cv, positions.id, nagoya.id, false);
    expect(visibleCurrentRorIds(cv)).toEqual([]);
    expect(visibleCurrentAffiliations(makeCv())).toEqual([]);
  });

  it("an owner date-range override replaces the source dates (its own end year decides)", () => {
    const cv = makeCv([NAGOYA]);
    expect(
      visibleCurrentRorIds(
        patchPosition(cv, 0, { dateRangeOverride: { startYear: 2024, endYear: 2026 } }),
      ),
    ).toEqual([]);
    expect(
      visibleCurrentRorIds(
        patchPosition(cv, 0, { endYear: 2025, dateRangeOverride: { startYear: 2024 } }),
      ),
    ).toEqual(["04chrp450"]);
  });

  it("uses the owner's institution rename as the display name, and normalises a full ROR URL", () => {
    let cv = makeCv([{ ...NAGOYA, rorId: "https://ror.org/04chrp450" }]);
    cv = patchPosition(cv, 0, { institutionOverride: "Nagoya Univ. (Med)" });
    expect(visibleCurrentAffiliations(cv)).toEqual([
      { rorId: "04chrp450", name: "Nagoya Univ. (Med)" },
    ]);
  });

  it("drops a foreign or junk ROR value (never attacker-keyed)", () => {
    for (const rorId of ["https://evil.example/x", "not a/valid id", "http://ror.org/04chrp450"]) {
      expect(visibleCurrentRorIds(makeCv([{ putCode: "e", organization: "X", rorId }]))).toEqual(
        [],
      );
    }
  });

  it("never offers an id the consent API would refuse: the 9-char ROR shape is applied at the source", () => {
    // Lowercase-alnum bodies that pass the IRI check but are not ROR ids —
    // the picker must not offer what /api/cv/publish rejects with a 422.
    for (const rorId of ["abc", "04chrp45", "14chrp450", "0uuuuuu00", "https://ror.org/x"]) {
      expect(ROR_ID_PATTERN.test(rorId)).toBe(false);
      expect(visibleCurrentRorIds(makeCv([{ putCode: "j", organization: "X", rorId }]))).toEqual(
        [],
      );
    }
  });

  it("shares the ongoing-position rule with the OAI set key (first id = currentAffiliation)", () => {
    const cv = makeCv([PAST, CAEN, NAGOYA]);
    expect(visibleCurrentRorIds(cv)[0]).toBe(currentAffiliation(cv)!.rorId);
    expect(currentAffiliation(makeCv([PAST]))).toBeNull();
  });
});

describe("resolveInstitutionConsent", () => {
  const current = ["04chrp450", "04d9jrx35"];

  it("accepts ids among the visible current positions, deduped", () => {
    expect(
      resolveInstitutionConsent(
        { show: true, rorIds: ["04d9jrx35", "04chrp450", "04d9jrx35"] },
        current,
      ),
    ).toEqual({
      showOnInstitutionPage: true,
      consentedRorIds: ["04d9jrx35", "04chrp450"],
    });
  });

  it("rejects an id that is not a visible current affiliation (422 material), naming it", () => {
    expect.assertions(3);
    try {
      resolveInstitutionConsent({ show: true, rorIds: ["04chrp450", "02kpeqv85"] }, current);
    } catch (err) {
      expect(err).toBeInstanceOf(InstitutionConsentError);
      expect((err as InstitutionConsentError).unknownRorIds).toEqual(["02kpeqv85"]);
      expect((err as Error).message).toContain("02kpeqv85");
    }
  });

  it("a withdrawal clears the ids; a toggle with nothing ticked is a withdrawal", () => {
    expect(resolveInstitutionConsent({ show: false, rorIds: ["04chrp450"] }, current)).toEqual({
      showOnInstitutionPage: false,
      consentedRorIds: [],
    });
    expect(resolveInstitutionConsent({ show: true, rorIds: [] }, current)).toEqual({
      showOnInstitutionPage: false,
      consentedRorIds: [],
    });
    // A withdrawal never validates ids — it must always be possible, even after the position went.
    expect(
      resolveInstitutionConsent({ show: false, rorIds: ["02kpeqv85"] }, current).consentedRorIds,
    ).toEqual([]);
  });

  it("caps the number of ids", () => {
    const many = Array.from(
      { length: MAX_CONSENTED_ROR_IDS + 1 },
      (_, i) => `0${String(i).padStart(6, "0")}00`,
    );
    expect(() => resolveInstitutionConsent({ show: true, rorIds: many }, many)).toThrow(
      InstitutionConsentError,
    );
  });

  it("exposes the ROR id shape for the API boundary", () => {
    expect(ROR_ID_PATTERN.test("04chrp450")).toBe(true);
    expect(ROR_ID_PATTERN.test("https://ror.org/04chrp450")).toBe(false);
    expect(ROR_ID_PATTERN.test("14chrp450")).toBe(false);
    expect(ROR_ID_PATTERN.test("04chrp45")).toBe(false);
  });

  it("accepts an already-stored (lapsed) id alongside a current one — kept, never moved — but not a new unknown id", () => {
    const current = ["04chrp450"];
    expect(
      resolveInstitutionConsent({ show: true, rorIds: ["02kpeqv85", "04chrp450"] }, current, [
        "02kpeqv85",
      ]),
    ).toEqual({ showOnInstitutionPage: true, consentedRorIds: ["02kpeqv85", "04chrp450"] });
    // A kept id alone is still a consent (paused until that affiliation is current again).
    expect(
      resolveInstitutionConsent({ show: true, rorIds: ["02kpeqv85"] }, current, ["02kpeqv85"]),
    ).toEqual({ showOnInstitutionPage: true, consentedRorIds: ["02kpeqv85"] });
    // Without the stored list the same id is unknown; another unknown id stays refused.
    expect(() => resolveInstitutionConsent({ show: true, rorIds: ["02kpeqv85"] }, current)).toThrow(
      InstitutionConsentError,
    );
    expect(() =>
      resolveInstitutionConsent({ show: true, rorIds: ["04d9jrx35"] }, current, ["02kpeqv85"]),
    ).toThrow(InstitutionConsentError);
  });
});

describe("resolveReconciliationShare (the second opt-in)", () => {
  const consented = { showOnInstitutionPage: true, consentedRorIds: ["04chrp450"] };
  const withdrawn = { showOnInstitutionPage: false, consentedRorIds: [] };

  it("stands only beside a standing page consent: requested, kept, or cleared with it", () => {
    expect(resolveReconciliationShare(consented, false, true)).toBe(true);
    expect(resolveReconciliationShare(consented, true, false)).toBe(false);
    // Omitted: the stored value.
    expect(resolveReconciliationShare(consented, true)).toBe(true);
    expect(resolveReconciliationShare(consented, false)).toBe(false);
    // No page consent: never, whatever was stored or asked.
    expect(resolveReconciliationShare(withdrawn, true, true)).toBe(false);
    expect(resolveReconciliationShare(withdrawn, true)).toBe(false);
  });

  it("is part of the publish state, false by default and read from the flags", () => {
    expect(NO_INSTITUTION_PAGE.shareReconciliationRows).toBe(false);
    const flags = { published: true, publicIndexable: true };
    expect(institutionPageState(makeCv([NAGOYA]), consented, flags).shareReconciliationRows).toBe(
      false,
    );
    expect(
      institutionPageState(makeCv([NAGOYA]), consented, {
        ...flags,
        shareReconciliationRows: true,
      }),
    ).toMatchObject({
      showOnInstitutionPage: true,
      currentAffiliations: [{ rorId: "04chrp450", name: "Nagoya University" }],
      shareReconciliationRows: true,
    });
  });
});

describe("institutionPageListing", () => {
  const cv = makeCv([NAGOYA, CAEN]);
  const row = (over: Partial<Parameters<typeof institutionPageListing>[0]> = {}) => ({
    showOnInstitutionPage: true,
    consentedRorIds: ["04chrp450"],
    published: true,
    publicIndexable: true,
    document: cv,
    ...over,
  });

  it("is listed under exactly the consented ids that are still visible current positions", () => {
    expect(institutionPageListing(row())).toEqual({
      listed: true,
      activeRorIds: ["04chrp450"],
      lapsedRorIds: [],
    });
    expect(
      institutionPageListing(row({ consentedRorIds: ["04d9jrx35", "04chrp450"] })).activeRorIds,
    ).toEqual(["04d9jrx35", "04chrp450"]);
  });

  it("LAPSES (never migrates) a consent whose position disappeared or changed", () => {
    // The Nagoya position ended and a new one appeared at Caen: the consent is
    // not re-attached to Caen; it is lapsed and the editor re-asks.
    const moved = makeCv([{ ...NAGOYA, endYear: 2025 }, CAEN]);
    expect(institutionPageListing(row({ document: moved }))).toEqual({
      listed: false,
      activeRorIds: [],
      lapsedRorIds: ["04chrp450"],
    });
    // Dual appointment, one of the two ended: listed under the remaining one only.
    expect(
      institutionPageListing(row({ document: moved, consentedRorIds: ["04chrp450", "04d9jrx35"] })),
    ).toEqual({
      listed: true,
      activeRorIds: ["04d9jrx35"],
      lapsedRorIds: ["04chrp450"],
    });
  });

  it("is never listed without the flag, without indexing or while unpublished", () => {
    expect(institutionPageListing(row({ showOnInstitutionPage: false })).listed).toBe(false);
    expect(institutionPageListing(row({ publicIndexable: false })).listed).toBe(false);
    expect(institutionPageListing(row({ published: false })).listed).toBe(false);
    expect(institutionPageListing(row({ consentedRorIds: [] })).listed).toBe(false);
  });

  it("treats every consent as lapsed when the stored document does not parse", () => {
    expect(institutionPageListing(row({ document: { nope: true } }))).toEqual({
      listed: false,
      activeRorIds: [],
      lapsedRorIds: ["04chrp450"],
    });
  });

  it("accepts precomputed current ids (callers that already parsed the document)", () => {
    expect(institutionPageListing(row({ document: null }), ["04chrp450"]).listed).toBe(true);
  });
});
