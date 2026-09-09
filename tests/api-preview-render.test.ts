import { beforeEach, describe, expect, it, vi } from "vitest";

// The route pulls in @/lib/cv/sync (for the item cap), which needs the env at
// import time; the DB, the same-origin gate and the rate limiter are mocked.
Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
});

vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/app/api/cv/previewGate", () => ({
  previewCaller: vi.fn(async () => ({ ok: true, key: "ip:test" })),
}));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: vi.fn(async () => ({ ok: true })) }));

import { POST } from "@/app/api/preview/render/route";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const hasApa = listAvailableStyles().includes("apa");

/** A document a visitor could forge in devtools: real name + works, invented figures. */
function forged(): CanonicalCv {
  const b = buildCanonicalCv({
    id: "forge",
    resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "Basile Chrétien" },
    works,
    now: "2026-06-02T00:00:00.000Z",
  });
  return {
    ...b,
    owner: { ...b.owner, metrics: { h_index: 4242, i10_index: 3131 } },
    sections: b.sections.map((s) => ({
      ...s,
      items: s.items.map((it) => ({ ...it, meta: { ...it.meta, citedByCount: 7373, fwci: 9.9 } })),
    })),
    display: {
      ...b.display,
      showMetrics: true,
      metrics: ["h_index", "i10_index"],
      showCitationCounts: true,
      showWorkIndicators: true,
    },
  };
}

function post(document: unknown, surface?: string) {
  return POST(
    new Request("http://localhost/api/preview/render", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ document, surface }),
    }),
  );
}

beforeEach(() => vi.clearAllMocks());

describe.skipIf(!hasApa)("POST /api/preview/render (anonymous)", () => {
  it("re-applies the preview projection: a forged document renders no figure about the person", async () => {
    for (const surface of [undefined, "public"]) {
      const res = await post(forged(), surface);
      expect(res.status).toBe(200);
      const { html } = (await res.json()) as { html: string };
      expect(html).toContain("Chrétien");
      expect(html).not.toContain("4242");
      expect(html).not.toContain("3131");
      expect(html).not.toContain("7373");
      expect(html).not.toMatch(/h-index/i);
    }
  });

  it("still rejects an invalid document", async () => {
    const res = await post({ nope: true });
    expect(res.status).toBe(422);
  });
});
