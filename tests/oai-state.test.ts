import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemIncluded, updateDisplay } from "@/lib/canonical/curate";
import {
  affiliationSetSpec,
  harvestRecord,
  harvestStateColumns,
  type HarvestColumns,
} from "@/lib/cv/oaiState";
import { NOT_SERVED_FINGERPRINT, oaiFingerprint } from "@/lib/oai/oai";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const CV = buildCanonicalCv({
  id: "cv_1",
  resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A5001069481"], displayName: "Ada" },
  works,
  now: "2026-06-02T00:00:00.000Z",
});
const SERVED: HarvestColumns = {
  published: true,
  publicIndexable: true,
  publicSlug: "ada-x7",
  listUnderAffiliation: true,
  currentRorId: "04chrp450",
};
const T1 = new Date("2026-06-09T10:00:00.000Z");
const T2 = new Date("2026-10-15T08:30:00.000Z");

describe("affiliationSetSpec", () => {
  it("is the ror set only for an opted-in CV with a key", () => {
    expect(affiliationSetSpec(SERVED)).toBe("ror:04chrp450");
    expect(affiliationSetSpec({ ...SERVED, listUnderAffiliation: false })).toBeUndefined();
    expect(affiliationSetSpec({ ...SERVED, currentRorId: null })).toBeUndefined();
  });
});

describe("harvestRecord", () => {
  it("serves the public projection, stamped and in its set", () => {
    const record = harvestRecord(SERVED, CV, T1);
    expect(record).toMatchObject({ slug: "ada-x7", datestamp: T1, setSpec: "ror:04chrp450" });
    expect(record!.cv.owner.displayName).toBe("Ada");
  });

  it("serves nothing without publication, indexing, a slug or a document", () => {
    expect(harvestRecord({ ...SERVED, published: false }, CV, T1)).toBeNull();
    expect(harvestRecord({ ...SERVED, publicIndexable: false }, CV, T1)).toBeNull();
    expect(harvestRecord({ ...SERVED, publicSlug: null }, CV, T1)).toBeNull();
    expect(harvestRecord(SERVED, null, T1)).toBeNull();
  });
});

describe("oaiFingerprint", () => {
  const fp = (row: HarvestColumns, cv = CV, at = T1) => oaiFingerprint(harvestRecord(row, cv, at));

  it("does not move with the datestamp, only with what the records say", () => {
    expect(fp(SERVED, CV, T1)).toBe(fp(SERVED, CV, T2));
    expect(fp(SERVED)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("moves when the CV record, a work record or the set changes", () => {
    const base = fp(SERVED);
    // A work leaves the page (its per-work record goes).
    const pubs = CV.sections.find((s) => s.type === "publications")!;
    const listed = pubs.items.find((i) => i.included)!;
    expect(fp(SERVED, setItemIncluded(CV, pubs.id, listed.id, false))).not.toBe(base);
    // The CV record's licence line changes.
    expect(fp(SERVED, updateDisplay(CV, { cvLicense: "CC-BY-4.0" }))).not.toBe(base);
    // The set in every header changes, or goes.
    expect(fp({ ...SERVED, currentRorId: "00000000x" })).not.toBe(base);
    expect(fp({ ...SERVED, listUnderAffiliation: false })).not.toBe(base);
    // The identifiers change with the slug.
    expect(fp({ ...SERVED, publicSlug: "ada-y8" })).not.toBe(base);
  });

  it("is one constant for a CV that serves nothing", () => {
    expect(oaiFingerprint(null)).toBe(NOT_SERVED_FINGERPRINT);
    expect(fp({ ...SERVED, published: false })).toBe(NOT_SERVED_FINGERPRINT);
  });

  it("ignores what the records never show (the owner's private notes, the editor's state)", () => {
    const withNotes = { ...CV, notes: "private: ask the committee about the 2019 gap" };
    expect(fp(SERVED, withNotes)).toBe(fp(SERVED));
  });
});

describe("harvestStateColumns", () => {
  it("keeps the datestamp when what is served did not change", () => {
    const stored = oaiFingerprint(harvestRecord(SERVED, CV, T1));
    expect(harvestStateColumns(SERVED, CV, stored, T2)).toEqual({ oaiFingerprint: stored });
  });

  it("moves the datestamp to now when it changed, went dark, or was never computed", () => {
    const stored = oaiFingerprint(harvestRecord(SERVED, CV, T1));
    const moved = harvestStateColumns({ ...SERVED, listUnderAffiliation: false }, CV, stored, T2);
    expect(moved.publicChangedAt).toEqual(T2);
    expect(moved.oaiFingerprint).not.toBe(stored);
    // Unpublishing is a change too: the endpoint stops serving the CV.
    expect(harvestStateColumns({ ...SERVED, published: false }, CV, stored, T2)).toEqual({
      oaiFingerprint: NOT_SERVED_FINGERPRINT,
      publicChangedAt: T2,
    });
    // A row written before the column existed: re-sent once rather than missed.
    expect(harvestStateColumns(SERVED, CV, null, T2).publicChangedAt).toEqual(T2);
    expect(harvestStateColumns(SERVED, CV, undefined, T2).publicChangedAt).toEqual(T2);
  });

  it("an unpublished CV that stays unpublished keeps its datestamp", () => {
    const dark = { ...SERVED, published: false };
    expect(harvestStateColumns(dark, CV, NOT_SERVED_FINGERPRINT, T2)).toEqual({
      oaiFingerprint: NOT_SERVED_FINGERPRINT,
    });
  });
});
