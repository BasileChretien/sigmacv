import { describe, expect, it, vi } from "vitest";

// The pass shares the bounded-pass helpers in canonical/enrich, whose import graph
// reaches the Prisma client (FORRT); no database is touched here.
vi.mock("@/lib/db", () => ({ prisma: {} }));

import {
  enrichCvWithGuidelineCitations,
  GUIDELINE_CITATIONS_MAX_CITERS,
  GUIDELINE_CITATIONS_MAX_PER_WORK,
  GUIDELINE_CITATIONS_MAX_WORKS,
  GUIDELINE_CITATIONS_REFRESH_DAYS,
  guidelinesFor,
} from "@/lib/pubmed/guidelineCitationsPass";
import type { PubmedSummary } from "@/lib/pubmed/client";
import { guidelineCitationLine, pubmedUrl } from "@/lib/pubmed/guidelineText";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

/**
 * The owner sync's guideline-citations pass: iCite's clinical citers of each
 * PubMed-indexed work, typed through PubMed, kept when they are guidelines.
 * Answers stamp the checked date and write or clear the list; a failed hop
 * stamps the attempt only and keeps the old list; the citer cap defers works to
 * a later sync; a work that stops being a candidate loses its list. Both clients
 * are injected — their own behaviour is `icite-client.test.ts` and
 * `pubmed-client.test.ts`.
 */

const NOW = "2026-09-17T00:00:00.000Z";
const MAILTO = "ci@example.org";
const daysAgo = (n: number) => new Date(Date.parse(NOW) - n * 86_400_000).toISOString();

function work(id: string, meta: CvItem["meta"] = {}, over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id, type: "article-journal", title: `Work ${id}`, DOI: `10.1234/${id}` },
    meta: { pmid: id.replace(/\D/g, "") || undefined, ...meta },
    ...over,
  };
}

function makeCv(items: CvItem[]): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "guidelines",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Owner" },
    display: {},
    sections: [
      { id: "pubs", type: "publications", title: "Publications", visible: true, order: 0, items },
    ],
    provenance: { generatedAt: NOW, sources: ["openalex"] },
  });
}

const summary = (pmid: string, over: Partial<PubmedSummary> = {}): PubmedSummary => ({
  pmid,
  title: `Guideline ${pmid}`,
  source: "J Test",
  year: 2024,
  publicationTypes: ["Journal Article", "Practice Guideline"],
  ...over,
});

/** Injected hops: citers by work PMID, summaries by citer PMID, each recording its calls. */
function clients(
  citers: Record<string, string[]> | null,
  summaries: Record<string, PubmedSummary> | null,
) {
  const asked = { citers: [] as string[][], summaries: [] as string[][] };
  return {
    asked,
    citers: vi.fn(async (pmids: readonly string[], timeoutMs: number) => {
      asked.citers.push([...pmids]);
      // The hop is given a positive share of the pass budget.
      expect(timeoutMs).toBeGreaterThan(0);
      if (citers === null) return null;
      const m = new Map<string, string[]>();
      for (const p of pmids) if (citers[p]) m.set(p, citers[p]);
      return m;
    }),
    summaries: vi.fn(async (pmids: readonly string[], _mailto: string, deadline: number) => {
      asked.summaries.push([...pmids]);
      expect(deadline).toBeGreaterThan(Date.now() - 1);
      if (summaries === null) return null;
      const m = new Map<string, PubmedSummary>();
      for (const p of pmids) if (summaries[p]) m.set(p, summaries[p]);
      return m;
    }),
  };
}

const item = (cv: CanonicalCv, id: string) => cv.sections[0]!.items.find((i) => i.id === id)!;
const run = (cv: CanonicalCv, c: ReturnType<typeof clients>, now = NOW) =>
  enrichCvWithGuidelineCitations(cv, MAILTO, { citers: c.citers, summaries: c.summaries, now });

