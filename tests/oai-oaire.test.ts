import { describe, expect, it } from "vitest";
import type { CanonicalCv, CvItem, CvSectionType } from "@/lib/canonical/schema";
import { findWorkRecord, workRecords, type OaiRecordInput } from "@/lib/oai/oai";
import {
  coarAccessRight,
  coarResourceType,
  licenseCondition,
  oaireCvMetadata,
  oaireWorkMetadata,
} from "@/lib/oai/oaire";
import type { CslItem } from "@/types/csl";

/**
 * The `oaire` metadata format (OpenAIRE Guidelines for Literature Repositories
 * v4). What matters here, beyond well-formedness: the OWNER is identified by
 * ORCID on their own author entry (identifier-first, located by the
 * identifier-derived `authorPosition`, never by name); NO other ORCID ever
 * leaves the endpoint even when the stored document knows co-author ORCIDs; the
 * access right is derived honestly from the stored OA determination (open /
 * metadata-only / omitted when undetermined); and nothing appears here that the
 * public page or its `.json` does not already expose.
 */

const OWNER_ORCID = "0000-0002-7483-2489";
const COAUTHOR_ORCID = "0000-0001-5109-3700";

function item(csl: CslItem, meta: CvItem["meta"], order = 0, flags = {}): CvItem {
  return {
    id: csl.id,
    source: "openalex",
    sourceId: csl.id,
    csl,
    included: true,
    notMine: false,
    order,
    authoredBySelf: true,
    selfNameVariants: ["Ada Lovelace"],
    meta,
    ...flags,
  } as unknown as CvItem;
}

function section(type: CvSectionType, items: CvItem[], order = 0) {
  return { id: type, type, title: type, visible: true, order, items };
}

const PAPER: CslItem = {
  id: "W1",
  type: "article-journal",
  title: "A test paper <with markup>",
  author: [
    { family: "Doe", given: "John" },
    { family: "Lovelace", given: "Ada" },
    { literal: "The Consortium" },
  ],
  "container-title": "Journal of Tests & Trials",
  publisher: "Test Press",
  volume: "12",
  issue: "3",
  page: "100-110",
  issued: { "date-parts": [[2019, 3, 1]] },
  DOI: "10.1000/test.1",
};

interface CvOpts {
  orcid?: string | undefined;
  sections?: ReturnType<typeof section>[];
  positions?: CvItem[];
  display?: Record<string, unknown>;
  displayName?: string;
}

function record(opts: CvOpts = {}, setSpec?: string): OaiRecordInput {
  const sections = opts.sections ?? [
    section("publications", [
      item(PAPER, { authorPosition: 2, year: 2019, oaIsOpen: true, license: "cc-by" }),
    ]),
  ];
  const cv = {
    schemaVersion: 2,
    owner: {
      displayName: opts.displayName ?? "Ada Lovelace",
      ...(opts.orcid === undefined ? {} : { orcid: opts.orcid }),
    },
    display: { locale: "en-US", cslStyle: "apa", ...(opts.display ?? {}) },
    sections: [...sections, ...(opts.positions ? [section("positions", opts.positions, 9)] : [])],
  } as unknown as CanonicalCv;
  return { slug: "ada-x7", datestamp: new Date("2026-06-09T10:00:00.000Z"), cv, setSpec };
}

const position = (meta: Record<string, unknown>): CvItem =>
  ({
    id: "P1",
    source: "orcid",
    sourceId: "P1",
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    text: "Professor, Nagoya University",
    meta: { institution: "Nagoya University", ...meta },
  }) as unknown as CvItem;

const work = (rec: OaiRecordInput, id = "W1") => oaireWorkMetadata(findWorkRecord(rec, id)!);

