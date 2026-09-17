import { describe, expect, it } from "vitest";
import {
  CONTRIBUTIONS_MAX,
  CanonicalCvSchema,
  proseSectionHasContent,
  type CanonicalCv,
  type Contribution,
  type CvItem,
} from "@/lib/canonical/schema";
import {
  addContribution,
  blankContribution,
  contributionFromItem,
  contributionItem,
  contributionTitle,
  isPrintableContribution,
  sectionProseTexts,
  moveContribution,
  removeContribution,
  updateContribution,
} from "@/lib/canonical/contributions";
import { prefillEmptyProse } from "@/lib/canonical/proseStarter";
import { narrativePageEstimate, proseSectionPages } from "@/lib/canonical/pageEstimate";
import { computeCvHealth } from "@/lib/cv/health";
import { isUnfilledNarrativeModule } from "@/lib/ai/sections";
import { proseStarterStrings } from "@/lib/i18n/proseStarter";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { diffSnapshots } from "@/lib/cv/snapshots";

/**
 * Structured contributions: the pure document operations behind the cards
 * (add / edit / move / delete), what a picked entry starts with, and how the
 * rest of the product counts a section that holds contributions.
 */

function work(id: string, meta: CvItem["meta"] = {}, over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: ["Chrétien"],
    csl: {
      id,
      type: "article-journal",
      title: `Work ${id}`,
      author: [{ family: "Chrétien", given: "Basile" }],
      issued: { "date-parts": [[2020]] },
    },
    meta: { year: 2020, ...meta },
    ...over,
  };
}

const PICK = proseStarterStrings("en-US").pickPrompt;

function makeCv(
  contributions?: Contribution[],
  items: CvItem[] = [work("W1"), work("W2")],
): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "contrib",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Basile Chrétien" },
    display: { locale: "en-US" },
    sections: [
      { id: "pubs", type: "publications", title: "Publications", visible: false, order: 0, items },
      {
        id: "k",
        type: "narrative-knowledge",
        title: "Contributions",
        visible: true,
        order: 1,
        items: [],
        body: `[Intro.]\n\n${PICK}`,
        ...(contributions ? { contributions } : {}),
      },
    ],
    provenance: { generatedAt: "2026-09-17T00:00:00.000Z", sources: ["openalex"] },
  });
}

const knowledge = (cv: CanonicalCv) => cv.sections.find((s) => s.id === "k")!;

describe("what a picked entry starts with", () => {
  it("links the entry, takes its year as the period, and its guideline citations as 'cited in' lines", () => {
    const item = work("W1", {
      year: 2021,
      guidelineCitations: [
        { pmid: "34724392", title: "ASCO Guideline Update.", source: "J Clin Oncol", year: 2021 },
        { pmid: "1", title: "Bare guideline" },
      ],
    });
    expect(contributionFromItem([], item)).toEqual({
      id: "c1",
      itemId: "W1",
      period: "2021",
      citedIn: [
        {
          text: "ASCO Guideline Update (J Clin Oncol, 2021)",
          url: "https://pubmed.ncbi.nlm.nih.gov/34724392/",
        },
        { text: "Bare guideline", url: "https://pubmed.ncbi.nlm.nih.gov/1/" },
      ],
    });
    // No year anywhere, no guidelines: just the link.
    const bare = work("W9", {}, { csl: { id: "W9", type: "book", title: "T" }, meta: {} });
    expect(contributionFromItem([], bare)).toEqual({ id: "c1", itemId: "W9" });
    // A CSL-only year still counts.
    const cslYear = work("W8", {}, { meta: {} });
    expect(contributionFromItem([], cslYear).period).toBe("2020");
  });

  it("never reuses an id already in the section", () => {
    expect(blankContribution([{ id: "c1" }, { id: "c3" }])).toEqual({ id: "c4" });
    expect(blankContribution([])).toEqual({ id: "c1" });
  });
});

