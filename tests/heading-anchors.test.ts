import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { buildRenderedSections } from "@/lib/render/html";
import { sectionsHtmlRaw } from "@/lib/render/templates/shared";
import type { CanonicalCv, CvSection } from "@/lib/canonical/schema";

const resolved = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function prose(id: string, title: string, body: string): CvSection {
  return { id, type: "statement", title, body, visible: true, order: 50, items: [] } as CvSection;
}

function render(cv: CanonicalCv): string {
  return sectionsHtmlRaw(cv, buildRenderedSections(cv));
}

const baseCv = buildCanonicalCv({
  id: "anch",
  resolved,
  works: [],
  employments: [{ putCode: "e", organization: "Some University", startYear: 2020 }],
  now: "2026-06-02T00:00:00.000Z",
});

describe("section heading anchors", () => {
  it("gives a standard section heading a stable id + an accessible hover permalink", () => {
    const html = render(baseCv);
    expect(html).toMatch(/<h2 id="sec-[a-z0-9-]+">/);
    expect(html).toContain('<a class="cv-anchor" href="#sec-');
    // The visible "#" is aria-hidden; the link's name is the (visually-hidden) title.
    expect(html).toContain('<span class="cv-sr-only">');
    expect(html).toContain('<span aria-hidden="true">#</span>');
  });

  it("adds the same permalink to a prose section heading", () => {
    const cv: CanonicalCv = {
      ...baseCv,
      sections: [...baseCv.sections, prose("statement", "Statement", "Hello.")],
    };
    const html = render(cv);
    expect(html).toContain('class="cv-section cv-prose"');
    expect(html).toContain(
      '<h2 id="sec-statement">Statement<a class="cv-anchor" href="#sec-statement">',
    );
  });

  it("sanitizes a messy section id and falls back when it slugs to empty", () => {
    const cv: CanonicalCv = {
      ...baseCv,
      sections: [...baseCv.sections, prose("Wëird ID!!", "Weird", "x"), prose("!!!", "Empty", "y")],
    };
    const html = render(cv);
    expect(html).toContain('id="sec-w-ird-id"');
    expect(html).toContain('id="sec-section"');
  });
});
