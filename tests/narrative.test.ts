import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  addSection,
  renameSection,
  setSectionBody,
  setSectionVisible,
  updateDisplay,
} from "@/lib/canonical/curate";
import {
  PROSE_SECTION_TYPES,
  isProseSectionType,
  migrateCanonicalDocument,
  parseCanonicalCv,
  type CanonicalCv,
} from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderCvHtml } from "@/lib/render/html";
import { renderCvMarkdown } from "@/lib/render/markdown";
import { renderCvDocxBuffer } from "@/lib/render/docx";
import JSZip from "jszip";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A1"],
  displayName: "Basile Chrétien",
};
const hasApa = listAvailableStyles().includes("apa");

function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "prose",
    resolved,
    works: [],
    now: "2026-06-02T00:00:00.000Z",
  });
}

/** Add the `narrative-knowledge` prose section and return [cv, sectionId]. */
function withKnowledge(cv: CanonicalCv, body: string): [CanonicalCv, string] {
  let next = addSection(cv, "narrative-knowledge");
  const id = next.sections.find((s) => s.type === "narrative-knowledge")!.id;
  next = setSectionBody(next, id, body);
  return [next, id];
}

const XSS = '<script>alert(1)</script><img src=x onerror="alert(2)">';

describe("prose section schema + types", () => {
  it("PROSE_SECTION_TYPES lists the four narrative-* contributions + statement", () => {
    expect([...PROSE_SECTION_TYPES].sort()).toEqual(
      [
        "narrative-knowledge",
        "narrative-individuals",
        "narrative-community",
        "narrative-society",
        "statement",
      ].sort(),
    );
    expect(isProseSectionType("narrative-society")).toBe(true);
    expect(isProseSectionType("statement")).toBe(true);
    expect(isProseSectionType("publications")).toBe(false);
  });
});

describe("prose-section curate ops (pure + immutable)", () => {
  it("addSection creates a prose section with an empty body + no items, localized title", () => {
    const cv = updateDisplay(makeCv(), { locale: "fr-FR" });
    const next = addSection(cv, "narrative-knowledge");
    expect(cv.sections.some((s) => s.type === "narrative-knowledge")).toBe(false); // input untouched
    const sec = next.sections.find((s) => s.type === "narrative-knowledge")!;
    expect(sec.body).toBe("");
    expect(sec.items).toEqual([]);
    expect(sec.visible).toBe(true);
    expect(sec.title).toBe("Contributions à la production de connaissances");
  });

  it("addSection deduplicates a single-instance narrative type but allows recurring statements", () => {
    let cv = addSection(makeCv(), "narrative-society");
    const before = cv.sections.length;
    cv = addSection(cv, "narrative-society"); // no-op (already present)
    expect(cv.sections.length).toBe(before);
    // statement can recur — each add creates a new section.
    cv = addSection(cv, "statement");
    cv = addSection(cv, "statement");
    expect(cv.sections.filter((s) => s.type === "statement")).toHaveLength(2);
  });

  it("setSectionBody writes the body (clamped to the cap) and is immutable", () => {
    const [cv, id] = withKnowledge(makeCv(), "first");
    const next = setSectionBody(cv, id, "second");
    expect(cv.sections.find((s) => s.id === id)!.body).toBe("first"); // input untouched
    expect(next.sections.find((s) => s.id === id)!.body).toBe("second");
    // Over-long bodies are clamped to 8000 chars.
    const huge = setSectionBody(cv, id, "x".repeat(9000));
    expect(huge.sections.find((s) => s.id === id)!.body!.length).toBe(8000);
  });
});

describe.skipIf(!hasApa)("prose sections in the full HTML render", () => {
  it("renders heading + paragraphs and turns '- ' lines into <li> across every template", () => {
    for (const template of ["classic", "modern", "sidebar", "ats", "rirekisho"] as const) {
      const [base] = withKnowledge(
        makeCv(),
        "First para.\n\n- item one\n- item two\nfollow up line",
      );
      let cv = renameSection(
        base,
        base.sections.find((s) => s.type === "narrative-knowledge")!.id,
        "Key contributions",
      );
      cv = updateDisplay(cv, { template });
      const html = renderCvHtml(cv);
      expect(html, template).toContain('cv-prose"><h2 id="sec-');
      expect(html, template).toContain("Key contributions");
      expect(html, template).toContain("<p>First para.</p>");
      expect(html, template).toContain(
        '<ul class="cv-prose-list"><li>item one</li><li>item two</li></ul>',
      );
      expect(html, template).toContain("<p>follow up line</p>");
    }
  });

  it("ESCAPES injected HTML in a prose body — XSS is inert text, not live markup", () => {
    const [cv] = withKnowledge(makeCv(), `Intro line ${XSS}\n\n- bullet ${XSS}`);
    const html = renderCvHtml(cv);
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain('onerror="alert(2)"');
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
  });

  it("omits a prose section with a blank body, and a hidden one entirely", () => {
    // Match the rendered section element, not the (always-present) CSS class names.
    const PROSE_SECTION = '<section class="cv-section cv-prose">';
    const blank = addSection(makeCv(), "narrative-society");
    expect(renderCvHtml(blank)).not.toContain(PROSE_SECTION);
    // A hidden prose section with a body does not render.
    const [withBody, id] = withKnowledge(makeCv(), "real prose");
    const hidden = setSectionVisible(withBody, id, false);
    expect(renderCvHtml(hidden)).not.toContain(PROSE_SECTION);
  });
});

