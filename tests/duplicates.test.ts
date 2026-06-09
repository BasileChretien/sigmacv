import { describe, expect, it } from "vitest";
import {
  CANONICAL_SCHEMA_VERSION,
  DisplayChoicesSchema,
  type CanonicalCv,
  type CvItem,
  type CvSectionType,
} from "@/lib/canonical/schema";
import {
  annotateDuplicates,
  detectDuplicates,
  duplicatePairKey,
  itemAnchor,
  normAward,
  normDoi,
  normPatentNumber,
  normPmid,
  normTitle,
  normTrialId,
  relationCandidateDois,
  surnameSet,
  titleTokenJaccard,
  trigramSim,
  type DoiRelation,
} from "@/lib/canonical/duplicates";

const DISPLAY = DisplayChoicesSchema.parse({});

function mkItem(id: string, over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: id,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    meta: {},
    ...over,
  };
}

interface CiteFields {
  title: string;
  doi?: string;
  pmid?: string;
  year?: number;
  authors?: string[];
  container?: string;
  volume?: string;
  page?: string;
  peerReviewed?: boolean;
  citedByCount?: number;
}

function cite(id: string, f: CiteFields, over: Partial<CvItem> = {}): CvItem {
  return mkItem(id, {
    csl: {
      id,
      type: "article-journal",
      title: f.title,
      ...(f.doi ? { DOI: f.doi } : {}),
      ...(f.authors ? { author: f.authors.map((family) => ({ family })) } : {}),
      ...(f.container ? { "container-title": f.container } : {}),
      ...(f.volume ? { volume: f.volume } : {}),
      ...(f.page ? { page: f.page } : {}),
    },
    meta: {
      year: f.year,
      doi: f.doi,
      pmid: f.pmid,
      peerReviewed: f.peerReviewed,
      citedByCount: f.citedByCount,
    },
    ...over,
  });
}

function makeCv(
  sections: Array<{ id: string; type: CvSectionType; items: CvItem[] }>,
  display = DISPLAY,
): CanonicalCv {
  return {
    schemaVersion: CANONICAL_SCHEMA_VERSION,
    id: "cv",
    owner: {
      orcid: "0000-0002-7483-2489",
      openAlexAuthorIds: [],
      displayName: "Tester",
      links: [],
      countsByYear: [],
    },
    display,
    sections: sections.map((s, i) => ({
      id: s.id,
      type: s.type,
      title: s.id,
      visible: true,
      order: i,
      items: s.items,
    })),
    presets: [],
    provenance: { generatedAt: "2026-01-01T00:00:00.000Z", sources: ["openalex"] },
  };
}

/** Flatten the per-item duplicate hints for terse assertions. */
function hints(cv: CanonicalCv): Record<string, { tier?: string; rel?: string; of?: string }> {
  const out: Record<string, { tier?: string; rel?: string; of?: string }> = {};
  for (const s of cv.sections) {
    for (const it of s.items) {
      if (it.meta.reviewFlag === "duplicate" && it.meta.duplicateOf) {
        out[it.id] = {
          tier: it.meta.duplicateOf.tier,
          rel: it.meta.duplicateOf.relationship,
          of: it.meta.duplicateOf.itemId,
        };
      }
    }
  }
  return out;
}

