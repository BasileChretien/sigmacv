import { beforeEach, describe, expect, it, vi } from "vitest";

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
  enforceRateLimit: vi.fn(),
  warn: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: { cv: { count: mocks.count, findMany: mocks.findMany } },
}));
vi.mock("@/lib/rateLimitStore", () => ({ enforceRateLimit: mocks.enforceRateLimit }));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: mocks.warn, error: vi.fn() } }));

import { GET as csvGet } from "@/app/i/[ror]/reconciliation.csv/route";
import { GET as jsonGet } from "@/app/i/[ror]/reconciliation.json/route";
import { Prisma } from "@/generated/prisma/client";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { __resetPublicPageCache } from "@/lib/cv/publicPageCache";
import { freezeCanonical } from "@/lib/cv/snapshots";
import {
  RECONCILIATION_ROW_LIMIT,
  countReconciliationSources,
  reconciliationSources,
} from "@/lib/cv/listed";
import { isKnownInstitutionMiss } from "@/lib/institutions/institutions";
import {
  assembleReconciliationExport,
  reconciliationExport,
} from "@/lib/institutions/reconciliation";
import {
  RECONCILIATION_COLUMNS,
  storedReconciliationRows,
} from "@/lib/institutions/reconciliationRows";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

/**
 * The reconciliation export end to end, database mocked: the reader's SQL
 * gate (seven columns, the lapse rule included, no live document and no
 * frozen document — only the rows stored at designation), the assembler
 * (the stored rows parsed back, the lapse rule on the ids, the bound), and
 * the two route handlers (shape validation, the known-miss rule, the headers,
 * RFC 4180, the JSON envelope, no forbidden word anywhere).
 */

const ROR = "04chrp450";
const OTHER = "02kpeqv85";
const ORCID = "0000-0002-7483-2489";
const FROZEN_AT = new Date("2026-09-08T10:00:00Z");

const DOC = buildCanonicalCv({
  id: "cv1",
  resolved: { orcid: ORCID, authorIds: ["A5001069481", "A5136414971"], displayName: "Ada" },
  works: worksFixture as unknown as OpenAlexWork[],
  employments: [{ putCode: "cur", organization: "Nagoya University", startYear: 2024, rorId: ROR }],
  now: "2026-09-08T00:00:00.000Z",
});
/** What a snapshot row stores as its document: the frozen copy. */
const FROZEN = freezeCanonical(DOC);
/** What the designation stored beside it: the export's work rows. */
const VERSION = {
  snapshotVersion: 2,
  contentHash: "ab".repeat(32),
  frozenAt: FROZEN_AT.toISOString(),
};
const STORED = storedReconciliationRows(FROZEN, VERSION);

/** One reader row, as the select shapes it. */
function source(over: Record<string, unknown> = {}) {
  return {
    consentedRorIds: [ROR, OTHER],
    visibleCurrentRorIds: [ROR],
    user: { orcid: ORCID },
    snapshots: [{ version: 2, reconciliationRows: STORED }],
    ...over,
  };
}

const DESIGNATED = {
  forReconciliation: true,
  isPublic: true,
  reconciliationRows: { not: Prisma.AnyNull },
};
const WHERE = {
  showOnInstitutionPage: true,
  shareReconciliationRows: true,
  published: true,
  publicIndexable: true,
  consentedRorIds: { has: ROR },
  visibleCurrentRorIds: { has: ROR },
  user: { orcid: { not: null } },
  snapshots: { some: DESIGNATED },
};

/** The plan's veto on compliance states, as words that may never appear. */
const FORBIDDEN_SUBSTRINGS = ["compliant", "overdue", "%"];
const FORBIDDEN_WORDS = /\b(shares?|rates?)\b/i;
function expectNoForbiddenWord(text: string, what: string) {
  for (const w of FORBIDDEN_SUBSTRINGS)
    expect(text.toLowerCase(), `${what}: ${w}`).not.toContain(w);
  expect(text, what).not.toMatch(FORBIDDEN_WORDS);
}

const req = (ror: string, ext: string) =>
  new Request(`https://sigmacv.test/i/${ror}/reconciliation.${ext}`, {
    headers: { "x-forwarded-for": "203.0.113.9" },
  });