describe.skipIf(!hasApa)("prose sections in Markdown export", () => {
  it("emits each prose section as '## title' + body in the section flow", () => {
    const [base] = withKnowledge(makeCv(), "Shaped policy.");
    const cv = renameSection(
      base,
      base.sections.find((s) => s.type === "narrative-knowledge")!.id,
      "Broader impact",
    );
    const md = renderCvMarkdown(cv);
    expect(md).toContain("## Broader impact");
    expect(md).toContain("Shaped policy.");
  });

  it("escapes free-text structure in a prose body (no injected heading / inert markup)", () => {
    const [cv] = withKnowledge(makeCv(), `# Not a heading\n${XSS}`);
    const md = renderCvMarkdown(cv);
    expect(md).toContain("\\# Not a heading");
    expect(md).not.toContain("\n# Not a heading");
    expect(md).toContain("alert(1)");
  });
});

describe("prose sections in DOCX export", () => {
  it("emits a heading paragraph + body paragraphs (XML-escaped by docx)", async () => {
    const [base] = withKnowledge(makeCv(), `Mentored many. ${XSS}\n\nSecond paragraph.`);
    const cv = renameSection(
      base,
      base.sections.find((s) => s.type === "narrative-knowledge")!.id,
      "Developing people",
    );
    const buf = await renderCvDocxBuffer(cv);
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toContain("Developing people");
    expect(xml).toContain("Mentored many.");
    expect(xml).toContain("Second paragraph.");
    expect(xml).not.toContain("<script>alert(1)</script>");
    expect(xml).toContain("&lt;script&gt;");
  });
});

describe("v1 → v2 migration: narrative[] → prose sections", () => {
  /** A minimal v1 document with a populated narrative array. */
  function v1Doc(narrative: unknown, summary = "") {
    return {
      schemaVersion: 1,
      id: "old",
      owner: {
        orcid: "0000-0002-7483-2489",
        openAlexAuthorIds: ["A1"],
        displayName: "X",
        summary,
        links: [],
        countsByYear: [],
      },
      display: { locale: "en-US" },
      sections: [
        {
          id: "publications",
          type: "publications",
          title: "Publications",
          visible: true,
          order: 0,
          items: [],
        },
      ],
      presets: [],
      narrative,
      provenance: { generatedAt: "t0", sources: ["openalex"] },
    };
  }

  it("maps the four contribution modules to narrative-* prose sections", () => {
    const doc = v1Doc([
      { key: "knowledge", heading: "K", body: "kbody", included: true },
      { key: "individuals", heading: "I", body: "ibody", included: false },
      { key: "community", heading: "C", body: "cbody", included: true },
      { key: "society", heading: "S", body: "sbody", included: true },
    ]);
    const cv = parseCanonicalCv(doc);
    expect(cv.schemaVersion).toBe(2);
    expect((cv as { narrative?: unknown }).narrative).toBeUndefined();
    const byType = new Map(cv.sections.map((s) => [s.type, s]));
    expect(byType.get("narrative-knowledge")).toMatchObject({
      title: "K",
      body: "kbody",
      visible: true,
    });
    // included:false → visible:false.
    expect(byType.get("narrative-individuals")!.visible).toBe(false);
    expect(byType.get("narrative-community")!.body).toBe("cbody");
    expect(byType.get("narrative-society")!.body).toBe("sbody");
  });

  it("folds personal-statement into owner.summary when summary is empty", () => {
    const doc = v1Doc(
      [{ key: "personal-statement", heading: "PS", body: "I am a researcher.", included: true }],
      "",
    );
    const cv = parseCanonicalCv(doc);
    expect(cv.owner.summary).toBe("I am a researcher.");
    expect(cv.sections.some((s) => s.type === "statement")).toBe(false);
  });

  it("keeps personal-statement as a statement section when summary is already set", () => {
    const doc = v1Doc(
      [{ key: "personal-statement", heading: "PS", body: "extra prose", included: true }],
      "Existing summary.",
    );
    const cv = parseCanonicalCv(doc);
    expect(cv.owner.summary).toBe("Existing summary."); // unchanged
    const statement = cv.sections.find((s) => s.type === "statement")!;
    expect(statement.body).toBe("extra prose");
    expect(statement.title).toBe("PS");
  });

  it("maps 'additional' (and unknown keys) to a statement section", () => {
    const doc = v1Doc([
      { key: "additional", heading: "More", body: "career break note", included: true },
      { key: "weird-unknown", heading: "Odd", body: "odd body", included: true },
    ]);
    const cv = parseCanonicalCv(doc);
    const statements = cv.sections.filter((s) => s.type === "statement");
    expect(statements).toHaveLength(2);
    expect(statements.map((s) => s.body).sort()).toEqual(["career break note", "odd body"].sort());
  });

  it("appends converted sections AFTER existing ones", () => {
    const doc = v1Doc([{ key: "knowledge", heading: "K", body: "k", included: true }]);
    const cv = parseCanonicalCv(doc);
    const pubs = cv.sections.find((s) => s.type === "publications")!;
    const knowledge = cv.sections.find((s) => s.type === "narrative-knowledge")!;
    expect(knowledge.order).toBeGreaterThan(pubs.order);
  });

  it("is robust to a malformed narrative (non-array / non-object modules)", () => {
    // Non-array narrative → just dropped, no throw.
    expect(() => parseCanonicalCv(v1Doc("not-an-array" as unknown))).not.toThrow();
    // Array with junk entries → skipped, no throw.
    const cv = parseCanonicalCv(v1Doc([null, 42, { key: "knowledge", body: "ok" }] as unknown));
    expect(cv.sections.find((s) => s.type === "narrative-knowledge")!.body).toBe("ok");
  });

  it("migrateCanonicalDocument bumps schemaVersion and removes the narrative field", () => {
    const out = migrateCanonicalDocument(v1Doc([])) as Record<string, unknown>;
    expect(out.schemaVersion).toBe(2);
    expect(out.narrative).toBeUndefined();
  });
});
