import { describe, expect, it } from "vitest";
import {
  annotateMisattribution,
  buildOwnerProfile,
  scoreMisattribution,
  type OwnerProfile,
} from "@/lib/canonical/misattribution";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

function makeItem(over: Partial<CvItem> & { id: string }): CvItem {
  return {
    source: "openalex",
    sourceId: "https://openalex.org/x",
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    meta: {},
    ...over,
  };
}

function makeCv(items: CvItem[]): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "cv1",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Basile Chrétien" },
    display: {},
    sections: [
      { id: "publications", type: "publications", title: "P", visible: true, order: 0, items },
    ],
    provenance: { generatedAt: "2026-06-17T00:00:00.000Z", sources: ["openalex"] },
  });
}

/** A dense, well-anchored owner profile: 5 co-authors, 3 field works, all oncology,
 *  one known institution. */
const PROFILE: OwnerProfile = {
  coauthors: new Set(["A", "B", "C", "D", "E"]),
  fields: new Set(["Oncology"]),
  domains: new Set(["Health Sciences"]),
  institutions: new Set(["https://ror.org/known"]),
  fieldWorkCount: 3,
  earliestYear: 2015,
};

/** A candidate that fails BOTH strong checks: a literature paper with strangers. */
function outlier(over: Partial<CvItem["meta"]> = {}): CvItem {
  return makeItem({
    id: "cand",
    authoredBySelf: true,
    meta: {
      matchBasis: "openalex-id",
      coauthorOrcids: ["X", "Y"],
      authorCount: 3,
      year: 2020,
      topic: { field: "Literary Studies", domain: "Arts and Humanities" },
      ...over,
    },
  });
}

