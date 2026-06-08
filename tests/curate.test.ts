import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  addClaimedWork,
  addManualEntry,
  addSection,
  addStructuredEntry,
  buildManualCsl,
  clearViewExclusions,
  cvHasWork,
  applyPreset,
  deletePreset,
  isItemShownInView,
  moveItem,
  moveItemTo,
  moveSection,
  moveSectionTo,
  orderedSections,
  removeItem,
  removeSection,
  renameSection,
  reorderSections,
  savePreset,
  setItemInView,
  setItemIncluded,
  setItemNotMine,
  setLocale,
  setSectionVisible,
  showOnlyInView,
  updateDisplay,
  updateItemText,
  viewExcludedIds,
  visibleItems,
  visibleSections,
} from "@/lib/canonical/curate";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};

function makeCv() {
  return buildCanonicalCv({ id: "cv_test", resolved, works, now: "2026-06-02T00:00:00.000Z" });
}

const SECTION = "publications";

describe("addClaimedWork / cvHasWork", () => {
  const claimed: CvItem = {
    id: "W_NEW",
    source: "openalex",
    sourceId: "https://openalex.org/W_NEW",
    csl: { id: "W_NEW", type: "article-journal", title: "Claimed paper", DOI: "10.5555/new" },
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: ["Basile Chrétien"],
    meta: {
      year: 2021,
      claimed: true,
      matchBasis: "claimed",
      authorPosition: 1,
      peerReviewed: true,
    },
  };

  it("appends a claimed work to Publications", () => {
    const cv = addClaimedWork(makeCv(), claimed, false);
    const pubs = cv.sections.find((s) => s.type === "publications")!;
    expect(pubs.items.some((i) => i.id === "W_NEW")).toBe(true);
  });

  it("appends a claimed preprint to the Preprints section (creating it)", () => {
    const cv = addClaimedWork(makeCv(), claimed, true);
    expect(
      cv.sections.find((s) => s.type === "preprints")?.items.some((i) => i.id === "W_NEW"),
    ).toBe(true);
  });

  it("cvHasWork detects an existing work by id or DOI (case-insensitive)", () => {
    const cv = addClaimedWork(makeCv(), claimed, false);
    expect(cvHasWork(cv, { id: "W_NEW" })).toBe(true);
    expect(cvHasWork(cv, { doi: "10.5555/NEW" })).toBe(true);
    expect(cvHasWork(cv, { doi: "10.0/absent" })).toBe(false);
    expect(cvHasWork(makeCv(), { id: "W_NEW" })).toBe(false);
  });
});

describe("curation is immutable", () => {
  it("never mutates the input document", () => {
    const cv = makeCv();
    const snapshot = JSON.stringify(cv);
    const firstItem = cv.sections[0]!.items[0]!.id;

    setItemIncluded(cv, SECTION, firstItem, false);
    moveItem(cv, SECTION, firstItem, "down");
    renameSection(cv, SECTION, "Selected Works");
    setSectionVisible(cv, SECTION, false);
    updateDisplay(cv, { cslStyle: "ieee" });

    expect(JSON.stringify(cv)).toBe(snapshot);
  });

  it("returns a new object reference", () => {
    const cv = makeCv();
    expect(updateDisplay(cv, { cslStyle: "ieee" })).not.toBe(cv);
  });
});

describe("setItemIncluded", () => {
  it("hides without deleting (item remains in the section)", () => {
    const cv = makeCv();
    const id = cv.sections[0]!.items[0]!.id;
    const next = setItemIncluded(cv, SECTION, id, false);
    const item = next.sections[0]!.items.find((i) => i.id === id)!;
    expect(item.included).toBe(false);
    expect(next.sections[0]!.items).toHaveLength(cv.sections[0]!.items.length);
  });
});

