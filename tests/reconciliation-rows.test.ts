import { describe, expect, it } from "vitest";
import type { CanonicalCv, CvItem, CvSectionType } from "@/lib/canonical/schema";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import { freezeCanonical } from "@/lib/cv/snapshots";
import { OPEN_ACCESS_STATES } from "@/lib/cv/worklist";
import { computeCvAggregates, listedWorks } from "@/lib/institutions/cvAggregates";
import {
  RECONCILIATION_COLUMNS,
  RECONCILIATION_ROWS_VERSION,
  RECONCILIATION_WORK_COLUMNS,
  parseReconciliationWorkRows,
  reconciliationCsv,
  reconciliationRows,
  reconciliationWorkRows,
  storedReconciliationRows,
  withIdentity,
  type ReconciliationContext,
  type ReconciliationRow,
} from "@/lib/institutions/reconciliationRows";
import { workRecords } from "@/lib/oai/oai";

/**
 * The per-work rows of the institution reconciliation export: EXACTLY the
 * works the researcher's frozen public version lists, one row each, with the
 * fourteen agreed columns and nothing else — no verdict, no percentage, no
 * funder, no citation count, nothing from `meta` beyond the listed fields.
 */

type Meta = Record<string, unknown>;

function item(id: string, meta: Meta, extra: Partial<CvItem> = {}): CvItem {
  return {
    id,
    included: true,
    csl: { id, type: "article-journal", title: `Work ${id}`, DOI: `10.5555/${id}` },
    meta,
    ...extra,
  } as unknown as CvItem;
}

function section(
  id: string,
  type: CvSectionType,
  items: CvItem[],
  order: number,
  visible = true,
): CanonicalCv["sections"][number] {
  return { id, type, title: id, visible, order, items } as CanonicalCv["sections"][number];
}

function doc(
  sections: CanonicalCv["sections"],
  display: Record<string, unknown> = {},
): CanonicalCv {
  return {
    schemaVersion: 2,
    owner: { displayName: "Ada Lovelace", orcid: "0000-0002-7483-2489" },
    display: { locale: "en-US", cslStyle: "apa", ...display },
    sections,
  } as unknown as CanonicalCv;
}

/** Every way a work can be listed, flagged or kept off the page. */
function fixture(): CanonicalCv {
  return doc([
    section(
      "publications",
      "publications",
      [
        item("p-cc", { year: 2020, oaIsOpen: true, license: "cc-by", oaUrl: "https://x.org/a" }),
        item("p-other", { year: 2020, oaIsOpen: true, license: "publisher-specific-oa" }),
        item("p-closed", { year: 2021, oaIsOpen: false, citedByCount: 12, fwci: 1.4 }),
        item("p-unknown", { year: 2021, funders: [{ name: "Wellcome" }] }),
        item("p-noyear", { oaIsOpen: true, oaUrl: "javascript:alert(1)" }),
        item("p-override", { year: 2019, yearOverride: 2022, oaIsOpen: false }),
        item("p-retracted", { year: 2021, oaIsOpen: true, retracted: true }),
        item("p-notmine", { year: 2021 }, { notMine: true }),
        item("p-hidden", { year: 2021 }, { included: false }),
        item("p-excluded", { year: 2021 }),
      ],
      0,
    ),
    section("preprints", "preprints", [item("pre-1", { year: 2023, peerReviewed: false })], 1),
    section("datasets", "datasets", [item("d-1", { year: 2023 })], 2, false),
  ]);
}

const EXCLUDED = { excludedItems: { publications: ["p-excluded"] } };

const CTX: ReconciliationContext = {
  orcid: "0000-0002-7483-2489",
  activeRorIds: ["04chrp450", "02kpeqv85"],
  snapshotVersion: 3,
  contentHash: "ab".repeat(32),
  frozenAt: "2026-09-08T10:00:00.000Z",
};

/** The stored frozen document, as the export reads it. */
const frozen = (cv: CanonicalCv) => freezeCanonical(cv);

