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

import { __resetPublicPageCache } from "@/lib/cv/publicPageCache";
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

/** `count` listed CVs under ROR, with (or without) a trusted ROR-recorded name.
 *  The CVs' own affiliation column always carries hostile text, so any read of
 *  it would show on the page. */
function listed(count: number, name: string | null = NAME) {
  mocks.count.mockResolvedValue(count);
  mocks.institutionFindUnique.mockResolvedValue(name === null ? null : { name });
  mocks.findFirst.mockResolvedValue({ currentAffiliationName: HOSTILE });
  mocks.findMany.mockResolvedValue([{ currentRorId: ROR, currentAffiliationName: HOSTILE }]);
}

beforeEach(() => {
  for (const m of Object.values(mocks)) if (typeof m === "function") m.mockReset();
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
    // The CV columns that carry the owner's text were never read.
    expect(mocks.findFirst).not.toHaveBeenCalled();
    expect(mocks.findMany).not.toHaveBeenCalled();
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
