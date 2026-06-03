// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import CvEditor from "@/components/CvEditor";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemNotMine } from "@/lib/canonical/curate";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
  metrics: { h_index: 12, "2yr_mean_citedness": 3.4 },
};

function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "e",
    resolved,
    works,
    now: "2026-06-02T00:00:00.000Z",
  });
}

afterEach(cleanup);

describe("CvEditor (component)", () => {
  it("toggling a metric calls onChange with the metric + showMetrics on", () => {
    const onChange = vi.fn();
    render(<CvEditor cv={makeCv()} availableStyles={["apa"]} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/2-yr mean citedness/i));
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0]![0] as CanonicalCv;
    expect(next.display.metrics).toContain("2yr_mean_citedness");
    expect(next.display.showMetrics).toBe(true);
  });

  it("changing the highlight style propagates to display.highlightStyle", () => {
    const onChange = vi.fn();
    render(<CvEditor cv={makeCv()} availableStyles={["apa"]} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Highlight style"), {
      target: { value: "underline" },
    });
    const next = onChange.mock.calls[0]![0] as CanonicalCv;
    expect(next.display.highlightStyle).toBe("underline");
  });

  it("the responsible-metrics preset selects field-normalised indicators", () => {
    const onChange = vi.fn();
    render(<CvEditor cv={makeCv()} availableStyles={["apa"]} onChange={onChange} />);
    fireEvent.click(screen.getByText(/responsible-metrics preset/i));
    const next = onChange.mock.calls[0]![0] as CanonicalCv;
    expect(next.display.metrics).toEqual([
      "2yr_mean_citedness",
      "fwci_mean",
      "top10pct_share",
    ]);
    expect(next.display.showMetrics).toBe(true);
  });

  it("offers + Add Positions when there is no positions section, and creates one", () => {
    const onChange = vi.fn();
    render(<CvEditor cv={makeCv()} availableStyles={["apa"]} onChange={onChange} />);
    fireEvent.click(screen.getByText("+ Add Positions"));
    const next = onChange.mock.calls[0]![0] as CanonicalCv;
    const positions = next.sections.find((s) => s.type === "positions");
    expect(positions).toBeDefined();
    expect(positions!.items[0]!.source).toBe("manual");
  });

  it("renders one editable row per publication with curation controls", () => {
    render(<CvEditor cv={makeCv()} availableStyles={["apa"]} onChange={vi.fn()} />);
    // Each publication row has a Hide + Not mine button.
    expect(screen.getAllByText("Hide").length).toBe(works.length);
    expect(screen.getAllByText("Not mine").length).toBe(works.length);
  });

  it("surfaces a review badge for an orcid-conflict work", () => {
    const conflict = {
      id: "https://openalex.org/W_conflict",
      title: "Possibly a namesake's paper",
      display_name: "Possibly a namesake's paper",
      type: "article",
      publication_year: 2023,
      authorships: [
        {
          author: {
            id: "https://openalex.org/A5001069481",
            display_name: "B. Chrétien",
            orcid: "https://orcid.org/0000-0009-9999-9999",
          },
        },
      ],
    } as unknown as OpenAlexWork;
    const cv = buildCanonicalCv({ id: "rf", resolved, works: [conflict], now: "2026-06-02T00:00:00.000Z" });
    render(<CvEditor cv={cv} availableStyles={["apa"]} onChange={vi.fn()} />);
    expect(screen.getByText(/⚠ review/)).toBeTruthy();
  });

  it("captures a structured reason from the not-mine reason picker", () => {
    const base = makeCv();
    const sectionId = base.sections[0]!.id;
    const id = base.sections[0]!.items[0]!.id;
    const withNotMine = setItemNotMine(base, sectionId, id, true, { now: "2026-06-02T00:00:00.000Z" });
    const onChange = vi.fn();
    render(<CvEditor cv={withNotMine} availableStyles={["apa"]} onChange={onChange} />);
    // The accessible name uses a typographic apostrophe — match it loosely.
    fireEvent.change(screen.getByLabelText(/why isn.t this yours/i), {
      target: { value: "different-person" },
    });
    const next = onChange.mock.calls[0]![0] as CanonicalCv;
    const item = next.sections[0]!.items.find((i) => i.id === id)!;
    expect(item.notMine).toBe(true);
    expect(item.notMineReason).toBe("different-person");
  });

  it("renders chrome in the selected locale and switches it via the picker", () => {
    const onChange = vi.fn();
    const fr: CanonicalCv = {
      ...makeCv(),
      display: { ...makeCv().display, locale: "fr-FR" },
    };
    render(<CvEditor cv={fr} availableStyles={["apa"]} onChange={onChange} />);
    // French chrome: the per-row curation button reads "Masquer".
    expect(screen.getAllByText("Masquer").length).toBeGreaterThan(0);
    // The language picker switches display.locale.
    fireEvent.change(screen.getByLabelText(/langue/i), { target: { value: "ja-JP" } });
    const next = onChange.mock.calls[0]![0] as CanonicalCv;
    expect(next.display.locale).toBe("ja-JP");
  });
});
