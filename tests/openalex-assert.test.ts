import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PendingNotMineAssertion } from "@/lib/canonical/assertions";
import {
  buildCurationPayload,
  isOpenAlexCurationEnabled,
} from "@/lib/openalex/assert";

const ORIGINAL = { ...process.env };

/**
 * Import `submitCurationAssertions` from a FRESH module graph so the lazily
 * cached `getEnv()` result reflects the env set in this test (the env module
 * caches its first parse, so we must reset between cases that vary env).
 */
async function freshSubmit() {
  vi.resetModules();
  return (await import("@/lib/openalex/assert")).submitCurationAssertions;
}

function assertion(
  over: Partial<PendingNotMineAssertion> = {},
): PendingNotMineAssertion {
  return {
    itemId: "item-1",
    openAlexWorkId: "https://openalex.org/W1",
    authorIds: ["https://openalex.org/A1"],
    assertedAt: "2026-06-01T00:00:00.000Z",
    ...over,
  };
}

afterEach(() => {
  process.env = { ...ORIGINAL };
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("buildCurationPayload (PURE)", () => {
  it("maps pending assertions into the provisional curation body", () => {
    const payload = buildCurationPayload([assertion()]);
    expect(payload).toEqual({
      source: "sigmacv",
      assertionType: "author_disambiguation",
      assertions: [
        {
          work: "https://openalex.org/W1",
          claim: "not_authored_by",
          authorIds: ["https://openalex.org/A1"],
          assertedAt: "2026-06-01T00:00:00.000Z",
        },
      ],
    });
  });

  it("omits assertedAt when not present", () => {
    const payload = buildCurationPayload([assertion({ assertedAt: undefined })]);
    expect(payload.assertions[0]).not.toHaveProperty("assertedAt");
  });

  it("drops an assertion with no work id (never push an anchorless claim)", () => {
    const payload = buildCurationPayload([assertion({ openAlexWorkId: "" })]);
    expect(payload.assertions).toHaveLength(0);
  });

  it("drops an assertion with no author ids (never push by name)", () => {
    const payload = buildCurationPayload([assertion({ authorIds: [] })]);
    expect(payload.assertions).toHaveLength(0);
  });

  it("filters out falsy author ids", () => {
    const payload = buildCurationPayload([
      assertion({ authorIds: ["", "https://openalex.org/A2"] }),
    ]);
    expect(payload.assertions[0]!.authorIds).toEqual(["https://openalex.org/A2"]);
  });

  it("returns an empty assertions array for no input", () => {
    expect(buildCurationPayload([]).assertions).toEqual([]);
  });
});

describe("isOpenAlexCurationEnabled", () => {
  it("is false by default (unset)", () => {
    delete process.env.OPENALEX_CURATION_ENABLED;
    expect(isOpenAlexCurationEnabled()).toBe(false);
  });

  it("is false for any value other than exactly 'true'", () => {
    process.env.OPENALEX_CURATION_ENABLED = "TRUE";
    expect(isOpenAlexCurationEnabled()).toBe(false);
    process.env.OPENALEX_CURATION_ENABLED = "1";
    expect(isOpenAlexCurationEnabled()).toBe(false);
  });

  it("is true only for 'true'", () => {
    process.env.OPENALEX_CURATION_ENABLED = "true";
    expect(isOpenAlexCurationEnabled()).toBe(true);
  });
});

describe("submitCurationAssertions — DEFAULT DISABLED makes NO network call", () => {
  it("returns { status: 'disabled' } and never calls fetch when the flag is unset", async () => {
    delete process.env.OPENALEX_CURATION_ENABLED;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const fetchImpl = vi.fn();

    const submitCurationAssertions = await freshSubmit();
    const result = await submitCurationAssertions([assertion()], { fetchImpl });

    expect(result).toEqual({ status: "disabled" });
    // Prove the disabled path is network-silent: neither the global fetch nor
    // the injected fetch impl is touched.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

describe("submitCurationAssertions — enabled", () => {
  beforeEach(() => {
    process.env.OPENALEX_CURATION_ENABLED = "true";
    process.env.OPENALEX_CURATION_ENDPOINT = "https://example.org/curation";
    process.env.OPENALEX_MAILTO = "hello@example.org";
    // Satisfy the rest of the validated env boundary (getEnv()).
    process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/db";
    process.env.AUTH_SECRET = "x".repeat(40);
    process.env.ORCID_CLIENT_ID = "APP-1";
    process.env.ORCID_CLIENT_SECRET = "secret";
    (process.env as Record<string, string | undefined>).NODE_ENV = "test";
  });

  it("noop (no fetch) when there is nothing to submit", async () => {
    const fetchImpl = vi.fn();
    const submitCurationAssertions = await freshSubmit();
    const result = await submitCurationAssertions([], { fetchImpl });
    expect(result).toEqual({ status: "noop", submitted: 0 });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("POSTs the provisional payload with polite-pool UA and returns ok", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    const submitCurationAssertions = await freshSubmit();
    const result = await submitCurationAssertions([assertion()], { fetchImpl });

    expect(result).toEqual({ status: "ok", submitted: 1, httpStatus: 200 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("https://example.org/curation");
    expect(opts.method).toBe("POST");
    expect(opts.headers["User-Agent"]).toContain("mailto:hello@example.org");
    const body = JSON.parse(opts.body);
    expect(body.source).toBe("sigmacv");
    expect(body.assertions).toHaveLength(1);
  });

  it("fails closed when enabled but no endpoint is configured (no fetch)", async () => {
    delete process.env.OPENALEX_CURATION_ENDPOINT;
    const fetchImpl = vi.fn();
    const submitCurationAssertions = await freshSubmit();
    const result = await submitCurationAssertions([assertion()], { fetchImpl });
    expect(result).toEqual({
      status: "error",
      submitted: 1,
      reason: "endpoint_unconfigured",
    });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns an error (never throws) on a non-OK HTTP response", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchImpl = vi.fn().mockResolvedValue(new Response("{}", { status: 500 }));
    const submitCurationAssertions = await freshSubmit();
    const result = await submitCurationAssertions([assertion()], { fetchImpl });
    expect(result).toEqual({
      status: "error",
      submitted: 1,
      reason: "http_error",
      httpStatus: 500,
    });
  });

  it("returns an error (never throws) on a network failure", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchImpl = vi.fn().mockRejectedValue(new Error("ECONNRESET"));
    const submitCurationAssertions = await freshSubmit();
    const result = await submitCurationAssertions([assertion()], { fetchImpl });
    expect(result).toEqual({
      status: "error",
      submitted: 1,
      reason: "network_error",
    });
  });

  it("uses the shared resilientFetch wrapper by default (global fetch)", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const submitCurationAssertions = await freshSubmit();
    // No fetchImpl → exercises the `?? resilientFetch` default, which calls
    // the global fetch.
    const result = await submitCurationAssertions([assertion()]);
    expect(result).toEqual({ status: "ok", submitted: 1, httpStatus: 200 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns an error when the env boundary is invalid (e.g. bad mailto)", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.OPENALEX_MAILTO = "not-an-email";
    const fetchImpl = vi.fn();
    const submitCurationAssertions = await freshSubmit();
    const result = await submitCurationAssertions([assertion()], { fetchImpl });
    expect(result).toEqual({ status: "error", submitted: 1, reason: "env_invalid" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