describe('"not mine" assertion is distinct from hide', () => {
  it("setItemNotMine sets the flag + stamps a timestamp, and clears on retract", () => {
    const cv = makeCv();
    const id = cv.sections[0]!.items[0]!.id;
    const asserted = setItemNotMine(cv, SECTION, id, true, { now: "2026-06-02T00:00:00.000Z" });
    const a = asserted.sections[0]!.items.find((i) => i.id === id)!;
    expect(a.notMine).toBe(true);
    expect(a.notMineAssertedAt).toBe("2026-06-02T00:00:00.000Z");
    // included is untouched — orthogonal axes
    expect(a.included).toBe(true);

    const retracted = setItemNotMine(asserted, SECTION, id, false, {
      now: "2026-07-01T00:00:00.000Z",
    });
    const r = retracted.sections[0]!.items.find((i) => i.id === id)!;
    expect(r.notMine).toBe(false);
    expect(r.notMineAssertedAt).toBeUndefined();
  });

  it("records the structured reason on assert and clears it on retract", () => {
    const cv = makeCv();
    const id = cv.sections[0]!.items[0]!.id;
    const asserted = setItemNotMine(cv, SECTION, id, true, {
      reason: "different-person",
      now: "2026-06-02T00:00:00.000Z",
    });
    expect(asserted.sections[0]!.items.find((i) => i.id === id)!.notMineReason).toBe(
      "different-person",
    );
    const retracted = setItemNotMine(asserted, SECTION, id, false, {
      now: "2026-07-01T00:00:00.000Z",
    });
    expect(retracted.sections[0]!.items.find((i) => i.id === id)!.notMineReason).toBeUndefined();
  });

  it("defaults the timestamp to wall-clock when now is omitted", () => {
    const cv = makeCv();
    const id = cv.sections[0]!.items[0]!.id;
    const asserted = setItemNotMine(cv, SECTION, id, true);
    expect(asserted.sections[0]!.items.find((i) => i.id === id)!.notMineAssertedAt).toBeTruthy();
  });

  it("is immutable", () => {
    const cv = makeCv();
    const snapshot = JSON.stringify(cv);
    setItemNotMine(cv, SECTION, cv.sections[0]!.items[0]!.id, true, {
      now: "2026-06-02T00:00:00.000Z",
    });
    expect(JSON.stringify(cv)).toBe(snapshot);
  });

  it("visibleItems excludes a 'not mine' item even when it is included", () => {
    const cv = makeCv();
    const id = cv.sections[0]!.items[0]!.id;
    const next = setItemNotMine(cv, SECTION, id, true, { now: "2026-06-02T00:00:00.000Z" });
    const item = next.sections[0]!.items.find((i) => i.id === id)!;
    expect(item.included).toBe(true); // still "included" for display purposes
    expect(visibleItems(next.sections[0]!).find((i) => i.id === id)).toBeUndefined();
  });
});

describe("moveItem", () => {
  it("swaps order with the neighbor and re-indexes", () => {
    const cv = makeCv();
    const items = [...cv.sections[0]!.items].sort((a, b) => a.order - b.order);
    const second = items[1]!.id;
    const next = moveItem(cv, SECTION, second, "up");
    const reordered = [...next.sections[0]!.items].sort((a, b) => a.order - b.order);
    expect(reordered[0]!.id).toBe(second);
    expect(reordered.map((i) => i.order)).toEqual([0, 1, 2]);
  });

  it("is a no-op at the boundary", () => {
    const cv = makeCv();
    const first = [...cv.sections[0]!.items].sort((a, b) => a.order - b.order)[0]!.id;
    const next = moveItem(cv, SECTION, first, "up");
    expect([...next.sections[0]!.items].sort((a, b) => a.order - b.order)[0]!.id).toBe(first);
  });
});

describe("moveItemTo (drag-and-drop)", () => {
  it("moves an item to an arbitrary index and re-indexes 0..n", () => {
    const cv = makeCv();
    const items = [...cv.sections[0]!.items].sort((a, b) => a.order - b.order);
    const first = items[0]!.id;
    const next = moveItemTo(cv, SECTION, first, 2);
    const reordered = [...next.sections[0]!.items].sort((a, b) => a.order - b.order);
    expect(reordered[2]!.id).toBe(first);
    expect(reordered.map((i) => i.order)).toEqual([0, 1, 2]);
  });

  it("clamps an out-of-range target and is a no-op when index is unchanged", () => {
    const cv = makeCv();
    const items = [...cv.sections[0]!.items].sort((a, b) => a.order - b.order);
    const last = items[items.length - 1]!.id;
    const clamped = moveItemTo(cv, SECTION, last, 999);
    const order = [...clamped.sections[0]!.items].sort((a, b) => a.order - b.order);
    expect(order[order.length - 1]!.id).toBe(last); // already last → stays
    // Unknown item id → content unchanged.
    expect(moveItemTo(cv, SECTION, "nope", 0)).toEqual(cv);
  });
});

