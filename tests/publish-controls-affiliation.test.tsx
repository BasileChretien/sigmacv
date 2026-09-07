// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import PublishControls from "@/components/PublishControls";
import { ui } from "@/lib/i18n/ui";

/**
 * "List under my current affiliation" — the per-CV opt-in that puts a CV into
 * the OAI-PMH `ror:<id>` set. It is a SEPARATE consent from search indexing:
 * it needs indexing on and a ROR-resolved current position, and turning
 * indexing off turns it off. The control must make all three facts visible.
 */

const u = ui("en-US");

const baseProps = {
  initialPublished: true,
  initialSlug: "ada-x7",
  initialIndexable: true,
  locale: "en-US",
  publicContact: { email: false, phone: false, location: false },
  onPublicContactChange: vi.fn(),
  onPublishStateChange: vi.fn(),
};

const fetchMock = vi.fn();

function respond(state: Record<string, unknown>) {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({
      published: true,
      publicSlug: "ada-x7",
      indexable: true,
      listUnderAffiliation: false,
      affiliationRorId: "04chrp450",
      ...state,
    }),
  });
}

function affiliationBox(): HTMLInputElement {
  return screen.getByLabelText(u.listUnderAffiliation) as HTMLInputElement;
}
function indexingBox(): HTMLInputElement {
  return screen.getByLabelText(u.allowIndexing) as HTMLInputElement;
}
function lastBody(): Record<string, unknown> {
  const init = fetchMock.mock.calls.at(-1)![1] as { body: string };
  return JSON.parse(init.body) as Record<string, unknown>;
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("PublishControls — list under my current affiliation", () => {
  it("is disabled with a hint when no current position resolves to a ROR record", () => {
    render(<PublishControls {...baseProps} initialAffiliationRorId={null} />);
    expect(affiliationBox().disabled).toBe(true);
    expect(affiliationBox().checked).toBe(false);
    expect(screen.getByText(u.listUnderAffiliationNoRor)).toBeTruthy();
  });

  it("a standing opt-in stays withdrawable even when no ROR key currently resolves", async () => {
    respond({ listUnderAffiliation: false, affiliationRorId: null });
    render(
      <PublishControls {...baseProps} initialAffiliationRorId={null} initialListUnderAffiliation />,
    );
    // Checked and NOT disabled: consent must be as easy to withdraw as to give.
    expect(affiliationBox().checked).toBe(true);
    expect(affiliationBox().disabled).toBe(false);
    await act(async () => {
      fireEvent.click(affiliationBox());
    });
    expect(lastBody()).toEqual({ published: true, indexable: true, listUnderAffiliation: false });
    expect(affiliationBox().checked).toBe(false);
    // Off with no key → back to the disabled state (nothing to opt into).
    expect(affiliationBox().disabled).toBe(true);
  });

  it("is enabled (and off by default) with a ROR-resolved current position", () => {
    render(<PublishControls {...baseProps} initialAffiliationRorId="04chrp450" />);
    expect(affiliationBox().disabled).toBe(false);
    expect(affiliationBox().checked).toBe(false);
    expect(screen.queryByText(u.listUnderAffiliationNoRor)).toBeNull();
    // The consent copy names the OAI-PMH endpoint and the ROR-keyed set.
    expect(screen.getByText(u.listUnderAffiliationBody)).toBeTruthy();
  });

  it("opting in posts the flag alongside indexing and mirrors the server's answer", async () => {
    respond({ listUnderAffiliation: true });
    render(<PublishControls {...baseProps} initialAffiliationRorId="04chrp450" />);
    await act(async () => {
      fireEvent.click(affiliationBox());
    });
    expect(lastBody()).toEqual({ published: true, indexable: true, listUnderAffiliation: true });
    expect(affiliationBox().checked).toBe(true);
    expect(baseProps.onPublishStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ indexable: true, listUnderAffiliation: true }),
    );
  });

  it("turning indexing off turns the affiliation listing off in the same request", async () => {
    respond({ indexable: false, listUnderAffiliation: false });
    render(
      <PublishControls
        {...baseProps}
        initialAffiliationRorId="04chrp450"
        initialListUnderAffiliation
      />,
    );
    expect(affiliationBox().checked).toBe(true);
    await act(async () => {
      fireEvent.click(indexingBox());
    });
    expect(lastBody()).toEqual({ published: true, indexable: false, listUnderAffiliation: false });
    expect(affiliationBox().checked).toBe(false);
    // Without indexing the opt-in is not offered at all (it requires indexing).
    expect(affiliationBox().disabled).toBe(true);
  });

  it("unpublishing clears indexing AND the affiliation listing", async () => {
    respond({ published: false, publicSlug: "ada-x7", indexable: false });
    render(
      <PublishControls
        {...baseProps}
        initialAffiliationRorId="04chrp450"
        initialListUnderAffiliation
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId("publish-toggle"));
    });
    expect(lastBody()).toEqual({ published: false, indexable: false, listUnderAffiliation: false });
  });
});
