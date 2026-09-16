import { describe, expect, it } from "vitest";
import {
  addMonths,
  depositNow,
  depositReadyRows,
  isoToday,
  publishedBy,
  publishedFrom,
} from "@/lib/archiving/depositNow";
import { STATUTORY_ARCHIVING, statutoryArchivingFor } from "@/lib/archiving/statutoryRights";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

/**
 * "Deposit now": a closed journal article is listed only when the owner can
 * deposit it today — the publisher's recorded permission with its embargo over,
 * or a statutory secondary-publication right whose delay has run. Dates are
 * filled to the END of what is known, so a delay is never called over early.
 */

type SelfArchiving = NonNullable<CvItem["meta"]["selfArchiving"]>;
const record = (over: Partial<SelfArchiving> = {}): SelfArchiving => ({
  source: "oa.works",
  canArchive: true,
  versions: ["acceptedVersion"],
  locations: ["Institutional Repository"],
  retrievedAt: "2026-09-15T00:00:00.000Z",
  ...over,
});

function work(meta: CvItem["meta"] = {}, csl: Record<string, unknown> = {}): CvItem {
  return {
    id: "W1",
    source: "openalex",
    sourceId: "https://openalex.org/W1",
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id: "W1", type: "article-journal", title: "One", DOI: "10.1234/w1", ...csl },
    meta: { year: 2023, oaIsOpen: false, ...meta },
  };
}

const entry = (code: string) => STATUTORY_ARCHIVING.find((e) => e.countryCode === code)!;
const FR = [entry("FR")];
const TODAY = "2026-09-16";

