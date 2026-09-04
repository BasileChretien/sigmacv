import { beforeEach, describe, expect, it, vi } from "vitest";
import JSZip from "jszip";

const mocks = vi.hoisted(() => ({
  fetchCrossrefTitleYear: vi.fn(),
  fetchDataciteTitleYear: vi.fn(),
  resolveInstitution: vi.fn(),
}));
vi.mock("@/lib/crossref/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/crossref/client")>()),
  fetchCrossrefTitleYear: mocks.fetchCrossrefTitleYear,
}));
vi.mock("@/lib/datacite/client", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/datacite/client")>()),
  fetchDataciteTitleYear: mocks.fetchDataciteTitleYear,
}));
vi.mock("@/lib/ror/client", () => ({ resolveInstitution: mocks.resolveInstitution }));

import { buildCanonicalCv } from "@/lib/canonical/build";
import { setSupervisionDetails, updateDisplay } from "@/lib/canonical/curate";
import { enrichCvWithSupervision } from "@/lib/canonical/enrich";
import { narrativeEvidence, narrativeEvidenceEntries } from "@/lib/canonical/narrativeEvidence";
import {
  CanonicalCvSchema,
  DisplayChoicesSchema,
  hasStructuredSupervision,
  type CanonicalCv,
  type CvItem,
} from "@/lib/canonical/schema";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import { renderStrings } from "@/lib/i18n/render";
import { renderCvDocxBuffer } from "@/lib/render/docx";
import { buildRenderedSections, renderCvHtml } from "@/lib/render/html";
import { renderCvLatex } from "@/lib/render/latex";
import { renderCvMarkdown } from "@/lib/render/markdown";
import { prepareSections } from "@/lib/render/prepare";
import {
  supervisionEntry,
  supervisionEntryHtml,
  supervisionEntryText,
} from "@/lib/render/supervision";
import { supervisionSummary, supervisionSummaryText } from "@/lib/render/supervisionSummary";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";

beforeEach(() => {
  mocks.fetchCrossrefTitleYear.mockReset();
  mocks.fetchDataciteTitleYear.mockReset();
  mocks.resolveInstitution.mockReset();
});

// ─── fixtures ─────────────────────────────────────────────────────────────────

type Meta = CvItem["meta"];

