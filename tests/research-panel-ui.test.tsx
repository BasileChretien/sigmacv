// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import CvWorkspace from "@/components/CvWorkspace";
import ResearchParticipationPanel from "@/components/ResearchParticipationPanel";
import { CanonicalCvSchema } from "@/lib/canonical/schema";
import { researchPanelStrings } from "@/lib/i18n/researchPanel";
import { ui } from "@/lib/i18n/ui";
import { consentText, RESEARCH_CONSENT_VERSION } from "@/lib/research/consent";
import type { ConsentStatus } from "@/lib/research/consent/status";

/**
 * The research panel of study 2026-0310: one quiet panel the person opens.
 * Nothing exists while the study is closed, nothing opens by itself, nothing
 * is pre-ticked, and checkbox ① alone enables the button.
 */

const EN = consentText("en-US");
const JA = consentText("ja-JP");
const rp = researchPanelStrings("en-US");

const NONE: ConsentStatus = {
  open: true,
  state: "none",
  since: null,
  version: null,
  locale: null,
  documentVersion: null,
  documentLabel: null,
  secondaryUse: null,
  hasRecords: false,
};
const CURRENT: ConsentStatus = {
  open: true,
  state: "current",
  since: "2026-10-22T07:31:00.000Z",
  version: RESEARCH_CONSENT_VERSION,
  locale: "en-US",
  documentVersion: "Version 1.0, 2026-06-05",
  documentLabel: "Information sheet Version 1.0 (2026-06-05)",
  secondaryUse: true,
  hasRecords: true,
};

interface Server {
  status: ConsentStatus;
  posts: unknown[];
  postReply?: { status: number; body: unknown };
  getFails?: boolean;
}
let server: Server;
const realFetch = global.fetch;

beforeEach(() => {
  server = { status: NONE, posts: [] };
  global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url !== "/api/account/consent") return new Response("{}", { status: 404 });
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body)) as { consent: boolean; locale?: string };
      server.posts.push(body);
      if (server.postReply) {
        return new Response(JSON.stringify(server.postReply.body), {
          status: server.postReply.status,
        });
      }
      server.status = body.consent
        ? { ...CURRENT, locale: body.locale as "en-US" | "ja-JP" }
        : { ...NONE, hasRecords: true };
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    if (server.getFails) return new Response("{}", { status: 500 });
    return new Response(JSON.stringify(server.status), { status: 200 });
  }) as typeof fetch;
});

afterEach(() => {
  cleanup();
  global.fetch = realFetch;
});

function renderPanel(uiLocale = "en-US") {
  const onClose = vi.fn();
  render(<ResearchParticipationPanel uiLocale={uiLocale} onClose={onClose} />);
  return onClose;
}

const takePart = (name = EN.takePart) => screen.getByRole("button", { name });