describe("publishedBy / addMonths", () => {
  it("fills the publication date to the end of what is known", () => {
    expect(publishedBy(work({ year: 2023 }))).toBe("2023-12-31");
    expect(publishedBy(work({ year: 2023 }, { issued: { "date-parts": [[2023, 2]] } }))).toBe(
      "2023-02-28",
    );
    expect(publishedBy(work({ year: 2024 }, { issued: { "date-parts": [[2024, 2]] } }))).toBe(
      "2024-02-29",
    );
    expect(publishedBy(work({ year: 2023 }, { issued: { "date-parts": [[2023, 5, 7]] } }))).toBe(
      "2023-05-07",
    );
    // A year override that differs from the CSL date keeps the year alone.
    expect(
      publishedBy(
        work({ year: 2023, yearOverride: 2022 }, { issued: { "date-parts": [[2023, 5, 7]] } }),
      ),
    ).toBe("2022-12-31");
    expect(publishedBy(work({ year: undefined }))).toBeUndefined();
  });

  it("fills the same date to the start of what is known", () => {
    expect(publishedFrom(work({ year: 2021 }))).toBe("2021-01-01");
    expect(publishedFrom(work({ year: 2021 }, { issued: { "date-parts": [[2021, 8]] } }))).toBe(
      "2021-08-01",
    );
    expect(publishedFrom(work({ year: 2021 }, { issued: { "date-parts": [[2021, 8, 9]] } }))).toBe(
      "2021-08-09",
    );
    expect(publishedFrom(work({ year: undefined }))).toBeUndefined();
  });

  it("adds months on the calendar, clamping the day", () => {
    expect(addMonths("2023-01-31", 1)).toBe("2023-02-28");
    expect(addMonths("2023-05-07", 12)).toBe("2024-05-07");
    expect(addMonths("2023-11-30", 3)).toBe("2024-02-29");
    expect(addMonths("2023-12-31", 0)).toBe("2023-12-31");
  });

  it("isoToday is an ISO date", () => {
    expect(isoToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("depositNow — the publisher's permission", () => {
  it("is the ground once the recorded embargo has ended, naming the best version the record allows", () => {
    expect(
      depositNow(work({ selfArchiving: record({ embargoEnd: "2024-12-31" }) }), [], TODAY),
    ).toEqual({ basis: "publisher", version: "acceptedVersion", since: "2024-12-31" });
    expect(
      depositNow(
        work({ selfArchiving: record({ versions: ["submittedVersion", "publishedVersion"] }) }),
        [],
        TODAY,
      ),
    ).toEqual({ basis: "publisher", version: "publishedVersion", since: undefined });
  });

  it("is not the ground while the embargo runs, when the record refuses, or when it names no version", () => {
    expect(
      depositNow(work({ selfArchiving: record({ embargoEnd: "2027-05-18" }) }), [], TODAY),
    ).toBeNull();
    expect(
      depositNow(work({ selfArchiving: record({ canArchive: false }) }), [], TODAY),
    ).toBeNull();
    expect(depositNow(work({ selfArchiving: record({ versions: [] }) }), [], TODAY)).toBeNull();
  });

  it("counts an embargo given only as a duration from the work's date — the end of the known period", () => {
    const twelve = record({ embargoMonths: 12 });
    // Published sometime in 2025 → counted from 2025-12-31 → 2026-12-31: still running.
    expect(depositNow(work({ year: 2025, selfArchiving: twelve }), [], TODAY)).toBeNull();
    // Published 2025-06-01 → 2026-06-01: over.
    expect(
      depositNow(
        work({ year: 2025, selfArchiving: twelve }, { issued: { "date-parts": [[2025, 6, 1]] } }),
        [],
        TODAY,
      ),
    ).toEqual({ basis: "publisher", version: "acceptedVersion", since: "2026-06-01" });
    // No date at all: the duration cannot be counted, so the permission does not carry.
    expect(depositNow(work({ year: undefined, selfArchiving: twelve }), [], TODAY)).toBeNull();
  });
});

describe("depositNow — a statutory right", () => {
  it("is the ground once its delay has run, for the accepted manuscript, whatever the record says", () => {
    const fr = depositNow(
      work({ year: 2023, selfArchiving: record({ canArchive: false }) }),
      FR,
      TODAY,
    );
    expect(fr).toEqual({
      basis: "statute",
      version: "acceptedVersion",
      since: "2024-12-31",
      entry: entry("FR"),
    });
    expect(depositNow(work({ year: 2023 }), FR, TODAY)?.basis).toBe("statute");
  });

  it("waits for the delay, counted from the end of the known period", () => {
    expect(depositNow(work({ year: 2026 }), FR, TODAY)).toBeNull();
    expect(depositNow(work({ year: 2025 }), FR, TODAY)).toBeNull(); // 2025-12-31 + 12 months
    expect(
      depositNow(work({ year: 2025 }, { issued: { "date-parts": [[2025, 9, 1]] } }), FR, TODAY),
    ).toEqual({
      basis: "statute",
      version: "acceptedVersion",
      since: "2026-09-01",
      entry: entry("FR"),
    });
  });

  it("uses only author rights that set a delay — a requirement or a funding policy is no ground, and a right without a delay counts from publication", () => {
    expect(depositNow(work({ year: 2020 }), [entry("ES"), entry("JP")], TODAY)).toBeNull();
    const bg = depositNow(work({ year: 2024 }), [entry("BG")], TODAY);
    expect(bg?.basis).toBe("statute");
    expect(bg?.since).toBeUndefined();
    expect(depositNow(work({ year: undefined }), FR, TODAY)).toBeNull();
  });

  it("never puts a work under a right that may predate it: the work's earliest possible date must reach the commencement", () => {
    // Bulgaria's right is in force from 2021-06-07 and sets no delay: a paper of
    // 2021 with no month may be from March — not a ground; August is.
    expect(depositNow(work({ year: 2021 }), [entry("BG")], TODAY)).toBeNull();
    expect(
      depositNow(
        work({ year: 2021 }, { issued: { "date-parts": [[2021, 8]] } }),
        [entry("BG")],
        TODAY,
      )?.basis,
    ).toBe("statute");
    expect(depositNow(work({ year: 2022 }), [entry("BG")], TODAY)?.basis).toBe("statute");
    // Austria's from 2015-10-01: a bare 2015 may predate it; November 2015 does not.
    expect(depositNow(work({ year: 2015 }), [entry("AT")], TODAY)).toBeNull();
    expect(
      depositNow(
        work({ year: 2015 }, { issued: { "date-parts": [[2015, 11, 1]] } }),
        [entry("AT")],
        TODAY,
      ),
    ).toEqual({
      basis: "statute",
      version: "acceptedVersion",
      since: "2016-11-01",
      entry: entry("AT"),
    });
  });

  it("prefers the publisher's permission when both hold — unless the right gives a better version", () => {
    expect(depositNow(work({ year: 2020, selfArchiving: record() }), FR, TODAY)?.basis).toBe(
      "publisher",
    );
    // The record allows only the submitted manuscript; the French right, run, the accepted one.
    const weaker = depositNow(
      work({ year: 2020, selfArchiving: record({ versions: ["submittedVersion"] }) }),
      FR,
      TODAY,
    );
    expect(weaker?.basis).toBe("statute");
    expect(weaker?.version).toBe("acceptedVersion");
    // The record allows the published version: better than the right's manuscript.
    expect(
      depositNow(
        work({ year: 2020, selfArchiving: record({ versions: ["publishedVersion"] }) }),
        FR,
        TODAY,
      )?.basis,
    ).toBe("publisher");
  });

  it("carries the delays the table sets", () => {
    const delays = Object.fromEntries(
      STATUTORY_ARCHIVING.filter((e) => e.kind === "author-right").map((e) => [
        e.countryCode,
        e.delayMonths,
      ]),
    );
    expect(delays).toEqual({ FR: 12, DE: 12, AT: 12, NL: 6, BE: 12, BG: 0 });
    for (const e of STATUTORY_ARCHIVING) {
      if (e.kind !== "author-right") expect(e.delayMonths).toBeUndefined();
    }
  });
});

function makeCv(items: CvItem[]): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "now",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Owner" },
    display: {},
    sections: [
      { id: "pubs", type: "publications", title: "Publications", visible: true, order: 0, items },
    ],
    provenance: { generatedAt: "2026-09-15T00:00:00.000Z", sources: ["openalex"] },
  });
}

describe("depositReadyRows", () => {
  it("lists the closed journal articles with a ground today, in document order, with the row and the ground", () => {
    const ready = depositReadyRows(
      makeCv([
        { ...work({ year: 2023, workCountries: ["FR"] }), id: "W-fr" },
        { ...work({ year: 2026, workCountries: ["FR"] }), id: "W-fr-new" },
        { ...work({ selfArchiving: record({ embargoEnd: "2021-01-23" }) }), id: "W-rec" },
        { ...work({ selfArchiving: record({ embargoEnd: "2031-01-23" }) }), id: "W-embargo" },
        { ...work({ year: 2020, oaIsOpen: true, workCountries: ["FR"] }), id: "W-open" },
        { ...work({ year: 2020 }), id: "W-nothing" },
        {
          ...work({ year: 2020, workCountries: ["FR"] }, { type: "chapter" }),
          id: "W-chapter",
        },
      ]),
      TODAY,
    );
    expect(ready.map((r) => [r.row.itemId, r.now.basis])).toEqual([
      ["W-fr", "statute"],
      ["W-rec", "publisher"],
    ]);
    expect(ready[0]!.item.id).toBe("W-fr");
    expect(ready[0]!.row.statutory).toEqual(
      statutoryArchivingFor(["FR"], { year: 2023, type: "article-journal" }),
    );
  });
});
