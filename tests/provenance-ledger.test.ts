import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import { hasPersistentIdentifier, provenanceLedger } from "@/lib/cv/provenanceLedger";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import { renderStrings } from "@/lib/i18n/render";
import { ledgerLines, provenanceLedgerHtml } from "@/lib/render/provenanceLedgerHtml";
import { provenanceFooter } from "@/lib/render/templates/shared";
import type { CanonicalCv, CvItem, CvSection, CvSectionType } from "@/lib/canonical/schema";

const resolved = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function base(): CanonicalCv {
  return buildCanonicalCv({ id: "PL", resolved, works: [], now: "2026-06-02T00:00:00.000Z" });
}

function work(id: string, over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id, type: "article-journal" },
    meta: { matchBasis: "orcid" },
    ...over,
  } as CvItem;
}

function entry(id: string, over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "orcid",
    sourceId: "12345",
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    displayText: "Some role",
    meta: {},
    ...over,
  } as CvItem;
}

function section(type: CvSectionType, items: CvItem[], visible = true): CvSection {
  return { id: type, type, title: type, visible, order: 0, items } as CvSection;
}

function cvWith(sections: CvSection[], display: Record<string, unknown> = {}): CanonicalCv {
  return { ...updateDisplay(base(), { locale: "en-US", ...display }), sections };
}

