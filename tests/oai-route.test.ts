import { beforeEach, describe, expect, it, vi } from "vitest";

Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
  AUTH_URL: "https://sigmacv.test",
});

const mocks = vi.hoisted(() => ({
  getPublicCvRecord: vi.fn(),
  listPublicCvRecords: vi.fn(),
  listAffiliationSets: vi.fn(),
  enforceRateLimit: vi.fn(),
  hasOaiDeletions: vi.fn(),
  listOaiDeletions: vi.fn(),
  findOaiDeletion: vi.fn(),
}));

vi.mock("@/lib/cv/sync", () => ({
  getPublicCvRecord: mocks.getPublicCvRecord,
  listPublicCvRecords: mocks.listPublicCvRecords,
  listAffiliationSets: mocks.listAffiliationSets,
}));
vi.mock("@/lib/cv/oaiDeletions", () => ({
  hasOaiDeletions: mocks.hasOaiDeletions,
  listOaiDeletions: mocks.listOaiDeletions,
  findOaiDeletion: mocks.findOaiDeletion,
}));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { GET, POST } from "@/app/api/oai/route";
import { buildCanonicalCv } from "@/lib/canonical/build";
import type { OaiRecordInput } from "@/lib/oai/oai";

const CV = buildCanonicalCv({
  id: "x",
  resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "Ada Lovelace" },
  works: [],
  now: "2026-06-02T00:00:00.000Z",
});
const RECORD: OaiRecordInput = {
  slug: "ada-x7",
  datestamp: new Date("2026-06-09T10:00:00.000Z"),
  cv: CV,
};
const get = (qs: string) => GET(new Request(`https://sigmacv.test/api/oai?${qs}`));

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  mocks.enforceRateLimit.mockResolvedValue({ ok: true });
  mocks.hasOaiDeletions.mockResolvedValue(false);
  mocks.listOaiDeletions.mockResolvedValue({ rows: [], next: null });
  mocks.findOaiDeletion.mockResolvedValue(null);
});

const FORM = "application/x-www-form-urlencoded";
function post(body: BodyInit, contentType = FORM): Request {
  return new Request("https://sigmacv.test/api/oai", {
    method: "POST",
    headers: { "content-type": contentType },
    body,
  });
}

describe("OAI-PMH route", () => {
  it("answers Identify over GET", async () => {
    const res = await GET(new Request("https://sigmacv.test/api/oai?verb=Identify"));
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("<Identify>");
  });

  it("answers Identify over a form-encoded POST (the protocol's POST binding)", async () => {
    const res = await POST(post("verb=Identify"));
    expect(res.status).toBe(200);
    expect(await res.text()).toContain("<Identify>");
  });

  it("caps the POST body independently of the edge proxy (413, before parsing)", async () => {
    // A body well past any legitimate OAI request (seven short arguments), sent
    // chunked so no content-length can be trusted. The app must refuse it itself,
    // not rely on Caddy's request_body max_size being configured.
    const huge = `verb=Identify&pad=${"x".repeat(64 * 1024)}`;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const bytes = new TextEncoder().encode(huge);
        for (let i = 0; i < bytes.length; i += 1024) controller.enqueue(bytes.slice(i, i + 1024));
        controller.close();
      },
    });
    const req = new Request("https://sigmacv.test/api/oai", {
      method: "POST",
      headers: { "content-type": FORM },
      body: stream,
      // @ts-expect-error -- undici needs duplex for a streaming request body
      duplex: "half",
    });
    const res = await POST(req);
    expect(res.status).toBe(413);
    expect(mocks.enforceRateLimit).not.toHaveBeenCalled();
  });

  it("rejects a non-form POST content type (415) instead of buffering it", async () => {
    const res = await POST(post('{"verb":"Identify"}', "application/json"));
    expect(res.status).toBe(415);
  });

  it("returns 429 with Retry-After when the per-IP limit is hit", async () => {
    mocks.enforceRateLimit.mockResolvedValue({ ok: false, retryAfterSec: 30 });
    const res = await GET(new Request("https://sigmacv.test/api/oai?verb=Identify"));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
  });
});