describe("moveSectionTo (drag-and-drop)", () => {
  function multi() {
    return buildCanonicalCv({
      id: "ms",
      resolved,
      works,
      now: "2026-06-02T00:00:00.000Z",
      editorialRoles: [{ journal: "BMJ", role: "Editor", startYear: 2020 }],
      fundings: [{ putCode: "1", title: "ANR", organization: "ANR" }],
    });
  }
  it("moves a section to an arbitrary index", () => {
    const cv = multi();
    const grants = cv.sections.find((s) => s.type === "grants")!.id;
    const next = moveSectionTo(cv, grants, 0);
    const ordered = [...next.sections].sort((a, b) => a.order - b.order);
    expect(ordered[0]!.type).toBe("grants");
    expect(ordered.map((s) => s.order)).toEqual(ordered.map((_, i) => i));
  });
  it("is a no-op for an unknown section id", () => {
    const cv = multi();
    expect(moveSectionTo(cv, "nope", 0)).toBe(cv);
  });
});

describe("reorderSections (pointer drag-and-drop)", () => {
  function multi() {
    return buildCanonicalCv({
      id: "rs",
      resolved,
      works,
      now: "2026-06-02T00:00:00.000Z",
      editorialRoles: [{ journal: "BMJ", role: "Editor", startYear: 2020 }],
      fundings: [{ putCode: "1", title: "ANR", organization: "ANR" }],
    });
  }
  it("applies an explicit full id order and re-indexes", () => {
    const cv = multi();
    const ids = [...cv.sections].sort((a, b) => a.order - b.order).map((s) => s.id);
    const reversed = [...ids].reverse();
    const next = reorderSections(cv, reversed);
    const ordered = [...next.sections].sort((a, b) => a.order - b.order);
    expect(ordered.map((s) => s.id)).toEqual(reversed);
    expect(ordered.map((s) => s.order)).toEqual(ordered.map((_, i) => i));
    expect(next.display.sectionsCustomized).toBe(true);
  });
  it("appends omitted ids (a partial list never drops a section)", () => {
    const cv = multi();
    const sorted = [...cv.sections].sort((a, b) => a.order - b.order);
    const first = sorted[0]!.id;
    // Move only the first section to the end; the rest keep their relative order.
    const next = reorderSections(cv, [...sorted.slice(1).map((s) => s.id), first]);
    const ordered = [...next.sections].sort((a, b) => a.order - b.order);
    expect(ordered).toHaveLength(sorted.length);
    expect(ordered[ordered.length - 1]!.id).toBe(first);
  });
  it("is an identity no-op when the order is unchanged", () => {
    const cv = multi();
    const ids = [...cv.sections].sort((a, b) => a.order - b.order).map((s) => s.id);
    expect(reorderSections(cv, ids)).toBe(cv);
  });
});

