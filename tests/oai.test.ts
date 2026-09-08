import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
import {
  dcMetadata,
  findWorkRecord,
  getRecordResponse,
  identifyResponse,
  listIdentifiersResponse,
  listMetadataFormatsResponse,
  listRecordsResponse,
  listSetsResponse,
  oaiDatestamp,
  oaiError,
  oaiIdentifier,
  oaiWorkIdentifier,
  parseOaiIdentifier,
  rorSetSpec,
  validateOaiRequest,
  workRecords,
  type OaiListPage,
  type OaiRecordInput,
  encodeResumptionToken,
  parseResumptionToken,
} from "@/lib/oai/oai";
import type { CslItem } from "@/types/csl";

const OPTS = { baseUrl: "https://sigmacv.org/api/oai", now: new Date("2026-06-10T12:00:00.000Z") };

function makeRecord(
  opts: {
    slug?: string;
    orcid?: string;
    headline?: string;
    cvLicense?: CanonicalCv["display"]["cvLicense"];
  } = {},
): OaiRecordInput {
  let cv = buildCanonicalCv({
    id: "x",
    resolved: {
      orcid: opts.orcid ?? "0000-0002-7483-2489",
      authorIds: ["A5001069481"],
      displayName: "Ada Lovelace",
    },
    works: [],
    now: "2026-06-02T00:00:00.000Z",
  });
  if (opts.headline !== undefined) cv = { ...cv, owner: { ...cv.owner, headline: opts.headline } };
  if (opts.cvLicense) cv = updateDisplay(cv, { cvLicense: opts.cvLicense });
  return { slug: opts.slug ?? "ada-x7", datestamp: new Date("2026-06-09T10:00:00.000Z"), cv };
}

describe("OAI helpers", () => {
  it("formats datestamps at seconds granularity and round-trips identifiers", () => {
    expect(oaiDatestamp(new Date("2026-06-09T10:00:00.000Z"))).toBe("2026-06-09T10:00:00Z");
    expect(oaiIdentifier("ada-x7")).toBe("oai:sigmacv.org:ada-x7");
    expect(parseOaiIdentifier("oai:sigmacv.org:ada-x7")).toEqual({ slug: "ada-x7" });
    expect(parseOaiIdentifier("oai:other.org:x")).toBeNull();
  });

  it("round-trips per-work identifiers (`<slug>/w/<itemId>`) and rejects empty parts", () => {
    expect(oaiWorkIdentifier("ada-x7", "W1")).toBe("oai:sigmacv.org:ada-x7/w/W1");
    expect(parseOaiIdentifier("oai:sigmacv.org:ada-x7/w/W1")).toEqual({
      slug: "ada-x7",
      itemId: "W1",
    });
    // An item id may itself contain "/" (source ids do) — the FIRST "/w/" splits.
    expect(parseOaiIdentifier("oai:sigmacv.org:ada-x7/w/doi:10.1/w/x")).toEqual({
      slug: "ada-x7",
      itemId: "doi:10.1/w/x",
    });
    expect(parseOaiIdentifier("oai:sigmacv.org:ada-x7/w/")).toBeNull();
    expect(parseOaiIdentifier("oai:sigmacv.org:/w/W1")).toBeNull();
    expect(parseOaiIdentifier("oai:sigmacv.org:")).toBeNull();
  });

  it("builds `ror:<id>` set specs", () => {
    expect(rorSetSpec("04chrp450")).toBe("ror:04chrp450");
  });
});