describe("provenanceLedger", () => {
  it("is all-zero with zero denominators for an empty CV", () => {
    const l = provenanceLedger(base());
    expect(l.kept).toBe(0);
    for (const key of [
      "identifierMatched",
      "claimed",
      "selfEntered",
      "nameMatched",
      "other",
      "verified",
      "persistentId",
      "reviewed",
      "retractedVisible",
    ] as const) {
      expect(l[key]).toEqual({ count: 0, denominator: 0 });
      expect(l[key].share).toBeUndefined();
    }
  });

  it("classifies every attribution category once, over the shown entries", () => {
    const cv = cvWith([
      section("publications", [
        work("id1"), // orcid
        work("id2", { meta: { matchBasis: "openalex-id" } }),
        work("id3", { meta: { matchBasis: "both" } }),
        work("cl1", { meta: { matchBasis: "claimed", claimed: true } }),
        work("cl2", { meta: { claimed: true } }),
        work("man", { source: "manual", sourceId: "manual", meta: {} }),
        work("bib", { source: "bibtex", sourceId: "bib", meta: {} }),
        work("nm", { source: "ukri", sourceId: "u", meta: { reviewFlag: "name-matched" } }),
        work("oth", { source: "nih", sourceId: "n", meta: {} }), // confirmed registry match, flag gone
        work("hidden", { included: false }),
        work("notmine", { notMine: true }),
      ]),
      section("datasets", [work("ds", { source: "datacite", sourceId: "d", meta: {} })]),
    ]);
    const l = provenanceLedger(cv);
    expect(l.kept).toBe(10);
    expect(l.identifierMatched).toEqual({ count: 4, denominator: 10, share: 0.4 });
    expect(l.claimed).toEqual({ count: 2, denominator: 10, share: 0.2 });
    expect(l.selfEntered).toEqual({ count: 2, denominator: 10, share: 0.2 });
    expect(l.nameMatched).toEqual({ count: 1, denominator: 10, share: 0.1 });
    expect(l.other).toEqual({ count: 1, denominator: 10, share: 0.1 });
    // The four attribution lines + other always partition the shown entries.
    expect(
      l.identifierMatched.count +
        l.claimed.count +
        l.selfEntered.count +
        l.nameMatched.count +
        l.other.count,
    ).toBe(l.kept);
  });

  it("ignores hidden sections and per-view excluded items", () => {
    const cv = cvWith(
      [
        section("publications", [work("a"), work("b"), work("c")]),
        section("preprints", [work("p")], false),
      ],
      { excludedItems: { publications: ["c"] } },
    );
    expect(provenanceLedger(cv).kept).toBe(2);
  });

  it("counts trusted-organisation assertions over positions/education/awards only", () => {
    const cv = cvWith([
      section("positions", [entry("pos1", { meta: { verified: true } }), entry("pos2")]),
      section("education", [entry("edu1", { meta: { verified: true } })]),
      section("awards", [entry("aw1")]),
      section("service", [entry("sv1", { meta: { verified: true } })]), // not a verifiable section
      section("publications", [work("w1")]),
    ]);
    const l = provenanceLedger(cv);
    expect(l.verified).toEqual({ count: 2, denominator: 4, share: 0.5 });
  });

  it("counts resolvable persistent identifiers over all shown entries", () => {
    const cv = cvWith([
      section("publications", [
        work("doi", { meta: { doi: "10.1/x" } }),
        work("csldoi", { csl: { id: "csldoi", type: "article-journal", DOI: "10.1/y" } }),
        work("pmid", { meta: { pmid: "123" } }),
        work("arxiv", {
          csl: { id: "arxiv", type: "article", URL: "https://arxiv.org/abs/2101.00001" },
        }),
        work("none", { sourceId: "x" }),
      ]),
      section("positions", [entry("put"), entry("noput", { sourceId: "position:x" })]),
    ]);
    const l = provenanceLedger(cv);
    expect(l.persistentId).toEqual({ count: 5, denominator: 7, share: 5 / 7 });
  });

  it("hasPersistentIdentifier: DOI, PMID, arXiv URL, or an ORCID put-code", () => {
    expect(hasPersistentIdentifier(work("a", { meta: { doi: "10.1/a" } }))).toBe(true);
    expect(hasPersistentIdentifier(work("a", { meta: { pmid: "1" } }))).toBe(true);
    expect(
      hasPersistentIdentifier(
        work("a", { csl: { id: "a", type: "article", URL: "http://arxiv.org/pdf/1.2" } }),
      ),
    ).toBe(true);
    expect(hasPersistentIdentifier(entry("p"))).toBe(true);
    expect(hasPersistentIdentifier(entry("p", { sourceId: "abc" }))).toBe(false);
    expect(hasPersistentIdentifier(work("a", { csl: undefined, sourceId: "x" }))).toBe(false);
    expect(
      hasPersistentIdentifier(
        work("a", { csl: { id: "a", type: "article", URL: "https://example.org/x" } }),
      ),
    ).toBe(false);
  });

  it("counts owner-confirmed publications over the source-attributed ones", () => {
    const cv = cvWith([
      section("publications", [
        work("r1", { reviewedAt: "2026-06-01T00:00:00.000Z" }),
        work("r2"),
        work("man", { source: "manual", sourceId: "m", reviewedAt: "2026-06-01T00:00:00.000Z" }),
        work("cl", { meta: { claimed: true }, reviewedAt: "2026-06-01T00:00:00.000Z" }),
      ]),
      section("positions", [entry("p1")]),
    ]);
    const l = provenanceLedger(cv);
    expect(l.reviewed).toEqual({ count: 1, denominator: 2, share: 0.5 });
  });

  it("counts retracted works shown over the citation entries, and 0 when hideRetracted is on", () => {
    const sections = [
      section("publications", [work("ok"), work("rt", { meta: { retracted: true } })]),
      section("positions", [entry("p1")]),
    ];
    expect(provenanceLedger(cvWith(sections)).retractedVisible).toEqual({
      count: 1,
      denominator: 2,
      share: 0.5,
    });
    expect(provenanceLedger(cvWith(sections, { hideRetracted: true })).retractedVisible).toEqual({
      count: 0,
      denominator: 2,
      share: 0,
    });
  });

  it("never emits a score: only per-line counts with their denominators", () => {
    const l = provenanceLedger(cvWith([section("publications", [work("a")])]));
    for (const [k, v] of Object.entries(l)) {
      if (k === "kept") continue;
      const keys = Object.keys(v as object).sort();
      // `share` is present exactly when the denominator is > 0; nothing else.
      expect(keys).toEqual(
        (v as { denominator: number }).denominator > 0
          ? ["count", "denominator", "share"]
          : ["count", "denominator"],
      );
    }
  });
});