describe("scoreMisattribution", () => {
  it("flags a work failing both strong checks (no co-author overlap + different field)", () => {
    const v = scoreMisattribution(outlier(), PROFILE);
    expect(v.flagged).toBe(true);
    expect(v.signals).toEqual(["no-coauthor-overlap", "different-field"]);
    expect(v.score).toBeCloseTo(0.8);
  });

  it("adds the pre-career corroborator and raises the score", () => {
    const v = scoreMisattribution(outlier({ year: 2005 }), PROFILE);
    expect(v.flagged).toBe(true);
    expect(v.signals).toEqual(["no-coauthor-overlap", "different-field", "pre-career"]);
    expect(v.score).toBeCloseTo(0.9);
  });

  it("flags via affiliation (no co-author + a never-seen institution) even in-field", () => {
    const v = scoreMisattribution(
      outlier({
        topic: { field: "Oncology", domain: "Health Sciences" }, // same field → no field signal
        workInstitutions: ["https://ror.org/novel"],
      }),
      PROFILE,
    );
    expect(v.flagged).toBe(true);
    expect(v.signals).toEqual(["no-coauthor-overlap", "affiliation-novel"]);
    expect(v.score).toBeCloseTo(0.7);
  });

  it("does NOT fire affiliation-novel when the institution is a known one", () => {
    const v = scoreMisattribution(
      outlier({
        topic: { field: "Oncology", domain: "Health Sciences" },
        workInstitutions: ["https://ror.org/known"],
      }),
      PROFILE,
    );
    expect(v.flagged).toBe(false);
  });

  it("skips the affiliation check when the profile has no known institutions", () => {
    const noInst: OwnerProfile = { ...PROFILE, institutions: new Set() };
    const v = scoreMisattribution(
      outlier({
        topic: { field: "Oncology", domain: "Health Sciences" },
        workInstitutions: ["https://ror.org/novel"],
      }),
      noInst,
    );
    expect(v.flagged).toBe(false);
  });

  it("never flags on affiliation alone (no-coauthor-overlap is mandatory)", () => {
    const v = scoreMisattribution(
      outlier({
        coauthorOrcids: ["A"], // shares a co-author → mandatory signal absent
        topic: { field: "Oncology", domain: "Health Sciences" },
        workInstitutions: ["https://ror.org/novel"],
      }),
      PROFILE,
    );
    expect(v.flagged).toBe(false);
  });

  it("does NOT flag when only one strong signal fires (shares a co-author)", () => {
    const v = scoreMisattribution(outlier({ coauthorOrcids: ["A", "Z"] }), PROFILE);
    expect(v.flagged).toBe(false);
    expect(v.signals).toEqual([]);
    expect(v.score).toBe(0);
  });

  it("does NOT flag when only the field differs (no co-author data to disagree)", () => {
    const v = scoreMisattribution(outlier({ coauthorOrcids: [] }), PROFILE);
    expect(v.flagged).toBe(false);
  });

  it("never flags on a temporal outlier alone", () => {
    // Same field + shared co-author, but published long before the career — only
    // the corroborator could fire, which can never flag by itself.
    const v = scoreMisattribution(
      outlier({
        coauthorOrcids: ["A"],
        topic: { field: "Oncology", domain: "Health Sciences" },
        year: 2000,
      }),
      PROFILE,
    );
    expect(v.flagged).toBe(false);
  });

  it("skips the co-author check on a sparse confirmed profile", () => {
    const sparse: OwnerProfile = { ...PROFILE, coauthors: new Set(["A", "B", "C", "D"]) }; // <5
    expect(scoreMisattribution(outlier(), sparse).flagged).toBe(false);
  });

  it("skips the co-author check for hyper-authorship works", () => {
    expect(scoreMisattribution(outlier({ authorCount: 500 }), PROFILE).flagged).toBe(false);
  });

  it("skips the field check when too few confirmed works carry a field", () => {
    const thin: OwnerProfile = { ...PROFILE, fieldWorkCount: 2 };
    expect(scoreMisattribution(outlier(), thin).flagged).toBe(false);
  });

  it("treats a same-domain different field as NOT a cross-domain mismatch", () => {
    // Cardiology ≠ Oncology, but both are Health Sciences → not the strong signal.
    const v = scoreMisattribution(
      outlier({ topic: { field: "Cardiology", domain: "Health Sciences" } }),
      PROFILE,
    );
    expect(v.flagged).toBe(false);
  });

  it("flags a field-mismatch even when the domain is unknown", () => {
    const v = scoreMisattribution(outlier({ topic: { field: "Law" } }), PROFILE);
    expect(v.flagged).toBe(true);
  });
});

describe("buildOwnerProfile", () => {
  it("aggregates only identifier-confirmed (orcid/both) self works", () => {
    const cv = makeCv([
      makeItem({
        id: "ok1",
        authoredBySelf: true,
        meta: {
          matchBasis: "orcid",
          coauthorOrcids: ["A", "B"],
          topic: { field: "Oncology", domain: "Health Sciences" },
          workInstitutions: ["https://ror.org/aaa"],
          year: 2018,
        },
      }),
      // A positions entry contributes its institution (by ROR) to the known set,
      // even though it isn't an authored work.
      makeItem({ id: "pos", meta: { rorId: "https://ror.org/BBB" } }),
      makeItem({
        id: "ok2",
        authoredBySelf: true,
        meta: {
          matchBasis: "both",
          coauthorOrcids: ["C"],
          topic: { field: "Immunology", domain: "Health Sciences" },
          year: 2012,
        },
      }),
      // openalex-id-only and non-self works must NOT seed the profile.
      makeItem({
        id: "weak",
        authoredBySelf: true,
        meta: {
          matchBasis: "openalex-id",
          coauthorOrcids: ["Z"],
          topic: { field: "Law" },
          workInstitutions: ["https://ror.org/zzz"], // openalex-id-only → NOT collected
          year: 1990,
        },
      }),
      makeItem({ id: "other", meta: { coauthorOrcids: ["Q"] } }),
    ]);
    const p = buildOwnerProfile(cv);
    expect([...p.coauthors].sort()).toEqual(["A", "B", "C"]);
    expect([...p.fields].sort()).toEqual(["Immunology", "Oncology"]);
    expect([...p.domains]).toEqual(["Health Sciences"]);
    // ror from a confirmed work + the positions entry, normalized; the openalex-id
    // work's institution is excluded.
    expect([...p.institutions].sort()).toEqual(["https://ror.org/aaa", "https://ror.org/bbb"]);
    expect(p.fieldWorkCount).toBe(2);
    expect(p.earliestYear).toBe(2012);
  });
});

