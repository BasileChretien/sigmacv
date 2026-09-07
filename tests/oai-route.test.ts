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
}));

vi.mock("@/lib/cv/sync", () => ({
  getPublicCvRecord: mocks.getPublicCvRecord,
  listPublicCvRecords: mocks.listPublicCvRecords,
  listAffiliationSets: mocks.listAffiliationSets,
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
      total: 1,
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
      total: 250,
    });
    const first = await (
      await get("verb=ListRecords&metadataPrefix=oai_dc&set=ror:04chrp450")
    ).text();
    const token = /<resumptionToken>([^<]+)<\/resumptionToken>/.exec(first)![1]!;
    mocks.listPublicCvRecords.mockClear();
    await get(`verb=ListRecords&resumptionToken=${encodeURIComponent(token)}`);
    expect(mocks.listPublicCvRecords).toHaveBeenCalledWith(
      expect.objectContaining({ set: "04chrp450", offset: 1 }),
    );
    // A forged token naming another set, or none, is refused — never widened.
    const forged = Buffer.from("o=1&s=zz", "utf8").toString("base64url");
    const xml = await (await get(`verb=ListRecords&resumptionToken=${forged}x!`)).text();
    expect(xml).toContain('<error code="badResumptionToken">');
  });

  it("record- and set-bearing answers are never shared-cacheable; repository verbs are", async () => {
    mocks.listPublicCvRecords.mockResolvedValue({ records: [RECORD], total: 1 });
    expect((await get("verb=ListRecords&metadataPrefix=oai_dc")).headers.get("cache-control")).toBe(
      "private, no-store",
    );
    expect((await get("verb=Identify")).headers.get("cache-control")).toBe("public, max-age=120");
    expect((await get("verb=ListMetadataFormats")).headers.get("cache-control")).toBe(
      "public, max-age=120",
    );
  });

  it("ListRecords without a set never asks for the opt-in filter", async () => {
    mocks.listPublicCvRecords.mockResolvedValue({ records: [RECORD], total: 1 });
    await get("verb=ListRecords&metadataPrefix=oai_dc");
    expect(mocks.listPublicCvRecords.mock.calls[0]![0].set).toBeUndefined();
  });

  it("an unknown set is noRecordsMatch (the CV exists, but nobody opted into that set)", async () => {
    mocks.listPublicCvRecords.mockResolvedValue({ records: [], total: 0 });
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
