import { beforeEach, describe, expect, it, vi } from "vitest";
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
  groupBy: vi.fn(),
  institutionFindMany: vi.fn(),
  enforceRateLimit: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    cv: { groupBy: mocks.groupBy },
    institution: { findMany: mocks.institutionFindMany },
  },
}));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-forwarded-for": "203.0.113.9" }),
}));
vi.mock("@/components/SiteHeader", () => ({ default: () => null }));
vi.mock("@/components/SiteFooter", () => ({ default: () => null }));

import { fillInstitutionString, institutionStrings } from "@/lib/i18n/institutions";
import { institutionCompareStrings } from "@/lib/i18n/institutionsCompare";
import ComparePage, {
  dynamic as compareDynamic,
  generateMetadata as compareMetadata,
} from "@/app/i/compare/page";
import LocaleComparePage, {
  dynamic as localeCompareDynamic,
  generateMetadata as localeCompareMetadata,
} from "@/app/[locale]/i/compare/page";

const NAGOYA = "04chrp450";
const CAEN = "03xjwb503";
const CHU = "027arzy69";
const FOURTH = "0220mzb33";

const text = (html: string) =>
  html
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&");

const props = (ror?: string | string[]) => ({ searchParams: Promise.resolve({ ror }) });
const localeProps = (locale: string, ror?: string | string[]) => ({
  params: Promise.resolve({ locale }),
  searchParams: Promise.resolve({ ror }),
});

function aggregates(oa: Record<number, { open: number; closed: number }>, from = 2020, to = 2026) {
  return {
    version: 1,
    countedEntity: {
      openalexId: "I60134161",
      displayName: "Entity",
      lineageSize: 1,
      relatedCount: 1,
      foldedIds: ["I60134161", "I4210121234"],
      fetchedAt: "2026-09-01T00:00:00.000Z",
    },
    countedWorkTypes: ["article"],
    years: { from, to },
    worksByYear: [],
    oaByStatusByYear: Object.entries(oa).flatMap(([y, v]) => [
      { year: Number(y), status: "gold", count: v.open },
      { year: Number(y), status: "closed", count: v.closed },
    ]),
    topCountries: [],
    topCoAffiliations: [],
  };
}

const ROWS = [
  {
    rorId: NAGOYA,
    name: "Nagoya University",
    country: "JP",
    openalexId: "I60134161",
    openalexAggregates: aggregates({
      2024: { open: 3964, closed: 2171 },
      2026: { open: 5, closed: 5 },
    }),
    openalexFetchedAt: new Date("2026-09-01T00:00:00.000Z"),
  },
  {
    rorId: CAEN,
    name: "Université de Caen Normandie",
    country: "FR",
    openalexId: "I98702875",
    openalexAggregates: aggregates({
      2024: { open: 400, closed: 830 },
      2025: { open: 20, closed: 30 },
      2026: { open: 56, closed: 0 },
    }),
    openalexFetchedAt: new Date("2026-09-03T00:00:00.000Z"),
  },
  {
    rorId: CHU,
    name: "CHU de Caen Normandie",
    country: "FR",
    openalexId: "I4210114068",
    openalexAggregates: aggregates({ 2024: { open: 900, closed: 100 } }),
    openalexFetchedAt: new Date("2026-09-02T00:00:00.000Z"),
  },
];

/** The two database reads: listed counts (existence gate) and institution rows,
 *  the latter routed by its where clause (picker list vs requested ids). */
function db(listed: Record<string, number> = { [NAGOYA]: 3, [CAEN]: 2, [CHU]: 1 }) {
  mocks.groupBy.mockResolvedValue(
    Object.entries(listed).map(([currentRorId, n]) => ({ currentRorId, _count: { _all: n } })),
  );
  mocks.institutionFindMany.mockImplementation(
    async (args: { where: { rorId?: { in: string[] }; openalexFetchedAt?: unknown } }) =>
      args.where.rorId ? ROWS.filter((r) => args.where.rorId!.in.includes(r.rorId)) : ROWS,
  );
}

