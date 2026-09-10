// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import IndexingPrompt from "@/components/IndexingPrompt";
import { indexingPromptKey } from "@/lib/cv/indexingPrompt";
import type { PublishSnapshot } from "@/lib/cv/institutionPrompt";
import { indexingPromptStrings } from "@/lib/i18n/indexingPrompt";

vi.mock("@/lib/analytics/track", () => ({ trackEvent: vi.fn() }));
vi.mock("@/components/menuTriggers", () => ({
  PUBLISH_TRIGGER: "publish",
  openTopBarMenu: vi.fn(),
}));
import { trackEvent } from "@/lib/analytics/track";

const s = indexingPromptStrings("en-US");
const fetchMock = vi.fn();

function snapshot(over: Partial<PublishSnapshot> = {}): PublishSnapshot {
  return {
    published: true,
    slug: "basile-ab12",
    indexable: false,
    listUnderAffiliation: false,
    affiliationRorId: null,
    institutionPage: {
      showOnInstitutionPage: false,
      consentedRorIds: [],
      currentAffiliations: [],
      visibleCurrentRorIds: [],
      lapsedRorIds: [],
      shareReconciliationRows: false,
    },
    ...over,
  };
}
const answer = {
  published: true,
  publicSlug: "basile-ab12",
  indexable: true,
  listUnderAffiliation: false,
  affiliationRorId: null,
  showOnInstitutionPage: false,
  consentedRorIds: [],
  currentAffiliations: [],
  visibleCurrentRorIds: [],
  lapsedRorIds: [],
  shareReconciliationRows: false,
};

beforeEach(() => {
  window.localStorage.clear();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => answer });
  vi.stubGlobal("fetch", fetchMock);
  vi.mocked(trackEvent).mockClear();
});
afterEach(cleanup);

describe("IndexingPrompt", () => {
  it("asks once for a live, un-indexable page: two equal buttons, nothing pre-ticked, a separate-choice note", async () => {
    render(<IndexingPrompt locale="en-US" state={snapshot()} onPublishStateChange={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId("indexing-prompt")).toBeTruthy());
    expect(screen.getByRole("heading", { name: s.heading })).toBeTruthy();
    expect(screen.getByText(s.separate)).toBeTruthy();
    expect(screen.getByTestId("indexing-prompt-yes").textContent).toBe(s.yes);
    expect(screen.getByTestId("indexing-prompt-not-now").textContent).toBe(s.notNow);
    expect(document.querySelector("input[type=checkbox]")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stays silent when indexable, unpublished, suppressed, or already answered", async () => {
    const cases = [
      { state: snapshot({ indexable: true }) },
      { state: snapshot({ published: false, slug: null }) },
      { state: snapshot(), suppressed: true },
    ];
    for (const c of cases) {
      const { unmount } = render(
        <IndexingPrompt locale="en-US" state={c.state} suppressed={c.suppressed} onPublishStateChange={vi.fn()} />,
      );
      await new Promise((r) => setTimeout(r, 0));
      expect(screen.queryByTestId("indexing-prompt")).toBeNull();
      unmount();
    }
    window.localStorage.setItem(indexingPromptKey("basile-ab12"), "1");
    render(<IndexingPrompt locale="en-US" state={snapshot()} onPublishStateChange={vi.fn()} />);
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByTestId("indexing-prompt")).toBeNull();
  });

  it("'Not now' sends nothing and is remembered for this page", async () => {
    render(<IndexingPrompt locale="en-US" state={snapshot()} onPublishStateChange={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId("indexing-prompt-not-now")).toBeTruthy());
    fireEvent.click(screen.getByTestId("indexing-prompt-not-now"));
    await waitFor(() => expect(screen.queryByTestId("indexing-prompt")).toBeNull());
    expect(fetchMock).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(indexingPromptKey("basile-ab12"))).toBe("1");
  });

  it("'Yes' posts the full state with indexing on, updates the host, tracks, remembers, and confirms", async () => {
    const onChange = vi.fn();
    render(<IndexingPrompt locale="en-US" state={snapshot()} onPublishStateChange={onChange} />);
    await waitFor(() => expect(screen.getByTestId("indexing-prompt-yes")).toBeTruthy());
    fireEvent.click(screen.getByTestId("indexing-prompt-yes"));
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe(s.done));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as { body: string }).body) as Record<string, unknown>;
    expect(body).toMatchObject({ published: true, indexable: true, listUnderAffiliation: false });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ indexable: true }));
    expect(trackEvent).toHaveBeenCalledWith("Publish", { indexable: true });
    expect(window.localStorage.getItem(indexingPromptKey("basile-ab12"))).toBe("1");
    // The ask is gone; the confirmation and a Change link remain.
    expect(screen.queryByTestId("indexing-prompt-yes")).toBeNull();
  });

  it("a failed 'Yes' shows the publish error, keeps asking, and remembers nothing", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });
    render(<IndexingPrompt locale="en-US" state={snapshot()} onPublishStateChange={vi.fn()} />);
    await waitFor(() => expect(screen.getByTestId("indexing-prompt-yes")).toBeTruthy());
    fireEvent.click(screen.getByTestId("indexing-prompt-yes"));
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect(screen.getByTestId("indexing-prompt-yes")).toBeTruthy();
    expect(window.localStorage.getItem(indexingPromptKey("basile-ab12"))).toBeNull();
  });
});