describe("normalizers", () => {
  it("normDoi strips scheme/prefix/case/trailing punctuation", () => {
    expect(normDoi("https://doi.org/10.1/AbC")).toBe("10.1/abc");
    expect(normDoi("doi:10.1/x")).toBe("10.1/x");
    expect(normDoi("http://dx.doi.org/10.1/Y.")).toBe("10.1/y");
    expect(normDoi(undefined)).toBeUndefined();
    expect(normDoi("   ")).toBeUndefined();
  });

  it("normDoi collapses an arXiv DOI version suffix", () => {
    expect(normDoi("10.48550/arXiv.2401.01234v3")).toBe("10.48550/arxiv.2401.01234");
    expect(normDoi("10.48550/arxiv.2401.01234")).toBe("10.48550/arxiv.2401.01234");
  });

  it("normPmid keeps digits only and drops leading zeros", () => {
    expect(normPmid("0012345")).toBe("12345");
    expect(normPmid("PMID: 678")).toBe("678");
    expect(normPmid("abc")).toBeUndefined();
    expect(normPmid(null)).toBeUndefined();
  });

  it("normTrialId uppercases and strips whitespace", () => {
    expect(normTrialId(" nct 0123 ")).toBe("NCT0123");
    expect(normTrialId("")).toBeUndefined();
  });

  it("normPatentNumber strips separators, keeps the kind code", () => {
    expect(normPatentNumber("EP 1 234 567 A1")).toBe("EP1234567A1");
    expect(normPatentNumber("US9999999")).toBe("US9999999");
    expect(normPatentNumber("")).toBeUndefined();
    expect(normPatentNumber("- /.")).toBeUndefined(); // empty after stripping separators
    expect(normPatentNumber(null)).toBeUndefined();
  });

  it("normAward reduces to an alphanumeric key", () => {
    expect(normAward("ANR-18-CE17-0001")).toBe("ANR18CE170001");
    expect(normAward(" r01 ca123456 ")).toBe("R01CA123456");
    expect(normAward("")).toBeUndefined();
  });

  it("normTitle flags + strips erratum / translation / part / data prefixes", () => {
    expect(normTitle("Erratum: A Great Study").isErratum).toBe(true);
    expect(normTitle("A Great Study (English)").isTranslation).toBe(true);
    const part = normTitle("The Method, Part II");
    expect(part.partLabel).toBe("ii");
    expect(normTitle("Café Étude").base).toBe("cafe etude");
    expect(normTitle("Data from: My Genome").base).toBe("my genome");
  });

  it("titleTokenJaccard + trigramSim measure overlap", () => {
    expect(titleTokenJaccard("a b c", "a b c")).toBe(1);
    expect(titleTokenJaccard("a b c", "x y z")).toBe(0);
    expect(titleTokenJaccard("", "")).toBe(0); // both empty
    expect(trigramSim("hello world", "hello world")).toBe(1);
    expect(trigramSim("abc", "")).toBe(0);
  });

  it("surnameSet collects normalized family names, skipping literals", () => {
    const it = cite("W", { title: "T", authors: ["Müller", "Smith"] });
    const withLiteral: CvItem = {
      ...it,
      csl: { ...it.csl!, author: [{ family: "Müller" }, { literal: "WHO" }, { family: "Smith" }] },
    };
    expect([...surnameSet(withLiteral)].sort()).toEqual(["muller", "smith"]);
  });
});

describe("itemAnchor + duplicatePairKey", () => {
  it("anchors on DOI, then PMID, then id; pair key is order-independent", () => {
    const a = cite("W1", { title: "X", doi: "10.1/a" });
    const b = mkItem("W2", { meta: { pmid: "99" } });
    const c = mkItem("W3");
    expect(itemAnchor(a)).toBe("10.1/a");
    expect(itemAnchor(b)).toBe("99");
    expect(itemAnchor(c)).toBe("W3");
    expect(duplicatePairKey(a, b)).toBe(duplicatePairKey(b, a));
  });
});

