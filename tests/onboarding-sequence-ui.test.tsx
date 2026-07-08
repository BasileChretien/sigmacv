// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import CvWorkspace from "@/components/CvWorkspace";
import { COACHMARK_DISMISS_KEY } from "@/components/DisambiguationCoachmark";
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

  it("advances sync-report → coachmark, then stops (no publish nudge in onboarding)", async () => {
    render(<CvWorkspace {...baseProps} />);
    // 1) sync report → dismiss → coachmark appears
    await waitFor(() => expect(document.querySelector(".sync-report-banner")).toBeTruthy());
    fireEvent.click(screen.getByLabelText("Dismiss"));
    await waitFor(() => expect(document.querySelector(".coachmark")).toBeTruthy());
    expect(document.querySelector(".sync-report-banner")).toBeNull();
    expect(document.querySelector(".publish-nudge")).toBeNull();

    // 2) coachmark → dismiss → no further prompt; the publish nudge is no longer
    //    part of onboarding (it now fires after a successful export instead).
    fireEvent.click(screen.getByText("Got it"));
    await waitFor(() => expect(document.querySelector(".coachmark")).toBeNull());
    expect(document.querySelector(".publish-nudge")).toBeNull();
  });
});

describe("CvWorkspace — publish nudge fires after a document export", () => {
  const realFetch = global.fetch;
  const realCreate = (URL as { createObjectURL?: unknown }).createObjectURL;
  const realRevoke = (URL as { revokeObjectURL?: unknown }).revokeObjectURL;

  beforeEach(() => {
    // Stub the export download plumbing (jsdom implements neither).
    (URL as unknown as { createObjectURL: () => string }).createObjectURL = () => "blob:mock";
    (URL as unknown as { revokeObjectURL: () => void }).revokeObjectURL = () => {};
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("/api/cv/export/")) {
        return {
          ok: true,
          blob: async () => new Blob(["%PDF"], { type: "application/pdf" }),
          headers: {
            get: (h: string) =>
              h === "Content-Disposition" ? 'attachment; filename="cv.pdf"' : null,
          },
        } as unknown as Response;
      }
      // Live-preview (and anything else) — best-effort, return empty html.
      return {
        ok: true,
        json: async () => ({ html: "" }),
        headers: { get: () => null },
      } as unknown as Response;
    }) as typeof fetch;
  });

  afterEach(() => {
    global.fetch = realFetch;
    (URL as { createObjectURL?: unknown }).createObjectURL = realCreate;
    (URL as { revokeObjectURL?: unknown }).revokeObjectURL = realRevoke;
  });

  it("surfaces the publish nudge after a successful PDF export, when unpublished", async () => {
    // Quiet the onboarding prompts so the nudge isn't held back: no sync changes,
    // coachmark already dismissed.
    window.localStorage.setItem(COACHMARK_DISMISS_KEY, "1");
    render(
      <CvWorkspace
        {...baseProps}
        initialSyncReport={{ ...CHANGED_REPORT, addedTotal: 0, removedTotal: 0, added: [] }}
      />,
    );
    // Nudge is hidden until an export arms it.
    await waitFor(() => expect(document.querySelector(".export-btn")).toBeTruthy());
    expect(document.querySelector(".publish-nudge")).toBeNull();

    fireEvent.click(document.querySelector(".export-btn") as HTMLButtonElement);

    await waitFor(() => expect(document.querySelector(".publish-nudge")).toBeTruthy(), {
      timeout: 3000,
    });
  });

  it("does NOT arm the nudge for a raw-data export (e.g. JSON)", async () => {
    window.localStorage.setItem(COACHMARK_DISMISS_KEY, "1");
    render(
      <CvWorkspace
        {...baseProps}
        initialSyncReport={{ ...CHANGED_REPORT, addedTotal: 0, removedTotal: 0, added: [] }}
      />,
    );
    await waitFor(() => expect(document.querySelector(".export-format")).toBeTruthy());
    // Switch the format to a non-document export, then export.
    fireEvent.change(document.querySelector(".export-format") as HTMLSelectElement, {
      target: { value: "json" },
    });
    fireEvent.click(document.querySelector(".export-btn") as HTMLButtonElement);

    // Give the export round-trip time to settle, then assert the nudge stayed away.
    await new Promise((r) => setTimeout(r, 200));
    expect(document.querySelector(".publish-nudge")).toBeNull();
  });
});