describe("validateOaiRequest", () => {
  it("rejects a missing or illegal verb", () => {
    expect(validateOaiRequest({})).toMatchObject({ kind: "error", code: "badVerb" });
    expect(validateOaiRequest({ verb: "Frobnicate" })).toMatchObject({
      kind: "error",
      code: "badVerb",
    });
  });

  it("handles Identify (and rejects extra args)", () => {
    expect(validateOaiRequest({ verb: "Identify" })).toEqual({ kind: "identify" });
    expect(validateOaiRequest({ verb: "Identify", set: "x" })).toMatchObject({
      code: "badArgument",
    });
  });

  it("handles ListMetadataFormats incl. an unknown identifier", () => {
    expect(validateOaiRequest({ verb: "ListMetadataFormats" })).toEqual({
      kind: "listMetadataFormats",
    });
    expect(
      validateOaiRequest({ verb: "ListMetadataFormats", identifier: "oai:elsewhere:1" }),
    ).toMatchObject({ code: "idDoesNotExist" });
    expect(validateOaiRequest({ verb: "ListMetadataFormats", set: "x" })).toMatchObject({
      code: "badArgument",
    });
  });

  it("plans ListSets (no resumption tokens are ever issued for it)", () => {
    expect(validateOaiRequest({ verb: "ListSets" })).toEqual({ kind: "listSets" });
    expect(validateOaiRequest({ verb: "ListSets", metadataPrefix: "oai_dc" })).toMatchObject({
      code: "badArgument",
    });
    expect(validateOaiRequest({ verb: "ListSets", resumptionToken: "0" })).toMatchObject({
      code: "badResumptionToken",
    });
  });

  it("accepts `set=ror:<id>` on the list verbs and rejects any other set spec", () => {
    expect(
      validateOaiRequest({ verb: "ListRecords", metadataPrefix: "oai_dc", set: "ror:04chrp450" }),
    ).toEqual({
      kind: "list",
      verb: "ListRecords",
      metadataPrefix: "oai_dc",
      offset: 0,
      set: "04chrp450",
    });
    expect(
      validateOaiRequest({
        verb: "ListIdentifiers",
        metadataPrefix: "oai_dc",
        set: "ror:04chrp450",
      }),
    ).toMatchObject({ kind: "list", set: "04chrp450" });
    for (const set of ["phys", "ror:", "ror:04CHRP450", "ror:https://ror.org/x", "ror:a b"]) {
      expect(
        validateOaiRequest({ verb: "ListRecords", metadataPrefix: "oai_dc", set }),
      ).toMatchObject({ code: "badArgument" });
    }
  });

  it("validates GetRecord arguments", () => {
    expect(validateOaiRequest({ verb: "GetRecord" })).toMatchObject({ code: "badArgument" });
    expect(
      validateOaiRequest({
        verb: "GetRecord",
        identifier: "oai:sigmacv.org:a",
        metadataPrefix: "oai_dc",
        from: "2026-01-01",
      }),
    ).toMatchObject({ code: "badArgument" }); // unexpected arg
    expect(
      validateOaiRequest({
        verb: "GetRecord",
        identifier: "oai:sigmacv.org:a",
        metadataPrefix: "marc",
      }),
    ).toMatchObject({ code: "cannotDisseminateFormat" });
    expect(
      validateOaiRequest({ verb: "GetRecord", identifier: "bogus", metadataPrefix: "oai_dc" }),
    ).toMatchObject({ code: "idDoesNotExist" });
    expect(
      validateOaiRequest({
        verb: "GetRecord",
        identifier: "oai:sigmacv.org:ada",
        metadataPrefix: "oai_dc",
      }),
    ).toEqual({ kind: "getRecord", slug: "ada", metadataPrefix: "oai_dc" });
    expect(
      validateOaiRequest({
        verb: "GetRecord",
        identifier: "oai:sigmacv.org:ada/w/W1",
        metadataPrefix: "oai_dc",
      }),
    ).toEqual({ kind: "getRecord", slug: "ada", itemId: "W1", metadataPrefix: "oai_dc" });
  });

  it("validates ListRecords (prefix, dates, resumption token)", () => {
    expect(validateOaiRequest({ verb: "ListRecords" })).toMatchObject({ code: "badArgument" });
    expect(
      validateOaiRequest({ verb: "ListRecords", metadataPrefix: "oai_dc", identifier: "x" }),
    ).toMatchObject({ code: "badArgument" }); // unexpected arg
    expect(validateOaiRequest({ verb: "ListRecords", metadataPrefix: "x" })).toMatchObject({
      code: "cannotDisseminateFormat",
    });
    expect(validateOaiRequest({ verb: "ListRecords", metadataPrefix: "oai_dc" })).toMatchObject({
      kind: "list",
      verb: "ListRecords",
      offset: 0,
    });
    // from/until parsing.
    expect(
      validateOaiRequest({ verb: "ListRecords", metadataPrefix: "oai_dc", from: "nope" }),
    ).toMatchObject({ code: "badArgument" });
    const withDate = validateOaiRequest({
      verb: "ListIdentifiers",
      metadataPrefix: "oai_dc",
      from: "2026-06-01",
      until: "2026-06-30T23:59:59Z",
    });
    expect(withDate).toMatchObject({ kind: "list", verb: "ListIdentifiers", offset: 0 });
    // resumption token: valid, invalid, and exclusivity.
    expect(validateOaiRequest({ verb: "ListRecords", resumptionToken: "100" })).toEqual({
      kind: "list",
      verb: "ListRecords",
      metadataPrefix: "oai_dc",
      offset: 100,
    });
    expect(validateOaiRequest({ verb: "ListRecords", resumptionToken: "abc" })).toMatchObject({
      code: "badResumptionToken",
    });
    expect(
      validateOaiRequest({ verb: "ListRecords", resumptionToken: "1", metadataPrefix: "oai_dc" }),
    ).toMatchObject({ code: "badArgument" });
  });
});

