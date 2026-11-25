import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// The render route pulls in @/lib/cv/sync (for the item cap), which needs the
// env at import time; the DB, the same-origin gate and the limiter are mocked.
Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
});

const mocks = vi.hoisted(() => ({
  rateLimit: vi.fn(async (): Promise<{ ok: boolean; retryAfterSec?: number }> => ({ ok: true })),
}));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.9" }),
}));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: mocks.rateLimit }));
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/app/api/cv/previewGate", () => ({
  previewCaller: vi.fn(async () => ({ ok: true, key: "ip:203.0.113.9" })),
}));

import { __resetEnvForTests } from "@/lib/env";
import { enforcePreviewRateLimit } from "@/app/preview/[orcid]/previewRateLimit";
import { enforceSearchRateLimit } from "@/app/search/searchRateLimit";
import { POST as renderPost } from "@/app/api/preview/render/route";
import { POST as galleryPost } from "@/app/api/cv/preview/gallery/route";
import { POST as stylesPost } from "@/app/api/cv/preview/styles/route";

/**
 * Every bucket a no-login visitor spends during a workshop's hands-on part reads
 * its ceiling from `getRateLimitEnv()`, never a constant: the ORCID or name
 * search, the preview build, the editor's re-renders and the style thumbnails.
 * The windows themselves never change.
 */
const HOUR = 60 * 60_000;
const MINUTE = 60_000;
const OVERRIDES: Record<string, string> = {
  PREVIEW_MAX_PER_IP: "1000",
  PREVIEW_MAX_GLOBAL: "2000",
  PREVIEW_RENDER_MAX_PER_IP: "10000",
  PREVIEW_RENDER_MAX_GLOBAL: "20000",
  PREVIEW_THUMBNAILS_MAX_PER_IP: "900",
  SEARCH_MAX_PER_IP: "300",
  SEARCH_MAX_GLOBAL_PER_MINUTE: "600",
  SEARCH_MAX_GLOBAL_PER_HOUR: "6000",
};
const ORIGINAL = { ...process.env };

function calls(): unknown[][] {
  return mocks.rateLimit.mock.calls as unknown as unknown[][];
}

/** A request whose body is not JSON: the route spends its buckets, then 400s. */
function badBody(path: string): Request {
  return new Request(`http://localhost${path}`, { method: "POST", body: "not json" });
}

beforeEach(() => {
  mocks.rateLimit.mockClear();
  mocks.rateLimit.mockResolvedValue({ ok: true });
  for (const k of Object.keys(OVERRIDES)) delete process.env[k];
  __resetEnvForTests();
});
afterEach(() => {
  process.env = { ...ORIGINAL };
  __resetEnvForTests();
});

describe("with no override set (today's limits)", () => {
  it("preview build: 30 per IP and 600 site-wide, per hour", async () => {
    expect(await enforcePreviewRateLimit()).toEqual({ ok: true });
    expect(calls()).toEqual([
      ["preview:203.0.113.9", 30, HOUR],
      ["preview:global", 600, HOUR],
    ]);
  });

  it("name search: 20 per IP a minute, 300 a minute and 3,000 an hour site-wide", async () => {
    expect(await enforceSearchRateLimit()).toEqual({ ok: true });
    expect(calls()).toEqual([
      ["search:203.0.113.9", 20, MINUTE],
      ["search:global:minute", 300, MINUTE],
      ["search:global:hour", 3_000, HOUR],
    ]);
  });

  it("preview re-render: 240 per IP and 6,000 site-wide, per hour", async () => {
    expect((await renderPost(badBody("/api/preview/render"))).status).toBe(400);
    expect(calls()).toEqual([
      ["preview-render:ip:203.0.113.9", 240, HOUR],
      ["preview-render:global", 6_000, HOUR],
    ]);
  });

  it("style thumbnails: 30 per caller an hour, for each of the two pickers", async () => {
    expect((await galleryPost(badBody("/api/cv/preview/gallery"))).status).toBe(400);
    expect((await stylesPost(badBody("/api/cv/preview/styles"))).status).toBe(400);
    expect(calls()).toEqual([
      ["preview-gallery:ip:203.0.113.9", 30, HOUR],
      ["preview-styles:ip:203.0.113.9", 30, HOUR],
    ]);
  });
});

describe("with the event overrides set", () => {
  beforeEach(() => {
    Object.assign(process.env, OVERRIDES);
    __resetEnvForTests();
  });

  it("preview build uses PREVIEW_MAX_PER_IP and PREVIEW_MAX_GLOBAL", async () => {
    await enforcePreviewRateLimit();
    expect(calls()).toEqual([
      ["preview:203.0.113.9", 1000, HOUR],
      ["preview:global", 2000, HOUR],
    ]);
  });

  it("name search uses the three SEARCH_MAX_* values", async () => {
    await enforceSearchRateLimit();
    expect(calls()).toEqual([
      ["search:203.0.113.9", 300, MINUTE],
      ["search:global:minute", 600, MINUTE],
      ["search:global:hour", 6000, HOUR],
    ]);
  });

  it("preview re-render uses the two PREVIEW_RENDER_MAX_* values", async () => {
    await renderPost(badBody("/api/preview/render"));
    expect(calls()).toEqual([
      ["preview-render:ip:203.0.113.9", 10000, HOUR],
      ["preview-render:global", 20000, HOUR],
    ]);
  });

  it("both thumbnail pickers use PREVIEW_THUMBNAILS_MAX_PER_IP", async () => {
    await galleryPost(badBody("/api/cv/preview/gallery"));
    await stylesPost(badBody("/api/cv/preview/styles"));
    expect(calls()).toEqual([
      ["preview-gallery:ip:203.0.113.9", 900, HOUR],
      ["preview-styles:ip:203.0.113.9", 900, HOUR],
    ]);
  });
});

describe("the limiter still refuses once a raised bucket is spent", () => {
  it("returns the per-IP retry-after without touching the global bucket", async () => {
    Object.assign(process.env, OVERRIDES);
    __resetEnvForTests();
    mocks.rateLimit.mockResolvedValueOnce({ ok: false, retryAfterSec: 42 });
    expect(await enforcePreviewRateLimit()).toEqual({ ok: false, retryAfterSec: 42 });
    expect(calls()).toHaveLength(1);
  });
});
