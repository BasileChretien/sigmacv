import { describe, expect, it, vi } from "vitest";
import {
  COPY_LOOKUPS,
  enrichCvWithRepositoryCopies,
  REPOSITORY_COPIES_MAX_WORKS,
  REPOSITORY_COPIES_REFRESH_DAYS,
} from "@/lib/archiving/repositoryCopiesPass";
import type { CopyLookup, RepositoryCopy } from "@/lib/repositoryCopies/shared";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

// The pass shares the bounded-pass helpers in canonical/enrich, whose import graph
// reaches the Prisma client (FORRT); no database is touched here.
vi.mock("@/lib/db", () => ({ prisma: {} }));

/**
 * The owner sync's repository-copies pass: the first source (HAL) for every
 * work due, then the other sources in order for the works it did not settle
 * with a FILE; copies stored with their retrieval date, settled source by
 * source; "nothing anywhere" clears; a source failing keeps what it said before
 * and the work is retried behind the works never examined; a work that stops
 * being a candidate loses its copies. The clients are injected — their own
 * behaviour is `repository-copies-clients.test.ts`.
 */

const NOW = "2026-09-16T12:00:00.000Z";
const MAILTO = "ci@example.org";
const daysAgo = (n: number) => new Date(Date.parse(NOW) - n * 86_400_000).toISOString();
const halFile: RepositoryCopy = {
  source: "hal",
  id: "hal-03474586",
  url: "https://hal.science/hal-03474586",
  hasFile: true,
};
const halNotice: RepositoryCopy = {
  source: "hal",
  id: "hal-05745947",
  url: "https://hal.science/hal-05745947",
  hasFile: false,
};
const pmc: RepositoryCopy = {
  source: "europepmc",
  id: "PMC1",
  url: "https://europepmc.org/article/PMC/PMC1",
  hasFile: true,
  name: "Europe PMC",
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
    meta: { year: 2022, oaIsOpen: false, ...meta },
  };
}

function makeCv(items: CvItem[]): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "copies",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Owner" },
    display: {},
    sections: [
      { id: "pubs", type: "publications", title: "Publications", visible: true, order: 0, items },
    ],
    provenance: { generatedAt: NOW, sources: ["openalex"] },
  });
}

/** Injected sources: each answers by DOI, and records the order it was asked in. */
function sources(answers: Partial<Record<RepositoryCopy["source"], (doi: string) => CopyLookup>>) {
  const asked: string[] = [];
  const lookups = COPY_LOOKUPS.map(
    ([source]) =>
      [
        source,
        vi.fn(async (doi: string): Promise<CopyLookup> => {
          asked.push(`${source}:${doi}`);
          return answers[source]?.(doi) ?? { status: "none" };
        }),
      ] as const,
  );
  return { lookups, asked };
}

const item = (cv: CanonicalCv, id: string) => cv.sections[0]!.items.find((i) => i.id === id)!;
const run = (cv: CanonicalCv, s: ReturnType<typeof sources>, now = NOW) =>
  enrichCvWithRepositoryCopies(cv, MAILTO, { lookups: s.lookups, now, zenodoIntervalMs: 0 });

