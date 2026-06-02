import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { parseCanonicalCv } from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderCvMarkdown } from "@/lib/render/markdown";
import type { EditorialRole } from "@/lib/oep/client";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OrcidFunding, OrcidPosition } from "@/lib/orcid/client";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const baseWorks = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};

// Self-asserted ORCID funding records (person-attributed, unlike OpenAlex awards).
const fundings: OrcidFunding[] = [
  { putCode: "100", title: "PARANAC", organization: "University of Caen Normandy", type: "contract" },
  { putCode: "101", title: "ML-Driven PBL", organization: "Nagoya University", type: "grant", startYear: 2025 },
];

// ORCID employment history.
const employments: OrcidPosition[] = [
  { putCode: "200", organization: "Nagoya University", roleTitle: "Assistant Professor", startYear: 2024 },
  { putCode: "201", organization: "CHU de Caen", roleTitle: "Pharmacist", startYear: 2012, endYear: 2024 },
];

const editorialRoles: EditorialRole[] = [
  { journal: "BMJ", role: "Associate Editor", startYear: 2021 },
  { journal: "Lancet", role: "Reviewer", startYear: 2019, endYear: 2022 },
];

const hasApa = listAvailableStyles().includes("apa");

describe("non-citation sections (positions + grants + editorial)", () => {
  it("adds a grants section from ORCID fundings (person-attributed)", () => {
    const cv = buildCanonicalCv({
      id: "s",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      fundings,
    });
    const grants = cv.sections.find((s) => s.type === "grants");
    expect(grants).toBeDefined();
    expect(grants!.items).toHaveLength(2);
    // Newest funding (2025) first.
    expect(grants!.items[0]!.displayText).toBe(
      "ML-Driven PBL, Nagoya University (2025)",
    );
    expect(grants!.items[1]!.displayText).toBe(
      "PARANAC, University of Caen Normandy",
    );
    expect(grants!.items[0]!.source).toBe("orcid");
    expect(grants!.items[0]!.csl).toBeUndefined();
  });

  it("adds a positions section from ORCID employments (current first)", () => {
    const cv = buildCanonicalCv({
      id: "s",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      employments,
    });
    const positions = cv.sections.find((s) => s.type === "positions");
    expect(positions!.items.map((i) => i.displayText)).toEqual([
      "Assistant Professor, Nagoya University (2024–present)",
      "Pharmacist, CHU de Caen (2012–2024)",
    ]);
  });

  it("supplements positions with OpenAlex affiliations ORCID lacks", () => {
    const cv = buildCanonicalCv({
      id: "s",
      resolved: {
        ...resolved,
        affiliations: [
          { institution: "Nagoya University", startYear: 2024 }, // dup of ORCID → skipped
          { institution: "Université de Caen", startYear: 2010, endYear: 2012 },
        ],
      },
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      employments,
    });
    const positions = cv.sections.find((s) => s.type === "positions")!;
    const texts = positions.items.map((i) => i.displayText);
    expect(texts).toContain("Université de Caen (2010–2012)");
    // Nagoya appears once (ORCID), not duplicated from the affiliation.
    expect(texts.filter((t) => t?.includes("Nagoya")).length).toBe(1);

    // ORCID employments show by default; noisy OpenAlex affiliations are hidden.
    const orcidItem = positions.items.find((i) => i.source === "orcid");
    const oaItem = positions.items.find((i) => i.source === "openalex");
    expect(orcidItem?.included).toBe(true);
    expect(oaItem?.included).toBe(false);
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

  it("omits the extra sections when there's no positions/grant/editorial data", () => {
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
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      employments,
      editorialRoles,
      fundings,
    });
    expect(() => parseCanonicalCv(cv)).not.toThrow();
    expect(cv.sections.map((s) => s.type)).toEqual([
      "publications",
      "positions",
      "editorial",
      "grants",
    ]);
  });

  it.skipIf(!hasApa)("renders positions/grants/editorial displayText in Markdown", () => {
    const cv = buildCanonicalCv({
      id: "s",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      employments,
      editorialRoles,
      fundings,
    });
    const md = renderCvMarkdown(cv);
    expect(md).toContain("## Positions");
    expect(md).toContain("Assistant Professor, Nagoya University");
    expect(md).toContain("## Grants & Funding");
    expect(md).toContain("PARANAC");
    expect(md).toContain("## Editorial Roles");
    expect(md).toContain("Associate Editor, BMJ");
  });
});
