import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemIncluded, updateDisplay, updateOwner } from "@/lib/canonical/curate";
import { profilePageJsonLd } from "@/lib/cv/publicJsonLd";
import type { OrcidPosition } from "@/lib/orcid/client";
import type { CanonicalCv } from "@/lib/canonical/schema";

interface MakeOpts {
  owner?: Partial<CanonicalCv["owner"]>;
  employments?: OrcidPosition[];
  cvLicense?: CanonicalCv["display"]["cvLicense"];
}

function makeCv(opts: MakeOpts = {}): CanonicalCv {
  let cv = buildCanonicalCv({
    id: "j",
    resolved: {
      orcid: "0000-0002-7483-2489",
      authorIds: ["A5001069481"],
      displayName: "Basile Chrétien",
    },
    works: [],
    employments: opts.employments,
    now: "2026-06-02T00:00:00.000Z",
  });
  if (opts.owner) cv = { ...cv, owner: { ...cv.owner, ...opts.owner } };
  if (opts.cvLicense) cv = updateDisplay(cv, { cvLicense: opts.cvLicense });
  return cv;
}

describe("profilePageJsonLd", () => {
  it("describes a ProfilePage/Person with the ORCID as sameAs", () => {
    const json = profilePageJsonLd(
      makeCv({ owner: { headline: "Pharmacovigilance researcher" } }),
      "basile-chretien-abcd",
    );
    const parsed = JSON.parse(json);
    expect(parsed["@type"]).toBe("ProfilePage");
    expect(parsed.url).toContain("/p/basile-chretien-abcd");
    expect(parsed.mainEntity["@type"]).toBe("Person");
    expect(parsed.mainEntity.name).toBe("Basile Chrétien");
    expect(parsed.mainEntity.jobTitle).toBe("Pharmacovigilance researcher");
    expect(parsed.mainEntity.identifier).toBe("https://orcid.org/0000-0002-7483-2489");
    expect(parsed.mainEntity.sameAs).toContain("https://orcid.org/0000-0002-7483-2489");
  });

  it("includes dateModified from the last sync timestamp (living-page freshness)", () => {
    const parsed = JSON.parse(profilePageJsonLd(makeCv(), "s"));
    expect(parsed.dateModified).toBe("2026-06-02T00:00:00.000Z");
  });

  it("omits dateModified when there is no sync timestamp", () => {
    const base = makeCv();
    const noSync: CanonicalCv = {
      ...base,
      provenance: { ...base.provenance, lastSyncedAt: undefined },
    };
    expect(JSON.parse(profilePageJsonLd(noSync, "s")).dateModified).toBeUndefined();
  });

  it("escapes < so it is safe inside an HTML <script> element", () => {
    const json = profilePageJsonLd(makeCv({ owner: { displayName: "</script><b>x" } }), "s");
    expect(json).not.toContain("</script>");
    expect(json).toContain("\\u003c");
    expect(JSON.parse(json).mainEntity.name).toBe("</script><b>x");
  });

  it("emits a `knows` graph for co-authors who have their own indexable SigmaCV CV", () => {
    const json = profilePageJsonLd(makeCv(), "slug", [
      { orcid: "0000-0001-2345-6789", slug: "jane-x", name: "Jane Coauthor" },
    ]);
    const knows = JSON.parse(json).mainEntity.knows;
    expect(knows).toEqual([
      {
        "@type": "Person",
        name: "Jane Coauthor",
        identifier: "https://orcid.org/0000-0001-2345-6789",
        sameAs: ["https://orcid.org/0000-0001-2345-6789"],
        url: expect.stringContaining("/p/jane-x"),
      },
    ]);
  });

  it("omits `knows` when no co-authors were resolved", () => {
    expect(JSON.parse(profilePageJsonLd(makeCv(), "s")).mainEntity.knows).toBeUndefined();
  });

  it("emits affiliation/worksFor Organization with a ROR @id from the current position", () => {
    const cv = makeCv({
      employments: [
        {
          putCode: "emp1",
          organization: "Nagoya University",
          roleTitle: "Researcher",
          startYear: 2024,
          rorId: "04chrp450",
        },
      ],
    });
    const parsed = JSON.parse(profilePageJsonLd(cv, "s"));
    const org = parsed.mainEntity.affiliation;
    expect(org["@type"]).toBe("Organization");
    expect(org.name).toContain("Nagoya University");
    expect(org["@id"]).toBe("https://ror.org/04chrp450");
    expect(org.identifier).toBe("https://ror.org/04chrp450");
    // worksFor mirrors affiliation.
    expect(parsed.mainEntity.worksFor).toEqual(org);
  });

  it("accepts a full ror.org URL form as-is (no double prefix)", () => {
    const cv = makeCv({
      employments: [
        {
          putCode: "e",
          organization: "Nagoya University",
          startYear: 2024,
          rorId: "https://ror.org/04chrp450",
        },
      ],
    });
    const org = JSON.parse(profilePageJsonLd(cv, "s")).mainEntity.affiliation;
    expect(org["@id"]).toBe("https://ror.org/04chrp450");
    expect(org.identifier).toBe("https://ror.org/04chrp450");
  });

  it("OMITS the @id when rorId is a foreign (non-ror.org) URL — never an attacker URL", () => {
    const cv = makeCv({
      employments: [
        {
          putCode: "e",
          organization: "Evil Lab",
          startYear: 2024,
          rorId: "https://evil.example/x",
        },
      ],
    });
    const org = JSON.parse(profilePageJsonLd(cv, "s")).mainEntity.affiliation;
    // Name still present; the unvalidated URL is dropped entirely.
    expect(org.name).toContain("Evil Lab");
    expect(org["@id"]).toBeUndefined();
    expect(org.identifier).toBeUndefined();
  });

  it("OMITS the @id when rorId carries junk that can't form a valid ror.org IRI", () => {
    const cv = makeCv({
      employments: [
        { putCode: "e", organization: "Junk Org", startYear: 2024, rorId: "not a/valid id" },
      ],
    });
    const org = JSON.parse(profilePageJsonLd(cv, "s")).mainEntity.affiliation;
    expect(org["@id"]).toBeUndefined();
    expect(org.identifier).toBeUndefined();
  });

  it("emits the Organization name even without a ROR id (no @id then)", () => {
    const cv = makeCv({
      employments: [{ putCode: "e", organization: "Some Lab", startYear: 2020 }],
    });
    const org = JSON.parse(profilePageJsonLd(cv, "s")).mainEntity.affiliation;
    expect(org.name).toContain("Some Lab");
    expect(org["@id"]).toBeUndefined();
    expect(org.identifier).toBeUndefined();
  });

  it("picks the most recent visible position (skips a hidden top one)", () => {
    let cv = makeCv({
      employments: [
        {
          putCode: "cur",
          organization: "Current University",
          endYear: undefined,
          startYear: 2024,
          rorId: "04chrp450",
        },
        { putCode: "old", organization: "Older Institute", startYear: 2015, endYear: 2020 },
      ],
    });
    const positions = cv.sections.find((s) => s.type === "positions")!;
    const topItem = positions.items.find((i) => i.order === 0)!;
    cv = setItemIncluded(cv, positions.id, topItem.id, false);
    const org = JSON.parse(profilePageJsonLd(cv, "s")).mainEntity.affiliation;
    // The hidden current position is skipped; the older visible one is used.
    expect(org.name).toContain("Older Institute");
  });

  it("has no affiliation when there is no positions section", () => {
    const parsed = JSON.parse(profilePageJsonLd(makeCv(), "s"));
    expect(parsed.mainEntity.affiliation).toBeUndefined();
    expect(parsed.mainEntity.worksFor).toBeUndefined();
  });

  it("adds the OpenAlex author IRI(s) to sameAs, normalised from bare short ids", () => {
    // The build stores bare OpenAlex short ids ("A5001069481"); sameAs must
    // surface the full canonical IRI so consumers can resolve the identity.
    const sameAs: string[] = JSON.parse(profilePageJsonLd(makeCv(), "s")).mainEntity.sameAs;
    expect(sameAs).toContain("https://openalex.org/A5001069481");
  });

  it("includes every OpenAlex author id (one iD can map to several) without dupes", () => {
    const cv = makeCv({ owner: { openAlexAuthorIds: ["A1", "A2", "A1"] } });
    const sameAs: string[] = JSON.parse(profilePageJsonLd(cv, "s")).mainEntity.sameAs;
    expect(sameAs).toContain("https://openalex.org/A1");
    expect(sameAs).toContain("https://openalex.org/A2");
    // De-duplicated.
    expect(sameAs.filter((u) => u === "https://openalex.org/A1")).toHaveLength(1);
  });

  it("accepts a full OpenAlex URL form as-is (no double prefix)", () => {
    const cv = makeCv({ owner: { openAlexAuthorIds: ["https://openalex.org/A9"] } });
    const sameAs: string[] = JSON.parse(profilePageJsonLd(cv, "s")).mainEntity.sameAs;
    expect(sameAs).toContain("https://openalex.org/A9");
    expect(sameAs.some((u) => u.includes("openalex.org/https"))).toBe(false);
  });

  it("combines ORCID + profile links + website into sameAs, never email", () => {
    const cv = makeCv({
      owner: {
        links: [
          { label: "GitHub", url: "https://github.com/me" },
          { label: "Bad", url: "javascript:alert(1)" },
        ],
        contact: { website: "https://example.org", email: "me@example.org" },
      },
    });
    const sameAs: string[] = JSON.parse(profilePageJsonLd(cv, "s")).mainEntity.sameAs;
    expect(sameAs).toContain("https://orcid.org/0000-0002-7483-2489");
    expect(sameAs).toContain("https://github.com/me");
    expect(sameAs).toContain("https://example.org");
    // Unsafe link dropped; email never appears.
    expect(sameAs.some((u) => u.startsWith("javascript:"))).toBe(false);
    expect(sameAs.some((u) => u.includes("me@example.org"))).toBe(false);
  });

  it("adds Wikidata + VIAF/ISNI authority links to sameAs (safe-http guarded)", () => {
    const cv = makeCv({
      owner: {
        wikidataUri: "http://www.wikidata.org/entity/Q6832241",
        wikidataSameAs: [
          "http://www.wikidata.org/entity/Q6832241",
          "https://viaf.org/viaf/305009965",
          "https://isni.org/isni/0000000114567890",
          "javascript:alert(1)", // dropped by the safe-http guard
        ],
      },
    });
    const sameAs: string[] = JSON.parse(profilePageJsonLd(cv, "s")).mainEntity.sameAs;
    expect(sameAs).toContain("http://www.wikidata.org/entity/Q6832241");
    expect(sameAs).toContain("https://viaf.org/viaf/305009965");
    expect(sameAs).toContain("https://isni.org/isni/0000000114567890");
    // The Wikidata URI appears once despite being in both fields.
    expect(sameAs.filter((u) => u === "http://www.wikidata.org/entity/Q6832241")).toHaveLength(1);
    expect(sameAs.some((u) => u.startsWith("javascript:"))).toBe(false);
  });

  it("adds the SPDX license URL to the ProfilePage when a license is chosen", () => {
    const parsed = JSON.parse(profilePageJsonLd(makeCv({ cvLicense: "CC-BY-4.0" }), "s"));
    expect(parsed.license).toBe("https://spdx.org/licenses/CC-BY-4.0.html");
  });

  it("omits license for the 'none' default and 'all-rights-reserved'", () => {
    expect(JSON.parse(profilePageJsonLd(makeCv(), "s")).license).toBeUndefined();
    expect(
      JSON.parse(profilePageJsonLd(makeCv({ cvLicense: "all-rights-reserved" }), "s")).license,
    ).toBeUndefined();
  });

  // ─── C6: richer schema.org entity graph (grants / positions / education) ──────
  const mkItem = (id: string, displayText: string, meta: Record<string, unknown> = {}) => ({
    id,
    source: "orcid",
    sourceId: id,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    displayText,
    meta,
  });
  const withGraphSections = (cv: CanonicalCv): CanonicalCv =>
    ({
      ...cv,
      sections: [
        ...cv.sections,
        {
          id: "positions",
          type: "positions",
          title: "Positions",
          visible: true,
          order: 90,
          items: [mkItem("p1", "Researcher, Nagoya University"), mkItem("p2", "")],
        },
        {
          id: "grants",
          type: "grants",
          title: "Grants",
          visible: true,
          order: 91,
          items: [
            mkItem("g1", "Grant A", {
              funderName: "NIH",
              awardId: "R01-123",
              funderId: "https://doi.org/10.13039/100000002",
            }),
            mkItem("g2", "Grant B", { funderName: "DFG" }),
            mkItem("g3", "Grant C"),
            mkItem("g4", ""),
            mkItem("g5", "Grant E", { funderName: "X", funderId: "not-a-url" }),
          ],
        },
        {
          id: "education",
          type: "education",
          title: "Education",
          visible: true,
          order: 92,
          items: [mkItem("e1", "PhD, University of Caen")],
        },
      ],
    }) as unknown as CanonicalCv;

  it("emits hasOccupation, funding (MonetaryGrant) and hasCredential from the sections", () => {
    const person = JSON.parse(profilePageJsonLd(withGraphSections(makeCv()), "s")).mainEntity;

    // Occupations from positions (the blank-label one is filtered out).
    expect(person.hasOccupation).toHaveLength(1);
    expect(person.hasOccupation[0]).toEqual({
      "@type": "Occupation",
      name: "Researcher, Nagoya University",
    });

    // Credential from education.
    expect(person.hasCredential).toEqual([
      { "@type": "EducationalOccupationalCredential", name: "PhD, University of Caen" },
    ]);

    // Funding: 4 grants (the blank-label one dropped).
    expect(person.funding).toHaveLength(4);
    // A: funder name + safe @id + award identifier.
    expect(person.funding[0]).toEqual({
      "@type": "MonetaryGrant",
      name: "Grant A",
      identifier: "R01-123",
      funder: { "@type": "Organization", name: "NIH", "@id": "https://doi.org/10.13039/100000002" },
    });
    // B: funder name only (no award, no funder @id).
    expect(person.funding[1]).toEqual({
      "@type": "MonetaryGrant",
      name: "Grant B",
      funder: { "@type": "Organization", name: "DFG" },
    });
    // C: no funder at all.
    expect(person.funding[2]).toEqual({ "@type": "MonetaryGrant", name: "Grant C" });
    // E: non-http funder id is dropped, name kept.
    expect(person.funding[3].funder).toEqual({ "@type": "Organization", name: "X" });
  });

  it("omits funding/occupation/credential when those sections are absent", () => {
    const person = JSON.parse(profilePageJsonLd(makeCv(), "s")).mainEntity;
    expect(person.funding).toBeUndefined();
    expect(person.hasOccupation).toBeUndefined();
    expect(person.hasCredential).toBeUndefined();
  });
});
