import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemNotMine } from "@/lib/canonical/curate";
import { parseCanonicalCv } from "@/lib/canonical/schema";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
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

  it("builds Education, Awards, Service, Peer-review sections + merges invited positions", () => {
    const cv = buildCanonicalCv({
      id: "orc",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      employments,
      invitedPositions: [
        { putCode: "300", organization: "Harvard", roleTitle: "Visiting Scholar", startYear: 2019, endYear: 2020 },
      ],
      education: [
        { putCode: "400", organization: "University of Caen", roleTitle: "PharmD", startYear: 2008, endYear: 2014 },
      ],
      distinctions: [
        { putCode: "500", organization: "French Society of Pharmacology", roleTitle: "Young Investigator Award", startYear: 2021 },
      ],
      service: [
        { putCode: "600", organization: "ISoP", roleTitle: "Committee Member", startYear: 2022 },
      ],
      peerReviews: [
        { organization: "BMJ", count: 5 },
        { organization: "Cell", count: 1 },
      ],
    });
    const byType = (t: string) => cv.sections.find((s) => s.type === t);

    expect(byType("education")!.items[0]!.displayText).toBe(
      "PharmD, University of Caen (2008–2014)",
    );
    // Awards use a single year, not a "–present" range.
    expect(byType("awards")!.items[0]!.displayText).toBe(
      "Young Investigator Award, French Society of Pharmacology (2021)",
    );
    expect(byType("service")!.items[0]!.displayText).toBe(
      "Committee Member, ISoP (2022–present)",
    );
    // Invited position is merged into Positions.
    expect(
      byType("positions")!.items.some((i) =>
        i.displayText?.includes("Visiting Scholar, Harvard (2019–2020)"),
      ),
    ).toBe(true);
    // Peer review: singular vs plural.
    const pr = byType("peer-review")!.items.map((i) => i.displayText);
    expect(pr).toContain("BMJ — 5 reviews");
    expect(pr).toContain("Cell — 1 review");
  });

  it("builds a Datasets & Software section from DataCite outputs", () => {
    const cv = buildCanonicalCv({
      id: "ds",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      dataciteOutputs: [
        { doi: "10.5281/zenodo.9", title: "PV signal toolkit", type: "Software", year: 2024, publisher: "Zenodo" },
        { doi: "10.5281/zenodo.8", title: "VigiBase extract", type: "Dataset", year: 2023, publisher: "Zenodo" },
      ],
    });
    const datasets = cv.sections.find((s) => s.type === "datasets")!;
    expect(datasets.items).toHaveLength(2);
    // Newest first; format "<title>. <publisher> (<year>) [<type>]".
    expect(datasets.items[0]!.displayText).toBe(
      "PV signal toolkit. Zenodo (2024) [Software]",
    );
    expect(datasets.items[0]!.source).toBe("datacite");
    expect(datasets.items[0]!.meta.doi).toBe("10.5281/zenodo.9");
  });

  it("routes preprint-typed works into a separate Preprints section", () => {
    const preprint = {
      ...(baseWorks[0] as OpenAlexWork),
      id: "https://openalex.org/W999PRE",
      doi: null,
      title: "A preprint about X",
      display_name: "A preprint about X",
      type: "preprint",
    };
    const cv = buildCanonicalCv({
      id: "p",
      resolved,
      works: [preprint, ...baseWorks],
      now: "2026-06-02T00:00:00.000Z",
    });
    const pre = cv.sections.find((s) => s.type === "preprints");
    const pubs = cv.sections.find((s) => s.type === "publications")!;
    expect(pre).toBeDefined();
    expect(pre!.items).toHaveLength(1);
    expect(pre!.items[0]!.csl?.title).toBe("A preprint about X");
    // The preprint is NOT also in Publications (no double-counting).
    expect(pubs.items.some((i) => i.csl?.title === "A preprint about X")).toBe(false);
    expect(cv.sections.map((s) => s.type)).toContain("preprints");
  });

  it("preserves a 'not mine' assertion across an OpenAlex id change (DOI-anchored)", () => {
    const withDoi = baseWorks.find((w) => w.doi);
    expect(withDoi).toBeDefined();
    const first = buildCanonicalCv({
      id: "x",
      resolved,
      works: [withDoi!],
      now: "2026-06-02T00:00:00.000Z",
    });
    const pubId = first.sections[0]!.items[0]!.id;
    const asserted = setItemNotMine(first, "publications", pubId, true, { now: "2026-06-02T00:00:00.000Z" });

    // OpenAlex re-issues the SAME work (same DOI) under a different id.
    const churned = { ...withDoi!, id: `${withDoi!.id}-v2` };
    const resynced = buildCanonicalCv({
      id: "x",
      resolved,
      works: [churned],
      now: "2026-07-01T00:00:00.000Z",
      previous: asserted,
    });
    const item = resynced.sections[0]!.items[0]!;
    expect(item.id).not.toBe(pubId); // id genuinely changed
    expect(item.notMine).toBe(true); // …yet the correction survived
  });

  it("carries manual entries through education, peer-review and grants on re-sync", () => {
    // First build creates the ORCID-sourced sections.
    const first = buildCanonicalCv({
      id: "m",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      fundings,
      education: [
        { putCode: "400", organization: "University of Caen", roleTitle: "PharmD", startYear: 2008, endYear: 2014 },
        // A 2nd, more-recent entry so buildOrcidEntrySection's recency sort runs.
        { putCode: "401", organization: "Nagoya University", roleTitle: "MPH", startYear: 2024 },
      ],
      peerReviews: [{ organization: "BMJ", count: 5 }],
    });

    // Inject a user-added MANUAL entry into each section (source: "manual").
    const manual = (id: string, displayText: string): CvItem => ({
      id,
      source: "manual",
      sourceId: id,
      displayText,
      included: true,
      notMine: false,
      order: 99,
      authoredBySelf: false,
      selfNameVariants: [],
      meta: {},
    });
    const withManual: CanonicalCv = {
      ...first,
      sections: first.sections.map((s) => {
        if (s.type === "education") return { ...s, items: [...s.items, manual("education:manual:1", "Self-taught Rust")] };
        if (s.type === "peer-review") return { ...s, items: [...s.items, manual("peer-review:manual:1", "Grant review panel — NIH")] };
        if (s.type === "grants") return { ...s, items: [...s.items, manual("grant:manual:1", "Internal seed fund (2020)")] };
        return s;
      }),
    };

    // Re-sync with the same upstream data + the curated previous.
    const resynced = buildCanonicalCv({
      id: "m",
      resolved,
      works: baseWorks,
      now: "2026-07-01T00:00:00.000Z",
      fundings,
      education: [
        { putCode: "400", organization: "University of Caen", roleTitle: "PharmD", startYear: 2008, endYear: 2014 },
      ],
      peerReviews: [{ organization: "BMJ", count: 5 }],
      previous: withManual,
    });

    const texts = (t: string) =>
      resynced.sections.find((s) => s.type === t)!.items.map((i) => i.displayText);
    expect(texts("education")).toContain("Self-taught Rust");
    expect(texts("peer-review")).toContain("Grant review panel — NIH");
    expect(texts("grants")).toContain("Internal seed fund (2020)");
    // Manual items keep their "manual" provenance after the rebuild.
    const manualEdu = resynced.sections
      .find((s) => s.type === "education")!
      .items.find((i) => i.id === "education:manual:1");
    expect(manualEdu!.source).toBe("manual");
    expect(() => parseCanonicalCv(resynced)).not.toThrow();
  });

  it("de-duplicates works that repeat the same OpenAlex id", () => {
    const w = baseWorks[0] as OpenAlexWork;
    const cv = buildCanonicalCv({
      id: "dup",
      resolved,
      works: [w, { ...w }], // same id appears twice
      now: "2026-06-02T00:00:00.000Z",
    });
    const occurrences = cv.sections
      .flatMap((s) => s.items)
      .filter((i) => i.sourceId === w.id).length;
    expect(occurrences).toBe(1); // the duplicate is dropped
  });

  it("flags an orcid-conflict for proactive review (identifier-based)", () => {
    // Matched by OpenAlex author id, but this paper lists a DIFFERENT ORCID for
    // that author → a same-name collision worth reviewing.
    const conflict = {
      id: "https://openalex.org/W_conflict",
      title: "Possibly a namesake's paper",
      display_name: "Possibly a namesake's paper",
      type: "article",
      publication_year: 2023,
      authorships: [
        {
          author: {
            id: "https://openalex.org/A5001069481", // owner's OpenAlex id
            display_name: "B. Chrétien",
            orcid: "https://orcid.org/0000-0009-9999-9999", // …but a different ORCID
          },
        },
      ],
    } as unknown as OpenAlexWork;
    const cv = buildCanonicalCv({
      id: "rf",
      resolved,
      works: [conflict],
      now: "2026-06-02T00:00:00.000Z",
    });
    const item = cv.sections[0]!.items.find((i) => i.sourceId === conflict.id)!;
    expect(item.authoredBySelf).toBe(true);
    expect(item.meta.reviewFlag).toBe("orcid-conflict");
  });

  it("does not flag a work matched by the owner's own ORCID", () => {
    const clean = {
      id: "https://openalex.org/W_clean",
      title: "Genuinely mine",
      display_name: "Genuinely mine",
      type: "article",
      publication_year: 2023,
      authorships: [
        {
          author: {
            id: "https://openalex.org/A_other",
            display_name: "Basile Chrétien",
            orcid: "https://orcid.org/0000-0002-7483-2489", // owner's ORCID
          },
        },
      ],
    } as unknown as OpenAlexWork;
    const cv = buildCanonicalCv({
      id: "rf2",
      resolved,
      works: [clean],
      now: "2026-06-02T00:00:00.000Z",
    });
    const item = cv.sections[0]!.items.find((i) => i.sourceId === clean.id)!;
    expect(item.authoredBySelf).toBe(true);
    expect(item.meta.reviewFlag).toBeUndefined();
  });

  it("preserves the not-mine reason across a re-sync", () => {
    const first = buildCanonicalCv({
      id: "nr",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
    });
    const pubId = first.sections[0]!.items[0]!.id;
    const asserted = setItemNotMine(first, "publications", pubId, true, {
      reason: "different-person",
      now: "2026-06-02T00:00:00.000Z",
    });
    const resynced = buildCanonicalCv({
      id: "nr",
      resolved,
      works: baseWorks,
      now: "2026-07-01T00:00:00.000Z",
      previous: asserted,
    });
    const item = resynced.sections[0]!.items.find((i) => i.id === pubId)!;
    expect(item.notMine).toBe(true);
    expect(item.notMineReason).toBe("different-person");
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
