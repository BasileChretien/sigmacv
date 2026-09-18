import { beforeEach, describe, expect, it, vi } from "vitest";

const lookup = vi.hoisted(() => vi.fn());
vi.mock("@/lib/oaworks/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/oaworks/client")>()),
  fetchSelfArchivingPermission: lookup,
}));
const journal = vi.hoisted(() => vi.fn());
vi.mock("@/lib/openPolicyFinder/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/openPolicyFinder/client")>()),
  fetchJournalPolicy: journal,
}));
// The pass shares the bounded-pass helpers in canonical/enrich, whose import graph
// reaches the Prisma client (FORRT); no database is touched here.
vi.mock("@/lib/db", () => ({ prisma: {} }));

import {
  enrichCvWithSelfArchiving,
  POLICY_FINDER_SINCE,
  SELF_ARCHIVING_MAX_LOOKUPS,
  SELF_ARCHIVING_REFRESH_DAYS,
} from "@/lib/archiving/selfArchivingPass";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

/**
 * The owner sync's OA.Works pass: one lookup per countable closed journal
 * article with a DOI, sequential and capped; answers stored with their retrieval
 * date, "no record" clears, a failure keeps the old record and is retried behind
 * the works never examined (the attempt is stamped, the answer is not); a
 * work that stops being a candidate loses its record (store only what the row
 * prints). The client is mocked — its own behaviour is `oaworks-client.test.ts`.
 */

const NOW = "2026-09-15T00:00:00.000Z";
const MAILTO = "ci@example.org";
const PERMISSION = {
  canArchive: true,
  versions: ["acceptedVersion"],
  locations: ["Institutional Repository"],
  embargoMonths: 12,
  embargoEnd: "2021-01-23",
  recordUpdated: "2021-01-27",
};
const daysAgo = (n: number) => new Date(Date.parse(NOW) - n * 86_400_000).toISOString();
const OLD_RECORD = {
  source: "oa.works" as const,
  canArchive: false,
  versions: [],
  locations: [],
  retrievedAt: daysAgo(30),
};

function work(id: string, meta: CvItem["meta"] = {}, csl: Record<string, unknown> = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id, type: "article-journal", title: `Work ${id}`, DOI: `10.1234/${id}`, ...csl },
    meta: { oaIsOpen: false, ...meta },
  };
}

function makeCv(publications: CvItem[], preprints: CvItem[] = []): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "sa",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Owner" },
    display: {},
    sections: [
      {
        id: "pubs",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items: publications,
      },
      {
        id: "pre",
        type: "preprints",
        title: "Preprints",
        visible: true,
        order: 1,
        items: preprints,
      },
    ],
    provenance: { generatedAt: NOW, sources: ["openalex"] },
  });
}

const items = (cv: CanonicalCv) => cv.sections.flatMap((s) => s.items);
const byId = (cv: CanonicalCv, id: string) => items(cv).find((it) => it.id === id)!;

beforeEach(() => {
  lookup.mockReset();
  lookup.mockResolvedValue({ status: "found", permission: PERMISSION });
  journal.mockReset();
});

