import { describe, expect, it } from "vitest";
import {
  CanonicalCvSchema,
  type CanonicalCv,
  type CvItem,
  type CvSectionType,
} from "@/lib/canonical/schema";
import {
  EVIDENCE_REF_MAX,
  evidenceCandidates,
  evidenceRefCounts,
  evidenceRefIds,
  evidenceRefLabel,
  parseEvidenceRefs,
  resolveEvidenceRefs,
} from "@/lib/canonical/evidenceRefs";
import {
  isNarrativeModuleType,
  narrativeEvidenceSectionTypes,
} from "@/lib/canonical/narrativeEvidence";

function item(id: string, over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: {
      id,
      type: "article-journal",
      title: `Title of ${id}`,
      author: [{ family: "Smith", given: "A" }],
      issued: { "date-parts": [[2021]] },
    },
    meta: {},
    ...over,
  } as CvItem;
}

function section(
  type: CvSectionType,
  items: CvItem[],
  over: { visible?: boolean; body?: string; id?: string } = {},
) {
  return {
    id: over.id ?? type,
    type,
    title: type,
    visible: over.visible ?? true,
    order: 0,
    items,
    ...(over.body !== undefined ? { body: over.body } : {}),
  };
}

function cv(
  sections: ReturnType<typeof section>[],
  display: Record<string, unknown> = {},
): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "ev",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Basile Chrétien" },
    display,
    sections,
    provenance: { generatedAt: "2026-09-04T00:00:00.000Z", sources: ["openalex"] },
  });
}

describe("parseEvidenceRefs", () => {
  it("splits text runs and [[id]] tokens, trimming the id", () => {
    expect(parseEvidenceRefs("A claim [[W1]] and [[ position:orcid:9 ]].")).toEqual([
      { kind: "text", text: "A claim " },
      { kind: "ref", id: "W1" },
      { kind: "text", text: " and " },
      { kind: "ref", id: "position:orcid:9" },
      { kind: "text", text: "." },
    ]);
  });

  it("is a single text run when there is no token", () => {
    expect(parseEvidenceRefs("plain prose")).toEqual([{ kind: "text", text: "plain prose" }]);
    expect(parseEvidenceRefs("")).toEqual([]);
  });

  it("treats malformed / blank / nested brackets as text around the innermost token", () => {
    expect(parseEvidenceRefs("[[W1")).toEqual([{ kind: "text", text: "[[W1" }]);
    expect(parseEvidenceRefs("[[ ]] x")).toEqual([{ kind: "text", text: "[[ ]] x" }]);
    expect(parseEvidenceRefs("[[[W1]]]")).toEqual([
      { kind: "text", text: "[" },
      { kind: "ref", id: "W1" },
      { kind: "text", text: "]" },
    ]);
    expect(parseEvidenceRefs("[[a[[b]]")).toEqual([
      { kind: "text", text: "[[a" },
      { kind: "ref", id: "b" },
    ]);
  });

  it("never lets a token span a line break", () => {
    expect(parseEvidenceRefs("[[W1\n]]")).toEqual([{ kind: "text", text: "[[W1\n]]" }]);
  });
});

describe("evidenceRefIds", () => {
  it("lists distinct ids in first-appearance order, capped at EVIDENCE_REF_MAX", () => {
    expect(evidenceRefIds("[[b]] [[a]] [[b]]")).toEqual(["b", "a"]);
    const many = Array.from({ length: EVIDENCE_REF_MAX + 5 }, (_, i) => `[[W${i}]]`).join(" ");
    expect(evidenceRefIds(many)).toHaveLength(EVIDENCE_REF_MAX);
  });
});

describe("resolveEvidenceRefs", () => {
  it("resolves across sections, with the entry, its section and a label", () => {
    const c = cv([
      section("publications", [item("W1")]),
      section("positions", [item("position:1", { csl: undefined, displayText: "Professor, X" })]),
    ]);
    const segs = resolveEvidenceRefs(c, "See [[W1]] and [[position:1]].");
    expect(segs[1]).toMatchObject({
      kind: "ref",
      id: "W1",
      resolved: true,
      label: "Smith 2021",
      section: { type: "publications" },
    });
    expect(segs[3]).toMatchObject({ resolved: true, label: "Professor, X" });
  });

  it("does NOT resolve a hidden, not-mine, hidden-section, view-excluded or unknown entry", () => {
    const c = cv(
      [
        section("publications", [
          item("hid", { included: false }),
          item("nm", { notMine: true }),
          item("excl"),
          item("ok"),
        ]),
        section("datasets", [item("ds")], { visible: false }),
      ],
      { excludedItems: { publications: ["excl"] } },
    );
    const body = "[[hid]] [[nm]] [[ds]] [[excl]] [[nope]] [[ok]]";
    const refs = resolveEvidenceRefs(c, body).filter((s) => s.kind === "ref");
    expect(refs.map((r) => (r.kind === "ref" ? r.resolved : null))).toEqual([
      false,
      false,
      false,
      false,
      false,
      true,
    ]);
  });

  it("honours a renderer's listed-id set (an export never links an anchor it didn't emit)", () => {
    const c = cv([section("publications", [item("W1"), item("W2")])]);
    const segs = resolveEvidenceRefs(c, "[[W1]] [[W2]]", { listedIds: new Set(["W2"]) });
    expect(segs.filter((s) => s.kind === "ref").map((s) => s.kind === "ref" && s.resolved)).toEqual(
      [false, true],
    );
  });

  it("resolves only the first EVIDENCE_REF_MAX tokens of a body", () => {
    const c = cv([section("publications", [item("W1")])]);
    const body = Array.from({ length: EVIDENCE_REF_MAX + 1 }, () => "[[W1]]").join(" ");
    const refs = resolveEvidenceRefs(c, body).filter((s) => s.kind === "ref");
    expect(refs).toHaveLength(EVIDENCE_REF_MAX + 1);
    expect(refs.slice(0, EVIDENCE_REF_MAX).every((r) => r.kind === "ref" && r.resolved)).toBe(true);
    expect(refs[EVIDENCE_REF_MAX]).toMatchObject({ resolved: false });
  });

  it("drops the space that introduced an unresolved token before punctuation / whitespace", () => {
    const c = cv([section("publications", [item("W1")])]);
    const text = (body: string) =>
      resolveEvidenceRefs(c, body)
        .map((s) => (s.kind === "text" ? s.text : s.resolved ? `<${s.label}>` : ""))
        .join("");
    expect(text("A claim [[gone]].")).toBe("A claim.");
    expect(text("A claim [[gone]] here")).toBe("A claim here");
    expect(text("A claim [[gone]]")).toBe("A claim");
    expect(text("A claim [[gone]]here")).toBe("A claim here"); // a following word keeps the space
    expect(text("A claim [[W1]].")).toBe("A claim <Smith 2021>."); // resolved: untouched
  });
});

