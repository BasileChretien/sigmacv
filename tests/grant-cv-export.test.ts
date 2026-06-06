import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  addManualEntry,
  updateDisplay,
  updateOwner,
  upsertNarrativeModule,
} from "@/lib/canonical/curate";
import { GRANT_PRESETS, type GrantPresetId } from "@/lib/canonical/grantPresets";
import type { CanonicalCv, CvSectionType } from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import {
  renderGrantCv,
  ercRenderer,
  mscaRenderer,
  nsfRenderer,
  jspsRenderer,
} from "@/lib/render/grantCv";
import type { Renderer } from "@/lib/render/types";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const baseWorks = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481", "A5136414971"],
  displayName: "Basile Chrétien",
};
const hasApa = listAvailableStyles().includes("apa");

function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "grant",
    resolved,
    works: baseWorks,
    now: "2026-06-02T00:00:00.000Z",
  });
}

/** A CV carrying at least one item in EVERY section type any funder preset
 *  makes visible, plus a filled narrative module + the header fields. */
function fullCv(): CanonicalCv {
  let cv = makeCv();
  cv = updateOwner(cv, {
    headline: "Senior Pharmacologist",
    honorific: "Dr",
  });
  const seeds: ReadonlyArray<[CvSectionType, string]> = [
    ["positions", "Lecturer, Université de Caen (2020–)"],
    ["education", "PharmD, Université de Caen (2015)"],
    ["awards", "Young Investigator Award (2021)"],
    ["grants", "ANR grant 2022 (PI), €250k"],
    ["supervision", "3 PhD students supervised"],
    ["teaching", "Pharmacology 101 (2018–)"],
    ["talks", "Keynote, ISoP 2023"],
    ["editorial", "Editor, Drug Safety (2021–)"],
    ["peer-review", "Reviewer, BMJ (2019–)"],
    ["service", "Member, national pharmacovigilance committee"],
  ];
  seeds.forEach(([type, text], i) => {
    cv = addManualEntry(cv, type, text, `${type}:${i}`);
  });
  cv = upsertNarrativeModule(cv, "knowledge", {
    body: "I uncovered three previously unknown drug-safety signals.",
  });
  return cv;
}

/** A bare CV: no header, no extra sections, no narrative — only the fixture
 *  publications. Exercises every "omit empty section" branch. */
function bareCv(): CanonicalCv {
  const cv = makeCv();
  return {
    ...cv,
    owner: {
      ...cv.owner,
      displayName: "",
      headline: undefined,
      summary: undefined,
      honorific: undefined,
      contact: undefined,
      links: [],
    },
    narrative: [],
  };
}

const RENDERERS: Record<GrantPresetId, Renderer> = {
  erc: ercRenderer,
  msca: mscaRenderer,
  nsf: nsfRenderer,
  jsps: jspsRenderer,
};

/** The funder's own track-record / products heading, used in publication-cap
 *  assertions. */
const PUB_HEADING: Record<GrantPresetId, string> = {
  erc: "## Track Record",
  msca: "## Selected Publications",
  nsf: "## Products",
  jsps: "## 研究業績 / Publications",
};

/** Headings that must appear for each funder (spot-checks of the heading map). */
const EXPECTED_HEADINGS: Record<GrantPresetId, readonly string[]> = {
  erc: [
    "## Education",
    "## Positions",
    "## Fellowships and Awards",
    "## Funding",
    "## Supervision",
    "## Teaching",
    "## Invited Presentations",
    "## Editorial Roles",
    "## Peer Review",
    "## Institutional Responsibilities and Commissions of Trust",
    "## Track Record",
  ],
  msca: [
    "## Education",
    "## Positions Held",
    "## Selected Publications",
    "## Commissions of Trust",
  ],
  nsf: [
    "## Professional Preparation",
    "## Appointments",
    "## Products",
    "## Synergistic Activities",
    "## Funding",
  ],
  jsps: [
    "## 研究業績 / Publications",
    "## 経歴 / Career",
    "## 学歴 / Education",
    "## 研究費 / Research Funding",
    "## 受賞 / Awards",
  ],
};

const FOOTER: Record<GrantPresetId, string> = {
  erc: "EU Funding & Tenders portal",
  msca: "EU Funding & Tenders portal",
  nsf: "SciENcv on Research.gov",
  jsps: "e-Rad",
};

