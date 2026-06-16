// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import CvWorkspace from "@/components/CvWorkspace";
import { t } from "@/lib/i18n";

// Minimal props to mount the workspace with NO CV (the first-run surface). The
// editor/preview/onboarding banners only render when a CV exists, so the null-CV
// branch is self-contained.
const baseProps = {
  initialCv: null,
  availableStyles: ["apa"],
  userName: "Ada Lovelace",
  researchConsent: false,
  researchEnabled: false,
  published: false,
  publicSlug: null,
  publicIndexable: false,
  signOutAction: async () => {},
};

afterEach(cleanup);

describe("CvWorkspace — first-run empty vs. error state", () => {
  it("shows the neutral empty state when no sync has failed", () => {
    const { container } = render(<CvWorkspace {...baseProps} />);
    expect(screen.getByText(t("en-US", "emptyTitle"))).toBeTruthy();
    expect(container.querySelector(".cv-empty-error")).toBeNull();
    // The primary action invites a first sync.
    expect(screen.getByText(t("en-US", "syncFromOpenAlex"))).toBeTruthy();
  });

  it("shows a DISTINCT, retryable error state when the first auto-sync failed", () => {
    const { container } = render(<CvWorkspace {...baseProps} initialSyncFailed />);
    // Distinct heading + alert role, NOT the neutral "no CV yet" copy.
    const errorBox = container.querySelector(".cv-empty-error");
    expect(errorBox).toBeTruthy();
    expect(errorBox?.getAttribute("role")).toBe("alert");
    expect(screen.getByText(t("en-US", "syncErrorTitle"))).toBeTruthy();
    expect(screen.queryByText(t("en-US", "emptyTitle"))).toBeNull();
    // The action is a retry, not a first-time "Sync from OpenAlex".
    expect(screen.getByText(t("en-US", "syncRetry"))).toBeTruthy();
    expect(screen.queryByText(t("en-US", "syncFromOpenAlex"))).toBeNull();
  });
});
