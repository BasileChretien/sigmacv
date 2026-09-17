import { describe, expect, it } from "vitest";
import { migrateContributionStubs } from "@/lib/canonical/migrateContributions";
import { safeParseCanonicalCv } from "@/lib/canonical/schema";
import { proseStarterStrings } from "@/lib/i18n/proseStarter";

/**
 * Read-time migration of the TEXT contribution stubs (#494's guessed ten, #512's
 * picked ones) into structured contributions: picked and worked-on stubs become
 * cards, untouched guesses disappear, the owner's own prose stays, the stale
 * prompts are reworded or dropped, and a clean document passes through as is.
 */

const en = proseStarterStrings("en-US");
const fr = proseStarterStrings("fr-FR");
const OLD_INTRO_EN =
  "[Up to ten contributions. For each: the period, the audience (A academic community, B practice community, C general public), your role, and the impact with something the reader can check. Below, your most cited and most recent outputs as candidates: keep, merge or replace them.]";

const guessed = (n: number, title: string, year = "2020") =>
  [
    `${n}. ${title} (${year} · Audience : A / B / C)`,
    "Role : [to complete]",
    "Impact : [to complete]",
    `Reference : Someone (${year}). ${title}. Journal. https://doi.org/10.1/x${n}`,
  ].join("\n");

const item = (id: string, title: string) => ({
  id,
  source: "openalex",
  sourceId: `https://openalex.org/${id}`,
  included: true,
  notMine: false,
  order: 0,
  authoredBySelf: true,
  selfNameVariants: [],
  csl: { id, type: "article-journal", title },
  meta: {},
});

function rawDoc(body: string, extra: Record<string, unknown> = {}) {
  return {
    schemaVersion: 2,
    id: "m",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Owner" },
    display: {},
    sections: [
      {
        id: "pubs",
        type: "publications",
        title: "Publications",
        visible: false,
        order: 0,
        items: [
          item("W1", "Immune Checkpoint Inhibitor Rechallenge (a study)"),
          item("W2", "Myelodysplastic syndrome and PARP inhibitors"),
          item("W3", "Worked-on guess"),
        ],
      },
      {
        id: "k",
        type: "narrative-knowledge",
        title: "Contributions",
        visible: true,
        order: 1,
        items: [],
        body,
        ...extra,
      },
    ],
    provenance: { generatedAt: "2026-09-17T00:00:00.000Z", sources: ["openalex"] },
  };
}

const section = (doc: unknown) =>
  (doc as { sections: { id: string; body?: string; contributions?: unknown[] }[] }).sections.find(
    (s) => s.id === "k",
  )!;