describe("section ops + selectors", () => {
  it("renames and toggles visibility", () => {
    const cv = makeCv();
    const renamed = renameSection(cv, SECTION, "Selected Works");
    expect(renamed.sections[0]!.title).toBe("Selected Works");
    const hidden = setSectionVisible(renamed, SECTION, false);
    expect(visibleSections(hidden)).toHaveLength(0);
  });

  it("visibleItems returns only included items, re-indexed", () => {
    const cv = makeCv();
    const id = cv.sections[0]!.items[0]!.id;
    const next = setItemIncluded(cv, SECTION, id, false);
    const vis = visibleItems(next.sections[0]!);
    expect(vis.find((i) => i.id === id)).toBeUndefined();
    expect(vis.map((i) => i.order)).toEqual(vis.map((_, idx) => idx));
  });

  it("moveSection is a no-op with a single section", () => {
    const cv = makeCv();
    expect(moveSection(cv, SECTION, "down").sections[0]!.id).toBe(SECTION);
  });

  it("moveSection swaps adjacent sections and re-indexes order", () => {
    const cv = buildCanonicalCv({
      id: "ms",
      resolved,
      works,
      now: "2026-06-02T00:00:00.000Z",
      editorialRoles: [{ journal: "BMJ", role: "Editor", startYear: 2020 }],
    });
    expect(cv.sections.map((s) => s.id)).toEqual(["publications", "editorial"]);
    const moved = moveSection(cv, "editorial", "up");
    const ordered = [...moved.sections].sort((a, b) => a.order - b.order);
    expect(ordered.map((s) => s.id)).toEqual(["editorial", "publications"]);
    expect(ordered.map((s) => s.order)).toEqual([0, 1]);
    // boundary no-op still holds
    expect(moveSection(cv, "publications", "up")).toEqual(cv);
  });

  it("setLocale re-localizes default section headings but preserves user renames", () => {
    const cv = makeCv();
    expect(cv.sections.find((s) => s.type === "publications")!.title).toBe("Publications");
    // Default heading → re-localized to the chosen language.
    const de = setLocale(cv, "de-DE");
    expect(de.display.locale).toBe("de-DE");
    expect(de.sections.find((s) => s.type === "publications")!.title).toBe("Publikationen");
    // A heading the user renamed is never clobbered by a language switch.
    const renamed = renameSection(cv, SECTION, "My Selected Papers");
    const deRenamed = setLocale(renamed, "de-DE");
    expect(deRenamed.sections.find((s) => s.type === "publications")!.title).toBe(
      "My Selected Papers",
    );
  });

  it("orderedSections applies the canonical order at display time until customized", () => {
    const cv = buildCanonicalCv({
      id: "os",
      resolved,
      works,
      now: "2026-06-02T00:00:00.000Z",
      employments: [{ putCode: "1", organization: "Nagoya U", roleTitle: "AP", startYear: 2024 }],
    });
    // Simulate a stale stored doc: publications pinned first, not customized.
    const stale: CanonicalCv = {
      ...cv,
      sections: cv.sections.map((s) => (s.type === "publications" ? { ...s, order: -5 } : s)),
    };
    const ord = orderedSections(stale).map((s) => s.type);
    expect(ord.indexOf("positions")).toBeLessThan(ord.indexOf("publications"));
    // Once customized, the stored order wins.
    const customized: CanonicalCv = {
      ...stale,
      display: { ...stale.display, sectionsCustomized: true },
    };
    expect(orderedSections(customized)[0]!.type).toBe("publications");
  });

  it("orderedSections tolerates an unknown section type without NaN ordering", () => {
    const cv = buildCanonicalCv({ id: "ot", resolved, works, now: "2026-06-02T00:00:00.000Z" });
    // A section type removed in a future schema version could survive in a
    // stored doc; the default-order comparator must not return NaN (which makes
    // Array.prototype.sort implementation-defined).
    const alien = {
      id: "future",
      type: "future-type",
      title: "Future",
      visible: true,
      order: 0,
      items: [],
    };
    const patched = { ...cv, sections: [...cv.sections, alien] } as unknown as CanonicalCv;
    expect(() => orderedSections(patched)).not.toThrow();
    const out = orderedSections(patched);
    expect(out).toHaveLength(cv.sections.length + 1);
    // The unknown type sorts last (the 999 fallback order), after all known types.
    expect(out[out.length - 1]!.type).toBe("future-type");
  });

  it("marks sectionsCustomized once the user reorders a section", () => {
    const cv = buildCanonicalCv({
      id: "sc",
      resolved,
      works,
      now: "2026-06-02T00:00:00.000Z",
      editorialRoles: [{ journal: "BMJ", role: "Editor", startYear: 2020 }],
    });
    expect(cv.display.sectionsCustomized).toBe(false);
    const moved = moveSection(cv, "editorial", "up");
    expect(moved.display.sectionsCustomized).toBe(true);
    const moved2 = moveSectionTo(cv, "editorial", 0);
    expect(moved2.display.sectionsCustomized).toBe(true);
  });

  it("is a no-op for unknown section/item ids", () => {
    const cv = makeCv();
    expect(moveSection(cv, "no-such-section", "up")).toEqual(cv);
    expect(moveItem(cv, SECTION, "no-such-item", "up")).toEqual(cv);
    expect(moveItem(cv, "no-such-section", "x", "down")).toEqual(cv);
  });
});