describe("detectDuplicates — exact identifier", () => {
  it("groups two works sharing a DOI across sections; richest is representative", () => {
    const pub = cite(
      "W1",
      { title: "Same paper", doi: "10.1/x", peerReviewed: true, container: "Nature" },
      { authoredBySelf: true },
    );
    const dataset = mkItem("D1", {
      source: "datacite",
      displayText: "Same paper dataset",
      meta: { doi: "10.1/X" },
    });
    const cv = makeCv([
      { id: "publications", type: "publications", items: [pub] },
      { id: "datasets", type: "datasets", items: [dataset] },
    ]);
    const groups = detectDuplicates(cv);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.representativeId).toBe("W1");
    expect(groups[0]!.tier).toBe("exact");
    expect(groups[0]!.duplicates.map((d) => d.itemId)).toEqual(["D1"]);
  });

  it("matches on PMID", () => {
    const cv = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          cite("W1", { title: "Paper one", pmid: "12345", peerReviewed: true }),
          cite("W2", { title: "Different title entirely", pmid: "012345" }),
        ],
      },
    ]);
    const groups = detectDuplicates(cv);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.tier).toBe("exact");
  });

  it("scopes grant award keys to the funder", () => {
    const sameFunder = makeCv([
      {
        id: "grants",
        type: "grants",
        items: [
          mkItem("G1", { source: "orcid", meta: { awardId: "R01-CA1", funderId: "F1" } }),
          mkItem("G2", { source: "nih", meta: { awardId: "R01 CA1", funderId: "F1" } }),
        ],
      },
    ]);
    expect(detectDuplicates(sameFunder)).toHaveLength(1);
    const diffFunder = makeCv([
      {
        id: "grants",
        type: "grants",
        items: [
          mkItem("G1", { source: "orcid", meta: { awardId: "R01-CA1", funderId: "F1" } }),
          mkItem("G2", { source: "nih", meta: { awardId: "R01 CA1", funderId: "F2" } }),
        ],
      },
    ]);
    expect(detectDuplicates(diffFunder)).toHaveLength(0);
  });

  it("matches clinical-trial registry numbers and patent publication numbers", () => {
    const trials = makeCv([
      {
        id: "clinical-trials",
        type: "clinical-trials",
        items: [
          mkItem("T1", { source: "clinicaltrials", sourceId: "NCT01" }),
          mkItem("T2", { source: "ictrp", sourceId: "nct 01" }),
        ],
      },
    ]);
    expect(detectDuplicates(trials)).toHaveLength(1);
    const patents = makeCv([
      {
        id: "patents",
        type: "patents",
        items: [
          mkItem("P1", { source: "epo", sourceId: "EP1234567A1" }),
          mkItem("P2", { source: "epo", sourceId: "EP 1234567 A1" }),
        ],
      },
    ]);
    expect(detectDuplicates(patents)).toHaveLength(1);
  });
});

