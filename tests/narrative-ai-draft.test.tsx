// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import NarrativeAiDraft from "@/components/NarrativeAiDraft";
import type { CvSection } from "@/lib/canonical/schema";

const section = {
  id: "s",
  type: "narrative-knowledge",
  title: "Knowledge",
  visible: true,
  order: 0,
  items: [],
  body: "",
} as unknown as CvSection;

beforeEach(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function fillConfig() {
  fireEvent.change(screen.getByLabelText(/API base URL/i), {
    target: { value: "https://api.example.com/v1" },
  });
  fireEvent.change(screen.getByLabelText(/^Model$/i), { target: { value: "some-model" } });
  fireEvent.change(screen.getByLabelText(/^API key$/i), { target: { value: "sk-user" } });
}

describe("NarrativeAiDraft (bring-your-own-key)", () => {
  it("collects the user's own provider config, sends it, and inserts the labelled draft", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ draft: "My key contributions." }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const onInsert = vi.fn();
    render(<NarrativeAiDraft section={section} locale="en-US" onInsert={onInsert} />);

    fireEvent.click(screen.getByText(/Draft with AI/));
    // No request until the user supplies their own key; the session-only note shows.
    expect(screen.getByText(/only in memory for this session/i)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();

    fillConfig();
    fireEvent.click(screen.getByText("Generate draft"));
    await waitFor(() => expect(screen.getByText(/verify and rewrite/)).toBeTruthy());

    // The user's own config is what's posted.
    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      sectionType: "narrative-knowledge",
      consented: true,
      baseUrl: "https://api.example.com/v1",
      model: "some-model",
      apiKey: "sk-user",
    });

    fireEvent.click(screen.getByText("Insert into section"));
    expect(onInsert).toHaveBeenCalledWith("My key contributions.");
  });

  it("remembers the endpoint + model but NEVER persists the API key", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ draft: "draft" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    render(<NarrativeAiDraft section={section} locale="en-US" onInsert={vi.fn()} />);

    fireEvent.click(screen.getByText(/Draft with AI/));
    fillConfig();
    fireEvent.click(screen.getByText("Generate draft"));
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    // Non-secret config is remembered for next time…
    expect(localStorage.getItem("sigmacv.ai.baseUrl")).toBe("https://api.example.com/v1");
    expect(localStorage.getItem("sigmacv.ai.model")).toBe("some-model");
    // …but the key is memory-only — no clear-text key at rest (CodeQL: cleartext storage).
    expect(localStorage.getItem("sigmacv.ai.apiKey")).toBeNull();
  });

  it("pre-fills editable Mistral defaults so only a key is required", async () => {
    render(<NarrativeAiDraft section={section} locale="en-US" onInsert={vi.fn()} />);
    fireEvent.click(screen.getByText(/Draft with AI/));
    await waitFor(() =>
      expect((screen.getByLabelText(/API base URL/i) as HTMLInputElement).value).toBe(
        "https://api.mistral.ai/v1",
      ),
    );
    expect((screen.getByLabelText(/^Model$/i) as HTMLInputElement).value).toBe("open-mistral-nemo");
    // The key is NOT defaulted, so Generate stays disabled until it's entered.
    expect((screen.getByLabelText(/^API key$/i) as HTMLInputElement).value).toBe("");
    expect((screen.getByText("Generate draft") as HTMLButtonElement).disabled).toBe(true);
  });

  it("shows a friendly, retryable error on failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "Your key was rejected." }), {
        status: 422,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<NarrativeAiDraft section={section} locale="en-US" onInsert={vi.fn()} />);
    fireEvent.click(screen.getByText(/Draft with AI/));
    fillConfig();
    fireEvent.click(screen.getByText("Generate draft"));
    await waitFor(() => expect(screen.getByText("Your key was rejected.")).toBeTruthy());
    // Back on the (pre-filled) config form so the user can fix + retry.
    expect(screen.getByText("Generate draft")).toBeTruthy();
  });
});
