import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildCanonicalCv, deriveFirstPublicationYear } from "@/lib/canonical/build";
import {
  addCareerContextEntry,
  removeCareerContextEntry,
  setFirstPublicationYear,
  setItemIncluded,
  setPublicationName,
  setShowFirstPublicationYear,
  updateCareerContextEntry,
  updateDisplay,
} from "@/lib/canonical/curate";
import {
  CAREER_CONTEXT_MAX_ENTRIES,
  CAREER_CONTEXT_NOTE_MAX,
  CanonicalCvSchema,
  CareerContextEntrySchema,
  CareerContextSchema,
  DisplayChoicesSchema,
  type CanonicalCv,
  type CareerContextEntry,
} from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import {
  careerContextBlock,
  careerContextEntryLine,
  effectiveFirstPublicationYear,
} from "@/lib/render/careerContext";
import { renderCvDocxBuffer } from "@/lib/render/docx";
import { renderCvHtml } from "@/lib/render/html";
import { renderCvLatex } from "@/lib/render/latex";
import { renderCvMarkdown } from "@/lib/render/markdown";
import { curatedMetrics, formattedMetrics, metricsLineText } from "@/lib/render/metrics";

const hasApa = listAvailableStyles().includes("apa");
const SELF = "https://openalex.org/A5001069481";
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
  metrics: { h_index: 7, i10_index: 5, works_count: 4, cited_by_count: 120 },
};

function work(id: string, year: number, type = "article"): OpenAlexWork {
  return {
    id: `https://openalex.org/${id}`,
    title: `Study ${id}`,
    display_name: `Study ${id}`,
    type,
    publication_year: year,
    cited_by_count: 30,
    authorships: [
      { author: { id: SELF, display_name: "Basile Chrétien" }, raw_author_name: "Basile Chrétien" },
    ],
    primary_location: { source: { display_name: "Journal A", type: "journal" } },
  } as unknown as OpenAlexWork;
}

const NOW = "2026-06-02T00:00:00.000Z";

function makeCv(previous?: CanonicalCv): CanonicalCv {
  return buildCanonicalCv({
    id: "cc",
    resolved,
    works: [work("W1", 2018), work("W2", 2012), work("W3", 2021), work("W4", 2015)],
    now: NOW,
    previous,
  });
}

const BREAK: Omit<CareerContextEntry, "id"> = {
  kind: "career-break",
  start: "2019",
  end: "2020",
  note: "parental leave",
};

/** A CV with the block enabled, two entries and the first-publication line on. */
function shownCv(): CanonicalCv {
  let cv = makeCv();
  cv = addCareerContextEntry(cv, BREAK);
  cv = addCareerContextEntry(cv, { kind: "part-time", start: "2021", end: "2023", fraction: 0.6 });
  cv = addCareerContextEntry(cv, { kind: "clinical-duties", start: "2016" });
  cv = setShowFirstPublicationYear(cv, true);
  return updateDisplay(cv, { showCareerContext: true });
}

