// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import CareerContextPanel from "@/components/CareerContextPanel";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { addCareerContextEntry, updateDisplay } from "@/lib/canonical/curate";
import { CAREER_CONTEXT_MAX_ENTRIES, type CanonicalCv } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";

const SELF = "https://openalex.org/A5001069481";
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function work(id: string, year: number): OpenAlexWork {
  return {
    id: `https://openalex.org/${id}`,
    title: `Study ${id}`,
    display_name: `Study ${id}`,
    type: "article",
    publication_year: year,
    authorships: [
      { author: { id: SELF, display_name: "Basile Chrétien" }, raw_author_name: "Basile Chrétien" },
    ],
    primary_location: { source: { display_name: "Journal A", type: "journal" } },
  } as unknown as OpenAlexWork;
}

function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "ccp",
    resolved,
    works: [work("W1", 2018), work("W2", 2012)],
    now: "2026-06-02T00:00:00.000Z",
  });
}

afterEach(cleanup);

describe("CareerContextPanel (component)", () => {
  it("shows the self-declared note, the detected first-publication year and an empty state", () => {
    render(<CareerContextPanel cv={makeCv()} locale="en-US" onChange={vi.fn()} />);
    expect(screen.getByText(/never uses it to adjust or normalise/i)).toBeTruthy();
    expect(screen.getByText(/Detected from your publications: 2012/)).toBeTruthy();
    expect(screen.getByText(/No entries yet/)).toBeTruthy();
    expect(
      (screen.getByLabelText(/Show career context on the CV/) as HTMLInputElement).checked,
    ).toBe(false);
  });

  it("toggles display.showCareerContext and the first-publication line", () => {
    const onChange = vi.fn();
    render(<CareerContextPanel cv={makeCv()} locale="en-US" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText(/Show career context on the CV/));
    expect((onChange.mock.calls[0]![0] as CanonicalCv).display.showCareerContext).toBe(true);
    fireEvent.click(screen.getByLabelText(/Include the first-publication year/));
    expect(
      (onChange.mock.calls[1]![0] as CanonicalCv).owner.careerContext?.showFirstPublicationYear,
    ).toBe(true);
  });

  it("adds an entry, edits its kind / years / note, shows % only for part-time, and removes it", () => {
    let cv = makeCv();
    const onChange = vi.fn((next: CanonicalCv) => {
      cv = next;
    });
    const { rerender } = render(<CareerContextPanel cv={cv} locale="en-US" onChange={onChange} />);
    fireEvent.click(screen.getByText("Add entry"));
    expect(cv.owner.careerContext?.entries).toHaveLength(1);
    expect(cv.owner.careerContext?.entries[0]?.kind).toBe("career-break");
    rerender(<CareerContextPanel cv={cv} locale="en-US" onChange={onChange} />);
    expect(screen.queryByLabelText(/Working time/)).toBeNull();

    fireEvent.change(screen.getByLabelText("Type"), { target: { value: "part-time" } });
    rerender(<CareerContextPanel cv={cv} locale="en-US" onChange={onChange} />);
    expect(cv.owner.careerContext?.entries[0]?.kind).toBe("part-time");
    fireEvent.change(screen.getByLabelText(/Working time/), { target: { value: "60" } });
    expect(cv.owner.careerContext?.entries[0]?.fraction).toBe(0.6);
    rerender(<CareerContextPanel cv={cv} locale="en-US" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText(/Working time/), { target: { value: "" } });
    expect(cv.owner.careerContext?.entries[0]?.fraction).toBeUndefined();

    // Years commit only once they are a 4-digit year (partial input is ignored).
    const calls = onChange.mock.calls.length;
    fireEvent.change(screen.getByLabelText("From (year)"), { target: { value: "20" } });
    expect(onChange.mock.calls.length).toBe(calls);
    fireEvent.change(screen.getByLabelText("From (year)"), { target: { value: "2019" } });
    expect(cv.owner.careerContext?.entries[0]?.start).toBe("2019");
    fireEvent.change(screen.getByLabelText("To (year)"), { target: { value: "2021" } });
    expect(cv.owner.careerContext?.entries[0]?.end).toBe("2021");
    fireEvent.change(screen.getByLabelText("To (year)"), { target: { value: "" } });
    expect(cv.owner.careerContext?.entries[0]?.end).toBeUndefined();
    fireEvent.change(screen.getByLabelText(/Note/), { target: { value: "parental leave" } });
    expect(cv.owner.careerContext?.entries[0]?.note).toBe("parental leave");

    rerender(<CareerContextPanel cv={cv} locale="en-US" onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Remove entry"));
    expect(cv.owner.careerContext?.entries).toHaveLength(0);
  });

  it("sets / clears the first-publication override and disables Add at the cap", () => {
    let cv = updateDisplay(makeCv(), { showCareerContext: true });
    const onChange = vi.fn((next: CanonicalCv) => {
      cv = next;
    });
    render(<CareerContextPanel cv={cv} locale="en-US" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("First publication year"), {
      target: { value: "2009" },
    });
    expect(cv.owner.careerContext?.firstPublicationYearOverride).toBe(2009);
    fireEvent.change(screen.getByLabelText("First publication year"), { target: { value: "" } });
    expect(cv.owner.careerContext?.firstPublicationYearOverride).toBeUndefined();

    let full = cv;
    for (let i = 0; i < CAREER_CONTEXT_MAX_ENTRIES; i++) {
      full = addCareerContextEntry(full, { kind: "other", start: "2000" });
    }
    cleanup();
    render(<CareerContextPanel cv={full} locale="en-US" onChange={onChange} />);
    expect((screen.getByText("Add entry") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/Maximum of 20 entries reached/)).toBeTruthy();
  });
});
