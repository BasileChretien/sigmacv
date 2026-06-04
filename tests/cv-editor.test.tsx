// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import CvEditor from "@/components/CvEditor";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { addSection, setItemNotMine } from "@/lib/canonical/curate";
import { sectionTitle } from "@/lib/i18n";
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

/** Sections are collapsed by default; expand them all so item rows render. */
function expandAllSections() {
  document
    .querySelectorAll<HTMLButtonElement>("button.section-toggle")
    .forEach((b) => fireEvent.click(b));
}

describe("CvEditor (component)", () => {
  it("toggling a metric calls onChange with the metric + showMetrics on", () => {
    const onChange = vi.fn();
    render(<CvEditor cv={makeCv()} availableStyles={["apa"]} uiLocale="en-US" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/2-yr mean citedness/i));
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0]![0] as CanonicalCv;
    expect(next.display.metrics).toContain("2yr_mean_citedness");
    expect(next.display.showMetrics).toBe(true);
  });

  it("changing the highlight style propagates to display.highlightStyle", () => {
    const onChange = vi.fn();
    render(<CvEditor cv={makeCv()} availableStyles={["apa"]} uiLocale="en-US" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Highlight style"), {
      target: { value: "underline" },
    });
    const next = onChange.mock.calls[0]![0] as CanonicalCv;
    expect(next.display.highlightStyle).toBe("underline");
  });

  it("the responsible-metrics preset selects field-normalised indicators", () => {
    const onChange = vi.fn();
    render(<CvEditor cv={makeCv()} availableStyles={["apa"]} uiLocale="en-US" onChange={onChange} />);
    fireEvent.click(screen.getByText(/responsible-metrics preset/i));
    const next = onChange.mock.calls[0]![0] as CanonicalCv;
    expect(next.display.metrics).toEqual(["2yr_mean_citedness", "fwci_mean"]);
    expect(next.display.showMetrics).toBe(true);
  });

  it("offers an add-section button for a missing section and creates it", () => {
    const onChange = vi.fn();
    render(<CvEditor cv={makeCv()} availableStyles={["apa"]} uiLocale="en-US" onChange={onChange} />);
    fireEvent.click(screen.getByText("+ Positions"));
    const next = onChange.mock.calls[0]![0] as CanonicalCv;
    const positions = next.sections.find((s) => s.type === "positions");
    expect(positions).toBeDefined();
    expect(positions!.items).toHaveLength(0); // empty section, ready for entries
  });

  it("offers a Skills add-section button", () => {
    render(<CvEditor cv={makeCv()} availableStyles={["apa"]} uiLocale="en-US" onChange={vi.fn()} />);
    expect(screen.getByText("+ Skills")).toBeTruthy();
  });

  // Regression: these source-less section types were in the add-section menu but
  // in neither MANUAL_SECTIONS nor STRUCTURED_SECTIONS, so they rendered with no
  // input at all — the user could add them but never fill them.
  it.each(["skills", "talks", "teaching", "supervision"] as const)(
    "renders a free-text add-entry row for the '%s' section",
    (type) => {
      const cv = addSection(makeCv(), type);
      render(<CvEditor cv={cv} availableStyles={["apa"]} uiLocale="en-US" onChange={vi.fn()} />);
      expandAllSections();
      const titleInput = [
        ...document.querySelectorAll<HTMLInputElement>("input.section-title"),
      ].find((i) => i.value === sectionTitle("en-US", type));
      expect(titleInput).toBeTruthy();
      const block = titleInput!.closest(".section-block");
      expect(block?.querySelector(".add-entry-row")).toBeTruthy();
    },
  );

  it("collapses sections by default and expands on demand to show rows", () => {
    render(<CvEditor cv={makeCv()} availableStyles={["apa"]} uiLocale="en-US" onChange={vi.fn()} />);
    // Collapsed: no item rows yet.
    expect(screen.queryAllByText("Hide").length).toBe(0);
    expandAllSections();
    // Expanded: a Hide + Not mine per publication.
    expect(screen.getAllByText("Hide").length).toBe(works.length);
    expect(screen.getAllByText("Not mine").length).toBe(works.length);
  });

  it("shows each item's data source", () => {
    render(<CvEditor cv={makeCv()} availableStyles={["apa"]} uiLocale="en-US" onChange={vi.fn()} />);
    expandAllSections();
    expect(screen.getAllByText("OpenAlex").length).toBeGreaterThan(0);
  });

  it("flags a weak (OpenAlex-ID-only) self-match for review", () => {
    let cv = makeCv();
    // Force authored-by-self items to be id-only matches (not ORCID-confirmed).
    cv = {
      ...cv,
      sections: cv.sections.map((s) => ({
        ...s,
        items: s.items.map((it) =>
          it.authoredBySelf
            ? { ...it, meta: { ...it.meta, matchBasis: "openalex-id" as const } }
            : it,
        ),
      })),
    };
    render(<CvEditor cv={cv} availableStyles={["apa"]} uiLocale="en-US" onChange={vi.fn()} />);
    expandAllSections();
    const weak = document.querySelector(".cv-self-badge.is-weak-match");
    expect(weak).toBeTruthy();
    expect(weak!.getAttribute("title")).toMatch(/OpenAlex ID only/i);
  });

  it("gives the Hide and Not-mine buttons an item-specific accessible name", () => {
    render(<CvEditor cv={makeCv()} availableStyles={["apa"]} uiLocale="en-US" onChange={vi.fn()} />);
    expandAllSections();
    // The accessible name is "Hide — <title>" / "Not mine — <title>" (not the bare
    // verb), so a screen reader announces which entry the button acts on.
    expect(screen.getAllByRole("button", { name: /^Hide — .+/ }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /^Not mine — .+/ }).length).toBeGreaterThan(0);
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
    render(<CvEditor cv={cv} availableStyles={["apa"]} uiLocale="en-US" onChange={vi.fn()} />);
    expandAllSections();
    expect(screen.getByText(/⚠ review/)).toBeTruthy();
  });

  it("captures a structured reason from the not-mine reason picker", () => {
    const base = makeCv();
    const sectionId = base.sections[0]!.id;
    const id = base.sections[0]!.items[0]!.id;
    const withNotMine = setItemNotMine(base, sectionId, id, true, { now: "2026-06-02T00:00:00.000Z" });
    const onChange = vi.fn();
    render(<CvEditor cv={withNotMine} availableStyles={["apa"]} uiLocale="en-US" onChange={onChange} />);
    expandAllSections();
    // The accessible name uses a typographic apostrophe — match it loosely.
    fireEvent.change(screen.getByLabelText(/why isn.t this yours/i), {
      target: { value: "different-person" },
    });
    const next = onChange.mock.calls[0]![0] as CanonicalCv;
    const item = next.sections[0]!.items.find((i) => i.id === id)!;
    expect(item.notMine).toBe(true);
    expect(item.notMineReason).toBe("different-person");
  });

  it("reorders items within a section via drag-and-drop", () => {
    const onChange = vi.fn();
    const cv = makeCv();
    const firstId = [...cv.sections[0]!.items].sort((a, b) => a.order - b.order)[0]!.id;
    const { container } = render(
      <CvEditor cv={cv} availableStyles={["apa"]} uiLocale="en-US" onChange={onChange} />,
    );
    expandAllSections();
    const handles = screen.getAllByTitle("Drag to reorder"); // item handles only
    const rows = container.querySelectorAll("li.cv-item-row");
    expect(rows.length).toBeGreaterThan(2);
    fireEvent.dragStart(handles[0]!, { dataTransfer: {} });
    fireEvent.drop(rows[2]!);
    const next = onChange.mock.calls.at(-1)![0] as CanonicalCv;
    const ordered = [...next.sections[0]!.items].sort((a, b) => a.order - b.order);
    expect(ordered[2]!.id).toBe(firstId); // dragged item landed at index 2
  });

  it("renders chrome in the INTERFACE locale (independent of the CV language)", () => {
    // CV language is en-US, but the interface is French → chrome is French.
    render(<CvEditor cv={makeCv()} availableStyles={["apa"]} uiLocale="fr-FR" onChange={vi.fn()} />);
    expandAllSections();
    // French chrome: the per-row curation button reads "Masquer".
    expect(screen.getAllByText("Masquer").length).toBeGreaterThan(0);
  });

  it("the CV-language picker sets display.locale (not the interface language)", () => {
    const onChange = vi.fn();
    // Interface in French → the picker is labelled "Langue du CV".
    render(<CvEditor cv={makeCv()} availableStyles={["apa"]} uiLocale="fr-FR" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/langue du cv/i), {
      target: { value: "ja-JP" },
    });
    const next = onChange.mock.calls[0]![0] as CanonicalCv;
    expect(next.display.locale).toBe("ja-JP");
  });
});
