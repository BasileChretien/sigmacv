// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import VersionsMenu from "@/components/VersionsMenu";
import VersionsControls from "@/components/VersionsControls";

const SNAP = {
  id: "snap1",
  version: 1,
  label: "Tenure review",
  createdAt: "2026-09-04T10:00:00.000Z",
  token: "abcdefghijklmnopqrstuvwx",
  isPublic: false,
  doi: null,
  doiState: "none",
};

type Handler = (url: string, init?: RequestInit) => { status: number; body?: unknown };
let handler: Handler;

function jsonResponse(status: number, body: unknown = {}): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as unknown as Response;
}

beforeEach(() => {
  handler = () => ({ status: 200, body: { snapshots: [SNAP], doiMintingEnabled: false, max: 20 } });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init?: RequestInit) => {
      const r = handler(url, init);
      return jsonResponse(r.status, r.body);
    }),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("VersionsControls", () => {
  it("lists the frozen versions and freezes a new one", async () => {
    const calls: Array<[string, RequestInit | undefined]> = [];
    handler = (url, init) => {
      calls.push([url, init]);
      if (init?.method === "POST") {
        return {
          status: 201,
          body: { snapshot: { ...SNAP, id: "snap2", version: 2, label: "Grant" } },
        };
      }
      return { status: 200, body: { snapshots: [SNAP], doiMintingEnabled: false, max: 20 } };
    };
    render(<VersionsControls locale="en-US" published={true} slug="basile-x" />);
    await screen.findByText("Tenure review");
    expect(screen.getByText("v1")).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText(/Label/), { target: { value: "Grant" } });
    fireEvent.click(screen.getByText("Freeze this version"));
    await screen.findByText("Grant");
    expect(screen.getAllByTestId("version-row")).toHaveLength(2);
    const post = calls.find(([, init]) => init?.method === "POST")!;
    expect(post[0]).toBe("/api/cv/snapshots");
    expect(JSON.parse(post[1]!.body as string)).toEqual({ label: "Grant" });
  });

  it("disables Mint DOI with the 'not configured' hint when the server has no credentials", async () => {
    render(<VersionsControls locale="en-US" published={true} slug="basile-x" />);
    await screen.findByText("Tenure review");
    const mint = screen.getByText("Mint DOI") as HTMLButtonElement;
    expect(mint.disabled).toBe(true);
    expect(mint.title).toBe("DOI minting is not configured on this server.");
  });

  it("with minting enabled, requires the version to be public first, then mints", async () => {
    let snap = { ...SNAP };
    handler = (url, init) => {
      if (init?.method === "PATCH") {
        snap = { ...snap, isPublic: true };
        return { status: 200, body: { snapshot: snap } };
      }
      if (init?.method === "POST" && url.endsWith("/mint")) {
        return { status: 200, body: { doi: "10.12345/abcd", doiState: "minted" } };
      }
      return { status: 200, body: { snapshots: [snap], doiMintingEnabled: true, max: 20 } };
    };
    render(<VersionsControls locale="en-US" published={true} slug="basile-x" />);
    await screen.findByText("Tenure review");
    const mint = screen.getByText("Mint DOI") as HTMLButtonElement;
    expect(mint.disabled).toBe(true);
    expect(mint.title).toBe("Make the version public first to mint a DOI.");

    fireEvent.click(screen.getByLabelText("Public link"));
    await waitFor(() =>
      expect((screen.getByText("Mint DOI") as HTMLButtonElement).disabled).toBe(false),
    );
    // Public → the copy/open links appear.
    expect(screen.getByText("Copy link")).toBeTruthy();
    expect((screen.getByText("Open") as HTMLAnchorElement).href).toContain(
      "/p/basile-x/v/abcdefghijklmnopqrstuvwx",
    );

    fireEvent.click(screen.getByText("Mint DOI"));
    await screen.findByText("doi:10.12345/abcd");
    expect(screen.queryByText("Mint DOI")).toBeNull();
    // A minted version can no longer be made private.
    expect((screen.getByLabelText("Public link") as HTMLInputElement).disabled).toBe(true);
  });

  it("deletes in two steps and reports a failed mint", async () => {
    let deleted = false;
    handler = (url, init) => {
      if (init?.method === "DELETE") {
        deleted = true;
        return { status: 200, body: { ok: true } };
      }
      if (init?.method === "POST" && url.endsWith("/mint"))
        return { status: 502, body: { error: "mint-failed" } };
      return {
        status: 200,
        body: { snapshots: [{ ...SNAP, isPublic: true }], doiMintingEnabled: true, max: 20 },
      };
    };
    render(<VersionsControls locale="en-US" published={true} slug="basile-x" />);
    await screen.findByText("Tenure review");
    fireEvent.click(screen.getByText("Mint DOI"));
    await screen.findByText("DOI minting failed. You can try again.");

    fireEvent.click(screen.getByText("Delete"));
    expect(deleted).toBe(false);
    fireEvent.click(screen.getByText("Confirm delete"));
    await waitFor(() => expect(screen.queryByTestId("version-row")).toBeNull());
    expect(deleted).toBe(true);
    expect(screen.getByText("No frozen versions yet.")).toBeTruthy();
  });

  it("explains that sharing needs the live page, and shows the cap + load errors", async () => {
    handler = () => ({
      status: 200,
      body: {
        snapshots: Array.from({ length: 2 }, (_, i) => ({ ...SNAP, id: `s${i}`, version: i + 1 })),
        doiMintingEnabled: false,
        max: 2,
      },
    });
    render(<VersionsControls locale="en-US" published={false} slug={null} />);
    await screen.findAllByTestId("version-row");
    expect(screen.getByText("Publish your live page to share frozen versions.")).toBeTruthy();
    expect(screen.getByText(/reached the limit of 2 versions/)).toBeTruthy();
    expect((screen.getByText("Freeze this version") as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByText("Copy link")).toBeNull();
    cleanup();

    handler = () => ({ status: 500 });
    render(<VersionsControls locale="en-US" published={true} slug="basile-x" />);
    await screen.findByText("Could not load versions.");
  });
});

describe("VersionsMenu", () => {
  it("opens the popover from the top-bar trigger", async () => {
    render(<VersionsMenu locale="fr-FR" published={true} slug="basile-x" />);
    const trigger = screen.getByRole("button", { name: /Versions/ });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    expect(await screen.findByRole("dialog", { name: "Versions" })).toBeTruthy();
    await screen.findByText("Tenure review");
    expect(screen.getByText("Figer cette version")).toBeTruthy();
  });
});