/** The plan's veto on compliance states, as words that may never appear in
 *  a header or a cell: substrings for the verdicts and the sign, whole words
 *  for the two nouns (a title may say "generated", never "rate"). */
const FORBIDDEN_SUBSTRINGS = ["compliant", "non-compliant", "overdue", "%"];
const FORBIDDEN_WORDS = /\b(shares?|rates?)\b/i;
function expectNoForbiddenWord(text: string, what: string) {
  for (const w of FORBIDDEN_SUBSTRINGS)
    expect(text.toLowerCase(), `${what}: ${w}`).not.toContain(w);
  expect(text, what).not.toMatch(FORBIDDEN_WORDS);
}

describe("listedWorks (the shared work-set predicate)", () => {
  it("is exactly the OAI-PMH per-work set plus the retracted works the page still shows, and is what the aggregate counts", () => {
    const cv = doc(fixture().sections, EXCLUDED);
    const listed = listedWorks(cv);
    const records = workRecords({
      slug: "ada-x7",
      datestamp: new Date("2026-09-09T00:00:00Z"),
      cv: projectCvForPublic(cv),
    });
    expect(
      listed
        .filter((w) => !w.item.meta.retracted)
        .map((w) => w.item.id)
        .sort(),
    ).toEqual(records.map((r) => r.itemId).sort());
    expect(listed.map((w) => w.item.id)).toContain("p-retracted");
    expect(listed.find((w) => w.item.id === "pre-1")?.sectionType).toBe("preprints");
    expect(computeCvAggregates(cv).worksTotal).toBe(records.length);
    // The owner's "hide retracted" choice narrows the set exactly like the page.
    const hidden = listedWorks(doc(fixture().sections, { ...EXCLUDED, hideRetracted: true }));
    expect(hidden.map((w) => w.item.id)).not.toContain("p-retracted");
  });
});

