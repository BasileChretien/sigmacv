import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  setItemDateRange,
  setItemDepartment,
  setItemInstitution,
  setItemRoleTitle,
} from "@/lib/canonical/curate";
import { formatEntryLine, localizedYearRange, rederiveEntryLine } from "@/lib/canonical/entryLine";
import {
  itemDateRange,
  itemDepartment,
  itemInstitution,
  itemRoleTitle,
  type CanonicalCv,
  type CvItem,
  type CvSection,
} from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OrcidPosition } from "@/lib/orcid/client";

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
  // An OpenAlex-inferred affiliation (no job title) — a "fill the blank" candidate.
  affiliations: [{ institution: "MIT", startYear: 2019, endYear: 2021 }],
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
    now: "2026-06-16T00:00:00.000Z",
    employments: [opts.employment ?? employment],
    education: [education],
    previous: opts.previous,
  });
}

const positionsSection = (cv: CanonicalCv): CvSection =>
  cv.sections.find((s) => s.type === "positions")!;
const orcidPosition = (cv: CanonicalCv): CvItem =>
  positionsSection(cv).items.find((i) => i.id === "position:orcid:emp1")!;
const openalexPosition = (cv: CanonicalCv): CvItem =>
  positionsSection(cv).items.find((i) => i.source === "openalex")!;
const educationItem = (cv: CanonicalCv): CvItem =>
  cv.sections.find((s) => s.type === "education")!.items[0]!;
const findItem = (cv: CanonicalCv, sectionId: string, itemId: string): CvItem =>
  cv.sections.find((s) => s.id === sectionId)!.items.find((i) => i.id === itemId)!;

describe("formatEntryLine", () => {
  it("formats role, department, institution and an open date range", () => {
    expect(
      formatEntryLine({
        roleTitle: "Assistant Professor",
        department: "IME",
        institution: "Nagoya University",
        startYear: 2022,
      }),
    ).toBe("Assistant Professor, IME, Nagoya University (2022–present)");
  });

  it("omits a missing role — institution + closed range only", () => {
    expect(formatEntryLine({ institution: "MIT", startYear: 2019, endYear: 2021 })).toBe(
      "MIT (2019–2021)",
    );
  });
});

describe("rederiveEntryLine", () => {
  it("applies the role override over the source role", () => {
    const item = orcidPosition(build());
    const withOverride: CvItem = {
      ...item,
      meta: { ...item.meta, roleTitleOverride: "Group Leader" },
    };
    expect(rederiveEntryLine(withOverride)).toBe(
      "Group Leader, International Medical Education, Nagoya University (2022–present)",
    );
  });

  it("returns undefined when the item has no institution (cannot be re-derived)", () => {
    const manual: CvItem = {
      id: "m1",
      source: "manual",
      sourceId: "m1",
      displayText: "Freelance consultant",
      included: true,
      notMine: false,
      order: 0,
      authoredBySelf: false,
      selfNameVariants: [],
      meta: {},
    };
    expect(rederiveEntryLine(manual)).toBeUndefined();
  });
});

describe("build: structured role on positions & education", () => {
  it("stores the source role / department / dates and the formatted line", () => {
    const item = orcidPosition(build());
    expect(item.meta.roleTitle).toBe("Assistant Professor");
    expect(item.meta.department).toBe("International Medical Education");
    expect(item.meta.startYear).toBe(2022);
    expect(item.meta.endYear).toBeUndefined();
    expect(itemRoleTitle(item)).toBe("Assistant Professor");
    expect(item.displayText).toBe(
      "Assistant Professor, International Medical Education, Nagoya University (2022–present)",
    );
  });

  it("an OpenAlex-inferred position carries no source role", () => {
    const item = openalexPosition(build());
    expect(item.meta.roleTitle).toBeUndefined();
    expect(itemRoleTitle(item)).toBeUndefined();
    expect(item.displayText).toBe("MIT (2019–2021)");
  });

  it("education entries also carry a structured role", () => {
    const item = educationItem(build());
    expect(item.meta.roleTitle).toBe("PharmD");
    expect(item.meta.endYear).toBe(2016);
    expect(item.displayText).toBe("PharmD, Université de Caen (2007–2016)");
  });
});