const params = (ror: string) => ({ params: Promise.resolve({ ror }) });

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  __resetPublicPageCache();
  mocks.enforceRateLimit.mockResolvedValue({ ok: true });
  mocks.count.mockResolvedValue(1);
  mocks.findMany.mockResolvedValue([source()]);
});

describe("reconciliationSources (listed.ts — database only)", () => {
  it("filters on the seven columns in SQL, joins the designated public version's STORED rows, selects the User's ORCID and never a document — live or frozen", async () => {
    const out = await reconciliationSources(ROR);
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: WHERE,
      select: {
        consentedRorIds: true,
        visibleCurrentRorIds: true,
        user: { select: { orcid: true } },
        snapshots: {
          where: DESIGNATED,
          select: { version: true, reconciliationRows: true },
          orderBy: { version: "desc" },
          take: 1,
        },
      },
      orderBy: { id: "asc" },
      take: RECONCILIATION_ROW_LIMIT + 1,
    });
    const args = mocks.findMany.mock.calls[0]![0] as {
      select: Record<string, unknown> & { snapshots: { select: Record<string, unknown> } };
    };
    expect(args.select).not.toHaveProperty("document");
    expect(args.select.snapshots.select).not.toHaveProperty("canonical");
    expect(out).toEqual({
      sources: [
        {
          orcid: ORCID,
          consentedRorIds: [ROR, OTHER],
          visibleCurrentRorIds: [ROR],
          snapshot: { version: 2, reconciliationRows: STORED },
        },
      ],
      truncated: false,
      limit: RECONCILIATION_ROW_LIMIT,
    });
    expect(RECONCILIATION_ROW_LIMIT).toBe(1000);
  });

  it("applies the bound and reports truncation from the one extra row it fetches", async () => {
    mocks.findMany.mockResolvedValue([source(), source(), source()]);
    const out = await reconciliationSources(ROR, { limit: 2 });
    expect(mocks.findMany.mock.calls[0]![0]).toMatchObject({ take: 3 });
    expect(out.sources).toHaveLength(2);
    expect(out.truncated).toBe(true);
    expect(out.limit).toBe(2);
    mocks.findMany.mockResolvedValue([source(), source()]);
    expect((await reconciliationSources(ROR, { limit: 2 })).truncated).toBe(false);
  });

  it("carries a null ORCID through (the assembler skips it) and the count uses the same gate", async () => {
    mocks.findMany.mockResolvedValue([source({ user: { orcid: null } })]);
    expect((await reconciliationSources(ROR)).sources[0]?.orcid).toBeNull();
    mocks.count.mockResolvedValue(4);
    await expect(countReconciliationSources(ROR)).resolves.toBe(4);
    expect(mocks.count).toHaveBeenCalledWith({ where: WHERE });
  });
});

