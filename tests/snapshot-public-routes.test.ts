import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { addManualEntry, updateDisplay } from "@/lib/canonical/curate";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
  AUTH_URL: "https://sigmacv.test",
});

const mocks = vi.hoisted(() => ({
  getPublicSnapshot: vi.fn(),
  enforceRateLimit: vi.fn(),
}));

vi.mock("@/lib/cv/snapshotStore", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/cv/snapshotStore")>()),
  getPublicSnapshot: mocks.getPublicSnapshot,
}));
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { GET as pageGet } from "@/app/p/[slug]/v/[token]/route";
import { GET as diffGet } from "@/app/p/[slug]/v/[token]/diff/route";

const works = worksFixture as unknown as OpenAlexWork[];
const cv = updateDisplay(
  buildCanonicalCv({
    id: "pub",
    resolved: {
      orcid: "0000-0002-7483-2489",
      authorIds: ["A5001069481"],
      displayName: "Basile Chrétien",
    },
    works,
    now: "2026-06-02T00:00:00.000Z",
  }),
  { locale: "fr-FR" },
);
const live = addManualEntry(cv, "grants", "ERC grant", "g:1");

const SLUG = "basile-x";
const TOKEN = "abcdefghijklmnopqrstuvwx";
const SNAP = {
  cv,
  live,
  version: 2,
  label: "Tenure",
  createdAt: "2026-09-04T10:00:00.000Z",
  doi: "10.12345/abcd.2",
};

const params = (slug: string, token: string) => ({ params: Promise.resolve({ slug, token }) });
const req = (path: string, headers: Record<string, string> = {}) =>
  new Request(`https://sigmacv.test${path}`, { headers });

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  mocks.enforceRateLimit.mockResolvedValue({ ok: true });
  mocks.getPublicSnapshot.mockResolvedValue(SNAP);
});

