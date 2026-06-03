import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  addManualEntry,
  moveItem,
  moveItemTo,
  moveSection,
  moveSectionTo,
  removeItem,
  renameSection,
  setItemIncluded,
  setItemNotMine,
  setSectionVisible,
  updateDisplay,
  updateItemText,
  visibleItems,
  visibleSections,
} from "@/lib/canonical/curate";
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

    const retracted = setItemNotMine(asserted, SECTION, id, false, { now: "2026-07-01T00:00:00.000Z" });
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
    const retracted = setItemNotMine(asserted, SECTION, id, false, { now: "2026-07-01T00:00:00.000Z" });
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
    setItemNotMine(cv, SECTION, cv.sections[0]!.items[0]!.id, true, { now: "2026-06-02T00:00:00.000Z" });
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
    const reordered = [...next.sections[0]!.items].sort(
      (a, b) => a.order - b.order,
    );
    expect(reordered[0]!.id).toBe(second);
    expect(reordered.map((i) => i.order)).toEqual([0, 1, 2]);
  });

  it("is a no-op at the boundary", () => {
    const cv = makeCv();
    const first = [...cv.sections[0]!.items].sort((a, b) => a.order - b.order)[0]!
      .id;
    const next = moveItem(cv, SECTION, first, "up");
    expect(
      [...next.sections[0]!.items].sort((a, b) => a.order - b.order)[0]!.id,
    ).toBe(first);
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

    const a = addManualEntry(cv, "positions", "Visiting Researcher, MIT (2023)", "position:manual:1");
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
