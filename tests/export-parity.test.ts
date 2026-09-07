import JSZip from "jszip";
import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemInstitution, updateDisplay, updateOwner } from "@/lib/canonical/curate";
import type { CanonicalCv, CvItem, DisplayChoices } from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderCvBiosketch } from "@/lib/render/biosketch";
import { renderCvDocxBuffer } from "@/lib/render/docx";
import { renderGrantCv } from "@/lib/render/grantCv";
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

const XML_ENTITIES: Readonly<Record<string, string>> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

/** Decode the five predefined XML entities in ONE pass via a lookup table (no
 *  chained replaces, so a decoded "&amp;lt;" can never be re-decoded). */
function decodeXmlText(s: string): string {
  return s.replace(/&(amp|lt|gt|quot|apos);/g, (_m, name: string) => XML_ENTITIES[name]!);
}

/** The document's paragraphs as plain text (one line per <w:p>): each paragraph's
 *  `<w:t>` text nodes, extracted and concatenated — a text-node read, not a tag strip. */
async function docxText(cv: CanonicalCv): Promise<string> {
  const zip = await JSZip.loadAsync(await renderCvDocxBuffer(cv));
  const xml = await zip.file("word/document.xml")!.async("string");
  return xml
    .split("</w:p>")
    .map((paragraph) =>
      Array.from(paragraph.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g), (m) =>
        decodeXmlText(m[1]!),
      ).join(""),
    )
    .join("\n");
}

/** `cv` with one item replaced by `patch(item)` (the item found by id). */
function patchItem(cv: CanonicalCv, itemId: string, patch: (it: CvItem) => CvItem): CanonicalCv {
  return {
    ...cv,
    sections: cv.sections.map((s) => ({
      ...s,
      items: s.items.map((it) => (it.id === itemId ? patch(it) : it)),
    })),
  };
}

