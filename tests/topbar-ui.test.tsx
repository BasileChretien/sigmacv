// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import TopBar from "@/components/TopBar";

const baseProps = {
  userName: "Ada Lovelace",
  locale: "en-US",
  status: "Saved.",
  saving: false,
  syncing: false,
  dirty: false,
  hasCv: true,
  onSync: vi.fn(),
  onSave: vi.fn(),
  exportFormat: "pdf" as const,
  onExportFormatChange: vi.fn(),
  onExport: vi.fn(),
  onChangeLocale: vi.fn(),
  published: false,
  publicSlug: null,
  publicIndexable: false,
  publicContact: { email: false, phone: false, location: false },
  onPublicContactChange: vi.fn(),
  researchConsent: false,
  digestOptIn: false,
  signOutAction: async () => {},
};

afterEach(cleanup);

describe("TopBar (restructured editor top bar)", () => {
  it("exposes one Export split control (format chooser + action)", () => {
    const { container } = render(<TopBar {...baseProps} />);
    expect(container.querySelector(".export-split .export-format")).toBeTruthy();
    expect(container.querySelector(".export-split .export-btn")).toBeTruthy();
  });

  it("collapses Publish and account into DISCLOSURE DIALOGS, not menus", () => {
    const { container } = render(<TopBar {...baseProps} />);
    // The two menu triggers announce a dialog (form fields inside — never role=menu).
    const dialogTriggers = container.querySelectorAll('[aria-haspopup="dialog"]');
    expect(dialogTriggers.length).toBe(2);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("opens the account menu as a dialog with sign out + delete account inside", () => {
    const { container } = render(<TopBar {...baseProps} />);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".account-trigger")!);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(container.querySelector(".account-panel")).toBeTruthy();
    // Sign out and the destructive Delete account now live in the menu, not the bar.
    expect(screen.getByText("Sign out")).toBeTruthy();
    expect(screen.getByText("Delete account")).toBeTruthy();
  });

  it("opens the publish menu as a dialog hosting the publish toggle", () => {
    const { container } = render(<TopBar {...baseProps} />);
    fireEvent.click(container.querySelector<HTMLButtonElement>(".publish-trigger")!);
    expect(container.querySelector(".publish-panel")).toBeTruthy();
    expect(container.querySelector('[data-testid="publish-toggle"]')).toBeTruthy();
  });

  it("keeps a persistent polite save-status live region", () => {
    render(<TopBar {...baseProps} />);
    const status = screen.getByRole("status");
    expect(status.getAttribute("aria-live")).toBe("polite");
    expect(status.textContent).toContain("Saved.");
  });

  it("marks a failed status distinctly (red) and a successful one not", () => {
    const { container, rerender } = render(
      <TopBar {...baseProps} status="Sync failed." statusKind="error" />,
    );
    expect(container.querySelector(".tb-status--error")).toBeTruthy();

    rerender(<TopBar {...baseProps} status="Saved." statusKind="ok" />);
    expect(container.querySelector(".tb-status--error")).toBeNull();
    expect(container.querySelector(".tb-status--ok")).toBeTruthy();
  });
});