describe("setItemRoleTitle", () => {
  it("sets the role override and re-derives the line; source role untouched", () => {
    const cv = build();
    const { id: sid } = positionsSection(cv);
    const item = orcidPosition(cv);
    const updated = findItem(setItemRoleTitle(cv, sid, item.id, "Group Leader"), sid, item.id);
    expect(updated.meta.roleTitleOverride).toBe("Group Leader");
    expect(updated.meta.roleTitle).toBe("Assistant Professor");
    expect(itemRoleTitle(updated)).toBe("Group Leader");
    expect(updated.displayText).toBe(
      "Group Leader, International Medical Education, Nagoya University (2022–present)",
    );
  });

  it("fills a missing role on a role-less OpenAlex position", () => {
    const cv = build();
    const { id: sid } = positionsSection(cv);
    const item = openalexPosition(cv);
    const updated = findItem(
      setItemRoleTitle(cv, sid, item.id, "Visiting Researcher"),
      sid,
      item.id,
    );
    expect(updated.meta.roleTitleOverride).toBe("Visiting Researcher");
    expect(updated.displayText).toBe("Visiting Researcher, MIT (2019–2021)");
  });

  it("preserves a trailing space so a multi-word role can be typed", () => {
    const cv = build();
    const { id: sid } = positionsSection(cv);
    const item = orcidPosition(cv);
    // Mid-typing "Group Leader": after "Group " the trailing space must survive —
    // storing the trimmed value would wipe it on every keystroke, blocking the space.
    const updated = findItem(setItemRoleTitle(cv, sid, item.id, "Group "), sid, item.id);
    expect(updated.meta.roleTitleOverride).toBe("Group ");
  });

  it("clears the override on a blank value (revert to source)", () => {
    const cv = build();
    const { id: sid } = positionsSection(cv);
    const item = orcidPosition(cv);
    const edited = setItemRoleTitle(cv, sid, item.id, "Group Leader");
    const reverted = findItem(setItemRoleTitle(edited, sid, item.id, "   "), sid, item.id);
    expect(reverted.meta.roleTitleOverride).toBeUndefined();
    expect(reverted.displayText).toBe(item.displayText);
  });

  it("clears the override when the value equals the source role", () => {
    const cv = build();
    const { id: sid } = positionsSection(cv);
    const item = orcidPosition(cv);
    const updated = findItem(
      setItemRoleTitle(cv, sid, item.id, "  Assistant Professor  "),
      sid,
      item.id,
    );
    expect(updated.meta.roleTitleOverride).toBeUndefined();
    expect(updated.displayText).toBe(item.displayText);
  });

  it("is a no-op for an unknown item id", () => {
    const cv = build();
    const { id: sid } = positionsSection(cv);
    expect(setItemRoleTitle(cv, sid, "position:orcid:nope", "X")).toEqual(cv);
  });

  it("leaves displayText untouched for an item with no institution", () => {
    const cv = build();
    const section = positionsSection(cv);
    // Inject a manual position (no meta.institution) — it cannot be re-derived.
    const manual: CvItem = {
      id: "manual1",
      source: "manual",
      sourceId: "manual1",
      displayText: "Freelance consultant",
      included: true,
      notMine: false,
      order: 99,
      authoredBySelf: false,
      selfNameVariants: [],
      meta: {},
    };
    const withManual: CanonicalCv = {
      ...cv,
      sections: cv.sections.map((s) =>
        s.id === section.id ? { ...s, items: [...s.items, manual] } : s,
      ),
    };
    const updated = findItem(
      setItemRoleTitle(withManual, section.id, "manual1", "Consultant"),
      section.id,
      "manual1",
    );
    expect(updated.displayText).toBe("Freelance consultant");
  });
});