describe("OAI response builders", () => {
  it("Identify advertises the repository + protocol", () => {
    const xml = identifyResponse(OPTS);
    expect(xml).toContain("<repositoryName>SigmaCV</repositoryName>");
    expect(xml).toContain("<protocolVersion>2.0</protocolVersion>");
    expect(xml).toContain("<granularity>YYYY-MM-DDThh:mm:ssZ</granularity>");
    expect(xml).toContain("<baseURL>https://sigmacv.org/api/oai</baseURL>");
    expect(xml).toContain("<responseDate>2026-06-10T12:00:00Z</responseDate>");
  });

  it("ListMetadataFormats advertises oai_dc AND oaire, each with schema + namespace", () => {
    const xml = listMetadataFormatsResponse({ verb: "ListMetadataFormats" }, OPTS);
    expect(xml).toContain("<metadataPrefix>oai_dc</metadataPrefix>");
    expect(xml).toContain("<schema>http://www.openarchives.org/OAI/2.0/oai_dc.xsd</schema>");
    expect(xml).toContain(
      "<metadataNamespace>http://www.openarchives.org/OAI/2.0/oai_dc/</metadataNamespace>",
    );
    expect(xml).toContain("<metadataPrefix>oaire</metadataPrefix>");
    expect(xml).toContain(
      "<schema>https://www.openaire.eu/schema/repo-lit/4.0/openaire.xsd</schema>",
    );
    expect(xml).toContain(
      "<metadataNamespace>http://namespace.openaire.eu/schema/oaire/</metadataNamespace>",
    );
    expect((xml.match(/<metadataFormat>/g) ?? []).length).toBe(2);
  });

  it("errors carry the code; badVerb omits request attributes", () => {
    const bad = oaiError({ verb: "Nope" }, "badVerb", "Illegal verb", OPTS);
    expect(bad).toContain('<error code="badVerb">');
    expect(bad).toContain("<request>https://sigmacv.org/api/oai</request>"); // no attrs
    const noRec = oaiError(
      { verb: "ListRecords", metadataPrefix: "oai_dc" },
      "noRecordsMatch",
      "none",
      OPTS,
    );
    expect(noRec).toContain('verb="ListRecords"'); // attrs echoed for non-badVerb/Argument
  });

  it("maps a CV to Dublin Core (title, creator, ORCID + page identifiers, rights)", () => {
    const dc = dcMetadata(
      makeRecord({ headline: "Pharmacovigilance researcher", cvLicense: "CC-BY-4.0" }),
    );
    expect(dc).toContain("<dc:title>Ada Lovelace — Curriculum Vitae</dc:title>");
    expect(dc).toContain("<dc:creator>Ada Lovelace</dc:creator>");
    expect(dc).toContain("<dc:subject>Pharmacovigilance researcher</dc:subject>");
    expect(dc).toContain("<dc:identifier>https://orcid.org/0000-0002-7483-2489</dc:identifier>");
    expect(dc).toContain("<dc:identifier>https://sigmacv.org/p/ada-x7</dc:identifier>");
    expect(dc).toContain("<dc:rights>https://spdx.org/licenses/CC-BY-4.0.html</dc:rights>");
    expect(dc).toContain("<dc:type>Curriculum Vitae</dc:type>");
  });

  it("GetRecord emits a header (oai identifier + datestamp) + metadata", () => {
    const xml = getRecordResponse(
      { verb: "GetRecord", identifier: oaiIdentifier("ada-x7"), metadataPrefix: "oai_dc" },
      makeRecord(),
      OPTS,
    );
    expect(xml).toContain("<identifier>oai:sigmacv.org:ada-x7</identifier>");
    expect(xml).toContain("<datestamp>2026-06-09T10:00:00Z</datestamp>");
    expect(xml).toContain("<oai_dc:dc");
  });

  it("a resumption token carries the list's filters, and a tampered one is rejected", () => {
    const recs = [makeRecord({ slug: "a" })];
    const from = new Date("2026-01-01T00:00:00Z");
    const until = new Date("2026-06-30T23:59:59Z");
    const page: OaiListPage = {
      records: recs,
      cursor: 0,
      nextOffset: 100,
      filters: { set: "04chrp450", from, until },
    };
    const xml = listRecordsResponse(
      { verb: "ListRecords", metadataPrefix: "oai_dc", set: "ror:04chrp450" },
      page,
      OPTS,
    );
    const token = /<resumptionToken>([^<]+)<\/resumptionToken>/.exec(xml)![1]!;
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(parseResumptionToken(token)).toEqual({ offset: 100, set: "04chrp450", from, until });
    // Page 2 of a set-filtered list is still page 2 OF THAT SET.
    expect(validateOaiRequest({ verb: "ListRecords", resumptionToken: token })).toEqual({
      kind: "list",
      verb: "ListRecords",
      metadataPrefix: "oai_dc",
      offset: 100,
      set: "04chrp450",
      from,
      until,
    });
    // Round trip without filters, and the legacy bare offset.
    expect(parseResumptionToken(encodeResumptionToken({ offset: 7 }))).toEqual({ offset: 7 });
    expect(parseResumptionToken("42")).toEqual({ offset: 42 });
    // Tampering: a foreign set id, a bad date, junk, or a non-numeric offset → rejected,
    // never widened into an unfiltered list.
    const forged = (q: string) => Buffer.from(q, "utf8").toString("base64url");
    expect(parseResumptionToken(forged("o=100&s=../../x"))).toBeNull();
    expect(parseResumptionToken(forged("o=100&s=04chrp450&f=2026-13-01"))).toBeNull();
    expect(parseResumptionToken(forged("o=abc"))).toBeNull();
    expect(parseResumptionToken(forged("s=04chrp450"))).toBeNull();
    expect(parseResumptionToken("not*base64")).toBeNull();
    expect(
      validateOaiRequest({ verb: "ListRecords", resumptionToken: forged("o=1&s=!") }),
    ).toMatchObject({ code: "badResumptionToken" });
  });

  it("ListRecords includes a resumptionToken only when more pages remain", () => {
    const recs = [makeRecord({ slug: "a" }), makeRecord({ slug: "b" })];
    const more: OaiListPage = { records: recs, cursor: 0, nextOffset: 100 };
    const xml = listRecordsResponse({ verb: "ListRecords", metadataPrefix: "oai_dc" }, more, OPTS);
    // Pages are cut at CV boundaries (a CV's per-work records ride with it), so
    // the size of the complete RECORD list is unknown: the optional
    // completeListSize / cursor attributes are omitted rather than misreported.
    const token = /<resumptionToken>([^<]+)<\/resumptionToken>/.exec(xml)![1]!;
    expect(parseResumptionToken(token)).toEqual({ offset: 100 });
    expect(xml).not.toContain("completeListSize");
    expect((xml.match(/<record>/g) ?? []).length).toBe(2);

    const last: OaiListPage = { records: recs, cursor: 0, nextOffset: null };
    const xmlLast = listRecordsResponse(
      { verb: "ListRecords", metadataPrefix: "oai_dc" },
      last,
      OPTS,
    );
    expect(xmlLast).not.toContain("<resumptionToken");

    // The final page of a multi-page list emits an empty (closing) token.
    const lastPaged: OaiListPage = { records: recs, cursor: 200, nextOffset: null };
    const xmlClosing = listRecordsResponse(
      { verb: "ListRecords", resumptionToken: "200" },
      lastPaged,
      OPTS,
    );
    expect(xmlClosing).toContain("<resumptionToken/>");
  });

  it("ListIdentifiers emits headers without metadata", () => {
    const page: OaiListPage = { records: [makeRecord()], cursor: 0, nextOffset: null };
    const xml = listIdentifiersResponse(
      { verb: "ListIdentifiers", metadataPrefix: "oai_dc" },
      page,
      OPTS,
    );
    expect(xml).toContain("<header>");
    expect(xml).not.toContain("<metadata>");
  });
});

