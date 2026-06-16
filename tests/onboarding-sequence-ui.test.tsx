// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import CvWorkspace from "@/components/CvWorkspace";
import { CanonicalCvSchema, type CanonicalCv } from "@/lib/canonical/schema";
import type { SyncReport } from "@/lib/cv/syncReport";

afterEach(cleanup);
beforeEach(() => window.localStorage.clear());

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
        items: [
          {
            id: "W1",
            source: "openalex",
            sourceId: "https://openalex.org/W1",
            csl: { id: "W1", type: "article-journal", title: "A paper" },
            included: true,
            notMine: false,
            order: 0,
            authoredBySelf: true,
            selfNameVariants: ["Chrétien"],
            meta: { year: 2020 },
          },
        ],
      },
    ],
    provenance: { generatedAt: "2026-06-11T00:00:00.000Z", sources: ["openalex"] },
  });
}

const CHANGED_REPORT: SyncReport = {
  syncedAt: "2026-06-16T10:00:00.000Z",
  initial: false,
  addedTotal: 2,
  removedTotal: 0,
  added: [{ sectionType: "publications", itemId: "W1", title: "A paper" }],
  reviewCandidates: 0,
};

const baseProps = {
  initialCv: makeCv(),
  initialSyncReport: CHANGED_REPORT,
  availableStyles: ["apa"],
  userName: "Basile Chrétien",
  researchConsent: false,
  researchEnabled: false,
  published: false,
  publicSlug: null,
  publicIndexable: false,
  signOutAction: async () => {},
};

describe("CvWorkspace — onboarding prompts show one at a time", () => {
  it("shows only the sync-report banner first (coachmark + nudge held back)", async () => {
    render(<CvWorkspace {...baseProps} />);
    await waitFor(() => expect(document.querySelector(".sync-report-banner")).toBeTruthy());
    expect(document.querySelector(".coachmark")).toBeNull();
    expect(document.querySelector(".publish-nudge")).toBeNull();
  });

  it("advances to the next prompt as each is dismissed", async () => {
    render(<CvWorkspace {...baseProps} />);
    // 1) sync report → dismiss → coachmark appears (nudge still held back)
    await waitFor(() => expect(document.querySelector(".sync-report-banner")).toBeTruthy());
    fireEvent.click(screen.getByLabelText("Dismiss"));
    await waitFor(() => expect(document.querySelector(".coachmark")).toBeTruthy());
    expect(document.querySelector(".sync-report-banner")).toBeNull();
    expect(document.querySelector(".publish-nudge")).toBeNull();

    // 2) coachmark → dismiss → publish nudge appears
    fireEvent.click(screen.getByText("Got it"));
    await waitFor(() => expect(document.querySelector(".publish-nudge")).toBeTruthy());
    expect(document.querySelector(".coachmark")).toBeNull();
  });
});