describe("OAI-PMH route: affiliation sets + per-work records", () => {
  it("ListSets answers from the opted-in affiliation sets", async () => {
    mocks.listAffiliationSets.mockResolvedValue([
      { spec: "ror:04chrp450", rorId: "04chrp450", name: "Nagoya University" },
    ]);
    const xml = await (await get("verb=ListSets")).text();
    expect(xml).toContain("<setSpec>ror:04chrp450</setSpec>");
    expect(xml).toContain("Nagoya University");
  });

  it("ListSets reports noSetHierarchy while nobody has opted in (no sets exist yet)", async () => {
    mocks.listAffiliationSets.mockResolvedValue([]);
    const xml = await (await get("verb=ListSets")).text();
    expect(xml).toContain('<error code="noSetHierarchy">');
  });

  it("ListRecords with set=ror:<id> passes the ROR id to the opt-in-filtered harvest", async () => {
    mocks.listPublicCvRecords.mockResolvedValue({
      records: [{ ...RECORD, setSpec: "ror:04chrp450" }],
      next: null,
    });
    const xml = await (
      await get("verb=ListRecords&metadataPrefix=oai_dc&set=ror:04chrp450")
    ).text();
    expect(mocks.listPublicCvRecords).toHaveBeenCalledWith(
      expect.objectContaining({ set: "04chrp450" }),
    );
    expect(xml).toContain("<setSpec>ror:04chrp450</setSpec>");
  });

  it("page 2 of a set-filtered harvest is still filtered by that set (the token carries it)", async () => {
    mocks.listPublicCvRecords.mockResolvedValue({
      records: [{ ...RECORD, setSpec: "ror:04chrp450" }],
      next: { after: "cv-2" },
    });
    const first = await (
      await get("verb=ListRecords&metadataPrefix=oai_dc&set=ror:04chrp450")
    ).text();
    const token = /<resumptionToken>([^<]+)<\/resumptionToken>/.exec(first)![1]!;
    mocks.listPublicCvRecords.mockClear();
    await get(`verb=ListRecords&resumptionToken=${encodeURIComponent(token)}`);
    expect(mocks.listPublicCvRecords).toHaveBeenCalledWith(
      expect.objectContaining({ set: "04chrp450", after: "cv-2" }),
    );
    // A forged token naming another set, or none, is refused — never widened.
    const forged = Buffer.from("o=1&s=zz", "utf8").toString("base64url");
    const xml = await (await get(`verb=ListRecords&resumptionToken=${forged}x!`)).text();
    expect(xml).toContain('<error code="badResumptionToken">');
  });

  it("record- and set-bearing answers are never shared-cacheable; repository verbs are", async () => {
    mocks.listPublicCvRecords.mockResolvedValue({ records: [RECORD], next: null });
    expect((await get("verb=ListRecords&metadataPrefix=oai_dc")).headers.get("cache-control")).toBe(
      "private, no-store",
    );
    expect((await get("verb=Identify")).headers.get("cache-control")).toBe("public, max-age=120");
    expect((await get("verb=ListMetadataFormats")).headers.get("cache-control")).toBe(
      "public, max-age=120",
    );
  });

  it("ListRecords without a set never asks for the opt-in filter", async () => {
    mocks.listPublicCvRecords.mockResolvedValue({ records: [RECORD], next: null });
    await get("verb=ListRecords&metadataPrefix=oai_dc");
    expect(mocks.listPublicCvRecords.mock.calls[0]![0].set).toBeUndefined();
  });

  it("a day-form until reaches the end of that day, and from/until must share a granularity", async () => {
    mocks.listPublicCvRecords.mockResolvedValue({ records: [RECORD], next: null });
    await get("verb=ListRecords&metadataPrefix=oai_dc&from=2026-06-01&until=2026-06-09");
    // RECORD is stamped 2026-06-09T10:00:00Z: an `until` of that day must select it.
    expect(mocks.listPublicCvRecords).toHaveBeenCalledWith(
      expect.objectContaining({
        from: new Date("2026-06-01T00:00:00Z"),
        until: new Date("2026-06-09T23:59:59Z"),
      }),
    );
    mocks.listPublicCvRecords.mockClear();
    const mixed = await (
      await get("verb=ListRecords&metadataPrefix=oai_dc&from=2026-06-01&until=2026-06-09T10:00:00Z")
    ).text();
    expect(mixed).toContain('<error code="badArgument">');
    expect(mocks.listPublicCvRecords).not.toHaveBeenCalled();
    // An impossible day is refused, not rolled over into the next month.
    const rolled = await (
      await get("verb=ListRecords&metadataPrefix=oai_dc&until=2026-02-30")
    ).text();
    expect(rolled).toContain('<error code="badArgument">');
  });

  it("a token issued before resumption by row id still finishes its harvest, by offset, and closes it", async () => {
    const legacy = Buffer.from("o=100&s=04chrp450", "utf8").toString("base64url");
    // A further page follows: the harvest goes on by offset, in the order it began in.
    mocks.listPublicCvRecords.mockResolvedValue({ records: [RECORD], next: { offset: 200 } });
    const middle = await (await get(`verb=ListRecords&resumptionToken=${legacy}`)).text();
    expect(mocks.listPublicCvRecords).toHaveBeenCalledWith(
      expect.objectContaining({ offset: 100, set: "04chrp450", after: undefined }),
    );
    const token = /<resumptionToken>([^<]+)<\/resumptionToken>/.exec(middle)![1]!;
    expect(Buffer.from(token, "base64url").toString("utf8")).toBe("o=200&s=04chrp450");
    // The last page of a list that paged at all ends with an empty token.
    mocks.listPublicCvRecords.mockResolvedValue({ records: [RECORD], next: null });
    const xml = await (await get(`verb=ListRecords&resumptionToken=${token}`)).text();
    expect(xml).toContain("<resumptionToken/>");
  });

  it("a resumed page that finds nothing left is badResumptionToken, a first page noRecordsMatch", async () => {
    mocks.listPublicCvRecords.mockResolvedValue({ records: [], next: null });
    const token = Buffer.from("a=cv-2", "utf8").toString("base64url");
    expect(await (await get(`verb=ListRecords&resumptionToken=${token}`)).text()).toContain(
      '<error code="badResumptionToken">',
    );
    expect(await (await get("verb=ListIdentifiers&metadataPrefix=oai_dc")).text()).toContain(
      '<error code="noRecordsMatch">',
    );
  });

  it("an unknown set is noRecordsMatch (the CV exists, but nobody opted into that set)", async () => {
    mocks.listPublicCvRecords.mockResolvedValue({ records: [], next: null });
    const xml = await (
      await get("verb=ListRecords&metadataPrefix=oai_dc&set=ror:00000000x")
    ).text();
    expect(xml).toContain('<error code="noRecordsMatch">');
  });

  it("GetRecord resolves a per-work identifier through the CV's own gate (published + indexable)", async () => {
    mocks.getPublicCvRecord.mockResolvedValue(null); // not indexable / unknown
    const missing = await (
      await get("verb=GetRecord&metadataPrefix=oai_dc&identifier=oai:sigmacv.org:ada-x7/w/W1")
    ).text();
    expect(missing).toContain('<error code="idDoesNotExist">');
    expect(mocks.getPublicCvRecord).toHaveBeenCalledWith("ada-x7");

    // Indexable CV, but the work is not one the page lists → also idDoesNotExist.
    mocks.getPublicCvRecord.mockResolvedValue(RECORD);
    const noWork = await (
      await get("verb=GetRecord&metadataPrefix=oai_dc&identifier=oai:sigmacv.org:ada-x7/w/W1")
    ).text();
    expect(noWork).toContain('<error code="idDoesNotExist">');
  });
});