function sup(id: string, meta: Meta = {}, over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "manual",
    sourceId: "manual",
    displayText: `Free text ${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    meta,
    ...over,
  };
}

const JANE: Meta = {
  superviseeName: "Jane Doe",
  degreeLevel: "phd",
  supervisionRole: "primary",
  startYear: 2019,
  endYear: 2023,
  status: "completed",
  thesisTitle: "Adverse drug reactions in the elderly",
  thesisDoi: "10.5555/thesis.1",
  institution: "Nagoya University",
  rorId: "https://ror.org/04chrp450",
  currentPosition: "Postdoc at Kyoto University",
};

function cv(items: CvItem[], display: Record<string, unknown> = {}): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "sup",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Basile Chrétien" },
    display,
    sections: [
      {
        id: "supervision",
        type: "supervision",
        title: "Supervision",
        visible: true,
        order: 0,
        items,
      },
    ],
    provenance: { generatedAt: "2026-09-04T00:00:00.000Z", sources: ["openalex"] },
  });
}

function supervisionHtml(c: CanonicalCv): string {
  const rs = buildRenderedSections(c).find((s) => s.section.type === "supervision")!;
  return rs.items.map((i) => i.html).join("\n");
}

// ─── schema ───────────────────────────────────────────────────────────────────

describe("schema: structured supervision meta", () => {
  it("accepts the structured fields and degrades an unknown vocabulary value to undefined", () => {
    const parsed = cv([sup("s1", { ...JANE, degreeLevel: "wizard" as never })]).sections[0]!
      .items[0]!;
    expect(parsed.meta.superviseeName).toBe("Jane Doe");
    expect(parsed.meta.supervisionRole).toBe("primary");
    expect(parsed.meta.status).toBe("completed");
    expect(parsed.meta.degreeLevel).toBeUndefined();
    expect(parsed.meta.thesisDoi).toBe("10.5555/thesis.1");
  });

  it("bounds the text fields", () => {
    const ok = (meta: Meta): boolean => {
      const base = cv([]);
      const doc = { ...base, sections: [{ ...base.sections[0]!, items: [sup("s", meta)] }] };
      return CanonicalCvSchema.safeParse(doc).success;
    };
    expect(ok({ superviseeName: "x".repeat(121) })).toBe(false);
    expect(ok({ thesisTitle: "x".repeat(301) })).toBe(false);
    expect(ok({ currentPosition: "x".repeat(161) })).toBe(false);
    expect(ok({ superviseeName: "x".repeat(120) })).toBe(true);
  });

  it("defaults both display toggles OFF", () => {
    const d = DisplayChoicesSchema.parse({});
    expect(d.showSupervisionSummary).toBe(false);
    expect(d.hideSuperviseeNames).toBe(false);
  });

  it("hasStructuredSupervision needs a lead field (name / level / role / thesis), not just dates", () => {
    expect(hasStructuredSupervision(sup("a", {}))).toBe(false);
    expect(hasStructuredSupervision(sup("a", { startYear: 2020, status: "ongoing" }))).toBe(false);
    expect(hasStructuredSupervision(sup("a", { superviseeName: "  " }))).toBe(false);
    expect(hasStructuredSupervision(sup("a", { superviseeName: "J" }))).toBe(true);
    expect(hasStructuredSupervision(sup("a", { degreeLevel: "phd" }))).toBe(true);
    expect(hasStructuredSupervision(sup("a", { supervisionRole: "mentor" }))).toBe(true);
    expect(hasStructuredSupervision(sup("a", { thesisTitle: "T" }))).toBe(true);
  });
});

// ─── curate ───────────────────────────────────────────────────────────────────

describe("curate: setSupervisionDetails", () => {
  const base = cv([
    sup("s1", { institution: "Old U", rorId: "https://ror.org/000", thesisTitle: "T" }),
  ]);
  const item = (c: CanonicalCv) => c.sections[0]!.items[0]!;

  it("sets only the keys present in the patch, is immutable, and ignores unknown ids", () => {
    const next = setSupervisionDetails(base, "supervision", "s1", {
      superviseeName: "Jane Doe ",
      degreeLevel: "phd",
      status: "ongoing",
      startYear: 2020,
    });
    expect(item(next).meta).toMatchObject({
      superviseeName: "Jane Doe ", // raw (a trailing space survives typing)
      degreeLevel: "phd",
      status: "ongoing",
      startYear: 2020,
      thesisTitle: "T", // untouched
      institution: "Old U",
      rorId: "https://ror.org/000",
    });
    expect(item(base).meta.superviseeName).toBeUndefined();
    expect(setSupervisionDetails(base, "supervision", "nope", { degreeLevel: "phd" })).toEqual(
      base,
    );
  });

  it("blank / empty-select values clear a field; bad years clear too", () => {
    const filled = setSupervisionDetails(base, "supervision", "s1", {
      superviseeName: "J",
      degreeLevel: "phd",
      supervisionRole: "mentor",
      status: "completed",
      startYear: 2019,
      endYear: 2023,
      thesisUrl: "https://example.org/t",
      currentPosition: "Now",
    });
    const cleared = setSupervisionDetails(filled, "supervision", "s1", {
      superviseeName: "  ",
      degreeLevel: "",
      supervisionRole: "",
      status: "",
      startYear: undefined,
      endYear: Number.NaN,
      thesisTitle: "",
      thesisUrl: "",
      currentPosition: "",
    });
    const m = item(cleared).meta;
    for (const k of [
      "superviseeName",
      "degreeLevel",
      "supervisionRole",
      "status",
      "startYear",
      "endYear",
      "thesisTitle",
      "thesisUrl",
      "currentPosition",
    ] as const) {
      expect(m[k]).toBeUndefined();
    }
    expect(
      item(setSupervisionDetails(base, "supervision", "s1", { endYear: 99_999 })).meta.endYear,
    ).toBeUndefined();
  });

  it("normalizes the thesis DOI to its bare lower-case form", () => {
    const a = setSupervisionDetails(base, "supervision", "s1", {
      thesisDoi: " https://doi.org/10.5555/ABC ",
    });
    expect(item(a).meta.thesisDoi).toBe("10.5555/abc");
    const b = setSupervisionDetails(a, "supervision", "s1", { thesisDoi: "doi:10.1/X" });
    expect(item(b).meta.thesisDoi).toBe("10.1/x");
    expect(
      item(setSupervisionDetails(b, "supervision", "s1", { thesisDoi: "" })).meta.thesisDoi,
    ).toBeUndefined();
  });

  it("editing the institution NAME drops the stale ROR link; the same name keeps it", () => {
    const same = setSupervisionDetails(base, "supervision", "s1", { institution: "Old U" });
    expect(item(same).meta.rorId).toBe("https://ror.org/000");
    const changed = setSupervisionDetails(base, "supervision", "s1", { institution: "New U" });
    expect(item(changed).meta.institution).toBe("New U");
    expect(item(changed).meta.rorId).toBeUndefined();
    const blank = setSupervisionDetails(base, "supervision", "s1", { institution: "" });
    expect(item(blank).meta.institution).toBeUndefined();
    expect(item(blank).meta.rorId).toBeUndefined();
  });
});

// ─── re-sync survival ─────────────────────────────────────────────────────────

describe("build: structured supervision items survive a re-sync", () => {
  const resolved: ResolvedAuthor = {
    orcid: "0000-0002-7483-2489",
    authorIds: ["A1"],
    displayName: "Basile Chrétien",
  };

  it("carries the owner-entered section + every structured field across a rebuild", () => {
    const previous = cv([
      sup("s1", JANE),
      sup("s2", { superviseeName: "K", degreeLevel: "master" }),
    ]);
    const rebuilt = buildCanonicalCv({
      id: "sup",
      resolved,
      works: [],
      now: "2026-09-05T00:00:00.000Z",
      previous,
    });
    const section = rebuilt.sections.find((s) => s.type === "supervision");
    expect(section?.items.map((i) => i.id)).toEqual(["s1", "s2"]);
    expect(section?.items[0]!.meta).toEqual(JANE);
    expect(section?.items[0]!.source).toBe("manual");
  });
});

// ─── summary helper ───────────────────────────────────────────────────────────

describe("supervisionSummary", () => {
  const rs = renderStrings("en-US");

  it("counts by level in seniority order, completed only on a recorded status", () => {
    const items = [
      sup("a", { degreeLevel: "phd", status: "completed" }),
      sup("b", { degreeLevel: "phd", status: "ongoing" }),
      sup("c", { degreeLevel: "phd", endYear: 2020 }), // an end year alone ≠ completed
      sup("d", { degreeLevel: "master", status: "completed" }),
      sup("e", { degreeLevel: "master", status: "completed" }),
      sup("f", { degreeLevel: "postdoc" }),
      sup("g", {}), // no level → total only
    ];
    const s = supervisionSummary(items);
    expect(s.total).toBe(7);
    expect(s.levels).toEqual([
      { level: "phd", count: 3, completed: 1 },
      { level: "postdoc", count: 1, completed: 0 },
      { level: "master", count: 2, completed: 2 },
    ]);
    expect(supervisionSummaryText(s, rs)).toBe(
      "7 supervised: 3 PhD (1 completed), 1 Postdoc, 2 Master's (2 completed)",
    );
  });

  it("is empty for no items and total-only when no item has a level", () => {
    expect(supervisionSummaryText(supervisionSummary([]), rs)).toBe("");
    expect(supervisionSummaryText(supervisionSummary([sup("a"), sup("b")]), rs)).toBe(
      "2 supervised",
    );
  });
});

// ─── prepared record ──────────────────────────────────────────────────────────

describe("supervisionEntry (shared prepared record)", () => {
  it("composes the lead, right-slot dates and the sub-line parts", () => {
    const e = supervisionEntry(sup("s", JANE), "en-US", false)!;
    expect(e.lead).toBe("Jane Doe — PhD, primary supervisor");
    expect(e.dates).toBe("2019–2023");
    expect(e.sub).toEqual([
      { text: "Adverse drug reactions in the elderly", href: "https://doi.org/10.5555/thesis.1" },
      { text: "Nagoya University", href: "https://ror.org/04chrp450" },
      { text: "now: Postdoc at Kyoto University" },
    ]);
    expect(e.status).toEqual({ label: "completed", ongoing: false });
  });

  it("returns null for an unstructured entry (free text renders instead)", () => {
    expect(supervisionEntry(sup("s", { startYear: 2020 }), "en-US", false)).toBeNull();
  });

  it("hides the name behind the degree noun and drops the redundant degree label", () => {
    const e = supervisionEntry(sup("s", JANE), "en-US", true)!;
    expect(e.lead).toBe("PhD student — primary supervisor");
    // No name recorded → nothing to hide; the lead is the qualifiers alone.
    const noName = supervisionEntry(
      sup("s", { degreeLevel: "master", supervisionRole: "mentor" }),
      "en-US",
      true,
    )!;
    expect(noName.lead).toBe("Master's, mentor");
    // A name with no level → the generic noun.
    expect(supervisionEntry(sup("s", { superviseeName: "J" }), "en-US", true)!.lead).toBe(
      "Supervisee",
    );
  });

  it("localizes labels and the date terms", () => {
    const e = supervisionEntry(
      sup("s", { ...JANE, endYear: undefined, status: "ongoing" }),
      "fr-FR",
      false,
    )!;
    expect(e.lead).toBe("Jane Doe — Doctorat, directeur·rice principal·e");
    expect(e.dates).toBe("2019–présent");
    expect(e.status).toEqual({ label: "en cours", ongoing: true });
  });

  it("shows only the start year for a closed record with no end year, never “–present”", () => {
    const done = supervisionEntry(
      sup("s", { degreeLevel: "phd", startYear: 2015, status: "completed" }),
      "en-US",
      false,
    )!;
    expect(done.dates).toBe("2015");
    const stopped = supervisionEntry(
      sup("s", { degreeLevel: "phd", status: "discontinued" }),
      "en-US",
      false,
    )!;
    expect(stopped.dates).toBe("");
    const open = supervisionEntry(
      sup("s", { degreeLevel: "phd", startYear: 2015 }),
      "en-US",
      false,
    )!;
    expect(open.dates).toBe("2015–present");
  });

  it("promotes a lone thesis title to the lead and links a DOI-less thesis by URL", () => {
    const only = supervisionEntry(
      sup("s", { thesisTitle: "Only a title", thesisUrl: "https://x.org/t" }),
      "en-US",
      false,
    )!;
    expect(only.lead).toBe("Only a title");
    expect(only.sub).toEqual([]);
    const byUrl = supervisionEntry(
      sup("s", { degreeLevel: "phd", thesisUrl: "https://x.org/t" }),
      "en-US",
      false,
    )!;
    expect(byUrl.sub).toEqual([{ text: "https://x.org/t", href: "https://x.org/t" }]);
    // A prefixed DOI still links canonically; an unsafe URL is dropped.
    const pref = supervisionEntry(
      sup("s", { degreeLevel: "phd", thesisTitle: "T", thesisDoi: "https://doi.org/10.1/A" }),
      "en-US",
      false,
    )!;
    expect(pref.sub[0]).toEqual({ text: "T", href: "https://doi.org/10.1/A" });
    const bad = supervisionEntry(
      sup("s", { degreeLevel: "phd", thesisTitle: "T", thesisUrl: "javascript:alert(1)" }),
      "en-US",
      false,
    )!;
    expect(bad.sub[0]).toEqual({ text: "T" });
  });

  it("links the institution to its homepage first, then its ROR record; an override is verbatim + unlinked", () => {
    const site = supervisionEntry(
      sup("s", {
        degreeLevel: "phd",
        institution: "U",
        rorId: "04chrp450",
        institutionUrl: "https://u.example",
      }),
      "en-US",
      false,
    )!;
    expect(site.sub[0]).toEqual({ text: "U", href: "https://u.example" });
    const bare = supervisionEntry(
      sup("s", { degreeLevel: "phd", institution: "U", rorId: "04chrp450" }),
      "en-US",
      false,
    )!;
    expect(bare.sub[0]).toEqual({ text: "U", href: "https://ror.org/04chrp450" });
    const junk = supervisionEntry(
      sup("s", { degreeLevel: "phd", institution: "U", rorId: "not a ror" }),
      "en-US",
      false,
    )!;
    expect(junk.sub[0]).toEqual({ text: "U" });
    const over = supervisionEntry(
      sup("s", {
        degreeLevel: "phd",
        institution: "U",
        rorId: "04chrp450",
        institutionOverride: "My U",
      }),
      "en-US",
      false,
    )!;
    expect(over.sub[0]).toEqual({ text: "My U" });
    const localized = supervisionEntry(
      sup("s", {
        degreeLevel: "phd",
        institution: "Nagoya University",
        institutionNames: { ja: "名古屋大学" },
      }),
      "ja-JP",
      false,
    )!;
    expect(localized.sub[0]).toEqual({ text: "名古屋大学" });
  });

  it("serializes to the flat text line and the two-line HTML record", () => {
    const e = supervisionEntry(sup("s", JANE), "en-US", false)!;
    expect(supervisionEntryText(e)).toBe(
      "Jane Doe — PhD, primary supervisor (2019–2023). Adverse drug reactions in the elderly (https://doi.org/10.5555/thesis.1) · Nagoya University (https://ror.org/04chrp450) · now: Postdoc at Kyoto University · completed",
    );
    const html = supervisionEntryHtml(e);
    expect(html).toContain('<div class="cv-entry cv-entry-supervision">');
    expect(html).toContain('<span class="cv-entry-lead">Jane Doe — PhD, primary supervisor</span>');
    expect(html).toContain('<span class="cv-entry-dates">2019–2023</span>');
    expect(html).toContain(
      '<a class="cv-entry-link" href="https://doi.org/10.5555/thesis.1">Adverse drug reactions in the elderly</a>',
    );
    expect(html).toContain('<span class="cv-entry-status">completed</span>');
    // Minimal record: no dates slot, no sub-line; an ongoing status is a pill;
    // a link whose label IS the URL isn't repeated in the text form.
    const min = supervisionEntry(
      sup("s", { superviseeName: "A <b>", status: "ongoing", thesisUrl: "https://x.org/t" }),
      "en-US",
      false,
    )!;
    expect(supervisionEntryText(min)).toBe("A <b>. https://x.org/t · ongoing");
    const minHtml = supervisionEntryHtml(min);
    expect(minHtml).toContain('<span class="cv-entry-lead">A &lt;b&gt;</span></div>');
    expect(minHtml).toContain('<span class="cv-entry-status is-ongoing">ongoing</span>');
    expect(
      supervisionEntryText(supervisionEntry(sup("s", { degreeLevel: "phd" }), "en-US", false)!),
    ).toBe("PhD");
    expect(
      supervisionEntryHtml(supervisionEntry(sup("s", { degreeLevel: "phd" }), "en-US", false)!),
    ).not.toContain("cv-entry-sub");
  });
});

// ─── renderers (shared prepared-data path) ────────────────────────────────────

describe("renderers: structured supervision record + fallback", () => {
  const doc = cv([sup("s1", JANE), sup("s2", {}, { displayText: "Free-text mentee line" })]);

  it("HTML: two-line record for the structured item, plain line for the free-text one, in a .cv-history list", () => {
    const html = supervisionHtml(doc);
    expect(html).toContain(
      '<span class="cv-entry-lead">Jane Doe — PhP'.replace("PhP", "PhD") +
        ", primary supervisor</span>",
    );
    expect(html).toContain("Free-text mentee line");
    expect(html).not.toContain("Free text s1"); // the structured record replaces its free text
    const page = renderCvHtml(doc);
    expect(page).toContain('<ol class="cv-bib cv-history">');
    expect(page).not.toContain('<div class="csl-entry"><div class="cv-entry');
  });

  it("Markdown + LaTeX + DOCX list the same flat line", async () => {
    const md = renderCvMarkdown(doc);
    expect(md).toContain("Jane Doe — PhD, primary supervisor (2019–2023)");
    expect(md).toContain("Free-text mentee line");
    const tex = renderCvLatex(doc);
    expect(tex).toContain("Jane Doe — PhD, primary supervisor (2019–2023)");
    // The parenthesised URL keeps its closing bracket OUTSIDE \url{} (the greedy
    // URL match used to swallow it); a URL that itself contains "(" is left whole.
    expect(tex).toContain("(\\url{https://doi.org/10.5555/thesis.1})");
    const wiki = cv([
      sup("w", { degreeLevel: "phd", thesisTitle: "T", thesisUrl: "https://x.org/a_(b)" }),
    ]);
    expect(renderCvLatex(wiki)).toContain("(\\url{https://x.org/a_(b))}");
    const zip = await JSZip.loadAsync(await renderCvDocxBuffer(doc));
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toContain("Jane Doe — PhD, primary supervisor (2019–2023)");
    expect(xml).toContain("Free-text mentee line");
  });

  it("the opt-in summary line leads the section in every format, and only when opted in", async () => {
    expect(renderCvHtml(doc)).not.toContain('<p class="cv-section-intro">');
    expect(renderCvMarkdown(doc)).not.toContain("supervised");
    const on = updateDisplay(doc, { showSupervisionSummary: true });
    const line = "2 supervised: 1 PhD (1 completed)";
    expect(renderCvHtml(on)).toContain(`<p class="cv-section-intro">${line}</p><ol`);
    expect(renderCvMarkdown(on)).toContain(`## Supervision\n\n*${line}*\n\n1. `);
    expect(renderCvLatex(on)).toContain(
      `\\section{Supervision}\n{\\small\\itshape ${line}}\\par\n\\begin{cvlist}`,
    );
    const zip = await JSZip.loadAsync(await renderCvDocxBuffer(on));
    expect(await zip.file("word/document.xml")!.async("string")).toContain(line);
    // The intro is HTML-escaped (a supervisee-free figure, but the rule is uniform).
    expect(prepareSections(on, "html")[0]!.intro).toBe(line);
    expect(prepareSections(on, "text")[0]!.intro).toBe(line);
    // Hidden items are not counted.
    const hid = cv([sup("s1", JANE), sup("s2", { degreeLevel: "phd" }, { included: false })], {
      showSupervisionSummary: true,
    });
    expect(prepareSections(hid, "text")[0]!.intro).toBe("1 supervised: 1 PhD (1 completed)");
  });

  it("hideSuperviseeNames: the degree noun replaces the name in every render; the stored doc keeps it", () => {
    const hidden = updateDisplay(doc, { hideSuperviseeNames: true });
    for (const out of [supervisionHtml(hidden), renderCvMarkdown(hidden), renderCvLatex(hidden)]) {
      expect(out).toContain("PhD student — primary supervisor");
      expect(out).not.toContain("Jane Doe");
    }
    expect(hidden.sections[0]!.items[0]!.meta.superviseeName).toBe("Jane Doe");
    expect(supervisionHtml(doc)).toContain("Jane Doe");
  });
});

