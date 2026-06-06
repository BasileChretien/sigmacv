import { describe, expect, it } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { ogImageProps } from "@/lib/cv/ogImage";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OrcidPosition } from "@/lib/orcid/client";

const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A1"],
  displayName: "Basile Chrétien",
};

function makeCv(
  owner: Partial<CanonicalCv["owner"]> = {},
  opts: { employments?: OrcidPosition[]; display?: Partial<CanonicalCv["display"]> } = {},
): CanonicalCv {
  const cv = buildCanonicalCv({
    id: "og",
    resolved,
    works: [],
    now: "2026-06-02T00:00:00.000Z",
    employments: opts.employments,
  });
  return {
    ...cv,
    owner: { ...cv.owner, ...owner },
    display: { ...cv.display, ...(opts.display ?? {}) },
  };
}

describe("ogImageProps", () => {
  it("extracts name, headline, affiliation, and accent", () => {
    const props = ogImageProps(
      makeCv(
        { headline: "Assistant Professor of Pharmacology" },
        {
          employments: [
            { putCode: "200", organization: "Nagoya University", roleTitle: "Assistant Professor", startYear: 2024 },
          ],
          display: { accentColor: "#0f766e" },
        },
      ),
    );
    expect(props.name).toBe("Basile Chrétien");
    expect(props.headline).toBe("Assistant Professor of Pharmacology");
    // Affiliation taken from the most-recent visible position, with the trailing
    // "(years)" suffix stripped for a clean card.
    expect(props.affiliation).toBe("Assistant Professor, Nagoya University");
    expect(props.accentColor).toBe("#0f766e");
  });

  it("falls back to a generic name when displayName is empty", () => {
    const props = ogImageProps(makeCv({ displayName: "" }));
    expect(props.name).toBe("Curriculum Vitae");
  });

  it("uses the summary as the headline when no headline is set", () => {
    const props = ogImageProps(makeCv({ headline: undefined, summary: "I study adverse drug reactions." }));
    expect(props.headline).toBe("I study adverse drug reactions.");
  });

  it("returns empty strings for missing headline + affiliation, with a default accent", () => {
    const props = ogImageProps(makeCv());
    expect(props.headline).toBe("");
    expect(props.affiliation).toBe("");
    // Schema default accent flows through.
    expect(props.accentColor).toBe("#1f4fd8");
  });

  it("truncates a very long headline on a word boundary with an ellipsis", () => {
    const long = "word ".repeat(60).trim();
    const props = ogImageProps(makeCv({ headline: long }));
    expect(props.headline.length).toBeLessThanOrEqual(120);
    expect(props.headline.endsWith("…")).toBe(true);
  });

  it("truncates hard (no word boundary) when a single token is huge", () => {
    const props = ogImageProps(makeCv({ headline: "x".repeat(300) }));
    expect(props.headline.length).toBeLessThanOrEqual(120);
    expect(props.headline.endsWith("…")).toBe(true);
  });

  it("collapses whitespace in the name", () => {
    const props = ogImageProps(makeCv({ displayName: "  Jane   Doe \n PhD " }));
    expect(props.name).toBe("Jane Doe PhD");
  });

  it("skips a hidden position when choosing the affiliation", () => {
    const cv = makeCv(
      {},
      {
        employments: [
          { putCode: "200", organization: "Nagoya University", roleTitle: "Assistant Professor", startYear: 2024 },
          { putCode: "201", organization: "CHU de Caen", roleTitle: "Pharmacist", startYear: 2012, endYear: 2024 },
        ],
      },
    );
    // Hide the first (most-recent) position; the next visible one is chosen.
    const positions = cv.sections.find((s) => s.type === "positions")!;
    const hidden: CanonicalCv = {
      ...cv,
      sections: cv.sections.map((s) =>
        s.type === "positions"
          ? { ...s, items: s.items.map((it, i) => (i === 0 ? { ...it, included: false } : it)) }
          : s,
      ),
    };
    expect(positions.items[0]!.displayText).toContain("Nagoya");
    expect(ogImageProps(hidden).affiliation).toBe("Pharmacist, CHU de Caen");
  });

  it("returns an empty affiliation when every position is hidden", () => {
    const cv = makeCv(
      {},
      {
        employments: [
          { putCode: "200", organization: "Nagoya University", roleTitle: "Assistant Professor", startYear: 2024 },
        ],
      },
    );
    const allHidden: CanonicalCv = {
      ...cv,
      sections: cv.sections.map((s) =>
        s.type === "positions"
          ? { ...s, items: s.items.map((it) => ({ ...it, included: false })) }
          : s,
      ),
    };
    expect(ogImageProps(allHidden).affiliation).toBe("");
  });
});
