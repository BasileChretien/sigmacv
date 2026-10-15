import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemIncluded, updateDisplay } from "@/lib/canonical/curate";
import {
  NOTHING_EXPOSED,
  affiliationSetSpec,
  deletionsBetween,
  harvestExposure,
  harvestRecord,
  harvestWrite,
  parseHarvestExposure,
  type HarvestColumns,
} from "@/lib/cv/oaiState";
import { NOT_SERVED_FINGERPRINT, oaiFingerprint, workRecords } from "@/lib/oai/oai";
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

describe("harvestExposure", () => {
  it("is the CV identifier and one per listed work, in the CV's set", () => {
    const record = harvestRecord(SERVED, CV, T1)!;
    const exposure = harvestExposure(record);
    expect(exposure.set).toBe("ror:04chrp450");
    expect(exposure.ids[0]).toBe("oai:sigmacv.org:ada-x7");
    expect(exposure.ids).toHaveLength(1 + workRecords(record).length);
    expect(exposure.ids.slice(1).every((id) => id.startsWith("oai:sigmacv.org:ada-x7/w/"))).toBe(
      true,
    );
    expect(harvestExposure({ ...record, setSpec: undefined }).set).toBeNull();
  });

  it("is nothing for a CV that serves nothing", () => {
    expect(harvestExposure(null)).toEqual(NOTHING_EXPOSED);
  });

  it("reads back what was stored, and nothing that is not that shape", () => {
    expect(parseHarvestExposure({ ids: ["a"], set: null })).toEqual({ ids: ["a"], set: null });
    expect(parseHarvestExposure(null)).toBeNull();
    expect(parseHarvestExposure({ ids: "a", set: null })).toBeNull();
    expect(parseHarvestExposure({ ids: [] })).toBeNull();
  });
});

describe("deletionsBetween", () => {
  const before = { ids: ["cv", "cv/w/1", "cv/w/2"], set: "ror:04chrp450" };

  it("deletes what is gone from the repository AND from the set it was in", () => {
    expect(deletionsBetween(before, { ids: ["cv", "cv/w/1"], set: "ror:04chrp450" })).toEqual([
      { identifier: "cv/w/2", setSpec: "" },
      { identifier: "cv/w/2", setSpec: "ror:04chrp450" },
    ]);
  });

  it("deletes from its former set only what is still served elsewhere", () => {
    // The owner left the listing: every record is still served, none in the set.
    expect(deletionsBetween(before, { ids: before.ids, set: null })).toEqual(
      before.ids.map((identifier) => ({ identifier, setSpec: "ror:04chrp450" })),
    );
    // The affiliation changed: the records left the old set for a new one.
    expect(
      deletionsBetween(before, { ids: ["cv"], set: "ror:00000000x" }).filter(
        (d) => d.identifier === "cv",
      ),
    ).toEqual([{ identifier: "cv", setSpec: "ror:04chrp450" }]);
  });

  it("withdrawing everything deletes everything, everywhere it was", () => {
    expect(deletionsBetween(before, NOTHING_EXPOSED)).toHaveLength(6);
    expect(deletionsBetween({ ids: ["cv"], set: null }, NOTHING_EXPOSED)).toEqual([
      { identifier: "cv", setSpec: "" },
    ]);
  });

  it("deletes nothing when nothing stops being served", () => {
    expect(deletionsBetween(before, before)).toEqual([]);
    expect(deletionsBetween(NOTHING_EXPOSED, before)).toEqual([]);
  });
});

describe("harvestWrite", () => {
  const stored = () => ({
    oaiFingerprint: oaiFingerprint(harvestRecord(SERVED, CV, T1)),
    oaiExposure: harvestExposure(harvestRecord(SERVED, CV, T1)),
  });
  const unused = () => {
    throw new Error("the stored exposure must be used");
  };

  it("keeps the datestamp and deletes nothing when what is served did not change", () => {
    const w = harvestWrite(SERVED, CV, stored(), unused, T2);
    expect(w.columns).toEqual({
      oaiFingerprint: stored().oaiFingerprint,
      oaiExposure: stored().oaiExposure,
    });
    expect(w.deletions).toEqual([]);
    expect(w.served).toEqual(stored().oaiExposure);
  });

  it("moves the datestamp to now and deletes what went when it changed", () => {
    const w = harvestWrite({ ...SERVED, listUnderAffiliation: false }, CV, stored(), unused, T2);
    expect(w.columns.publicChangedAt).toEqual(T2);
    expect(w.columns.oaiExposure.set).toBeNull();
    expect(w.deletions.every((d) => d.setSpec === "ror:04chrp450")).toBe(true);
    expect(w.deletions).toHaveLength(stored().oaiExposure.ids.length);
  });

  it("unpublishing serves nothing: everything is deleted, and the datestamp moves", () => {
    const w = harvestWrite({ ...SERVED, published: false }, CV, stored(), unused, T2);
    expect(w.columns).toEqual({
      oaiFingerprint: NOT_SERVED_FINGERPRINT,
      oaiExposure: NOTHING_EXPOSED,
      publicChangedAt: T2,
    });
    expect(w.deletions).toHaveLength(2 * stored().oaiExposure.ids.length);
    expect(w.served).toEqual(NOTHING_EXPOSED);
  });

  it("a row with nothing stored (written before the columns) diffs against its previous state", () => {
    const previous = () => harvestRecord(SERVED, CV, T1);
    const w = harvestWrite({ ...SERVED, published: false }, CV, {}, previous, T2);
    // Never fingerprinted: the datestamp moves; never exposed: derived from the previous record.
    expect(w.columns.publicChangedAt).toEqual(T2);
    expect(w.deletions).toHaveLength(2 * stored().oaiExposure.ids.length);
    // A stored exposure that is not that shape is read as none.
    const corrupt = harvestWrite(SERVED, CV, { oaiExposure: { ids: 1 } }, () => null, T2);
    expect(corrupt.deletions).toEqual([]);
  });

  it("an unpublished CV that stays unpublished keeps its datestamp and deletes nothing", () => {
    const dark = { ...SERVED, published: false };
    const w = harvestWrite(
      dark,
      CV,
      { oaiFingerprint: NOT_SERVED_FINGERPRINT, oaiExposure: NOTHING_EXPOSED },
      unused,
      T2,
    );
    expect(w.columns).toEqual({
      oaiFingerprint: NOT_SERVED_FINGERPRINT,
      oaiExposure: NOTHING_EXPOSED,
    });
    expect(w.deletions).toEqual([]);
  });
});
