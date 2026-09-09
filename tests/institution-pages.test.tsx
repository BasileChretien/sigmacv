import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

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
  findFirst: vi.fn(),
  findMany: vi.fn(),
  groupBy: vi.fn(),
  institutionFindUnique: vi.fn(),
  institutionFindMany: vi.fn(),
  enforceRateLimit: vi.fn(),
  requestHeaders: new Headers({ "x-forwarded-for": "203.0.113.9" }),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    cv: {
      count: mocks.count,
      findFirst: mocks.findFirst,
      findMany: mocks.findMany,
      groupBy: mocks.groupBy,
    },
    institution: {
      findUnique: mocks.institutionFindUnique,
      findMany: mocks.institutionFindMany,
    },
  },
}));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("next/headers", () => ({ headers: async () => mocks.requestHeaders }));
// The shared chrome pulls in client islands (router hooks); the pages under test
// are the institution bodies, so stub the header/footer.
vi.mock("@/components/SiteHeader", () => ({ default: () => null }));
vi.mock("@/components/SiteFooter", () => ({ default: () => null }));

import { buildCanonicalCv } from "@/lib/canonical/build";
import { __resetPublicPageCache } from "@/lib/cv/publicPageCache";
import { INSTITUTION_PAGE_ROW_LIMIT } from "@/lib/cv/listed";
import { institutionStrings } from "@/lib/i18n/institutions";
import IndexPage, {
  dynamic as indexDynamic,
  generateMetadata as indexMetadata,
} from "@/app/i/page";
import RorPage, {
  dynamic as rorDynamic,
  dynamicParams as rorDynamicParams,
  generateMetadata as rorMetadata,
} from "@/app/i/[ror]/page";
import LocaleIndexPage, {
  dynamic as localeIndexDynamic,
  generateMetadata as localeIndexMetadata,
} from "@/app/[locale]/i/page";
import LocaleRorPage, {
  dynamic as localeRorDynamic,
  dynamicParams as localeRorDynamicParams,
  generateMetadata as localeRorMetadata,
} from "@/app/[locale]/i/[ror]/page";

const ROR = "04chrp450";
const NAME = "Université de Caen Normandie";
const HOSTILE = "Université de Caen (dissolved — records moved to example.evil)";
const NOINDEX_NOFOLLOW = { index: false, follow: false };
const NOINDEX_FOLLOW = { index: false, follow: true };
const params = <T extends Record<string, string>>(p: T) => ({ params: Promise.resolve(p) });

/** React escapes quotes in text nodes; compare copy against the unescaped page. */
const text = (html: string) =>
  html
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");

/** The rows the consented-figures reader gets (the one Cv query the page
 *  makes); set per test with {@link counted}. */
let consentedRows: unknown[] = [];

/** `count` listed CVs under ROR, with (or without) a trusted ROR-recorded name.
 *  The CVs' own affiliation column always carries hostile text, so any read of
 *  it would show on the page. The Cv findMany is routed by its where clause:
 *  the consent query gets {@link consentedRows}, anything else the hostile row. */
function listed(count: number, name: string | null = NAME) {
  mocks.count.mockResolvedValue(count);
  mocks.institutionFindUnique.mockResolvedValue(name === null ? null : { name });
  mocks.findFirst.mockResolvedValue({ currentAffiliationName: HOSTILE });
  mocks.findMany.mockImplementation(async (args: { where: Record<string, unknown> }) =>
    "consentedRorIds" in args.where
      ? consentedRows
      : [{ currentRorId: ROR, currentAffiliationName: HOSTILE }],
  );
}

/** A consented, ACTIVE CV (a visible current position at ROR) whose owner's
 *  display name is hostile too — it must never reach the page. */
const CONSENTED_DOC = buildCanonicalCv({
  id: "cv_c",
  resolved: { orcid: "0000-0002-7483-2489", authorIds: [], displayName: HOSTILE },
  works: [],
  employments: [{ putCode: "cur", organization: HOSTILE, startYear: 2024, rorId: ROR }],
  now: "2026-09-08T00:00:00.000Z",
});

type Cells = Partial<
  Record<"open-cc" | "open-other" | "no-open-copy-found" | "not-determined", number>
