import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemIncluded, setItemNotMine } from "@/lib/canonical/curate";
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
  {
    putCode: "100",
    title: "PARANAC",
    organization: "University of Caen Normandy",
    type: "contract",
  },
  {
    putCode: "101",
    title: "ML-Driven PBL",
    organization: "Nagoya University",
    type: "grant",
    startYear: 2025,
  },
];

// ORCID employment history.
const employments: OrcidPosition[] = [
  {
    putCode: "200",
    organization: "Nagoya University",
    roleTitle: "Assistant Professor",
    startYear: 2024,
  },
  {
    putCode: "201",
    organization: "CHU de Caen",
    roleTitle: "Pharmacist",
    startYear: 2012,
    endYear: 2024,
  },
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
    expect(grants!.items[0]!.displayText).toBe("ML-Driven PBL, Nagoya University (2025)");
    expect(grants!.items[1]!.displayText).toBe("PARANAC, University of Caen Normandy");
    expect(grants!.items[0]!.source).toBe("orcid");
    expect(grants!.items[0]!.csl).toBeUndefined();
  });

  it("populates funder/award identifiers on grant items from ORCID + OpenAlex", () => {
    const cv = buildCanonicalCv({
      id: "f",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      fundings: [
        // ORCID carries a disambiguated funder id + award number directly.
        {
          putCode: "100",
          title: "PARANAC",
          organization: "University of Caen Normandy",
          funderId: "FUNDREF:http://dx.doi.org/10.13039/501100001665",
          awardId: "ANR-18-CE17-0001",
        },
        // ORCID has only an award number; the matching OpenAlex grant (same award
        // number, in the fixture) backfills the funder id + name.
        {
          putCode: "101",
          title: "ML-Driven PBL",
          organization: "Nagoya University",
          awardId: "ANR-18-CE17-0001",
        },
        // No award/funder info at all → identifiers stay undefined (never invented).
        { putCode: "102", title: "Bare grant", organization: "Some Org" },
      ],
    });
    const grants = cv.sections.find((s) => s.type === "grants")!;
    const byPut = (pc: string) => grants.items.find((i) => i.sourceId === pc)!;

    // ORCID-supplied identifiers win.
    expect(byPut("100").meta.funderId).toBe("FUNDREF:http://dx.doi.org/10.13039/501100001665");
    expect(byPut("100").meta.awardId).toBe("ANR-18-CE17-0001");
    expect(byPut("100").meta.funderName).toBe("University of Caen Normandy");

    // OpenAlex grant (matched by award number) fills the missing funder id.
    expect(byPut("101").meta.funderId).toBe("https://openalex.org/F4320332161");
    expect(byPut("101").meta.awardId).toBe("ANR-18-CE17-0001");
    // ORCID org name is authoritative for the display name.
    expect(byPut("101").meta.funderName).toBe("Nagoya University");

    // No identifiers anywhere → nothing fabricated.
    expect(byPut("102").meta.funderId).toBeUndefined();
    expect(byPut("102").meta.awardId).toBeUndefined();
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

  it("stamps lastVerifiedAt + persists the ROR id on live-sourced entry items", () => {
    const cv = buildCanonicalCv({
      id: "s",
      resolved: {
        ...resolved,
        // OpenAlex affiliation carrying a ROR id (set during ROR enrichment).
        affiliations: [
          {
            institution: "Université de Caen",
            startYear: 2010,
            rorId: "https://ror.org/051kpcy16",
          },
        ],
      },
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      // ORCID employment carrying a ROR id.
      employments: [
        {
          putCode: "200",
          organization: "Nagoya University",
          roleTitle: "Assistant Professor",
          startYear: 2024,
          rorId: "https://ror.org/04chrp450",
        },
      ],
      fundings,
    });
    const positions = cv.sections.find((s) => s.type === "positions")!;
    const orcidPos = positions.items.find((i) => i.source === "orcid")!;
    const oaPos = positions.items.find((i) => i.source === "openalex")!;
    expect(orcidPos.meta.rorId).toBe("https://ror.org/04chrp450");
    expect(orcidPos.meta.lastVerifiedAt).toBe("2026-06-02T00:00:00.000Z");
    expect(oaPos.meta.rorId).toBe("https://ror.org/051kpcy16");
    // Grants (ORCID, no institution ROR) still get a freshness stamp.
    const grant = cv.sections.find((s) => s.type === "grants")!.items[0]!;
    expect(grant.meta.lastVerifiedAt).toBe("2026-06-02T00:00:00.000Z");
    expect(grant.meta.rorId).toBeUndefined();
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

  it("gives editorial roles stable, content-based ids (source = oep)", () => {
    const cv = buildCanonicalCv({
      id: "s",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      editorialRoles,
    });
    const editorial = cv.sections.find((s) => s.type === "editorial")!;
    expect(editorial.items.map((i) => i.id)).toEqual([
      "editorial:bmj:associate-editor",
      "editorial:lancet:reviewer",
    ]);
    expect(editorial.items.every((i) => i.source === "oep")).toBe(true);
  });

  it("preserves Hide + 'not mine' + reason on editorial roles across a re-sync", () => {
    const NOW = "2026-06-02T00:00:00.000Z";
    const first = buildCanonicalCv({
      id: "s",
      resolved,
      works: baseWorks,
      now: NOW,
      editorialRoles,
    });
    // OEP mis-attributed the BMJ editorship → mark it "not mine" with a reason;
    // hide the Lancet one from the CV.
    let curated = setItemNotMine(first, "editorial", "editorial:bmj:associate-editor", true, {
      reason: "different-person",
      now: NOW,
    });
    curated = setItemIncluded(curated, "editorial", "editorial:lancet:reviewer", false);

    // Re-sync with the dataset rows REORDERED — index-based ids would have moved
    // the corrections onto the wrong roles; the stable id keeps them anchored.
    const resynced = buildCanonicalCv({
      id: "s",
      resolved,
      works: baseWorks,
      now: "2026-07-01T00:00:00.000Z",
      editorialRoles: [editorialRoles[1]!, editorialRoles[0]!],
      previous: curated,
    });
    const ed = resynced.sections.find((s) => s.type === "editorial")!;
    const bmj = ed.items.find((i) => i.id === "editorial:bmj:associate-editor")!;
    const lancet = ed.items.find((i) => i.id === "editorial:lancet:reviewer")!;
    expect(bmj.notMine).toBe(true);
    expect(bmj.notMineReason).toBe("different-person");
    expect(bmj.notMineAssertedAt).toBeDefined();
    expect(lancet.included).toBe(false);
  });

  it("adds a new editorial role un-curated without disturbing existing curation", () => {
    const NOW = "2026-06-02T00:00:00.000Z";
    const first = buildCanonicalCv({
      id: "s",
      resolved,
      works: baseWorks,
      now: NOW,
      editorialRoles,
    });
    const curated = setItemNotMine(first, "editorial", "editorial:bmj:associate-editor", true, {
      now: NOW,
    });
    const resynced = buildCanonicalCv({
      id: "s",
      resolved,
      works: baseWorks,
      now: NOW,
      editorialRoles: [...editorialRoles, { journal: "Nature", role: "Editor" }],
      previous: curated,
    });
    const ed = resynced.sections.find((s) => s.type === "editorial")!;
    expect(ed.items.find((i) => i.id === "editorial:bmj:associate-editor")!.notMine).toBe(true);
    const nat = ed.items.find((i) => i.id === "editorial:nature:editor")!;
    expect(nat.notMine).toBe(false);
    expect(nat.included).toBe(true);
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

  it("builds Education, Awards, Service, Peer-review + a dedicated Invited Talks section", () => {
    const cv = buildCanonicalCv({
      id: "orc",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      employments,
      invitedPositions: [
        {
          putCode: "300",
          organization: "Harvard",
          roleTitle: "Visiting Scholar",
          startYear: 2019,
          endYear: 2020,
        },
      ],
      education: [
        {
          putCode: "400",
          organization: "University of Caen",
          roleTitle: "PharmD",
          startYear: 2008,
          endYear: 2014,
        },
      ],
      distinctions: [
        {
          putCode: "500",
          organization: "French Society of Pharmacology",
          roleTitle: "Young Investigator Award",
          startYear: 2021,
        },
      ],
      service: [
        { putCode: "600", organization: "ISoP", roleTitle: "Committee Member", startYear: 2022 },
      ],
      peerReviews: [
        // Resolved journal name wins over the publisher/convening org.
        { issn: "0959-8138", journal: "The BMJ", organization: "BMJ Publishing", count: 5 },
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
    expect(byType("service")!.items[0]!.displayText).toBe("Committee Member, ISoP (2022–present)");
    // Invited positions get their own "Invited Talks" section (not merged into
    // Positions), so visiting/invited roles aren't buried under employment.
    expect(
      byType("talks")!.items.some((i) =>
        i.displayText?.includes("Visiting Scholar, Harvard (2019–2020)"),
      ),
    ).toBe(true);
    expect(
      byType("positions")?.items.some((i) => i.displayText?.includes("Visiting Scholar")) ?? false,
    ).toBe(false);
    // Peer review labelled by JOURNAL (resolved name), publisher only as fallback.
    const pr = byType("peer-review")!.items.map((i) => i.displayText);
    expect(pr).toContain("The BMJ — 5 reviews"); // journal name, not "BMJ Publishing"
    expect(pr).toContain("Cell — 1 review"); // no journal → org fallback
  });

  it("builds a Datasets & Software section from DataCite outputs", () => {
    const cv = buildCanonicalCv({
      id: "ds",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      dataciteOutputs: [
        {
          doi: "10.5281/zenodo.9",
          title: "PV signal toolkit",
          type: "Software",
          year: 2024,
          publisher: "Zenodo",
        },
        {
          doi: "10.5281/zenodo.8",
          title: "VigiBase extract",
          type: "Dataset",
          year: 2023,
          publisher: "Zenodo",
        },
      ],
    });
    const datasets = cv.sections.find((s) => s.type === "datasets")!;
    expect(datasets.items).toHaveLength(2);
    // Newest first; format "<title>. <publisher> (<year>) [<type>]. <doi-url>".
    expect(datasets.items[0]!.displayText).toBe(
      "PV signal toolkit. Zenodo (2024) [Software]. https://doi.org/10.5281/zenodo.9",
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
    const asserted = setItemNotMine(first, "publications", pubId, true, {
      now: "2026-06-02T00:00:00.000Z",
    });

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
        {
          putCode: "400",
          organization: "University of Caen",
          roleTitle: "PharmD",
          startYear: 2008,
          endYear: 2014,
        },
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
        if (s.type === "education")
          return { ...s, items: [...s.items, manual("education:manual:1", "Self-taught Rust")] };
        if (s.type === "peer-review")
          return {
            ...s,
            items: [...s.items, manual("peer-review:manual:1", "Grant review panel — NIH")],
          };
        if (s.type === "grants")
          return {
            ...s,
            items: [...s.items, manual("grant:manual:1", "Internal seed fund (2020)")],
          };
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
        {
          putCode: "400",
          organization: "University of Caen",
          roleTitle: "PharmD",
          startYear: 2008,
          endYear: 2014,
        },
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

  it("supports manually-added editorial roles and preserves them across re-sync", () => {
    // No OEP source: a user adds an editorial role by hand.
    const base = buildCanonicalCv({
      id: "ed",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
    });
    const manual: CvItem = {
      id: "editorial:manual:1",
      source: "manual",
      sourceId: "manual",
      displayText: "Associate Editor, Drug Safety (2023–present)",
      included: true,
      notMine: false,
      order: 0,
      authoredBySelf: false,
      selfNameVariants: [],
      meta: {},
    };
    const withEditorial: CanonicalCv = {
      ...base,
      sections: [
        ...base.sections,
        {
          id: "editorial",
          type: "editorial",
          title: "Editorial Roles",
          visible: true,
          order: 7,
          items: [manual],
        },
      ],
    };
    const resynced = buildCanonicalCv({
      id: "ed",
      resolved,
      works: baseWorks,
      now: "2026-07-01T00:00:00.000Z",
      previous: withEditorial,
    });
    const editorial = resynced.sections.find((s) => s.type === "editorial")!;
    expect(editorial).toBeDefined();
    expect(editorial.items.map((i) => i.displayText)).toContain(
      "Associate Editor, Drug Safety (2023–present)",
    );
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
      primary_location: { source: { display_name: "Some Journal", type: "journal" } },
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
      primary_location: { source: { display_name: "Some Journal", type: "journal" } },
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

  it("preserves user-entered profile/header fields across a re-sync", () => {
    const first = buildCanonicalCv({
      id: "prof",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
    });
    const curated: CanonicalCv = {
      ...first,
      owner: {
        ...first.owner,
        displayName: "B. Chrétien, PharmD",
        headline: "Assistant Professor",
        summary: "Pharmacovigilance.",
        photo: "data:image/png;base64,AAAA",
        contact: { email: "b@example.org", location: "Nagoya" },
        links: [{ label: "Site", url: "https://example.org" }],
        personal: { nationality: "French" },
      },
    };
    const resynced = buildCanonicalCv({
      id: "prof",
      resolved,
      works: baseWorks,
      now: "2026-07-01T00:00:00.000Z",
      previous: curated,
    });
    expect(resynced.owner.displayName).toBe("B. Chrétien, PharmD");
    expect(resynced.owner.headline).toBe("Assistant Professor");
    expect(resynced.owner.summary).toBe("Pharmacovigilance.");
    expect(resynced.owner.photo).toBe("data:image/png;base64,AAAA");
    expect(resynced.owner.contact?.email).toBe("b@example.org");
    expect(resynced.owner.links).toHaveLength(1);
    expect(resynced.owner.personal?.nationality).toBe("French");
    // …while metrics still refresh from OpenAlex.
    expect(resynced.owner.openAlexAuthorIds).toEqual(resolved.authorIds);
  });

  it("orders new sections by the canonical academic default with distinct orders", () => {
    const cv = buildCanonicalCv({
      id: "ord",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      employments,
      fundings,
      editorialRoles,
      education: [
        {
          putCode: "400",
          organization: "University of Caen",
          roleTitle: "PharmD",
          startYear: 2008,
        },
      ],
      distinctions: [
        {
          putCode: "500",
          organization: "French Society of Pharmacology",
          roleTitle: "Young Investigator Award",
          startYear: 2021,
        },
      ],
      dataciteOutputs: [
        { doi: "10.5281/zenodo.1", title: "A dataset", type: "Dataset", year: 2023 },
      ],
    });
    const orders = cv.sections.map((s) => s.order);
    // No two sections share an order value (the old datasets/positions=2 bug).
    expect(new Set(orders).size).toBe(orders.length);
    const ordered = [...cv.sections].sort((a, b) => a.order - b.order).map((s) => s.type);
    expect(ordered.indexOf("positions")).toBeLessThan(ordered.indexOf("publications"));
    expect(ordered.indexOf("education")).toBeLessThan(ordered.indexOf("publications"));
    expect(ordered.indexOf("publications")).toBeLessThan(ordered.indexOf("datasets"));
    expect(ordered.indexOf("grants")).toBeLessThan(ordered.indexOf("awards"));
  });

  it("re-applies the canonical order on re-sync when the user hasn't customized", () => {
    const first = buildCanonicalCv({
      id: "ord1",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      employments,
    });
    // Simulate an OLD stored doc with publications pinned first + no custom flag.
    const stale: CanonicalCv = {
      ...first,
      sections: first.sections.map((s) => (s.type === "publications" ? { ...s, order: 0 } : s)),
    };
    const resynced = buildCanonicalCv({
      id: "ord1",
      resolved,
      works: baseWorks,
      now: "2026-07-01T00:00:00.000Z",
      employments,
      previous: stale,
    });
    const ord = [...resynced.sections].sort((a, b) => a.order - b.order).map((s) => s.type);
    expect(ord.indexOf("positions")).toBeLessThan(ord.indexOf("publications"));
  });

  it("preserves a user's section order across a re-sync once customized", () => {
    const first = buildCanonicalCv({
      id: "ord2",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      employments,
    });
    // The user dragged Publications to the very top (order -1) → customized flag set.
    const reordered: CanonicalCv = {
      ...first,
      display: { ...first.display, sectionsCustomized: true },
      sections: first.sections.map((s) => (s.type === "publications" ? { ...s, order: -1 } : s)),
    };
    const resynced = buildCanonicalCv({
      id: "ord2",
      resolved,
      works: baseWorks,
      now: "2026-07-01T00:00:00.000Z",
      employments,
      previous: reordered,
    });
    expect(resynced.sections.find((s) => s.type === "publications")!.order).toBe(-1);
  });

  it("localizes default section titles to the chosen locale, preserving renames", () => {
    const en = buildCanonicalCv({
      id: "loc",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      employments,
      fundings,
    });
    expect(en.sections.find((s) => s.type === "grants")!.title).toBe("Grants & Funding");

    // The user switches to French and renames Positions, then re-syncs.
    const frRenamed: CanonicalCv = {
      ...en,
      display: { ...en.display, locale: "fr-FR" },
      sections: en.sections.map((s) =>
        s.type === "positions" ? { ...s, title: "Mes postes" } : s,
      ),
    };
    const fr = buildCanonicalCv({
      id: "loc",
      resolved,
      works: baseWorks,
      now: "2026-07-01T00:00:00.000Z",
      employments,
      fundings,
      previous: frRenamed,
    });
    // Default headings re-localize…
    expect(fr.sections.find((s) => s.type === "grants")!.title).toBe("Financements et bourses");
    expect(fr.sections.find((s) => s.type === "publications")!.title).toBe("Publications");
    // …but the genuine rename is left untouched.
    expect(fr.sections.find((s) => s.type === "positions")!.title).toBe("Mes postes");
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