describe("the panel before consent", () => {
  it("shows the approved English text and keeps “Take part” disabled until checkbox ① is ticked", async () => {
    renderPanel();
    await screen.findByText(EN.summary[0]!);
    expect(screen.getByRole("dialog", { name: EN.title })).toBeTruthy();
    for (const line of EN.summary) expect(screen.getByText(line)).toBeTruthy();
    const agree = screen.getByRole("checkbox", { name: EN.agreeRequired }) as HTMLInputElement;
    const secondary = screen.getByRole("checkbox", { name: EN.agreeSecondary }) as HTMLInputElement;
    // Never pre-ticked.
    expect(agree.checked).toBe(false);
    expect(secondary.checked).toBe(false);
    expect((takePart() as HTMLButtonElement).disabled).toBe(true);
    // Checkbox ② alone does not consent.
    fireEvent.click(secondary);
    expect((takePart() as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(agree);
    expect((takePart() as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(agree);
    expect((takePart() as HTMLButtonElement).disabled).toBe(true);
  });

  it("holds the full information sheet collapsed, and the study contacts", async () => {
    renderPanel();
    const summary = await screen.findByText(EN.readFullSheet);
    const details = summary.closest("details")!;
    expect(details.open).toBe(false);
    expect(within(details).getByText(EN.sheet.sections[8]!.heading)).toBeTruthy();
    const mail = screen.getByRole("link", { name: EN.contacts[0]!.email });
    expect(mail.getAttribute("href")).toBe(`mailto:${EN.contacts[0]!.email}`);
  });

  it("grants with the version, the language shown and checkbox ②, then shows the status", async () => {
    renderPanel();
    fireEvent.click(await screen.findByRole("checkbox", { name: EN.agreeRequired }));
    fireEvent.click(takePart());
    await screen.findByTestId("research-status");
    expect(server.posts).toEqual([
      {
        consent: true,
        version: RESEARCH_CONSENT_VERSION,
        locale: "en-US",
        agreeRequired: true,
        secondaryUse: false,
      },
    ]);
  });

  it("“Not now” and Escape just close; nothing is sent", async () => {
    const onClose = renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: EN.notNow }));
    expect(onClose).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(server.posts).toEqual([]);
  });

  it("shows the Japanese text in a Japanese UI, and records ja-JP", async () => {
    renderPanel("ja-JP");
    await screen.findByText(JA.summary[0]!);
    expect(screen.getByRole("dialog", { name: JA.title })).toBeTruthy();
    expect(screen.queryByText(researchPanelStrings("ja-JP").languageNote)).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: JA.agreeRequired }));
    fireEvent.click(screen.getByRole("checkbox", { name: JA.agreeSecondary }));
    fireEvent.click(takePart(JA.takePart));
    await screen.findByTestId("research-status");
    expect(server.posts).toEqual([
      {
        consent: true,
        version: RESEARCH_CONSENT_VERSION,
        locale: "ja-JP",
        agreeRequired: true,
        secondaryUse: true,
      },
    ]);
  });

  it("shows English consent text in any other UI locale, says why, and switches to Japanese", async () => {
    renderPanel("fr-FR");
    await screen.findByText(EN.summary[0]!);
    expect(screen.getByText(researchPanelStrings("fr-FR").languageNote)).toBeTruthy();
    // A tick does not survive a change of language: it was given to the other text.
    fireEvent.click(screen.getByRole("checkbox", { name: EN.agreeRequired }));
    fireEvent.click(screen.getByRole("button", { name: "日本語" }));
    expect(screen.getByText(JA.summary[0]!)).toBeTruthy();
    expect(
      (screen.getByRole("checkbox", { name: JA.agreeRequired }) as HTMLInputElement).checked,
    ).toBe(false);
    expect((takePart(JA.takePart) as HTMLButtonElement).disabled).toBe(true);
  });

  it("explains a refused grant: a replaced text, a closed study, any other failure", async () => {
    renderPanel();
    fireEvent.click(await screen.findByRole("checkbox", { name: EN.agreeRequired }));
    for (const [reply, message] of [
      [{ status: 409, body: { code: "stale_version" } }, rp.staleText],
      [{ status: 409, body: { code: "closed" } }, rp.closed],
      [{ status: 500, body: {} }, rp.saveError],
    ] as const) {
      server.postReply = reply;
      fireEvent.click(takePart());
      expect((await screen.findByRole("alert")).textContent).toBe(message);
    }
    expect(screen.queryByTestId("research-status")).toBeNull();
  });

  it("asks a stale consent to agree again, and lets it be withdrawn", async () => {
    server.status = {
      ...CURRENT,
      state: "stale",
      version: 1,
      documentVersion: null,
      documentLabel: null,
    };
    renderPanel();
    expect(await screen.findByText(rp.staleConsent)).toBeTruthy();
    expect(screen.getByText(rp.agreeAgain)).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: EN.agreeRequired })).toBeTruthy();
    expect(screen.getByRole("link", { name: rp.recordLink }).getAttribute("href")).toBe(
      "/api/account/consent/record",
    );
    fireEvent.click(screen.getByRole("button", { name: rp.stopStale }));
    fireEvent.click(await screen.findByRole("button", { name: rp.stop }));
    expect(await screen.findByText(rp.stopped)).toBeTruthy();
    expect(server.posts).toEqual([{ consent: false, locale: "en-US" }]);
  });

  it("while the study is closed, shows no consent form: only the notice, and the record", async () => {
    server.status = { ...NONE, open: false, hasRecords: true };
    renderPanel();
    expect(await screen.findByText(rp.closed)).toBeTruthy();
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.queryByRole("button", { name: EN.takePart })).toBeNull();
    expect(screen.getByRole("link", { name: rp.recordLink })).toBeTruthy();
  });

  it("while the study is closed, an earlier consent can still be withdrawn (GDPR Art. 7(3))", async () => {
    server.status = {
      ...CURRENT,
      open: false,
      state: "stale",
      version: 1,
      documentVersion: null,
      documentLabel: null,
    };
    renderPanel();
    expect(await screen.findByText(rp.staleConsent)).toBeTruthy();
    // Nothing to agree to again while closed.
    expect(screen.queryByText(rp.agreeAgain)).toBeNull();
    expect(screen.queryByRole("checkbox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: rp.stopStale }));
    fireEvent.click(
      within(screen.getByRole("group", { name: rp.stopTitle })).getByRole("button", {
        name: rp.stop,
      }),
    );
    expect(await screen.findByText(rp.stopped)).toBeTruthy();
    expect(server.posts).toEqual([{ consent: false, locale: "en-US" }]);
  });

  it("offers a retry when the status cannot be loaded", async () => {
    server.getFails = true;
    renderPanel();
    expect((await screen.findByRole("alert")).textContent).toContain(rp.loadError);
    server.getFails = false;
    fireEvent.click(screen.getByRole("button", { name: rp.retry }));
    expect(await screen.findByText(EN.summary[0]!)).toBeTruthy();
  });
});