>;

/** One consented row with a stored aggregate built from `{ year: cells }`
 *  (all in Publications), or a pending row when `byYear` is null. */
function consentedRow(byYear: Record<string, Cells> | null) {
  const base = {
    consentedRorIds: [ROR],
    showOnInstitutionPage: true,
    published: true,
    publicIndexable: true,
    document: CONSENTED_DOC,
  };
  if (byYear === null) return { ...base, institutionAggregates: null };
  let worksTotal = 0;
  const rows: Record<string, unknown> = {};
  for (const [year, cells] of Object.entries(byYear)) {
    const oa = {
      "open-cc": cells["open-cc"] ?? 0,
      "open-other": cells["open-other"] ?? 0,
      "no-open-copy-found": cells["no-open-copy-found"] ?? 0,
      "not-determined": cells["not-determined"] ?? 0,
    };
    const total = Object.values(oa).reduce((n, c) => n + c, 0);
    rows[year] = { total, oa };
    worksTotal += total;
  }
  return {
    ...base,
    institutionAggregates: { v: 1, worksTotal, byYear: rows, byType: { publications: worksTotal } },
  };
}

function counted(rows: unknown[]) {
  consentedRows = rows;
}

/** The figures section's markup alone. */
const figuresSection = (html: string) =>
  html.match(/<section class="inst-figures">[\s\S]*?<\/section>/)?.[0] ?? "";

/** Every JSON-LD script on the page, as one string. */
const jsonLd = (html: string) =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => m[1])
    .join("\n");

beforeEach(() => {
  for (const m of Object.values(mocks)) if (typeof m === "function") m.mockReset();
  consentedRows = [];
  mocks.enforceRateLimit.mockResolvedValue({ ok: true });
  mocks.institutionFindUnique.mockResolvedValue(null);
  mocks.institutionFindMany.mockResolvedValue([]);
});
afterEach(() => __resetPublicPageCache());

describe("route configuration", () => {
  it("every institution route is dynamic (RORs cannot be enumerated at build time)", () => {
    for (const d of [indexDynamic, rorDynamic, localeIndexDynamic, localeRorDynamic]) {
      expect(d).toBe("force-dynamic");
    }
    expect(rorDynamicParams).toBe(true);
    expect(localeRorDynamicParams).toBe(true);
  });

  it("the index carries its canonical and hreflang alternates, and inherits the default robots", async () => {
    mocks.groupBy.mockResolvedValue([]);
    const meta = await indexMetadata();
    expect(meta.alternates?.canonical).toBe("/i");
    const languages = meta.alternates?.languages as Record<string, string>;
    expect(languages["fr-FR"]).toBe("/fr/i");
    expect(languages["x-default"]).toBe("/i");
    expect(meta.robots).toBeUndefined();
  });
});