describe("detectDuplicates — preprint ↔ published (strong / related)", () => {
  const published = cite("W_pub", {
    title: "A Landmark Result in Biology",
    doi: "10.1/pub",
    year: 2024,
    authors: ["Smith", "Jones"],
    container: "Nature",
    volume: "12",
    page: "1-10",
    peerReviewed: true,
    citedByCount: 12,
  });
  const preprint = cite("W_pre", {
    title: "A Landmark Result in Biology",
    doi: "10.1101/pre",
    year: 2023,
    authors: ["Smith", "Jones"],
  });

  it("flags the preprint as a preprint-of the published version (strong)", () => {
    const cv = makeCv([
      { id: "publications", type: "publications", items: [published] },
      { id: "preprints", type: "preprints", items: [preprint] },
    ]);
    const annotated = annotateDuplicates(cv);
    const h = hints(annotated);
    expect(h.W_pre).toEqual({ tier: "strong", rel: "preprint-of", of: "W_pub" });
    expect(h.W_pub).toBeUndefined(); // representative is clean
  });

  it("upgrades to the 'related' tier when Crossref asserts the relationship", () => {
    const cv = makeCv([
      { id: "publications", type: "publications", items: [published] },
      { id: "preprints", type: "preprints", items: [preprint] },
    ]);
    const relations = new Map<string, readonly DoiRelation[]>([
      ["10.1101/pre", [{ target: "10.1/pub", kind: "preprint-pair" }]],
    ]);
    const groups = detectDuplicates(cv, { relations });
    expect(groups[0]!.tier).toBe("related");
    expect(groups[0]!.duplicates[0]!.relationship).toBe("preprint-of");
  });

  it("links a RETITLED preprint↔published pair via Crossref relation (different titles)", () => {
    const cv = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          cite("VOR", {
            title: "Final Published Title",
            doi: "10.1/vor",
            year: 2024,
            authors: ["Smith"],
            peerReviewed: true,
          }),
        ],
      },
      {
        id: "preprints",
        type: "preprints",
        items: [
          cite("PRE", {
            title: "Completely Different Working Title",
            doi: "10.1101/pre",
            year: 2023,
            authors: ["Smith"],
          }),
        ],
      },
    ]);
    // No shared title prefix → the heuristic finds nothing on its own.
    expect(detectDuplicates(cv)).toHaveLength(0);
    // The publisher-asserted relation links them globally by DOI, title-agnostic.
    const relations = new Map<string, readonly DoiRelation[]>([
      ["10.1101/pre", [{ target: "10.1/vor", kind: "preprint-pair" }]],
    ]);
    const groups = detectDuplicates(cv, { relations });
    expect(groups).toHaveLength(1);
    expect(groups[0]!.representativeId).toBe("VOR");
    expect(groups[0]!.duplicates[0]).toMatchObject({
      itemId: "PRE",
      tier: "related",
      relationship: "preprint-of",
    });
  });

  it("labels a 3-way group member by its link to the REPRESENTATIVE, not a sibling", () => {
    const cv = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          cite("A", {
            title: "Triple Rel Work",
            doi: "10.1/a",
            year: 2024,
            authors: ["Smith"],
            peerReviewed: true,
          }),
          cite("C", {
            title: "Triple Rel Work",
            doi: "10.1/c",
            year: 2024,
            authors: ["Smith"],
            peerReviewed: true,
          }),
        ],
      },
      {
        id: "preprints",
        type: "preprints",
        items: [
          cite("B", { title: "Triple Rel Work", doi: "10.1101/b", year: 2023, authors: ["Smith"] }),
        ],
      },
    ]);
    // B↔C is a publisher 'version' relation; B↔A is the heuristic preprint pair.
    const relations = new Map<string, readonly DoiRelation[]>([
      ["10.1101/b", [{ target: "10.1/c", kind: "version" }]],
    ]);
    const h = hints(annotateDuplicates(cv, { relations }));
    // B's STRONGEST incident edge is the B↔C version (0.95), but its hint must
    // describe its link to the representative A — preprint-of, not version-of.
    expect(h.B).toMatchObject({ of: "A", rel: "preprint-of" });
  });
});