describe("career context schema", () => {
  it("defaults the display toggle OFF and the owner field to absent", () => {
    expect(DisplayChoicesSchema.parse({}).showCareerContext).toBe(false);
    expect(makeCv().display.showCareerContext).toBe(false);
  });

  it("accepts YYYY and YYYY-MM dates and rejects anything else", () => {
    const base = { id: "a", kind: "career-break" as const, start: "2019" };
    expect(CareerContextEntrySchema.safeParse(base).success).toBe(true);
    expect(CareerContextEntrySchema.safeParse({ ...base, start: "2019-03" }).success).toBe(true);
    expect(CareerContextEntrySchema.safeParse({ ...base, start: "2019-13" }).success).toBe(false);
    expect(CareerContextEntrySchema.safeParse({ ...base, start: "March 2019" }).success).toBe(
      false,
    );
    expect(CareerContextEntrySchema.safeParse({ ...base, end: "20" }).success).toBe(false);
  });

  it("bounds the fraction to 0–1, the note to its cap, and the list to its cap", () => {
    const base = { id: "a", kind: "part-time" as const, start: "2019" };
    expect(CareerContextEntrySchema.safeParse({ ...base, fraction: 0.6 }).success).toBe(true);
    expect(CareerContextEntrySchema.safeParse({ ...base, fraction: 1.2 }).success).toBe(false);
    expect(CareerContextEntrySchema.safeParse({ ...base, fraction: -0.1 }).success).toBe(false);
    expect(
      CareerContextEntrySchema.safeParse({ ...base, note: "x".repeat(CAREER_CONTEXT_NOTE_MAX) })
        .success,
    ).toBe(true);
    expect(
      CareerContextEntrySchema.safeParse({ ...base, note: "x".repeat(CAREER_CONTEXT_NOTE_MAX + 1) })
        .success,
    ).toBe(false);
    const many = Array.from({ length: CAREER_CONTEXT_MAX_ENTRIES + 1 }, (_, i) => ({
      ...base,
      id: `e${i}`,
    }));
    expect(CareerContextSchema.safeParse({ entries: many }).success).toBe(false);
    expect(CareerContextSchema.safeParse({ entries: many.slice(1) }).success).toBe(true);
    expect(CareerContextSchema.safeParse({}).data).toEqual({
      entries: [],
      showFirstPublicationYear: false,
    });
  });

  it("rejects an unknown kind and an out-of-range first-publication year", () => {
    expect(
      CareerContextEntrySchema.safeParse({ id: "a", kind: "sabbatical", start: "2019" }).success,
    ).toBe(false);
    expect(CareerContextSchema.safeParse({ firstPublicationYear: 12 }).success).toBe(false);
  });
});

describe("career context curate ops (pure, immutable)", () => {
  it("adds entries with unique ids, normalised, and stops at the cap", () => {
    const cv = makeCv();
    const one = addCareerContextEntry(cv, { ...BREAK, note: "  parental leave  " });
    expect(cv.owner.careerContext?.entries ?? []).toHaveLength(0); // input untouched
    expect(one.owner.careerContext?.entries).toEqual([{ id: "cc1", ...BREAK }]);

    // fraction is clamped and kept ONLY on part-time; blanks are dropped.
    const two = addCareerContextEntry(one, {
      kind: "part-time",
      start: " 2021 ",
      end: "  ",
      fraction: 1.7,
      note: "",
    });
    expect(two.owner.careerContext?.entries[1]).toEqual({
      id: "cc2",
      kind: "part-time",
      start: "2021",
      end: undefined,
      fraction: 1,
      note: undefined,
    });
    const three = addCareerContextEntry(two, { kind: "caring", start: "2010", fraction: 0.5 });
    expect(three.owner.careerContext?.entries[2]?.fraction).toBeUndefined();

    let full = three;
    for (let i = 0; i < CAREER_CONTEXT_MAX_ENTRIES; i++) {
      full = addCareerContextEntry(full, { kind: "other", start: "2000" });
    }
    expect(full.owner.careerContext?.entries).toHaveLength(CAREER_CONTEXT_MAX_ENTRIES);
    expect(addCareerContextEntry(full, { kind: "other", start: "2001" })).toBe(full);
    expect(() => CanonicalCvSchema.parse(full)).not.toThrow();
  });

  it("does not reuse an id already present in the list", () => {
    const cv = makeCv();
    const a = addCareerContextEntry(cv, BREAK);
    const b = addCareerContextEntry(a, { kind: "other", start: "2001" });
    const removedFirst = removeCareerContextEntry(b, "cc1");
    const c = addCareerContextEntry(removedFirst, { kind: "other", start: "2002" });
    expect(c.owner.careerContext?.entries.map((e) => e.id)).toEqual(["cc2", "cc3"]);
  });

  it("updates one entry by id (normalised) and ignores an unknown id", () => {
    const cv = addCareerContextEntry(makeCv(), BREAK);
    const upd = updateCareerContextEntry(cv, "cc1", { end: "2021", note: "y".repeat(500) });
    expect(upd.owner.careerContext?.entries[0]).toMatchObject({
      id: "cc1",
      kind: "career-break",
      start: "2019",
      end: "2021",
    });
    expect(upd.owner.careerContext?.entries[0]?.note).toHaveLength(CAREER_CONTEXT_NOTE_MAX);
    // Switching a part-time entry to another kind drops its fraction.
    const pt = addCareerContextEntry(cv, { kind: "part-time", start: "2021", fraction: 0.5 });
    const switched = updateCareerContextEntry(pt, "cc2", { kind: "caring" });
    expect(switched.owner.careerContext?.entries[1]?.fraction).toBeUndefined();
    expect(updateCareerContextEntry(cv, "nope", { end: "2021" })).toBe(cv);
  });

  it("removes by id, ignoring an unknown id (same reference)", () => {
    const cv = addCareerContextEntry(makeCv(), BREAK);
    expect(removeCareerContextEntry(cv, "cc1").owner.careerContext?.entries).toEqual([]);
    expect(removeCareerContextEntry(cv, "nope")).toBe(cv);
    expect(removeCareerContextEntry(makeCv(), "cc1")).toBeDefined();
  });

  it("sets / clears the owner's first-publication year override", () => {
    const cv = makeCv();
    expect(
      setFirstPublicationYear(cv, 2009).owner.careerContext?.firstPublicationYearOverride,
    ).toBe(2009);
    for (const bad of [undefined, NaN, 12, 2009.5, 99999]) {
      expect(
        setFirstPublicationYear(cv, bad).owner.careerContext?.firstPublicationYearOverride,
      ).toBeUndefined();
    }
    expect(
      setShowFirstPublicationYear(cv, true).owner.careerContext?.showFirstPublicationYear,
    ).toBe(true);
  });
});