describe("reconciliationRows", () => {
  it("has exactly the fourteen agreed columns, in order, on every row", () => {
    expect(RECONCILIATION_COLUMNS).toEqual([
      "orcid",
      "ror_ids",
      "item_id",
      "doi",
      "title",
      "year",
      "section_type",
      "oa_state",
      "license",
      "oa_url",
      "retracted",
      "snapshot_version",
      "content_hash",
      "frozen_at",
    ]);
    const rows = reconciliationRows(frozen(doc(fixture().sections, EXCLUDED)), CTX);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(Object.keys(row)).toEqual([...RECONCILIATION_COLUMNS]);
  });

  it("lists exactly the works the frozen public version lists — never a hidden, 'not mine', view-excluded or unlisted-section work", () => {
    const cv = doc(fixture().sections, EXCLUDED);
    const rows = reconciliationRows(frozen(cv), CTX);
    const records = workRecords({
      slug: "ada-x7",
      datestamp: new Date("2026-09-09T00:00:00Z"),
      cv: projectCvForPublic(cv),
    });
    const ids = rows.map((r) => r.item_id);
    expect(ids.filter((id) => id !== "p-retracted").sort()).toEqual(
      records.map((r) => r.itemId).sort(),
    );
    for (const absent of ["p-notmine", "p-hidden", "p-excluded", "d-1"]) {
      expect(ids).not.toContain(absent);
    }
    // No row is ever invented: the set is the frozen document's, not the live one.
    expect(reconciliationRows(frozen(doc([], EXCLUDED)), CTX)).toEqual([]);
  });

  it("carries the four open-access states of the owner worklist, and only those", () => {
    const rows = reconciliationRows(frozen(fixture()), CTX);
    const state = (id: string) => rows.find((r) => r.item_id === id)?.oa_state;
    expect(state("p-cc")).toBe("open-cc");
    expect(state("p-other")).toBe("open-other");
    expect(state("p-closed")).toBe("no-open-copy-found");
    expect(state("p-unknown")).toBe("not-determined");
    for (const row of rows) expect(OPEN_ACCESS_STATES).toContain(row.oa_state);
  });

  it("flags a retracted work the page shows, and drops it when the owner hides retracted works", () => {
    const rows = reconciliationRows(frozen(fixture()), CTX);
    expect(rows.find((r) => r.item_id === "p-retracted")?.retracted).toBe(true);
    expect(rows.filter((r) => r.retracted)).toHaveLength(1);
    const hidden = reconciliationRows(
      frozen(doc(fixture().sections, { hideRetracted: true })),
      CTX,
    );
    expect(hidden.map((r) => r.item_id)).not.toContain("p-retracted");
  });

  it("fills the identity and version columns from the context, the rest from the work itself", () => {
    const rows = reconciliationRows(frozen(fixture()), CTX);
    const cc = rows.find((r) => r.item_id === "p-cc")!;
    expect(cc).toEqual({
      orcid: "0000-0002-7483-2489",
      ror_ids: "04chrp450;02kpeqv85",
      item_id: "p-cc",
      doi: "10.5555/p-cc",
      title: "Work p-cc",
      year: 2020,
      section_type: "publications",
      oa_state: "open-cc",
      license: "cc-by",
      oa_url: "https://x.org/a",
      retracted: false,
      snapshot_version: 3,
      content_hash: "ab".repeat(32),
      frozen_at: "2026-09-08T10:00:00.000Z",
    });
    // The owner's year override is the effective year; no year is null.
    expect(rows.find((r) => r.item_id === "p-override")?.year).toBe(2022);
    expect(rows.find((r) => r.item_id === "p-noyear")?.year).toBeNull();
    // Absent fields are null, never "undefined" or an empty string.
    const closed = rows.find((r) => r.item_id === "p-closed")!;
    expect(closed.license).toBeNull();
    expect(closed.oa_url).toBeNull();
    // Only an http(s) URL is ever emitted.
    expect(rows.find((r) => r.item_id === "p-noyear")?.oa_url).toBeNull();
    // The section type is the frozen section's, per work.
    expect(rows.find((r) => r.item_id === "pre-1")?.section_type).toBe("preprints");
    // A null hash (a version frozen before the hash existed) stays null.
    expect(
      reconciliationRows(frozen(fixture()), { ...CTX, contentHash: null })[0]?.content_hash,
    ).toBeNull();
  });

  it("normalises the DOI (lower-cased, doi.org prefix removed) and carries null without one", () => {
    const cv = doc([
      section(
        "publications",
        "publications",
        [
          item("upper", { year: 2020 }, {
            csl: { id: "upper", type: "article-journal", title: "T", DOI: "10.5555/ABC" },
          } as Partial<CvItem>),
          item("url", { year: 2020 }, {
            csl: {
              id: "url",
              type: "article-journal",
              title: "T",
              DOI: "https://doi.org/10.5555/xyz",
            },
          } as Partial<CvItem>),
          item("none", { year: 2020 }, {
            csl: { id: "none", type: "article-journal", title: "T" },
          } as Partial<CvItem>),
        ],
        0,
      ),
    ]);
    const rows = reconciliationRows(frozen(cv), CTX);
    expect(rows.map((r) => r.doi)).toEqual(["10.5555/abc", "10.5555/xyz", null]);
    // A missing title is null too.
    const untitled = doc([
      section(
        "publications",
        "publications",
        [
          item("t", { year: 2020 }, {
            csl: { id: "t", type: "article-journal" },
          } as Partial<CvItem>),
        ],
        0,
      ),
    ]);
    expect(reconciliationRows(frozen(untitled), CTX)[0]?.title).toBeNull();
  });

  it("carries no verdict, no percentage, no funder, no citation count and nothing else from meta", () => {
    const rows = reconciliationRows(frozen(fixture()), CTX);
    const text = JSON.stringify(rows);
    expectNoForbiddenWord(text, "rows");
    for (const leaked of ["Wellcome", "citedByCount", "fwci", "funders", "12", "1.4"]) {
      expect(text, leaked).not.toContain(leaked);
    }
    expect(text).not.toContain("compliance");
  });

  it("joins the active consented ids only — a lapsed id never rides a row", () => {
    const rows = reconciliationRows(frozen(fixture()), { ...CTX, activeRorIds: ["04chrp450"] });
    for (const row of rows) expect(row.ror_ids).toBe("04chrp450");
  });
});

