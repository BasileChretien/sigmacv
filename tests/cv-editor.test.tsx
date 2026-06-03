// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import CvEditor from "@/components/CvEditor";
import { buildCanonicalCv } from "@/lib/canonical/build";
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
});