// ─── public projection ────────────────────────────────────────────────────────

describe("projectCvForPublic: supervisee names", () => {
  it("keeps the name by default and strips it when the owner hides names", () => {
    const doc = cv([sup("s1", JANE)]);
    expect(projectCvForPublic(doc).sections[0]!.items[0]!.meta.superviseeName).toBe("Jane Doe");
    const hidden = updateDisplay(doc, { hideSuperviseeNames: true });
    const pub = projectCvForPublic(hidden);
    expect(pub.sections[0]!.items[0]!.meta.superviseeName).toBeUndefined();
    // The rest of the record (the evidence) is still published.
    expect(pub.sections[0]!.items[0]!.meta.thesisTitle).toBe(JANE.thesisTitle);
    expect(JSON.stringify(pub)).not.toContain("Jane Doe");
  });
});

// ─── narrative evidence ───────────────────────────────────────────────────────

describe("narrativeEvidence: structured supervision", () => {
  it("counts structured entries under 'individuals' and describes them WITHOUT the supervisee's name", () => {
    const doc = cv([
      sup("s1", JANE),
      sup("s2", { superviseeName: "Only A Name" }),
      sup("s3", {}, { displayText: "Free-text mentee line" }),
      sup("s4", JANE, { included: false }),
    ]);
    expect(narrativeEvidence(doc, "narrative-individuals")).toEqual([
      { type: "supervision", count: 3 },
    ]);
    const groups = narrativeEvidenceEntries(doc, "narrative-individuals");
    expect(groups).toEqual([
      {
        type: "supervision",
        entries: [
          {
            title: "PhD, primary supervisor — Adverse drug reactions in the elderly",
            venue: "Nagoya University",
            year: 2023,
          },
          { title: "Supervisee" },
          { title: "Free-text mentee line" },
        ],
      },
    ]);
    expect(JSON.stringify(groups)).not.toContain("Jane Doe");
    expect(JSON.stringify(groups)).not.toContain("Only A Name");
  });

  it("uses the start year when no end year is recorded, in the CV's language", () => {
    const doc = cv([sup("s1", { degreeLevel: "master", startYear: 2024, status: "ongoing" })], {
      locale: "fr-FR",
    });
    expect(narrativeEvidenceEntries(doc, "narrative-individuals")[0]!.entries).toEqual([
      { title: "Master", year: 2024 },
    ]);
  });
});

