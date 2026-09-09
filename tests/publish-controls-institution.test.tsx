// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import PublishControls from "@/components/PublishControls";
import { NO_INSTITUTION_PAGE, type InstitutionPageState } from "@/lib/cv/institutionConsent";
import { ui } from "@/lib/i18n/ui";

/**
 * "Show me on my institution's public page" — the fourth, separate consent,
 * PINNED to the ROR ids the researcher ticks among their visible current
 * positions. The control must: offer exactly those affiliations; post the
 * ticked ids (never let the server guess); say which institutions the CV is
 * listed under; re-ask (not move) when a consented affiliation lapsed; and
 * keep withdrawal possible in every state.
 */

const u = ui("en-US");
const NAGOYA = { rorId: "04chrp450", name: "Nagoya University" };
const CAEN = { rorId: "04d9jrx35", name: "CHU de Caen Normandie" };

function page(over: Partial<InstitutionPageState> = {}): InstitutionPageState {
  return { ...NO_INSTITUTION_PAGE, ...over };
}
const offered = (...affs: { rorId: string; name: string }[]) =>
  page({ currentAffiliations: affs, visibleCurrentRorIds: affs.map((a) => a.rorId) });

const baseProps = {
  initialPublished: true,
  initialSlug: "ada-x7",
  initialIndexable: true,
  initialAffiliationRorId: "04chrp450",
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
      ...NO_INSTITUTION_PAGE,
      ...state,
    }),
  });
}

function toggle(): HTMLInputElement {
  return screen.getByLabelText(u.showOnInstitutionPage) as HTMLInputElement;
}
function shareBox(): HTMLInputElement | null {
  return screen.queryByLabelText(u.shareReconciliationRows) as HTMLInputElement | null;
}
function pick(name: string): HTMLInputElement {
  return screen.getByLabelText(new RegExp(name)) as HTMLInputElement;
}
function indexingBox(): HTMLInputElement {
  return screen.getByLabelText(u.allowIndexing) as HTMLInputElement;
}
function removeButton(rorId: string): HTMLButtonElement {
  return screen.getByRole("button", {
    name: `${u.institutionPageRemove} — ROR ${rorId}`,
  }) as HTMLButtonElement;
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

describe("PublishControls — share my reconciliation rows (the second opt-in)", () => {
  it("is offered ONLY while the page consent is stored — not when absent, not while merely armed", async () => {
    render(<PublishControls {...baseProps} initialInstitutionPage={offered(NAGOYA, CAEN)} />);
    expect(shareBox()).toBeNull();
    await act(async () => {
      fireEvent.click(toggle());
    });
    // Armed, nothing stored: still not offered.
    expect(toggle().checked).toBe(true);
    expect(shareBox()).toBeNull();
    cleanup();
    render(
      <PublishControls
        {...baseProps}
        initialInstitutionPage={{
          ...offered(NAGOYA),
          showOnInstitutionPage: true,
          consentedRorIds: ["04chrp450"],
        }}
      />,
    );
    expect(shareBox()).not.toBeNull();
    expect(shareBox()!.checked).toBe(false);
    expect(screen.getByText(u.shareReconciliationRowsBody)).toBeTruthy();
  });

  it("posts only the flag (the stored institution choice is left as it is), then reflects the server's answer", async () => {
    const consented = {
      ...offered(NAGOYA),
      showOnInstitutionPage: true,
      consentedRorIds: ["04chrp450"],
    };
    respond({ ...consented, shareReconciliationRows: true });
    render(<PublishControls {...baseProps} initialInstitutionPage={consented} />);
    await act(async () => {
      fireEvent.click(shareBox()!);
    });
    expect(lastBody()).toEqual({
      published: true,
      indexable: true,
      listUnderAffiliation: false,
      shareReconciliationRows: true,
    });
    expect(shareBox()!.checked).toBe(true);
    expect(baseProps.onPublishStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        institutionPage: expect.objectContaining({ shareReconciliationRows: true }),
      }),
    );
    // Untick: the flag is posted false.
    respond({ ...consented, shareReconciliationRows: false });
    await act(async () => {
      fireEvent.click(shareBox()!);
    });
    expect(lastBody()).toMatchObject({ shareReconciliationRows: false });
    expect(shareBox()!.checked).toBe(false);
  });

  it("disappears when the page consent is withdrawn (the server clears it in the same write)", async () => {
    const consented = {
      ...offered(NAGOYA),
      showOnInstitutionPage: true,
      consentedRorIds: ["04chrp450"],
      shareReconciliationRows: true,
    };
    respond({ ...offered(NAGOYA), showOnInstitutionPage: false, consentedRorIds: [] });
    render(<PublishControls {...baseProps} initialInstitutionPage={consented} />);
    expect(shareBox()!.checked).toBe(true);
    await act(async () => {
      fireEvent.click(toggle());
    });
    expect(lastBody()).toMatchObject({ showOnInstitutionPage: false, consentedRorIds: [] });
    expect(shareBox()).toBeNull();
  });
});

