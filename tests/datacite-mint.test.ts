import { afterEach, describe, expect, it, vi } from "vitest";
import type { Env } from "@/lib/env";
import {
  buildDataciteDoiPayload,
  DATACITE_DOIS_URL,
  doiMintingEnabled,
  mintSnapshotDoi,
  snapshotDoiTitle,
} from "@/lib/datacite/mint";

vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

const BASE: Env = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(40),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  ORCID_ENVIRONMENT: "sandbox",
  OPENALEX_MAILTO: "ci@example.org",
  OPENALEX_CURATION_ENABLED: false,
} as Env;

const ENABLED: Env = {
  ...BASE,
  DATACITE_REPOSITORY_ID: "SIGMA.CV",
  DATACITE_PASSWORD: "hunter2",
  DATACITE_PREFIX: "10.12345",
};

const INPUT = {
  ownerName: "Basile Chrétien",
  orcid: "0000-0002-7483-2489",
  version: 3,
  year: 2026,
  url: "https://sigmacv.test/p/basile-x/v/tok",
  previousDoi: "10.12345/prev",
};

function res(body: unknown, ok = true, status = 201): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

afterEach(() => vi.unstubAllGlobals());

describe("doiMintingEnabled", () => {
  it("is false unless ALL three DATACITE_* values are set", () => {
    expect(doiMintingEnabled(BASE)).toBe(false);
    expect(doiMintingEnabled({ ...ENABLED, DATACITE_PREFIX: undefined })).toBe(false);
    expect(doiMintingEnabled({ ...ENABLED, DATACITE_PASSWORD: undefined })).toBe(false);
    expect(doiMintingEnabled({ ...ENABLED, DATACITE_REPOSITORY_ID: undefined })).toBe(false);
    expect(doiMintingEnabled(ENABLED)).toBe(true);
  });
});

describe("buildDataciteDoiPayload", () => {
  it("builds the minimal findable-DOI payload with creator ORCID and IsNewVersionOf", () => {
    expect(buildDataciteDoiPayload(INPUT, "10.12345")).toEqual({
      data: {
        type: "dois",
        attributes: {
          prefix: "10.12345",
          event: "publish",
          creators: [
            {
              name: "Basile Chrétien",
              nameType: "Personal",
              nameIdentifiers: [
                {
                  nameIdentifier: "https://orcid.org/0000-0002-7483-2489",
                  nameIdentifierScheme: "ORCID",
                  schemeUri: "https://orcid.org",
                },
              ],
            },
          ],
          titles: [{ title: "Basile Chrétien — academic CV, snapshot v3" }],
          publisher: "SigmaCV",
          publicationYear: 2026,
          types: { resourceTypeGeneral: "Text", resourceType: "Curriculum vitae" },
          url: "https://sigmacv.test/p/basile-x/v/tok",
          version: "3",
          relatedIdentifiers: [
            {
              relatedIdentifier: "10.12345/prev",
              relatedIdentifierType: "DOI",
              relationType: "IsNewVersionOf",
            },
          ],
        },
      },
    });
  });

  it("omits the ORCID identifier and relatedIdentifiers when absent, and falls back to 'Researcher'", () => {
    const p = buildDataciteDoiPayload(
      { ...INPUT, orcid: undefined, previousDoi: null, ownerName: "  " },
      "10.12345",
    ) as { data: { attributes: Record<string, unknown> } };
    const creator = (p.data.attributes.creators as Record<string, unknown>[])[0]!;
    expect(creator).toEqual({ name: "Researcher", nameType: "Personal" });
    expect(p.data.attributes.relatedIdentifiers).toBeUndefined();
    expect(snapshotDoiTitle("", 1)).toBe("Researcher — academic CV, snapshot v1");
  });
});

describe("mintSnapshotDoi", () => {
  it("is a no-op (no network call) when minting is disabled", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect(await mintSnapshotDoi(INPUT, BASE)).toEqual({ ok: false, reason: "disabled" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs to DataCite with basic auth, no retry, and returns the minted DOI", async () => {
    const fetchMock = vi.fn(async () =>
      res({ data: { id: "10.12345/ABCD", attributes: { doi: "10.12345/ABCD" } } }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const out = await mintSnapshotDoi(INPUT, ENABLED);
    expect(out).toEqual({ ok: true, doi: "10.12345/abcd" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(DATACITE_DOIS_URL);
    expect(init.method).toBe("POST");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(
      `Basic ${Buffer.from("SIGMA.CV:hunter2").toString("base64")}`,
    );
    expect(headers["Content-Type"]).toBe("application/vnd.api+json");
    expect(headers["User-Agent"]).toContain("mailto:ci@example.org");
    const body = JSON.parse(init.body as string) as { data: { attributes: { prefix: string } } };
    expect(body.data.attributes.prefix).toBe("10.12345");
  });

  it("accepts the DOI from data.id alone (defensive parse)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ data: { id: "10.12345/xyz" } })),
    );
    expect(await mintSnapshotDoi(INPUT, ENABLED)).toEqual({ ok: true, doi: "10.12345/xyz" });
  });

  it("fails soft on a non-2xx status — and does NOT retry a 5xx (mint is not idempotent)", async () => {
    const fetchMock = vi.fn(async () => res({ errors: [{ title: "boom" }] }, false, 500));
    vi.stubGlobal("fetch", fetchMock);
    expect(await mintSnapshotDoi(INPUT, ENABLED)).toEqual({ ok: false, reason: "http-500" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fails soft when the body carries no DOI or is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ data: { attributes: {} } })),
    );
    expect(await mintSnapshotDoi(INPUT, ENABLED)).toEqual({
      ok: false,
      reason: "no-doi-in-response",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res(null)),
    );
    expect(await mintSnapshotDoi(INPUT, ENABLED)).toEqual({
      ok: false,
      reason: "no-doi-in-response",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res("just a string")),
    );
    expect(await mintSnapshotDoi(INPUT, ENABLED)).toEqual({
      ok: false,
      reason: "no-doi-in-response",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => res({ data: { id: "not-a-doi" } })),
    );
    expect(await mintSnapshotDoi(INPUT, ENABLED)).toEqual({
      ok: false,
      reason: "no-doi-in-response",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          ({
            ok: true,
            status: 201,
            json: async () => {
              throw new Error("bad json");
            },
          }) as unknown as Response,
      ),
    );
    expect(await mintSnapshotDoi(INPUT, ENABLED)).toEqual({
      ok: false,
      reason: "no-doi-in-response",
    });
  });

  it("fails soft on a network error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("ECONNRESET");
      }),
    );
    expect(await mintSnapshotDoi(INPUT, ENABLED)).toEqual({ ok: false, reason: "network" });
  });
});
