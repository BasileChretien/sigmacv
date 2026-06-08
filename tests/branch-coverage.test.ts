import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import type { CanonicalCv } from "@/lib/canonical/schema";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { renderCvDocxBuffer } from "@/lib/render/docx";
import { renderCvLatex } from "@/lib/render/latex";
import { renderCvMarkdown } from "@/lib/render/markdown";
import { workToCsl } from "@/lib/openalex/toCsl";
import type { EditorialRole } from "@/lib/oep/client";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const baseWorks = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};
const hasApa = listAvailableStyles().includes("apa");

describe("workToCsl edge fields", () => {
  it("defaults unknown types, drops empty authors, and falls back to the OpenAlex URL", () => {
    const csl = workToCsl({
      id: "https://openalex.org/W999",
      title: "Edge work",
      publication_year: 2020,
      type: "totally-unknown-type",
      authorships: [],
      primary_location: { source: null },
    } as unknown as OpenAlexWork);
    expect(csl.type).toBe("article-journal"); // default mapping
    expect(csl.author).toBeUndefined(); // no authors added
    expect(csl["container-title"]).toBeUndefined();
    expect(csl.DOI).toBeUndefined();
    expect(csl.URL).toBe("https://openalex.org/W999"); // URL fallback
  });
});

describe("build merges editorial + grants sections on re-sync", () => {
  it("preserves renamed/hidden editorial & grants sections", () => {
    const roles: EditorialRole[] = [{ journal: "BMJ", role: "Editor", startYear: 2020 }];
    const fundings = [{ putCode: "9", title: "NIH R01", organization: "NIH", startYear: 2020 }];

    const first = buildCanonicalCv({
      id: "m",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
      editorialRoles: roles,
      fundings,
    });
    // User renames + hides the non-publication sections.
    const previous: CanonicalCv = {
      ...first,
      sections: first.sections.map((s) =>
        s.type === "grants"
          ? { ...s, title: "Funding", visible: false }
          : s.type === "editorial"
            ? { ...s, title: "Editorial Service" }
            : s,
      ),
    };
    const resynced = buildCanonicalCv({
      id: "m",
      resolved,
      works: baseWorks,
      now: "2026-07-01T00:00:00.000Z",
      editorialRoles: roles,
      fundings,
      previous,
    });
    const grants = resynced.sections.find((s) => s.type === "grants")!;
    const editorial = resynced.sections.find((s) => s.type === "editorial")!;
    expect(grants.title).toBe("Funding");
    expect(grants.visible).toBe(false);
    expect(editorial.title).toBe("Editorial Service");
  });
});

describe.skipIf(!hasApa)("text renderers without ORCID / metrics", () => {
  function emptyOrcidCv(): CanonicalCv {
    const cv = buildCanonicalCv({
      id: "e",
      resolved,
      works: baseWorks,
      now: "2026-06-02T00:00:00.000Z",
    });
    return { ...cv, owner: { ...cv.owner, orcid: "" } };
  }

  it("Markdown omits the orcid frontmatter line", () => {
    expect(renderCvMarkdown(emptyOrcidCv())).not.toContain("orcid:");
  });
  it("LaTeX omits the ORCID href", () => {
    expect(renderCvLatex(emptyOrcidCv())).not.toContain("ORCID:");
  });
  it("DOCX still renders without an ORCID", async () => {
    expect((await renderCvDocxBuffer(emptyOrcidCv())).length).toBeGreaterThan(0);
  });
});
