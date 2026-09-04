import { describe, expect, it } from "vitest";
import { matchColumns, parseCsvLine, rowToRecord } from "../scripts/forrt-import";

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