describe("detectDuplicates — fuzzy + false-positive traps", () => {
  it("does NOT group multi-part papers (Part I vs Part II)", () => {
    const cv = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          cite("W1", { title: "The Survey, Part I", year: 2020, authors: ["Smith"] }),
          cite("W2", { title: "The Survey, Part II", year: 2020, authors: ["Smith"] }),
        ],
      },
    ]);
    expect(detectDuplicates(cv)).toHaveLength(0);
  });

  it("treats an erratum as a low-confidence related item, not a removable dup", () => {
    const cv = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          cite("W1", {
            title: "Important Findings",
            year: 2021,
            authors: ["Smith"],
            peerReviewed: true,
            container: "J",
          }),
          cite("W2", { title: "Erratum: Important Findings", year: 2021, authors: ["Smith"] }),
        ],
      },
    ]);
    const groups = detectDuplicates(cv);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.tier).toBe("weak");
    expect(groups[0]!.duplicates[0]!.relationship).toBe("erratum-of");
  });

  it("flags a translation as a translation-of (weak)", () => {
    const cv = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          cite("W1", {
            title: "Le Resultat",
            year: 2021,
            authors: ["Smith"],
            peerReviewed: true,
            container: "J",
          }),
          cite("W2", { title: "Le Resultat (English)", year: 2021, authors: ["Smith"] }),
        ],
      },
    ]);
    const groups = detectDuplicates(cv);
    expect(groups[0]!.duplicates[0]!.relationship).toBe("translation-of");
  });

  it("title+year match but disagreeing authors → weak, not strong", () => {
    const cv = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          cite("W1", {
            title: "Common Title",
            year: 2020,
            authors: ["Smith", "Jones"],
            peerReviewed: true,
          }),
          cite("W2", { title: "Common Title", year: 2020, authors: ["Khan", "Lee"] }),
        ],
      },
    ]);
    expect(detectDuplicates(cv)[0]!.tier).toBe("weak");
  });

  it("does NOT fuzzy-match across sections (a dataset titled like its paper)", () => {
    const cv = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [cite("W1", { title: "Genome Atlas Study", year: 2022, authors: ["Smith"] })],
      },
      {
        id: "datasets",
        type: "datasets",
        items: [mkItem("D1", { source: "datacite", displayText: "Genome Atlas Study [dataset]" })],
      },
    ]);
    expect(detectDuplicates(cv)).toHaveLength(0);
  });

  it("groups near-identical titles via trigram similarity (weak)", () => {
    const cv = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          cite("W1", {
            title: "The Genomic Landscape of Cancer Cells",
            year: 2020,
            authors: ["Smith"],
            peerReviewed: true,
          }),
          cite("W2", {
            title: "The Genomic Landscape of Cancer Cell",
            year: 2020,
            authors: ["Khan"],
          }),
        ],
      },
    ]);
    const groups = detectDuplicates(cv);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.tier).toBe("weak");
  });

  it("labels a Crossref 'version' relation as version-of", () => {
    const cv = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          cite("W1", {
            title: "Versioned Work",
            doi: "10.1/v1",
            year: 2024,
            authors: ["Smith"],
            peerReviewed: true,
          }),
          cite("W2", { title: "Versioned Work", doi: "10.1/v2", year: 2024, authors: ["Smith"] }),
        ],
      },
    ]);
    const relations = new Map<string, readonly DoiRelation[]>([
      ["10.1/v2", [{ target: "10.1/v1", kind: "version" }]],
    ]);
    const groups = detectDuplicates(cv, { relations });
    expect(groups[0]!.tier).toBe("related");
    expect(groups[0]!.duplicates[0]!.relationship).toBe("version-of");
  });

  it("skips citations whose title normalizes to empty", () => {
    const cv = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          cite("W1", { title: "######", year: 2020 }), // normalizes to ""
          cite("W2", { title: "A Real Title", year: 2020 }),
        ],
      },
    ]);
    expect(detectDuplicates(cv)).toHaveLength(0);
  });

  it("falls back to fuzzy when a relation's DOI or map entry is missing", () => {
    // One side has no DOI → relationEdge bails; heuristic strong tier stands.
    const noDoi = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          cite("W1", {
            title: "NoDoi Work",
            doi: "10.1/a",
            year: 2024,
            authors: ["Smith"],
            peerReviewed: true,
          }),
        ],
      },
      {
        id: "preprints",
        type: "preprints",
        items: [cite("W2", { title: "NoDoi Work", year: 2023, authors: ["Smith"] })],
      },
    ]);
    const rels = new Map<string, readonly DoiRelation[]>([
      ["10.1/a", [{ target: "10.1/zzz", kind: "preprint-pair" }]],
    ]);
    expect(detectDuplicates(noDoi, { relations: rels })[0]!.tier).toBe("strong");

    // Both have DOIs but the map has no entry for this pair → fuzzy stands.
    const irrelevant = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          cite("W1", {
            title: "Other Work",
            doi: "10.1/p",
            year: 2024,
            authors: ["Smith"],
            peerReviewed: true,
          }),
        ],
      },
      {
        id: "preprints",
        type: "preprints",
        items: [
          cite("W2", { title: "Other Work", doi: "10.1101/q", year: 2023, authors: ["Smith"] }),
        ],
      },
    ]);
    const otherRels = new Map<string, readonly DoiRelation[]>([
      ["10.9/unrelated", [{ target: "10.9/x", kind: "version" }]],
    ]);
    expect(detectDuplicates(irrelevant, { relations: otherRels })[0]!.tier).toBe("strong");
  });

  it("groups three records of the same work (preprint + published + mirror)", () => {
    const cv = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          cite("W_pub", {
            title: "Triple Work",
            doi: "10.1/p",
            year: 2024,
            authors: ["Smith"],
            peerReviewed: true,
            container: "J",
          }),
          cite("W_mirror", { title: "Triple Work", doi: "10.1/p", year: 2024, authors: ["Smith"] }),
        ],
      },
      {
        id: "preprints",
        type: "preprints",
        items: [
          cite("W_pre", { title: "Triple Work", doi: "10.1101/p", year: 2023, authors: ["Smith"] }),
        ],
      },
    ]);
    const groups = detectDuplicates(cv);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.duplicates).toHaveLength(2);
  });
});

