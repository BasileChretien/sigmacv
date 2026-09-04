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
  enforceRateLimit: vi.fn(),
}));

vi.mock("@/lib/cv/sync", () => ({
  getPublicCvRecord: mocks.getPublicCvRecord,
  listPublicCvRecords: mocks.listPublicCvRecords,
}));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { GET, POST } from "@/app/api/oai/route";

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