describe("assembleReconciliationExport / reconciliationExport", () => {
  it("builds the rows from the stored frozen version, with the active consented ids only, and the envelope", async () => {
    const now = new Date("2026-09-09T12:00:00Z");
    const out = await reconciliationExport(ROR, now);
    expect(out.ror).toBe(ROR);
    expect(out.generatedAt).toBe("2026-09-09T12:00:00.000Z");
    expect(out.contributorCount).toBe(1);
    expect(out.truncated).toBe(false);
    expect(out.rowCount).toBe(out.rows.length);
    expect(out.rows.length).toBeGreaterThan(0);
    for (const row of out.rows) {
      expect(Object.keys(row)).toEqual([...RECONCILIATION_COLUMNS]);
      expect(row.orcid).toBe(ORCID);
      // The lapsed id (OTHER is not a visible current position) never rides a row.
      expect(row.ror_ids).toBe(ROR);
      expect(row.snapshot_version).toBe(2);
      expect(row.content_hash).toBe("ab".repeat(32));
      expect(row.frozen_at).toBe("2026-09-08T10:00:00.000Z");
    }
    // Only what the frozen public version lists: the "not mine" works of the
    // stored document are absent, and no row is invented.
    const notMine = FROZEN.sections.flatMap((s) => s.items).filter((it) => it.notMine);
    for (const it of notMine) expect(out.rows.map((r) => r.item_id)).not.toContain(it.id);
    expectNoForbiddenWord(JSON.stringify(out), "envelope");
  });

  it("skips (and does not count) a source with no ORCID or a tampered stored value, and keeps the reader's truncation", () => {
    const tampered = [
      // A verdict added to a row.
      { v: 1, rows: [{ ...STORED.rows[0]!, compliant: false }] },
      // Not the stored shape at all.
      { nope: true },
      null,
      "rows",
    ];
    const out = assembleReconciliationExport(
      ROR,
      {
        sources: [
          source() as never,
          source({ user: { orcid: null } }) as never,
          ...tampered.map(
            (reconciliationRows) =>
              source({ snapshots: [{ version: 1, reconciliationRows }] }) as never,
          ),
        ].map((s) => ({
          orcid: (s as { user: { orcid: string | null } }).user.orcid,
          consentedRorIds: [ROR],
          visibleCurrentRorIds: [ROR],
          snapshot: (s as { snapshots: unknown[] }).snapshots[0] as never,
        })),
        truncated: true,
        limit: 1000,
      },
      new Date("2026-09-09T12:00:00Z"),
    );
    expect(out.contributorCount).toBe(1);
    expect(out.rowCount).toBe(STORED.rows.length);
    expect(out.truncated).toBe(true);
    expect(JSON.stringify(out)).not.toContain("compliant");
    expect(mocks.warn).toHaveBeenCalledTimes(tampered.length);
    expect(mocks.warn).toHaveBeenCalledWith("reconciliation.stored_rows_invalid", {
      rorId: ROR,
      version: 1,
    });
  });

  it("with no source, is an empty export", async () => {
    mocks.findMany.mockResolvedValue([]);
    const out = await reconciliationExport(ROR);
    expect(out).toMatchObject({ rowCount: 0, contributorCount: 0, truncated: false, rows: [] });
  });
});

