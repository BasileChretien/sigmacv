// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import CvEditor from "@/components/CvEditor";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

afterEach(cleanup);

function makeItem(i: number, over: Partial<CvItem> = {}): CvItem {
  const id = `W${i}`;
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    csl: { id, type: "article-journal", title: `Paper ${i} ${i % 2 ? "alpha" : "beta"}` },
    included: true,
    notMine: false,
    order: i,
    authoredBySelf: true,
    selfNameVariants: ["Chrétien"],
    meta: { year: 2018 + i },
    ...over,
  };
}

function makeCv(): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "cv1",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Basile Chrétien" },
    display: {},
    sections: [
      {
        id: "publications",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items: [0, 1, 2, 3, 4, 5].map((i) => makeItem(i)),
      },
    ],
    provenance: { generatedAt: "2026-06-11T00:00:00.000Z", sources: ["openalex"] },
  });
}

function expandAllSections() {
  document
    .querySelectorAll<HTMLButtonElement>("button.section-toggle")
    .forEach((b) => fireEvent.click(b));
}

function bulkActions(): HTMLElement {
  const bar = document.querySelector<HTMLElement>(".bulk-actions");
  expect(bar).toBeTruthy();
  return bar!;
}

describe("bulk curation (component)", () => {
  it("select-all + Hide flips every item's included flag in one change", () => {
    const onChange = vi.fn();
    render(
      <CvEditor cv={makeCv()} availableStyles={["apa"]} uiLocale="en-US" onChange={onChange} />,
    );
    expandAllSections();
    fireEvent.click(screen.getByText("Select multiple"));
    fireEvent.click(screen.getByText("Select all shown (6)"));
    fireEvent.click(within(bulkActions()).getByText("Hide"));
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0]![0] as CanonicalCv;
    const pubs = next.sections.find((s) => s.type === "publications")!;
    expect(pubs.items.every((i) => i.included === false)).toBe(true);
  });

  it("the filter narrows the list and select-all only takes the matches", () => {
    const onChange = vi.fn();
    render(
      <CvEditor cv={makeCv()} availableStyles={["apa"]} uiLocale="en-US" onChange={onChange} />,
    );
    expandAllSections();
    fireEvent.click(screen.getByText("Select multiple"));
    fireEvent.change(screen.getByLabelText("Filter by title or venue…"), {
      target: { value: "alpha" },
    });
    // Papers 1, 3, 5 are "alpha".
    fireEvent.click(screen.getByText("Select all shown (3)"));
    fireEvent.click(within(bulkActions()).getByText("Hide"));
    const next = onChange.mock.calls[0]![0] as CanonicalCv;
    const by = Object.fromEntries(next.sections[0]!.items.map((i) => [i.id, i.included])) as Record<
      string,
      boolean
    >;
    expect(by).toEqual({ W0: true, W1: false, W2: true, W3: false, W4: true, W5: false });
  });

  it("checkbox selection + 'Mark not mine' asserts the claim on the selection", () => {
    const onChange = vi.fn();
    render(
      <CvEditor cv={makeCv()} availableStyles={["apa"]} uiLocale="en-US" onChange={onChange} />,
    );
    expandAllSections();
    fireEvent.click(screen.getByText("Select multiple"));
    fireEvent.click(screen.getByLabelText("Select: Paper 0 beta"));
    fireEvent.click(screen.getByLabelText("Select: Paper 1 alpha"));
    fireEvent.click(within(bulkActions()).getByText("Mark not mine"));
    const next = onChange.mock.calls[0]![0] as CanonicalCv;
    const flagged = next.sections[0]!.items.filter((i) => i.notMine).map((i) => i.id);
    expect(flagged.sort()).toEqual(["W0", "W1"]);
  });

  it("year bounds filter the list", () => {
    const onChange = vi.fn();
    render(
      <CvEditor cv={makeCv()} availableStyles={["apa"]} uiLocale="en-US" onChange={onChange} />,
    );
    expandAllSections();
    fireEvent.click(screen.getByText("Select multiple"));
    // Years run 2018..2023; keep 2021+ → W3, W4, W5.
    fireEvent.change(screen.getByLabelText("From year"), { target: { value: "2021" } });
    expect(screen.getByText("Select all shown (3)")).toBeTruthy();
  });

  it("structured entry with “this is my work” marks the entry user-claimed", () => {
    const onChange = vi.fn();
    render(
      <CvEditor cv={makeCv()} availableStyles={["apa"]} uiLocale="en-US" onChange={onChange} />,
    );
    expandAllSections();
    // ClaimByDoi shares the .structured-entry class — anchor on the summary text.
    const form = screen.getByText("Add a structured entry").closest("details") as HTMLElement;
    fireEvent.change(within(form).getByLabelText("Title", { exact: false }), {
      target: { value: "Hand-entered paper" },
    });
    fireEvent.change(within(form).getByLabelText("Authors", { exact: false }), {
      target: { value: "Chrétien, Basile; Doe, Jane" },
    });
    fireEvent.click(within(form).getByLabelText(/This is my work/));
    // Two authors typed → the "which author are you?" picker appears.
    expect(within(form).getByLabelText("Which author are you?")).toBeTruthy();
    fireEvent.click(within(form).getByText("Add entry"));
    const next = onChange.mock.calls[0]![0] as CanonicalCv;
    const added = next.sections[0]!.items.find((i) => i.source === "manual")!;
    expect(added.authoredBySelf).toBe(true);
    expect(added.meta.matchBasis).toBe("claimed");
    expect(added.selfNameVariants).toContain("Chrétien");
  });
});