describe("evidenceRefLabel", () => {
  it("is first author + year for a citation, with et al. for several authors", () => {
    expect(evidenceRefLabel(item("W1"))).toBe("Smith 2021");
    const multi = item("W2", {
      csl: {
        id: "W2",
        type: "article-journal",
        author: [{ family: "Doe" }, { family: "Roe" }],
        issued: { "date-parts": [[2019]] },
      },
    });
    expect(evidenceRefLabel(multi)).toBe("Doe et al. 2019");
  });

  it("prefers the owner's corrected year and falls back to the CSL year / no year", () => {
    expect(evidenceRefLabel(item("W1", { meta: { yearOverride: 2022 } }))).toBe("Smith 2022");
    expect(evidenceRefLabel(item("W1", { meta: { year: 2020 } }))).toBe("Smith 2020");
    const noYear = item("W3", {
      csl: { id: "W3", type: "article-journal", author: [{ literal: "WHO Consortium" }] },
    });
    expect(evidenceRefLabel(noYear)).toBe("WHO Consortium");
  });

  it("uses a truncated title when the citation has no author, else the display line, else the id", () => {
    const long = "A".repeat(80);
    const titled = item("W4", { csl: { id: "W4", type: "dataset", title: long } });
    expect(evidenceRefLabel(titled)).toBe(`${"A".repeat(59)}…`);
    const html = item("W5", { csl: { id: "W5", type: "dataset", title: "On <i>E. coli</i>" } });
    expect(evidenceRefLabel(html)).toBe("On E. coli");
    const plain = item("p", { csl: undefined, displayText: "  Lecturer, Caen  " });
    expect(evidenceRefLabel(plain)).toBe("Lecturer, Caen");
    const bare = item("bare", { csl: undefined });
    expect(evidenceRefLabel(bare)).toBe("bare");
  });
});

describe("evidenceRefCounts", () => {
  it("counts distinct linked entries and unresolved tokens", () => {
    const c = cv([section("publications", [item("W1"), item("W2")])]);
    expect(evidenceRefCounts(c, "[[W1]] [[W1]] [[W2]] [[x]] [[y]]")).toEqual({
      linked: 2,
      unresolved: 2,
    });
    expect(evidenceRefCounts(c, "no refs")).toEqual({ linked: 0, unresolved: 0 });
  });
});

describe("evidenceCandidates", () => {
  const c = cv([
    section("publications", [item("W1"), item("hid", { included: false })]),
    section("supervision", [item("s1", { csl: undefined, displayText: "PhD: J. Doe" })]),
    section("narrative-knowledge", [], { body: "x" }),
  ]);

  it("offers a narrative module only the entries of its supporting sections", () => {
    expect(evidenceCandidates(c, "narrative-knowledge")).toEqual([
      {
        id: "W1",
        label: "Smith 2021",
        title: "Title of W1",
        sectionType: "publications",
        sectionTitle: "publications",
      },
    ]);
    expect(evidenceCandidates(c, "narrative-individuals").map((e) => e.id)).toEqual(["s1"]);
  });

  it("offers a free statement every listed entry (never a hidden one or a prose section)", () => {
    expect(evidenceCandidates(c, "statement").map((e) => e.id)).toEqual(["W1", "s1"]);
  });

  it("falls back to the id as title for an entry with no title / display line", () => {
    const bare = cv([section("publications", [item("b", { csl: { id: "b", type: "book" } })])]);
    expect(evidenceCandidates(bare, "statement")[0]).toMatchObject({ title: "b", label: "b" });
  });
});

describe("narrativeEvidence helpers", () => {
  it("exposes the supporting section types per module and the module predicate", () => {
    expect(narrativeEvidenceSectionTypes("narrative-society")).toEqual([
      "patents",
      "clinical-trials",
    ]);
    expect(narrativeEvidenceSectionTypes("statement")).toBeUndefined();
    expect(isNarrativeModuleType("narrative-community")).toBe(true);
    expect(isNarrativeModuleType("statement")).toBe(false);
    expect(isNarrativeModuleType("publications")).toBe(false);
  });
});
