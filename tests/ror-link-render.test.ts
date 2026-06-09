import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemTextOverride, updateDisplay } from "@/lib/canonical/curate";
import { buildRenderedSections, renderCvHtml } from "@/lib/render/html";
import type { CanonicalCv, TemplateKey } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OrcidPosition } from "@/lib/orcid/client";

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function makeCv(
  opts: { template?: TemplateKey; emp?: Partial<OrcidPosition>; edu?: Partial<OrcidPosition> } = {},
): CanonicalCv {
  const emp: OrcidPosition = {
    putCode: "emp1",
    organization: "Nagoya University",
    roleTitle: "Assistant Professor",
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
    id: "cv_ror",
    resolved,
    works: [],
    now: "2026-06-09T00:00:00.000Z",
    employments: [emp],
    education: [edu],
  });
  return updateDisplay(cv, { template: opts.template ?? "sidebar" });
}

/** Joined item HTML of a section, from the shared render assembly. */
function sectionHtml(cv: CanonicalCv, type: "positions" | "education"): string {
  const rs = buildRenderedSections(cv).find((s) => s.section.type === type)!;
  return rs.items.map((i) => i.html).join("");
}

describe("sidebar institution → ROR link", () => {
  it("wraps the institution name in a link to its ROR record", () => {
    const html = sectionHtml(makeCv(), "positions");
    expect(html).toContain('<a class="cv-ror-link" href="https://ror.org/04chrp450"');
    expect(html).toContain(">Nagoya University</a>");
  });

  it("links education entries too", () => {
    const html = sectionHtml(makeCv(), "education");
    expect(html).toContain('href="https://ror.org/051kpcy16"');
    expect(html).toContain(">Université de Caen Normandie</a>");
  });

  it("does NOT link on non-sidebar templates (e.g. classic, ats)", () => {
    expect(sectionHtml(makeCv({ template: "classic" }), "positions")).not.toContain("cv-ror-link");
    expect(sectionHtml(makeCv({ template: "ats" }), "positions")).not.toContain("cv-ror-link");
  });

  it("adds no link when the entry has no ROR id", () => {
    expect(sectionHtml(makeCv({ emp: { rorId: undefined } }), "positions")).not.toContain(
      "cv-ror-link",
    );
  });

  it("normalises a bare ROR id to the canonical IRI", () => {
    const html = sectionHtml(makeCv({ emp: { rorId: "04chrp450" } }), "positions");
    expect(html).toContain('href="https://ror.org/04chrp450"');
  });

  it("drops the link for a malformed ROR id (never an arbitrary href)", () => {
    expect(sectionHtml(makeCv({ emp: { rorId: "not a ror id" } }), "positions")).not.toContain(
      "cv-ror-link",
    );
  });

  it("falls back to a trailing ROR link when the institution name was edited out", () => {
    let cv = makeCv();
    const section = cv.sections.find((s) => s.type === "positions")!;
    cv = setItemTextOverride(cv, section.id, section.items[0]!.id, "Group Leader (org not named)");
    const html = sectionHtml(cv, "positions");
    expect(html).toContain('<a class="cv-ror-link" href="https://ror.org/04chrp450"');
    expect(html).toContain(">ROR</a>"); // trailing PID link
    expect(html).not.toContain("Nagoya University");
  });

  it("uses the trailing fallback when no institution name is stored", () => {
    let cv = makeCv();
    const section = cv.sections.find((s) => s.type === "positions")!;
    // Simulate an entry that carries a ROR id but no stored institution name.
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
    expect(sectionHtml(cv, "positions")).toContain(">ROR</a>");
  });

  it("carries the link + its CSS into the full rendered document", () => {
    const html = renderCvHtml(makeCv());
    expect(html).toContain('<a class="cv-ror-link" href="https://ror.org/04chrp450"');
    expect(html).toContain(".cv-ror-link");
  });
});