describe("re-sync preserves the role edit", () => {
  it("carries roleTitleOverride and re-derives, while the source role refreshes", () => {
    const first = build();
    const { id: sid } = positionsSection(first);
    const edited = setItemRoleTitle(first, sid, "position:orcid:emp1", "Group Leader");
    // Re-sync with a CHANGED source role-title.
    const second = build({
      previous: edited,
      employment: { ...employment, roleTitle: "Professor" },
    });
    const item = orcidPosition(second);
    expect(item.meta.roleTitle).toBe("Professor"); // source refreshed underneath
    expect(item.meta.roleTitleOverride).toBe("Group Leader"); // user edit carried over
    expect(itemRoleTitle(item)).toBe("Group Leader");
    expect(item.displayText).toBe(
      "Group Leader, International Medical Education, Nagoya University (2022–present)",
    );
  });

  it("carries a role added to a role-less OpenAlex position across re-sync", () => {
    const first = build();
    const { id: sid } = positionsSection(first);
    const oa = openalexPosition(first);
    const edited = setItemRoleTitle(first, sid, oa.id, "Visiting Researcher");
    const second = build({ previous: edited });
    const item = positionsSection(second).items.find((i) => i.id === oa.id)!;
    expect(item.meta.roleTitleOverride).toBe("Visiting Researcher");
    expect(item.displayText).toBe("Visiting Researcher, MIT (2019–2021)");
  });
});

describe("editable institution + dates", () => {
  it("itemInstitution / itemDateRange resolve the override over the source", () => {
    const item = orcidPosition(build());
    expect(itemInstitution(item)).toBe("Nagoya University");
    expect(itemDateRange(item)).toEqual({ startYear: 2022, endYear: undefined });
    const o: CvItem = {
      ...item,
      meta: {
        ...item.meta,
        institutionOverride: "Nagoya Univ.",
        dateRangeOverride: { startYear: 2021, endYear: 2024 },
      },
    };
    expect(itemInstitution(o)).toBe("Nagoya Univ.");
    expect(itemDateRange(o)).toEqual({ startYear: 2021, endYear: 2024 });
  });

  it("localizedYearRange uses the locale's present/until terms", () => {
    expect(localizedYearRange(2022, undefined, "présent", "jusqu’en {year}")).toBe(
      "(2022–présent)",
    );
    expect(localizedYearRange(undefined, 2024, "présent", "jusqu’en {year}")).toBe(
      "(jusqu’en 2024)",
    );
    expect(localizedYearRange(2020, 2024, "présent", "jusqu’en {year}")).toBe("(2020–2024)");
    expect(localizedYearRange(undefined, undefined, "x", "y {year}")).toBe("");
  });

  it("setItemInstitution overrides the name (source untouched) and re-derives", () => {
    const cv = build();
    const { id: sid } = positionsSection(cv);
    const item = orcidPosition(cv);
    const updated = findItem(setItemInstitution(cv, sid, item.id, "Nagoya Univ."), sid, item.id);
    expect(updated.meta.institutionOverride).toBe("Nagoya Univ.");
    expect(updated.meta.institution).toBe("Nagoya University");
    expect(updated.displayText).toBe(
      "Assistant Professor, International Medical Education, Nagoya Univ. (2022–present)",
    );
  });

  it("setItemInstitution clears on blank or equal-to-source (revert)", () => {
    const cv = build();
    const { id: sid } = positionsSection(cv);
    const item = orcidPosition(cv);
    const edited = setItemInstitution(cv, sid, item.id, "Nagoya Univ.");
    const reverted = findItem(setItemInstitution(edited, sid, item.id, "  "), sid, item.id);
    expect(reverted.meta.institutionOverride).toBeUndefined();
    expect(reverted.displayText).toBe(item.displayText);
  });

  it("setItemDateRange overrides the dates, and an omitted end = ongoing", () => {
    const cv = build();
    const { id: sid } = positionsSection(cv);
    const item = orcidPosition(cv);
    const closed = findItem(
      setItemDateRange(cv, sid, item.id, { startYear: 2020, endYear: 2023 }),
      sid,
      item.id,
    );
    expect(closed.meta.dateRangeOverride).toEqual({ startYear: 2020, endYear: 2023 });
    expect(closed.displayText).toBe(
      "Assistant Professor, International Medical Education, Nagoya University (2020–2023)",
    );
    const ongoing = findItem(setItemDateRange(cv, sid, item.id, { startYear: 2020 }), sid, item.id);
    expect(ongoing.displayText).toBe(
      "Assistant Professor, International Medical Education, Nagoya University (2020–present)",
    );
  });

  it("setItemDateRange(null) reverts to the source dates", () => {
    const cv = build();
    const { id: sid } = positionsSection(cv);
    const item = orcidPosition(cv);
    const edited = setItemDateRange(cv, sid, item.id, { startYear: 1999, endYear: 2000 });
    const reverted = findItem(setItemDateRange(edited, sid, item.id, null), sid, item.id);
    expect(reverted.meta.dateRangeOverride).toBeUndefined();
    expect(reverted.displayText).toBe(item.displayText);
  });

  it("carries institution + date overrides across re-sync", () => {
    const first = build();
    const { id: sid } = positionsSection(first);
    let edited = setItemInstitution(first, sid, "position:orcid:emp1", "Nagoya Univ.");
    edited = setItemDateRange(edited, sid, "position:orcid:emp1", {
      startYear: 2021,
      endYear: 2024,
    });
    const item = orcidPosition(build({ previous: edited }));
    expect(item.meta.institutionOverride).toBe("Nagoya Univ.");
    expect(item.meta.dateRangeOverride).toEqual({ startYear: 2021, endYear: 2024 });
    expect(item.displayText).toBe(
      "Assistant Professor, International Medical Education, Nagoya Univ. (2021–2024)",
    );
  });
});

