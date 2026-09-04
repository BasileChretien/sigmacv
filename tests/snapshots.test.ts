import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  addManualEntry,
  addSection,
  removeItem,
  removeSection,
  setItemIncluded,
  setItemNotMine,
  setNotes,
  setSectionBody,
  updateDisplay,
  updateOwner,
} from "@/lib/canonical/curate";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { OpenAlexWork } from "@/lib/openalex/types";
import {
  diffSnapshots,
  freezeCanonical,
  MAX_SNAPSHOTS_PER_CV,
  SNAPSHOT_LABEL_MAX,
} from "@/lib/cv/snapshots";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];

function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "snap",
    resolved: {
      orcid: "0000-0002-7483-2489",
      authorIds: ["A5001069481"],
      displayName: "Basile Chrétien",
      metrics: { h_index: 12, works_count: 40 },
    },
    works,
    now: "2026-06-02T00:00:00.000Z",
  });
}

const PUB = "publications";
const ids = (cv: CanonicalCv) => cv.sections.find((s) => s.id === PUB)!.items.map((i) => i.id);

describe("constants", () => {
  it("caps snapshots per CV at 20 and labels at 80 chars", () => {
    expect(MAX_SNAPSHOTS_PER_CV).toBe(20);
    expect(SNAPSHOT_LABEL_MAX).toBe(80);
  });
});

describe("freezeCanonical", () => {
  it("strips private notes, presets, personal data, dismissals and per-item review signals", () => {
    let cv = setNotes(makeCv(), "remember to ask Sophie");
    cv = updateOwner(cv, { personal: { dateOfBirth: "1990-01-01" } });
    cv = updateDisplay(cv, {
      dismissedDuplicates: ["a|b"],
      dismissedReviewCandidates: ["W1"],
    });
    cv = { ...cv, presets: [{ id: "p1", name: "Grant", display: cv.display }] } as CanonicalCv;
    const first = ids(cv)[0]!;
    cv = setItemNotMine(cv, PUB, first, true, {
      reason: "wrong-field",
      now: "2026-06-03T00:00:00Z",
    });
    cv = {
      ...cv,
      sections: cv.sections.map((s) => ({
        ...s,
        items: s.items.map((it) => ({
          ...it,
          meta: {
            ...it.meta,
            reviewFlag: "name-matched" as const,
            misattribution: { score: 0.9, signals: [] },
            coauthorOrcids: ["0000-0001-0000-0001"],
          },
        })),
      })),
    };

    const frozen = freezeCanonical(cv);

    expect(frozen.notes).toBeUndefined();
    expect(frozen.presets).toEqual([]);
    expect(frozen.owner.personal).toBeUndefined();
    expect(frozen.display.dismissedDuplicates).toBeUndefined();
    expect(frozen.display.dismissedReviewCandidates).toBeUndefined();
    for (const s of frozen.sections) {
      for (const it of s.items) {
        expect(it.notMineReason).toBeUndefined();
        expect(it.notMineAssertedAt).toBeUndefined();
        expect(it.reviewedAt).toBeUndefined();
        expect(it.meta.reviewFlag).toBeUndefined();
        expect(it.meta.misattribution).toBeUndefined();
        expect(it.meta.coauthorOrcids).toBeUndefined();
      }
    }
    // The "not mine" FLAG itself is kept (a diff needs it to tell hidden from removed).
    const frozenFirst = frozen.sections
      .find((s) => s.id === PUB)!
      .items.find((i) => i.id === first)!;
    expect(frozenFirst.notMine).toBe(true);
    // Contact + the per-field consent flags survive (projected at serve time).
    expect(frozen.display.publicContact).toEqual(cv.display.publicContact);
  });

  it("is a deep copy — mutating the frozen copy never touches the source", () => {
    const cv = makeCv();
    const frozen = freezeCanonical(cv);
    expect(frozen).not.toBe(cv);
    expect(frozen.sections[0]).not.toBe(cv.sections[0]);
    expect(frozen.sections[0]!.items[0]).not.toBe(cv.sections[0]!.items[0]);
    frozen.sections[0]!.items[0]!.included = false;
    expect(cv.sections[0]!.items[0]!.included).toBe(true);
  });
});