describe("annotateDuplicates", () => {
  function dupCv() {
    return makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          cite("W1", { title: "Dup", doi: "10.1/d", peerReviewed: true, container: "J" }),
          cite("W2", { title: "Dup", doi: "10.1/d" }),
        ],
      },
    ]);
  }

  it("sets the duplicate hint on the non-representative member only", () => {
    const out = annotateDuplicates(dupCv());
    const h = hints(out);
    expect(h.W2).toEqual({ tier: "exact", rel: "same-work", of: "W1" });
    expect(h.W1).toBeUndefined();
  });

  it("is idempotent and clears a stale hint when the duplicate is gone", () => {
    const once = annotateDuplicates(dupCv());
    const twice = annotateDuplicates(once);
    expect(hints(twice)).toEqual(hints(once));

    // Remove the partner → the stale flag must be cleared on re-run.
    const single = makeCv([
      { id: "publications", type: "publications", items: [once.sections[0]!.items[1]!] },
    ]);
    const cleared = annotateDuplicates(single);
    expect(cleared.sections[0]!.items[0]!.meta.reviewFlag).toBeUndefined();
    expect(cleared.sections[0]!.items[0]!.meta.duplicateOf).toBeUndefined();
  });

  it("does not annotate a (visible) item already flagged for another reason", () => {
    const cv = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          cite("W1", { title: "Dup", doi: "10.1/d", peerReviewed: true, container: "J" }),
          cite(
            "W2",
            { title: "Dup", doi: "10.1/d" },
            { meta: { doi: "10.1/d", reviewFlag: "orcid-conflict" } },
          ),
        ],
      },
    ]);
    const out = annotateDuplicates(cv);
    const w2 = out.sections[0]!.items[1]!;
    // The existing review flag owns the slot — no duplicate hint is added on top.
    expect(w2.meta.reviewFlag).toBe("orcid-conflict");
    expect(w2.meta.duplicateOf).toBeUndefined();
    // …and the representative stays clean.
    expect(out.sections[0]!.items[0]!.meta.reviewFlag).toBeUndefined();
  });

  it("ignores hidden / 'not mine' items, so hiding one resolves the pair", () => {
    const visible = cite("W1", {
      title: "Resolve Me",
      doi: "10.1/r",
      peerReviewed: true,
      container: "J",
    });
    const hidden = cite("W2", { title: "Resolve Me", doi: "10.1/r" }, { included: false });
    expect(
      detectDuplicates(
        makeCv([{ id: "publications", type: "publications", items: [visible, hidden] }]),
      ),
    ).toHaveLength(0);

    const notMine = cite("W3", { title: "Resolve Me", doi: "10.1/r" }, { notMine: true });
    expect(
      detectDuplicates(
        makeCv([{ id: "publications", type: "publications", items: [visible, notMine] }]),
      ),
    ).toHaveLength(0);
  });

  it("honors a dismissed pair (keep both)", () => {
    const base = dupCv();
    const key = duplicatePairKey(base.sections[0]!.items[0]!, base.sections[0]!.items[1]!);
    const withDismissal = makeCv(
      [{ id: "publications", type: "publications", items: base.sections[0]!.items }],
      { ...DISPLAY, dismissedDuplicates: [key] },
    );
    expect(detectDuplicates(withDismissal)).toHaveLength(0);
    const out = annotateDuplicates(withDismissal);
    expect(hints(out)).toEqual({});
  });

  it("returns the same object when there is nothing to annotate", () => {
    const cv = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [cite("W1", { title: "Solo", doi: "10.1/s" })],
      },
    ]);
    expect(annotateDuplicates(cv)).toBe(cv);
  });

  it("fails soft (returns the input) when detection throws on a malformed item", () => {
    const broken = makeCv([{ id: "publications", type: "publications", items: [mkItem("W1")] }]);
    // Corrupt an item's meta so detection throws — the build must not break.
    (broken.sections[0]!.items[0] as { meta: unknown }).meta = null;
    expect(annotateDuplicates(broken)).toBe(broken);
  });
});