describe("GET /p/[slug]/v/[token] (frozen version page)", () => {
  it("serves the frozen CV through the public renderer with the banner, canonical, noindex + Signposting", async () => {
    const res = await pageGet(req(`/p/${SLUG}/v/${TOKEN}`), params(SLUG, TOKEN));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(res.headers.get("cache-control")).toBe("private, no-store");
    expect(res.headers.get("content-security-policy")).toContain("default-src 'none'");
    const link = res.headers.get("link")!;
    expect(link).toContain('<https://doi.org/10.12345/abcd.2>; rel="cite-as"');
    expect(link).toContain(`/p/${SLUG}/v/${TOKEN}.json>; rel="describedby"`);
    const html = await res.text();
    expect(html).toContain("Basile Chrétien");
    expect(html).toContain('class="snapshot-banner"');
    expect(html).toContain("Version figée 2");
    expect(html).toMatch(/<link rel="canonical" href="https:\/\/[^"]+\/p\/basile-x" \/>/);
    expect(html).toContain('<meta name="robots" content="noindex" />');
    expect(html).toContain('href="https://doi.org/10.12345/abcd.2"');
    // JSON-LD carries the version + DOI identifier.
    const ld = /<script type="application\/ld\+json">(.*?)<\/script>/s.exec(html)![1]!;
    const parsed = JSON.parse(ld) as Record<string, unknown>;
    expect(parsed.version).toBe("2");
    expect(parsed.identifier).toBe("https://doi.org/10.12345/abcd.2");
    expect(parsed.dateCreated).toBe("2026-09-04T10:00:00.000Z");
    expect(String(parsed.url)).toContain(`/p/${SLUG}/v/${TOKEN}`);
    expect(mocks.getPublicSnapshot).toHaveBeenCalledWith(SLUG, TOKEN);
  });

  it("content-negotiates the machine formats by suffix and by Accept", async () => {
    let res = await pageGet(req(`/p/${SLUG}/v/${TOKEN}.json`), params(SLUG, `${TOKEN}.json`));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(res.headers.get("content-disposition")).toContain(`${SLUG}-v2.json`);
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    const body = (await res.json()) as { owner: { displayName: string }; notes?: string };
    expect(body.owner.displayName).toBe("Basile Chrétien");
    expect(mocks.getPublicSnapshot).toHaveBeenLastCalledWith(SLUG, TOKEN);

    res = await pageGet(req(`/p/${SLUG}/v/${TOKEN}.jsonld`), params(SLUG, `${TOKEN}.jsonld`));
    expect(res.headers.get("content-type")).toContain("application/ld+json");
    const ld = (await res.json()) as { version: string; identifier: string };
    expect(ld.version).toBe("2");
    expect(ld.identifier).toBe("https://doi.org/10.12345/abcd.2");

    res = await pageGet(
      req(`/p/${SLUG}/v/${TOKEN}`, { accept: "application/x-bibtex" }),
      params(SLUG, TOKEN),
    );
    expect(res.headers.get("content-type")).toContain("application/x-bibtex");
    expect(await res.text()).toContain("@");

    res = await pageGet(req(`/p/${SLUG}/v/${TOKEN}.csl.json`), params(SLUG, `${TOKEN}.csl.json`));
    expect(res.headers.get("content-type")).toContain("csl+json");
  });

  it("404s for a bad slug/token shape without touching the store, and for a private/unknown snapshot", async () => {
    expect((await pageGet(req("/p/Bad_Slug/v/x"), params("Bad Slug", TOKEN))).status).toBe(404);
    expect((await pageGet(req(`/p/${SLUG}/v/short`), params(SLUG, "short"))).status).toBe(404);
    expect(mocks.getPublicSnapshot).not.toHaveBeenCalled();
    mocks.getPublicSnapshot.mockResolvedValue(null);
    const res = await pageGet(req(`/p/${SLUG}/v/${TOKEN}`), params(SLUG, TOKEN));
    expect(res.status).toBe(404);
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("omits cite-as and the DOI link when nothing is minted", async () => {
    mocks.getPublicSnapshot.mockResolvedValue({ ...SNAP, doi: null });
    const res = await pageGet(req(`/p/${SLUG}/v/${TOKEN}`), params(SLUG, TOKEN));
    expect(res.headers.get("link")).not.toContain("cite-as");
    // The works' own DOI links stay; only the snapshot DOI (banner + JSON-LD) is absent.
    const html = await res.text();
    expect(html).not.toContain("10.12345/abcd.2");
    expect(html).not.toContain('"identifier":"https://doi.org/10.12345');
  });

  it("429s when the shared public-page limit trips", async () => {
    mocks.enforceRateLimit.mockResolvedValue({ ok: false, retryAfterSec: 7 });
    const res = await pageGet(req(`/p/${SLUG}/v/${TOKEN}`), params(SLUG, TOKEN));
    expect(res.status).toBe(429);
    expect(res.headers.get("retry-after")).toBe("7");
  });
});

describe("GET /p/[slug]/v/[token]/diff (public what-changed)", () => {
  it("renders the diff between the frozen version and the live CV, localized to the CV", async () => {
    const res = await diffGet(req(`/p/${SLUG}/v/${TOKEN}/diff`), params(SLUG, TOKEN));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
    expect(res.headers.get("x-frame-options")).toBe("DENY");
    const html = await res.text();
    expect(html).toContain("Changements depuis la version 2");
    expect(html).toContain("ERC grant");
    expect(html).toMatch(/href="https:\/\/[^"]+\/p\/basile-x\/v\/abcdefghijklmnopqrstuvwx"/);
  });

  it("serves Markdown via ?format=markdown or an Accept that prefers it", async () => {
    let res = await diffGet(req(`/p/${SLUG}/v/${TOKEN}/diff?format=markdown`), params(SLUG, TOKEN));
    expect(res.headers.get("content-type")).toContain("text/markdown");
    expect(await res.text()).toContain("- ERC grant");
    res = await diffGet(
      req(`/p/${SLUG}/v/${TOKEN}/diff`, { accept: "text/markdown" }),
      params(SLUG, TOKEN),
    );
    expect(res.headers.get("content-type")).toContain("text/markdown");
    // A browser Accept that lists both keeps HTML.
    res = await diffGet(
      req(`/p/${SLUG}/v/${TOKEN}/diff`, { accept: "text/html, text/markdown" }),
      params(SLUG, TOKEN),
    );
    expect(res.headers.get("content-type")).toContain("text/html");
  });

  it("404s on a bad shape or a non-public snapshot, 429s on the limit", async () => {
    expect((await diffGet(req(`/p/${SLUG}/v/nope/diff`), params(SLUG, "nope"))).status).toBe(404);
    expect(mocks.getPublicSnapshot).not.toHaveBeenCalled();
    mocks.getPublicSnapshot.mockResolvedValue(null);
    expect((await diffGet(req(`/p/${SLUG}/v/${TOKEN}/diff`), params(SLUG, TOKEN))).status).toBe(
      404,
    );
    mocks.enforceRateLimit.mockResolvedValue({ ok: false, retryAfterSec: 3 });
    expect((await diffGet(req(`/p/${SLUG}/v/${TOKEN}/diff`), params(SLUG, TOKEN))).status).toBe(
      429,
    );
  });
});
