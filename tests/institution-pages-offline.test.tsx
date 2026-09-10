import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * Runtime proof of the "Live proxying" veto: rendering every institution route
 * with the network torn out. `fetch` throws on any call and `@/lib/http` (the
 * one module every external client fetches through) throws the moment it is
 * imported — so if any code path under these four routes reached OpenAlex,
 * ROR or any other service, the module graph would fail to load or the render
 * would throw. The source-level grep in `institutions-no-openalex.test.ts`
 * cannot see a transitive import; this can. The two reconciliation-export
 * route handlers are rendered the same way: their rows come from the stored
 * frozen version the reader selects, never from a fetch.
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
  findMany: vi.fn(),
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
    cv: { count: mocks.count, findMany: mocks.findMany, groupBy: mocks.groupBy },
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

import { buildCanonicalCv } from "@/lib/canonical/build";
import IndexPage, { generateMetadata as indexMetadata } from "@/app/i/page";
import RorPage, { generateMetadata as rorMetadata } from "@/app/i/[ror]/page";
import LocaleIndexPage, { generateMetadata as localeIndexMetadata } from "@/app/[locale]/i/page";
import LocaleRorPage, { generateMetadata as localeRorMetadata } from "@/app/[locale]/i/[ror]/page";
import ComparePage, { generateMetadata as compareMetadata } from "@/app/i/compare/page";
import LocaleComparePage, {
  generateMetadata as localeCompareMetadata,
} from "@/app/[locale]/i/compare/page";
import { GET as csvGet } from "@/app/i/[ror]/reconciliation.csv/route";
import { GET as jsonGet } from "@/app/i/[ror]/reconciliation.json/route";
import { GET as compareJsonGet } from "@/app/i/compare.json/route";
import {
  RECONCILIATION_COLUMNS,
  storedReconciliationRows,
} from "@/lib/institutions/reconciliationRows";

const ROR = "04chrp450";
const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });

/** A stored OpenAlex snapshot, so the rendered-section branch (tables, links,
 *  `sameAs`) is exercised with the network torn out, not only the "not fetched"
 *  paragraph. */
const FETCHED = new Date("2026-09-09T10:00:00Z");
const AGGREGATES = {
  version: 1,
  countedEntity: {
    openalexId: "I60134161",
    displayName: "Nagoya University",
    lineageSize: 1,
    relatedCount: 2,
    foldedIds: ["I60134161", "I4210121234"],
    fetchedAt: FETCHED.toISOString(),
  },
  countedWorkTypes: ["article", "review", "book-chapter", "preprint"],
  years: { from: 2025, to: 2026 },
  worksByYear: [
    { year: 2025, count: 4321 },
    { year: 2026, count: 1200 },
  ],
  oaByStatusByYear: [
    { year: 2025, status: "gold", count: 2000 },
    { year: 2025, status: "closed", count: 2300 },
    { year: 2026, status: "gold", count: 700 },
  ],
  topCountries: [{ code: "JP", name: "Japan", count: 4000 }],
  topCoAffiliations: [
    { openalexId: "I4210121234", name: "Nagoya University Hospital", count: 900 },
  ],
};

/** Five consented, active CVs with a stored aggregate, so the opted-in figures
 *  section renders its tables (not only the below-k sentence) from rows alone. */
const CONSENTED_DOC = buildCanonicalCv({
  id: "cv_c",
  resolved: { orcid: "0000-0002-7483-2489", authorIds: [], displayName: "A Researcher" },
  works: [],
  employments: [{ putCode: "cur", organization: "Nagoya University", startYear: 2024, rorId: ROR }],
  now: "2026-09-08T00:00:00.000Z",
});
const CONSENTED_ROWS = Array.from({ length: 5 }, () => ({
  consentedRorIds: [ROR],
  showOnInstitutionPage: true,
  published: true,
  publicIndexable: true,
  visibleCurrentRorIds: [ROR],
  document: CONSENTED_DOC,
  institutionAggregates: {
    v: 1,
    worksTotal: 2,
    byYear: {
      "2025": {
        total: 2,
        oa: { "open-cc": 2, "open-other": 0, "no-open-copy-found": 0, "not-determined": 0 },
      },
    },
    byType: { publications: 2 },
  },
}));

/** One reconciliation source: the reader's shape (the User's ORCID, the two
 *  consent columns and the designated frozen version's STORED rows — never
 *  its document), routed by where clause. */
const SOURCE_ROWS = [
  {
    consentedRorIds: [ROR],
    visibleCurrentRorIds: [ROR],
    user: { orcid: "0000-0002-7483-2489" },
    snapshots: [
      {
        version: 2,
        reconciliationRows: storedReconciliationRows(CONSENTED_DOC, {
          snapshotVersion: 2,
          contentHash: "ab".repeat(32),
          frozenAt: "2026-09-08T10:00:00.000Z",
        }),
      },
    ],
  },
];