describe("PublishControls — show me on my institution's page", () => {
  it("is disabled with a hint when no current position resolves to a ROR record, or indexing is off", () => {
    render(<PublishControls {...baseProps} initialInstitutionPage={page()} />);
    expect(toggle().disabled).toBe(true);
    expect(toggle().checked).toBe(false);
    expect(screen.getByText(u.institutionPageUnavailable)).toBeTruthy();
    cleanup();
    render(
      <PublishControls
        {...baseProps}
        initialIndexable={false}
        initialInstitutionPage={offered(NAGOYA)}
      />,
    );
    expect(toggle().disabled).toBe(true);
    expect(screen.getByText(u.institutionPageUnavailable)).toBeTruthy();
    // Without a picker there is no institution list at all.
    expect(screen.queryByText(u.institutionPagePick)).toBeNull();
  });

  it("shows the consent copy and the picker of visible current affiliations (name + ROR id), off by default", () => {
    render(<PublishControls {...baseProps} initialInstitutionPage={offered(NAGOYA, CAEN)} />);
    expect(toggle().disabled).toBe(false);
    expect(toggle().checked).toBe(false);
    expect(screen.getByText(u.showOnInstitutionPageBody)).toBeTruthy();
    expect(screen.queryByText(u.institutionPageUnavailable)).toBeNull();
    expect(pick("Nagoya University").checked).toBe(false);
    expect(pick("CHU de Caen Normandie").checked).toBe(false);
    // The ROR id is printed beside the name so the choice is identifier-precise.
    expect(screen.getByText(/04chrp450/)).toBeTruthy();
    // Ticking an institution is meaningless until the consent itself is given.
    expect(pick("Nagoya University").disabled).toBe(true);
  });

  it("with several affiliations, ticking the toggle only ARMS the picker (unticked, nothing posted) until one institution is ticked", async () => {
    render(<PublishControls {...baseProps} initialInstitutionPage={offered(NAGOYA, CAEN)} />);
    // No single-affiliation hint: there is a choice to make.
    expect(screen.queryByText(/Ticking this lists you under/)).toBeNull();
    await act(async () => {
      fireEvent.click(toggle());
    });
    // Nothing was consented to on the server — the toggle is armed locally.
    expect(fetchMock).not.toHaveBeenCalled();
    expect(toggle().checked).toBe(true);
    expect(screen.getByText(u.institutionPageArmedHint)).toBeTruthy();
    expect(pick("Nagoya University").disabled).toBe(false);
    expect(pick("Nagoya University").checked).toBe(false);
    expect(pick("CHU de Caen Normandie").checked).toBe(false);
    expect(screen.queryByText(/You are listed under/)).toBeNull();

    // Unticking a merely-armed toggle posts nothing and disarms the picker.
    await act(async () => {
      fireEvent.click(toggle());
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(toggle().checked).toBe(false);
    expect(pick("Nagoya University").disabled).toBe(true);
    expect(screen.queryByText(u.institutionPageArmedHint)).toBeNull();

    // Arm again, tick ONE institution: exactly that id is posted.
    respond({
      ...offered(NAGOYA, CAEN),
      showOnInstitutionPage: true,
      consentedRorIds: ["04chrp450"],
    });
    await act(async () => {
      fireEvent.click(toggle());
    });
    await act(async () => {
      fireEvent.click(pick("Nagoya University"));
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(lastBody()).toEqual({
      published: true,
      indexable: true,
      listUnderAffiliation: false,
      showOnInstitutionPage: true,
      consentedRorIds: ["04chrp450"],
    });
    expect(toggle().checked).toBe(true);
    expect(pick("Nagoya University").checked).toBe(true);
    expect(pick("CHU de Caen Normandie").checked).toBe(false);
    expect(screen.queryByText(u.institutionPageArmedHint)).toBeNull();
    expect(
      screen.getByText(u.institutionPageListedUnder.replace("{institutions}", "Nagoya University")),
    ).toBeTruthy();
    expect(baseProps.onPublishStateChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        institutionPage: expect.objectContaining({
          showOnInstitutionPage: true,
          consentedRorIds: ["04chrp450"],
        }),
      }),
    );
  });

  it("with exactly one affiliation, one click consents to it — and the copy says which", async () => {
    respond({ ...offered(NAGOYA), showOnInstitutionPage: true, consentedRorIds: ["04chrp450"] });
    render(<PublishControls {...baseProps} initialInstitutionPage={offered(NAGOYA)} />);
    expect(
      screen.getByText(u.institutionPageSingle.replace("{institution}", "Nagoya University")),
    ).toBeTruthy();
    await act(async () => {
      fireEvent.click(toggle());
    });
    expect(lastBody()).toMatchObject({
      showOnInstitutionPage: true,
      consentedRorIds: ["04chrp450"],
    });
    expect(toggle().checked).toBe(true);
    expect(pick("Nagoya University").checked).toBe(true);
    // Consented now: the "one click" hint has done its job.
    expect(screen.queryByText(/Ticking this lists you under/)).toBeNull();
  });

  it("a failed post while armed leaves the picker armed so the tick can be retried", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) });
    render(<PublishControls {...baseProps} initialInstitutionPage={offered(NAGOYA, CAEN)} />);
    await act(async () => {
      fireEvent.click(toggle());
    });
    await act(async () => {
      fireEvent.click(pick("Nagoya University"));
    });
    expect(screen.getByRole("alert").textContent).toBe(u.publishError);
    expect(toggle().checked).toBe(true);
    expect(pick("Nagoya University").disabled).toBe(false);
    expect(pick("Nagoya University").checked).toBe(false);
  });

  it("unticking one of two institutions posts the remaining id; unticking the last one is a withdrawal", async () => {
    const both = {
      ...offered(NAGOYA, CAEN),
      showOnInstitutionPage: true,
      consentedRorIds: ["04chrp450", "04d9jrx35"],
    };
    respond({ ...both, consentedRorIds: ["04d9jrx35"] });
    render(<PublishControls {...baseProps} initialInstitutionPage={both} />);
    await act(async () => {
      fireEvent.click(pick("Nagoya University"));
    });
    expect(lastBody()).toMatchObject({
      showOnInstitutionPage: true,
      consentedRorIds: ["04d9jrx35"],
    });
    expect(pick("Nagoya University").checked).toBe(false);
    expect(pick("CHU de Caen Normandie").checked).toBe(true);

    respond({ ...both, showOnInstitutionPage: false, consentedRorIds: [] });
    await act(async () => {
      fireEvent.click(pick("CHU de Caen Normandie"));
    });
    expect(lastBody()).toMatchObject({ showOnInstitutionPage: false, consentedRorIds: [] });
    expect(toggle().checked).toBe(false);
  });

  it("re-asks when a consented affiliation lapsed: names the new one; ticking it KEEPS the lapsed id (it resumes if current again)", async () => {
    // Consented at a previous institution (02kpeqv85), now at Nagoya only.
    const moved = {
      ...offered(NAGOYA),
      showOnInstitutionPage: true,
      consentedRorIds: ["02kpeqv85"],
      lapsedRorIds: ["02kpeqv85"],
    };
    respond({
      ...offered(NAGOYA),
      showOnInstitutionPage: true,
      consentedRorIds: ["02kpeqv85", "04chrp450"],
      lapsedRorIds: ["02kpeqv85"],
    });
    render(<PublishControls {...baseProps} initialInstitutionPage={moved} />);
    expect(
      screen.getByText(u.institutionPageLapsed.replace("{institutions}", "Nagoya University")),
    ).toBeTruthy();
    // Not listed anywhere right now: no "listed under" line — but the kept id
    // is visible, with its own Remove.
    expect(screen.queryByText(/You are listed under/)).toBeNull();
    expect(
      screen.getByText(u.institutionPageLapsedKept.replace("{rorId}", "02kpeqv85")),
    ).toBeTruthy();
    expect(removeButton("02kpeqv85")).toBeTruthy();
    expect(pick("Nagoya University").checked).toBe(false);
    await act(async () => {
      fireEvent.click(pick("Nagoya University"));
    });
    // The stored list plus the new tick: the lapsed id is kept, not silently dropped.
    expect(lastBody()).toMatchObject({
      showOnInstitutionPage: true,
      consentedRorIds: ["02kpeqv85", "04chrp450"],
    });
    expect(screen.queryByText(/Your current affiliation changed/)).toBeNull();
    expect(
      screen.getByText(u.institutionPageListedUnder.replace("{institutions}", "Nagoya University")),
    ).toBeTruthy();
  });

  it("a lapsed id is shown with its Remove even while another consent is active; removing it posts the remaining ids", async () => {
    const dual = {
      ...offered(NAGOYA),
      showOnInstitutionPage: true,
      consentedRorIds: ["04chrp450", "02kpeqv85"],
      lapsedRorIds: ["02kpeqv85"],
    };
    respond({ ...offered(NAGOYA), showOnInstitutionPage: true, consentedRorIds: ["04chrp450"] });
    render(<PublishControls {...baseProps} initialInstitutionPage={dual} />);
    // Listed under Nagoya, no re-ask (nothing unconfirmed) — yet the kept id is not invisible.
    expect(
      screen.getByText(u.institutionPageListedUnder.replace("{institutions}", "Nagoya University")),
    ).toBeTruthy();
    expect(screen.queryByText(/Your current affiliation changed/)).toBeNull();
    expect(
      screen.getByText(u.institutionPageLapsedKept.replace("{rorId}", "02kpeqv85")),
    ).toBeTruthy();
    await act(async () => {
      fireEvent.click(removeButton("02kpeqv85"));
    });
    expect(lastBody()).toMatchObject({
      showOnInstitutionPage: true,
      consentedRorIds: ["04chrp450"],
    });
    expect(screen.queryByText(/Kept from a former affiliation/)).toBeNull();
    expect(pick("Nagoya University").checked).toBe(true);
  });

  it("a lapsed consent with no ROR-linked current position shows the paused notice and stays withdrawable", async () => {
    const lapsed = page({
      showOnInstitutionPage: true,
      consentedRorIds: ["02kpeqv85"],
      lapsedRorIds: ["02kpeqv85"],
    });
    respond({ showOnInstitutionPage: false, consentedRorIds: [] });
    render(<PublishControls {...baseProps} initialInstitutionPage={lapsed} />);
    expect(screen.getByText(u.institutionPageLapsedNone)).toBeTruthy();
    expect(toggle().checked).toBe(true);
    expect(toggle().disabled).toBe(false);
    // Removing the only kept id is a withdrawal (nothing remains to be listed under).
    expect(removeButton("02kpeqv85")).toBeTruthy();
    await act(async () => {
      fireEvent.click(removeButton("02kpeqv85"));
    });
    expect(lastBody()).toMatchObject({ showOnInstitutionPage: false, consentedRorIds: [] });
    expect(toggle().checked).toBe(false);
    expect(toggle().disabled).toBe(true);
    expect(screen.queryByText(/Kept from a former affiliation/)).toBeNull();

    // The toggle itself withdraws too.
    cleanup();
    render(<PublishControls {...baseProps} initialInstitutionPage={lapsed} />);
    await act(async () => {
      fireEvent.click(toggle());
    });
    expect(lastBody()).toMatchObject({ showOnInstitutionPage: false, consentedRorIds: [] });
    expect(toggle().checked).toBe(false);
    expect(toggle().disabled).toBe(true);
  });

  it("turning indexing off does not mention the consent (the server clears it) and mirrors the cleared state", async () => {
    const consented = {
      ...offered(NAGOYA),
      showOnInstitutionPage: true,
      consentedRorIds: ["04chrp450"],
    };
    respond({ ...offered(NAGOYA), indexable: false });
    render(<PublishControls {...baseProps} initialInstitutionPage={consented} />);
    await act(async () => {
      fireEvent.click(indexingBox());
    });
    expect(lastBody()).toEqual({ published: true, indexable: false, listUnderAffiliation: false });
    expect(toggle().checked).toBe(false);
    expect(toggle().disabled).toBe(true);
  });
});
