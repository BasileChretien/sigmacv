import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemTextOverride, visibleItems } from "@/lib/canonical/curate";
import { itemDisplayText, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OrcidPosition } from "@/lib/orcid/client";

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

const employment: OrcidPosition = {
  putCode: "emp1",
  organization: "Nagoya University",
  roleTitle: "Assistant Professor",
  department: "International Medical Education",
  startYear: 2022,
};

const education: OrcidPosition = {
  putCode: "edu1",
  organization: "Université de Caen",
  roleTitle: "PharmD",
  startYear: 2007,
  endYear: 2016,
};

function build(opts: { previous?: CanonicalCv; employment?: OrcidPosition } = {}): CanonicalCv {
  return buildCanonicalCv({
    id: "cv_test",
    resolved,
    works: [],
    now: "2026-06-09T00:00:00.000Z",
    employments: [opts.employment ?? employment],
    education: [education],
    previous: opts.previous,
  });
}

const positionItem = (cv: CanonicalCv): { sectionId: string; item: CvItem } => {
  const section = cv.sections.find((s) => s.type === "positions")!;
  return { sectionId: section.id, item: section.items[0]! };
};

describe("itemDisplayText", () => {
  it("returns the override when set, else the source displayText", () => {
    const base: CvItem = {
      id: "position:orcid:emp1",
      source: "orcid",
      sourceId: "emp1",
      displayText: "Assistant Professor, Nagoya University 2022–present",
      included: true,
      notMine: false,
      order: 0,
      authoredBySelf: false,
      selfNameVariants: [],
      meta: {},
    };
    // No override → the source text.
    expect(itemDisplayText(base)).toBe("Assistant Professor, Nagoya University 2022–present");
    // Override present → wins over the source text.
    expect(itemDisplayText({ ...base, displayTextOverride: "Group Leader, Nagoya" })).toBe(
      "Group Leader, Nagoya",
    );
  });

  it("returns undefined for an item carrying neither (e.g. a citation)", () => {
    const citation: CvItem = {
      id: "W1",
      source: "openalex",
      sourceId: "https://openalex.org/W1",
      csl: { id: "W1", type: "article-journal", title: "A paper" },
      included: true,
      notMine: false,
      order: 0,
      authoredBySelf: true,
      selfNameVariants: [],
      meta: {},
    };
    expect(itemDisplayText(citation)).toBeUndefined();
  });
});

describe("setItemTextOverride", () => {
  it("sets a user override on a source-derived positions line", () => {
    const cv = build();
    const { sectionId, item } = positionItem(cv);
    const next = setItemTextOverride(cv, sectionId, item.id, "Group Leader, Nagoya University");
    const updated = next.sections.find((s) => s.id === sectionId)!.items[0]!;
    expect(updated.displayTextOverride).toBe("Group Leader, Nagoya University");
    // Source text is untouched; the override only shadows it at display time.
    expect(updated.displayText).toBe(item.displayText);
    expect(itemDisplayText(updated)).toBe("Group Leader, Nagoya University");
  });

  it("clears the override when given a blank value (revert to source)", () => {
    const cv = build();
    const { sectionId, item } = positionItem(cv);
    const edited = setItemTextOverride(cv, sectionId, item.id, "Custom");
    const reverted = setItemTextOverride(edited, sectionId, item.id, "   ");
    const updated = reverted.sections.find((s) => s.id === sectionId)!.items[0]!;
    expect(updated.displayTextOverride).toBeUndefined();
    expect(itemDisplayText(updated)).toBe(item.displayText);
  });

  it("clears the override when the text equals the live source text", () => {
    const cv = build();
    const { sectionId, item } = positionItem(cv);
    // Typing the source value back exactly is treated as "not edited".
    const next = setItemTextOverride(cv, sectionId, item.id, `  ${item.displayText}  `);
    const updated = next.sections.find((s) => s.id === sectionId)!.items[0]!;
    expect(updated.displayTextOverride).toBeUndefined();
  });

  it("is a no-op for an unknown item id (leaves items unchanged)", () => {
    const cv = build();
    const { sectionId, item } = positionItem(cv);
    const next = setItemTextOverride(cv, sectionId, "position:orcid:nope", "x");
    const same = next.sections.find((s) => s.id === sectionId)!.items[0]!;
    expect(same.displayTextOverride).toBeUndefined();
    expect(same.displayText).toBe(item.displayText);
  });
});

describe("re-sync preservation", () => {
  it("keeps the user's override while refreshing the source text underneath", () => {
    const first = build();
    const { sectionId, item } = positionItem(first);
    const edited = setItemTextOverride(first, sectionId, item.id, "Group Leader");

    // The ORCID record changes (promotion); the same put-code is re-fetched.
    const promoted: OrcidPosition = { ...employment, roleTitle: "Associate Professor" };
    const resynced = build({ previous: edited, employment: promoted });
    const rebuilt = resynced.sections.find((s) => s.type === "positions")!.items[0]!;

    // The override survives the rebuild …
    expect(rebuilt.displayTextOverride).toBe("Group Leader");
    expect(itemDisplayText(rebuilt)).toBe("Group Leader");
    // … and the source text underneath reflects the updated ORCID record, so
    // "revert to source" would now show the new title.
    expect(rebuilt.displayText).toContain("Associate Professor");
    expect(rebuilt.displayText).not.toContain("Assistant Professor");
  });

  it("an override-free education entry rebuilds straight from source", () => {
    const first = build();
    const eduSection = first.sections.find((s) => s.type === "education")!;
    const eduItem = visibleItems(eduSection)[0]!;
    expect(eduItem.displayTextOverride).toBeUndefined();
    expect(itemDisplayText(eduItem)).toBe(eduItem.displayText);
  });
});