describe("ledgerLines / provenanceLedgerHtml", () => {
  const cv = cvWith([
    section("publications", [
      work("a", { meta: { doi: "10.1/a", matchBasis: "orcid" } }),
      work("b", { meta: { retracted: true } }),
      work("c", { meta: { claimed: true } }),
    ]),
  ]);

  it("lists every line with a denominator, skipping the residual line at zero", () => {
    const lines = ledgerLines(provenanceLedger(cv), "en-US");
    const keys = lines.map((l) => l.key);
    expect(keys).toEqual([
      "identifierMatched",
      "claimed",
      "selfEntered",
      "nameMatched",
      "persistentId",
      "reviewed",
      "retractedVisible",
    ]);
    expect(keys).not.toContain("verified"); // no positions/education → denominator 0
    expect(keys).not.toContain("other");
    const byKey = Object.fromEntries(lines.map((l) => [l.key, l.figure]));
    expect(byKey.identifierMatched).toBe("2 of 3 (67%)");
    expect(byKey.claimed).toBe("1 of 3 (33%)");
    expect(byKey.selfEntered).toBe("0 of 3 (0%)");
    expect(byKey.retractedVisible).toBe("1 of 3 (33%)");
    expect(byKey.reviewed).toBe("0 of 2 (0%)");
  });

  it("lists the residual line when it counts something", () => {
    const l = provenanceLedger(cvWith([section("grants", [entry("g", { source: "nsf" })])]));
    expect(ledgerLines(l, "en-US").map((x) => x.key)).toContain("other");
  });

  it("renders a captioned two-column table, and '' for an empty document", () => {
    const html = provenanceLedgerHtml(provenanceLedger(cv), "en-US");
    expect(html).toContain('<table class="cv-prov-ledger" aria-label="Provenance ledger">');
    expect(html).toContain("<caption>Provenance ledger</caption>");
    expect(html).toContain(
      '<tr data-ledger="identifierMatched"><td>Matched by identifier (ORCID / OpenAlex)</td><td>2 of 3 (67%)</td></tr>',
    );
    expect(provenanceLedgerHtml(provenanceLedger(base()), "en-US")).toBe("");
  });

  it("formats the figure in every locale with the placeholders substituted", () => {
    for (const loc of SUPPORTED_LOCALES) {
      const s = renderStrings(loc);
      expect(s.provLedgerOf).toContain("{n}");
      expect(s.provLedgerOf).toContain("{total}");
      expect(s.provLedgerOf).toContain("{pct}");
      const lines = ledgerLines(provenanceLedger(cv), loc);
      expect(lines.length).toBe(7);
      for (const l of lines) {
        expect(l.figure).not.toMatch(/\{(n|total|pct)\}/);
        expect(l.label.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("provenanceFooter + ledger", () => {
  const sections = [
    section("publications", [
      work("a", { meta: { matchBasis: "orcid" } }),
      work("c", { meta: { claimed: true }, reviewedAt: "2026-06-01T00:00:00.000Z" }),
    ]),
  ];

  it("renders nothing when showProvenance is off", () => {
    expect(provenanceFooter(cvWith(sections))).toBe("");
  });

  it("appends the ledger table inside the footer when showProvenance is on", () => {
    const html = provenanceFooter(cvWith(sections, { showProvenance: true }));
    expect(html).toMatch(/^<footer class="cv-provenance">/);
    expect(html).toContain("Generated from");
    expect(html).toContain('<table class="cv-prov-ledger"');
    expect(html).toContain(
      '<tr data-ledger="claimed"><td>Added by DOI (owner-asserted)</td><td>1 of 2 (50%)</td></tr>',
    );
    expect(html).toMatch(/<\/table><\/footer>$/);
  });

  it("prefers a pre-computed ledger from opts (the public route renders a projection)", () => {
    const stored = cvWith(sections, { showProvenance: true });
    const projected = projectCvForPublic(stored);
    // The projection strips `claimed`/`matchBasis`/`reviewedAt`, so a ledger
    // derived from it would misreport the attribution + review lines…
    const naive = provenanceFooter(projected);
    expect(naive).toContain(
      '<tr data-ledger="claimed"><td>Added by DOI (owner-asserted)</td><td>0 of 2 (0%)</td></tr>',
    );
    // …whereas the stored-document ledger, passed through opts, is right.
    const html = provenanceFooter(projected, { provenanceLedger: provenanceLedger(stored) });
    expect(html).toContain(
      '<tr data-ledger="claimed"><td>Added by DOI (owner-asserted)</td><td>1 of 2 (50%)</td></tr>',
    );
    expect(html).toContain(
      '<tr data-ledger="reviewed"><td>Source-attributed publications confirmed by the owner</td><td>0 of 1 (0%)</td></tr>',
    );
  });
});