describe("migrateContributionStubs", () => {
  it("turns picked and worked-on stubs into cards, drops untouched guesses, keeps the owner's prose", () => {
    const body = [
      en.draftNote,
      OLD_INTRO_EN,
      guessed(1, "Immune Checkpoint Inhibitor Rechallenge (a study)"),
      guessed(2, "Some untouched guess"),
      [
        "3. Worked-on guess (2019 · Audience : A / B / C)",
        "Role : I designed the analysis",
        "Impact : [to complete]",
        "Reference : x",
      ].join("\n"),
      "My own paragraph about the programme.",
      [
        "11. Myelodysplastic syndrome and PARP inhibitors (2020 · Audience : A / B / C) [[W2 | Morice et al. 2020]]",
        "Role : [to complete]",
        "Impact : Changed the monitoring of patients",
        "Cited in the guideline : NCCN Guidelines Insights: Ovarian Cancer (J Natl Compr Canc Netw, 2024). https://pubmed.ncbi.nlm.nih.gov/39413835/",
        "Cited in the guideline : A guideline without a link",
        "Reference : Morice, P. (2020). Myelodysplastic syndrome.",
      ].join("\n"),
    ].join("\n\n");
    const out = migrateContributionStubs(rawDoc(body));
    const k = section(out);
    expect(k.contributions).toEqual([
      { id: "c1", itemId: "W3", period: "2019", role: "I designed the analysis" },
      {
        id: "c2",
        itemId: "W2",
        period: "2020",
        impact: "Changed the monitoring of patients",
        citedIn: [
          {
            text: "NCCN Guidelines Insights: Ovarian Cancer (J Natl Compr Canc Netw, 2024)",
            url: "https://pubmed.ncbi.nlm.nih.gov/39413835/",
          },
          { text: "A guideline without a link" },
        ],
      },
    ]);
    expect(k.body).toBe(
      [en.draftNote, en.contribIntro, "My own paragraph about the programme."].join("\n\n"),
    );
    // The migrated document validates.
    const parsed = safeParseCanonicalCv(rawDoc(body));
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.sections.find((s) => s.id === "k")!.contributions).toHaveLength(2);
    }
  });

  it("drops a guessed list nobody touched, and the pick prompt only goes once a card exists", () => {
    const untouched = [fr.contribIntro, guessed(1, "A"), guessed(2, "B"), fr.pickPrompt].join(
      "\n\n",
    );
    const k = section(migrateContributionStubs(rawDoc(untouched)));
    expect(k.contributions).toBeUndefined();
    expect(k.body).toBe([fr.contribIntro, fr.pickPrompt].join("\n\n"));
  });

  it("separates stubs glued together, keeps text before them, and keeps an unmatched worked guess by title", () => {
    const body = [
      "Lead-in line",
      "1. Nothing matches this (2018 · Audience : A / B / C)",
      "Impact : Something real",
      "2. Another guess (2018 · Audience : A / B / C)",
      "Role : [to complete]",
    ].join("\n");
    const k = section(migrateContributionStubs(rawDoc(body)));
    expect(k.contributions).toEqual([
      { id: "c1", title: "Nothing matches this", period: "2018", impact: "Something real" },
    ]);
    expect(k.body).toBe("Lead-in line");
  });

  it("appends after existing cards without reusing their ids, and removes the pick prompt then", () => {
    const body = [
      en.pickPrompt,
      "1. Myelodysplastic syndrome and PARP inhibitors ([to complete] · Audience : A / B / C) [[W2 | Morice 2020]]",
    ].join("\n\n");
    const k = section(
      migrateContributionStubs(
        rawDoc(body, { contributions: [{ id: "c1" }, { id: "c2", title: "Kept" }] }),
      ),
    );
    expect(k.contributions).toEqual([
      { id: "c1" },
      { id: "c2", title: "Kept" },
      { id: "c3", itemId: "W2" },
    ]);
    expect(k.body).toBe("");
  });

  it("turns a paragraph of nothing but citation markers into cards, in order, before the picked stubs", () => {
    // What the old picker left at the top of the section, then a picked stub for W1.
    // Exactly as the old picker left them: glued onto the starter note, no separator.
    const body = [
      `[[dataset:datacite:10-5281-zenodo-1 | Dolladille, C., &…]] [[W3 | Vigne et al. 2022]]${en.draftNote}`,
      en.contribIntro,
      "Prose that cites [[W2 | Morice 2020]] in a sentence stays prose.",
      "[[W2 | Morice 2020]] showed this, and a sentence starting with a marker stays prose.",
      "1. Immune Checkpoint Inhibitor Rechallenge (a study) (2020 · Audience : A / B / C) [[W1 | D]]",
    ].join("\n\n");
    const k = section(migrateContributionStubs(rawDoc(body)));
    expect(k.contributions).toEqual([
      { id: "c1", itemId: "dataset:datacite:10-5281-zenodo-1" },
      { id: "c2", itemId: "W3" },
      { id: "c3", itemId: "W1", period: "2020" },
    ]);
    expect(k.body).toBe(
      [
        en.draftNote,
        en.contribIntro,
        "Prose that cites [[W2 | Morice 2020]] in a sentence stays prose.",
        "[[W2 | Morice 2020]] showed this, and a sentence starting with a marker stays prose.",
      ].join("\n\n"),
    );
  });

  it("converts a marker paragraph even with no stub left, and never duplicates a card", () => {
    // The owner already saved once: no numbered stub, one card for W3, the markers still there.
    const body = ["[[W3 | Vigne]]", "[[W3]]  [[W2 | Morice]]", en.pickPrompt].join("\n\n");
    const k = section(
      migrateContributionStubs(rawDoc(body, { contributions: [{ id: "c1", itemId: "W3" }] })),
    );
    expect(k.contributions).toEqual([
      { id: "c1", itemId: "W3" },
      { id: "c2", itemId: "W2" },
    ]);
    expect(k.body).toBe("");
    // A duplicate-only marker paragraph still goes (the card exists already).
    const dup = section(
      migrateContributionStubs(rawDoc("[[W3]]", { contributions: [{ id: "c1", itemId: "W3" }] })),
    );
    expect(dup.contributions).toEqual([{ id: "c1", itemId: "W3" }]);
    expect(dup.body).toBe("");
    // A marker with an empty id is not a marker paragraph.
    const blank = rawDoc("[[ | nothing]]");
    expect(migrateContributionStubs(blank)).toBe(blank);
  });

  it("a card made from a marker starts like a picked one: year and guideline citations, malformed values left out", () => {
    const doc = rawDoc("[[W2 | Morice]] [[W1 | D]]");
    const items = (doc.sections[0] as { items: { meta: Record<string, unknown> }[] }).items;
    items[1]!.meta = {
      year: 2020,
      guidelineCitations: [
        {
          pmid: "39413835",
          title: "NCCN Guidelines.",
          source: "J Natl Compr Canc Netw",
          year: 2024,
        },
        { pmid: 12, title: "Bad pmid" },
        { pmid: "1", title: "Bare" },
        "junk",
      ],
    };
    const k = section(migrateContributionStubs(doc));
    expect(k.contributions).toEqual([
      {
        id: "c1",
        itemId: "W2",
        period: "2020",
        citedIn: [
          {
            text: "NCCN Guidelines (J Natl Compr Canc Netw, 2024)",
            url: "https://pubmed.ncbi.nlm.nih.gov/39413835/",
          },
          { text: "Bare", url: "https://pubmed.ncbi.nlm.nih.gov/1/" },
        ],
      },
      { id: "c2", itemId: "W1" },
    ]);
    expect(safeParseCanonicalCv(doc).success).toBe(true);
  });

  it("is idempotent: a migrated document is passed through on the next read", () => {
    const body = [
      "1. Myelodysplastic syndrome and PARP inhibitors (2020 · Audience : A / B / C) [[W2 | M]]",
      "Role : Lead",
    ].join("\n");
    const once = migrateContributionStubs(rawDoc(body));
    expect(migrateContributionStubs(once)).toBe(once);
    // An oversized token id is capped to the schema's limit.
    const long = "x".repeat(2000);
    const capped = section(
      migrateContributionStubs(rawDoc(`1. T (2020 · Audience : A / B / C) [[${long} | L]]`)),
    );
    expect((capped.contributions![0] as { itemId: string }).itemId).toHaveLength(1024);
  });

  it("passes a clean document, another section type, and non-documents through untouched", () => {
    const clean = rawDoc("Just prose.\n\n1. A numbered line of my own");
    expect(migrateContributionStubs(clean)).toBe(clean);
    const other = rawDoc("x");
    (other.sections[1] as { type: string }).type = "statement";
    (other.sections[1] as { body: string }).body = guessed(1, "A");
    expect(migrateContributionStubs(other)).toBe(other);
    expect(migrateContributionStubs(null)).toBeNull();
    expect(migrateContributionStubs("x")).toBe("x");
    const noSections = { id: "x" };
    expect(migrateContributionStubs(noSections)).toBe(noSections);
    // A body that only LOOKS like it (the gate passes) but holds no parsable stub is left as is.
    const lookalike = rawDoc("1. x : A / B / C) tail");
    expect(migrateContributionStubs(lookalike)).toBe(lookalike);
  });
});