describe("updateDisplay", () => {
  it("merges a partial patch", () => {
    const cv = makeCv();
    const next = updateDisplay(cv, { cslStyle: "vancouver", highlightSelf: false });
    expect(next.display.cslStyle).toBe("vancouver");
    expect(next.display.highlightSelf).toBe(false);
    expect(next.display.showMetrics).toBe(false); // untouched
  });
});

describe("manual entries (add / edit / remove)", () => {
  it("creates the section on first add, then appends to it", () => {
    const cv = makeCv(); // publications only
    expect(cv.sections.find((s) => s.type === "positions")).toBeUndefined();

    const a = addManualEntry(
      cv,
      "positions",
      "Visiting Researcher, MIT (2023)",
      "position:manual:1",
    );
    const pos = a.sections.find((s) => s.type === "positions")!;
    expect(pos.items).toHaveLength(1);
    expect(pos.items[0]).toMatchObject({
      id: "position:manual:1",
      source: "manual",
      displayText: "Visiting Researcher, MIT (2023)",
      included: true,
    });

    const b = addManualEntry(a, "positions", "Postdoc, ENS (2021–2023)", "position:manual:2");
    const pos2 = b.sections.find((s) => s.type === "positions")!;
    expect(pos2.items.map((i) => i.id)).toEqual(["position:manual:1", "position:manual:2"]);
    expect(pos2.items[1]!.order).toBe(1);
  });

  it("ignores blank text", () => {
    const cv = makeCv();
    expect(addManualEntry(cv, "grants", "   ", "grant:manual:x")).toBe(cv);
  });

  it("creates a Skills section at its canonical order with a localized title", () => {
    const cv = addManualEntry(makeCv(), "skills", "Python, R, statistics", "skills:manual:1");
    const skills = cv.sections.find((s) => s.type === "skills")!;
    expect(skills).toBeDefined();
    expect(skills.title).toBe("Skills"); // en-US default
    expect(skills.order).toBe(20); // DEFAULT_SECTION_ORDER.skills
    expect(skills.items[0]!.displayText).toBe("Python, R, statistics");
  });

  it("addSection creates an empty section at its canonical order, idempotently", () => {
    const cv = addSection(makeCv(), "awards");
    const awards = cv.sections.find((s) => s.type === "awards")!;
    expect(awards.items).toHaveLength(0);
    expect(awards.order).toBe(13); // DEFAULT_SECTION_ORDER.awards
    expect(awards.title).toBe("Awards & Honors");
    // Adding the same type again is a no-op (no duplicate section).
    expect(addSection(cv, "awards")).toBe(cv);
  });

  it("edits an entry's text and removes it (re-indexing)", () => {
    let cv = addManualEntry(makeCv(), "grants", "Grant A", "grant:manual:a");
    cv = addManualEntry(cv, "grants", "Grant B", "grant:manual:b");
    const sectionId = cv.sections.find((s) => s.type === "grants")!.id;

    cv = updateItemText(cv, sectionId, "grant:manual:a", "Grant A (revised)");
    expect(
      cv.sections.find((s) => s.type === "grants")!.items.find((i) => i.id === "grant:manual:a")!
        .displayText,
    ).toBe("Grant A (revised)");

    cv = removeItem(cv, sectionId, "grant:manual:a");
    const grants = cv.sections.find((s) => s.type === "grants")!;
    expect(grants.items.map((i) => i.id)).toEqual(["grant:manual:b"]);
    expect(grants.items[0]!.order).toBe(0); // re-indexed
  });

  it("is immutable", () => {
    const cv = makeCv();
    const snapshot = JSON.stringify(cv);
    addManualEntry(cv, "positions", "X", "position:manual:z");
    expect(JSON.stringify(cv)).toBe(snapshot);
  });

  it("survives a re-sync (manual items carried over by build)", () => {
    const previous = addManualEntry(
      makeCv(),
      "positions",
      "Adjunct, Collège de France",
      "position:manual:keep",
    );
    const resynced = buildCanonicalCv({
      id: "cv_test",
      resolved,
      works,
      now: "2026-07-01T00:00:00.000Z",
      previous,
    });
    const pos = resynced.sections.find((s) => s.type === "positions");
    expect(pos?.items.some((i) => i.id === "position:manual:keep")).toBe(true);
  });
});