describe("the two halves: work rows stored at designation, identity added per request", () => {
  const VERSION = { snapshotVersion: 3, contentHash: "ab".repeat(32), frozenAt: CTX.frozenAt };

  it("the work columns are every column but the two identity ones, and a work row carries exactly those", () => {
    expect(RECONCILIATION_WORK_COLUMNS).toEqual(RECONCILIATION_COLUMNS.slice(2));
    const rows = reconciliationWorkRows(frozen(fixture()), VERSION);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(Object.keys(row)).toEqual([...RECONCILIATION_WORK_COLUMNS]);
    // Nothing identifies the researcher in the stored half.
    expect(JSON.stringify(rows)).not.toContain(CTX.orcid);
    expect(JSON.stringify(rows)).not.toContain("04chrp450");
  });

  it("withIdentity(reconciliationWorkRows(...)) is reconciliationRows(...), key order included", () => {
    const stored = storedReconciliationRows(frozen(fixture()), VERSION);
    expect(stored.v).toBe(RECONCILIATION_ROWS_VERSION);
    const composed = withIdentity(stored.rows, {
      orcid: CTX.orcid,
      activeRorIds: CTX.activeRorIds,
    });
    const direct = reconciliationRows(frozen(fixture()), CTX);
    expect(composed).toEqual(direct);
    for (const row of composed) expect(Object.keys(row)).toEqual([...RECONCILIATION_COLUMNS]);
    // The stored half never changes when the identity does.
    expect(
      withIdentity(stored.rows, { orcid: "0000-0003-0449-6261", activeRorIds: [] })[0],
    ).toEqual({ ...direct[0], orcid: "0000-0003-0449-6261", ror_ids: "" });
  });

  it("parses the stored value back exactly, and refuses anything else — a stored row is external data", () => {
    const stored = storedReconciliationRows(frozen(fixture()), VERSION);
    const roundTrip = JSON.parse(JSON.stringify(stored)) as unknown;
    expect(parseReconciliationWorkRows(roundTrip)).toEqual(stored.rows);
    expect(parseReconciliationWorkRows({ v: RECONCILIATION_ROWS_VERSION, rows: [] })).toEqual([]);
    const row = stored.rows[0]!;
    for (const bad of [
      null,
      undefined,
      "rows",
      [],
      { rows: stored.rows },
      { v: 2, rows: stored.rows },
      // A verdict smuggled into a row.
      { v: 1, rows: [{ ...row, compliant: true }] },
      // A field of the wrong shape.
      { v: 1, rows: [{ ...row, oa_state: "open" }] },
      { v: 1, rows: [{ ...row, year: "2020" }] },
      { v: 1, rows: [{ ...row, retracted: "no" }] },
      { v: 1, rows: [{ ...row, item_id: "" }] },
      { v: 1, rows: [{ ...row, snapshot_version: 0 }] },
      // A missing field.
      { v: 1, rows: [Object.fromEntries(Object.entries(row).filter(([k]) => k !== "doi"))] },
      { v: 1, rows: [row, "x"] },
    ]) {
      expect(parseReconciliationWorkRows(bad), JSON.stringify(bad)).toBeNull();
    }
  });
});

