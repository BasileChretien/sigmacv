import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import type { CanonicalCv } from "@/lib/canonical/schema";
import {
  dcMetadata,
  getRecordResponse,
  identifyResponse,
  listIdentifiersResponse,
  listMetadataFormatsResponse,
  listRecordsResponse,
  oaiDatestamp,
  oaiError,
  oaiIdentifier,
  slugFromOaiIdentifier,
  validateOaiRequest,
  type OaiListPage,
  type OaiRecordInput,
} from "@/lib/oai/oai";

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
    expect(slugFromOaiIdentifier("oai:sigmacv.org:ada-x7")).toBe("ada-x7");
    expect(slugFromOaiIdentifier("oai:other.org:x")).toBeNull();
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

  it("reports noSetHierarchy for ListSets and for a set argument", () => {
    expect(validateOaiRequest({ verb: "ListSets" })).toMatchObject({ code: "noSetHierarchy" });
    expect(validateOaiRequest({ verb: "ListSets", metadataPrefix: "oai_dc" })).toMatchObject({
      code: "badArgument",
    });
    expect(
      validateOaiRequest({ verb: "ListRecords", metadataPrefix: "oai_dc", set: "phys" }),
    ).toMatchObject({ code: "noSetHierarchy" });
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
    ).toEqual({ kind: "getRecord", slug: "ada" });
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

  it("ListMetadataFormats advertises oai_dc", () => {
    const xml = listMetadataFormatsResponse({ verb: "ListMetadataFormats" }, OPTS);
    expect(xml).toContain("<metadataPrefix>oai_dc</metadataPrefix>");
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

  it("ListRecords includes a resumptionToken only when more pages remain", () => {
    const recs = [makeRecord({ slug: "a" }), makeRecord({ slug: "b" })];
    const more: OaiListPage = { records: recs, total: 250, cursor: 0, nextOffset: 100 };
    const xml = listRecordsResponse({ verb: "ListRecords", metadataPrefix: "oai_dc" }, more, OPTS);
    expect(xml).toContain(
      '<resumptionToken completeListSize="250" cursor="0">100</resumptionToken>',
    );
    expect((xml.match(/<record>/g) ?? []).length).toBe(2);

    const last: OaiListPage = { records: recs, total: 2, cursor: 0, nextOffset: null };
    const xmlLast = listRecordsResponse(
      { verb: "ListRecords", metadataPrefix: "oai_dc" },
      last,
      OPTS,
    );
    expect(xmlLast).not.toContain("<resumptionToken");

    // The final page of a multi-page list emits an empty (closing) token.
    const lastPaged: OaiListPage = { records: recs, total: 202, cursor: 200, nextOffset: null };
    const xmlClosing = listRecordsResponse(
      { verb: "ListRecords", resumptionToken: "200" },
      lastPaged,
      OPTS,
    );
    expect(xmlClosing).toContain('<resumptionToken completeListSize="202" cursor="200"/>');
  });

  it("ListIdentifiers emits headers without metadata", () => {
    const page: OaiListPage = { records: [makeRecord()], total: 1, cursor: 0, nextOffset: null };
    const xml = listIdentifiersResponse(
      { verb: "ListIdentifiers", metadataPrefix: "oai_dc" },
      page,
      OPTS,
    );
    expect(xml).toContain("<header>");
    expect(xml).not.toContain("<metadata>");
  });
});