beforeEach(() => {
  mocks.groupBy.mockReset();
  mocks.institutionFindMany.mockReset();
  mocks.enforceRateLimit.mockReset();
  mocks.enforceRateLimit.mockResolvedValue({ ok: true });
});

describe("/i/compare", () => {
  it("is fully dynamic on both routes", () => {
    expect(compareDynamic).toBe("force-dynamic");
    expect(localeCompareDynamic).toBe("force-dynamic");
  });

  it("is never indexed, has no hreflang, and canonicalises to the SORTED set of ids", async () => {
    db();
    const meta = await compareMetadata(props([CAEN, NAGOYA]));
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.alternates?.canonical).toBe(
      `/i/compare?ror=${NAGOYA}&ror=${CAEN}`.replace(
        `ror=${NAGOYA}&ror=${CAEN}`,
        [NAGOYA, CAEN]
          .sort()
          .map((id) => `ror=${id}`)
          .join("&"),
      ),
    );
    expect(meta.alternates?.languages).toBeUndefined();
    expect(meta.title).toBe(institutionCompareStrings("en-US").metaTitle);

    // Fewer than two columns: the bare picker is the canonical.
    const one = await compareMetadata(props(NAGOYA));
    expect(one.alternates?.canonical).toBe("/i/compare");
    expect(one.robots).toEqual({ index: false, follow: true });
  });

  it("renders the columns alphabetically whatever the order asked, each with its own total, date and country, the share in one cell, and the method box before the numbers", async () => {
    db();
    const html = renderToStaticMarkup(await ComparePage(props([CAEN, NAGOYA])));
    const body = text(html);
    const c = institutionCompareStrings("en-US");
    expect(body.indexOf("Nagoya University")).toBeLessThan(
      body.indexOf("Université de Caen Normandie"),
    );
    // Method box and field label precede the first table.
    expect(body.indexOf("Method v1")).toBeLessThan(html.indexOf("<table"));
    expect(body).toContain(c.label);
    expect(body).toContain(c.alphabetical);
    // Per column: country name, as-of date, entity line, the share with both counts.
    expect(body).toContain("Japan");
    expect(body).toContain("France");
    expect(body).toContain("As of September 1, 2026");
    expect(body).toContain("As of September 3, 2026");
    expect(body).toContain("OpenAlex entity I60134161, 2 organisations folded in");
    expect(html).toContain('<span aria-hidden="true">3,964 / 6,135 = 65%</span>');
    expect(html).toContain('<span aria-hidden="true">400 / 1,230 = 33%</span>');
    // The incomplete year is present with its counts and withheld.
    expect(html).toContain('<span class="inst-share-withheld">year not complete</span>');
    // Exactly the two stated shares are the only percents on the page, in column order.
    expect(
      text(html.replace(/<span class="visually-hidden">[^<]*<\/span>/g, "")).match(/\d+%/g),
    ).toEqual(["65%", "33%"]);
    // A full year below the floor keeps its counts and its own reason, on its own row.
    expect(html).toMatch(
      new RegExp(
        `<th scope="row">2025</th><td class="num">50</td><td class="num">20</td><td class="num">30</td><td class="num inst-share"><span class="inst-share-withheld">${c.shareFew}</span>`,
      ),
    );
    // With two columns the picker's list is never read: one institution read.
    expect(mocks.institutionFindMany).toHaveBeenCalledTimes(1);
    // The countries differ: the national-policy caveat appears.
    expect(body).toContain(c.caveatCountries);
    // Never the listed count, never a difference, never a sort control.
    expect(body).not.toMatch(/researchers? lists? this affiliation/);
    expect(html).not.toContain("<select");
    expect(body).toContain("privacy@sigmacv.org");
    expect(html).toContain(`href="/i/${NAGOYA}"`);
    // Each table is named for assistive technology, and the share is spoken
    // with its counts named, the visual string hidden from the reader.
    expect(html).toContain('<caption class="visually-hidden">Nagoya University</caption>');
    expect(html).toContain(
      '<span aria-hidden="true">3,964 / 6,135 = 65%</span><span class="visually-hidden">65% — 3,964 Open copy, 6,135 Total</span>',
    );
    // The page is the wide variant of the document page.
    expect(html).toContain('class="doc-page inst-compare-page"');

    // Three columns, asked in a non-alphabetical order, still alphabetical.
    const three = text(renderToStaticMarkup(await ComparePage(props([NAGOYA, CAEN, CHU]))));
    const at = (name: string) => three.indexOf(`<caption class="visually-hidden">${name}`);
    expect(at("CHU de Caen Normandie")).toBeGreaterThan(0);
    expect(at("CHU de Caen Normandie")).toBeLessThan(at("Nagoya University"));
    expect(at("Nagoya University")).toBeLessThan(at("Université de Caen Normandie"));
  });

  it("charges the public-page limit once per requested organisation and its own bucket once, and serves the noindex notice when either refuses", async () => {
    db();
    await ComparePage(props([CAEN, NAGOYA, CHU]));
    const keys = mocks.enforceRateLimit.mock.calls.map((c) => c[0]);
    expect(keys.filter((k) => k === "pubpage:203.0.113.9")).toHaveLength(3);
    expect(keys.filter((k) => k === "icompare:203.0.113.9")).toHaveLength(1);
    expect(keys.filter((k) => k === "pubpage:global")).toHaveLength(3);

    // No usable id still costs one public-page token (the picker is a page too).
    mocks.enforceRateLimit.mockClear();
    await ComparePage(props(undefined));
    expect(
      mocks.enforceRateLimit.mock.calls.map((c) => c[0]).filter((k) => k === "pubpage:203.0.113.9"),
    ).toHaveLength(1);

    mocks.enforceRateLimit.mockReset();
    mocks.enforceRateLimit.mockImplementation(async (key: string) =>
      key.startsWith("icompare:") ? { ok: false, retryAfterSec: 30 } : { ok: true },
    );
    const html = renderToStaticMarkup(await ComparePage(props([CAEN, NAGOYA])));
    expect(text(html)).toContain(institutionStrings("en-US").rateLimitedHeading);
    expect(html).not.toContain("inst-compare");
    expect((await compareMetadata(props([CAEN, NAGOYA]))).robots).toEqual({
      index: false,
      follow: false,
    });
  });

  it("shows the picker, with the chosen one pre-ticked, when fewer than two organisations can be set side by side, and says why an id was left out", async () => {
    db({ [NAGOYA]: 3, [CAEN]: 2 }); // the CHU has no page any more
    const html = renderToStaticMarkup(await ComparePage(props([NAGOYA, CHU, "x'; --"])));
    const body = text(html);
    const c = institutionCompareStrings("en-US");
    expect(body).toContain(c.pickerIntro);
    expect(body).toContain(c.pickerNeedTwo);
    expect(html).toMatch(
      /<form(?=[^>]*\bclass="inst-picker")(?=[^>]*\baction="\/i\/compare")(?=[^>]*\bmethod="get")[^>]*>/,
    );
    expect(html).toContain(`<fieldset><legend>${c.pickerNeedTwo}</legend>`);
    expect(html).toContain('class="btn btn-primary"');
    expect(html).toMatch(
      new RegExp(`<input(?=[^>]*\\bchecked="")(?=[^>]*\\bvalue="${NAGOYA}")[^>]*>`),
    );
    expect(html).toContain(`value="${CAEN}"`);
    // The CHU is not offered (no page) and its id is explained; the hostile id is never echoed.
    expect(html).not.toContain(`value="${CHU}"`);
    expect(body).toContain(`${CHU}</a>: nothing to set side by side`);
    expect(html).toContain(`href="https://ror.org/${CHU}"`);
    expect(body).not.toContain("x'; --");
    expect(html).not.toContain("inst-compare-col");
    // The picker's list is a second institution read.
    expect(mocks.institutionFindMany).toHaveBeenCalledTimes(2);
  });

  it("withholds every share with the skew reason when the records were read more than 30 days apart, keeping the counts and the rows' own reasons", async () => {
    db();
    const base = mocks.institutionFindMany.getMockImplementation()!;
    mocks.institutionFindMany.mockImplementation(async (args) =>
      (await base(args)).map((r: { rorId: string }) =>
        r.rorId === CAEN ? { ...r, openalexFetchedAt: new Date("2026-10-15T00:00:00.000Z") } : r,
      ),
    );
    const html = renderToStaticMarkup(await ComparePage(props([CAEN, NAGOYA])));
    const c = institutionCompareStrings("en-US");
    expect(text(html)).toContain(fillInstitutionString(c.skewNote, { days: 30 }));
    expect(html).toContain(`<span class="inst-share-withheld">${c.shareSkew}</span>`);
    expect(html).not.toMatch(/\d+%/);
    expect(html).toContain("3,964");
    expect(html).toContain(`<span class="inst-share-withheld">${c.shareIncomplete}</span>`);
    expect(html).toContain(`<span class="inst-share-withheld">${c.shareFew}</span>`);
  });

  it("shows no country caveat for a same-country pair, never names an over-cap id in a dropped line, and falls back to the code for a country it cannot name", async () => {
    db({ [CAEN]: 2, [CHU]: 1, [NAGOYA]: 3, [FOURTH]: 1 });
    const c = institutionCompareStrings("en-US");
    const same = text(renderToStaticMarkup(await ComparePage(props([CAEN, CHU]))));
    expect(same).not.toContain(c.caveatCountries);
    expect(same).toContain("France");

    const four = text(renderToStaticMarkup(await ComparePage(props([CAEN, CHU, NAGOYA, FOURTH]))));
    expect(four).toContain(c.caveatCountries);
    expect(four).not.toContain(`${FOURTH}:`);
    expect(four).toContain(fillInstitutionString(c.overCap, { max: 3 }));
    // The notices sit right under the columns, before the caveats.
    expect(four.indexOf(fillInstitutionString(c.overCap, { max: 3 }))).toBeLessThan(
      four.indexOf(c.caveatsHeading),
    );

    const base = mocks.institutionFindMany.getMockImplementation()!;
    mocks.institutionFindMany.mockImplementation(async (args) =>
      (await base(args)).map((r: { rorId: string }) =>
        r.rorId === CHU ? { ...r, country: "??" } : r,
      ),
    );
    const odd = text(renderToStaticMarkup(await ComparePage(props([CAEN, CHU]))));
    expect(odd).toContain("??");
    expect(odd).toContain(c.caveatCountries);
  });

  it("caps at three and says so", async () => {
    db({ [NAGOYA]: 1, [CAEN]: 1, [CHU]: 1, [FOURTH]: 1 });
    const html = renderToStaticMarkup(await ComparePage(props([NAGOYA, CAEN, CHU, FOURTH])));
    expect(html.match(/inst-compare-col/g)).toHaveLength(3);
    expect(text(html)).toContain("At most 3 organisations are set side by side");
    expect(mocks.institutionFindMany.mock.calls[0]![0].where.rorId.in).toEqual([NAGOYA, CAEN, CHU]);
  });

  it("is localized on the locale route, and refuses an unknown or default-locale slug", async () => {
    db();
    const html = renderToStaticMarkup(await LocaleComparePage(localeProps("fr", [NAGOYA, CAEN])));
    const body = text(html);
    const fr = institutionCompareStrings("fr-FR");
    expect(body).toContain(fr.heading);
    expect(body).toContain("Japon");
    expect(body).toContain("Au 1 septembre 2026");
    expect(html).toContain('lang="fr-FR"');
    const meta = await localeCompareMetadata(localeProps("fr", [NAGOYA, CAEN]));
    expect(meta.alternates?.canonical).toMatch(/^\/fr\/i\/compare\?ror=/);
    expect(meta.robots).toEqual({ index: false, follow: true });

    expect((await localeCompareMetadata(localeProps("xx"))).robots).toEqual({
      index: false,
      follow: false,
    });
    await expect(LocaleComparePage(localeProps("en"))).rejects.toThrow();
  });
});
