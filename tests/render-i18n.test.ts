import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { listAvailableStyles } from "@/lib/citeproc/assets";
import { SUPPORTED_LOCALES } from "@/lib/i18n";
import {
  authorshipRoleLabel,
  metricContext,
  metricCoverageNote,
  metricLabel,
  renderStrings,
} from "@/lib/i18n/render";
import { renderCvHtml } from "@/lib/render/html";
import { cvDocTitle } from "@/lib/render/templates/shared";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";

const hasApa = listAvailableStyles().includes("apa");
const SELF = "https://openalex.org/A5001069481";
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};
const work = {
  id: "https://openalex.org/W1",
  title: "A study of adverse drug reactions",
  display_name: "A study of adverse drug reactions",
  type: "article",
  publication_year: 2024,
  authorships: [
    { author: { id: SELF, display_name: "Basile Chrétien" }, raw_author_name: "Basile Chrétien" },
  ],
  primary_location: { source: { display_name: "Journal A", type: "journal" } },
} as unknown as OpenAlexWork;

function localizedCv(locale: string): CanonicalCv {
  const cv = buildCanonicalCv({ id: "i", resolved, works: [work], now: "2026-06-02T00:00:00.000Z" });
  return {
    ...cv,
    owner: {
      ...cv.owner,
      countsByYear: [
        { year: 2023, works: 2, citations: 5 },
        { year: 2024, works: 3, citations: 10 },
      ],
      metrics: { fwci_mean: 1.4 },
    },
    display: {
      ...cv.display,
      locale,
      showCharts: true,
      showMetrics: true,
      metrics: ["fwci_mean"],
      showAuthorshipTable: true,
      authorshipRoles: ["first"],
      showProvenance: true, // this test asserts the (opt-in) provenance footer
    },
  };
}

describe("renderStrings helpers", () => {
  it("falls back to English for an unknown locale and unknown keys", () => {
    expect(renderStrings("xx-XX").roleFirst).toBe("First author");
    expect(metricLabel("en-US", "nope")).toBe("nope");
    expect(metricContext("en-US", "h_index")).toBeUndefined();
    expect(authorshipRoleLabel("en-US", "nope")).toBe("nope");
  });

  it("localizes labels, contexts and roles per locale", () => {
    expect(metricLabel("fr-FR", "fwci_mean")).toBe("FWCI moyen des travaux");
    expect(metricLabel("de-DE", "h_index")).toBe("h-Index");
    expect(metricContext("fr-FR", "fwci_mean")).toContain("moyenne mondiale");
    expect(authorshipRoleLabel("ja-JP", "first")).toBe("筆頭著者");
    expect(authorshipRoleLabel("ru-RU", "corresponding")).toBe("Автор для корреспонденции");
    expect(renderStrings("de-DE").cvFallbackTitle).toBe("Lebenslauf");
  });

  it("removes the misleading 'field-normalised' claim from the 2-year metric", () => {
    // It's a JIF-analogue, not field-normalized — honesty fix (anti-DORA).
    expect(metricContext("en-US", "2yr_mean_citedness")).toContain(
      "not field-normalised",
    );
    expect(metricContext("en-US", "2yr_mean_citedness")).not.toMatch(
      /^field-normalised/,
    );
    // FWCI keeps its (correct) field-normalized context.
    expect(metricContext("en-US", "fwci_mean")).toContain("world average");
  });

  it("builds a localized document title, falling back when no name is set", () => {
    const cv = localizedCv("de-DE");
    expect(cvDocTitle(cv)).toBe("Basile Chrétien — Lebenslauf");
    const noName: CanonicalCv = { ...cv, owner: { ...cv.owner, displayName: "" } };
    expect(cvDocTitle(noName)).toBe("Lebenslauf");
    expect(cvDocTitle({ ...noName, display: { ...cv.display, locale: "ja-JP" } })).toBe(
      "履歴書",
    );
  });

  it("builds a localized FWCI coverage note and omits it for empty N", () => {
    expect(metricCoverageNote("en-US", 73)).toBe("mean over 73 works with FWCI");
    expect(metricCoverageNote("fr-FR", 5)).toBe("moyenne sur 5 travaux avec FWCI");
    expect(metricCoverageNote("en-US", 0)).toBeUndefined();
    expect(metricCoverageNote("en-US", undefined)).toBeUndefined();
  });

  it("defines every rendered-CV string for all 10 locales", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(10);
    for (const loc of SUPPORTED_LOCALES) {
      for (const value of Object.values(renderStrings(loc))) {
        expect(value.length).toBeGreaterThan(0);
      }
    }
  });
});

describe.skipIf(!hasApa)("rendered CV output is fully localized", () => {
  it("renders a French CV with French chart/metric/authorship/provenance strings", () => {
    const html = renderCvHtml(localizedCv("fr-FR"));
    // The document declares its content locale (not a hardcoded en) so screen
    // readers, hyphenation and crawlers treat it as French.
    expect(html).toContain('<html lang="fr-FR">');
    expect(html).not.toContain('<html lang="en">');
    expect(html).toContain("Publications / an"); // chart caption
    expect(html).toContain("Citations / an");
    expect(html).toContain("FWCI moyen des travaux"); // metric label
    expect(html).toContain("moyenne mondiale"); // metric context
    expect(html).toContain("évaluées par les pairs"); // authorship caption
    expect(html).toContain("Premier auteur"); // authorship role
    expect(html).toContain("Généré à partir de"); // provenance footer
    // English equivalents must be gone.
    expect(html).not.toContain("Publications / year");
    expect(html).not.toContain("First author");
    expect(html).not.toContain("Generated from");
  });

  it("renders a Japanese CV with Japanese rendered strings", () => {
    const html = renderCvHtml(localizedCv("ja-JP"));
    expect(html).toContain("年別論文数"); // chart
    expect(html).toContain("筆頭著者"); // role
    expect(html).toContain("生成元"); // provenance
  });

  it("localizes the 'manual entries' and 'derived' provenance source labels", () => {
    const cv = localizedCv("en-US");
    const withSources: CanonicalCv = {
      ...cv,
      provenance: { ...cv.provenance, sources: ["openalex", "manual", "derived"] },
    };
    const html = renderCvHtml(withSources);
    expect(html).toContain("OpenAlex"); // proper noun untouched
    expect(html).toContain("manual entries"); // localized (en)
    expect(html).toContain("derived");
  });
});