describe("oaire per-work record", () => {
  it("identifies the OWNER by ORCID on their own author entry, and nobody else — even when co-author ORCIDs are stored", () => {
    const rec = record({ orcid: OWNER_ORCID });
    // The stored document knows a co-author's ORCID (an internal JSON-LD input,
    // stripped from the public projection); the harvested record must not.
    const withCoauthor = {
      ...rec,
      cv: {
        ...rec.cv,
        sections: [
          section("publications", [
            item(PAPER, {
              authorPosition: 2,
              year: 2019,
              oaIsOpen: true,
              coauthorOrcids: [COAUTHOR_ORCID],
            }),
          ]),
        ],
      } as CanonicalCv,
    };
    const xml = work(withCoauthor);
    expect(xml).toContain(
      `<datacite:nameIdentifier nameIdentifierScheme="ORCID" schemeURI="https://orcid.org/">https://orcid.org/${OWNER_ORCID}</datacite:nameIdentifier>`,
    );
    expect((xml.match(/<datacite:nameIdentifier/g) ?? []).length).toBe(1);
    expect(xml).not.toContain(COAUTHOR_ORCID);
    // The ORCID sits inside the owner's creator (second author), not the first's.
    const creators = xml.split("<datacite:creator>").slice(1);
    expect(creators).toHaveLength(3);
    expect(creators[0]).toContain("Doe, John");
    expect(creators[0]).not.toContain("nameIdentifier");
    expect(creators[1]).toContain("Lovelace, Ada");
    expect(creators[1]).toContain("<datacite:givenName>Ada</datacite:givenName>");
    expect(creators[1]).toContain("<datacite:familyName>Lovelace</datacite:familyName>");
    expect(creators[1]).toContain("nameIdentifier");
    expect(creators[2]).toContain("<datacite:creatorName>The Consortium</datacite:creatorName>");
    expect(creators[2]).not.toContain("givenName");
  });

  it("emits no ORCID at all without an owner ORCID, without an identifier-derived position, or on a work not authored by the owner", () => {
    expect(work(record({}))).not.toContain("nameIdentifier");
    const noPos = record({ orcid: OWNER_ORCID });
    const noPosCv = {
      ...noPos,
      cv: {
        ...noPos.cv,
        sections: [section("publications", [item(PAPER, { year: 2019 })])],
      } as CanonicalCv,
    };
    expect(work(noPosCv)).not.toContain("nameIdentifier");
    const notSelf = {
      ...noPos,
      cv: {
        ...noPos.cv,
        sections: [
          section("publications", [
            item(PAPER, { authorPosition: 2, year: 2019 }, 0, { authoredBySelf: false }),
          ]),
        ],
      } as CanonicalCv,
    };
    expect(work(notSelf)).not.toContain("nameIdentifier");
    // An out-of-range position never attaches the ORCID to the wrong author.
    const outOfRange = {
      ...noPos,
      cv: {
        ...noPos.cv,
        sections: [section("publications", [item(PAPER, { authorPosition: 7, year: 2019 })])],
      } as CanonicalCv,
    };
    expect(work(outOfRange)).not.toContain("nameIdentifier");
  });

  it("carries title, DOI, issued year, venue citation fields, publisher, the CV page relation, and no per-work affiliation", () => {
    const xml = work(record({ orcid: OWNER_ORCID }));
    expect(xml).toContain("<datacite:title>A test paper &lt;with markup&gt;</datacite:title>");
    expect(xml).toContain(
      '<datacite:identifier identifierType="DOI">https://doi.org/10.1000/test.1</datacite:identifier>',
    );
    expect(xml).toContain('<datacite:date dateType="Issued">2019</datacite:date>');
    expect(xml).toContain(
      "<oaire:citationTitle>Journal of Tests &amp; Trials</oaire:citationTitle>",
    );
    expect(xml).toContain("<oaire:citationVolume>12</oaire:citationVolume>");
    expect(xml).toContain("<oaire:citationIssue>3</oaire:citationIssue>");
    expect(xml).toContain("<oaire:citationStartPage>100</oaire:citationStartPage>");
    expect(xml).toContain("<oaire:citationEndPage>110</oaire:citationEndPage>");
    expect(xml).toContain("<dc:publisher>Test Press</dc:publisher>");
    expect(xml).toContain(
      '<datacite:relatedIdentifier relatedIdentifierType="URL" relationType="IsReferencedBy">https://sigmacv.org/p/ada-x7</datacite:relatedIdentifier>',
    );
    // The owner's affiliation on THIS work is not public (workInstitutions is
    // stripped from the projection), and a current affiliation is not a
    // historical one: per-work records carry no affiliation at all.
    expect(xml).not.toContain("affiliation");
    // No version is known → the optional oaire:version is omitted, never guessed.
    expect(xml).not.toContain("oaire:version");
    expect(xml).not.toContain("fundingReference");
  });

  it("maps the stored open-access determination to a COAR access right, honestly", () => {
    expect(coarAccessRight(true)).toEqual({
      uri: "http://purl.org/coar/access_right/c_abf2",
      label: "open access",
    });
    expect(coarAccessRight(false)).toEqual({
      uri: "http://purl.org/coar/access_right/c_14cb",
      label: "metadata only access",
    });
    expect(coarAccessRight(undefined)).toBeUndefined();

    const mk = (oaIsOpen: boolean | undefined) =>
      work(
        record({
          orcid: OWNER_ORCID,
          sections: [
            section("publications", [item(PAPER, { authorPosition: 2, year: 2019, oaIsOpen })]),
          ],
        }),
      );
    expect(mk(true)).toContain(
      '<datacite:rights rightsURI="http://purl.org/coar/access_right/c_abf2">open access</datacite:rights>',
    );
    expect(mk(false)).toContain(
      '<datacite:rights rightsURI="http://purl.org/coar/access_right/c_14cb">metadata only access</datacite:rights>',
    );
    expect(mk(undefined)).not.toContain("<datacite:rights");
    expect(mk(undefined)).not.toContain("access_right");
  });

  it("names the work's reuse licence only when the stored slug is a known Creative Commons licence", () => {
    expect(licenseCondition("cc-by")).toEqual({ label: "CC BY" });
    expect(licenseCondition("CC-BY-NC-ND")).toEqual({ label: "CC BY-NC-ND" });
    expect(licenseCondition("cc0")).toEqual({
      label: "CC0",
      uri: "https://creativecommons.org/publicdomain/zero/1.0/",
    });
    expect(licenseCondition("public-domain")).toEqual({ label: "public domain" });
    expect(licenseCondition("publisher-specific-oa")).toBeUndefined();
    expect(licenseCondition("other-oa")).toBeUndefined();
    expect(licenseCondition(undefined)).toBeUndefined();
    expect(licenseCondition("  ")).toBeUndefined();

    const xml = work(record({ orcid: OWNER_ORCID }));
    expect(xml).toContain("<oaire:licenseCondition>CC BY</oaire:licenseCondition>");
    const cc0 = work(
      record({
        orcid: OWNER_ORCID,
        sections: [
          section("publications", [
            item(PAPER, { authorPosition: 2, year: 2019, oaIsOpen: true, license: "cc0" }),
          ]),
        ],
      }),
    );
    expect(cc0).toContain(
      '<oaire:licenseCondition uri="https://creativecommons.org/publicdomain/zero/1.0/">CC0</oaire:licenseCondition>',
    );
  });

  it("maps the CV's own routing + the CSL type to a COAR resource type", () => {
    const t = (sectionType: CvSectionType, cslType: string) =>
      coarResourceType(sectionType, cslType);
    expect(t("publications", "article-journal")).toEqual({
      uri: "http://purl.org/coar/resource_type/c_6501",
      label: "journal article",
      general: "literature",
    });
    // The CV's own section routing decides preprint / dataset / software, whatever
    // the CSL type says (OpenAlex maps preprints to the generic CSL "article").
    expect(t("preprints", "article")).toMatchObject({ label: "preprint" });
    expect(t("preprints", "article-journal")).toMatchObject({ label: "preprint" });
    expect(t("datasets", "article-journal")).toMatchObject({
      label: "dataset",
      general: "dataset",
    });
    expect(t("software", "article-journal")).toMatchObject({
      label: "software",
      general: "software",
    });
    expect(t("publications", "paper-conference")).toMatchObject({ label: "conference paper" });
    expect(t("publications", "chapter")).toMatchObject({ label: "book part" });
    expect(t("publications", "book")).toMatchObject({ label: "book" });
    expect(t("publications", "thesis")).toMatchObject({ label: "thesis" });
    expect(t("publications", "report")).toMatchObject({ label: "report" });
    expect(t("publications", "review")).toMatchObject({ label: "peer review" });
    expect(t("publications", "dataset")).toMatchObject({ label: "dataset" });
    expect(t("publications", "software")).toMatchObject({ label: "software" });
    // A bare CSL "article" outside the Preprints section, or anything unknown, is "other".
    expect(t("publications", "article")).toMatchObject({
      uri: "http://purl.org/coar/resource_type/c_1843",
      label: "other",
      general: "other",
    });
    expect(t("other", "motion_picture")).toMatchObject({ label: "other" });

    const DATASET: CslItem = { id: "D1", type: "dataset", title: "A dataset", DOI: "10.5/d1" };
    const PRE: CslItem = { id: "W3", type: "article", title: "A preprint" };
    const rec = record({
      orcid: OWNER_ORCID,
      sections: [
        section("publications", [item(PAPER, { authorPosition: 2, year: 2019 })]),
        section("preprints", [item(PRE, { peerReviewed: false })], 1),
        section("datasets", [item(DATASET, {})], 2),
      ],
    });
    expect(workRecords(rec).map((w) => [w.itemId, w.sectionType])).toEqual([
      ["W1", "publications"],
      ["W3", "preprints"],
      ["D1", "datasets"],
    ]);
    expect(work(rec, "W1")).toContain(
      '<oaire:resourceType resourceTypeGeneral="literature" uri="http://purl.org/coar/resource_type/c_6501">journal article</oaire:resourceType>',
    );
    expect(work(rec, "W3")).toContain(
      '<oaire:resourceType resourceTypeGeneral="literature" uri="http://purl.org/coar/resource_type/c_816b">preprint</oaire:resourceType>',
    );
    expect(work(rec, "D1")).toContain(
      '<oaire:resourceType resourceTypeGeneral="dataset" uri="http://purl.org/coar/resource_type/c_ddb1">dataset</oaire:resourceType>',
    );
  });

  it("omits what it does not know (no DOI, no date, no venue, no pages) rather than inventing it", () => {
    const BARE: CslItem = {
      id: "W8",
      type: "article-journal",
      title: "Bare",
      // A blank literal author is dropped, as in oai_dc.
      author: [{ family: "Lovelace", given: "Ada" }, { literal: "  " }],
      page: "e1234",
    };
    const rec = record({
      orcid: OWNER_ORCID,
      sections: [section("publications", [item(BARE, { authorPosition: 1 })])],
    });
    const xml = work(rec, "W8");
    expect((xml.match(/<datacite:creator>/g) ?? []).length).toBe(1);
    expect(xml).not.toContain("<datacite:identifier");
    expect(xml).not.toContain("<datacite:dates");
    expect(xml).not.toContain("citationTitle");
    expect(xml).not.toContain("citationVolume");
    expect(xml).not.toContain("<dc:publisher");
    // An article number is not a page range: no start/end page.
    expect(xml).not.toContain("citationStartPage");
    expect(xml).not.toContain("citationEndPage");
    expect(xml).toContain("<datacite:relatedIdentifier"); // the page relation always
    // A non-DOI "DOI" and a lone en-dash page range.
    const ODD: CslItem = {
      id: "W9",
      type: "article-journal",
      title: "Odd",
      DOI: "https://example.org/not-a-doi",
      page: "5–9",
    };
    const odd = record({
      orcid: OWNER_ORCID,
      sections: [section("publications", [item(ODD, { authorPosition: 1 })])],
    });
    expect(work(odd, "W9")).not.toContain("example.org");
    expect(work(odd, "W9")).toContain("<oaire:citationStartPage>5</oaire:citationStartPage>");
    expect(work(odd, "W9")).toContain("<oaire:citationEndPage>9</oaire:citationEndPage>");
  });

  it("escapes XML in every text and attribute it emits", () => {
    const EVIL: CslItem = {
      id: "W7",
      type: "article-journal",
      title: `<script>alert("x")</script> & 'q'`,
      author: [{ family: "O'Brien <b>", given: "A & B" }],
      "container-title": "J. <i>Evil</i>",
      publisher: "P & Q",
      volume: "<1>",
      issued: { "date-parts": [[2020]] },
      DOI: "10.1000/x<y",
    };
    const rec = record({
      orcid: OWNER_ORCID,
      sections: [section("publications", [item(EVIL, { authorPosition: 1, oaIsOpen: true })])],
    });
    const xml = work(rec, "W7");
    expect(xml).not.toMatch(/<script|<b>|<i>/);
    expect(xml).toContain("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &apos;q&apos;");
    expect(xml).toContain("O&apos;Brien &lt;b&gt;, A &amp; B");
    expect(xml).toContain("<oaire:citationTitle>J. &lt;i&gt;Evil&lt;/i&gt;</oaire:citationTitle>");
    expect(xml).toContain("<oaire:citationVolume>&lt;1&gt;</oaire:citationVolume>");
    expect(xml).toContain("https://doi.org/10.1000/x&lt;y");
  });

  it("follows the OpenAIRE v4 element order (titles, creators, relatedIdentifiers, publisher, dates, resourceType, identifier, rights, licenseCondition, citation*)", () => {
    const xml = work(record({ orcid: OWNER_ORCID }));
    const order = [
      "<datacite:titles>",
      "<datacite:creators>",
      "<datacite:relatedIdentifiers>",
      "<dc:publisher>",
      "<datacite:dates>",
      "<oaire:resourceType",
      "<datacite:identifier",
      "<datacite:rights",
      "<oaire:licenseCondition",
      "<oaire:citationTitle>",
      "<oaire:citationVolume>",
      "<oaire:citationIssue>",
      "<oaire:citationStartPage>",
      "<oaire:citationEndPage>",
    ];
    const positions = order.map((tag) => xml.indexOf(tag));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(xml).toMatch(/^\s*<oaire:resource /);
    expect(xml).toContain('xmlns:oaire="http://namespace.openaire.eu/schema/oaire/"');
    expect(xml).toContain('xmlns:datacite="http://datacite.org/schema/kernel-4"');
    expect(xml).toContain(
      'xsi:schemaLocation="http://namespace.openaire.eu/schema/oaire/ https://www.openaire.eu/schema/repo-lit/4.0/openaire.xsd"',
    );
    expect(xml.trimEnd().endsWith("</oaire:resource>")).toBe(true);
  });
});

