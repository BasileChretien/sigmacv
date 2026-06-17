// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import PopoverGroup from "@/components/PopoverGroup";
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
  onPublishStateChange: vi.fn(),
  researchConsent: false,
  digestOptIn: false,
  signOutAction: async () => {},
};

function renderInGroup(props = baseProps) {
  return render(
    <PopoverGroup>
      <TopBar {...props} />
    </PopoverGroup>,
  );
}

afterEach(cleanup);

describe("Top-bar menu dismissal (PopoverGroup scrim + one-open invariant)", () => {
  it("mounts the dismiss scrim only while a menu is open", () => {
    const { container } = renderInGroup();
    // Nothing open → no scrim, the editor underneath is untouched.
    expect(container.querySelector(".popover-scrim")).toBeNull();

    fireEvent.click(container.querySelector<HTMLButtonElement>(".publish-trigger")!);
    const scrim = container.querySelector(".popover-scrim");
    expect(scrim).toBeTruthy();
    // Invisible to assistive tech and not a focus stop.
    expect(scrim!.getAttribute("aria-hidden")).toBe("true");
    expect(scrim!.hasAttribute("tabindex")).toBe(false);
  });

  it("closes the open menu when the scrim is pressed (the click the iframe would swallow)", () => {
    const { container } = renderInGroup();
    const trigger = container.querySelector<HTMLButtonElement>(".publish-trigger")!;
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    // A pointer-down anywhere on the scrim (i.e. over the preview region) dismisses.
    fireEvent.pointerDown(container.querySelector(".popover-scrim")!);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    expect(container.querySelector(".popover-scrim")).toBeNull();
  });

  it("keeps at most one menu open — opening another closes the first", () => {
    const { container } = renderInGroup();
    const publish = container.querySelector<HTMLButtonElement>(".publish-trigger")!;
    const account = container.querySelector<HTMLButtonElement>(".account-trigger")!;

    fireEvent.click(publish);
    expect(publish.getAttribute("aria-expanded")).toBe("true");
    expect(account.getAttribute("aria-expanded")).toBe("false");

    // Switching to the account menu hands off in one gesture: publish collapses.
    fireEvent.click(account);
    expect(account.getAttribute("aria-expanded")).toBe("true");
    expect(publish.getAttribute("aria-expanded")).toBe("false");
  });

  it("still toggles closed when its own trigger is clicked again", () => {
    const { container } = renderInGroup();
    const publish = container.querySelector<HTMLButtonElement>(".publish-trigger")!;
    fireEvent.click(publish);
    expect(publish.getAttribute("aria-expanded")).toBe("true");
    fireEvent.click(publish);
    expect(publish.getAttribute("aria-expanded")).toBe("false");
  });
});
