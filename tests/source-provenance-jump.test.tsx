// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import SourceProvenance from "@/components/SourceProvenance";

afterEach(cleanup);

/**
 * The panel is where a user learns that a name-matched source left them
 * decisions, so it is also where they should be able to go and make them.
 * Identifier-matched chips stay inert — those rows are already on the CV.
 */

const COUNTS = { openalex: 926, oep: 1, "oep.candidates": 1, clinicaltrials: 1 };

const open = () => {
  const summary = document.querySelector("summary");
  if (summary) fireEvent.click(summary);
};

describe("SourceProvenance review chips", () => {
  it("renders review sources as buttons when a handler is given", () => {
    const onSelectSource = vi.fn();
    render(
      <SourceProvenance
        sourceCounts={COUNTS}
        locale="en-US"
        defaultOpen
        onSelectSource={onSelectSource}
      />,
    );
    open();
    const btn = screen.getByRole("button", { name: /Review the Open Editors Plus candidates/i });
    fireEvent.click(btn);
    expect(onSelectSource).toHaveBeenCalledWith("oep");
  });

  it("passes the right item source for each review line", () => {
    const onSelectSource = vi.fn();
    render(
      <SourceProvenance
        sourceCounts={COUNTS}
        locale="en-US"
        defaultOpen
        onSelectSource={onSelectSource}
      />,
    );
    open();
    fireEvent.click(screen.getByRole("button", { name: /ClinicalTrials\.gov/i }));
    expect(onSelectSource).toHaveBeenCalledWith("clinicaltrials");
  });

  it("leaves identifier-matched sources inert — nothing to decide there", () => {
    render(
      <SourceProvenance
        sourceCounts={COUNTS}
        locale="en-US"
        defaultOpen
        onSelectSource={vi.fn()}
      />,
    );
    open();
    // OpenAlex is identifier-matched: present, but never a button.
    expect(screen.getByText("OpenAlex")).toBeDefined();
    expect(screen.queryByRole("button", { name: /OpenAlex/i })).toBeNull();
  });

  it("renders plain chips when no handler is given (read-only context)", () => {
    render(<SourceProvenance sourceCounts={COUNTS} locale="en-US" defaultOpen />);
    open();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("goes inert for a source whose candidates are all decided", () => {
    const onSelectSource = vi.fn();
    render(
      <SourceProvenance
        sourceCounts={COUNTS}
        locale="en-US"
        defaultOpen
        onSelectSource={onSelectSource}
        resolvedSources={new Set(["oep"])}
      />,
    );
    open();
    expect(screen.queryByRole("button", { name: /Open Editors Plus/i })).toBeNull();
    // The other review source is untouched.
    expect(screen.getByRole("button", { name: /ClinicalTrials\.gov/i })).toBeDefined();
  });

  it("shows the same label in both columns without colliding on the React key", () => {
    // `oep` and `oep.candidates` share a label across groups; keying chips on
    // label alone would warn and drop one of them.
    const warn = vi.spyOn(console, "error").mockImplementation(() => {});
    render(<SourceProvenance sourceCounts={COUNTS} locale="en-US" defaultOpen />);
    open();
    expect(screen.getAllByText("Open Editors Plus")).toHaveLength(2);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });
});
