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
  it("offers the module's supporting entries, searchable, and inserts the [[id]] token", () => {
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
    fireEvent.click(screen.getByText("Insert evidence"));
    // Publications support "knowledge"; supervision does not; the not-mine work is never offered.
    expect(screen.getByText("Signal detection in pharmacovigilance")).toBeTruthy();
    expect(screen.queryByText("PhD supervision: J. Doe")).toBeNull();
    expect(screen.queryByText("A study of mentoring")).toBeNull();

    fireEvent.change(screen.getByLabelText("Search your entries…"), { target: { value: "zzz" } });
    expect(screen.getByText("No matching entry")).toBeTruthy();
    fireEvent.change(screen.getByLabelText("Search your entries…"), {
      target: { value: "signal" },
    });
    fireEvent.click(screen.getByText("Signal detection in pharmacovigilance"));
    expect(onInsert).toHaveBeenCalledWith("[[W1]]");
  });

  it("offers every listed entry to a free statement", () => {
    render(
      <EvidencePicker cv={cv} sectionType="statement" body="" locale="en-US" onInsert={vi.fn()} />,
    );
    fireEvent.click(screen.getByText("Insert evidence"));
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
    expect(screen.getByText("Linked evidence: 1")).toBeTruthy();
    expect(screen.getByText("Smith 2021")).toBeTruthy();
    expect(screen.getByRole("status").textContent).toContain("2 references");
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
    expect(screen.queryByText(/Preuves liées/)).toBeNull();
    expect(screen.getByText("Insérer une preuve")).toBeTruthy();
  });
});
