// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import SyncReportBanner from "@/components/SyncReportBanner";
import type { SyncReport } from "@/lib/cv/syncReport";

afterEach(cleanup);
beforeEach(() => window.localStorage.clear());

const REPORT: SyncReport = {
  syncedAt: "2026-06-11T10:00:00.000Z",
  initial: false,
  addedTotal: 3,
  removedTotal: 1,
  added: [
    { sectionType: "publications", itemId: "W1", title: "A brand-new paper" },
    { sectionType: "grants", itemId: "G1", title: "A new grant", reviewFlag: "name-matched" },
  ],
  reviewCandidates: 1,
};

describe("SyncReportBanner", () => {
  it("shows added / review / removed pills and the new items list", () => {
    render(<SyncReportBanner report={REPORT} locale="en-US" />);
    expect(screen.getByText("3 new")).toBeTruthy();
    expect(screen.getByText("1 to review")).toBeTruthy();
    expect(screen.getByText("1 no longer in the sources")).toBeTruthy();
    fireEvent.click(screen.getByText("Show what’s new"));
    expect(screen.getByText(/A brand-new paper/)).toBeTruthy();
    expect(screen.getByText(/A new grant/)).toBeTruthy();
  });

  it("renders nothing when the sync changed nothing, or without a report", () => {
    const { container } = render(
      <SyncReportBanner
        report={{ ...REPORT, addedTotal: 0, removedTotal: 0, added: [], reviewCandidates: 0 }}
        locale="en-US"
      />,
    );
    expect(container.innerHTML).toBe("");
    const empty = render(<SyncReportBanner report={null} locale="en-US" />);
    expect(empty.container.innerHTML).toBe("");
  });

  it("shows the first-sync welcome instead of pills for an initial report", () => {
    render(
      <SyncReportBanner
        report={{ ...REPORT, initial: true, added: [], addedTotal: 42 }}
        locale="en-US"
      />,
    );
    // The first-import message reassures: the CV is ready and review is optional.
    expect(screen.getByText(/Imported 42 entries/)).toBeTruthy();
    expect(screen.getByText(/your CV is ready/i)).toBeTruthy();
    expect(screen.getByText(/is optional/i)).toBeTruthy();
    expect(screen.queryByText("Show what’s new")).toBeNull();
  });

  it("dismissal hides the banner and persists for the SAME report only", () => {
    const first = render(<SyncReportBanner report={REPORT} locale="en-US" />);
    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(first.container.querySelector(".sync-report-banner")).toBeNull();
    first.unmount();

    // Same report → stays dismissed across a remount.
    const again = render(<SyncReportBanner report={REPORT} locale="en-US" />);
    expect(again.container.querySelector(".sync-report-banner")).toBeNull();
    again.unmount();

    // A NEWER sync (different syncedAt) shows again.
    render(
      <SyncReportBanner
        report={{ ...REPORT, syncedAt: "2026-06-12T10:00:00.000Z" }}
        locale="en-US"
      />,
    );
    expect(screen.getByText("3 new")).toBeTruthy();
  });

  it("localizes the banner chrome", () => {
    render(<SyncReportBanner report={REPORT} locale="fr-FR" />);
    expect(screen.getByText("Dernière synchronisation")).toBeTruthy();
    expect(screen.getByText("3 nouvelles")).toBeTruthy();
  });

  it("makes 'to review' a button that jumps to the review item", () => {
    const jumps: string[] = [];
    render(
      <SyncReportBanner report={REPORT} locale="en-US" onFocusItem={(id) => jumps.push(id)} />,
    );
    const btn = screen.getByRole("button", { name: /to review/i });
    fireEvent.click(btn);
    expect(jumps).toEqual(["G1"]); // the only review-flagged added entry
  });

  it("summarizes additions by section above the threshold instead of listing them", () => {
    const many: SyncReport = {
      ...REPORT,
      addedTotal: 20,
      reviewCandidates: 0,
      added: [
        ...Array.from({ length: 12 }, (_, i) => ({
          sectionType: "publications" as const,
          itemId: `P${i}`,
          title: `Paper ${i}`,
        })),
        ...Array.from({ length: 8 }, (_, i) => ({
          sectionType: "grants" as const,
          itemId: `G${i}`,
          title: `Grant ${i}`,
        })),
      ],
    };
    const { container } = render(<SyncReportBanner report={many} locale="en-US" />);
    fireEvent.click(screen.getByText("Show what’s new"));
    const summary = container.querySelector(".sync-report-summary");
    expect(summary?.textContent).toMatch(/12/);
    expect(summary?.textContent).toMatch(/8/);
    // Per-section counts, not a 20-row flat list.
    expect(screen.queryByText(/Paper 0/)).toBeNull();
  });

  it("appends '+N more' when additions exceed the stored sample", () => {
    const big: SyncReport = {
      ...REPORT,
      addedTotal: 70,
      reviewCandidates: 0,
      added: Array.from({ length: 50 }, (_, i) => ({
        sectionType: "publications" as const,
        itemId: `W${i}`,
        title: `W${i}`,
      })),
    };
    const { container } = render(<SyncReportBanner report={big} locale="en-US" />);
    fireEvent.click(screen.getByText("Show what’s new"));
    expect(container.querySelector(".sync-report-summary")?.textContent).toMatch(/20 more/); // 70 − 50
  });
});
