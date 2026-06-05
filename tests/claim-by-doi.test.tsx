// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ClaimByDoi from "@/components/ClaimByDoi";
import type { CanonicalCv } from "@/lib/canonical/schema";

let fetchMock: ReturnType<typeof vi.fn>;
beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
});

function reply(body: unknown, ok = true) {
  fetchMock.mockResolvedValueOnce({ ok, json: async () => body });
}

const fakeCv = { id: "cv1" } as unknown as CanonicalCv;
const setDoi = (v: string) =>
  fireEvent.change(screen.getByLabelText("Add a publication by DOI"), { target: { value: v } });

describe("ClaimByDoi", () => {
  it("previews then adds an identifier-matched work (no author picker)", async () => {
    const onAdded = vi.fn();
    render(<ClaimByDoi locale="en-US" onAdded={onAdded} />);
    setDoi("10.1/x");
    reply({
      found: true,
      alreadyInCv: false,
      title: "My paper",
      year: 2021,
      authors: [{ position: 1, name: "Me", isSelfById: true }],
      idMatchedIndex: 0,
    });
    fireEvent.click(screen.getByText("Find"));
    await waitFor(() => expect(screen.getByText(/My paper/)).toBeTruthy());
    expect(screen.queryByText("Which author are you?")).toBeNull();

    reply({ added: true, alreadyInCv: false, cv: fakeCv });
    fireEvent.click(screen.getByText("Add"));
    await waitFor(() => expect(onAdded).toHaveBeenCalledWith(fakeCv));
    const addBody = JSON.parse(fetchMock.mock.calls[1]![1].body as string);
    expect(addBody).toMatchObject({ doi: "10.1/x", confirm: true });
    expect(addBody.selfAuthorIndex).toBeUndefined();
  });

  it("requires picking an author when there is no identifier match", async () => {
    const onAdded = vi.fn();
    render(<ClaimByDoi locale="en-US" onAdded={onAdded} />);
    setDoi("10.1/y");
    reply({
      found: true,
      alreadyInCv: false,
      title: "Ambiguous",
      authors: [
        { position: 1, name: "Alice", isSelfById: false },
        { position: 2, name: "Wei Zhang", isSelfById: false },
      ],
      idMatchedIndex: -1,
    });
    fireEvent.click(screen.getByText("Find"));
    await waitFor(() => expect(screen.getByText("Which author are you?")).toBeTruthy());

    fireEvent.click(screen.getByLabelText("Wei Zhang"));
    reply({ added: true, alreadyInCv: false, cv: fakeCv });
    fireEvent.click(screen.getByText("Add"));
    await waitFor(() => expect(onAdded).toHaveBeenCalled());
    const addBody = JSON.parse(fetchMock.mock.calls[1]![1].body as string);
    expect(addBody.selfAuthorIndex).toBe(1); // 0-based index of "Wei Zhang"
  });

  it("shows a not-found message and never calls onAdded", async () => {
    const onAdded = vi.fn();
    render(<ClaimByDoi locale="en-US" onAdded={onAdded} />);
    setDoi("10.0/none");
    reply({ found: false, alreadyInCv: false, authors: [], idMatchedIndex: -1 });
    fireEvent.click(screen.getByText("Find"));
    await waitFor(() => expect(screen.getByText(/Not found in OpenAlex/)).toBeTruthy());
    expect(onAdded).not.toHaveBeenCalled();
  });
});
