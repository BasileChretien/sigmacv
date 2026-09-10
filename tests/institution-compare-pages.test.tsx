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
import { GET as jsonGet, dynamic as jsonDynamic } from "@/app/i/compare.json/route";

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
    openalexAggregates: {
      ...aggregates({
        2023: { open: 3000, closed: 3000 },
        2024: { open: 3964, closed: 2171 },
        2026: { open: 5, closed: 5 },
      }),
      // A status OpenAlex adds later, on the partial row (no share to disturb).
      oaByStatusByYear: [
        ...aggregates({
          2023: { open: 3000, closed: 3000 },
          2024: { open: 3964, closed: 2171 },
          2026: { open: 5, closed: 5 },
        }).oaByStatusByYear,
        { year: 2026, status: "mystery", count: 5 },
      ],
      // Stored in OpenAlex's domain order (smaller count first): never re-sorted.
      domains: {
        total: 6200,
        byDomain: [
          { id: "1", name: "Life Sciences", count: 200 },
          { id: "4", name: "Health Sciences", count: 5000 },
        ],
      },
    },
    openalexFetchedAt: new Date("2026-09-01T00:00:00.000Z"),
  },
  {
    rorId: CAEN,
    name: "Université de Caen Normandie",
    country: "FR",
    openalexId: "I98702875",
    openalexAggregates: aggregates({
      2023: { open: 300, closed: 700 },
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
    ).toEqual(["50%", "65%", "30%", "33%"]);
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
    // The export link carries the canonical (sorted) ids.
    expect(html).toContain(
      `href="/i/compare.json?${[NAGOYA, CAEN]
        .sort()
        .map((id) => `ror=${id}`)
        .join("&amp;")}"`,
    );
    // Each table is named for assistive technology, and the share is spoken
    // with its counts named, the visual string hidden from the reader.
    expect(html).toContain('<caption class="visually-hidden">Nagoya University</caption>');
    expect(html).toContain(
      '<span aria-hidden="true">3,964 / 6,135 = 65%</span><span class="visually-hidden">65% — 3,964 Open copy, 6,135 Total</span>',
    );
    // The page is the wide variant of the document page.
    expect(html).toContain('class="doc-page inst-compare-page"');
    // One sparkline per column (never an overlay), named for the reader; the
    // status breakdown per column; the field mix only where the row carries it.
    expect(html.match(/<svg class="inst-spark"/g)).toHaveLength(2);
    expect(html).toContain(
      `aria-label="${fillInstitutionString(c.sparklineLabel, { name: "Nagoya University" })}"`,
    );
    expect(html).toContain(
      `<caption class="visually-hidden">${c.statusHeading} — Nagoya University</caption>`,
    );
    expect(html).toContain('<th scope="col" class="num">gold</th>');
    expect(html).not.toContain('<th scope="col" class="num">closed</th>');
    // An unknown status is shown after OpenAlex's, never dropped.
    expect(html).toMatch(/bronze<\/th><th scope="col" class="num">mystery<\/th>/);
    // The domain rows keep their stored order, whatever the counts.
    expect(body.indexOf("Life Sciences")).toBeLessThan(body.indexOf("Health Sciences"));
    expect(html.match(/<caption class="visually-hidden">OpenAlex domains — /g)).toHaveLength(1);
    expect(body).toContain("Health Sciences");
    expect(body).toContain("6,200 works in all");

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

  it("draws each trajectory over the common full years only, on a labelled fixed 0–100 axis, with a withheld year as a gap, never the partial year, and not at all for fewer than two stated shares", async () => {
    // Common years 2020–2025 (both windows 2020–2026): x = 30, 70.4, 110.8, 151.2, 191.6, 232.
    const nagoya = {
      ...ROWS[0]!,
      openalexAggregates: aggregates({
        2020: { open: 500, closed: 500 }, // 50 %  → y 29
        2021: { open: 0, closed: 500 }, // 0 %   → y 50
        2022: { open: 10, closed: 10 }, // withheld: a gap
        2023: { open: 500, closed: 0 }, // 100 % → y 8
        2024: { open: 750, closed: 250 }, // 75 %  → y 18.5
        2026: { open: 900, closed: 100 }, // the partial year: never plotted
      }),
    };
    // Caen states one share only: a lone dot is a height, so no figure.
    const caen = {
      ...ROWS[1]!,
      openalexAggregates: aggregates({ 2024: { open: 400, closed: 830 } }),
    };
    db();
    mocks.institutionFindMany.mockImplementation(async () => [nagoya, caen]);
    const html = renderToStaticMarkup(await ComparePage(props([NAGOYA, CAEN])));
    const svgs = html.match(/<svg class="inst-spark"[\s\S]*?<\/svg>/g)!;
    expect(svgs).toHaveLength(1);
    const [first] = svgs;
    expect(first).toContain('<polyline points="30,29 70.4,50" fill="none">');
    expect(first).toContain('<polyline points="151.2,8 191.6,18.5" fill="none">');
    expect(first!.match(/<polyline /g)).toHaveLength(2);
    expect(first!.match(/<circle /g)).toHaveLength(4);
    for (const [cx, cy] of [
      ["30", "29"],
      ["70.4", "50"],
      ["151.2", "8"],
      ["191.6", "18.5"],
    ]) {
      expect(first).toContain(`<circle cx="${cx}" cy="${cy}" r="2.5">`);
    }
    expect(first).not.toContain('cx="232"');
    // The axis is labelled 0 and 100, and the range's first and last year printed.
    for (const label of ["100", "0", "2020", "2025"]) {
      expect(first).toMatch(new RegExp(`<text class="inst-spark-label"[^>]*>${label}</text>`));
    }
  });

  it("prints, per column, what the last full year stood at the previous reading — with that column's date — and nothing under skew", async () => {
    const withPrevious = ROWS.map((r) => ({
      ...r,
      openalexAggregates: {
        ...(r.openalexAggregates as object),
        oaByStatusByYear: [
          { year: 2025, status: "gold", count: r.rorId === NAGOYA ? 600 : 200 },
          { year: 2025, status: "closed", count: 400 },
        ],
      },
      openalexPreviousAggregates: {
        ...(r.openalexAggregates as object),
        oaByStatusByYear: [
          { year: 2025, status: "gold", count: r.rorId === NAGOYA ? 550 : 250 },
          { year: 2025, status: "closed", count: 450 },
        ],
      },
      openalexPreviousFetchedAt: new Date(
        r.rorId === NAGOYA ? "2026-08-25T00:00:00.000Z" : "2026-08-27T00:00:00.000Z",
      ),
    }));
    db();
    mocks.institutionFindMany.mockImplementation(async (args: { where: { rorId?: unknown } }) =>
      args.where.rorId ? withPrevious.slice(0, 2) : withPrevious,
    );
    const html = renderToStaticMarkup(await ComparePage(props([CAEN, NAGOYA])));
    const body = text(html);
    expect(body).toContain(
      "At the previous reading (August 25, 2026), 2025 stood at 550 / 1,000 = 55%.",
    );
    expect(body).toContain(
      "At the previous reading (August 27, 2026), 2025 stood at 250 / 700 = 36%.",
    );

    // Skewed columns: the line goes with the shares.
    mocks.institutionFindMany.mockImplementation(async () =>
      withPrevious
        .slice(0, 2)
        .map((r) =>
          r.rorId === CAEN ? { ...r, openalexFetchedAt: new Date("2026-10-15T00:00:00.000Z") } : r,
        ),
    );
    const skewed = text(renderToStaticMarkup(await ComparePage(props([CAEN, NAGOYA]))));
    expect(skewed).not.toContain("At the previous reading");
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
    // No stated share: no trajectory is drawn at all.
    expect(html).not.toContain("inst-spark");
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

  it("exports the same comparison as counts-only JSON under CC0, with the page's rules and headers, and refuses fewer than two like the page", async () => {
    expect(jsonDynamic).toBe("force-dynamic");
    db();
    const req = (q: string) =>
      new Request(`https://sigmacv.test/i/compare.json?${q}`, {
        headers: { "x-forwarded-for": "203.0.113.9" },
      });
    const res = await jsonGet(req(`ror=${CAEN}&ror=${NAGOYA}`));
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/json; charset=utf-8");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("x-robots-tag")).toBe("noindex");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("link")).toContain("creativecommons.org/publicdomain/zero/1.0/");
    const raw = await res.text();
    const body = JSON.parse(raw) as {
      method: string;
      license: string;
      organisations: Array<{ name: string; rows: Array<Record<string, unknown>> }>;
      commonYears: number[];
    };
    expect(body.method).toBe("sigmacv-institution-comparison/v1");
    expect(body.license).toBe("CC0-1.0");
    // Alphabetical, like the page; counts only, never the page's shares.
    expect(body.organisations.map((o) => o.name)).toEqual([
      "Nagoya University",
      "Université de Caen Normandie",
    ]);
    expect(body.organisations[0]!.rows.find((r) => r.year === 2024)).toEqual({
      year: 2024,
      worksWithStatus: 6135,
      openCopies: 3964,
      noneFound: 2171,
      byStatus: { gold: 3964, closed: 2171 },
      notStatedBecause: null,
    });
    for (const banned of ["percent", "share", "%", "listed"]) expect(raw).not.toContain(banned);
    // The folded entities and counted types come from the stored row, as-is.
    const first = body.organisations[0] as unknown as {
      foldedIds: string[];
      countedWorkTypes: string[];
    };
    expect(first.foldedIds).toEqual(["I60134161", "I4210121234"]);
    expect(first.countedWorkTypes).toEqual(["article"]);
    // The same rate limit as the page: own bucket, then one charge per organisation.
    const keys = mocks.enforceRateLimit.mock.calls.map((c) => c[0]);
    expect(keys[0]).toBe("icompare:203.0.113.9");
    expect(keys.filter((k) => k === "pubpage:203.0.113.9")).toHaveLength(2);

    // Fewer than two: a 404 that says why, as the page does; never an echo of a bad id.
    db({ [NAGOYA]: 3 });
    const miss = await jsonGet(req(`ror=${NAGOYA}&ror=${CHU}&ror=x'`));
    expect(miss.status).toBe(404);
    const missBody = (await miss.json()) as { error: string; dropped: unknown[] };
    expect(missBody.error).toBe("nothing-to-set-side-by-side");
    expect(missBody.dropped).toEqual([{ rorId: CHU, reason: "no-page" }]);
    expect(JSON.stringify(missBody)).not.toContain("x'");

    // Rate-limited: a JSON 429 with Retry-After — the refusing bucket's own.
    mocks.enforceRateLimit.mockReset();
    mocks.enforceRateLimit.mockResolvedValue({ ok: false, retryAfterSec: 30 });
    const limited = await jsonGet(req(`ror=${CAEN}&ror=${NAGOYA}`));
    expect(limited.status).toBe(429);
    expect(limited.headers.get("retry-after")).toBe("30");
    expect(limited.headers.get("access-control-expose-headers")).toContain("Retry-After");
    expect(((await limited.json()) as { error: string }).error).toBe("rate-limited");
    mocks.enforceRateLimit.mockReset();
    mocks.enforceRateLimit.mockImplementation(async (key: string) =>
      key.startsWith("pubpage:") ? { ok: false, retryAfterSec: 45 } : { ok: true },
    );
    const pub = await jsonGet(req(`ror=${CAEN}&ror=${NAGOYA}`));
    expect(pub.status).toBe(429);
    expect(pub.headers.get("retry-after")).toBe("45");
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