describe("/i/[ror]", () => {
  it("renders the name, the count, the ROR link, the OAI set and the About block", async () => {
    listed(3);
    const html = renderToStaticMarkup(await RorPage(params({ ror: ROR })));
    const s = institutionStrings("en-US");
    expect(html).toContain('lang="en-US"');
    expect(html).toContain(NAME);
    expect(html).toContain("3 researchers list this affiliation");
    expect(html).toContain(`https://ror.org/${ROR}`);
    expect(html).toContain(`set=ror:${ROR}`);
    expect(html).toContain(s.aboutHeading);
    expect(html).toContain("Basile Chrétien");
    expect(text(html)).toContain(s.aboutReader);
    expect(text(html)).toContain(s.aboutVoluntary);
    expect(text(html)).toContain(s.aboutNoRanking);
    expect(html).toContain('href="/faq#q8"');
    expect(html).toContain('href="/i"');
  });

  it("uses the singular form for one listed researcher", async () => {
    listed(1);
    const html = renderToStaticMarkup(await RorPage(params({ ror: ROR })));
    expect(html).toContain(institutionStrings("en-US").listedOne);
  });

  it("names the page ONLY by the trusted ROR record — an owner's hostile position text never reaches title, H1 or JSON-LD", async () => {
    listed(3);
    const html = renderToStaticMarkup(await RorPage(params({ ror: ROR })));
    const meta = await rorMetadata(params({ ror: ROR }));
    expect(html).toContain(`<h1>${NAME}</h1>`);
    expect(meta.title).toBe(NAME);
    expect(text(html)).not.toContain(HOSTILE);
    expect(text(html)).not.toContain("example.evil");
    expect(JSON.stringify(meta)).not.toContain("example.evil");
    // The CV columns that carry the owner's text were never read: the one Cv
    // query the page makes (the consented-figures reader) selects the consent
    // columns, the document and the stored aggregate — never the name column.
    expect(mocks.findFirst).not.toHaveBeenCalled();
    for (const call of mocks.findMany.mock.calls) {
      expect(call[0].where).toHaveProperty("consentedRorIds");
      expect(call[0].select).not.toHaveProperty("currentAffiliationName");
    }
  });

  it("falls back to 'ROR <id>' when no trusted record exists yet — never to the owner's text", async () => {
    listed(2, null);
    const html = renderToStaticMarkup(await RorPage(params({ ror: ROR })));
    const meta = await rorMetadata(params({ ror: ROR }));
    expect(html).toContain(`<h1>ROR ${ROR}</h1>`);
    expect(meta.title).toBe(`ROR ${ROR}`);
    expect(text(html)).not.toContain("example.evil");
    const org = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)]
      .map((m) => JSON.parse(m[1]!))
      .find((node) => node["@type"] === "Organization");
    expect(org.name).toBe(`ROR ${ROR}`);
  });

  it("embeds an Organization JSON-LD keyed by the ROR IRI and the trusted name — never an employee or member claim", async () => {
    listed(3);
    const html = renderToStaticMarkup(await RorPage(params({ ror: ROR })));
    const scripts = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(
      (m) => JSON.parse(m[1]!.replace(/\\u003c/g, "<")),
    );
    const org = scripts.find((s) => s["@type"] === "Organization");
    expect(org).toBeDefined();
    expect(org["@id"]).toBe(`https://ror.org/${ROR}`);
    expect(org.name).toBe(NAME);
    expect(org.subjectOf.url).toContain(`set=ror:${ROR}`);
    expect(JSON.stringify(org)).not.toMatch(/employee|member/);
    // And the WebPage node describes this page.
    expect(scripts.some((s) => s["@type"] === "WebPage")).toBe(true);
  });

  describe("OpenAlex section (rendered from the stored row only)", () => {
    const FETCHED = new Date("2026-09-09T10:00:00Z");
    const AGG = {
      version: 1,
      countedEntity: {
        openalexId: "I98702875",
        displayName: "Université de Caen Normandie (OpenAlex)",
        lineageSize: 2,
        relatedCount: 3,
        foldedIds: ["I98702875", "I4210114068"],
        fetchedAt: FETCHED.toISOString(),
      },
      countedWorkTypes: ["article", "review", "book-chapter", "preprint"],
      years: { from: 2025, to: 2026 },
      worksByYear: [
        { year: 2025, count: 1234 },
        { year: 2026, count: 56 },
      ],
      // The statuses of 2025 sum to 1,230 while the year's works count is 1,234:
      // the two come from different OpenAlex requests, and the table's Total
      // column must be the works count, never the sum of the columns.
      oaByStatusByYear: [
        { year: 2025, status: "gold", count: 400 },
        { year: 2025, status: "closed", count: 830 },
        { year: 2026, status: "mystery", count: 56 },
      ],
      topCountries: [
        { code: "FR", name: "France", count: 1200 },
        { code: "XX", name: "", count: 3 },
      ],
      topCoAffiliations: [
        { openalexId: "I1294671590", name: "CNRS", count: 500 },
        { openalexId: "I35440088", name: "", count: 7 },
      ],
    };

    function listedWithSnapshot(aggregates: unknown = AGG) {
      listed(3);
      mocks.institutionFindUnique.mockResolvedValue({
        name: NAME,
        openalexId: "I98702875",
        openalexAggregates: aggregates,
        openalexFetchedAt: FETCHED,
      });
    }

    it("says 'not fetched yet' and nothing else when the row has no snapshot", async () => {
      listed(3);
      const html = renderToStaticMarkup(await RorPage(params({ ror: ROR })));
      const s = institutionStrings("en-US");
      expect(text(html)).toContain(s.openalexHeading);
      expect(text(html)).toContain(s.openalexNotFetched);
      expect(html).not.toContain("inst-table");
      expect(html).not.toContain("openalex.org");
    });

    it("renders the counted entity, the count tables with the year's total as denominator, the top lists and the as-of date — counts only", async () => {
      listedWithSnapshot();
      const html = renderToStaticMarkup(await RorPage(params({ ror: ROR })));
      const body = text(html);
      // The trusted ROR name stays the page's name; OpenAlex's is context only.
      expect(html).toContain(`<h1>${NAME}</h1>`);
      expect(body).toContain(
        "Counted as OpenAlex entity I98702875 (Université de Caen Normandie (OpenAlex))",
      );
      expect(body).toContain("a lineage of 2, 3 associated organisations");
      expect(html).toContain('href="https://openalex.org/I98702875"');
      expect(body).toContain("2025–2026");
      expect(body).toContain(institutionStrings("en-US").openalexNotCompared);
      // Works by year.
      expect(html).toContain('<th scope="row">2025</th>');
      expect(html).toContain("1,234");
      // OA by year: OpenAlex's statuses in order, an unknown one appended, the total last.
      const headers = [...html.matchAll(/<th scope="col" class="num">([^<]*)<\/th>/g)].map(
        (m) => m[1],
      );
      expect(headers).toEqual([
        "Works",
        "gold",
        "hybrid",
        "diamond",
        "green",
        "bronze",
        "closed",
        "mystery",
        "Total",
        "Works",
        "Works",
      ]);
      const rows = [
        ...html.matchAll(
          /<tr><th scope="row">(\d{4})<\/th>((?:<td class="num">[^<]*<\/td>)+)<\/tr>/g,
        ),
      ].map((m) => [
        m[1],
        ...[...m[2]!.matchAll(/<td class="num">([^<]*)<\/td>/g)].map((c) => c[1]),
      ]);
      expect(rows).toContainEqual(["2025", "400", "0", "0", "0", "0", "830", "0", "1,234"]);
      expect(rows).toContainEqual(["2026", "0", "0", "0", "0", "0", "0", "56", "56"]);
      // Top lists; a blank name falls back to the code / id, an org links to OpenAlex.
      expect(body).toContain("France");
      expect(body).toContain("1,200");
      expect(body).toContain("XX");
      expect(html).toContain('href="https://openalex.org/I1294671590"');
      expect(body).toContain("I35440088");
      expect(body).toContain("top 15");
      // As of.
      expect(body).toContain("As of September 9, 2026");
      // Never a share.
      expect(body).not.toContain("%");
      // Still no network and no CV column.
      expect(mocks.findFirst).not.toHaveBeenCalled();
    });

    it("adds the OpenAlex entity as the Organization's sameAs, and only then", async () => {
      listedWithSnapshot();
      const html = renderToStaticMarkup(await RorPage(params({ ror: ROR })));
      const org = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)]
        .map((m) => JSON.parse(m[1]!.replace(/\\u003c/g, "<")))
        .find((node) => node["@type"] === "Organization");
      expect(org.sameAs).toBe("https://openalex.org/I98702875");
      expect(JSON.stringify(org)).not.toContain("1234");

      listed(3);
      const bare = renderToStaticMarkup(await RorPage(params({ ror: ROR })));
      expect(bare).not.toContain("sameAs");
    });

    it("treats a malformed stored snapshot as not fetched rather than throwing", async () => {
      listedWithSnapshot({ version: 1, worksByYear: "nope" });
      const html = renderToStaticMarkup(await RorPage(params({ ror: ROR })));
      expect(text(html)).toContain(institutionStrings("en-US").openalexNotFetched);
      expect(html).not.toContain("sameAs");
    });

    it("treats a tampered row — an openalexId or a co-affiliation id that is not an OpenAlex `I…` id — as not fetched: no table, no link, no sameAs", async () => {
      const s = institutionStrings("en-US");
      for (const row of [
        { openalexId: "javascript:alert(1)", openalexAggregates: AGG },
        {
          openalexId: "I98702875",
          openalexAggregates: {
            ...AGG,
            topCoAffiliations: [{ openalexId: "javascript:alert(1)", name: "x", count: 1 }],
          },
        },
      ]) {
        listed(3);
        mocks.institutionFindUnique.mockResolvedValue({
          name: NAME,
          ...row,
          openalexFetchedAt: FETCHED,
        });
        const html = renderToStaticMarkup(await RorPage(params({ ror: ROR })));
        expect(text(html)).toContain(s.openalexNotFetched);
        expect(html).not.toContain("inst-table");
        expect(html).not.toContain("javascript:");
        expect(html).not.toContain("openalex.org");
        expect(html).not.toContain("sameAs");
      }
    });

    it("localizes the section (fr) with the locale's number and date formats", async () => {
      listedWithSnapshot();
      const html = renderToStaticMarkup(await LocaleRorPage(params({ locale: "fr", ror: ROR })));
      const s = institutionStrings("fr-FR");
      expect(text(html)).toContain(s.openalexHeading);
      expect(text(html)).toContain(s.openalexWorksByYearHeading);
      expect(text(html)).toContain("9 septembre 2026");
      expect(html).toContain("1 234");
    });
  });

  it("names the page after the institution in its metadata", async () => {
    listed(3);
    const meta = await rorMetadata(params({ ror: ROR }));
    expect(meta.title).toBe(NAME);
    expect(meta.description).toContain(NAME);
    expect(meta.alternates?.canonical).toBe(`/i/${ROR}`);
    const languages = meta.alternates?.languages as Record<string, string>;
    expect(languages["ja-JP"]).toBe(`/ja/i/${ROR}`);
  });

  it("is indexable from two listed researchers, and served noindex (follow) for one", async () => {
    listed(2);
    expect((await rorMetadata(params({ ror: ROR }))).robots).toBeUndefined();
    listed(1);
    expect((await rorMetadata(params({ ror: ROR }))).robots).toEqual(NOINDEX_FOLLOW);
    // The page itself is still served, with the count.
    const html = renderToStaticMarkup(await RorPage(params({ ror: ROR })));
    expect(html).toContain(institutionStrings("en-US").listedOne);
  });

  it("404s an id that is not ROR-shaped without touching the database, marked noindex", async () => {
    for (const bad of ["https:%2F%2Fror.org%2F04chrp450", "04CHRP450", "..", "x'; --"]) {
      await expect(RorPage(params({ ror: bad }))).rejects.toThrow();
      expect(await rorMetadata(params({ ror: bad }))).toEqual({ robots: NOINDEX_NOFOLLOW });
    }
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.institutionFindUnique).not.toHaveBeenCalled();
  });

  it("404s a ROR nobody listed under, then remembers the miss so the next hit skips the database", async () => {
    listed(0, null);
    await expect(RorPage(params({ ror: ROR }))).rejects.toThrow();
    expect(mocks.count).toHaveBeenCalledTimes(1);
    await expect(RorPage(params({ ror: ROR }))).rejects.toThrow();
    expect(mocks.count).toHaveBeenCalledTimes(1);
    expect(await rorMetadata(params({ ror: ROR }))).toEqual({ robots: NOINDEX_NOFOLLOW });
  });

  it("is rate-limited under the shared public-page buckets and renders a noindex notice, not the count", async () => {
    mocks.enforceRateLimit.mockResolvedValue({ ok: false, retryAfterSec: 30 });
    listed(3);
    const html = renderToStaticMarkup(await RorPage(params({ ror: ROR })));
    expect(html).toContain(institutionStrings("en-US").rateLimitedHeading);
    expect(html).not.toContain("3 researchers");
    expect(mocks.enforceRateLimit).toHaveBeenCalledWith(
      "pubpage:203.0.113.9",
      expect.any(Number),
      expect.any(Number),
    );
    expect(mocks.count).not.toHaveBeenCalled();
    // A server component cannot send 429; the notice is at least never indexed
    // under the institution's URL.
    expect(await rorMetadata(params({ ror: ROR }))).toEqual({ robots: NOINDEX_NOFOLLOW });
  });
});

