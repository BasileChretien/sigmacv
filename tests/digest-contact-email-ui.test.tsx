// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import AccountControls from "@/components/AccountControls";

afterEach(cleanup);

const fetchMock = vi.fn();
beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true }) });
  vi.stubGlobal("fetch", fetchMock);
});

describe("digest contact-email field (gated behind the Email-updates toggle)", () => {
  it("is hidden while the toggle is off and appears when switched on", () => {
    render(<AccountControls researchConsent={false} digestOptIn={false} locale="en-US" />);
    expect(screen.queryByLabelText("Send digests to")).toBeNull();
    fireEvent.click(screen.getByLabelText("Email updates"));
    expect(screen.getByLabelText("Send digests to")).toBeTruthy();
    // No address anywhere yet → the explanatory hint shows.
    expect(screen.getByText("Add an email address to receive digests.")).toBeTruthy();
  });

  it("shows the account-email fallback notice when one exists", () => {
    render(
      <AccountControls
        researchConsent={false}
        digestOptIn={true}
        accountEmail="login@uni.example"
        locale="en-US"
      />,
    );
    expect(
      screen.getByText("Digests will go to your account email (login@uni.example)."),
    ).toBeTruthy();
  });

  it("saving an address POSTs it and flips the status to pending", async () => {
    render(<AccountControls researchConsent={false} digestOptIn={true} locale="en-US" />);
    fireEvent.change(screen.getByLabelText("Send digests to"), {
      target: { value: "me@lab.example" },
    });
    fireEvent.click(screen.getByText("Confirm address"));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/account/contact-email",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse((fetchMock.mock.calls[0]![1] as { body: string }).body) as {
      email: string;
      locale: string;
    };
    expect(body).toEqual({ email: "me@lab.example", locale: "en-US" });
    expect(
      await screen.findByText("Confirmation sent — check that inbox and click the link."),
    ).toBeTruthy();
  });

  it("a verified address shows as confirmed", () => {
    render(
      <AccountControls
        researchConsent={false}
        digestOptIn={true}
        digestContactEmail="me@lab.example"
        digestContactEmailVerified={true}
        locale="en-US"
      />,
    );
    expect((screen.getByLabelText("Send digests to") as HTMLInputElement).value).toBe(
      "me@lab.example",
    );
    expect(screen.getByText("Confirmed")).toBeTruthy();
  });
});
