import { describe, expect, it } from "vitest";
import { assertNotXlsx, matchColumns, parseCsvLine, rowToRecord } from "../scripts/forrt-import";

/** The live FReD OSF export's header, verified 2026-09-04 (see the module doc
 *  comment in scripts/forrt-import.ts). */
const LIVE_HEADER = [
  "entry_id",
  "effect_id",
  "fred_id",
  "ref_o",
  "doi_o",
  "study_o",
  "ref_r",
  "doi_r",
  "url_r",
  "study_r",
  "author_overlap",
  "author_overlap_pct",
  "discipline",
  "tags",
  "description",
  "claim_text_o",
  "claim_page_o",
  "n_o",
  "es_value_o",
  "es_type_o",
  "es_repr_o",
  "pval_value_o",
  "pval_type_o",
  "pval_tails_o",
  "nested_o",
  "prereg_o",
  "n_r",
  "es_value_r",
  "es_type_r",
  "es_repr_r",
  "pval_value_r",
  "pval_type_r",
  "pval_tails_r",
  "nested_r",
  "prereg_r",
  "reported_success",
  "reported_success_quote",
  "reported_success_quote_source",
  "title_o",
  "author_o",
  "journal_o",
  "year_o",
  "volume_o",
  "issue_o",
  "pages_o",
  "title_r",
  "author_r",
  "journal_r",
  "year_r",
  "volume_r",
  "issue_r",
  "pages_r",
  "bibtex_o",
  "bibtex_r",
  "language_o",
  "language_r",
];

describe("parseCsvLine", () => {
  it("splits a plain comma-separated line", () => {
    expect(parseCsvLine("a,b,c")).toEqual(["a", "b", "c"]);
  });

  it("handles quoted fields containing commas", () => {
    expect(parseCsvLine('a,"b, with a comma",c')).toEqual(["a", "b, with a comma", "c"]);
  });

  it("handles escaped double quotes inside a quoted field", () => {
    expect(parseCsvLine('a,"she said ""hi""",c')).toEqual(["a", 'she said "hi"', "c"]);
  });

  it("handles an empty line as a single empty field", () => {
    expect(parseCsvLine("")).toEqual([""]);
  });

  it("handles trailing empty fields", () => {
    expect(parseCsvLine("a,b,")).toEqual(["a", "b", ""]);
  });
});

describe("matchColumns", () => {
  it("matches the primary candidate spellings, case/space-insensitive", () => {
    const header = [
      "DOI_Original",
      "DOI Replication",
      "Result",
      "Discipline",
      "Description",
      "Ref_Original",
      "Ref_Replication",
      "URL",
    ];
    const columns = matchColumns(header);
    expect(columns).toEqual({
      originalDoi: 0,
      replicationDoi: 1,
      outcome: 2,
      discipline: 3,
      description: 4,
      originalRef: 5,
      replicationRef: 6,
      sourceUrl: 7,
    });
  });

  it("matches an alternate candidate spelling", () => {
    const columns = matchColumns(["original_doi", "replication_outcome", "field"]);
    expect(columns.originalDoi).toBe(0);
    expect(columns.outcome).toBe(1);
    expect(columns.discipline).toBe(2);
  });

  it("leaves unmatched fields absent from the map", () => {
    const columns = matchColumns(["Some Unrelated Column", "Another One"]);
    expect(columns.originalDoi).toBeUndefined();
    expect(Object.keys(columns)).toHaveLength(0);
  });

  it("matches 'osf' as the source-url candidate", () => {
    const columns = matchColumns(["doi_original", "osf"]);
    expect(columns.sourceUrl).toBe(1);
  });
});

