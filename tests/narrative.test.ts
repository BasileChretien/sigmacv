import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  removeNarrativeModule,
  reorderNarrative,
  setNarrativeModuleIncluded,
  updateDisplay,
  upsertNarrativeModule,
} from "@/lib/canonical/curate";
import {
  CanonicalCvSchema,
  type CanonicalCv,
} from "@/lib/canonical/schema";
import { defaultNarrativeModules } from "@/lib/i18n/narrative";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderCvHtml } from "@/lib/render/html";
import { narrativeBlock } from "@/lib/render/templates/shared";
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
    id: "nar",
    resolved,
    works: [],
    now: "2026-06-02T00:00:00.000Z",
  });
}

const XSS = '<script>alert(1)</script><img src=x onerror="alert(2)">';

describe("narrative schema", () => {
  it("defaults to [] for a document stored before narratives existed (additive)", () => {
    const cv = makeCv();
    // The build seeds an empty narrative; a doc literally lacking the key still parses.
    const { narrative: _n, ...withoutNarrative } = cv as CanonicalCv & {
      narrative: unknown;
    };
    const parsed = CanonicalCvSchema.parse(withoutNarrative);
    expect(parsed.narrative).toEqual([]);
    expect(cv.narrative).toEqual([]);
  });

  it("a module included defaults to true", () => {
    const parsed = CanonicalCvSchema.parse({
      ...makeCv(),
      narrative: [{ key: "knowledge", heading: "K", body: "b" }],
    });
    expect(parsed.narrative[0]!.included).toBe(true);
  });
});

describe("narrative curate ops (pure + immutable)", () => {
  it("upsert creates a module from the localized default when absent, then patches", () => {
    const cv = updateDisplay(makeCv(), { locale: "fr-FR" });
    const next = upsertNarrativeModule(cv, "personal-statement", {
      body: "Je suis chercheur.",
    });
    expect(cv.narrative).toEqual([]); // input untouched
    expect(next.narrative).toHaveLength(1);
    expect(next.narrative[0]).toMatchObject({
      key: "personal-statement",
      heading: "Présentation personnelle", // seeded from the FR default
      body: "Je suis chercheur.",
      included: true,
    });
  });

  it("upsert patches an existing module without recreating it", () => {
    let cv = upsertNarrativeModule(makeCv(), "knowledge", { body: "first" });
    cv = upsertNarrativeModule(cv, "knowledge", { heading: "My knowledge" });
    expect(cv.narrative).toHaveLength(1);
    expect(cv.narrative[0]).toMatchObject({
      key: "knowledge",
      heading: "My knowledge",
      body: "first", // preserved
    });
  });

  it("setNarrativeModuleIncluded toggles (creating if absent)", () => {
    let cv = upsertNarrativeModule(makeCv(), "society", { body: "impact" });
    cv = setNarrativeModuleIncluded(cv, "society", false);
    expect(cv.narrative[0]!.included).toBe(false);
    // Creating-via-toggle: absent module is seeded then set.
    const cv2 = setNarrativeModuleIncluded(makeCv(), "community", false);
    expect(cv2.narrative[0]).toMatchObject({ key: "community", included: false });
  });

  it("removeNarrativeModule drops a module (no-op if absent)", () => {
    const cv = upsertNarrativeModule(makeCv(), "additional", { body: "x" });
    expect(removeNarrativeModule(cv, "additional").narrative).toHaveLength(0);
    // Unknown → identity preserved.
    expect(removeNarrativeModule(cv, "society")).toBe(cv);
  });

  it("reorderNarrative moves a module and clamps / no-ops out-of-range", () => {
    let cv = makeCv();
    cv = upsertNarrativeModule(cv, "personal-statement", { body: "a" });
    cv = upsertNarrativeModule(cv, "knowledge", { body: "b" });
    cv = upsertNarrativeModule(cv, "society", { body: "c" });
    const moved = reorderNarrative(cv, 2, 0);
    expect(moved.narrative.map((m) => m.key)).toEqual([
      "society",
      "personal-statement",
      "knowledge",
    ]);
    // Clamp a too-large target.
    const clamped = reorderNarrative(cv, 0, 99);
    expect(clamped.narrative.map((m) => m.key)).toEqual([
      "knowledge",
      "society",
      "personal-statement",
    ]);
    // No-op: same position and out-of-range source preserve identity.
    expect(reorderNarrative(cv, 1, 1)).toBe(cv);
    expect(reorderNarrative(cv, -1, 0)).toBe(cv);
    expect(reorderNarrative(cv, 5, 0)).toBe(cv);
  });
});