describe("the panel while taking part", () => {
  it("shows the status, the sheet to print, the record, and stops after a confirmation", async () => {
    server.status = CURRENT;
    renderPanel("fr-FR");
    const fr = researchPanelStrings("fr-FR");
    const status = await screen.findByTestId("research-status");
    // The document the person read, as its own language names it; no internal integer.
    expect(status.textContent).toBe(
      "Vous participez depuis le 22 octobre 2026 · Information sheet Version 1.0 (2026-06-05)",
    );
    expect(screen.getByText(fr.secondaryYes)).toBeTruthy();
    expect(screen.getByRole("link", { name: fr.sheetLink }).getAttribute("href")).toBe(
      "/cv/research-sheet?lang=en-US&ui=fr-FR",
    );
    expect(screen.getByRole("link", { name: fr.recordLink }).getAttribute("href")).toBe(
      "/api/account/consent/record",
    );
    // 別添1 §5's management screen: the sheet, the record, the data export, withdrawal.
    expect(screen.getByRole("link", { name: ui("fr-FR").exportData }).getAttribute("href")).toBe(
      "/api/account/export",
    );

    // Stop → a confirmation first; Cancel changes nothing.
    fireEvent.click(screen.getByRole("button", { name: fr.stop }));
    expect(screen.getByText(fr.stopBody)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: fr.cancel }));
    expect(server.posts).toEqual([]);

    fireEvent.click(screen.getByRole("button", { name: fr.stop }));
    fireEvent.click(
      within(screen.getByRole("group", { name: fr.stopTitle })).getByRole("button", {
        name: fr.stop,
      }),
    );
    expect(await screen.findByText(fr.stopped)).toBeTruthy();
    expect(server.posts).toEqual([{ consent: false, locale: "en-US" }]);
    // Back to the unticked form.
    expect(
      (screen.getByRole("checkbox", { name: EN.agreeRequired }) as HTMLInputElement).checked,
    ).toBe(false);
  });

  it("opens on the language consented in, and says when checkbox ② was not ticked", async () => {
    server.status = { ...CURRENT, locale: "ja-JP", secondaryUse: false };
    server.status = { ...server.status, documentLabel: "説明文書 第1.1版（2026-07-08）" };
    renderPanel("en-US");
    expect((await screen.findByTestId("research-status")).textContent).toBe(
      "You have been taking part since October 22, 2026 · 説明文書 第1.1版（2026-07-08）",
    );
    expect(screen.getByText(rp.secondaryNo)).toBeTruthy();
    expect(screen.getByRole("link", { name: rp.sheetLink }).getAttribute("href")).toBe(
      "/cv/research-sheet?lang=ja-JP&ui=en-US",
    );
  });

  it.each([
    ["en-US", "You have been taking part since October 22, 2026"],
    ["ja-JP", "2026年10月22日から参加しています。"],
  ])("drops the document, separator included, when none is known (%s)", async (ui, line) => {
    server.status = { ...CURRENT, documentLabel: null };
    renderPanel(ui);
    expect((await screen.findByTestId("research-status")).textContent).toBe(line);
  });

  it("keeps the confirmation open and reports a failed withdrawal", async () => {
    server.status = CURRENT;
    renderPanel();
    fireEvent.click(await screen.findByRole("button", { name: rp.stop }));
    server.postReply = { status: 500, body: {} };
    fireEvent.click(
      within(screen.getByRole("group", { name: rp.stopTitle })).getByRole("button", {
        name: rp.stop,
      }),
    );
    expect((await screen.findByRole("alert")).textContent).toBe(rp.saveError);
    expect(screen.getByTestId("research-status")).toBeTruthy();
  });
});