describe("annotateMisattribution", () => {
  /** Six confirmed oncology works (≥5 co-authors, ≥3 fields) + one candidate. */
  function cvWithAnchor(candidate: CvItem): CanonicalCv {
    const confirmed = ["A", "B", "C", "D", "E", "F"].map((o, i) =>
      makeItem({
        id: `ok${i}`,
        authoredBySelf: true,
        meta: {
          matchBasis: "orcid",
          coauthorOrcids: [o],
          topic: { field: "Oncology", domain: "Health Sciences" },
          year: 2016 + i,
        },
      }),
    );
    return makeCv([...confirmed, candidate]);
  }

  function flagOf(cv: CanonicalCv, id: string): CvItem {
    return cv.sections[0]!.items.find((it) => it.id === id)!;
  }

  it("flags an eligible openalex-id candidate that fails both checks", () => {
    const out = annotateMisattribution(cvWithAnchor(outlier()));
    const c = flagOf(out, "cand");
    expect(c.meta.reviewFlag).toBe("likely-misattributed");
    expect(c.meta.misattribution?.signals).toEqual(["no-coauthor-overlap", "different-field"]);
    expect(c.meta.misattribution?.score).toBeCloseTo(0.8);
  });

  it("is idempotent — re-annotating keeps the same flag", () => {
    const once = annotateMisattribution(cvWithAnchor(outlier()));
    const twice = annotateMisattribution(once);
    expect(flagOf(twice, "cand").meta.reviewFlag).toBe("likely-misattributed");
  });

  it("never flags an ORCID-confirmed work, however outlying", () => {
    const confirmedOutlier = makeItem({
      id: "cand",
      authoredBySelf: true,
      meta: {
        matchBasis: "both",
        coauthorOrcids: ["X", "Y"],
        topic: { field: "Literary Studies", domain: "Arts and Humanities" },
        year: 2020,
      },
    });
    expect(
      flagOf(annotateMisattribution(cvWithAnchor(confirmedOutlier)), "cand").meta.reviewFlag,
    ).toBeUndefined();
  });

  it("yields to a stronger existing flag (precedence)", () => {
    const conflicted = outlier({ matchBasis: "openalex-id", reviewFlag: "orcid-conflict" });
    const c = flagOf(annotateMisattribution(cvWithAnchor(conflicted)), "cand");
    expect(c.meta.reviewFlag).toBe("orcid-conflict");
    expect(c.meta.misattribution).toBeUndefined();
  });

  it("clears a stale flag when an item no longer qualifies", () => {
    // Now shares a co-author → should not flag; the stale hint is cleared.
    const stale = outlier({
      coauthorOrcids: ["A"],
      reviewFlag: "likely-misattributed",
      misattribution: { score: 0.9, signals: ["no-coauthor-overlap", "different-field"] },
    });
    const c = flagOf(annotateMisattribution(cvWithAnchor(stale)), "cand");
    expect(c.meta.reviewFlag).toBeUndefined();
    expect(c.meta.misattribution).toBeUndefined();
  });

  it("is fail-soft — returns the input unchanged on a malformed object", () => {
    const broken = {} as unknown as CanonicalCv;
    expect(annotateMisattribution(broken)).toBe(broken);
  });

  it("leaves a clean CV untouched (same reference when nothing changes)", () => {
    const cv = makeCv([
      makeItem({ id: "W1", authoredBySelf: true, meta: { matchBasis: "orcid" } }),
    ]);
    expect(annotateMisattribution(cv)).toBe(cv);
  });
});