describe("narrativeBlock (HTML, safe transform)", () => {
  it("returns '' when there is no included, non-empty module", () => {
    expect(narrativeBlock(makeCv())).toBe("");
    // An included module with a blank body does NOT render.
    const blank = upsertNarrativeModule(makeCv(), "knowledge", { body: "   " });
    expect(narrativeBlock(blank)).toBe("");
    // An excluded module with a body does NOT render.
    let excluded = upsertNarrativeModule(makeCv(), "knowledge", { body: "real" });
    excluded = setNarrativeModuleIncluded(excluded, "knowledge", false);
    expect(narrativeBlock(excluded)).toBe("");
  });

  it("renders heading + paragraphs and turns '- ' lines into <li>", () => {
    const cv = upsertNarrativeModule(makeCv(), "knowledge", {
      heading: "Key contributions",
      body: "First para.\n\n- item one\n- item two\nfollow up line",
    });
    const html = narrativeBlock(cv);
    expect(html).toContain('<section class="cv-narrative">');
    expect(html).toContain("<h3>Key contributions</h3>");
    expect(html).toContain("<p>First para.</p>");
    expect(html).toContain('<ul class="cv-narrative-list"><li>item one</li><li>item two</li></ul>');
    // A non-list line after a list flushes into its own paragraph.
    expect(html).toContain("<p>follow up line</p>");
  });

  it("ESCAPES injected HTML in the body — XSS is inert text, not live markup", () => {
    const cv = upsertNarrativeModule(makeCv(), "personal-statement", {
      heading: XSS,
      body: `Intro line ${XSS}\n\n- bullet ${XSS}`,
    });
    const html = narrativeBlock(cv);
    // No live <script>/<img> tag survives — only escaped entities.
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("<img");
    expect(html).not.toContain('onerror="alert(2)"');
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("&lt;img src=x onerror=&quot;alert(2)&quot;&gt;");
  });
});

describe.skipIf(!hasApa)("narrative in the full HTML render", () => {
  it("appears above the sections in every template and escapes the body", () => {
    for (const template of ["classic", "modern", "sidebar", "ats", "rirekisho"] as const) {
      const cv = updateDisplay(
        upsertNarrativeModule(makeCv(), "knowledge", {
          heading: "My contributions",
          body: `Did great things. ${XSS}`,
        }),
        { template },
      );
      const html = renderCvHtml(cv);
      expect(html, template).toContain('class="cv-narrative"');
      expect(html, template).toContain("My contributions");
      expect(html, template).toContain("Did great things.");
      expect(html, template).not.toContain("<script>alert(1)</script>");
      expect(html, template).not.toContain("onerror=\"alert(2)\"");
    }
  });

  it("is absent from the rendered document when there is no narrative", () => {
    const html = renderCvHtml(makeCv());
    expect(html).not.toContain('class="cv-narrative"');
  });
});

describe.skipIf(!hasApa)("narrative in Markdown export", () => {
  it("prepends each included module as '## heading' + body (emitted as-is)", () => {
    const cv = upsertNarrativeModule(makeCv(), "society", {
      heading: "Broader impact",
      body: "Shaped policy.",
    });
    const md = renderCvMarkdown(cv);
    expect(md).toContain("## Broader impact");
    expect(md).toContain("Shaped policy.");
  });

  it("omits the narrative entirely when there is none", () => {
    const md = renderCvMarkdown(makeCv());
    expect(md).not.toContain("## ");
  });
});

describe("narrative in DOCX export", () => {
  it("prepends a heading paragraph + body paragraphs (XML-escaped by docx)", async () => {
    const cv = upsertNarrativeModule(makeCv(), "individuals", {
      heading: "Developing people",
      body: `Mentored many. ${XSS}\n\nSecond paragraph.`,
    });
    const buf = await renderCvDocxBuffer(cv);
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file("word/document.xml")!.async("string");
    expect(xml).toContain("Developing people");
    expect(xml).toContain("Mentored many.");
    expect(xml).toContain("Second paragraph.");
    // The injected tag is XML-escaped in the document, never a live element.
    expect(xml).not.toContain("<script>alert(1)</script>");
    expect(xml).toContain("&lt;script&gt;");
  });
});

describe("defaultNarrativeModules seed", () => {
  it("can be assigned onto a CV and renders all six headings", () => {
    const cv: CanonicalCv = {
      ...makeCv(),
      narrative: defaultNarrativeModules("en-US").map((m) =>
        m.key === "personal-statement" ? { ...m, body: "Hello." } : m,
      ),
    };
    // Only the filled module renders (others have empty bodies).
    const html = narrativeBlock(cv);
    expect(html).toContain("Personal statement");
    expect(html).toContain("Hello.");
    expect(html).not.toContain("Additional information");
  });
});