describe.skipIf(!hasApa)("funder grant-CV export", () => {
  it.each(Object.keys(GRANT_PRESETS) as GrantPresetId[])(
    "%s: renderer metadata (format / mimeType / filename)",
    async (id) => {
      const r = await RENDERERS[id].render({ cv: fullCv() });
      expect(r.format).toBe(id);
      expect(r.mimeType).toBe("text/markdown; charset=utf-8");
      expect(r.filename).toBe(`basile-chretien-${id}-cv.md`);
      expect(r.text!.endsWith("\n")).toBe(true);
    },
  );

  it.each(Object.keys(GRANT_PRESETS) as GrantPresetId[])(
    "%s: emits every funder heading + a numbered track-record list",
    (id) => {
      const md = renderGrantCv(fullCv(), id);
      for (const h of EXPECTED_HEADINGS[id]) {
        expect(md).toContain(h);
      }
      // The publications block is a numbered citeproc list.
      expect(md).toMatch(
        new RegExp(`${escapeRegExp(PUB_HEADING[id])}\\n\\n1\\. `),
      );
    },
  );

  it.each(Object.keys(GRANT_PRESETS) as GrantPresetId[])(
    "%s: respects the preset publicationsLimit",
    (id) => {
      const md = renderGrantCv(fullCv(), id);
      const limit = GRANT_PRESETS[id].display.publicationsLimit ?? 0;
      expect(limit).toBeGreaterThan(0);
      // Count the numbered entries directly under the track-record heading.
      const block = sectionBody(md, PUB_HEADING[id]);
      const numbered = block.match(/^\d+\. /gm) ?? [];
      expect(numbered.length).toBeLessThanOrEqual(limit);
      expect(numbered.length).toBeGreaterThan(0);
    },
  );

  it.each(Object.keys(GRANT_PRESETS) as GrantPresetId[])(
    "%s: renders the header (honorific + name + headline)",
    (id) => {
      const md = renderGrantCv(fullCv(), id);
      expect(md).toContain("# Dr Basile Chrétien");
      expect(md).toContain("*Senior Pharmacologist*");
    },
  );

  it.each(Object.keys(GRANT_PRESETS) as GrantPresetId[])(
    "%s: includes the narrative module body + the funder-portal footer",
    (id) => {
      const md = renderGrantCv(fullCv(), id);
      // Every catalog preset includes the narrative, and `knowledge`'s default
      // localized heading appears with its body.
      expect(md).toContain(
        "I uncovered three previously unknown drug-safety signals.",
      );
      expect(md).toContain("Contributions to the generation of knowledge");
      expect(md).toContain("This is a SigmaCV draft");
      expect(md).toContain(FOOTER[id]);
    },
  );

  it.each(Object.keys(GRANT_PRESETS) as GrantPresetId[])(
    "%s: a bare CV renders without throwing (name fallback, placeholder list)",
    (id) => {
      const md = renderGrantCv(bareCv(), id);
      expect(md).toContain("# Curriculum Vitae"); // empty-name fallback
      // Bare CV still has fixture publications → a populated track record.
      expect(md).toMatch(
        new RegExp(`${escapeRegExp(PUB_HEADING[id])}\\n\\n1\\. `),
      );
      // No header headline, no narrative heading.
      expect(md).not.toContain("*Senior Pharmacologist*");
      expect(md.endsWith("\n")).toBe(true);
    },
  );

  it("bolds the account holder's name in the track record", () => {
    expect(renderGrantCv(makeCv(), "erc")).toContain("**");
  });

  it("does not bold when highlightSelf is off", () => {
    const cv = updateDisplay(makeCv(), { highlightSelf: false });
    const md = renderGrantCv(cv, "erc");
    expect(md).toContain("## Track Record");
    expect(md).not.toContain("**");
  });

  it("renders the name without an honorific when none is set", () => {
    const cv = updateOwner(makeCv(), { honorific: undefined });
    expect(renderGrantCv(cv, "nsf")).toMatch(/^# Basile Chrétien/);
  });

  it("shows an empty-publications placeholder when there are no works", () => {
    const cv: CanonicalCv = { ...bareCv(), sections: [] };
    const md = renderGrantCv(cv, "msca");
    expect(md).toMatch(/## Selected Publications\n\n_\(None listed\.\)_/);
  });

  it("merges NSF service + talks under a single Synergistic Activities heading", () => {
    const md = renderGrantCv(fullCv(), "nsf");
    // Only ONE "## Synergistic Activities" heading even though two section
    // types map to it.
    const count = (md.match(/## Synergistic Activities/g) ?? []).length;
    expect(count).toBe(1);
    // Both the service item and the talk item land under it.
    const block = sectionBody(md, "## Synergistic Activities");
    expect(block).toContain("national pharmacovigilance committee");
    expect(block).toContain("Keynote, ISoP 2023");
  });

  it("does NOT append funder bullets to a narrative module whose heading collides with a funder heading", () => {
    // A user narrative block whose heading equals the NSF "Synergistic
    // Activities" funder heading must not absorb the service/talks bullets — the
    // merge tracks the exact emitted-section index, not a heading prefix.
    let cv = fullCv();
    cv = upsertNarrativeModule(cv, "knowledge", {
      heading: "Synergistic Activities",
      body: "Narrative prose about my synergy.",
    });
    const md = renderGrantCv(cv, "nsf");

    // The narrative block (its own prose) is distinct from the funder section.
    const narrativeIdx = md.indexOf("Narrative prose about my synergy.");
    expect(narrativeIdx).toBeGreaterThanOrEqual(0);

    // The funder Synergistic-Activities block (service + talks) is the LAST
    // "## Synergistic Activities" occurrence and carries the bullets.
    const lastHeadingIdx = md.lastIndexOf("## Synergistic Activities");
    const funderBlock = md.slice(lastHeadingIdx);
    expect(funderBlock).toContain("national pharmacovigilance committee");
    expect(funderBlock).toContain("Keynote, ISoP 2023");

    // The bullets did NOT get appended to the narrative block: the narrative
    // prose paragraph is not immediately followed by the funder bullets.
    const narrativeBlockEnd = md.indexOf("\n\n##", narrativeIdx);
    const narrativeBlock = md.slice(narrativeIdx, narrativeBlockEnd < 0 ? undefined : narrativeBlockEnd);
    expect(narrativeBlock).not.toContain("national pharmacovigilance committee");
  });
});

/** The text of a `## heading` section up to the next `## ` (or end). */
function sectionBody(md: string, heading: string): string {
  const start = md.indexOf(heading);
  if (start < 0) return "";
  const after = start + heading.length;
  const next = md.indexOf("\n## ", after);
  return md.slice(after, next < 0 ? undefined : next);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