describe("the card operations", () => {
  it("add appends, drops the 'pick your publications' prompt, and stops at the cap", () => {
    const cv = makeCv();
    const one = addContribution(cv, "k", { id: "c1", itemId: "W1" });
    expect(knowledge(one).contributions).toEqual([{ id: "c1", itemId: "W1" }]);
    expect(knowledge(one).body).toBe("[Intro.]");
    expect(knowledge(cv).body).toContain(PICK); // immutable
    const full = makeCv(Array.from({ length: CONTRIBUTIONS_MAX }, (_, i) => ({ id: `c${i + 1}` })));
    expect(addContribution(full, "k", { id: "x" })).toBe(full);
    expect(addContribution(cv, "nope", { id: "x" })).toBe(cv);
  });

  it("update merges a patch, drops emptied fields, and sorts and dedupes the audience", () => {
    const cv = makeCv([{ id: "c1", itemId: "W1", role: "Lead", impact: "Old" }]);
    const next = updateContribution(cv, "k", "c1", {
      impact: "",
      period: "2019–2023",
      audience: ["C", "A", "A"],
      citedIn: [],
    });
    expect(knowledge(next).contributions).toEqual([
      { id: "c1", itemId: "W1", period: "2019–2023", audience: ["A", "C"], role: "Lead" },
    ]);
    expect(updateContribution(cv, "k", "zz", { role: "x" })).toBe(cv);
    // A blank "cited in" line being typed stays until it is removed.
    const typing = updateContribution(cv, "k", "c1", { citedIn: [{ text: "" }] });
    expect(knowledge(typing).contributions![0]!.citedIn).toEqual([{ text: "" }]);
  });

  it("remove deletes one card, and the last one leaves no empty list behind", () => {
    const cv = makeCv([{ id: "c1" }, { id: "c2" }]);
    const one = removeContribution(cv, "k", "c1");
    expect(knowledge(one).contributions).toEqual([{ id: "c2" }]);
    expect(knowledge(removeContribution(one, "k", "c2")).contributions).toBeUndefined();
    expect(removeContribution(cv, "k", "zz")).toBe(cv);
  });

  it("move swaps with a neighbour and ignores a move past either end", () => {
    const cv = makeCv([{ id: "c1" }, { id: "c2" }, { id: "c3" }]);
    const ids = (x: CanonicalCv) => knowledge(x).contributions!.map((c) => c.id);
    expect(ids(moveContribution(cv, "k", "c3", -1))).toEqual(["c1", "c3", "c2"]);
    expect(ids(moveContribution(cv, "k", "c1", 1))).toEqual(["c2", "c1", "c3"]);
    expect(moveContribution(cv, "k", "c1", -1)).toBe(cv);
    expect(moveContribution(cv, "k", "c3", 1)).toBe(cv);
    expect(moveContribution(cv, "k", "zz", 1)).toBe(cv);
  });
});

describe("the prose a section holds", () => {
  it("is the body, then each card's role and impact, blanks left out", () => {
    expect(
      sectionProseTexts({
        body: "Intro",
        contributions: [
          { id: "c1", role: "R1", impact: " " },
          { id: "c2", impact: "I2" },
        ],
      }),
    ).toEqual(["Intro", "R1", "I2"]);
    expect(sectionProseTexts({})).toEqual([]);
  });
});

describe("titles and the record", () => {
  it("the owner's title wins; else the entry's; an entry off the record gives nothing to print", () => {
    const cv = makeCv(undefined, [
      work("W1"),
      work("W2", {}, { notMine: true }),
      work("W3", {}, { displayTextOverride: "My <i>own</i> wording" }),
    ]);
    expect(contributionTitle(cv, { id: "a", itemId: "W1", title: "Mine" })).toBe("Mine");
    expect(contributionTitle(cv, { id: "a", itemId: "W1", title: "  " })).toBe("Work W1");
    expect(contributionTitle(cv, { id: "a", itemId: "W3" })).toBe("My own wording");
    expect(contributionItem(cv, { id: "a", itemId: "W2" })).toBeUndefined();
    expect(contributionTitle(cv, { id: "a", itemId: "W2" })).toBe("");
    expect(isPrintableContribution(cv, { id: "a", itemId: "W2" })).toBe(false);
    expect(isPrintableContribution(cv, { id: "a", title: "An experience" })).toBe(true);
    expect(contributionTitle(cv, { id: "a" })).toBe("");
    // An entry excluded from the current view is off the record for this view.
    const excluded = { ...cv, display: { ...cv.display, excludedItems: { pubs: ["W1"] } } };
    expect(contributionItem(excluded, { id: "a", itemId: "W1" })).toBeUndefined();
  });
});