describe("relationCandidateDois", () => {
  it("returns DOIs of fuzzy (non-exact) groups only", () => {
    const cv = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          cite("W_pub", {
            title: "Fuzzy Work",
            doi: "10.1/pub",
            year: 2024,
            authors: ["Smith"],
            peerReviewed: true,
          }),
        ],
      },
      {
        id: "preprints",
        type: "preprints",
        items: [
          cite("W_pre", {
            title: "Fuzzy Work",
            doi: "10.1101/pre",
            year: 2023,
            authors: ["Smith"],
          }),
        ],
      },
    ]);
    expect(relationCandidateDois(cv).sort()).toEqual(["10.1/pub", "10.1101/pre"]);
  });

  it("excludes exact-identifier groups and respects the cap", () => {
    const exact = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          cite("W1", { title: "X", doi: "10.1/x", peerReviewed: true }),
          cite("W2", { title: "X", doi: "10.1/x" }),
        ],
      },
    ]);
    expect(relationCandidateDois(exact)).toEqual([]);
  });

  it("includes every preprint DOI so a retitled VoR can still be looked up", () => {
    const cv = makeCv([
      {
        id: "preprints",
        type: "preprints",
        items: [cite("PRE", { title: "Lonely Preprint", doi: "10.1101/x", year: 2023 })],
      },
    ]);
    // No duplicate group at all, yet the preprint DOI is a relation candidate.
    expect(detectDuplicates(cv)).toHaveLength(0);
    expect(relationCandidateDois(cv)).toEqual(["10.1101/x"]);
  });

  it("excludes a hidden preprint from the relation candidates", () => {
    const cv = makeCv([
      {
        id: "preprints",
        type: "preprints",
        items: [
          cite(
            "PRE",
            { title: "Hidden Preprint", doi: "10.1101/h", year: 2023 },
            { included: false },
          ),
        ],
      },
    ]);
    expect(relationCandidateDois(cv)).toEqual([]);
  });

  it("stops collecting at the supplied limit", () => {
    const cv = makeCv([
      {
        id: "publications",
        type: "publications",
        items: [
          cite("W_pub", {
            title: "Capped Work",
            doi: "10.1/pub",
            year: 2024,
            authors: ["Smith"],
            peerReviewed: true,
          }),
        ],
      },
      {
        id: "preprints",
        type: "preprints",
        items: [
          cite("W_pre", {
            title: "Capped Work",
            doi: "10.1101/pre",
            year: 2023,
            authors: ["Smith"],
          }),
        ],
      },
    ]);
    expect(relationCandidateDois(cv, 1)).toHaveLength(1);
  });
});
