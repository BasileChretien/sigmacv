import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemIncluded, setItemNotMine } from "@/lib/canonical/curate";
import { pendingNotMineAssertions } from "@/lib/canonical/assertions";
import { updateDisplay } from "@/lib/canonical/curate";
import {
  compositionSnapshot,
  diffDuplicateDismissals,
  diffIncludedChanges,
  diffNotMineChanges,
} from "@/lib/research/diff";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};
const makeCv = () =>
  buildCanonicalCv({ id: "cv_r", resolved, works, now: "2026-06-02T00:00:00.000Z" });

describe("diffIncludedChanges", () => {
  it("returns nothing when there is no previous state", () => {
    expect(diffIncludedChanges(null, makeCv())).toEqual([]);
  });

  it("captures a not-mine flip with item identifiers + authoredBySelf", () => {
    const before = makeCv();
    const after = setItemIncluded(before, "publications", "W4300000003", false);
    const changes = diffIncludedChanges(before, after);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      itemId: "W4300000003",
      from: true,
      to: false,
      authoredBySelf: false, // the namesake — a real disambiguation signal
    });
    expect(changes[0]!.sourceId).toContain("W4300000003");
  });

  it("ignores changes other than the included flag", () => {
    const before = makeCv();
    const after = { ...before }; // identical
    expect(diffIncludedChanges(before, after)).toEqual([]);
  });
});

describe("diffNotMineChanges", () => {
  it("captures a not-mine assertion distinctly from a plain hide", () => {
    const before = makeCv();
    // A plain hide is NOT a disambiguation assertion.
    const hidden = setItemIncluded(before, "publications", "W4300000001", false);
    expect(diffNotMineChanges(before, hidden)).toEqual([]);

    // Asserting "not mine" IS.
    const asserted = setItemNotMine(before, "publications", "W4300000003", true, {
      reason: "different-person",
      now: "2026-06-02T00:00:00.000Z",
    });
    const changes = diffNotMineChanges(before, asserted);
    expect(changes).toHaveLength(1);
    expect(changes[0]).toMatchObject({
      itemId: "W4300000003",
      asserted: true,
      authoredBySelf: false,
      assertedAt: "2026-06-02T00:00:00.000Z",
      reason: "different-person",
    });
  });

  it("ignores items with no previous state", () => {
    expect(diffNotMineChanges(null, makeCv())).toEqual([]);
  });

  it("records the detector tier when a confirmed duplicate is asserted", () => {
    const base = makeCv();
    const pubs = base.sections.find((s) => s.id === "publications")!;
    const itemId = pubs.items[0]!.id;
    const withHint = {
      ...base,
      sections: base.sections.map((s) =>
        s.id === "publications"
          ? {
              ...s,
              items: s.items.map((it, i) =>
                i === 0
                  ? {
                      ...it,
                      meta: {
                        ...it.meta,
                        reviewFlag: "duplicate" as const,
                        duplicateOf: { itemId: "W_rep", tier: "exact" as const, groupId: "W_rep" },
                      },
                    }
                  : it,
              ),
            }
          : s,
      ),
    };
    const asserted = setItemNotMine(withHint, "publications", itemId, true, {
      reason: "duplicate",
      now: "2026-06-02T00:00:00.000Z",
    });
    const changes = diffNotMineChanges(withHint, asserted);
    expect(changes[0]).toMatchObject({
      reviewFlag: "duplicate",
      duplicateTier: "exact",
      reason: "duplicate",
    });
  });
});

describe("diffDuplicateDismissals", () => {
  it("counts only newly-added 'keep both' dismissals", () => {
    const before = updateDisplay(makeCv(), { dismissedDuplicates: ["a|b"] });
    const after = updateDisplay(before, { dismissedDuplicates: ["a|b", "c|d", "e|f"] });
    expect(diffDuplicateDismissals(before, after)).toBe(2);
    expect(diffDuplicateDismissals(before, before)).toBe(0);
  });

  it("returns 0 when there is no previous state", () => {
    expect(diffDuplicateDismissals(null, makeCv())).toBe(0);
  });
});

describe("pendingNotMineAssertions (v2 upstream-push read interface)", () => {
  it("surfaces asserted OpenAlex works joined with the owner's author ids", () => {
    const cv = setItemNotMine(makeCv(), "publications", "W4300000003", true, {
      now: "2026-06-02T00:00:00.000Z",
    });
    const pending = pendingNotMineAssertions(cv);
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      itemId: "W4300000003",
      openAlexWorkId: "https://openalex.org/W4300000003",
      authorIds: ["A5001069481", "A5136414971"],
    });
  });

  it("returns nothing when no assertions exist", () => {
    expect(pendingNotMineAssertions(makeCv())).toEqual([]);
  });

  it("excludes a 'not mine' OpenAlex affiliation (a Positions row, not a work)", () => {
    // An OpenAlex-inferred affiliation shares source "openalex" but is NOT a work
    // (no CSL, literal "openalex" sourceId). Marking it "not mine" is a valid
    // local correction, but it must never leak into the works-curation push.
    const withAffil = buildCanonicalCv({
      id: "cv_a",
      resolved: {
        ...resolved,
        affiliations: [{ institution: "Nagoya University", startYear: 2019 }],
      },
      works,
      now: "2026-06-02T00:00:00.000Z",
    });
    const positions = withAffil.sections.find((s) => s.type === "positions");
    const affil = positions?.items.find((it) => it.source === "openalex");
    expect(affil).toBeTruthy();
    const asserted = setItemNotMine(withAffil, positions!.id, affil!.id, true, {
      now: "2026-06-02T00:00:00.000Z",
    });
    const pending = pendingNotMineAssertions(asserted);
    expect(pending.some((p) => p.itemId === affil!.id)).toBe(false);
    expect(pending.some((p) => p.openAlexWorkId === "openalex")).toBe(false);
  });
});

describe("compositionSnapshot", () => {
  it("summarizes display + section choices without leaking item content", () => {
    const snap = compositionSnapshot(makeCv());
    expect(snap.cslStyle).toBe("apa");
    expect(snap.template).toBe("classic");
    // Self-presentation choices the metric-norms study needs (paper #3).
    expect(snap).toMatchObject({
      locale: "en-US",
      peerReviewedOnly: expect.any(Boolean),
      publicationOrder: expect.any(String),
      showAuthorshipTable: expect.any(Boolean),
      authorshipRoles: expect.any(Array),
      showCharts: expect.any(Boolean),
    });
    expect(snap.sections[0]).toMatchObject({
      type: "publications",
      visible: true,
      order: expect.any(Number),
      itemCount: 3,
      includedCount: 3,
    });
    // No titles/authors in the snapshot.
    expect(JSON.stringify(snap)).not.toContain("adverse drug reactions");
  });
});