describe("first-publication year derivation (build)", () => {
  it("is the earliest kept publication/preprint year, honouring a year correction", () => {
    const cv = makeCv();
    expect(cv.owner.careerContext?.firstPublicationYear).toBe(2012);
    expect(cv.owner.careerContext?.entries).toEqual([]);
    // Corrected year on the earliest work moves the derived value.
    const corrected = cv.sections.map((s) => ({
      ...s,
      items: s.items.map((it) =>
        it.id === "W2" ? { ...it, meta: { ...it.meta, yearOverride: 2010 } } : it,
      ),
    }));
    expect(deriveFirstPublicationYear(corrected)).toBe(2010);
  });

  it("skips hidden / not-mine works and non-publication sections", () => {
    const cv = makeCv();
    const hidden = setItemIncluded(cv, "publications", "W2", false);
    expect(deriveFirstPublicationYear(hidden.sections)).toBe(2015);
    const notMine = cv.sections.map((s) => ({
      ...s,
      items: s.items.map((it) => (it.id === "W2" ? { ...it, notMine: true } : it)),
    }));
    expect(deriveFirstPublicationYear(notMine)).toBe(2015);
    // A dataset-typed section with an older year contributes nothing.
    const withDataset = [
      ...cv.sections,
      {
        ...cv.sections.find((s) => s.type === "publications")!,
        id: "datasets",
        type: "datasets" as const,
        items: cv.sections
          .find((s) => s.type === "publications")!
          .items.map((it) => ({ ...it, meta: { ...it.meta, year: 1999 } })),
      },
    ];
    expect(deriveFirstPublicationYear(withDataset)).toBe(2012);
  });

  it("is absent when no publication carries a year and nothing was declared", () => {
    const cv = buildCanonicalCv({ id: "none", resolved, works: [], now: NOW });
    expect(cv.owner.careerContext).toBeUndefined();
    expect(deriveFirstPublicationYear(cv.sections)).toBeUndefined();
  });

  it("carries the declared parts across a rebuild and recomputes the derived year", () => {
    let curated = shownCv();
    curated = setFirstPublicationYear(curated, 2009);
    curated = setPublicationName(curated, { family: "Chrétien-Nishikawa" });
    // Hide the earliest work before the re-sync: the derived year must move…
    curated = setItemIncluded(curated, "publications", "W2", false);
    const rebuilt = makeCv(curated);
    const ctx = rebuilt.owner.careerContext!;
    expect(ctx.entries).toEqual(curated.owner.careerContext!.entries);
    expect(ctx.entries).toHaveLength(3);
    expect(ctx.firstPublicationYearOverride).toBe(2009);
    expect(ctx.showFirstPublicationYear).toBe(true);
    expect(ctx.firstPublicationYear).toBe(2015);
    // …while the owner's override still wins at render.
    expect(effectiveFirstPublicationYear(rebuilt)).toBe(2009);
    expect(rebuilt.display.showCareerContext).toBe(true);
    // The preferred publication name survives the same way.
    expect(rebuilt.owner.publicationName).toEqual({ family: "Chrétien-Nishikawa" });
  });
});