describe("named presets", () => {
  it("saves the current view (display + section visibility) and re-applies it", () => {
    const cv = makeCv();
    const customized = updateDisplay(setSectionVisible(cv, "publications", false), {
      template: "modern",
      publicationsLimit: 5,
    });
    const withPreset = savePreset(customized, "Grant biosketch");
    expect(withPreset.presets).toHaveLength(1);
    const preset = withPreset.presets[0]!;
    expect(preset.name).toBe("Grant biosketch");
    expect(preset.display.template).toBe("modern");
    expect(preset.sectionVisibility.publications).toBe(false);

    // Change the live view, then apply the preset to restore it.
    const changed = updateDisplay(setSectionVisible(withPreset, "publications", true), {
      template: "classic",
      publicationsLimit: undefined,
    });
    const restored = applyPreset(changed, preset.id);
    expect(restored.display.template).toBe("modern");
    expect(restored.display.publicationsLimit).toBe(5);
    expect(restored.sections.find((s) => s.id === "publications")!.visible).toBe(false);
  });

  it("upserts by name, ignores a blank name, and deletes by id", () => {
    const cv = makeCv();
    const once = savePreset(cv, "Full CV");
    const twice = savePreset(updateDisplay(once, { template: "modern" }), "Full CV");
    expect(twice.presets).toHaveLength(1); // upsert, not a duplicate
    expect(twice.presets[0]!.display.template).toBe("modern");

    expect(savePreset(cv, "   ")).toBe(cv); // blank name → no-op

    const id = twice.presets[0]!.id;
    expect(deletePreset(twice, id).presets).toHaveLength(0);
    expect(deletePreset(twice, "preset:nope")).toBe(twice); // unknown → no-op
    expect(applyPreset(cv, "preset:nope")).toBe(cv); // unknown → no-op
  });
});

describe("removeSection", () => {
  it("removes a section immutably; unknown id is a no-op", () => {
    const cv = makeCv();
    const target = cv.sections[0]!.id;
    const before = cv.sections.length;

    const next = removeSection(cv, target);
    expect(next.sections.find((s) => s.id === target)).toBeUndefined();
    expect(next.sections).toHaveLength(before - 1);
    // input untouched
    expect(cv.sections).toHaveLength(before);
    // unknown id → same reference (no-op)
    expect(removeSection(cv, "does-not-exist")).toBe(cv);
  });
});

describe("buildManualCsl", () => {
  it("builds a full CSL item from structured fields", () => {
    const csl = buildManualCsl("m1", {
      type: "paper-conference",
      title: "On signal detection",
      authors: "Chrétien, Basile; Dolladille, Charles",
      venue: "Proc. Pharmacovigilance",
      year: 2024,
      doi: "https://doi.org/10.1/xyz",
    });
    expect(csl).toMatchObject({
      id: "m1",
      type: "paper-conference",
      title: "On signal detection",
      "container-title": "Proc. Pharmacovigilance",
      issued: { "date-parts": [[2024]] },
      DOI: "10.1/xyz",
      URL: "https://doi.org/10.1/xyz",
      author: [
        { family: "Chrétien", given: "Basile" },
        { family: "Dolladille", given: "Charles" },
      ],
    });
  });

  it("defaults the type, accepts a year string, and uses a bare URL without a DOI", () => {
    const csl = buildManualCsl("m2", {
      title: "A dataset",
      year: "2020",
      url: "https://example.org/data",
    });
    expect(csl?.type).toBe("article-journal");
    expect(csl?.issued).toEqual({ "date-parts": [[2020]] });
    expect(csl?.URL).toBe("https://example.org/data");
    expect(csl?.DOI).toBeUndefined();
    expect(csl?.author).toBeUndefined();
    expect(csl?.["container-title"]).toBeUndefined();
  });

  it("returns null for a blank title and ignores a non-numeric year", () => {
    expect(buildManualCsl("m3", { title: "   " })).toBeNull();
    const csl = buildManualCsl("m4", { title: "X", year: "n/a" });
    expect(csl?.issued).toBeUndefined();
  });
});

