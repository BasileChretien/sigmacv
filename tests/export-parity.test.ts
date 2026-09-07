import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay, updateOwner } from "@/lib/canonical/curate";
import type { CanonicalCv, CvItem, DisplayChoices } from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderCvDocxBuffer } from "@/lib/render/docx";
import { renderCvHtml } from "@/lib/render/html";
import { buildJsonResume } from "@/lib/render/jsonresume";
import { renderCvLatex } from "@/lib/render/latex";
import { renderCvMarkdown } from "@/lib/render/markdown";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

/**
 * Export parity: the trust marks and identifiers the HTML/PDF carries must
 * survive the file boundary — DOCX, Markdown, LaTeX, JSON Résumé and the
 * parser-safe ATS template — under the SAME display toggles, as PER-ITEM plain
 * text. No format may turn them into a summary figure (no "N of M verified", no
 * percentage beside "verified").
 */

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};
const hasApa = listAvailableStyles().includes("apa");
const SWHID = `swh:1:snp:${"a".repeat(40)}`;
const REPO = "https://github.com/user/sigmatool";
const SWH_URL = `https://archive.softwareheritage.org/${SWHID}`;

const SOFTWARE_ITEM: CvItem = {
  id: "sw-1",
  source: "datacite",
  sourceId: "sw-1",
  displayText: "sigmatool. Zenodo (2025) [Software]. https://doi.org/10.5281/zenodo.100",
  included: true,
  notMine: false,
  order: 0,
  authoredBySelf: true,
  selfNameVariants: [],
  meta: {
    doi: "10.5281/zenodo.100",
    type: "Software",
    repositoryUrl: REPO,
    version: "1.2.0",
    license: "MIT",
    swhid: SWHID,
  },
};

const ON: Partial<DisplayChoices> = {
  showVerifiedBadges: true,
  showResearchAreas: true,
  showArchivalStatus: true,
};

function makeCv(display: Partial<DisplayChoices> = {}): CanonicalCv {
  const base = buildCanonicalCv({
    id: "cv_parity",
    resolved,
    works,
    now: "2026-06-02T00:00:00.000Z",
    employments: [
      {
        putCode: "emp-v",
        organization: "Nagoya University",
        roleTitle: "Assistant Professor",
        startYear: 2022,
        verified: true,
        verifiedBy: "Nagoya University",
      },
      // Self-entered on ORCID — never marked, whatever the toggle says.
      {
        putCode: "emp-s",
        organization: "Self-Entered Inc",
        roleTitle: "Consultant",
        startYear: 2020,
      },
    ],
    distinctions: [
      // Org-asserted but the asserter is unnamed → the generic wording.
      {
        putCode: "dist-v",
        organization: "Royal Society",
        roleTitle: "Fellow",
        startYear: 2020,
        verified: true,
      },
    ],
  });
  const withSoftware: CanonicalCv = {
    ...base,
    owner: {
      ...base.owner,
      researchAreas: [
        { field: "Oncology", count: 2 },
        { field: "Pharmacology", count: 1 },
      ],
    },
    // The build only creates a Software section when a source supplied one;
    // add it (or fill it) with the fixture item.
    sections: base.sections.some((s) => s.type === "software")
      ? base.sections.map((s) => (s.type === "software" ? { ...s, items: [SOFTWARE_ITEM] } : s))
      : [
          ...base.sections,
          {
            id: "software",
            type: "software",
            title: "Software",
            visible: true,
            order: base.sections.length,
            items: [SOFTWARE_ITEM],
          },
        ],
  };
  const withContact = updateOwner(withSoftware, {
    contact: {
      email: "basile@example.org",
      phone: "+81 52 000 0000",
      website: "https://example.org/basile",
      location: "Nagoya, Japan",
    },
    links: [{ label: "", url: "https://github.com/basile" }],
  });
  return updateDisplay(withContact, display);
}