// ─── Per-work records + affiliation sets ─────────────────────────────────────

const PAPER: CslItem = {
  id: "W1",
  type: "article-journal",
  title: "A test paper <with markup>",
  author: [
    { family: "Lovelace", given: "Ada" },
    { family: "Doe", given: "John" },
    { literal: "The Consortium" },
  ],
  "container-title": "Journal of Tests",
  issued: { "date-parts": [[2019, 3, 1]] },
  DOI: "10.1000/test.1",
};
const RETRACTED: CslItem = {
  id: "W2",
  type: "article-journal",
  title: "A retracted paper",
  author: [{ family: "Lovelace", given: "Ada" }],
  issued: { "date-parts": [[2020]] },
  DOI: "10.1000/test.2",
};
const PREPRINT: CslItem = {
  id: "W3",
  type: "article",
  title: "A preprint without a DOI",
  author: [{ family: "Lovelace", given: "Ada" }],
  issued: { "date-parts": [[2021]] },
};
const NOT_MINE: CslItem = { id: "W4", type: "article-journal", title: "A namesake's paper" };
const HIDDEN: CslItem = { id: "W5", type: "article-journal", title: "A hidden paper" };

function item(csl: CslItem, meta: CvItem["meta"], order: number, flags = {}): CvItem {
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

/** A hand-built CV whose Publications carry every kind of entry the page's
 *  selection rules act on: a normal paper, a retracted one, a preprint without a
 *  DOI (in its own section), a "not mine" one and a hidden one. */
function worksCv(display: Record<string, unknown> = {}, setSpec?: string): OaiRecordInput {
  const cv = {
    schemaVersion: 2,
    owner: { displayName: "Ada Lovelace", orcid: "0000-0002-7483-2489" },
    display: { locale: "en-US", cslStyle: "apa", ...display },
    sections: [
      {
        id: "publications",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items: [
          item(PAPER, { authorPosition: 1, year: 2019 }, 0),
          item(RETRACTED, { authorPosition: 1, year: 2020, retracted: true }, 1),
          item(NOT_MINE, { authorPosition: 1 }, 2, { notMine: true }),
          item(HIDDEN, { authorPosition: 1 }, 3, { included: false }),
        ],
      },
      {
        id: "preprints",
        type: "preprints",
        title: "Preprints",
        visible: true,
        order: 1,
        items: [item(PREPRINT, { authorPosition: 1, year: 2021, peerReviewed: false }, 0)],
      },
    ],
  } as unknown as CanonicalCv;
  return { slug: "ada-x7", datestamp: new Date("2026-06-09T10:00:00.000Z"), cv, setSpec };
}

describe("per-work OAI records", () => {
  it("lists exactly the works the public page lists: never retracted, not-mine or hidden", () => {
    const ids = workRecords(worksCv()).map((w) => w.itemId);
    // hideRetracted is OFF here (the page lists the retracted paper with its
    // badge) — the harvest still drops it: a harvester must never ingest a
    // retracted work as a fresh record.
    expect(ids).toEqual(["W1", "W3"]);
    expect(workRecords(worksCv({ hideRetracted: true })).map((w) => w.itemId)).toEqual([
      "W1",
      "W3",
    ]);
  });

  it("honours the page's peer-reviewed-only, per-view exclusion and publications cap", () => {
    expect(workRecords(worksCv({ peerReviewedOnly: true })).map((w) => w.itemId)).toEqual(["W1"]);
    expect(
      workRecords(worksCv({ excludedItems: { publications: ["W1"] } })).map((w) => w.itemId),
    ).toEqual(["W3"]);
    // publicationsLimit caps the Publications section only, AFTER the page's own
    // ordering: with retracted works still listed, year-desc puts the retracted
    // 2020 paper in the single slot — the page shows it (badged), the harvest
    // drops it, so no publication is harvested; the preprint section is uncapped.
    expect(
      workRecords(worksCv({ publicationOrder: "year-desc", publicationsLimit: 1 })).map(
        (w) => w.itemId,
      ),
    ).toEqual(["W3"]);
    expect(
      workRecords(
        worksCv({ publicationOrder: "year-desc", publicationsLimit: 1, hideRetracted: true }),
      ).map((w) => w.itemId),
    ).toEqual(["W1", "W3"]);
  });

  it("emits a Dublin Core record per work: DOI, title, creators, date, source, relation, rights", () => {
    const rec = worksCv({ cvLicense: "CC-BY-4.0" });
    const xml = listRecordsResponse(
      { verb: "ListRecords", metadataPrefix: "oai_dc" },
      { records: [rec], cursor: 0, nextOffset: null },
      OPTS,
    );
    // One CV record + two work records.
    expect((xml.match(/<record>/g) ?? []).length).toBe(3);
    expect(xml).toContain("<identifier>oai:sigmacv.org:ada-x7</identifier>");
    expect(xml).toContain("<identifier>oai:sigmacv.org:ada-x7/w/W1</identifier>");
    expect(xml).toContain("<identifier>oai:sigmacv.org:ada-x7/w/W3</identifier>");
    expect(xml).toContain("<dc:identifier>https://doi.org/10.1000/test.1</dc:identifier>");
    expect(xml).toContain("<dc:title>A test paper &lt;with markup&gt;</dc:title>");
    expect(xml).toContain("<dc:creator>Lovelace, Ada</dc:creator>");
    expect(xml).toContain("<dc:creator>Doe, John</dc:creator>");
    expect(xml).toContain("<dc:creator>The Consortium</dc:creator>");
    expect(xml).toContain("<dc:date>2019</dc:date>");
    expect(xml).toContain("<dc:source>Journal of Tests</dc:source>");
    expect(xml).toContain("<dc:relation>https://sigmacv.org/p/ada-x7</dc:relation>");
    expect(xml).toContain("<dc:rights>https://spdx.org/licenses/CC-BY-4.0.html</dc:rights>");
    // The retracted work is absent everywhere (identifier and title).
    expect(xml).not.toContain("/w/W2");
    expect(xml).not.toContain("A retracted paper");
    expect(xml).not.toContain("A namesake");
    expect(xml).not.toContain("A hidden paper");
    // The work records share the CV's datestamp (they change when the CV does).
    expect((xml.match(/<datestamp>2026-06-09T10:00:00Z<\/datestamp>/g) ?? []).length).toBe(3);
  });

  it("applies the owner's preferred publication name to the creator list, as on the page", () => {
    const rec = worksCv();
    const cv = { ...rec.cv, owner: { ...rec.cv.owner, publicationName: { family: "Byron" } } };
    const xml = listRecordsResponse(
      { verb: "ListRecords", metadataPrefix: "oai_dc" },
      { records: [{ ...rec, cv }], cursor: 0, nextOffset: null },
      OPTS,
    );
    expect(xml).toContain("<dc:creator>Byron, Ada</dc:creator>");
    expect(xml).not.toContain("<dc:creator>Lovelace, Ada</dc:creator>");
  });

  it("a work without a DOI gets no dc:identifier but keeps its relation to the page", () => {
    const xml = getRecordResponse(
      { verb: "GetRecord", identifier: "oai:sigmacv.org:ada-x7/w/W3", metadataPrefix: "oai_dc" },
      findWorkRecord(worksCv(), "W3")!,
      OPTS,
    );
    expect(xml).toContain("<GetRecord>");
    expect(xml).toContain("<identifier>oai:sigmacv.org:ada-x7/w/W3</identifier>");
    expect(xml).not.toContain("<dc:identifier>");
    expect(xml).toContain("<dc:relation>https://sigmacv.org/p/ada-x7</dc:relation>");
    expect(xml).not.toContain("<dc:rights>"); // no licence chosen
  });

  it("normalises creators, dates and DOIs defensively (single-part names, string dates, URLs)", () => {
    const rec = worksCv();
    const odd: CslItem = {
      id: "W9",
      type: "article-journal",
      title: "Odd metadata",
      author: [{ family: "Mononym" }, { given: "Onlygiven" }, { literal: "  " }],
      issued: { "date-parts": [["2018-05"]] },
      DOI: "https://doi.org/10.1000/odd.9",
    };
    const nodate: CslItem = {
      id: "W10",
      type: "article-journal",
      title: "No date, non-DOI identifier",
      DOI: "https://example.org/not-a-doi",
    };
    const section = rec.cv.sections[0]!;
    const cv = {
      ...rec.cv,
      sections: [
        {
          ...section,
          items: [
            item(odd, { authorPosition: 1, year: 2018 }, 0),
            item(nodate, { authorPosition: 1 }, 1),
          ],
        },
      ],
    } as CanonicalCv;
    const xml = listRecordsResponse(
      { verb: "ListRecords", metadataPrefix: "oai_dc" },
      { records: [{ ...rec, cv }], cursor: 0, nextOffset: null },
      OPTS,
    );
    expect(xml).toContain("<dc:creator>Mononym</dc:creator>");
    expect(xml).toContain("<dc:creator>Onlygiven</dc:creator>");
    // The CV record carries the owner as creator, W9 its two named authors, and
    // the blank literal is dropped: three in the whole response.
    expect((xml.match(/<dc:creator>/g) ?? []).length).toBe(3);
    expect(xml).toContain("<dc:date>2018</dc:date>");
    expect(xml).toContain("<dc:identifier>https://doi.org/10.1000/odd.9</dc:identifier>");
    // A non-DOI URL never becomes a dc:identifier; a missing date emits none.
    expect(xml).not.toContain("example.org");
    expect((xml.match(/<dc:date>/g) ?? []).length).toBe(2); // the CV record + W9 only
  });

  it("findWorkRecord resolves only a listed work (a retracted / unknown id is not a record)", () => {
    expect(findWorkRecord(worksCv(), "W1")?.itemId).toBe("W1");
    expect(findWorkRecord(worksCv(), "W2")).toBeNull();
    expect(findWorkRecord(worksCv(), "W4")).toBeNull();
    expect(findWorkRecord(worksCv(), "nope")).toBeNull();
  });

  it("ListIdentifiers lists the per-work headers too", () => {
    const xml = listIdentifiersResponse(
      { verb: "ListIdentifiers", metadataPrefix: "oai_dc" },
      { records: [worksCv()], cursor: 0, nextOffset: null },
      OPTS,
    );
    expect((xml.match(/<header>/g) ?? []).length).toBe(3);
    expect(xml).not.toContain("<metadata>");
  });
});

describe("affiliation sets", () => {
  it("ListSets names each set as a SELF-DECLARED current affiliation, never institutional output", () => {
    const xml = listSetsResponse(
      { verb: "ListSets" },
      [{ spec: "ror:04chrp450", rorId: "04chrp450", name: "Nagoya University <Med>" }],
      OPTS,
    );
    expect(xml).toContain("<ListSets>");
    expect(xml).toContain("<setSpec>ror:04chrp450</setSpec>");
    expect(xml).toContain(
      "<setName>Researchers listing Nagoya University &lt;Med&gt; as current affiliation</setName>",
    );
    expect(xml).toContain("<setDescription>");
    expect(xml).toContain("https://ror.org/04chrp450");
    expect(xml.toLowerCase()).toContain("self-declared");
    expect(xml.toLowerCase()).toContain("opted in");
    expect(xml.toLowerCase()).not.toContain("institutional output");
    expect(xml).not.toContain("<resumptionToken");
  });

  it("an opted-in CV's record AND its work records carry the setSpec; others carry none", () => {
    const inSet = worksCv({}, "ror:04chrp450");
    const xml = listRecordsResponse(
      { verb: "ListRecords", metadataPrefix: "oai_dc", set: "ror:04chrp450" },
      { records: [inSet], cursor: 0, nextOffset: null },
      OPTS,
    );
    expect((xml.match(/<setSpec>ror:04chrp450<\/setSpec>/g) ?? []).length).toBe(3);
    expect(xml).toContain('set="ror:04chrp450"'); // echoed in <request>

    const outXml = listRecordsResponse(
      { verb: "ListRecords", metadataPrefix: "oai_dc" },
      { records: [worksCv()], cursor: 0, nextOffset: null },
      OPTS,
    );
    expect(outXml).not.toContain("<setSpec>");
  });
});

// ─── oaire metadata prefix (OpenAIRE Guidelines v4) ──────────────────────────

describe("oaire metadata prefix", () => {
  it("validates `metadataPrefix=oaire` on GetRecord and the list verbs; anything else cannot be disseminated", () => {
    expect(
      validateOaiRequest({
        verb: "GetRecord",
        identifier: "oai:sigmacv.org:ada/w/W1",
        metadataPrefix: "oaire",
      }),
    ).toEqual({ kind: "getRecord", slug: "ada", itemId: "W1", metadataPrefix: "oaire" });
    expect(validateOaiRequest({ verb: "ListRecords", metadataPrefix: "oaire" })).toEqual({
      kind: "list",
      verb: "ListRecords",
      metadataPrefix: "oaire",
      offset: 0,
    });
    expect(validateOaiRequest({ verb: "ListIdentifiers", metadataPrefix: "oaire" })).toMatchObject({
      kind: "list",
      metadataPrefix: "oaire",
    });
    for (const metadataPrefix of ["OAIRE", "oaire_dc", "marcxml", "oai_openaire"]) {
      expect(validateOaiRequest({ verb: "ListRecords", metadataPrefix })).toMatchObject({
        code: "cannotDisseminateFormat",
      });
      expect(
        validateOaiRequest({ verb: "GetRecord", identifier: "oai:sigmacv.org:a", metadataPrefix }),
      ).toMatchObject({ code: "cannotDisseminateFormat" });
    }
  });

  it("a resumption token carries the format: page 2 of an oaire harvest is still oaire", () => {
    const page: OaiListPage = {
      records: [makeRecord({ slug: "a" })],
      cursor: 0,
      nextOffset: 100,
      metadataPrefix: "oaire",
      filters: { set: "04chrp450" },
    };
    const xml = listRecordsResponse(
      { verb: "ListRecords", metadataPrefix: "oaire", set: "ror:04chrp450" },
      page,
      OPTS,
    );
    const token = /<resumptionToken>([^<]+)<\/resumptionToken>/.exec(xml)![1]!;
    expect(parseResumptionToken(token)).toEqual({
      offset: 100,
      set: "04chrp450",
      metadataPrefix: "oaire",
    });
    expect(validateOaiRequest({ verb: "ListRecords", resumptionToken: token })).toEqual({
      kind: "list",
      verb: "ListRecords",
      metadataPrefix: "oaire",
      offset: 100,
      set: "04chrp450",
    });
    // An oai_dc token is byte-identical to before (no format field), and a
    // legacy / oai_dc token plans an oai_dc list.
    expect(encodeResumptionToken({ offset: 100, metadataPrefix: "oai_dc" })).toBe(
      encodeResumptionToken({ offset: 100 }),
    );
    expect(parseResumptionToken(encodeResumptionToken({ offset: 5 }))).toEqual({ offset: 5 });
    // A token naming an unknown format is rejected, never silently downgraded.
    const forged = (q: string) => Buffer.from(q, "utf8").toString("base64url");
    expect(parseResumptionToken(forged("o=1&m=marc"))).toBeNull();
    expect(parseResumptionToken(forged("o=1&m="))).toBeNull();
  });

  it("GetRecord / ListRecords / ListIdentifiers honour the format for CV-level and per-work records", () => {
    const rec = worksCv({ cvLicense: "CC-BY-4.0" }, "ror:04chrp450");
    const got = getRecordResponse(
      { verb: "GetRecord", identifier: "oai:sigmacv.org:ada-x7/w/W1", metadataPrefix: "oaire" },
      findWorkRecord(rec, "W1")!,
      OPTS,
      "oaire",
    );
    expect(got).toContain("<oaire:resource");
    expect(got).not.toContain("<oai_dc:dc");
    expect(got).toContain("<setSpec>ror:04chrp450</setSpec>"); // header unchanged

    const cvOnly = getRecordResponse(
      { verb: "GetRecord", identifier: "oai:sigmacv.org:ada-x7", metadataPrefix: "oaire" },
      rec,
      OPTS,
      "oaire",
    );
    expect(cvOnly).toContain("<oaire:resource");
    expect(cvOnly).toContain("<datacite:title>Ada Lovelace — Curriculum Vitae</datacite:title>");

    const list = listRecordsResponse(
      { verb: "ListRecords", metadataPrefix: "oaire" },
      { records: [rec], cursor: 0, nextOffset: null, metadataPrefix: "oaire" },
      OPTS,
    );
    expect((list.match(/<oaire:resource /g) ?? []).length).toBe(3); // CV + W1 + W3
    expect(list).not.toContain("<oai_dc:dc");

    // ListIdentifiers has no metadata in either format.
    const ids = listIdentifiersResponse(
      { verb: "ListIdentifiers", metadataPrefix: "oaire" },
      { records: [rec], cursor: 0, nextOffset: null, metadataPrefix: "oaire" },
      OPTS,
    );
    expect(ids).not.toContain("<metadata>");
    expect((ids.match(/<header>/g) ?? []).length).toBe(3);
  });

  it("REGRESSION: the oai_dc output is byte-identical to the single-format provider", () => {
    // Captured from the provider before `oaire` existed. A page without a
    // format, or with `oai_dc`, must reproduce it exactly.
    const rec = worksCv({ cvLicense: "CC-BY-4.0" }, "ror:04chrp450");
    const EXPECTED_WORK = `<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/ http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd">
  <responseDate>2026-06-10T12:00:00Z</responseDate>
  <request verb="GetRecord" identifier="oai:sigmacv.org:ada-x7/w/W1" metadataPrefix="oai_dc">https://sigmacv.org/api/oai</request>
  <GetRecord>
    <record>
      <header>
        <identifier>oai:sigmacv.org:ada-x7/w/W1</identifier>
        <datestamp>2026-06-09T10:00:00Z</datestamp>
        <setSpec>ror:04chrp450</setSpec>
      </header>
      <metadata>
      <oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd">
        <dc:title>A test paper &lt;with markup&gt;</dc:title>
        <dc:creator>Lovelace, Ada</dc:creator>
        <dc:creator>Doe, John</dc:creator>
        <dc:creator>The Consortium</dc:creator>
        <dc:date>2019</dc:date>
        <dc:source>Journal of Tests</dc:source>
        <dc:identifier>https://doi.org/10.1000/test.1</dc:identifier>
        <dc:relation>https://sigmacv.org/p/ada-x7</dc:relation>
        <dc:rights>https://spdx.org/licenses/CC-BY-4.0.html</dc:rights>
      </oai_dc:dc>
      </metadata>
    </record>
  </GetRecord>
</OAI-PMH>
`;
    const args = {
      verb: "GetRecord",
      identifier: "oai:sigmacv.org:ada-x7/w/W1",
      metadataPrefix: "oai_dc",
    };
    expect(getRecordResponse(args, findWorkRecord(rec, "W1")!, OPTS)).toBe(EXPECTED_WORK);
    expect(getRecordResponse(args, findWorkRecord(rec, "W1")!, OPTS, "oai_dc")).toBe(EXPECTED_WORK);

    const EXPECTED_CV = `<?xml version="1.0" encoding="UTF-8"?>
<OAI-PMH xmlns="http://www.openarchives.org/OAI/2.0/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/ http://www.openarchives.org/OAI/2.0/OAI-PMH.xsd">
  <responseDate>2026-06-10T12:00:00Z</responseDate>
  <request verb="GetRecord" identifier="oai:sigmacv.org:ada-x7" metadataPrefix="oai_dc">https://sigmacv.org/api/oai</request>
  <GetRecord>
    <record>
      <header>
        <identifier>oai:sigmacv.org:ada-x7</identifier>
        <datestamp>2026-06-09T10:00:00Z</datestamp>
        <setSpec>ror:04chrp450</setSpec>
      </header>
      <metadata>
      <oai_dc:dc xmlns:oai_dc="http://www.openarchives.org/OAI/2.0/oai_dc/" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.openarchives.org/OAI/2.0/oai_dc/ http://www.openarchives.org/OAI/2.0/oai_dc.xsd">
        <dc:title>Ada Lovelace — Curriculum Vitae</dc:title>
        <dc:creator>Ada Lovelace</dc:creator>
        <dc:description>Academic CV of Ada Lovelace, generated by SigmaCV.</dc:description>
        <dc:publisher>SigmaCV</dc:publisher>
        <dc:date>2026-06-09</dc:date>
        <dc:type>Curriculum Vitae</dc:type>
        <dc:format>text/html</dc:format>
        <dc:identifier>https://orcid.org/0000-0002-7483-2489</dc:identifier>
        <dc:identifier>https://sigmacv.org/p/ada-x7</dc:identifier>
        <dc:language>en</dc:language>
        <dc:rights>https://spdx.org/licenses/CC-BY-4.0.html</dc:rights>
      </oai_dc:dc>
      </metadata>
    </record>
  </GetRecord>
</OAI-PMH>
`;
    expect(
      getRecordResponse(
        { verb: "GetRecord", identifier: "oai:sigmacv.org:ada-x7", metadataPrefix: "oai_dc" },
        rec,
        OPTS,
      ),
    ).toBe(EXPECTED_CV);
  });
});