describe("career context lines", () => {
  it("formats each kind, the part-time percentage, the note and open ranges", () => {
    expect(careerContextEntryLine({ id: "a", ...BREAK }, "en-US")).toBe(
      "Career break (parental leave), 2019–2020",
    );
    expect(
      careerContextEntryLine(
        { id: "b", kind: "part-time", start: "2021", end: "2023", fraction: 0.6 },
        "en-US",
      ),
    ).toBe("Part-time 60%, 2021–2023");
    expect(
      careerContextEntryLine({ id: "c", kind: "clinical-duties", start: "2016" }, "en-US"),
    ).toBe("Clinical duties alongside research, 2016–");
    expect(careerContextEntryLine({ id: "d", kind: "caring", start: "2010-03" }, "fr-FR")).toBe(
      "Responsabilités familiales, 2010-03–",
    );
    expect(careerContextEntryLine({ id: "e", kind: "military", start: "2005" }, "en-US")).toContain(
      "Military service",
    );
    expect(careerContextEntryLine({ id: "f", kind: "other", start: "2005" }, "en-US")).toContain(
      "Other",
    );
  });

  it("is null when the toggle is off, when nothing is declared, or when empty", () => {
    expect(careerContextBlock(makeCv())).toBeNull();
    expect(careerContextBlock(updateDisplay(makeCv(), { showCareerContext: true }))).toBeNull();
    const noCtx = buildCanonicalCv({ id: "none", resolved, works: [], now: NOW });
    expect(careerContextBlock(updateDisplay(noCtx, { showCareerContext: true }))).toBeNull();
  });

  it("adds the first-publication line only when opted in, with the years-active span", () => {
    const cv = shownCv();
    const block = careerContextBlock(cv, 2026)!;
    expect(block.label).toBe("Career context (self-declared)");
    expect(block.lines).toEqual([
      "Career break (parental leave), 2019–2020",
      "Part-time 60%, 2021–2023",
      "Clinical duties alongside research, 2016–",
      "First publication: 2012 (14 years active)",
    ]);
    const override = setFirstPublicationYear(cv, 2030); // future year → span floors at 0
    expect(careerContextBlock(override, 2026)!.lines.at(-1)).toBe(
      "First publication: 2030 (0 years active)",
    );
    const off = setShowFirstPublicationYear(cv, false);
    expect(careerContextBlock(off, 2026)!.lines).toHaveLength(3);
    // Default `nowYear` is the current UTC year.
    expect(careerContextBlock(cv)!.lines.at(-1)).toMatch(
      /^First publication: 2012 \(\d+ years active\)$/,
    );
  });
});