beforeEach(() => {
  mocks.count.mockResolvedValue(3);
  mocks.findMany.mockImplementation(async (args: { where: Record<string, unknown> }) =>
    "snapshots" in args.where ? SOURCE_ROWS : CONSENTED_ROWS,
  );
  mocks.groupBy.mockResolvedValue([{ currentRorId: ROR, _count: { _all: 3 } }]);
  mocks.institutionFindUnique.mockResolvedValue({
    name: "Nagoya University",
    openalexId: "I60134161",
    openalexAggregates: AGGREGATES,
    openalexFetchedAt: FETCHED,
  });
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
    // The two /i/[ror] renders show the stored snapshot — tables, links, sameAs —
    // and the opted-in figures (five contributors, 10 works in 2025) from the
    // rows alone.
    for (const html of [pages[1]!, pages[3]!]) {
      expect(html).toContain("inst-table");
      // The share path ran with fetch stubbed to throw: 2025 is stated
      // (2,000 / 4,300), 2026 is the snapshot's last year and withheld.
      expect(html).toContain("2,000 / 4,300 = 47%");
      expect(html).toContain("inst-share-withheld");
      expect(html).toContain("inst-figures");
      expect(html).toContain(">10<");
      expect(html).toContain('href="https://openalex.org/I60134161"');
      expect(html).toContain('href="https://openalex.org/I4210121234"');
      expect(html).toContain("https://openalex.org/I60134161");
      expect(html).toContain("sameAs");
    }
    const metas = await Promise.all([
      indexMetadata(),
      rorMetadata(params({ ror: ROR })),
      localeIndexMetadata(params({ locale: "fr" })),
      localeRorMetadata(params({ locale: "ja", ror: ROR })),
    ]);
    expect(metas[1]!.title).toBe("Nagoya University");
    expect(metas[3]!.title).toBe("Nagoya University");
    // The one link to the comparison view, pre-filled and locale-aware.
    expect(pages[1]).toContain(`href="/i/compare?ror=${ROR}"`);
    expect(pages[3]).toContain(`href="/ja/i/compare?ror=${ROR}"`);
    // The page's one line about the export (three sources per the count mock).
    for (const html of [pages[1]!, pages[3]!]) {
      expect(html).toContain(`href="/i/${ROR}/reconciliation.csv"`);
      expect(html).toContain(`href="/i/${ROR}/reconciliation.json"`);
    }
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("the comparison view (both routes) renders two columns from the stored rows alone; fetch is never called", async () => {
    const OTHER = "03xjwb503";
    const row = (rorId: string, name: string) => ({
      rorId,
      name,
      country: "JP",
      openalexId: "I60134161",
      openalexAggregates: AGGREGATES,
      openalexFetchedAt: FETCHED,
    });
    mocks.groupBy.mockResolvedValue([
      { currentRorId: ROR, _count: { _all: 3 } },
      { currentRorId: OTHER, _count: { _all: 2 } },
    ]);
    mocks.institutionFindMany.mockImplementation(async (args: { where: { rorId?: unknown } }) =>
      args.where.rorId
        ? [row(ROR, "Nagoya University"), row(OTHER, "Université de Caen Normandie")]
        : [{ rorId: ROR, name: "Nagoya University" }],
    );
    const search = { ror: [ROR, OTHER] };
    const pages = [
      renderToStaticMarkup(await ComparePage({ searchParams: Promise.resolve(search) })),
      renderToStaticMarkup(
        await LocaleComparePage({
          params: Promise.resolve({ locale: "ja" }),
          searchParams: Promise.resolve(search),
        }),
      ),
    ];
    for (const html of pages) {
      expect(html.match(/inst-compare-col/g)).toHaveLength(2);
      expect(html).toContain("2,000 / 4,300 = 47%");
      expect(html).toContain("inst-share-withheld");
      expect(html).toContain("Nagoya University");
    }
    const metas = await Promise.all([
      compareMetadata({ searchParams: Promise.resolve(search) }),
      localeCompareMetadata({
        params: Promise.resolve({ locale: "ja" }),
        searchParams: Promise.resolve(search),
      }),
    ]);
    for (const meta of metas) expect(meta.robots).toEqual({ index: false, follow: true });
    // The JSON export answers from the same rows, counts only.
    const res = await compareJsonGet(
      new Request(`https://sigmacv.test/i/compare.json?ror=${ROR}&ror=${OTHER}`),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { organisations: Array<{ rorId: string }> };
    expect(body.organisations.map((o) => o.rorId).sort()).toEqual([ROR, OTHER].sort());
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("both reconciliation-export routes answer from the stored frozen version alone; fetch is never called", async () => {
    const req = (ext: string) => new Request(`https://sigmacv.test/i/${ROR}/reconciliation.${ext}`);
    const csv = await csvGet(req("csv"), params({ ror: ROR }));
    expect(csv.status).toBe(200);
    const text = await csv.text();
    expect(text.split("\r\n")[0]).toBe(RECONCILIATION_COLUMNS.map((c) => `"${c}"`).join(","));
    const json = await jsonGet(req("json"), params({ ror: ROR }));
    expect(json.status).toBe(200);
    const body = (await json.json()) as { ror: string; contributorCount: number; rows: unknown[] };
    expect(body.ror).toBe(ROR);
    expect(body.contributorCount).toBe(1);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
