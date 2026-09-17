// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import EvidencePicker from "@/components/EvidencePicker";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

afterEach(() => cleanup());

function item(id: string, title: string, over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: {
      id,
      type: "article-journal",
      title,
      author: [{ family: "Smith" }],
      issued: { "date-parts": [[2021]] },
    },
    meta: {},
    ...over,
  } as CvItem;
}

const cv: CanonicalCv = CanonicalCvSchema.parse({
  schemaVersion: 2,
  id: "ev",
  owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "B" },
  display: {},
  sections: [
    {
      id: "publications",
      type: "publications",
      title: "Publications",
      visible: true,
      order: 0,
      items: [
        item("W1", "Signal detection in pharmacovigilance"),
        item("W2", "A study of mentoring", { notMine: true }),
      ],
    },
    {
      id: "supervision",
      type: "supervision",
      title: "Supervision",
      visible: true,
      order: 1,
      items: [item("s1", "x", { csl: undefined, displayText: "PhD supervision: J. Doe" })],
    },
  ],
  provenance: { generatedAt: "2026-09-04T00:00:00.000Z", sources: ["openalex"] },
});

describe("EvidencePicker", () => {
  it("offers the module's supporting entries, searchable, and inserts a readable [[id | label]] marker", () => {
    const onInsert = vi.fn();
    render(
      <EvidencePicker
        cv={cv}
        sectionType="narrative-knowledge"
        body=""
        locale="en-US"
        onInsert={onInsert}
      />,
    );
    fireEvent.click(screen.getByText("Cite one of my entries"));
    // Publications support "knowledge" and come first; the rest of the record follows
    // (a supervision record is still citable from here); the not-mine work is never offered.
    expect(screen.getByText("Signal detection in pharmacovigilance")).toBeTruthy();
    expect(screen.getByText("PhD supervision: J. Doe")).toBeTruthy();
    expect(
      [...document.querySelectorAll(".evidence-option-title")].map((el) => el.textContent),
    ).toEqual(["Signal detection in pharmacovigilance", "PhD supervision: J. Doe"]);
    expect(screen.queryByText("A study of mentoring")).toBeNull();

    fireEvent.change(screen.getByLabelText("Search your publications, datasets, students…"), {
      target: { value: "zzz" },
    });
    expect(screen.getByText("No matching entry")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Search your publications, datasets, students…"), {
      target: { value: "signal" },
    });
    fireEvent.click(screen.getByText("Signal detection in pharmacovigilance"));
    expect(onInsert).toHaveBeenCalledWith("[[W1 | Smith 2021]]");
  });

  it("offers every listed entry to a free statement", () => {
    render(
      <EvidencePicker cv={cv} sectionType="statement" body="" locale="en-US" onInsert={vi.fn()} />,
    );
    fireEvent.click(screen.getByText("Cite one of my entries"));
    expect(screen.getByText("Signal detection in pharmacovigilance")).toBeTruthy();
    expect(screen.getByText("PhD supervision: J. Doe")).toBeTruthy();
  });

  it("summarises the linked entries as chips and counts references that no longer resolve", () => {
    render(
      <EvidencePicker
        cv={cv}
        sectionType="narrative-knowledge"
        body="Shown [[W1]] twice [[W1]]; hidden [[W2]]; gone [[nope]]."
        locale="en-US"
        onInsert={vi.fn()}
      />,
    );
    expect(screen.getByText("Cited in this section: 1")).toBeTruthy();
    expect(screen.getByText("Smith 2021")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("2 citations");
  });

  it("shows no summary line for a body without references", () => {
    render(
      <EvidencePicker
        cv={cv}
        sectionType="narrative-knowledge"
        body="plain prose"
        locale="fr-FR"
        onInsert={vi.fn()}
      />,
    );
    expect(screen.queryByText(/Citées dans cette section/)).toBeNull();
    expect(screen.getByText("Citer une de mes entrées")).toBeTruthy();
  });
});