describe("reconciliationCsv (RFC 4180)", () => {
  it("writes the header first, quotes every field, doubles inner quotes, ends records with CRLF and has no BOM", () => {
    const cv = doc([
      section(
        "publications",
        "publications",
        [
          item("q", { year: 2021, oaIsOpen: false }, {
            csl: {
              id: "q",
              type: "article-journal",
              title: 'A "quoted", two-line\ntitle',
              DOI: "10.1/q",
            },
          } as Partial<CvItem>),
        ],
        0,
      ),
    ]);
    const csv = reconciliationCsv(reconciliationRows(frozen(cv), CTX));
    expect(csv.charCodeAt(0)).not.toBe(0xfeff);
    const records = csv.split("\r\n");
    expect(records.at(-1)).toBe("");
    expect(records[0]).toBe(RECONCILIATION_COLUMNS.map((c) => `"${c}"`).join(","));
    // One data record: the embedded newline stays inside its quoted field, so
    // the record is the whole remainder.
    expect(records.slice(1, -1).join("\r\n")).toBe(
      [
        '"0000-0002-7483-2489"',
        '"04chrp450;02kpeqv85"',
        '"q"',
        '"10.1/q"',
        '"A ""quoted"", two-line\ntitle"',
        '"2021"',
        '"publications"',
        '"no-open-copy-found"',
        '""',
        '""',
        '"false"',
        '"3"',
        `"${"ab".repeat(32)}"`,
        '"2026-09-08T10:00:00.000Z"',
      ].join(","),
    );
    // Bare LFs never become record separators: only the CRLF pair does.
    expect(csv.match(/\r\n/g)).toHaveLength(2);
  });

  it("with no rows, is the header alone", () => {
    expect(reconciliationCsv([])).toBe(
      `${RECONCILIATION_COLUMNS.map((c) => `"${c}"`).join(",")}\r\n`,
    );
  });

  it("neutralises a cell a spreadsheet would evaluate (OWASP CSV injection) with a leading quote — and leaves the JSON row untouched", () => {
    const rowFor = (title: string): ReconciliationRow => ({
      orcid: "0000-0002-7483-2489",
      ror_ids: "04chrp450",
      item_id: "w",
      doi: null,
      title,
      year: 2021,
      section_type: "publications",
      oa_state: "not-determined",
      license: null,
      oa_url: null,
      retracted: false,
      snapshot_version: 1,
      content_hash: null,
      frozen_at: "2026-09-08T10:00:00.000Z",
    });
    /** The quoted fields of one record (every field is quoted; an inner quote
     *  is doubled), raw — the doubling is kept so the assertions read as the
     *  bytes on the wire. */
    const fields = (record: string) => [...record.matchAll(/"((?:[^"]|"")*)"/g)].map((m) => m[1]!);
    const cell = (title: string) => {
      const row = rowFor(title);
      const csv = reconciliationCsv([row]);
      const record = csv.split("\r\n")[1]!;
      // The JSON row is the caller's object, verbatim: no quote was added there.
      expect(row.title).toBe(title);
      expect(JSON.parse(JSON.stringify(row)).title).toBe(title);
      return fields(record)[4]!;
    };
    expect(cell('=HYPERLINK("https://evil.example","x")')).toBe(
      '\'=HYPERLINK(""https://evil.example"",""x"")',
    );
    expect(cell("+1")).toBe("'+1");
    expect(cell("-1")).toBe("'-1");
    expect(cell("@x")).toBe("'@x");
    expect(cell("\tcmd")).toBe("'\tcmd");
    expect(cell("\rcmd")).toBe("'\rcmd");
    // A normal title, one with the sign inside, and one starting with a digit
    // or a letter stay as they are.
    expect(cell("A plain title")).toBe("A plain title");
    expect(cell("Effect of x = y on z")).toBe("Effect of x = y on z");
    expect(cell("2 + 2")).toBe("2 + 2");
    // Only string cells are ever prefixed: a negative-looking number field is
    // not a string here (years are positive anyway) and booleans are spelled.
    const csv = reconciliationCsv([{ ...rowFor("t"), year: -1 }]);
    expect(fields(csv.split("\r\n")[1]!)[5]).toBe("-1");
  });

  it("never carries a forbidden word in the header or in any cell", () => {
    const csv = reconciliationCsv(reconciliationRows(frozen(fixture()), CTX));
    expectNoForbiddenWord(csv, "csv");
  });
});