describe("enrichCvWithSelfArchiving", () => {
  it("asks once per countable closed journal article with a DOI, a few calls at a time, and stores the answer dated", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    lookup.mockImplementation(async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight--;
      return { status: "found", permission: PERMISSION };
    });
    const cv = makeCv(
      [
        work("A"),
        work("B"),
        work("open", { oaIsOpen: true }),
        work("unknown", { oaIsOpen: undefined }),
        work("noDoi", {}, { DOI: undefined }),
        work("blankDoi", {}, { DOI: "  " }),
        work("chapter", {}, { type: "chapter" }),
        work("retracted", { retracted: true }),
        work("notReviewed", { peerReviewed: false }),
        { ...work("hidden"), included: false },
      ],
      [work("preprint")],
    );
    const out = await enrichCvWithSelfArchiving(cv, MAILTO, NOW);

    expect(lookup.mock.calls.map(([doi, mail]) => [doi, mail])).toEqual([
      ["10.1234/A", MAILTO],
      ["10.1234/B", MAILTO],
    ]);
    // Each lookup is bounded by what remains of the pass budget.
    for (const [, , remaining] of lookup.mock.calls) {
      expect(remaining).toBeGreaterThan(0);
      expect(remaining).toBeLessThanOrEqual(15_000);
    }
    expect(maxInFlight).toBeLessThanOrEqual(3);
    for (const id of ["A", "B"]) {
      expect(byId(out, id).meta.selfArchiving).toEqual({
        source: "oa.works",
        ...PERMISSION,
        retrievedAt: NOW,
      });
      expect(byId(out, id).meta.selfArchivingCheckedAt).toBe(NOW);
      expect(byId(out, id).meta.selfArchivingTriedAt).toBe(NOW);
    }
    for (const id of [
      "open",
      "unknown",
      "noDoi",
      "chapter",
      "retracted",
      "notReviewed",
      "hidden",
      "preprint",
    ]) {
      expect(byId(out, id).meta.selfArchiving, id).toBeUndefined();
    }
    // Immutable: the input document is untouched.
    expect(byId(cv, "A").meta.selfArchiving).toBeUndefined();
    // What was stored survives the canonical schema.
    expect(CanonicalCvSchema.parse(out)).toEqual(out);
  });

  it("clears the record on an answered 'no record'; a failed call keeps it and stamps the attempt only", async () => {
    lookup.mockResolvedValueOnce({ status: "none" }).mockResolvedValueOnce({ status: "failed" });
    const cv = makeCv([
      work("gone", { selfArchiving: OLD_RECORD, selfArchivingCheckedAt: daysAgo(30) }),
      work("flaky", { selfArchiving: OLD_RECORD, selfArchivingCheckedAt: daysAgo(30) }),
    ]);
    const out = await enrichCvWithSelfArchiving(cv, MAILTO, NOW);
    expect(byId(out, "gone").meta.selfArchiving).toBeUndefined();
    expect(byId(out, "gone").meta.selfArchivingCheckedAt).toBe(NOW);
    expect(byId(out, "gone").meta.selfArchivingTriedAt).toBe(NOW);
    expect(byId(out, "flaky").meta.selfArchiving).toEqual(OLD_RECORD);
    expect(byId(out, "flaky").meta.selfArchivingCheckedAt).toBe(daysAgo(30));
    // The attempt IS stamped, so this DOI does not hold the head of the queue.
    expect(byId(out, "flaky").meta.selfArchivingTriedAt).toBe(NOW);
  });

  it("orders by the last ATTEMPT, so a failing work keeps moving back instead of holding the queue", async () => {
    const cv = makeCv([
      // Answered a month ago, failing on every call since yesterday: the stale
      // ANSWER date must not put it in front of works waiting far longer.
      work("answeredThenFailing", {
        selfArchiving: OLD_RECORD,
        selfArchivingCheckedAt: daysAgo(30),
        selfArchivingTriedAt: daysAgo(1),
      }),
      work("timedOutLongAgo", { selfArchivingTriedAt: daysAgo(9) }),
      work("answeredLongAgo", { selfArchiving: OLD_RECORD, selfArchivingCheckedAt: daysAgo(20) }),
      work("never"),
    ]);
    await enrichCvWithSelfArchiving(cv, MAILTO, NOW);
    // Never examined first, then oldest attempt first.
    expect(lookup.mock.calls.map((c) => c[0])).toEqual([
      "10.1234/never",
      "10.1234/answeredLongAgo",
      "10.1234/timedOutLongAgo",
      "10.1234/answeredThenFailing",
    ]);
  });

  it(`skips works answered within ${SELF_ARCHIVING_REFRESH_DAYS} days and asks never-checked works first, then the oldest`, async () => {
    const cv = makeCv([
      work("recent", { selfArchivingCheckedAt: daysAgo(2) }),
      work("older", { selfArchivingCheckedAt: daysAgo(20) }),
      work("old", { selfArchivingCheckedAt: daysAgo(8) }),
      work("never"),
      work("future", { selfArchivingCheckedAt: "2027-01-01T00:00:00.000Z" }),
      work("garbled", { selfArchivingCheckedAt: "not a date" }),
    ]);
    await enrichCvWithSelfArchiving(cv, MAILTO, NOW);
    expect(lookup.mock.calls.map((c) => c[0])).toEqual(
      ["10.1234/never", "10.1234/older", "10.1234/old", "10.1234/future", "10.1234/garbled"].sort(
        (a, b) => (a === "10.1234/never" ? -1 : b === "10.1234/never" ? 1 : 0),
      ),
    );
    expect(lookup.mock.calls.map((c) => c[0])).not.toContain("10.1234/recent");
  });

  it("makes at most the per-sync number of lookups", async () => {
    const cv = makeCv(
      Array.from({ length: SELF_ARCHIVING_MAX_LOOKUPS + 5 }, (_, i) => work(`W${i}`)),
    );
    const out = await enrichCvWithSelfArchiving(cv, MAILTO, NOW);
    expect(lookup).toHaveBeenCalledTimes(SELF_ARCHIVING_MAX_LOOKUPS);
    expect(items(out).filter((it) => it.meta.selfArchiving).length).toBe(
      SELF_ARCHIVING_MAX_LOOKUPS,
    );
  });

  it("drops the record and its date from a work that is no longer a candidate, without asking", async () => {
    const stored = {
      selfArchiving: OLD_RECORD,
      selfArchivingCheckedAt: daysAgo(1),
      selfArchivingTriedAt: daysAgo(1),
    };
    const cv = makeCv([
      work("nowOpen", { ...stored, oaIsOpen: true }),
      { ...work("nowHidden", stored), notMine: true },
      work("fresh", stored),
    ]);
    const out = await enrichCvWithSelfArchiving(cv, MAILTO, NOW);
    expect(lookup).not.toHaveBeenCalled();
    for (const id of ["nowOpen", "nowHidden"]) {
      expect(byId(out, id).meta.selfArchiving, id).toBeUndefined();
      expect(byId(out, id).meta.selfArchivingCheckedAt, id).toBeUndefined();
      expect(byId(out, id).meta.selfArchivingTriedAt, id).toBeUndefined();
    }
    // Still a candidate, answered yesterday: kept as it was.
    expect(byId(out, "fresh").meta.selfArchiving).toEqual(OLD_RECORD);
  });

  it("asks nothing and changes nothing when no work is closed", async () => {
    const cv = makeCv([work("open", { oaIsOpen: true })]);
    const out = await enrichCvWithSelfArchiving(cv, MAILTO, NOW);
    expect(lookup).not.toHaveBeenCalled();
    expect(out).toEqual(cv);
  });

  describe("with an Open Policy Finder key", () => {
    const KEY = "opf-key";
    const ACCEPTED_12 = {
      versions: ["acceptedVersion" as const],
      embargoMonths: 12,
      locations: ["Non-Commercial Institutional Repository"],
      licence: "cc-by-nc-nd",
      conditions: ["Must link to publisher version with DOI"],
    };
    const POLICY = {
      routes: [ACCEPTED_12],
      recordUpdated: "2025-03-13",
      policyUrl: "https://openpolicyfinder.jisc.ac.uk/publication/16060",
    };
    const OPF_RECORD = {
      source: "open-policy-finder" as const,
      canArchive: true,
      ...ACCEPTED_12,
      recordUpdated: POLICY.recordUpdated,
      policyUrl: POLICY.policyUrl,
      routes: POLICY.routes,
    };
    /** A stored Open Policy Finder answer, `days` old. */
    const opfAnswer = (days: number) => ({
      selfArchiving: { ...OPF_RECORD, retrievedAt: daysAgo(days) },
      selfArchivingCheckedAt: daysAgo(days),
      selfArchivingOpfAt: daysAgo(days),
    });
    const inJournal = (
      id: string,
      issn?: unknown,
      meta: CvItem["meta"] = {},
      csl: Record<string, unknown> = {},
    ) => work(id, meta, { ...(issn !== undefined ? { ISSN: issn } : {}), ...csl });
    const run = (cv: CanonicalCv, now = NOW) =>
      enrichCvWithSelfArchiving(cv, MAILTO, now, { policyFinderKey: KEY });
    /** After Open Policy Finder went live: an OA.Works answer is then not due again at once. */
    const after = (hours: number) =>
      new Date(Date.parse(POLICY_FINDER_SINCE) + hours * 3_600_000).toISOString();
    const OAWORKS_RECORD = {
      ...OLD_RECORD,
      canArchive: true,
      versions: ["acceptedVersion" as const],
    };

    it("asks Open Policy Finder by ISSN first — once per journal — and credits it; OA.Works only for a journal it has no record of, or a work with no ISSN", async () => {
      journal.mockImplementation(async (issn: string) =>
        issn === "0165-1781" ? { status: "found", policy: POLICY } : { status: "none" },
      );
      const out = await run(
        makeCv([
          inJournal("A", "0165-1781"),
          inJournal("B", "01651781"),
          inJournal("C", "0040-5957"),
          inJournal("D"),
        ]),
      );
      expect(journal.mock.calls.map(([issn, key]) => [issn, key]).sort()).toEqual([
        ["0040-5957", KEY],
        ["0165-1781", KEY],
      ]);
      expect(lookup.mock.calls.map(([doi]) => doi).sort()).toEqual(["10.1234/C", "10.1234/D"]);
      for (const id of ["A", "B"]) {
        expect(byId(out, id).meta.selfArchiving).toEqual({ ...OPF_RECORD, retrievedAt: NOW });
        expect(byId(out, id).meta.selfArchivingCheckedAt).toBe(NOW);
        expect(byId(out, id).meta.selfArchivingOpfAt).toBe(NOW);
      }
      expect(byId(out, "C").meta.selfArchiving?.source).toBe("oa.works");
      // Open Policy Finder answered "none" for C's journal: stamped, not asked again this week.
      expect(byId(out, "C").meta.selfArchivingOpfAt).toBe(NOW);
      expect(byId(out, "D").meta.selfArchiving?.source).toBe("oa.works");
      expect(byId(out, "D").meta.selfArchivingOpfAt).toBeUndefined();
    });

    it("asks once for a journal the works name by its print or its electronic ISSN", async () => {
      journal.mockResolvedValue({ status: "found", policy: POLICY });
      await run(
        makeCv([
          inJournal("A", "0165-1781"),
          inJournal("B", ["1872-7123", "0165-1781"]),
          inJournal("C", ["1872-7123", "0165-1781"]),
          inJournal("D", "0165-1781"),
        ]),
      );
      expect(journal.mock.calls.map(([issn]) => issn)).toEqual(["0165-1781"]);
    });

    it("keeps every route with the record; its default is the route each article can take today, most final among those most places accept", async () => {
      const anywhere = { locations: ["Any Repository"] };
      const routes = [
        { versions: ["publishedVersion" as const], embargoMonths: 12, ...anywhere },
        { versions: ["acceptedVersion" as const], embargoMonths: 0, ...anywhere },
      ];
      journal.mockResolvedValue({ status: "found", policy: { ...POLICY, routes } });
      const out = await run(
        makeCv([
          inJournal(
            "recent",
            "0165-1781",
            { year: 2026 },
            { issued: { "date-parts": [[2026, 8]] } },
          ),
          inJournal(
            "older",
            "0165-1781",
            { year: 2020 },
            { issued: { "date-parts": [[2020, 3]] } },
          ),
        ]),
      );
      expect(byId(out, "recent").meta.selfArchiving?.versions).toEqual(["acceptedVersion"]);
      expect(byId(out, "older").meta.selfArchiving?.versions).toEqual(["publishedVersion"]);
      expect(byId(out, "older").meta.selfArchiving?.routes).toEqual(routes);
      expect(journal).toHaveBeenCalledTimes(1);
    });

    it("defaults to the route most places accept: the row, which knows where it deposits, picks again", async () => {
      const routes = [
        {
          versions: ["publishedVersion" as const],
          embargoMonths: 12,
          locations: ["Institutional Repository"],
        },
        { versions: ["acceptedVersion" as const], embargoMonths: 0, locations: ["Any Repository"] },
      ];
      journal.mockResolvedValue({ status: "found", policy: { ...POLICY, routes } });
      const out = await run(makeCv([inJournal("older", "0165-1781", { year: 2020 })]));
      expect(byId(out, "older").meta.selfArchiving?.versions).toEqual(["acceptedVersion"]);
      expect(byId(out, "older").meta.selfArchiving?.routes).toHaveLength(2);
    });

    it("gives a new article the journal's answer from earlier in the week, dated as it was — no second call", async () => {
      const out = await run(
        makeCv([inJournal("known", "0165-1781", opfAnswer(2)), inJournal("new", "0165-1781")]),
      );
      expect(journal).not.toHaveBeenCalled();
      expect(lookup).not.toHaveBeenCalled();
      expect(byId(out, "new").meta.selfArchiving).toEqual({
        ...OPF_RECORD,
        retrievedAt: daysAgo(2),
      });
      // Dated with the journal's answer: the two fall due again together.
      expect(byId(out, "new").meta.selfArchivingCheckedAt).toBe(daysAgo(2));
      expect(byId(out, "new").meta.selfArchivingOpfAt).toBe(daysAgo(2));
    });

    it("does not ask Open Policy Finder again within the week for a journal it had no record of, even when OA.Works failed", async () => {
      journal.mockResolvedValue({ status: "none" });
      lookup.mockResolvedValue({ status: "failed" });
      const first = await run(makeCv([inJournal("A", "0040-5957")]));
      expect(journal).toHaveBeenCalledTimes(1);
      expect(byId(first, "A").meta.selfArchivingOpfAt).toBe(NOW);
      expect(byId(first, "A").meta.selfArchivingCheckedAt).toBeUndefined();
      journal.mockClear();
      lookup.mockClear();
      const next = new Date(Date.parse(NOW) + 86_400_000).toISOString();
      await run(first, next);
      expect(journal).not.toHaveBeenCalled();
      expect(lookup).toHaveBeenCalledTimes(1);
    });

    it("gives every article of a journal it asks the answer, so the journal falls due again as one", async () => {
      journal.mockResolvedValue({ status: "found", policy: POLICY });
      const now = after(48);
      const sibling = { selfArchiving: OAWORKS_RECORD, selfArchivingCheckedAt: after(24) };
      const out = await run(
        makeCv([inJournal("new", "0165-1781"), inJournal("sibling", "0165-1781", sibling)]),
        now,
      );
      expect(journal).toHaveBeenCalledTimes(1);
      expect(lookup).not.toHaveBeenCalled();
      expect(byId(out, "sibling").meta.selfArchiving?.source).toBe("open-policy-finder");
      expect(byId(out, "sibling").meta.selfArchivingCheckedAt).toBe(now);
      expect(byId(out, "sibling").meta.selfArchivingOpfAt).toBe(now);
    });

    it("asks OA.Works for the article that was due, not for its siblings, when Open Policy Finder has no record of the journal", async () => {
      journal.mockResolvedValue({ status: "none" });
      const now = after(48);
      const sibling = { selfArchiving: OAWORKS_RECORD, selfArchivingCheckedAt: after(24) };
      const out = await run(
        makeCv([inJournal("new", "0165-1781"), inJournal("sibling", "0165-1781", sibling)]),
        now,
      );
      expect(lookup.mock.calls.map(([doi]) => doi)).toEqual(["10.1234/new"]);
      expect(byId(out, "sibling").meta.selfArchiving).toEqual(OAWORKS_RECORD);
      expect(byId(out, "sibling").meta.selfArchivingCheckedAt).toBe(after(24));
      expect(byId(out, "sibling").meta.selfArchivingOpfAt).toBe(now);
    });

    it("when Open Policy Finder fails: a work keeps its Open Policy Finder record and stamps the attempt only; a work without one asks OA.Works", async () => {
      journal.mockResolvedValue({ status: "failed" });
      const out = await run(
        makeCv([inJournal("kept", "0165-1781", opfAnswer(10)), inJournal("fresh", "0040-5957")]),
      );
      expect(byId(out, "kept").meta.selfArchiving).toEqual({
        ...OPF_RECORD,
        retrievedAt: daysAgo(10),
      });
      expect(byId(out, "kept").meta.selfArchivingCheckedAt).toBe(daysAgo(10));
      expect(byId(out, "kept").meta.selfArchivingTriedAt).toBe(NOW);
      expect(lookup.mock.calls.map(([doi]) => doi)).toEqual(["10.1234/fresh"]);
      expect(byId(out, "fresh").meta.selfArchiving?.source).toBe("oa.works");
    });

    it("when the key is not accepted: stops asking for the rest of the sync, keeps the records it has, and OA.Works answers for the others", async () => {
      journal.mockResolvedValue({ status: "unauthorized" });
      const others = ["C", "D", "E", "F"].map((id, i) => inJournal(id, `1111-000${i}`));
      const out = await run(
        makeCv([
          inJournal("A", "0165-1781", opfAnswer(10)),
          inJournal("B", "0040-5957", opfAnswer(10)),
          ...others,
        ]),
      );
      // Only the lookups already in flight when the refusal came back (one per worker, three workers).
      expect(journal.mock.calls.length).toBeLessThanOrEqual(3);
      for (const id of ["A", "B"]) {
        expect(byId(out, id).meta.selfArchiving?.source).toBe("open-policy-finder");
      }
      expect(lookup.mock.calls.map(([doi]) => doi).sort()).toEqual(
        ["C", "D", "E", "F"].map((id) => `10.1234/${id}`),
      );
    });

    it("retires an Open Policy Finder record once it has none for the journal, even when OA.Works fails — and does not ask again that week", async () => {
      journal.mockResolvedValue({ status: "none" });
      lookup.mockResolvedValue({ status: "failed" });
      const first = await run(makeCv([inJournal("A", "0165-1781", opfAnswer(10))]));
      expect(byId(first, "A").meta.selfArchiving).toBeUndefined();
      expect(byId(first, "A").meta.selfArchivingOpfAt).toBe(NOW);
      journal.mockClear();
      const next = new Date(Date.parse(NOW) + 86_400_000).toISOString();
      await run(first, next);
      expect(journal).not.toHaveBeenCalled();
    });

    it("drops an Open Policy Finder record it can no longer ask about — no key configured, or no readable ISSN — whatever OA.Works says", async () => {
      lookup.mockResolvedValue({ status: "failed" });
      const noKey = await enrichCvWithSelfArchiving(
        makeCv([inJournal("A", "0165-1781", opfAnswer(10))]),
        MAILTO,
        NOW,
      );
      expect(byId(noKey, "A").meta.selfArchiving).toBeUndefined();
      const noIssn = await run(makeCv([inJournal("A", "not an ISSN", opfAnswer(10))]));
      expect(byId(noIssn, "A").meta.selfArchiving).toBeUndefined();
      expect(journal).not.toHaveBeenCalled();
    });

    it("asks again, once, a work OA.Works answered before Open Policy Finder went live — not one answered since", async () => {
      journal.mockResolvedValue({ status: "found", policy: POLICY });
      const out = await run(
        makeCv([
          inJournal("before", "0165-1781", {
            selfArchiving: OAWORKS_RECORD,
            selfArchivingCheckedAt: after(-24),
          }),
          inJournal("since", "0040-5957", {
            selfArchiving: OAWORKS_RECORD,
            selfArchivingCheckedAt: after(12),
            selfArchivingOpfAt: after(12),
          }),
        ]),
        after(24),
      );
      expect(journal.mock.calls.map(([issn]) => issn)).toEqual(["0165-1781"]);
      expect(byId(out, "before").meta.selfArchiving?.source).toBe("open-policy-finder");
      expect(byId(out, "since").meta.selfArchiving?.source).toBe("oa.works");
    });

    it("asks nothing of Open Policy Finder without a key", async () => {
      await enrichCvWithSelfArchiving(makeCv([inJournal("A", "0165-1781")]), MAILTO, NOW);
      expect(journal).not.toHaveBeenCalled();
      expect(lookup).toHaveBeenCalledTimes(1);
    });
  });
});