describe("oaire CV-level record", () => {
  it("is minimal: title, the owner as creator with ORCID + self-declared ROR affiliation, page URL identifier, type other", () => {
    const rec = record({
      orcid: OWNER_ORCID,
      positions: [position({ rorId: "04chrp450" })],
      display: { cvLicense: "CC-BY-4.0" },
    });
    const xml = oaireCvMetadata(rec);
    expect(xml).toContain("<datacite:title>Ada Lovelace — Curriculum Vitae</datacite:title>");
    expect(xml).toContain(
      '<datacite:creatorName nameType="Personal">Ada Lovelace</datacite:creatorName>',
    );
    expect(xml).toContain(`https://orcid.org/${OWNER_ORCID}</datacite:nameIdentifier>`);
    expect(xml).toContain(
      '<datacite:affiliation affiliationIdentifier="https://ror.org/04chrp450" affiliationIdentifierScheme="ROR" schemeURI="https://ror.org/">Nagoya University</datacite:affiliation>',
    );
    expect(xml).toContain("<dc:publisher>SigmaCV</dc:publisher>");
    expect(xml).toContain('<datacite:date dateType="Issued">2026-06-09</datacite:date>');
    expect(xml).toContain(
      '<oaire:resourceType resourceTypeGeneral="other" uri="http://purl.org/coar/resource_type/c_1843">other</oaire:resourceType>',
    );
    expect(xml).toContain(
      '<datacite:identifier identifierType="URL">https://sigmacv.org/p/ada-x7</datacite:identifier>',
    );
    // A public page is open access; the CV licence the owner chose is its licence.
    expect(xml).toContain('rightsURI="http://purl.org/coar/access_right/c_abf2"');
    expect(xml).toContain(
      '<oaire:licenseCondition uri="https://spdx.org/licenses/CC-BY-4.0.html">CC BY 4.0</oaire:licenseCondition>',
    );
    expect(xml).not.toContain("citationTitle");
  });

  it("omits the ORCID, the affiliation and the licence when they are not there to give", () => {
    const xml = oaireCvMetadata(record({ displayName: "" }));
    expect(xml).toContain("<datacite:title>Researcher — Curriculum Vitae</datacite:title>");
    expect(xml).toContain(
      '<datacite:creatorName nameType="Personal">Researcher</datacite:creatorName>',
    );
    expect(xml).not.toContain("nameIdentifier");
    expect(xml).not.toContain("affiliation");
    expect(xml).not.toContain("licenseCondition");
    // A position whose ROR id fails the ror.org shape check names no affiliation
    // identifier (the same rule as the public JSON-LD), and the name still shows.
    const junk = oaireCvMetadata(
      record({ orcid: OWNER_ORCID, positions: [position({ rorId: "https://evil.example/x" })] }),
    );
    expect(junk).not.toContain("affiliation");
    // Ended positions are not a current affiliation.
    const ended = oaireCvMetadata(
      record({ orcid: OWNER_ORCID, positions: [position({ rorId: "04chrp450", endYear: 2020 })] }),
    );
    expect(ended).not.toContain("affiliation");
  });
});
