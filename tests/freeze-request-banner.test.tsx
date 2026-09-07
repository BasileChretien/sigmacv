// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import FreezeRequestBanner from "@/components/FreezeRequestBanner";

type Handler = (url: string, init?: RequestInit) => { status: number; body?: unknown };
let handler: Handler;
let calls: Array<[string, RequestInit | undefined]>;

const SNAPSHOT = {
  id: "snap9",
  version: 3,
  label: "HCERES 2027",
  createdAt: "2026-09-07T10:00:00.000Z",
  token: "abcdefghijklmnopqrstuvwx",
  isPublic: false,
  doi: null,
  doiState: "none",
  readerMode: true,
  contentHash: null,
};

function setUrl(query: string) {
  window.history.replaceState(null, "", `/cv${query}`);
}

beforeEach(() => {
  calls = [];
  handler = () => ({ status: 201, body: { snapshot: SNAPSHOT } });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push([url, init]);
      const r = handler(url, init);
      return new Response(JSON.stringify(r.body ?? {}), { status: r.status });
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  setUrl("");
});

describe("FreezeRequestBanner (stateless request link)", () => {
  it("renders nothing without a request in the URL", () => {
    setUrl("?since=2020");
    const { container } = render(
      <FreezeRequestBanner locale="en-US" published={true} slug="basile-x" />,
    );
    expect(container.querySelector('[data-testid="freeze-request"]')).toBeNull();
  });

  it("states what the link asks for — shape, preset, date, suggested label — and that nothing was sent", () => {
    setUrl("?freeze=institutional-assessment&preset=reader&label=HCERES%202027&by=2026-10-01");
    render(<FreezeRequestBanner locale="en-US" published={true} slug="basile-x" />);
    const banner = screen.getByTestId("freeze-request");
    expect(banner.textContent).toContain("Institutional assessment (HCERES / REF-style)");
    expect(banner.textContent).toContain("Reader view (for assessors)");
    expect(banner.textContent).toContain("Requested for October 1, 2026.");
    expect(banner.textContent).toContain("Suggested label:");
    expect(banner.textContent).toContain("HCERES 2027");
    expect(banner.textContent).toContain("Nothing has been sent to whoever made the link");
    // The reader-view hint spells out what becomes visible.
    expect(banner.textContent).toContain("has no standard view");
  });

  it("freezes with exactly the allow-listed fields, shows the link when published, and drops the params", async () => {
    setUrl("?freeze=institutional-assessment&preset=reader&label=HCERES%202027&showMetrics=1");
    render(<FreezeRequestBanner locale="en-US" published={true} slug="basile-x" />);
    fireEvent.click(screen.getByText("Freeze this version"));
    await screen.findByText(/Frozen as version 3\./);
    expect(calls).toHaveLength(1);
    expect(calls[0]![0]).toBe("/api/cv/snapshots");
    expect(JSON.parse(calls[0]![1]!.body as string)).toEqual({
      label: "HCERES 2027",
      modelId: "institutional-assessment",
      preset: "reader",
    });
    const link = screen.getByRole("link") as HTMLAnchorElement;
    expect(link.href).toContain("/p/basile-x/v/abcdefghijklmnopqrstuvwx");
    // The request is answered: its params are gone (unrelated ones stay), so a
    // reload will not re-offer it.
    expect(window.location.search).toBe("?showMetrics=1");
  });

  it("uses the model name as the label when the link suggests none, and hints when unpublished", async () => {
    setUrl("?freeze=erc&preset=hiring");
    render(<FreezeRequestBanner locale="en-US" published={false} slug={null} />);
    expect(screen.getByTestId("freeze-request").textContent).toContain("Hiring panel");
    fireEvent.click(screen.getByText("Freeze this version"));
    await screen.findByText(/Frozen as version 3\./);
    expect(JSON.parse(calls[0]![1]!.body as string)).toEqual({
      label: "ERC (Starting / Consolidator / Advanced)",
      modelId: "erc",
      preset: "hiring",
    });
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByTestId("freeze-request").textContent).toMatch(/publish/i);
  });

  it("'Not now' hides the banner and strips only the request params", () => {
    setUrl("?since=2020&freeze=1&preset=reader&label=x&by=2026-10-01");
    render(<FreezeRequestBanner locale="en-US" published={true} slug="basile-x" />);
    expect(screen.getByTestId("freeze-request").textContent).toContain("your current layout");
    fireEvent.click(screen.getByText("Not now"));
    expect(screen.queryByTestId("freeze-request")).toBeNull();
    expect(window.location.search).toBe("?since=2020");
  });

  it("reports a failed freeze without losing the request", async () => {
    setUrl("?freeze=erc");
    handler = () => ({ status: 500, body: { error: "x" } });
    render(<FreezeRequestBanner locale="en-US" published={true} slug="basile-x" />);
    fireEvent.click(screen.getByText("Freeze this version"));
    await screen.findByText(/Something went wrong/);
    expect(screen.getByText("Freeze this version")).toBeTruthy();
  });
});
