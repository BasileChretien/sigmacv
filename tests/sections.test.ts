import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { parseCanonicalCv } from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderCvMarkdown } from "@/lib/render/markdown";
import type { EditorialRole } from "@/lib/oep/client";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const baseWorks = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};

// A self-authored work that also carries grant metadata (OpenAlex `awards`).
const grantedWork = {
  ...(baseWorks.find((w) => w.id.endsWith("W4300000001")) as OpenAlexWork),
  awards: [
    { funder_display_name: "National Institutes of Health", funder_award_id: "R01-12345" },
    { funder_display_name: "National Institutes of Health", funder_award_id: "R01-12345" }, // dup
    { funder_display_name: "Wellcome Trust", funder_award_id: null },
  ],
};
const works: OpenAlexWork[] = [
  grantedWork,
  ...baseWorks.filter((w) => !w.id.endsWith("W4300000001")),
];

const editorialRoles: EditorialRole[] = [
  { journal: "BMJ", role: "Associate Editor", startYear: 2021 },
  { journal: "Lancet", role: "Reviewer", startYear: 2019, endYear: 2022 },
];

const hasApa = listAvailableStyles().includes("apa");

describe("non-citation sections (grants + editorial)", () => {
  it("adds a grants section with de-duplicated funder entries", () => {
    const cv = buildCanonicalCv({
      id: "s",
      resolved,
      works,
      now: "2026-06-02T00:00:00.000Z",
    });
    const grants = cv.sections.find((s) => s.type === "grants");
    expect(grants).toBeDefined();
    expect(grants!.items).toHaveLength(2); // dup collapsed
    expect(grants!.items[0]!.displayText).toBe(
      "National Institutes of Health — R01-12345",
    );
    expect(grants!.items[1]!.displayText).toBe("Wellcome Trust");
    expect(grants!.items[0]!.csl).toBeUndefined();
  });

  it("adds an editorial section from OEP roles", () => {
    const cv = buildCanonicalCv({
      id: "s",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      editorialRoles,
    });
    const editorial = cv.sections.find((s) => s.type === "editorial");
    expect(editorial!.items.map((i) => i.displayText)).toEqual([
      "Associate Editor, BMJ (2021–present)",
      "Reviewer, Lancet (2019–2022)",
    ]);
  });

  it("omits both sections when there's no grant/editorial data", () => {
    const cv = buildCanonicalCv({
      id: "s",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
    });
    expect(cv.sections).toHaveLength(1);
    expect(cv.sections[0]!.type).toBe("publications");
  });

  it("stays schema-valid with mixed citation + non-citation items", () => {
    const cv = buildCanonicalCv({
      id: "s",
      resolved,
      works,
      now: "2026-06-02T00:00:00.000Z",
      editorialRoles,
    });
    expect(() => parseCanonicalCv(cv)).not.toThrow();
    expect(cv.sections.map((s) => s.type)).toEqual([
      "publications",
      "editorial",
      "grants",
    ]);
  });

  it.skipIf(!hasApa)("renders grants/editorial displayText in Markdown", () => {
    const cv = buildCanonicalCv({
      id: "s",
      resolved,
      works,
      now: "2026-06-02T00:00:00.000Z",
      editorialRoles,
    });
    const md = renderCvMarkdown(cv);
    expect(md).toContain("## Grants & Funding");
    expect(md).toContain("Wellcome Trust");
    expect(md).toContain("## Editorial Roles");
    expect(md).toContain("Associate Editor, BMJ");
  });
});