describe("/i/[ror]/reconciliation.csv and .json", () => {
  it("serve a download that is never indexed nor cached, with the agreed filename and an inert content type", async () => {
    const csv = await csvGet(req(ROR, "csv"), params(ROR));
    expect(csv.status).toBe(200);
    expect(csv.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(csv.headers.get("Content-Disposition")).toBe(
      `attachment; filename="sigmacv-reconciliation-${ROR}.csv"`,
    );
    expect(csv.headers.get("Cache-Control")).toBe("no-store");
    expect(csv.headers.get("X-Robots-Tag")).toBe("noindex");
    expect(csv.headers.get("X-Content-Type-Options")).toBe("nosniff");
    const json = await jsonGet(req(ROR, "json"), params(ROR));
    expect(json.status).toBe(200);
    expect(json.headers.get("Content-Type")).toBe("application/json; charset=utf-8");
    expect(json.headers.get("Content-Disposition")).toBe(
      `attachment; filename="sigmacv-reconciliation-${ROR}.json"`,
    );
    expect(json.headers.get("Cache-Control")).toBe("no-store");
    expect(json.headers.get("X-Robots-Tag")).toBe("noindex");
  });

  it("CSV: RFC 4180 — header first, every field quoted, a title with a quote, a comma and a newline stays one record, no BOM", async () => {
    const title = 'A "quoted", two-line\ntitle';
    // One listed work, retitled on the frozen document the rows were
    // computed from at designation.
    let retitled = false;
    const canonical = {
      ...FROZEN,
      sections: FROZEN.sections.map((s) => ({
        ...s,
        items: s.items.flatMap((it) => {
          if (!it.csl || it.notMine || retitled) return [];
          retitled = true;
          return [{ ...it, csl: { ...it.csl, title } }];
        }),
      })),
    };
    expect(retitled).toBe(true);
    const stored = storedReconciliationRows(canonical, { ...VERSION, snapshotVersion: 1 });
    expect(stored.rows).toHaveLength(1);
    mocks.findMany.mockResolvedValue([
      source({ snapshots: [{ version: 1, reconciliationRows: stored }] }),
    ]);
    const res = await csvGet(req(ROR, "csv"), params(ROR));
    const text = await res.text();
    expect(text.charCodeAt(0)).not.toBe(0xfeff);
    const records = text.split("\r\n");
    expect(records[0]).toBe(RECONCILIATION_COLUMNS.map((c) => `"${c}"`).join(","));
    expect(records.at(-1)).toBe("");
    // Exactly one data record (two CRLFs in total): the bare LF inside the
    // title never became a record separator.
    expect(text.match(/\r\n/g)).toHaveLength(2);
    expect(text).toContain('"A ""quoted"", two-line\ntitle"');
    expect(text).toContain(`"${ORCID}"`);
    expectNoForbiddenWord(text, "csv");
  });

  it("JSON: the envelope { ror, generatedAt, rowCount, contributorCount, truncated, rows } and nothing else — no aggregate, no ratio", async () => {
    const res = await jsonGet(req(ROR, "json"), params(ROR));
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.keys(body)).toEqual([
      "ror",
      "generatedAt",
      "rowCount",
      "contributorCount",
      "truncated",
      "rows",
    ]);
    expect(body.ror).toBe(ROR);
    expect(body.contributorCount).toBe(1);
    expect(body.truncated).toBe(false);
    const rows = body.rows as Array<Record<string, unknown>>;
    expect(body.rowCount).toBe(rows.length);
    for (const row of rows) expect(Object.keys(row)).toEqual([...RECONCILIATION_COLUMNS]);
    expectNoForbiddenWord(JSON.stringify(body), "json");
  });

  it("404s an id that is not ROR-shaped, and a ROR nobody is listed under (remembered as a miss, like the page)", async () => {
    for (const bad of ["04CHRP450", "https://ror.org/04chrp450", "../x", "04chrp450\n", ""]) {
      const res = await csvGet(req(bad, "csv"), params(bad));
      expect(res.status, bad).toBe(404);
      expect(res.headers.get("X-Robots-Tag")).toBe("noindex");
      expect(res.headers.get("Cache-Control")).toBe("no-store");
    }
    expect(mocks.count).not.toHaveBeenCalled();
    mocks.count.mockResolvedValue(0);
    expect((await jsonGet(req(ROR, "json"), params(ROR))).status).toBe(404);
    expect(isKnownInstitutionMiss(ROR)).toBe(true);
    // The miss is remembered: the next request costs no Cv read at all.
    mocks.count.mockClear();
    expect((await csvGet(req(ROR, "csv"), params(ROR))).status).toBe(404);
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("with a page but nobody sharing rows, serves an EMPTY export rather than a 404", async () => {
    mocks.count.mockResolvedValue(2);
    mocks.findMany.mockResolvedValue([]);
    const csv = await csvGet(req(ROR, "csv"), params(ROR));
    expect(csv.status).toBe(200);
    expect(await csv.text()).toBe(`${RECONCILIATION_COLUMNS.map((c) => `"${c}"`).join(",")}\r\n`);
    const json = (await (await jsonGet(req(ROR, "json"), params(ROR))).json()) as {
      rowCount: number;
      rows: unknown[];
    };
    expect(json.rowCount).toBe(0);
    expect(json.rows).toEqual([]);
  });

  it("shares the public pages' rate limit and 429s with Retry-After before any read", async () => {
    mocks.enforceRateLimit.mockResolvedValue({ ok: false, retryAfterSec: 30 });
    const res = await jsonGet(req(ROR, "json"), params(ROR));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    expect(mocks.enforceRateLimit.mock.calls[0]![0]).toBe("pubpage:203.0.113.9");
    expect(mocks.count).not.toHaveBeenCalled();
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it("takes no parameter beyond the ROR id: a query string changes nothing (the plan's 'Institution input' veto)", async () => {
    const plain = await (await jsonGet(req(ROR, "json"), params(ROR))).json();
    const withQuery = await (
      await jsonGet(
        new Request(
          `https://sigmacv.test/i/${ROR}/reconciliation.json?from=2020&orcid=x&only=closed`,
        ),
        params(ROR),
      )
    ).json();
    expect({ ...(withQuery as object), generatedAt: "" }).toEqual({
      ...(plain as object),
      generatedAt: "",
    });
    // The where clause never carries anything from the request.
    for (const call of mocks.findMany.mock.calls) expect(call[0].where).toEqual(WHERE);
  });
});