describe("OAI-PMH route: oaire metadata format", () => {
  it("ListMetadataFormats lists oai_dc and oaire, also for a specific identifier", async () => {
    const xml = await (await get("verb=ListMetadataFormats")).text();
    expect(xml).toContain("<metadataPrefix>oai_dc</metadataPrefix>");
    expect(xml).toContain("<metadataPrefix>oaire</metadataPrefix>");
    const forId = await (
      await get("verb=ListMetadataFormats&identifier=oai:sigmacv.org:ada-x7/w/W1")
    ).text();
    expect(forId).toContain("<metadataPrefix>oaire</metadataPrefix>");
  });

  it("GetRecord with metadataPrefix=oaire serves the OpenAIRE record through the same consent gate", async () => {
    mocks.getPublicCvRecord.mockResolvedValue(RECORD);
    const xml = await (
      await get("verb=GetRecord&metadataPrefix=oaire&identifier=oai:sigmacv.org:ada-x7")
    ).text();
    expect(mocks.getPublicCvRecord).toHaveBeenCalledWith("ada-x7");
    expect(xml).toContain('metadataPrefix="oaire"');
    expect(xml).toContain("<oaire:resource");
    expect(xml).not.toContain("<oai_dc:dc");
    expect(xml).toContain("https://orcid.org/0000-0002-7483-2489</datacite:nameIdentifier>");

    mocks.getPublicCvRecord.mockResolvedValue(null);
    const gated = await (
      await get("verb=GetRecord&metadataPrefix=oaire&identifier=oai:sigmacv.org:ada-x7")
    ).text();
    expect(gated).toContain('<error code="idDoesNotExist">');
  });

  it("ListRecords with metadataPrefix=oaire keeps the format on page 2 via the token", async () => {
    mocks.listPublicCvRecords.mockResolvedValue({ records: [RECORD], next: { after: "cv-2" } });
    const first = await (await get("verb=ListRecords&metadataPrefix=oaire")).text();
    expect(first).toContain("<oaire:resource");
    const token = /<resumptionToken>([^<]+)<\/resumptionToken>/.exec(first)![1]!;
    const second = await (
      await get(`verb=ListRecords&resumptionToken=${encodeURIComponent(token)}`)
    ).text();
    expect(second).toContain("<oaire:resource");
    expect(second).not.toContain("<oai_dc:dc");
  });

  it("any other metadataPrefix is cannotDisseminateFormat, before any DB read", async () => {
    const xml = await (await get("verb=ListRecords&metadataPrefix=oai_openaire")).text();
    expect(xml).toContain('<error code="cannotDisseminateFormat">');
    expect(mocks.listPublicCvRecords).not.toHaveBeenCalled();
    const rec = await (
      await get("verb=GetRecord&metadataPrefix=marcxml&identifier=oai:sigmacv.org:ada-x7")
    ).text();
    expect(rec).toContain('<error code="cannotDisseminateFormat">');
    expect(mocks.getPublicCvRecord).not.toHaveBeenCalled();
  });
});