describe("enrichCvWithGuidelineCitations", () => {
  it("stores the guidelines among a work's clinical citers, newest first, and stamps both dates", async () => {
    const c = clients(
      { "111": ["901", "902", "903"] },
      {
        "901": summary("901", { year: 2019 }),
        "902": summary("902", { publicationTypes: ["Randomized Controlled Trial"] }), // a citer, not a guideline
        "903": summary("903", { year: 2023, source: "Lancet" }),
      },
    );
    const cv = await run(makeCv([work("W111")]), c);
    expect(c.asked.citers).toEqual([["111"]]);
    expect(c.asked.summaries).toEqual([["901", "902", "903"]]);
    expect(item(cv, "W111").meta.guidelineCitations).toEqual([
      { pmid: "903", title: "Guideline 903", source: "Lancet", year: 2023 },
      { pmid: "901", title: "Guideline 901", source: "J Test", year: 2019 },
    ]);
    expect(item(cv, "W111").meta.guidelineCitationsCheckedAt).toBe(NOW);
    expect(item(cv, "W111").meta.guidelineCitationsTriedAt).toBe(NOW);
  });

  it("an answered 'no guideline' clears an old list; no citers means no PubMed call at all", async () => {
    const old = [{ pmid: "1", title: "Old", year: 2010 }];
    const c = clients({ "111": [] }, {});
    const cv = await run(
      makeCv([work("W111", { guidelineCitations: old, guidelineCitationsCheckedAt: daysAgo(60) })]),
      c,
    );
    expect(c.asked.summaries).toEqual([]);
    expect(item(cv, "W111").meta.guidelineCitations).toBeUndefined();
    expect(item(cv, "W111").meta.guidelineCitationsCheckedAt).toBe(NOW);
  });

  it("a failed iCite hop stamps the attempt only and keeps the old list; so does a failed PubMed hop", async () => {
    const old = [{ pmid: "1", title: "Old", year: 2010 }];
    const stale = daysAgo(60);
    const before = makeCv([
      work("W111", { guidelineCitations: old, guidelineCitationsCheckedAt: stale }),
    ]);
    const icite = await run(before, clients(null, {}));
    expect(item(icite, "W111").meta.guidelineCitations).toEqual(old);
    expect(item(icite, "W111").meta.guidelineCitationsCheckedAt).toBe(stale);
    expect(item(icite, "W111").meta.guidelineCitationsTriedAt).toBe(NOW);
    const pubmed = await run(before, clients({ "111": ["901"] }, null));
    expect(item(pubmed, "W111").meta.guidelineCitations).toEqual(old);
    expect(item(pubmed, "W111").meta.guidelineCitationsCheckedAt).toBe(stale);
    expect(item(pubmed, "W111").meta.guidelineCitationsTriedAt).toBe(NOW);
  });

  it("does not ask again about a work answered within the refresh window, and asks a stale one", async () => {
    const c = clients({ "111": ["901"], "222": ["901"] }, { "901": summary("901") });
    const cv = await run(
      makeCv([
        work("W111", {
          guidelineCitationsCheckedAt: daysAgo(GUIDELINE_CITATIONS_REFRESH_DAYS - 1),
        }),
        work("W222", {
          guidelineCitationsCheckedAt: daysAgo(GUIDELINE_CITATIONS_REFRESH_DAYS + 1),
        }),
      ]),
      c,
    );
    expect(c.asked.citers).toEqual([["222"]]);
    expect(item(cv, "W111").meta.guidelineCitations).toBeUndefined();
    expect(item(cv, "W222").meta.guidelineCitations).toHaveLength(1);
  });

  it("caps the works per sync, never-examined first, then oldest attempt first", async () => {
    // Four works tried before (the oldest attempt first), the rest never examined:
    // the cap takes every fresh work, then the two oldest attempts.
    const items = Array.from({ length: GUIDELINE_CITATIONS_MAX_WORKS + 2 }, (_, i) =>
      work(`W${1000 + i}`, i < 4 ? { guidelineCitationsTriedAt: daysAgo(40 - i) } : {}),
    );
    const c = clients({}, {});
    await run(makeCv(items), c);
    const asked = c.asked.citers[0]!;
    expect(asked).toHaveLength(GUIDELINE_CITATIONS_MAX_WORKS);
    expect(asked.slice(0, GUIDELINE_CITATIONS_MAX_WORKS - 2)).toEqual(
      items.slice(4).map((w) => w.meta.pmid),
    );
    expect(asked.slice(-2)).toEqual(["1000", "1001"]);
  });

  it("defers a work whose citers would overflow the per-sync citer cap, leaving it unstamped", async () => {
    const many = Array.from({ length: GUIDELINE_CITATIONS_MAX_CITERS - 1 }, (_, i) =>
      String(5000 + i),
    );
    const c = clients({ "111": many, "222": ["1", "2"], "333": ["3"] }, {});
    const cv = await run(makeCv([work("W111"), work("W222"), work("W333")]), c);
    // W111 fits; W222 would push the total over the cap and waits; W333 too (queue order).
    expect(item(cv, "W111").meta.guidelineCitationsCheckedAt).toBe(NOW);
    expect(item(cv, "W222").meta.guidelineCitationsTriedAt).toBeUndefined();
    expect(item(cv, "W333").meta.guidelineCitationsTriedAt).toBeUndefined();
    expect(c.asked.summaries[0]).toHaveLength(GUIDELINE_CITATIONS_MAX_CITERS - 1);
  });

  it("a work that is no longer a candidate loses its list and stamps; a work without a PMID is never asked", async () => {
    const old = [{ pmid: "1", title: "Old", year: 2010 }];
    const c = clients({}, {});
    const cv = await run(
      makeCv([
        work(
          "W111",
          { guidelineCitations: old, guidelineCitationsCheckedAt: NOW },
          { included: false },
        ),
        work("W222", { pmid: undefined, guidelineCitations: old }),
        work("W333", { retracted: true, guidelineCitations: old, guidelineCitationsTriedAt: NOW }),
      ]),
      c,
    );
    expect(c.asked.citers).toEqual([]);
    for (const id of ["W111", "W222", "W333"]) {
      expect(item(cv, id).meta.guidelineCitations, id).toBeUndefined();
      expect(item(cv, id).meta.guidelineCitationsCheckedAt, id).toBeUndefined();
      expect(item(cv, id).meta.guidelineCitationsTriedAt, id).toBeUndefined();
    }
  });

  it("is immutable and adds or removes no item", async () => {
    const before = makeCv([work("W111")]);
    const snapshot = JSON.stringify(before);
    const after = await run(before, clients({ "111": ["901"] }, { "901": summary("901") }));
    expect(JSON.stringify(before)).toBe(snapshot);
    expect(after.sections[0]!.items.map((i) => i.id)).toEqual(["W111"]);
  });
});