describe("editable department", () => {
  it("itemDepartment resolves the override over the source", () => {
    const item = orcidPosition(build());
    expect(itemDepartment(item)).toBe("International Medical Education");
    const o: CvItem = { ...item, meta: { ...item.meta, departmentOverride: "Dept of X" } };
    expect(itemDepartment(o)).toBe("Dept of X");
  });

  it("setItemDepartment overrides the department (source untouched) and re-derives", () => {
    const cv = build();
    const { id: sid } = positionsSection(cv);
    const item = orcidPosition(cv);
    const updated = findItem(setItemDepartment(cv, sid, item.id, "Pharmacology"), sid, item.id);
    expect(updated.meta.departmentOverride).toBe("Pharmacology");
    expect(updated.meta.department).toBe("International Medical Education");
    expect(updated.displayText).toBe(
      "Assistant Professor, Pharmacology, Nagoya University (2022–present)",
    );
  });

  it("setItemDepartment clears on blank or equal-to-source (revert)", () => {
    const cv = build();
    const { id: sid } = positionsSection(cv);
    const item = orcidPosition(cv);
    const edited = setItemDepartment(cv, sid, item.id, "Pharmacology");
    const reverted = findItem(setItemDepartment(edited, sid, item.id, "  "), sid, item.id);
    expect(reverted.meta.departmentOverride).toBeUndefined();
    expect(reverted.displayText).toBe(item.displayText);
  });

  it("can add a department to a position that has none", () => {
    const cv = build({ employment: { ...employment, department: undefined } });
    const { id: sid } = positionsSection(cv);
    const item = orcidPosition(cv);
    expect(item.displayText).toBe("Assistant Professor, Nagoya University (2022–present)");
    const updated = findItem(setItemDepartment(cv, sid, item.id, "Pharmacology"), sid, item.id);
    expect(updated.displayText).toBe(
      "Assistant Professor, Pharmacology, Nagoya University (2022–present)",
    );
  });

  it("carries the department override across re-sync", () => {
    const first = build();
    const { id: sid } = positionsSection(first);
    const edited = setItemDepartment(first, sid, "position:orcid:emp1", "Pharmacology");
    const item = orcidPosition(build({ previous: edited }));
    expect(item.meta.departmentOverride).toBe("Pharmacology");
    expect(item.displayText).toBe(
      "Assistant Professor, Pharmacology, Nagoya University (2022–present)",
    );
  });
});