describe("/i/[ror] — figures from researchers who chose to be counted here", () => {
  const s = institutionStrings("en-US");

  it("with fewer than 5 contributors, says so in one sentence and shows no figure", async () => {
    listed(3);
    counted([
      consentedRow({ "2025": { "open-cc": 4 } }),
      consentedRow({ "2025": { "open-cc": 4 } }),
      consentedRow({ "2025": { "open-cc": 4 } }),
      consentedRow({ "2025": { "open-cc": 4 } }),
      consentedRow(null),
    ]);
    const html = renderToStaticMarkup(await RorPage(params({ ror: ROR })));
    const section = figuresSection(html);
    expect(section).toContain(s.figuresHeading);
    expect(section).toContain(
      "Fewer than 5 researchers have chosen to be counted here, so no figures are shown yet.",
    );
    expect(text(section)).toContain("1 more chose to be counted but their figures");
    expect(section).not.toContain("inst-table");
    expect(section).not.toContain("16");
    expect(section).not.toContain("Only the first");
    // Both counts are on the page, each as its own sentence.
    expect(html).toContain("3 researchers list this affiliation");
  });

  it("from 5 contributors, shows the contributor sentence, the pending sentence, the by-year and by-section tables with suppressed cells — and no name, no link, no ratio", async () => {
    listed(3);
    // Every CV also has one work with no year.
    const U: Cells = { "open-cc": 1 };
    counted([
      // Five contributors: all in 2025 (open-cc), only two in 2024 (closed).
      consentedRow({ "2025": { "open-cc": 2 }, "2024": { "no-open-copy-found": 1 }, unknown: U }),
      consentedRow({ "2025": { "open-cc": 2 }, "2024": { "no-open-copy-found": 1 }, unknown: U }),
      consentedRow({ "2025": { "open-cc": 2 }, unknown: U }),
      consentedRow({ "2025": { "open-cc": 2 }, unknown: U }),
      consentedRow({ "2025": { "open-cc": 2, "open-other": 1 }, unknown: U }),
      // Two rows not computed yet.
      consentedRow(null),
      consentedRow(null),
    ]);
    const html = renderToStaticMarkup(await RorPage(params({ ror: ROR })));
    const section = figuresSection(html);
    expect(section).toContain("5 researchers chose to be counted on this page.");
    expect(text(section)).toContain(
      "2 more chose to be counted but their figures have not been computed yet",
    );
    expect(section).not.toContain("Only the first");
    expect(text(section)).toContain(s.figuresNotCompared);
    expect(section).toContain(s.figuresByYearHeading);
    expect(section).toContain(s.figuresByTypeHeading);
    // 2024: two contributors → the row is absent. 2025: total 11 from 5 CVs;
    // open-cc 10 from 5 CVs shown; the other three cells suppressed (one from
    // a single CV, two empty) — three hidden, so nothing more to hide.
    expect(section).not.toContain("2024");
    expect(section).toContain('<th scope="row">2025</th>');
    expect(section).toContain(">11<");
    expect(section).toContain(">10<");
    expect(section).not.toContain(">1<");
    expect((section.match(/muted">fewer than 5 researchers</g) ?? []).length).toBe(6);
    // The works with no year: their own row, last.
    expect(section).toContain('<th scope="row">No year</th>');
    expect(section.indexOf("No year")).toBeGreaterThan(section.indexOf(">2025<"));
    // The four state columns reuse the worklist's labels.
    for (const label of [
      "Open, Creative Commons licence",
      "Open, other or unknown licence",
      "No open copy found",
      "Not determined",
    ]) {
      expect(section).toContain(label);
    }
    // Works by section: 18 in Publications (4 + 4 + 3 + 3 + 4).
    expect(section).toContain("<td>Publications</td>");
    expect(section).toContain(">18<");
    // Veto 4: no name, no per-person column, no link out of the section.
    expect(section).not.toContain("<a ");
    expect(text(section)).not.toContain(HOSTILE);
    expect(text(html)).not.toContain(HOSTILE);
    expect(section).not.toMatch(/%|\bshare\b|\bratio\b/i);
    // JSON-LD unchanged: no employee / member, none of the figures.
    const ld = jsonLd(html);
    for (const word of ["employee", "member", "figures", "chose to be counted", "Publications"]) {
      expect(ld, word).not.toContain(word);
    }
  });

  it("says when only the first 2,000 consented researchers are included", async () => {
    listed(3);
    const bound = Array.from({ length: INSTITUTION_PAGE_ROW_LIMIT }, (_, i) =>
      consentedRow(i < 5 ? { "2025": { "open-cc": 1 } } : null),
    );
    counted(bound);
    const html = renderToStaticMarkup(await RorPage(params({ ror: ROR })));
    const section = text(figuresSection(html));
    expect(section).toContain("5 researchers chose to be counted on this page.");
    expect(section).toContain("1,995 more chose to be counted");
    expect(section).toContain(
      "Only the first 2,000 researchers who chose to be counted are included.",
    );
    // Below k, the bound is still stated.
    counted(bound.map((r, i) => (i < 4 ? consentedRow(null) : r)));
    const below = text(figuresSection(renderToStaticMarkup(await RorPage(params({ ror: ROR })))));
    expect(below).toContain("Fewer than 5 researchers have chosen");
    expect(below).toContain("Only the first 2,000 researchers");
  });

  it("renders identically with and without an OpenAlex snapshot on the row — the two sections never meet", async () => {
    const rows = Array.from({ length: 5 }, () => consentedRow({ "2025": { "open-cc": 3 } }));
    listed(3);
    counted(rows);
    const without = figuresSection(renderToStaticMarkup(await RorPage(params({ ror: ROR }))));
    mocks.institutionFindUnique.mockResolvedValue({
      name: NAME,
      openalexId: "I60134161",
      openalexFetchedAt: new Date("2026-09-09T10:00:00Z"),
      openalexAggregates: {
        version: 1,
        countedEntity: {
          openalexId: "I60134161",
          displayName: NAME,
          lineageSize: 1,
          relatedCount: 0,
          foldedIds: ["I60134161"],
          fetchedAt: "2026-09-09T10:00:00.000Z",
        },
        countedWorkTypes: ["article"],
        years: { from: 2025, to: 2025 },
        worksByYear: [{ year: 2025, count: 4321 }],
        oaByStatusByYear: [{ year: 2025, status: "gold", count: 2000 }],
        topCountries: [],
        topCoAffiliations: [],
      },
    });
    const html = renderToStaticMarkup(await RorPage(params({ ror: ROR })));
    expect(figuresSection(html)).toBe(without);
    expect(without).toContain(">15<");
    expect(html).toContain("4,321");
    // No "OpenAlex has it, nobody claims it" figure anywhere on the page.
    expect(html).not.toContain("4306");
  });

  it("is localized on the locale route", async () => {
    listed(3);
    counted(Array.from({ length: 5 }, () => consentedRow({ "2025": { "open-cc": 1 } })));
    const html = renderToStaticMarkup(await LocaleRorPage(params({ locale: "fr", ror: ROR })));
    const fr = institutionStrings("fr-FR");
    const section = text(figuresSection(html));
    expect(section).toContain(fr.figuresHeading);
    expect(section).toContain("5 chercheurs ont choisi");
    expect(section).toContain("moins de 5 chercheurs");
    expect(section).toContain("<td>Publications</td>");
  });
});

describe("/[locale]/i/[ror]", () => {
  it("renders the localized page with localized links and the trusted name", async () => {
    listed(2);
    const html = renderToStaticMarkup(await LocaleRorPage(params({ locale: "fr", ror: ROR })));
    const s = institutionStrings("fr-FR");
    expect(html).toContain('lang="fr-FR"');
    expect(html).toContain(`<h1>${NAME}</h1>`);
    expect(text(html)).not.toContain("example.evil");
    expect(html).toContain(s.aboutHeading);
    expect(html).toContain('href="/fr/faq#q8"');
    expect(html).toContain('href="/fr/i"');
    const meta = await localeRorMetadata(params({ locale: "fr", ror: ROR }));
    expect(meta.alternates?.canonical).toBe(`/fr/i/${ROR}`);
    expect(meta.robots).toBeUndefined();
  });

  it("is noindex for one listed researcher, for a rate-limited hit, and for a 404", async () => {
    listed(1);
    expect((await localeRorMetadata(params({ locale: "de", ror: ROR }))).robots).toEqual(
      NOINDEX_FOLLOW,
    );
    mocks.enforceRateLimit.mockResolvedValue({ ok: false, retryAfterSec: 30 });
    expect(await localeRorMetadata(params({ locale: "fr", ror: ROR }))).toEqual({
      robots: NOINDEX_NOFOLLOW,
    });
    mocks.enforceRateLimit.mockResolvedValue({ ok: true });
    listed(0, null);
    expect(await localeRorMetadata(params({ locale: "es", ror: ROR }))).toEqual({
      robots: NOINDEX_NOFOLLOW,
    });
  });

  it("404s an unknown or default-locale slug (noindex), and an unlisted ROR", async () => {
    listed(2);
    for (const locale of ["xx", "en"]) {
      await expect(LocaleRorPage(params({ locale, ror: ROR }))).rejects.toThrow();
      expect(await localeRorMetadata(params({ locale, ror: ROR }))).toEqual({
        robots: NOINDEX_NOFOLLOW,
      });
    }
    listed(0, null);
    await expect(LocaleRorPage(params({ locale: "de", ror: ROR }))).rejects.toThrow();
  });
});

describe("/i and /[locale]/i", () => {
  function indexed() {
    mocks.groupBy.mockResolvedValue([
      { currentRorId: ROR, _count: { _all: 3 } },
      { currentRorId: "05m32f987", _count: { _all: 1 } },
    ]);
    mocks.institutionFindMany.mockResolvedValue([
      { rorId: ROR, name: NAME },
      { rorId: "05m32f987", name: "Nagoya University" },
    ]);
    // The CVs' own text is hostile and must never be read for the index.
    mocks.findMany.mockResolvedValue([{ currentRorId: ROR, currentAffiliationName: HOSTILE }]);
  }

  it("lists every institution with at least one listed CV, with trusted name, count and link", async () => {
    indexed();
    const html = renderToStaticMarkup(await IndexPage());
    expect(html).toContain('lang="en-US"');
    expect(html).toContain(institutionStrings("en-US").indexHeading);
    expect(html).toContain(`href="/i/${ROR}"`);
    expect(html).toContain('href="/i/05m32f987"');
    expect(html).toContain("Nagoya University");
    expect(html).toContain(NAME);
    expect(text(html)).not.toContain("example.evil");
    expect(html).toContain("3 researchers list this affiliation");
    expect(html).toContain("1 researcher lists this affiliation");
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("says so when nobody has listed an affiliation yet", async () => {
    mocks.groupBy.mockResolvedValue([]);
    const html = renderToStaticMarkup(await IndexPage());
    expect(html).toContain(institutionStrings("en-US").indexEmpty);
  });

  it("is rate-limited like the institution page, and the notice is noindex", async () => {
    mocks.enforceRateLimit.mockResolvedValue({ ok: false, retryAfterSec: 30 });
    const html = renderToStaticMarkup(await IndexPage());
    expect(html).toContain(institutionStrings("en-US").rateLimitedHeading);
    expect(mocks.groupBy).not.toHaveBeenCalled();
    expect((await indexMetadata()).robots).toEqual(NOINDEX_NOFOLLOW);
    expect((await localeIndexMetadata(params({ locale: "fr" }))).robots).toEqual(NOINDEX_NOFOLLOW);
  });

  it("the localized index renders its locale and 404s unknown/default slugs (noindex)", async () => {
    indexed();
    const html = renderToStaticMarkup(await LocaleIndexPage(params({ locale: "ja" })));
    expect(html).toContain('lang="ja-JP"');
    expect(html).toContain(`href="/ja/i/${ROR}"`);
    const meta = await localeIndexMetadata(params({ locale: "ja" }));
    expect(meta.title).toBe(institutionStrings("ja-JP").indexMetaTitle);
    expect(meta.alternates?.canonical).toBe("/ja/i");
    expect(meta.robots).toBeUndefined();
    for (const locale of ["xx", "en"]) {
      await expect(LocaleIndexPage(params({ locale }))).rejects.toThrow();
      expect(await localeIndexMetadata(params({ locale }))).toEqual({ robots: NOINDEX_NOFOLLOW });
    }
  });
});
