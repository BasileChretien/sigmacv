import { describe, expect, it } from "vitest";
import { bareYearRange } from "@/lib/canonical/entryLine";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemInstitution, setItemTextOverride, updateDisplay } from "@/lib/canonical/curate";
import { buildRenderedSections, renderCvHtml } from "@/lib/render/html";
import type { CanonicalCv, TemplateKey } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OrcidPosition } from "@/lib/orcid/client";

// ── bareYearRange (canonical) ─────────────────────────────────────────────────

describe("bareYearRange", () => {
  it("formats a closed range with an en-dash, no parentheses", () => {
    expect(bareYearRange(2012, 2024, "present", "until {year}")).toBe("2012–2024");
  });
  it("uses the localized present term for an open end", () => {
    expect(bareYearRange(2018, undefined, "présent", "jusqu’en {year}")).toBe("2018–présent");
  });
  it("uses the localized until template for an end-only range", () => {
    expect(bareYearRange(undefined, 2020, "present", "until {year}")).toBe("until 2020");
  });
  it("is empty when no year is known", () => {
    expect(bareYearRange(undefined, undefined, "present", "until {year}")).toBe("");
  });
});

// ── structured two-line Positions/Education rendering ─────────────────────────

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A1"],
  displayName: "Basile Chrétien",
};

function makeCv(
  opts: { template?: TemplateKey; emp?: Partial<OrcidPosition>; edu?: Partial<OrcidPosition> } = {},
): CanonicalCv {
  const emp: OrcidPosition = {
    putCode: "emp1",
    organization: "Nagoya University",
    roleTitle: "Assistant Professor",
    department: "International Medical Education",
    startYear: 2022,
    rorId: "https://ror.org/04chrp450",
    ...opts.emp,
  };
  const edu: OrcidPosition = {
    putCode: "edu1",
    organization: "Université de Caen Normandie",
    roleTitle: "PharmD",
    startYear: 2007,
    endYear: 2016,
    rorId: "https://ror.org/051kpcy16",
    ...opts.edu,
  };
  const cv = buildCanonicalCv({
    id: "cv_pe",
    resolved,
    works: [],
    now: "2026-06-18T00:00:00.000Z",
    employments: [emp],
    education: [edu],
  });
  return updateDisplay(cv, { template: opts.template ?? "classic" });
}

/** Joined item HTML of a section, from the shared render assembly. */
function sectionHtml(cv: CanonicalCv, type: "positions" | "education"): string {
  const rs = buildRenderedSections(cv).find((s) => s.section.type === type)!;
  return rs.items.map((i) => i.html).join("");
}