describe("guidelinesFor and the text helpers", () => {
  it("keeps only the guideline-typed citers, newest first, capped, titles and sources bounded", () => {
    const summaries = new Map<string, PubmedSummary>();
    for (let i = 0; i < GUIDELINE_CITATIONS_MAX_PER_WORK + 3; i++) {
      summaries.set(String(i), summary(String(i), { year: 2000 + i, title: "x".repeat(600) }));
    }
    summaries.set("nope", summary("nope", { publicationTypes: ["Review"] }));
    const list = guidelinesFor([...summaries.keys()], summaries);
    expect(list).toHaveLength(GUIDELINE_CITATIONS_MAX_PER_WORK);
    expect(list[0]!.year).toBe(2000 + GUIDELINE_CITATIONS_MAX_PER_WORK + 2);
    expect(list[0]!.title).toHaveLength(500);
    expect(list.some((g) => g.pmid === "nope")).toBe(false);
    // An unknown citer (no summary) is simply not a guideline.
    expect(guidelinesFor(["unknown"], summaries)).toEqual([]);
  });

  it("prints a guideline as title (journal, year) with whatever is known, and its PubMed page", () => {
    expect(
      guidelineCitationLine({
        pmid: "34724392",
        title: "ASCO Guideline Update.",
        source: "J Clin Oncol",
        year: 2021,
      }),
    ).toBe("ASCO Guideline Update (J Clin Oncol, 2021)");
    expect(guidelineCitationLine({ pmid: "1", title: "Bare", year: 2020 })).toBe("Bare (2020)");
    expect(guidelineCitationLine({ pmid: "1", title: "Bare" })).toBe("Bare");
    expect(pubmedUrl(" 34724392 ")).toBe("https://pubmed.ncbi.nlm.nih.gov/34724392/");
  });
});
