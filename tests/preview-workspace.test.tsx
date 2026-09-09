// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const mocks = vi.hoisted(() => ({ trackEvent: vi.fn(), signIn: vi.fn() }));
// The sign-in server action and the iframe preview are out of scope here.
vi.mock("@/app/auth-actions", () => ({ signInWithOrcid: mocks.signIn }));
vi.mock("@/components/CvPreview", () => ({ default: () => null }));
vi.mock("@/lib/analytics/track", () => ({ trackEvent: mocks.trackEvent }));

import PreviewWorkspace from "@/components/PreviewWorkspace";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { projectCvForPreview } from "@/lib/cv/publicProjection";
import { previewStrings } from "@/lib/i18n/preview";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const s = previewStrings("en-US");

function cv() {
  return projectCvForPreview(
    buildCanonicalCv({
      id: "pw",
      resolved: {
        orcid: "0000-0002-7483-2489",
        authorIds: ["A5001069481"],
        displayName: "Basile Chrétien",
        metrics: { h_index: 12 },
      },
      works,
      now: "2026-06-02T00:00:00.000Z",
    }),
  );
}

function mount(publishedPath: string | null) {
  return render(
    <PreviewWorkspace
      initialCv={cv()}
      initialHtml="<p>first paint</p>"
      name="Basile Chrétien"
      locale="en-US"
      availableStyles={["apa"]}
      publishedPath={publishedPath}
    />,
  );
}

beforeEach(() => {
  mocks.trackEvent.mockReset();
});
afterEach(cleanup);

describe("PreviewWorkspace (third-party framing)", () => {
  it("frames an uncurated record as an automatic build and states the promise + objection route", () => {
    mount(null);
    const banner = screen.getByTestId("preview-banner");
    expect(banner.textContent).toContain(s.bannerAutomatic);
    expect(banner.textContent).toContain(s.promise);
    expect(banner.textContent).not.toContain(s.bannerPublished);
    expect(screen.queryByTestId("preview-published-link")).toBeNull();
    const object = screen.getByText(s.objectLink) as HTMLAnchorElement;
    expect(object.getAttribute("href")).toBe("/object");
  });

  it("points at the researcher's published page when one is indexable", () => {
    mount("/p/basile-chretien-ab12");
    const banner = screen.getByTestId("preview-banner");
    expect(banner.textContent).toContain(s.bannerPublished);
    expect(banner.textContent).not.toContain(s.bannerAutomatic);
    const link = screen.getByTestId("preview-published-link") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/p/basile-chretien-ab12");
    expect(link.textContent).toBe(s.ctaPublishedPage);
    fireEvent.click(link);
    expect(mocks.trackEvent).toHaveBeenCalledWith("Preview CTA", { action: "published-page" });
  });

  it("splits the calls to action: the owner signs in, a third party copies the link", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    mount(null);
    // Owner path.
    expect(screen.getByRole("button", { name: s.ctaKeep })).toBeTruthy();
    // Third-party path: clipboard only, then a transient confirmation.
    const copy = screen.getByTestId("preview-copy-link");
    expect(copy.textContent).toBe(s.ctaCopyLink);
    fireEvent.click(copy);
    expect(mocks.trackEvent).toHaveBeenCalledWith("Preview CTA", { action: "copy-link" });
    expect(writeText).toHaveBeenCalledWith(window.location.href);
    await waitFor(() => expect(copy.textContent).toBe(s.copied));
  });

  it("offers no figure control in the anonymous editor", () => {
    mount(null);
    expect(screen.queryByText(/Metrics & authorship/)).toBeNull();
    expect(screen.queryByLabelText(/citation counts/i)).toBeNull();
    expect(document.querySelector('option[value="citations"]')).toBeNull();
  });
});