const VERIFIED_POSITION_ID = "position:orcid:emp-v";

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
  // Every assertion below is anchored to the END of the entry's line, so a
  // doubled suffix ("… (verified by X) (verified by X)") fails, not just a
  // missing one.
  it("Markdown carries a per-item plain suffix when on, nothing when off", () => {
    const md = renderCvMarkdown(makeCv(ON));
    expect(md).toMatch(
      /^.*Assistant Professor, Nagoya University \(2022–present\) \(verified by Nagoya University\)$/m,
    );
    expect(md).toMatch(/^.*Fellow, Royal Society \(2020\) \(verified via ORCID\)$/m);
    // The self-entered position carries nothing.
    expect(md).toMatch(/Consultant, Self-Entered Inc \(2020–present\)\n/);
    expect(md.match(/verified/g)).toHaveLength(2);

    const off = renderCvMarkdown(makeCv());
    expect(off).not.toContain("verified");
  });

  it("DOCX carries the suffix on the entry's own paragraph when on, nothing when off", async () => {
    const text = await docxText(makeCv(ON));
    expect(text).toContain(
      `Assistant Professor, Nagoya University (2022–present) ${VERIFIED_BY}\n`,
    );
    expect(text).toContain(`Fellow, Royal Society (2020) ${VERIFIED_GENERIC}\n`);
    expect(text).toMatch(/Consultant, Self-Entered Inc \(2020–present\)\n/);
    expect(text.match(/verified/g)).toHaveLength(2);

    expect(await docxText(makeCv())).not.toContain("verified");
  });

  it("LaTeX carries the suffix when on, nothing when off", () => {
    const tex = renderCvLatex(makeCv(ON));
    expect(tex).toMatch(
      /^\s*\\item Assistant Professor, Nagoya University \(2022–present\) \(verified by Nagoya University\)$/m,
    );
    expect(tex).toMatch(/^\s*\\item Fellow, Royal Society \(2020\) \(verified via ORCID\)$/m);
    expect(tex.match(/verified/g)).toHaveLength(2);
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
    // The flat award entry gets the generic wording the same way — at the end of
    // its list item.
    expect(html).toMatch(
      /Fellow, Royal Society \(2020\) <span class="cv-verified-text">\(verified via ORCID\)<\/span><\/div><\/li>/,
    );
    // One clause per verified entry, never two.
    expect(html.match(/class="cv-verified-text"/g)).toHaveLength(2);
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
    // Korean: the agent marker "에서" ("verified by X"), not a bare "X 인증".
    const ko = renderCvMarkdown(makeCv({ ...ON, locale: "ko-KR" }));
    expect(ko).toContain("(Nagoya University에서 인증)");
    expect(ko).not.toContain("Nagoya University 인증");
  });

  describe("an owner-rewritten line never re-reveals the asserter", () => {
    // The owner edited the line / renamed the institution and wrote the employer
    // out of it: naming the asserter would put that employer back. The mark falls
    // back to the generic wording on every surface — text formats, the ATS
    // plain clause, and the badge's title on the other templates.
    const rewritten = (patch: Partial<CvItem> & { meta?: Partial<CvItem["meta"]> }) =>
      patchItem(makeCv(ON), VERIFIED_POSITION_ID, (it) => ({
        ...it,
        ...patch,
        meta: { ...it.meta, ...(patch.meta ?? {}) },
      }));

    it("free-text override without the org → generic (Markdown, DOCX, LaTeX, JSON Résumé)", async () => {
      const cv = rewritten({ displayTextOverride: "Professor, NU Med (2022–present)" });
      const md = renderCvMarkdown(cv);
      expect(md).toMatch(/^.*Professor, NU Med \(2022–present\) \(verified via ORCID\)$/m);
      expect(md).not.toContain("Nagoya University");
      expect(await docxText(cv)).toContain(
        `Professor, NU Med (2022–present) ${VERIFIED_GENERIC}\n`,
      );
      expect(renderCvLatex(cv)).not.toContain("Nagoya University");
      const j = buildJsonResume(cv) as { work: Array<{ name: string }> };
      expect(j.work[0]!.name).toBe(`Professor, NU Med (2022–present) ${VERIFIED_GENERIC}`);
      expect(JSON.stringify(j)).not.toContain("Nagoya University");
    });

    it("institution rename without the org → generic (the re-derived line is what prints)", () => {
      // Through the editor's own operation, which re-derives the line in place.
      const base = makeCv(ON);
      const positions = base.sections.find((s) => s.type === "positions")!.id;
      const cv = setItemInstitution(base, positions, VERIFIED_POSITION_ID, "NU Med");
      expect(cv.sections.find((s) => s.id === positions)!.items[0]!.meta.institutionOverride).toBe(
        "NU Med",
      );
      const md = renderCvMarkdown(cv);
      expect(md).toMatch(
        /^.*Assistant Professor, NU Med \(2022–present\) \(verified via ORCID\)$/m,
      );
      expect(md).not.toContain("Nagoya University");
      // ATS: the structured lead line carries the generic clause.
      const ats = renderCvHtml(updateDisplay(cv, { template: "ats" }));
      expect(ats).toMatch(
        /<span class="cv-entry-lead">Assistant Professor <span class="cv-verified-text">\(verified via ORCID\)<\/span><\/span>/,
      );
      expect(ats).not.toContain("Nagoya University");
      // Other templates: the badge's accessible title is generic too.
      const classic = renderCvHtml(updateDisplay(cv, { template: "classic" }));
      expect(classic).toMatch(/cv-badge-verified" title="Confirmed by the institution via ORCID/);
      expect(classic).not.toContain("Nagoya University");
    });

    it("a rewrite that KEEPS the org name still names it (nothing was written out)", () => {
      const cv = rewritten({ displayTextOverride: "Prof., nagoya university (2022–)" });
      // Case-insensitive: the owner's spelling of the same name is still the name.
      expect(renderCvMarkdown(cv)).toMatch(
        /^.*Prof\., nagoya university \(2022–\) \(verified by Nagoya University\)$/m,
      );
      const ats = renderCvHtml(updateDisplay(cv, { template: "ats" }));
      expect(ats).toMatch(
        /Prof\., nagoya university \(2022–\) <span class="cv-verified-text">\(verified by Nagoya University\)<\/span><\/li>/,
      );
    });
  });

  it("ATS: the ROR link wraps the institution in the LINE, never inside the verified clause", () => {
    // A free-text override (the flat, `withRorLink` path) that keeps the org name,
    // on an entry that carries a ROR id: the link must land on the line's own
    // mention of the name — the clause is appended after the link is placed.
    const cv = patchItem(makeCv({ ...ON, template: "ats" }), VERIFIED_POSITION_ID, (it) => ({
      ...it,
      displayTextOverride: "Prof., Nagoya University (2022–present)",
      meta: { ...it.meta, rorId: "https://ror.org/04chrp450" },
    }));
    const html = renderCvHtml(cv);
    expect(html).toMatch(
      /Prof\., <a class="cv-ror-link" href="https:\/\/ror\.org\/04chrp450"[^>]*>Nagoya University<\/a> \(2022–present\) <span class="cv-verified-text">\(verified by Nagoya University\)<\/span><\/li>/,
    );
    expect(html).not.toMatch(/cv-verified-text">[^<]*<a /);
  });
});

