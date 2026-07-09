// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
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

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("NarrativeAiDraft", () => {
  it("gates on consent, then shows a labelled draft the user explicitly inserts", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify({ draft: "My key contributions." }), { status: 200 }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const onInsert = vi.fn();
    render(<NarrativeAiDraft section={section} locale="en-US" onInsert={onInsert} />);

    // idle → consent disclosure (names the EU processor); NO request yet.
    fireEvent.click(screen.getByText(/Draft with AI/));
    expect(screen.getByText(/Mistral AI/)).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();

    // consent → generate → labelled draft.
    fireEvent.click(screen.getByText("Generate draft"));
    await waitFor(() => expect(screen.getByText(/verify and rewrite/)).toBeTruthy());
    // The posted body carries the section type + an explicit consent flag.
    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      sectionType: "narrative-knowledge",
      consented: true,
    });

    // Explicit insert (never automatic).
    fireEvent.click(screen.getByText("Insert into section"));
    expect(onInsert).toHaveBeenCalledWith("My key contributions.");
  });

  it("shows a friendly, retryable error on failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ error: "The AI provider is unavailable." }), {
        status: 503,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<NarrativeAiDraft section={section} locale="en-US" onInsert={vi.fn()} />);
    fireEvent.click(screen.getByText(/Draft with AI/));
    fireEvent.click(screen.getByText("Generate draft"));
    await waitFor(() => expect(screen.getByText("The AI provider is unavailable.")).toBeTruthy());
    expect(screen.getByText("Regenerate")).toBeTruthy();
  });
});
