import { describe, expect, it, vi } from "vitest";
import {
  COPY_LOOKUPS,
  defaultLookups,
  enrichCvWithRepositoryCopies,
  REPOSITORY_COPIES_MAX_WORKS,
  REPOSITORY_COPIES_REFRESH_DAYS,
} from "@/lib/archiving/repositoryCopiesPass";
import type { CopyLookup, RepositoryCopy } from "@/lib/repositoryCopies/shared";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

// The pass shares the bounded-pass helpers in canonical/enrich, whose import graph
// reaches the Prisma client (FORRT); no database is touched here. The OpenAIRE
// token comes from the env: none here (the sources are injected anyway).
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/openaire/auth", () => ({ getOpenaireAccessToken: async () => null }));
const openaire = vi.hoisted(() => ({
  lookup: vi.fn(async (): Promise<CopyLookup> => ({ status: "none" })),
}));
vi.mock("@/lib/repositoryCopies/openaire", () => ({ lookupOpenaireCopy: openaire.lookup }));

/**
 * The owner sync's repository-copies pass: the first source (HAL) for every
 * work due, a few at a time, then the other sources in order for the works it
 * did not settle with a FILE; copies stored with their retrieval date, settled
 * source by source; "nothing anywhere" clears; a source failing keeps what it
 * said before and the work is retried behind the works never examined; a work
 * that stops being a candidate loses its copies. The clients are injected —
 * their own behaviour is `repository-copies-clients.test.ts`.
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
  enrichCvWithRepositoryCopies(cv, MAILTO, { lookups: s.lookups, now });

describe("enrichCvWithRepositoryCopies", () => {
  it("asks HAL, Europe PMC and OpenAIRE — never Zenodo, which OpenAIRE harvests — with a cap a whole CV fits under", () => {
    expect(COPY_LOOKUPS.map(([source]) => source)).toEqual(["hal", "europepmc", "openaire"]);
    expect(REPOSITORY_COPIES_MAX_WORKS).toBeGreaterThanOrEqual(300);
  });

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
    expect(s.asked).toEqual(["hal:10.1234/W1", "europepmc:10.1234/W1", "openaire:10.1234/W1"]);
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

  it("asks the first source for every work due before any other source, and spares a work settled with a file the rest", async () => {
    const s = sources({
      hal: (doi) =>
        doi.endsWith("W1") ? { status: "found", copies: [halFile] } : { status: "none" },
    });
    await run(makeCv([work("W1"), work("W2"), work("W3")]), s);
    expect(s.asked.slice(0, 3)).toEqual(["hal:10.1234/W1", "hal:10.1234/W2", "hal:10.1234/W3"]);
    // Phase 2 runs a few works at once: the set is what matters, not the interleaving.
    expect([...s.asked.slice(3)].sort()).toEqual([
      "europepmc:10.1234/W2",
      "europepmc:10.1234/W3",
      "openaire:10.1234/W2",
      "openaire:10.1234/W3",
    ]);
  });

  it("asks the closed journal articles with a DOI first, then the ones open at the publisher only; never-checked first, not again within the refresh window", async () => {
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
    expect(s.asked).toEqual(["hal:10.1234/W1", "europepmc:10.1234/W1", "openaire:10.1234/W1"]);
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

  it("launches no second phase at all when the first spent the budget: the notices found are stored, the attempt stamped, and what the other sources said before is kept", async () => {
    const start = Date.now();
    const s = sources({
      hal: (doi) => {
        // W2 was never examined, so it launches first; the clock jumps inside W1's call, the second launched.
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
      // Both HAL calls were launched; nothing else is asked once the clock jumped.
      expect([...s.asked].sort()).toEqual(["hal:10.1234/W1", "hal:10.1234/W2"]);
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

  it("keeps a few HAL calls in flight at once, and gives each work its own answers under that concurrency", async () => {
    const inFlight: string[] = [];
    let peak = 0;
    const release: Array<() => void> = [];
    const s = sources({
      hal: (doi) => {
        // Recorded synchronously; the answer itself waits until every call is launched.
        inFlight.push(doi);
        peak = Math.max(peak, inFlight.length);
        return { status: "none" };
      },
      europepmc: (doi) =>
        doi.endsWith("W2")
          ? {
              status: "found",
              copies: [{ ...pmc, id: "PMC-W2", url: "https://europepmc.org/article/PMC/PMC-W2" }],
            }
          : doi.endsWith("W5")
            ? {
                status: "found",
                copies: [{ ...pmc, id: "PMC-W5", url: "https://europepmc.org/article/PMC/PMC-W5" }],
              }
            : { status: "none" },
    });
    // Make HAL slow for the first four calls: each waits until all four workers
    // have launched theirs, so the peak in flight is observable; later calls pass.
    const hal = s.lookups[0]![1];
    let arrived = 0;
    const waiters: Array<() => void> = [];
    const slowHal = vi.fn(async (doi: string): Promise<CopyLookup> => {
      const result = await hal(doi);
      if (++arrived <= 4) {
        await new Promise<void>((resolve) => {
          waiters.push(resolve);
          if (waiters.length === 4) waiters.splice(0).forEach((w) => w());
        });
      }
      inFlight.splice(inFlight.indexOf(doi), 1);
      return result;
    });
    const lookups = [["hal", slowHal] as const, ...s.lookups.slice(1)] as typeof s.lookups;
    const cv = await enrichCvWithRepositoryCopies(
      makeCv([work("W1"), work("W2"), work("W3"), work("W4"), work("W5"), work("W6")]),
      MAILTO,
      { lookups, now: NOW },
    );
    expect(peak).toBe(4);
    expect(item(cv, "W2").meta.repositoryCopies?.map((c) => c.id)).toEqual(["PMC-W2"]);
    expect(item(cv, "W5").meta.repositoryCopies?.map((c) => c.id)).toEqual(["PMC-W5"]);
    for (const id of ["W1", "W3", "W4", "W6"]) {
      expect(item(cv, id).meta.repositoryCopies).toBeUndefined();
      expect(item(cv, id).meta.repositoryCopiesCheckedAt).toBe(NOW);
    }
  });

  it("stops launching works once phase 1's share is spent: the tail is neither asked nor stamped", async () => {
    const start = Date.now();
    let calls = 0;
    const s = sources({
      hal: () => {
        // The fourth launched call spends the clock; the workers launched it and
        // three others before any could see the jump, and launch nothing after.
        if (++calls === 4) vi.spyOn(Date, "now").mockImplementation(() => start + 60_000);
        return { status: "none" };
      },
    });
    try {
      const cv = await run(
        makeCv([work("W1"), work("W2"), work("W3"), work("W4"), work("W5"), work("W6")]),
        s,
      );
      expect(s.asked.filter((a) => a.startsWith("hal:"))).toHaveLength(4);
      for (const id of ["W5", "W6"]) {
        expect(item(cv, id).meta.repositoryCopiesTriedAt).toBeUndefined();
        expect(item(cv, id).meta.repositoryCopiesCheckedAt).toBeUndefined();
      }
      // The four launched works were asked HAL only (phase 2 had no budget): attempt stamped.
      for (const id of ["W1", "W2", "W3", "W4"]) {
        expect(item(cv, id).meta.repositoryCopiesTriedAt).toBe(NOW);
        expect(item(cv, id).meta.repositoryCopiesCheckedAt).toBeUndefined();
      }
    } finally {
      vi.restoreAllMocks();
    }
  });

  it("hands the sync's OpenAIRE access token to the OpenAIRE client — exchanged once, at the first call — and nothing to the others", async () => {
    const getToken = vi.fn(async () => "tok-1");
    const withToken = defaultLookups(getToken);
    expect(withToken.map(([source]) => source)).toEqual(["hal", "europepmc", "openaire"]);
    expect(getToken).not.toHaveBeenCalled();
    await withToken[2]![1]("10.1234/W1", MAILTO, 500);
    await withToken[2]![1]("10.1234/W2", MAILTO, 500);
    expect(getToken).toHaveBeenCalledTimes(1);
    expect(openaire.lookup).toHaveBeenLastCalledWith("10.1234/W2", MAILTO, 500, "tok-1");
    await defaultLookups(async () => null)[2]![1]("10.1234/W3", MAILTO, 500);
    expect(openaire.lookup).toHaveBeenLastCalledWith("10.1234/W3", MAILTO, 500, null);
    expect(defaultLookups()[0]![1]).toBe(COPY_LOOKUPS[0]![1]);
  });
});