// ─── enrichment ───────────────────────────────────────────────────────────────

describe("enrichCvWithSupervision", () => {
  const MAILTO = "ci@example.org";

  it("gap-fills the thesis title + completion year from Crossref and the institution's ROR id", async () => {
    mocks.fetchCrossrefTitleYear.mockResolvedValue({ title: "Filled title", year: 2022 });
    mocks.resolveInstitution.mockResolvedValue({
      id: "https://ror.org/04chrp450",
      name: "Nagoya University",
      names: { ja: "名古屋大学" },
      website: "https://en.nagoya-u.ac.jp/",
    });
    const doc = cv([
      sup("s1", { degreeLevel: "phd", thesisDoi: "10.5555/x", institution: "Nagoya University" }),
    ]);
    const out = await enrichCvWithSupervision(doc, MAILTO);
    const m = out.sections[0]!.items[0]!.meta;
    expect(m.thesisTitle).toBe("Filled title");
    expect(m.endYear).toBe(2022);
    expect(m.rorId).toBe("https://ror.org/04chrp450");
    expect(m.institutionNames).toEqual({ ja: "名古屋大学" });
    expect(m.institutionUrl).toBe("https://en.nagoya-u.ac.jp/");
    expect(out.provenance.sources).toContain("crossref");
    expect(mocks.fetchCrossrefTitleYear).toHaveBeenCalledWith("10.5555/x", MAILTO);
    expect(mocks.fetchDataciteTitleYear).not.toHaveBeenCalled();
    // Immutable: the input is untouched.
    expect(doc.sections[0]!.items[0]!.meta.thesisTitle).toBeUndefined();
  });

  it("falls back to DataCite when Crossref has no record, and records that source", async () => {
    mocks.fetchCrossrefTitleYear.mockResolvedValue(null);
    mocks.fetchDataciteTitleYear.mockResolvedValue({ title: "Repo title" });
    const doc = cv([sup("s1", { degreeLevel: "phd", thesisDoi: "10.5555/x" })]);
    const out = await enrichCvWithSupervision(doc, MAILTO);
    expect(out.sections[0]!.items[0]!.meta.thesisTitle).toBe("Repo title");
    expect(out.provenance.sources).toContain("datacite");
    expect(out.provenance.sources).not.toContain("crossref");
  });

  it("never overwrites the owner's title, never sets an end year on an ongoing record", async () => {
    mocks.fetchCrossrefTitleYear.mockResolvedValue({ title: "Other", year: 2022 });
    const doc = cv([
      // Title missing on an ONGOING record → the title fills, the year does not.
      sup("s1", { degreeLevel: "phd", thesisDoi: "10.5555/x", status: "ongoing" }),
      // Fully recorded → nothing to fill, not even looked up, same object out.
      sup("s2", {
        degreeLevel: "phd",
        thesisDoi: "10.5555/y",
        thesisTitle: "Mine too",
        endYear: 2020,
      }),
      // Owner's title + no end year on a completed record → only the year fills.
      sup("s3", {
        degreeLevel: "phd",
        thesisDoi: "10.5555/z",
        thesisTitle: "Mine",
        status: "completed",
      }),
      // An ongoing record with its title already there needs nothing.
      sup("s4", {
        degreeLevel: "phd",
        thesisDoi: "10.5555/w",
        thesisTitle: "Kept",
        status: "ongoing",
      }),
    ]);
    const out = await enrichCvWithSupervision(doc, MAILTO);
    const items = out.sections[0]!.items;
    expect(items[0]!.meta.thesisTitle).toBe("Other");
    expect(items[0]!.meta.endYear).toBeUndefined();
    expect(items[1]).toBe(doc.sections[0]!.items[1]);
    expect(items[2]!.meta.thesisTitle).toBe("Mine");
    expect(items[2]!.meta.endYear).toBe(2022);
    expect(items[3]).toBe(doc.sections[0]!.items[3]);
    expect(mocks.fetchCrossrefTitleYear).toHaveBeenCalledTimes(2);
  });

  it("is a no-op (same object) with no supervision section, nothing to fill, hidden items, or empty lookups", async () => {
    const none = CanonicalCvSchema.parse({ ...cv([]), sections: [] });
    expect(await enrichCvWithSupervision(none, MAILTO)).toBe(none);
    const full = cv([sup("s1", JANE)]);
    expect(await enrichCvWithSupervision(full, MAILTO)).toBe(full);
    const hidden = cv([sup("s1", { thesisDoi: "10.5555/x" }, { included: false })]);
    expect(await enrichCvWithSupervision(hidden, MAILTO)).toBe(hidden);
    expect(mocks.fetchCrossrefTitleYear).not.toHaveBeenCalled();
    mocks.fetchCrossrefTitleYear.mockResolvedValue(null);
    mocks.fetchDataciteTitleYear.mockResolvedValue(null);
    mocks.resolveInstitution.mockResolvedValue(null);
    const miss = cv([sup("s1", { thesisDoi: "10.5555/x", institution: "Nowhere U" })]);
    expect(await enrichCvWithSupervision(miss, MAILTO)).toBe(miss);
    // A record answered with only a year while the title is already there → the
    // year fills; a lookup that returns nothing usable leaves the item as-is.
    mocks.fetchCrossrefTitleYear.mockResolvedValue({ year: 2021 });
    const yearOnly = cv([sup("s1", { thesisDoi: "10.5555/x", thesisTitle: "T" })]);
    expect(
      (await enrichCvWithSupervision(yearOnly, MAILTO)).sections[0]!.items[0]!.meta.endYear,
    ).toBe(2021);
  });

  it("a ROR match without a website keeps the record's existing url/names untouched", async () => {
    mocks.resolveInstitution.mockResolvedValue({ id: "https://ror.org/1", name: "U" });
    const doc = cv([sup("s1", { institution: "U", institutionUrl: "https://keep.example" })]);
    const m = (await enrichCvWithSupervision(doc, MAILTO)).sections[0]!.items[0]!.meta;
    expect(m.rorId).toBe("https://ror.org/1");
    expect(m.institutionUrl).toBe("https://keep.example");
  });
});