describe("structured two-line entry layout", () => {
  it("renders a role lead line, right-aligned dates and a department · institution sub-line", () => {
    const html = sectionHtml(makeCv(), "positions");
    expect(html).toContain('<div class="cv-entry">');
    expect(html).toContain('<span class="cv-entry-lead">Assistant Professor</span>');
    expect(html).toContain('<span class="cv-entry-dates">2022–present</span>');
    // Sub-line carries the department then the ROR-linked institution.
    expect(html).toContain(
      '<div class="cv-entry-sub">International Medical Education · ' +
        '<a class="cv-ror-link" href="https://ror.org/04chrp450" title="ROR organization record">' +
        "Nagoya University</a></div>",
    );
  });

  it("leads an education entry with the degree and a closed date range", () => {
    const html = sectionHtml(makeCv(), "education");
    expect(html).toContain('<span class="cv-entry-lead">PharmD</span>');
    expect(html).toContain('<span class="cv-entry-dates">2007–2016</span>');
    expect(html).toContain(">Université de Caen Normandie</a></div>");
  });

  it("omits the department when absent (institution alone fills the sub-line)", () => {
    const html = sectionHtml(makeCv({ emp: { department: undefined } }), "positions");
    expect(html).toContain('<div class="cv-entry-sub"><a class="cv-ror-link"');
    expect(html).not.toContain(" · ");
  });

  it("promotes the institution to the lead line when no role is known (no sub-line)", () => {
    const html = sectionHtml(
      makeCv({ emp: { roleTitle: undefined, department: undefined } }),
      "positions",
    );
    // Institution is the linked lead; there is no quieter sub-line below it.
    expect(html).toContain(
      '<span class="cv-entry-lead"><a class="cv-ror-link" href="https://ror.org/04chrp450"',
    );
    expect(html).not.toContain('class="cv-entry-sub"');
  });

  it("omits the date slot entirely when no year is known", () => {
    const html = sectionHtml(makeCv({ emp: { startYear: undefined } }), "positions");
    expect(html).toContain('<div class="cv-entry">');
    expect(html).not.toContain("cv-entry-dates");
  });

  it("shows an institution with no ROR id / website unlinked", () => {
    const html = sectionHtml(
      makeCv({ emp: { rorId: undefined, institutionUrl: undefined } }),
      "positions",
    );
    expect(html).toContain("Nagoya University");
    expect(html).not.toContain("cv-ror-link");
  });

  it("shows a user institution override verbatim and unlinked (their spelling wins)", () => {
    let cv = makeCv();
    const section = cv.sections.find((s) => s.type === "positions")!;
    cv = setItemInstitution(cv, section.id, section.items[0]!.id, "Nagoya Univ.");
    const html = sectionHtml(cv, "positions");
    expect(html).toContain("Nagoya Univ.");
    expect(html).not.toContain("cv-ror-link");
  });

  it("localizes the ongoing date term (fr-FR: present → présent)", () => {
    const html = sectionHtml(updateDisplay(makeCv(), { locale: "fr-FR" }), "positions");
    expect(html).toContain('<span class="cv-entry-dates">2022–présent</span>');
  });

  it("tags the list .cv-history and drops the citation hanging indent", () => {
    const full = renderCvHtml(makeCv());
    expect(full).toContain('<ol class="cv-bib cv-history">');
    expect(full).toContain("ol.cv-history > li { padding-left: 0; text-indent: 0; }");
  });

  it("renders the structured entry on every standard template", () => {
    for (const template of ["classic", "modern", "sidebar", "ats"] as const) {
      const html = sectionHtml(makeCv({ template }), "positions");
      expect(html).toContain('<span class="cv-entry-lead">Assistant Professor</span>');
    }
  });

  it("keeps the ATS template parser-safe: dates inline, no right-aligned column", () => {
    const full = renderCvHtml(makeCv({ template: "ats" }));
    expect(full).toContain(".cv-entry-dates { margin-inline-start: 0; }");
  });

  it("keeps the date on the role's first line (lead flex-basis 0, so a long role wraps under it)", () => {
    // `flex: 1 1 0` (NOT `1 1 auto`): the lead starts at width 0 and grows, so the
    // dates always fit on the first line top-right and a long role wraps within its
    // own column — instead of the dates being bumped onto their own line below.
    expect(renderCvHtml(makeCv())).toContain(
      ".cv-entry-lead { flex: 1 1 0; min-width: 0; font-weight: 600;",
    );
  });
});

describe("fallback to the flat line", () => {
  it("uses the flat line (not the structured entry) when the user typed an override", () => {
    let cv = makeCv();
    const section = cv.sections.find((s) => s.type === "positions")!;
    cv = setItemTextOverride(cv, section.id, section.items[0]!.id, "Group Leader (org not named)");
    const html = sectionHtml(cv, "positions");
    expect(html).not.toContain('class="cv-entry"');
    expect(html).toContain("Group Leader (org not named)");
    // The trailing ROR persistent-identifier link is still appended.
    expect(html).toContain(">ROR</a>");
  });

  it("uses the flat line when the entry carries no institution to anchor it", () => {
    let cv = makeCv();
    const section = cv.sections.find((s) => s.type === "positions")!;
    cv = {
      ...cv,
      sections: cv.sections.map((s) =>
        s.id === section.id
          ? {
              ...s,
              items: s.items.map((it) => ({ ...it, meta: { ...it.meta, institution: undefined } })),
            }
          : s,
      ),
    };
    const html = sectionHtml(cv, "positions");
    expect(html).not.toContain('class="cv-entry"');
    expect(html).toContain(">ROR</a>");
  });
});