describe.skipIf(!hasApa)(
  "export parity — biosketch and grant CV lists carry the verified mark",
  () => {
    // Their position / education / award lists are built from the raw display text
    // (not `prepareSections`), so they append the same suffix themselves.
    it("NIH biosketch: on → the suffix once per verified entry; off → nothing", () => {
      const md = renderCvBiosketch(makeCv(ON));
      expect(md).toMatch(
        /^- Assistant Professor, Nagoya University \(2022–present\) \(verified by Nagoya University\)$/m,
      );
      expect(md).toMatch(/^- Fellow, Royal Society \(2020\) \(verified via ORCID\)$/m);
      expect(md).toMatch(/^- Consultant, Self-Entered Inc \(2020–present\)$/m);
      expect(md.match(/verified/g)).toHaveLength(2);
      expect(renderCvBiosketch(makeCv())).not.toContain("verified");
    });

    it("grant CV (ERC): on → the suffix once per verified entry; off → nothing", () => {
      const md = renderGrantCv(makeCv(ON), "erc");
      expect(md).toMatch(
        /^- Assistant Professor, Nagoya University \(2022–present\) \(verified by Nagoya University\)$/m,
      );
      expect(md).toMatch(/^- Fellow, Royal Society \(2020\) \(verified via ORCID\)$/m);
      expect(md.match(/verified/g)).toHaveLength(2);
      expect(renderGrantCv(makeCv(), "erc")).not.toContain("verified");
    });
  },
);

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
    // The label is a true inline run of that line: the ATS stylesheet undoes the
    // shared chip-row label (block / uppercase / small / muted).
    const rule = html.match(/\.cv-areas-plain \.cv-areas-label \{([^}]*)\}/)?.[1] ?? "";
    for (const decl of [
      "display: inline",
      "margin: 0",
      "font-size: 1em",
      "text-transform: none",
      "color: #000",
      "font-weight: bold",
    ]) {
      expect(rule).toContain(decl);
    }
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

describe.skipIf(!hasApa)(
  "export parity — invariant: verified appears ONLY as per-item marks",
  () => {
    // Per-item marks only. A share ("3 of 4 verified", "75% verified") would be a
    // completeness proxy, which no format may emit — even with every figure on.
    // Discriminating form: EVERY occurrence of "verified" must sit inside one
    // "(verified by …)" / "(verified via ORCID)" parenthetical, and the number of
    // parentheticals must equal the number of verified visible entries — so a
    // summary line, a count, or a stray mention anywhere fails.
    const VERIFIED_VISIBLE = 2; // emp-v (named) + dist-v (unnamed)
    const PARENTHETICAL = /\((?:verified by [^()\n]+|verified via ORCID)\)/g;
    const everything: Partial<DisplayChoices> = {
      ...ON,
      showCharts: true,
      showAuthorshipTable: true,
      authorshipRoles: ["first", "last"],
      summaryBlockPosition: "header",
    };

    it("holds for Markdown, LaTeX, JSON Résumé, DOCX, ATS, biosketch and grant CV", async () => {
      const cv = makeCv(everything);
      const outputs: Record<string, string> = {
        markdown: renderCvMarkdown(cv),
        latex: renderCvLatex(cv),
        jsonresume: JSON.stringify(buildJsonResume(cv), null, 2),
        docx: await docxText(cv),
        ats: htmlText(renderCvHtml(updateDisplay(cv, { template: "ats" }))),
        biosketch: renderCvBiosketch(cv),
        grant: renderGrantCv(cv, "erc"),
      };
      for (const [format, out] of Object.entries(outputs)) {
        const parentheticals = out.match(PARENTHETICAL) ?? [];
        expect({ format, n: parentheticals.length }).toEqual({ format, n: VERIFIED_VISIBLE });
        expect({ format, n: (out.match(/verified/gi) ?? []).length }).toEqual({
          format,
          n: VERIFIED_VISIBLE,
        });
      }
    });

    it("holds for the badge templates: one badge per verified entry and no other mention", () => {
      const html = renderCvHtml(makeCv(everything));
      expect(html.match(/class="cv-badge cv-badge-verified"/g)).toHaveLength(VERIFIED_VISIBLE);
      // Strip the badges (label + title), then the rendered text must not say
      // "verified" anywhere else — no summary line, no count.
      const withoutBadges = html.replace(
        /<span class="cv-badge cv-badge-verified"[^>]*>[^<]*<\/span>/g,
        "",
      );
      expect(htmlText(withoutBadges)).not.toMatch(/verified/i);
    });
  },
);