describe("the entry points in the editor", () => {
  const cv = CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "cv1",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Basile Chrétien" },
    display: {},
    sections: [],
    provenance: { generatedAt: "2026-06-11T00:00:00.000Z", sources: ["openalex"] },
  });
  const props = {
    initialCv: cv,
    availableStyles: ["apa"],
    userName: "Basile Chrétien",
    published: false,
    publicSlug: null,
    publicIndexable: false,
    signOutAction: async () => {},
  };
  const openAccountMenu = (container: HTMLElement) =>
    fireEvent.click(container.querySelector<HTMLButtonElement>(".account-trigger")!);

  it("renders nothing about the study while it is closed: no link, no menu item, no panel", () => {
    const { container } = render(<CvWorkspace {...props} researchEnabled={false} />);
    expect(screen.queryByText(rp.entry)).toBeNull();
    openAccountMenu(container);
    expect(screen.getByText("Sign out")).toBeTruthy();
    expect(screen.queryByText(rp.entry)).toBeNull();
    expect(screen.queryByTestId("research-panel")).toBeNull();
    expect(global.fetch).not.toHaveBeenCalledWith("/api/account/consent", expect.anything());
  });

  it("while closed, a consenting user still reaches the panel from the menu to stop (no editor link)", async () => {
    server.status = { ...CURRENT, open: false };
    const { container } = render(
      <CvWorkspace {...props} researchEnabled={false} researchConsent />,
    );
    // The editor's foot link invites taking part: it stays with the open study.
    expect(container.querySelector(".research-entry")).toBeNull();
    openAccountMenu(container);
    fireEvent.click(
      within(container.querySelector<HTMLElement>(".account-panel")!).getByRole("button", {
        name: rp.entry,
      }),
    );
    const panel = await screen.findByTestId("research-panel");
    await within(panel).findByTestId("research-status");
    expect(within(panel).getByRole("button", { name: rp.stop })).toBeTruthy();
  });

  it("while open: a static link and a menu item, and the panel only once one is clicked", async () => {
    const { container } = render(<CvWorkspace {...props} researchEnabled />);
    expect(screen.queryByTestId("research-panel")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: rp.entry }));
    expect(await screen.findByTestId("research-panel")).toBeTruthy();
    fireEvent.click(
      within(screen.getByTestId("research-panel")).getByRole("button", { name: rp.close }),
    );
    await waitFor(() => expect(screen.queryByTestId("research-panel")).toBeNull());

    openAccountMenu(container);
    const item = within(container.querySelector<HTMLElement>(".account-panel")!).getByRole(
      "button",
      {
        name: rp.entry,
      },
    );
    fireEvent.click(item);
    expect(await screen.findByTestId("research-panel")).toBeTruthy();
    // The menu closed behind it (once its exit animation ends).
    await waitFor(() => expect(container.querySelector(".account-panel")).toBeNull());
  });
});