describe("enrichCvWithRepositoryCopies", () => {
  it("asks the sources in order and stops at the first file, storing the copies with their retrieval date", async () => {
    const s = sources({ hal: () => ({ status: "found", copies: [halFile] }) });
    const cv = await run(makeCv([work("W1")]), s);
    expect(s.asked).toEqual(["hal:10.1234/W1"]);
    expect(item(cv, "W1").meta.repositoryCopies).toEqual([{ ...halFile, retrievedAt: NOW }]);
    expect(item(cv, "W1").meta.repositoryCopiesCheckedAt).toBe(NOW);
    expect(item(cv, "W1").meta.repositoryCopiesTriedAt).toBe(NOW);
  });

  it("keeps a notice without a file and goes on to the next sources", async () => {
    const s = sources({
      hal: () => ({ status: "found", copies: [halNotice] }),
      europepmc: () => ({ status: "found", copies: [pmc] }),
    });
    const cv = await run(makeCv([work("W1")]), s);
    expect(s.asked).toEqual(["hal:10.1234/W1", "europepmc:10.1234/W1"]);
    expect(item(cv, "W1").meta.repositoryCopies?.map((c) => c.id)).toEqual([
      "hal-05745947",
      "PMC1",
    ]);
  });

  it("clears the copies on a 'nothing anywhere' answer, and asks every source for it", async () => {
    const s = sources({});
    const cv = await run(
      makeCv([
        work("W1", {
          repositoryCopies: [{ ...halNotice, retrievedAt: daysAgo(30) }],
          repositoryCopiesCheckedAt: daysAgo(30),
        }),
      ]),
      s,
    );
    expect(s.asked).toEqual([
      "hal:10.1234/W1",
      "europepmc:10.1234/W1",
      "openaire:10.1234/W1",
      "zenodo:10.1234/W1",
    ]);
    expect(item(cv, "W1").meta.repositoryCopies).toBeUndefined();
    expect(item(cv, "W1").meta.repositoryCopiesCheckedAt).toBe(NOW);
  });

  it("keeps what a failing source said before, stamping the attempt only — a notice found beside a failure is stored but not an answer", async () => {
    const old = { ...halNotice, retrievedAt: daysAgo(30) };
    const failing = sources({ hal: () => ({ status: "failed" }) });
    const kept = await run(
      makeCv([work("W1", { repositoryCopies: [old], repositoryCopiesCheckedAt: daysAgo(30) })]),
      failing,
    );
    expect(item(kept, "W1").meta.repositoryCopies).toEqual([old]);
    expect(item(kept, "W1").meta.repositoryCopiesCheckedAt).toBe(daysAgo(30));
    expect(item(kept, "W1").meta.repositoryCopiesTriedAt).toBe(NOW);

    const partial = sources({
      hal: () => ({ status: "found", copies: [halNotice] }),
      europepmc: () => ({ status: "failed" }),
    });
    const stored = await run(makeCv([work("W1")]), partial);
    expect(item(stored, "W1").meta.repositoryCopies?.map((c) => c.id)).toEqual(["hal-05745947"]);
    expect(item(stored, "W1").meta.repositoryCopiesCheckedAt).toBeUndefined();
    expect(item(stored, "W1").meta.repositoryCopiesTriedAt).toBe(NOW);
  });

  it("asks the first source for every work due before any other source, and spares a work settled with a file the rest", async () => {
    const s = sources({
      hal: (doi) =>
        doi.endsWith("W1") ? { status: "found", copies: [halFile] } : { status: "none" },
    });
    await run(makeCv([work("W1"), work("W2"), work("W3")]), s);
    expect(s.asked).toEqual([
      "hal:10.1234/W1",
      "hal:10.1234/W2",
      "hal:10.1234/W3",
      "europepmc:10.1234/W2",
      "openaire:10.1234/W2",
      "zenodo:10.1234/W2",
      "europepmc:10.1234/W3",
      "openaire:10.1234/W3",
      "zenodo:10.1234/W3",
    ]);
  });

  it("when the budget ends after the first source: the notices found are stored, the attempt stamped, and what the other sources said before is kept", async () => {
    const start = Date.now();
    const s = sources({
      hal: (doi) => {
        if (doi.endsWith("W1")) vi.spyOn(Date, "now").mockImplementation(() => start + 60_000);
        return { status: "found", copies: [halNotice] };
      },
    });
    const oldPmc = { ...pmc, hasFile: false, retrievedAt: daysAgo(30) };
    try {
      const cv = await run(
        makeCv([
          work("W1", { repositoryCopies: [oldPmc], repositoryCopiesCheckedAt: daysAgo(30) }),
          work("W2"),
        ]),
        s,
      );
      // W2 was never examined, so the rotation asks it first; the clock jumps on W1, the last of phase 1.
      expect(s.asked).toEqual(["hal:10.1234/W2", "hal:10.1234/W1"]);
      expect(item(cv, "W1").meta.repositoryCopies).toEqual([
        { ...halNotice, retrievedAt: NOW },
        oldPmc,
      ]);
      expect(item(cv, "W1").meta.repositoryCopiesCheckedAt).toBe(daysAgo(30));
      expect(item(cv, "W1").meta.repositoryCopiesTriedAt).toBe(NOW);
      expect(item(cv, "W2").meta.repositoryCopies).toEqual([{ ...halNotice, retrievedAt: NOW }]);
      expect(item(cv, "W2").meta.repositoryCopiesCheckedAt).toBeUndefined();
      expect(item(cv, "W2").meta.repositoryCopiesTriedAt).toBe(NOW);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it("asks the closed journal articles with a DOI first, then the ones open at the publisher only; never-checked first, within the cap, not again within the refresh window", async () => {
    const works = [
      work("W-gold", { oaIsOpen: true, oaStatus: "gold" }),
      work("W-green", { oaIsOpen: true, oaStatus: "green" }),
      work("W-open", { oaIsOpen: true }),
      work("W-nodoi", {}, { DOI: undefined }),
      work("W-chapter", {}, { type: "chapter" }),
      work("W-fresh", { repositoryCopiesCheckedAt: daysAgo(REPOSITORY_COPIES_REFRESH_DAYS - 1) }),
      work("W-stale", { repositoryCopiesCheckedAt: daysAgo(REPOSITORY_COPIES_REFRESH_DAYS + 1) }),
      work("W-tried", { repositoryCopiesTriedAt: daysAgo(1) }),
      work("W-never"),
    ];
    const s = sources({});
    await run(makeCv(works), s);
    const askedHal = s.asked.filter((a) => a.startsWith("hal:")).map((a) => a.slice(12));
    expect(askedHal).toEqual(["W-never", "W-gold", "W-stale", "W-tried"]);
    expect(REPOSITORY_COPIES_MAX_WORKS).toBeGreaterThan(0);
  });

  it("drops the copies of a work that stopped being a candidate", async () => {
    const s = sources({});
    const cv = await run(
      makeCv([
        work("W-now-open", {
          oaIsOpen: true,
          repositoryCopies: [{ ...halFile, retrievedAt: daysAgo(2) }],
          repositoryCopiesCheckedAt: daysAgo(2),
          repositoryCopiesTriedAt: daysAgo(2),
        }),
      ]),
      s,
    );
    expect(item(cv, "W-now-open").meta.repositoryCopies).toBeUndefined();
    expect(item(cv, "W-now-open").meta.repositoryCopiesCheckedAt).toBeUndefined();
    expect(s.asked).toEqual([]);
  });

  it("treats a source that throws as a failure of that source: old copies kept, attempt stamped, sync unbroken", async () => {
    const old = { ...halNotice, retrievedAt: daysAgo(30) };
    const s = sources({
      hal: () => {
        throw new Error("unforeseen shape");
      },
    });
    const cv = await run(
      makeCv([work("W1", { repositoryCopies: [old], repositoryCopiesCheckedAt: daysAgo(30) })]),
      s,
    );
    expect(item(cv, "W1").meta.repositoryCopies).toEqual([old]);
    expect(item(cv, "W1").meta.repositoryCopiesCheckedAt).toBe(daysAgo(30));
    expect(item(cv, "W1").meta.repositoryCopiesTriedAt).toBe(NOW);
    expect(s.asked).toEqual([
      "hal:10.1234/W1",
      "europepmc:10.1234/W1",
      "openaire:10.1234/W1",
      "zenodo:10.1234/W1",
    ]);
  });

  it("spaces its Zenodo calls by the interval it is given", async () => {
    const at: number[] = [];
    const s = sources({
      zenodo: () => {
        at.push(Date.now());
        return { status: "none" };
      },
    });
    await enrichCvWithRepositoryCopies(makeCv([work("W1"), work("W2")]), MAILTO, {
      lookups: s.lookups,
      now: NOW,
      zenodoIntervalMs: 60,
    });
    expect(at).toHaveLength(2);
    expect(at[1]! - at[0]!).toBeGreaterThanOrEqual(50);
  });

  it("clears what a source now denies while keeping what a failing source said before — source by source, in one work", async () => {
    const oldHal = { ...halNotice, retrievedAt: daysAgo(30) };
    const oldPmc = { ...pmc, hasFile: false, retrievedAt: daysAgo(30) };
    const s = sources({ europepmc: () => ({ status: "failed" }) });
    const cv = await run(
      makeCv([
        work("W1", { repositoryCopies: [oldHal, oldPmc], repositoryCopiesCheckedAt: daysAgo(30) }),
      ]),
      s,
    );
    expect(item(cv, "W1").meta.repositoryCopies).toEqual([oldPmc]);
    expect(item(cv, "W1").meta.repositoryCopiesCheckedAt).toBe(daysAgo(30));
    expect(item(cv, "W1").meta.repositoryCopiesTriedAt).toBe(NOW);
  });

  it("when the budget ends inside the second phase: the sources not reached are skipped without a call, what was found is stored, the attempt stamped", async () => {
    const start = Date.now();
    const pmcNotice = { ...pmc, hasFile: false };
    const s = sources({
      hal: () => ({ status: "found", copies: [halNotice] }),
      europepmc: () => {
        vi.spyOn(Date, "now").mockImplementation(() => start + 60_000);
        return { status: "found", copies: [pmcNotice] };
      },
    });
    try {
      const cv = await run(makeCv([work("W1")]), s);
      expect(s.asked).toEqual(["hal:10.1234/W1", "europepmc:10.1234/W1"]);
      expect(item(cv, "W1").meta.repositoryCopies?.map((c) => c.id)).toEqual([
        "hal-05745947",
        "PMC1",
      ]);
      expect(item(cv, "W1").meta.repositoryCopiesCheckedAt).toBeUndefined();
      expect(item(cv, "W1").meta.repositoryCopiesTriedAt).toBe(NOW);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it("launches no second phase at all when the first spent the budget, keeping what it found", async () => {
    const start = Date.now();
    const s = sources({
      hal: () => {
        vi.spyOn(Date, "now").mockImplementation(() => start + 60_000);
        return { status: "found", copies: [halNotice] };
      },
    });
    try {
      const cv = await run(makeCv([work("W1")]), s);
      expect(s.asked).toEqual(["hal:10.1234/W1"]);
      expect(item(cv, "W1").meta.repositoryCopies?.map((c) => c.id)).toEqual(["hal-05745947"]);
    } finally {
      vi.restoreAllMocks();
    }
  });
});