describe("OAI-PMH route: deleted records", () => {
  const GONE = new Date("2026-10-14T09:00:00.000Z");

  it("a withdrawn CV answers GetRecord as a deleted record while it lasts, then idDoesNotExist", async () => {
    mocks.getPublicCvRecord.mockResolvedValue(null);
    mocks.findOaiDeletion.mockResolvedValueOnce(GONE);
    const xml = await (
      await get("verb=GetRecord&metadataPrefix=oai_dc&identifier=oai:sigmacv.org:ada-x7")
    ).text();
    expect(mocks.findOaiDeletion).toHaveBeenCalledWith("oai:sigmacv.org:ada-x7");
    expect(xml).toContain('<header status="deleted">');
    expect(xml).toContain("<datestamp>2026-10-14T09:00:00Z</datestamp>");
    expect(xml).not.toContain("<metadata>");
    // Past its 30 days (purged), the identifier is unknown again.
    const later = await (
      await get("verb=GetRecord&metadataPrefix=oai_dc&identifier=oai:sigmacv.org:ada-x7")
    ).text();
    expect(later).toContain('<error code="idDoesNotExist">');
  });

  it("a work taken off a page that is still served answers as deleted", async () => {
    mocks.getPublicCvRecord.mockResolvedValue(RECORD); // the CV is served; W9 is not listed
    mocks.findOaiDeletion.mockResolvedValueOnce(GONE);
    const xml = await (
      await get("verb=GetRecord&metadataPrefix=oai_dc&identifier=oai:sigmacv.org:ada-x7/w/W9")
    ).text();
    expect(mocks.findOaiDeletion).toHaveBeenCalledWith("oai:sigmacv.org:ada-x7/w/W9");
    expect(xml).toContain('<header status="deleted">');
  });

  it("a delta that only has deletions lists them, rather than answering noRecordsMatch", async () => {
    mocks.listPublicCvRecords.mockResolvedValue({ records: [], next: null });
    mocks.listOaiDeletions.mockResolvedValue({
      rows: [{ identifier: "oai:sigmacv.org:ada-x7", deletedAt: GONE }],
      next: null,
    });
    const xml = await (
      await get("verb=ListIdentifiers&metadataPrefix=oai_dc&from=2026-10-14")
    ).text();
    expect(xml).toContain('<header status="deleted">');
    expect(xml).toContain("<identifier>oai:sigmacv.org:ada-x7</identifier>");
    expect(xml).not.toContain("<resumptionToken");
  });

  it("the last page of served CVs hands on to the deleted records with a token", async () => {
    mocks.listPublicCvRecords.mockResolvedValue({ records: [RECORD], next: null });
    mocks.hasOaiDeletions.mockResolvedValue(true);
    const first = await (
      await get("verb=ListRecords&metadataPrefix=oaire&set=ror:04chrp450")
    ).text();
    const token = /<resumptionToken>([^<]+)<\/resumptionToken>/.exec(first)![1]!;
    expect(Buffer.from(token, "base64url").toString("utf8")).toBe("t=&s=04chrp450&m=oaire");
    mocks.listOaiDeletions.mockResolvedValue({
      rows: [{ identifier: "oai:sigmacv.org:bo-y8", deletedAt: GONE }],
      next: null,
    });
    const second = await (await get(`verb=ListRecords&resumptionToken=${token}`)).text();
    expect(mocks.listOaiDeletions).toHaveBeenCalledWith(
      expect.objectContaining({ setSpec: "ror:04chrp450", after: "" }),
    );
    expect(second).toContain('<header status="deleted">');
    expect(second).toContain("<setSpec>ror:04chrp450</setSpec>");
    expect(second).toContain("<resumptionToken/>");
  });
});