describe("diffSnapshots", () => {
  it("reports no changes for identical documents", () => {
    const cv = makeCv();
    const d = diffSnapshots(cv, freezeCanonical(cv));
    expect(d.hasChanges).toBe(false);
    expect(d.sections).toEqual([]);
    expect(d.displayChanged).toEqual([]);
    expect(d.ownerChanged).toEqual([]);
    expect(d.metricsChanged).toEqual([]);
  });

  it("classifies added / removed / hidden / unhidden items per section", () => {
    const older = makeCv();
    const [a, b, c] = ids(older) as [string, string, string];
    // b hidden in the older doc so it can be "unhidden" in the newer.
    const olderWithHidden = setItemIncluded(older, PUB, b, false);

    let newer = removeItem(olderWithHidden, PUB, a); // removed
    newer = setItemIncluded(newer, PUB, b, true); // unhidden
    newer = setItemNotMine(newer, PUB, c, true); // hidden (not mine counts as hidden)
    newer = addManualEntry(newer, "grants", "ERC Starting Grant (2027)", "grant:manual:1"); // added, other section

    const d = diffSnapshots(olderWithHidden, newer);
    expect(d.hasChanges).toBe(true);
    const pub = d.sections.find((s) => s.sectionId === PUB)!;
    expect(pub.removed.map((r) => r.id)).toEqual([a]);
    expect(pub.unhidden.map((r) => r.id)).toEqual([b]);
    expect(pub.hidden.map((r) => r.id)).toEqual([c]);
    expect(pub.added).toEqual([]);
    // Labels are the work titles, with the year.
    expect(pub.removed[0]!.label.length).toBeGreaterThan(0);
    expect(typeof pub.removed[0]!.year).toBe("number");
    const grants = d.sections.find((s) => s.sectionId === "grants")!;
    expect(grants.added).toEqual([{ id: "grant:manual:1", label: "ERC Starting Grant (2027)" }]);
  });

  it("orders items deterministically by label then id, and truncates long labels", () => {
    const older = makeCv();
    let newer = addManualEntry(older, "skills", "Zebra", "s:z");
    newer = addManualEntry(newer, "skills", "Alpha", "s:a");
    newer = addManualEntry(newer, "skills", "Alpha", "s:0");
    newer = addManualEntry(newer, "skills", "x".repeat(300), "s:long");
    const d = diffSnapshots(older, newer);
    const skills = d.sections.find((s) => s.sectionId === "skills")!;
    expect(skills.added.map((r) => r.id)).toEqual(["s:0", "s:a", "s:long", "s:z"]);
    expect(skills.added[2]!.label.length).toBe(140);
    expect(skills.added[2]!.label.endsWith("…")).toBe(true);
  });

  it("reports added and removed sections, listing their visible items", () => {
    const older = makeCv();
    let newer = addSection(older, "languages");
    newer = addManualEntry(newer, "languages", "French (native)", "lang:fr");
    newer = addManualEntry(newer, "languages", "Klingon", "lang:tlh");
    newer = setItemIncluded(newer, "languages", "lang:tlh", false);
    const d = diffSnapshots(older, newer);
    expect(d.sectionsAdded).toEqual([
      { sectionId: "languages", sectionType: "languages", title: "Languages" },
    ]);
    // The new section's VISIBLE items count as added; its hidden one does not.
    expect(d.sections.find((s) => s.sectionId === "languages")!.added).toEqual([
      { id: "lang:fr", label: "French (native)" },
    ]);
    const back = diffSnapshots(newer, removeSection(newer, "languages"));
    expect(back.sectionsRemoved.map((s) => s.sectionId)).toEqual(["languages"]);
    expect(
      back.sections.find((s) => s.sectionId === "languages")!.removed.map((r) => r.id),
    ).toEqual(["lang:fr"]);
    expect(back.hasChanges).toBe(true);
    // An empty new section is reported without an item block.
    const empty = diffSnapshots(older, addSection(older, "references"));
    expect(empty.sectionsAdded.map((s) => s.sectionId)).toEqual(["references"]);
    expect(empty.sections).toEqual([]);
  });

  it("reports narrative bodies as word-count deltas, never the text", () => {
    const older = addSection(makeCv(), "narrative-knowledge");
    const before = setSectionBody(older, "narrative-knowledge", "one two three");
    const after = setSectionBody(older, "narrative-knowledge", "one two three four five");
    const d = diffSnapshots(before, after);
    expect(d.narrativeChanged).toEqual([
      {
        sectionId: "narrative-knowledge",
        title: older.sections.find((s) => s.id === "narrative-knowledge")!.title,
        wordsBefore: 3,
        wordsAfter: 5,
        delta: 2,
      },
    ]);
    expect(JSON.stringify(d)).not.toContain("four five");
    // An unchanged (or empty ↔ empty) body is not a change.
    expect(diffSnapshots(older, older).narrativeChanged).toEqual([]);
    expect(diffSnapshots(before, before).hasChanges).toBe(false);
  });

  it("names changed display + owner keys without values, ignoring internal bookkeeping", () => {
    const older = makeCv();
    let newer = updateDisplay(older, {
      template: "modern",
      excludedItems: { publications: ["W1"] },
      dismissedDuplicates: ["x|y"],
    });
    newer = updateOwner(newer, {
      headline: "Pharmacologist",
      countsByYear: [{ year: 2020, works: 1, citations: 2 }],
    });
    const d = diffSnapshots(older, newer);
    expect(d.displayChanged).toEqual(["template"]);
    expect(d.ownerChanged).toEqual(["headline"]);
    expect(JSON.stringify(d)).not.toContain("Pharmacologist");
    expect(JSON.stringify(d)).not.toContain("modern");
  });

  it("reports metric changes with from → to (null when absent on one side)", () => {
    const older = makeCv();
    const newer = updateOwner(older, { metrics: { h_index: 14, i10_index: 20 } });
    const d = diffSnapshots(older, newer);
    expect(d.metricsChanged).toEqual([
      { key: "h_index", from: 12, to: 14 },
      { key: "i10_index", from: null, to: 20 },
      { key: "works_count", from: 40, to: null },
    ]);
    // Metrics gone entirely on the newer side still diff (no crash on undefined).
    const gone = updateOwner(older, { metrics: undefined });
    expect(diffSnapshots(older, gone).metricsChanged.map((m) => m.key)).toEqual([
      "h_index",
      "works_count",
    ]);
    expect(diffSnapshots(gone, gone).metricsChanged).toEqual([]);
  });

  it("uses displayText for non-citation items and the id when no label exists", () => {
    const older = makeCv();
    const withGrants = addSection(older, "grants");
    const newer = {
      ...withGrants,
      sections: withGrants.sections.map((s) =>
        s.id === "grants"
          ? {
              ...s,
              items: [
                {
                  id: "g:blank",
                  source: "manual" as const,
                  sourceId: "manual",
                  included: true,
                  notMine: false,
                  authoredBySelf: true,
                  meta: {},
                },
              ],
            }
          : s,
      ),
    } as CanonicalCv;
    const d = diffSnapshots(older, newer);
    const grants = d.sections.find((s) => s.sectionId === "grants")!;
    expect(grants.added).toEqual([{ id: "g:blank", label: "" }]);
  });
});