/** The document's paragraphs as plain text (one line per <w:p>), tags stripped. */
async function docxText(cv: CanonicalCv): Promise<string> {
  const zip = await JSZip.loadAsync(await renderCvDocxBuffer(cv));
  const xml = await zip.file("word/document.xml")!.async("string");
  return xml
    .replace(/<\/w:p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

/** HTML as readable text: the stylesheet dropped, tags collapsed to spaces. */
function htmlText(html: string): string {
  return html
    .replace(/<style>[\s\S]*?<\/style>/g, "")
    .replace(/<\/(?:p|li|tr|div|h[1-6]|section|table|header|ul|ol)>/g, "\n")
    .replace(/<[^>]+>/g, " ");
}

const VERIFIED_BY = "(verified by Nagoya University)";
const VERIFIED_GENERIC = "(verified via ORCID)";

describe.skipIf(!hasApa)("export parity — verified marks (display.showVerifiedBadges)", () => {
  it("Markdown carries a per-item plain suffix when on, nothing when off", () => {
    const md = renderCvMarkdown(makeCv(ON));
    expect(md).toContain(`Assistant Professor, Nagoya University (2022–present) ${VERIFIED_BY}`);
    expect(md).toContain(`Fellow, Royal Society (2020) ${VERIFIED_GENERIC}`);
    // The self-entered position carries nothing.
    expect(md).toMatch(/Consultant, Self-Entered Inc \(2020–present\)\n/);

    const off = renderCvMarkdown(makeCv());
    expect(off).not.toContain("verified");
  });

  it("DOCX carries the suffix on the entry's own paragraph when on, nothing when off", async () => {
    const text = await docxText(makeCv(ON));
    expect(text).toContain(`Assistant Professor, Nagoya University (2022–present) ${VERIFIED_BY}`);
    expect(text).toContain(`Fellow, Royal Society (2020) ${VERIFIED_GENERIC}`);
    expect(text).toMatch(/Consultant, Self-Entered Inc \(2020–present\)\n/);

    expect(await docxText(makeCv())).not.toContain("verified");
  });

  it("LaTeX carries the suffix when on, nothing when off", () => {
    const tex = renderCvLatex(makeCv(ON));
    expect(tex).toContain(`Assistant Professor, Nagoya University (2022–present) ${VERIFIED_BY}`);
    expect(tex).toContain(VERIFIED_GENERIC);
    expect(renderCvLatex(makeCv())).not.toContain("verified");
  });

  it("JSON Résumé carries the suffix on work / awards names when on, nothing when off", () => {
    const j = buildJsonResume(makeCv(ON)) as {
      work: Array<{ name: string }>;
      awards: Array<{ name: string }>;
    };
    expect(j.work.map((w) => w.name)).toEqual([
      `Assistant Professor, Nagoya University (2022–present) ${VERIFIED_BY}`,
      "Consultant, Self-Entered Inc (2020–present)",
    ]);
    expect(j.awards[0]!.name).toBe(`Fellow, Royal Society (2020) ${VERIFIED_GENERIC}`);

    const off = JSON.stringify(buildJsonResume(makeCv()));
    expect(off).not.toContain("verified");
  });

  it("ATS (HTML/PDF) prints the suffix as plain text instead of the hidden badge", () => {
    const html = renderCvHtml(makeCv({ ...ON, template: "ats" }));
    // The structured position: plain text on the lead line, NOT inside the
    // `.cv-badges` wrapper the ATS stylesheet blanks.
    expect(html).toMatch(
      /<span class="cv-entry-lead">Assistant Professor <span class="cv-verified-text">\(verified by Nagoya University\)<\/span><\/span>/,
    );
    // The flat award entry gets the generic wording the same way.
    expect(html).toContain(`<span class="cv-verified-text">${VERIFIED_GENERIC}</span>`);
    expect(html).not.toContain('class="cv-badge cv-badge-verified"');
    // Every other template keeps the badge (unchanged).
    const classic = renderCvHtml(makeCv({ ...ON, template: "classic" }));
    expect(classic).toContain('class="cv-badge cv-badge-verified"');
    expect(classic).not.toContain("cv-verified-text");
    // Off → nothing on the ATS template either.
    expect(htmlText(renderCvHtml(makeCv({ template: "ats" })))).not.toContain("verified");
  });

  it("localises the suffix with the CV language", () => {
    const md = renderCvMarkdown(makeCv({ ...ON, locale: "fr-FR" }));
    expect(md).toContain("(vérifié par Nagoya University)");
  });
});

describe.skipIf(!hasApa)("export parity — research areas (display.showResearchAreas)", () => {
  it("Markdown prints a labelled keywords line when on, nothing when off", () => {
    const md = renderCvMarkdown(makeCv(ON));
    expect(md).toContain("**Research areas:** Oncology · Pharmacology");
    expect(renderCvMarkdown(makeCv())).not.toContain("Research areas");
  });

  it("DOCX prints the keywords line when on, nothing when off", async () => {
    expect(await docxText(makeCv(ON))).toContain("Research areas: Oncology · Pharmacology");
    expect(await docxText(makeCv())).not.toContain("Research areas");
  });

  it("LaTeX prints the keywords line when on, nothing when off", () => {
    const tex = renderCvLatex(makeCv(ON));
    expect(tex).toContain("Research areas");
    expect(tex).toContain("Oncology, Pharmacology");
    expect(renderCvLatex(makeCv())).not.toContain("Research areas");
    // The two-column Sidebar layout carries it too.
    expect(renderCvLatex(makeCv({ ...ON, template: "sidebar" }))).toContain(
      "Oncology, Pharmacology",
    );
  });

  it("JSON Résumé maps them to `interests` keywords when on, omits the key when off", () => {
    const j = buildJsonResume(makeCv(ON));
    expect(j.interests).toEqual([
      { name: "Research areas", keywords: ["Oncology", "Pharmacology"] },
    ]);
    expect(buildJsonResume(makeCv())).not.toHaveProperty("interests");
  });

  it("ATS prints a plain labelled line instead of the chip row", () => {
    const html = renderCvHtml(makeCv({ ...ON, template: "ats" }));
    expect(html).toContain(
      '<p class="cv-areas cv-areas-plain"><span class="cv-areas-label">Research areas:</span> Oncology · Pharmacology</p>',
    );
    expect(html).not.toContain('<ul class="cv-areas-list">');
    // Other templates keep the chips.
    expect(renderCvHtml(makeCv({ ...ON, template: "classic" }))).toContain(
      '<ul class="cv-areas-list">',
    );
    expect(htmlText(renderCvHtml(makeCv({ template: "ats" })))).not.toContain("Research areas");
  });
});

describe.skipIf(!hasApa)("export parity — research-software repository link", () => {
  it("Markdown keeps the repository URL (and the archive link when opted in) after the entry", () => {
    const md = renderCvMarkdown(makeCv(ON));
    expect(md).toContain(
      `Source code: ${REPO} · Version 1.2.0 · License: MIT · Archived: ${SWH_URL}`,
    );
    // The repository is a factual identifier (no toggle); the archival link is opt-in.
    const off = renderCvMarkdown(makeCv());
    expect(off).toContain(`Source code: ${REPO} · Version 1.2.0 · License: MIT`);
    expect(off).not.toContain(SWH_URL);
  });

  it("DOCX keeps the repository URL on the entry's paragraph", async () => {
    const text = await docxText(makeCv(ON));
    expect(text).toContain(
      `https://doi.org/10.5281/zenodo.100 · Source code: ${REPO} · Version 1.2.0`,
    );
    expect(text).toContain(`Archived: ${SWH_URL}`);
    expect(await docxText(makeCv())).not.toContain(SWH_URL);
  });

  it("LaTeX wraps the repository URL in \\url{} after the entry", () => {
    const tex = renderCvLatex(makeCv(ON));
    // (The " · " separator is a UTF-8 literal, as in every other text line the .tex carries.)
    expect(tex).toContain(`Source code: \\url{${REPO}} · Version 1.2.0 · License: MIT`);
    expect(tex).toContain(`\\url{${SWH_URL}}`);
  });

  it("ATS keeps the details line, with the repository URL spelled out as text", () => {
    const html = renderCvHtml(makeCv({ ...ON, template: "ats" }));
    // The strip rule no longer blanks the software details.
    expect(html).not.toMatch(/\.cv-software-details[^{]*\{ display: none !important; \}/);
    expect(html).not.toMatch(/,\s*\.cv-software-details\s*\{/);
    // The URL itself is the visible link text (a parser can't read an href).
    expect(html).toMatch(
      new RegExp(`Source code: <a class="cv-software-repo" href="${REPO}"[^>]*>${REPO}</a>`),
    );
    // Other templates keep the short link label.
    expect(renderCvHtml(makeCv({ ...ON, template: "classic" }))).toMatch(
      new RegExp(`<a class="cv-software-repo" href="${REPO}"[^>]*>Source code</a>`),
    );
  });

  it("drops an unsafe repository URL everywhere (same safeHref rule as the HTML)", () => {
    const cv = makeCv(ON);
    const bad: CanonicalCv = {
      ...cv,
      sections: cv.sections.map((s) =>
        s.type === "software"
          ? {
              ...s,
              items: [
                {
                  ...SOFTWARE_ITEM,
                  meta: { ...SOFTWARE_ITEM.meta, repositoryUrl: "javascript:alert(1)" },
                },
              ],
            }
          : s,
      ),
    };
    const md = renderCvMarkdown(bad);
    expect(md).not.toContain("javascript:");
    expect(md).toContain("Version 1.2.0 · License: MIT");
  });
});

describe.skipIf(!hasApa)("export parity — DOCX honours the ATS template", () => {
  it("prints labelled contact lines, one per paragraph", async () => {
    const text = await docxText(makeCv({ template: "ats" }));
    expect(text).toContain("ORCID: 0000-0002-7483-2489\n");
    expect(text).toContain("Location: Nagoya, Japan\n");
    expect(text).toContain("Email: basile@example.org\n");
    expect(text).toContain("Phone: +81 52 000 0000\n");
    expect(text).toContain("Website: https://example.org/basile\n");
    expect(text).toContain("GitHub: https://github.com/basile\n");
    // The plain (non-ATS) document keeps its one dot-joined contact line.
    const plain = await docxText(makeCv());
    expect(plain).toContain("Nagoya, Japan  ·  basile@example.org  ·  +81 52 000 0000");
    expect(plain).not.toContain("Email:");
  });

  it("localises the contact labels", async () => {
    const text = await docxText(makeCv({ template: "ats", locale: "fr-FR" }));
    expect(text).toContain("E-mail: basile@example.org");
    expect(text).toContain("Téléphone: +81 52 000 0000");
  });

  it("never embeds the charts or the authorship table, whatever the summary toggles say", async () => {
    const figures: Partial<DisplayChoices> = {
      showCharts: true,
      showAuthorshipTable: true,
      authorshipRoles: ["first", "last"],
      summaryBlockPosition: "header",
    };
    const zip = async (cv: CanonicalCv) =>
      (await JSZip.loadAsync(await renderCvDocxBuffer(cv)))
        .file("word/document.xml")!
        .async("string");
    // Sanity: the plain document DOES carry both with these toggles.
    const plain = await zip(makeCv(figures));
    expect(plain).toContain("<w:tbl>");
    expect(plain).toContain("<w:drawing>");
    const ats = await zip(makeCv({ ...figures, template: "ats" }));
    expect(ats).not.toContain("<w:tbl>");
    expect(ats).not.toContain("<w:drawing>");
  });

  it("keeps the dates on the same line as the role", async () => {
    const text = await docxText(makeCv({ template: "ats" }));
    expect(text).toContain("Assistant Professor, Nagoya University (2022–present)\n");
  });
});

describe.skipIf(!hasApa)("export parity — invariant: no percentage beside a verified mark", () => {
  // Per-item marks only. A share ("3 of 4 verified", "75% verified") would be a
  // completeness proxy, which no format may emit — even with every figure on.
  const NEAR_PERCENT = /verified[^\n]{0,60}%|%[^\n]{0,60}verified|\d+ of \d+ [^\n]{0,20}verified/i;
  const everything: Partial<DisplayChoices> = {
    ...ON,
    showCharts: true,
    showAuthorshipTable: true,
    authorshipRoles: ["first", "last"],
    summaryBlockPosition: "header",
  };

  it("holds for Markdown, LaTeX, JSON Résumé, DOCX, HTML and ATS", async () => {
    const cv = makeCv(everything);
    const outputs = [
      renderCvMarkdown(cv),
      renderCvLatex(cv),
      JSON.stringify(buildJsonResume(cv), null, 2),
      await docxText(cv),
      htmlText(renderCvHtml(cv)),
      htmlText(renderCvHtml(updateDisplay(cv, { template: "ats" }))),
    ];
    for (const out of outputs) {
      expect(out).toMatch(/verified/i); // the marks are there…
      expect(out).not.toMatch(NEAR_PERCENT); // …and never as a share
    }
  });
});