describe.skipIf(!hasApa)("career context renders (opt-in, every format)", () => {
  it("HTML shows the block only when display.showCareerContext is on", () => {
    const off = shownCv();
    expect(renderCvHtml(updateDisplay(off, { showCareerContext: false }))).not.toContain(
      'class="cv-career"',
    );
    const html = renderCvHtml(off);
    expect(html).toContain('class="cv-career"');
    expect(html).toContain("Career break (parental leave), 2019–2020");
    expect(html).toContain("Part-time 60%, 2021–2023");
    expect(html).toContain("First publication: 2012");
    // A note is HTML-escaped, never injected.
    const hostile = addCareerContextEntry(off, {
      kind: "other",
      start: "2001",
      note: "<img src=x onerror=alert(1)>",
    });
    expect(renderCvHtml(hostile)).not.toContain("<img src=x");
    expect(renderCvHtml(hostile)).toContain("&lt;img src=x");
  });

  it("Markdown lists the lines under a bold label, only when on", () => {
    const cv = shownCv();
    const md = renderCvMarkdown(cv);
    expect(md).toContain("**Career context (self-declared)**");
    expect(md).toContain("- Career break (parental leave), 2019–2020");
    expect(md).toContain("- First publication: 2012");
    expect(renderCvMarkdown(updateDisplay(cv, { showCareerContext: false }))).not.toContain(
      "Career context",
    );
  });

  it("DOCX carries the label and the lines, only when on", async () => {
    const cv = shownCv();
    const zip = await JSZip.loadAsync(await renderCvDocxBuffer(cv));
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toContain("Career context (self-declared)");
    expect(xml).toContain("Part-time 60%, 2021–2023");
    const offZip = await JSZip.loadAsync(
      await renderCvDocxBuffer(updateDisplay(cv, { showCareerContext: false })),
    );
    expect(await offZip.file("word/document.xml")!.async("string")).not.toContain("Career context");
  });

  it("LaTeX (classic + sidebar) prints the escaped lines, only when on", () => {
    const cv = addCareerContextEntry(shownCv(), {
      kind: "other",
      start: "2001",
      note: "50% & more",
    });
    const classic = renderCvLatex(cv);
    expect(classic).toContain("Career context (self-declared)");
    expect(classic).toContain("Other (50\\% \\& more), 2001–");
    const sidebar = renderCvLatex(updateDisplay(cv, { template: "sidebar" }));
    expect(sidebar).toContain("Career break (parental leave), 2019–2020");
    expect(renderCvLatex(updateDisplay(cv, { showCareerContext: false }))).not.toContain(
      "Career context",
    );
  });
});

describe("career context: privacy + no-normalisation guarantee", () => {
  it("is stripped from the public projection unless the owner shows the block", () => {
    const cv = shownCv();
    expect(projectCvForPublic(cv).owner.careerContext?.entries).toHaveLength(3);
    const hidden = updateDisplay(cv, { showCareerContext: false });
    expect(projectCvForPublic(hidden).owner.careerContext).toBeUndefined();
  });

  it("changes no metric, formatted figure or metrics line when present", () => {
    const plain = updateDisplay(makeCv(), {
      showMetrics: true,
      metrics: ["h_index", "works_count"],
    });
    const withContext = updateDisplay(shownCv(), {
      showMetrics: true,
      metrics: ["h_index", "works_count"],
    });
    expect(withContext.owner.careerContext?.entries).toHaveLength(3);
    expect(withContext.owner.metrics).toEqual(plain.owner.metrics);
    expect(curatedMetrics(withContext)).toEqual(curatedMetrics(plain));
    expect(formattedMetrics(withContext)).toEqual(formattedMetrics(plain));
    expect(metricsLineText(withContext)).toBe(metricsLineText(plain));
    // A rebuild with the context declared still yields identical metrics.
    const rebuilt = makeCv(withContext);
    expect(rebuilt.owner.metrics).toEqual(plain.owner.metrics);
    expect(rebuilt.owner.countsByYear).toEqual(plain.owner.countsByYear);
  });
});