describe("contributions across a re-sync and in the saved-version comparison", () => {
  it("a re-sync keeps the cards of a carried prose section", () => {
    const previous = makeCv([{ id: "c1", itemId: "W1", role: "Lead" }]);
    const rebuilt = buildCanonicalCv({
      id: previous.id,
      resolved: { orcid: "0000-0002-7483-2489", authorIds: [], displayName: "Basile Chrétien" },
      works: [],
      now: "2026-09-18T00:00:00.000Z",
      previous,
    });
    expect(knowledge(rebuilt).contributions).toEqual([{ id: "c1", itemId: "W1", role: "Lead" }]);
  });

  it("an edited card is a narrative change even when the prose did not move", () => {
    const older = makeCv([{ id: "c1", itemId: "W1" }]);
    const newer = updateContribution(older, "k", "c1", { role: "Lead" });
    expect(diffSnapshots(older, newer).narrativeChanged).toEqual([
      expect.objectContaining({ sectionId: "k", title: "Contributions", delta: 0 }),
    ]);
    expect(diffSnapshots(older, older).narrativeChanged).toEqual([]);
  });
});

describe("a section that holds contributions", () => {
  it("has content, is not refilled, and is not an unfilled narrative module", () => {
    const empty = { ...knowledge(makeCv()), body: "" };
    expect(proseSectionHasContent(empty)).toBe(false);
    expect(isUnfilledNarrativeModule(empty)).toBe(true);
    const withCards = { ...empty, contributions: [{ id: "c1", itemId: "W1" }] };
    expect(proseSectionHasContent(withCards)).toBe(true);
    expect(isUnfilledNarrativeModule(withCards)).toBe(false);
    const cv = makeCv([{ id: "c1", itemId: "W1" }]);
    const blanked = {
      ...cv,
      sections: cv.sections.map((s) => (s.id === "k" ? { ...s, body: "" } : s)),
    };
    expect(prefillEmptyProse(blanked)).toBe(blanked);
  });

  it("counts toward the page estimate", () => {
    const bare = { ...knowledge(makeCv()), body: "" };
    expect(proseSectionPages(bare)).toBe(0);
    const cards = {
      ...bare,
      contributions: [
        {
          id: "c1",
          itemId: "W1",
          title: "T",
          period: "2020",
          role: "r".repeat(1500),
          impact: "i".repeat(1500),
          citedIn: [{ text: "g".repeat(200) }],
        },
      ],
    };
    expect(proseSectionPages(cards)).toBeGreaterThan(0.9);
    const cv = makeCv(cards.contributions);
    expect(narrativePageEstimate(cv).pages).toBeGreaterThan(narrativePageEstimate(makeCv()).pages);
  });

  it("counts a linked contribution as evidence, and one whose entry left the record as unresolved", () => {
    const linked = computeCvHealth(makeCv([{ id: "c1", itemId: "W1" }]));
    expect(linked.narrativesWithoutEvidence).toBe(0);
    expect(linked.unresolvedEvidenceRefs).toBe(0);
    const gone = computeCvHealth(
      makeCv([
        { id: "c1", itemId: "W-gone" },
        { id: "c2", title: "X" },
      ]),
    );
    expect(gone.unresolvedEvidenceRefs).toBe(1);
    expect(gone.narrativesWithoutEvidence).toBe(1);
  });
});