describe("addStructuredEntry", () => {
  it("adds a citeproc-rendered item (csl, no displayText) to a new section", () => {
    const cv = addStructuredEntry(
      makeCv(),
      "conference",
      { title: "Talk on ADRs", venue: "ESCP", year: 2025 },
      "conference:manual:1",
    );
    const section = cv.sections.find((s) => s.type === "conference")!;
    const item = section.items.at(-1)!;
    expect(item.source).toBe("manual");
    expect(item.displayText).toBeUndefined();
    expect(item.csl?.title).toBe("Talk on ADRs");
    expect(item.meta.year).toBe(2025);
    expect(item.meta.type).toBe("article-journal");
  });

  it("appends with the next order and is a no-op for a blank title", () => {
    let cv = addStructuredEntry(makeCv(), "publications", { title: "First" }, "p:m:1");
    cv = addStructuredEntry(cv, "publications", { title: "Second" }, "p:m:2");
    const pubs = cv.sections.find((s) => s.type === "publications")!;
    const orders = pubs.items.map((i) => i.order);
    expect(new Set(orders).size).toBe(orders.length); // unique, no collisions
    // blank title → unchanged reference
    expect(addStructuredEntry(cv, "publications", { title: "  " }, "p:m:3")).toBe(cv);
  });
});

describe("per-view item selection (display.excludedItems)", () => {
  const pubSection = (cv: CanonicalCv) => cv.sections.find((s) => s.type === "publications")!;

  it("hides + re-shows a single item in the current view without touching curation", () => {
    const base = makeCv();
    const sec = pubSection(base);
    const id = visibleItems(sec)[0]!.id;
    expect(isItemShownInView(base.display, sec.id, id)).toBe(true);

    const hidden = setItemInView(base, sec.id, id, false);
    expect(isItemShownInView(hidden.display, sec.id, id)).toBe(false);
    expect(hidden.display.excludedItems?.[sec.id]).toContain(id);
    // Curation is untouched — the item is still "mine" + included (not a hide).
    const item = pubSection(hidden).items.find((it) => it.id === id)!;
    expect(item.included).toBe(true);
    expect(item.notMine).toBe(false);

    const shown = setItemInView(hidden, sec.id, id, true);
    expect(isItemShownInView(shown.display, sec.id, id)).toBe(true);
    // Pruned back to no-trace once the list is empty (back-compat clean).
    expect(shown.display.excludedItems).toBeUndefined();
  });

  it("showOnlyInView keeps just the given ids; clearViewExclusions resets", () => {
    const base = makeCv();
    const sec = pubSection(base);
    const ids = visibleItems(sec).map((it) => it.id);
    expect(ids.length).toBeGreaterThan(1);
    const keep = ids[0]!;

    const only = showOnlyInView(base, sec.id, [keep]);
    expect(viewExcludedIds(only.display, sec.id)).toEqual(new Set(ids.slice(1)));
    expect(isItemShownInView(only.display, sec.id, keep)).toBe(true);

    const cleared = clearViewExclusions(only, sec.id);
    expect(cleared.display.excludedItems).toBeUndefined();
  });

  it("a saved preset captures + restores the per-view selection", () => {
    const base = makeCv();
    const sec = pubSection(base);
    const id = visibleItems(sec)[0]!.id;
    const short = savePreset(setItemInView(base, sec.id, id, false), "Short");
    // Switch to a 'full' view (clear exclusions), then re-apply the saved short view.
    const full = clearViewExclusions(short, sec.id);
    expect(full.display.excludedItems).toBeUndefined();
    const reapplied = applyPreset(full, short.presets[0]!.id);
    expect(isItemShownInView(reapplied.display, sec.id, id)).toBe(false);
  });

  it("is immutable — the input CV is never mutated", () => {
    const base = makeCv();
    const sec = pubSection(base);
    const id = visibleItems(sec)[0]!.id;
    setItemInView(base, sec.id, id, false);
    expect(base.display.excludedItems).toBeUndefined();
  });
});