describe("rowToRecord", () => {
  const columns = matchColumns([
    "doi_original",
    "doi_replication",
    "result",
    "discipline",
    "description",
    "ref_original",
    "ref_replication",
    "url",
  ]);

  it("builds a record from a well-formed row", () => {
    const rec = rowToRecord(
      [
        "10.1000/original",
        "10.1000/replication",
        "success",
        "Psychology",
        "A study",
        "Original 2019",
        "Replicator 2021",
        "https://osf.io/abc",
      ],
      columns,
    );
    expect(rec).toEqual({
      originalDoi: "10.1000/original",
      replicationDoi: "10.1000/replication",
      outcome: "success",
      discipline: "Psychology",
      description: "A study",
      originalRef: "Original 2019",
      replicationRef: "Replicator 2021",
      sourceUrl: "https://osf.io/abc",
    });
  });

  it("normalizes a DOI carrying a doi.org URL prefix", () => {
    const rec = rowToRecord(
      ["https://doi.org/10.1000/original", "", "", "", "", "", "", ""],
      columns,
    );
    expect(rec?.originalDoi).toBe("10.1000/original");
  });

  it("returns null when the original DOI is missing", () => {
    const rec = rowToRecord(["", "10.1000/replication", "success", "", "", "", "", ""], columns);
    expect(rec).toBeNull();
  });

  it("returns null when the original DOI is malformed", () => {
    const rec = rowToRecord(["not-a-doi", "", "", "", "", "", "", ""], columns);
    expect(rec).toBeNull();
  });

  it("keeps the original DOI when the replication DOI is malformed (nulls it, doesn't drop the row)", () => {
    const rec = rowToRecord(["10.1000/original", "garbage", "", "", "", "", "", ""], columns);
    expect(rec).toEqual({
      originalDoi: "10.1000/original",
      replicationDoi: null,
      outcome: null,
      discipline: null,
      description: null,
      originalRef: null,
      replicationRef: null,
      sourceUrl: null,
    });
  });

  it("tolerates a ragged (short) row — missing cells read as null", () => {
    const rec = rowToRecord(["10.1000/original"], columns);
    expect(rec).toEqual({
      originalDoi: "10.1000/original",
      replicationDoi: null,
      outcome: null,
      discipline: null,
      description: null,
      originalRef: null,
      replicationRef: null,
      sourceUrl: null,
    });
  });

  it("returns null for a row when no column matched originalDoi at all", () => {
    const rec = rowToRecord(["10.1000/original"], {});
    expect(rec).toBeNull();
  });
});

describe("live FReD header (verified 2026-09-04)", () => {
  const columns = matchColumns(LIVE_HEADER);

  function makeRow(overrides: Record<string, string>): string[] {
    const row = new Array(LIVE_HEADER.length).fill("");
    for (const [name, value] of Object.entries(overrides)) {
      const idx = LIVE_HEADER.indexOf(name);
      if (idx < 0) throw new Error(`unknown column ${name}`);
      row[idx] = value;
    }
    return row;
  }

  it("matches every field this importer stores against the real header", () => {
    expect(columns).toEqual({
      originalDoi: LIVE_HEADER.indexOf("doi_o"),
      replicationDoi: LIVE_HEADER.indexOf("doi_r"),
      outcome: LIVE_HEADER.indexOf("reported_success"),
      discipline: LIVE_HEADER.indexOf("discipline"),
      description: LIVE_HEADER.indexOf("description"),
      originalRef: LIVE_HEADER.indexOf("ref_o"),
      replicationRef: LIVE_HEADER.indexOf("ref_r"),
      sourceUrl: LIVE_HEADER.indexOf("url_r"),
    });
  });

  it("parses a well-formed row, normalizing a doi.org-prefixed original DOI", () => {
    const row = makeRow({
      ref_o: "Original 2019",
      doi_o: "https://doi.org/10.1037/xyz1",
      ref_r: "Replicator 2021",
      doi_r: "10.1037/xyz1-r",
      url_r: "https://osf.io/abc",
      discipline: "Psychology",
      description: "A study",
      reported_success: "success",
    });
    expect(rowToRecord(row, columns)).toEqual({
      originalDoi: "10.1037/xyz1",
      replicationDoi: "10.1037/xyz1-r",
      outcome: "success",
      discipline: "Psychology",
      description: "A study",
      originalRef: "Original 2019",
      replicationRef: "Replicator 2021",
      sourceUrl: "https://osf.io/abc",
    });
  });

  it("treats reported_success = 0 as unknown, not a literal outcome label", () => {
    const row = makeRow({
      doi_o: "10.1037/xyz2",
      discipline: "Psychology",
      reported_success: "0",
    });
    expect(rowToRecord(row, columns)).toEqual({
      originalDoi: "10.1037/xyz2",
      replicationDoi: null,
      outcome: null,
      discipline: "Psychology",
      description: null,
      originalRef: null,
      replicationRef: null,
      sourceUrl: null,
    });
  });
});

describe("assertNotXlsx", () => {
  it("throws a clear, actionable message for a raw XLSX/zip file", () => {
    const zipBytes = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
    expect(() => assertNotXlsx(zipBytes)).toThrow(/xlsx/i);
    expect(() => assertNotXlsx(zipBytes)).toThrow(/csv/i);
  });

  it("does not throw for a plain CSV header", () => {
    expect(() => assertNotXlsx(Buffer.from("entry_id,effect_id"))).not.toThrow();
  });

  it("does not throw for a legitimately gzipped file (different magic bytes)", () => {
    expect(() => assertNotXlsx(Buffer.from([0x1f, 0x8b, 0x08, 0x00]))).not.toThrow();
  });

  it("does not throw when fewer than 2 bytes are available", () => {
    expect(() => assertNotXlsx(Buffer.from([0x50]))).not.toThrow();
    expect(() => assertNotXlsx(Buffer.alloc(0))).not.toThrow();
  });
});
