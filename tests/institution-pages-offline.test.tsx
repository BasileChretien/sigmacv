import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * Runtime proof of the "Live proxying" veto: rendering every institution route
 * with the network torn out. `fetch` throws on any call and `@/lib/http` (the
 * one module every external client fetches through) throws the moment it is
 * imported — so if any code path under these four routes reached OpenAlex,
 * ROR or any other service, the module graph would fail to load or the render
 * would throw. The source-level grep in `institutions-no-openalex.test.ts`
 * cannot see a transitive import; this can.
 */

Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
  AUTH_URL: "https://sigmacv.test",
});

const mocks = vi.hoisted(() => ({
  count: vi.fn(),
  groupBy: vi.fn(),
  institutionFindUnique: vi.fn(),
  institutionFindMany: vi.fn(),
  fetch: vi.fn(() => {
    throw new Error("network");
  }),
}));

vi.stubGlobal("fetch", mocks.fetch);
vi.mock("@/lib/http", () => {
  throw new Error("@/lib/http imported by an institution route");
});
vi.mock("@/lib/db", () => ({
  prisma: {
    cv: { count: mocks.count, groupBy: mocks.groupBy },
    institution: { findUnique: mocks.institutionFindUnique, findMany: mocks.institutionFindMany },
  },
}));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: async () => ({ ok: true }) }));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.9" }),
}));
vi.mock("@/components/SiteHeader", () => ({ default: () => null }));
vi.mock("@/components/SiteFooter", () => ({ default: () => null }));

import IndexPage, { generateMetadata as indexMetadata } from "@/app/i/page";
import RorPage, { generateMetadata as rorMetadata } from "@/app/i/[ror]/page";
import LocaleIndexPage, { generateMetadata as localeIndexMetadata } from "@/app/[locale]/i/page";
import LocaleRorPage, { generateMetadata as localeRorMetadata } from "@/app/[locale]/i/[ror]/page";

const ROR = "04chrp450";
const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });

beforeEach(() => {
  mocks.count.mockResolvedValue(3);
  mocks.groupBy.mockResolvedValue([{ currentRorId: ROR, _count: { _all: 3 } }]);
  mocks.institutionFindUnique.mockResolvedValue({ name: "Nagoya University" });
  mocks.institutionFindMany.mockResolvedValue([{ rorId: ROR, name: "Nagoya University" }]);
});
afterAll(() => vi.unstubAllGlobals());

describe("institution routes render with no network at all", () => {
  it("all four routes and their metadata render from the database alone; fetch is never called", async () => {
    const pages = [
      renderToStaticMarkup(await IndexPage()),
      renderToStaticMarkup(await RorPage(params({ ror: ROR }))),
      renderToStaticMarkup(await LocaleIndexPage(params({ locale: "fr" }))),
      renderToStaticMarkup(await LocaleRorPage(params({ locale: "ja", ror: ROR }))),
    ];
    for (const html of pages) expect(html).toContain("Nagoya University");
    const metas = await Promise.all([
      indexMetadata(),
      rorMetadata(params({ ror: ROR })),
      localeIndexMetadata(params({ locale: "fr" })),
      localeRorMetadata(params({ locale: "ja", ror: ROR })),
    ]);
    expect(metas[1]!.title).toBe("Nagoya University");
    expect(metas[3]!.title).toBe("Nagoya University");
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
