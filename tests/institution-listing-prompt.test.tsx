// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import InstitutionListingPrompt from "@/components/InstitutionListingPrompt";
import PreviewWorkspace from "@/components/PreviewWorkspace";
import PublishControls from "@/components/PublishControls";
import { CanonicalCvSchema, type CanonicalCv } from "@/lib/canonical/schema";
import { NO_INSTITUTION_PAGE } from "@/lib/cv/institutionConsent";
import { promptDismissalKey, type PublishSnapshot } from "@/lib/cv/institutionPrompt";
import { institutionPromptStrings } from "@/lib/i18n/institutionPrompt";
import { ui } from "@/lib/i18n/ui";
import { localePrivacyPath } from "@/lib/seo";

/**
 * The one-time "List yourself under {institution}?" card: an ASK, never a
 * default. Nothing is pre-ticked; the only way to consent is a click on a
 * button whose label names the institution; "Not now" sends nothing and is
 * remembered per set of ROR ids (a new affiliation asks again; a withdrawal in
 * the Publish menu is remembered under the same key); the anonymous preview
 * never renders it.
 */

// The anonymous preview's sign-in actions are server actions: stub the module
// so importing the workspace does not drag the auth stack into jsdom.
vi.mock("@/app/auth-actions", () => ({
  signInWithOrcid: vi.fn(),
  signInWithGoogle: vi.fn(),
  signInWithEmail: vi.fn(),
}));

const s = institutionPromptStrings("en-US");
const u = ui("en-US");
const NAGOYA = { rorId: "04chrp450", name: "Nagoya University" };
const CAEN = { rorId: "04d9jrx35", name: "CHU de Caen Normandie" };

function snapshot(over: Partial<PublishSnapshot> = {}): PublishSnapshot {
  return {
    published: true,
    slug: "ada-x7",
    indexable: true,
    listUnderAffiliation: false,
    affiliationRorId: NAGOYA.rorId,
    institutionPage: {
      ...NO_INSTITUTION_PAGE,
      currentAffiliations: [NAGOYA],
      visibleCurrentRorIds: [NAGOYA.rorId],
    },
    ...over,
  };
}
const withAffiliations = (...affs: { rorId: string; name: string }[]) =>
  snapshot({
    institutionPage: {
      ...NO_INSTITUTION_PAGE,
      currentAffiliations: affs,
      visibleCurrentRorIds: affs.map((a) => a.rorId),
    },
  });

/** A minimal CV for the anonymous preview: one ROR-linked current position (the
 *  very thing the owner's prompt keys on) and one work. */
function previewCv(): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "preview",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Ada" },
    display: {},
    sections: [
      {
        id: "positions",
        type: "positions",
        title: "Positions",
        visible: true,
        order: 0,
        items: [
          {
            id: "P1",
            source: "orcid",
            sourceId: "P1",
            included: true,
            notMine: false,
            order: 0,
            authoredBySelf: false,
            selfNameVariants: [],
            displayText: "Professor",
            meta: { institution: NAGOYA.name, rorId: NAGOYA.rorId, startYear: 2020 },
          },
        ],
      },
    ],
    provenance: { generatedAt: "2026-09-08T00:00:00.000Z", sources: ["orcid"] },
  });
}

const fetchMock = vi.fn();
function respond(over: Record<string, unknown> = {}) {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({
      published: true,
      publicSlug: "ada-x7",
      indexable: true,
      listUnderAffiliation: true,
      affiliationRorId: NAGOYA.rorId,
      ...NO_INSTITUTION_PAGE,
      showOnInstitutionPage: true,
      consentedRorIds: [NAGOYA.rorId],
      currentAffiliations: [NAGOYA],
      visibleCurrentRorIds: [NAGOYA.rorId],
      ...over,
    }),
  });
}
function lastBody(): Record<string, unknown> {
  const init = fetchMock.mock.calls.at(-1)![1] as { body: string };
  return JSON.parse(init.body) as Record<string, unknown>;
}

function renderPrompt(state: PublishSnapshot, over: { suppressed?: boolean } = {}) {
  const onPublishStateChange = vi.fn();
  render(
    <InstitutionListingPrompt
      locale="en-US"
      state={state}
      onPublishStateChange={onPublishStateChange}
      {...over}
    />,
  );
  return onPublishStateChange;
}
const card = () => screen.queryByRole("region", { name: /list yourself under/i });
const yesButton = () => screen.getByRole("button", { name: /^Yes, list me under/ });
const notNowButton = () => screen.getByRole("button", { name: s.notNow });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  window.localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("InstitutionListingPrompt — what it shows", () => {
  it("is a labelled section (not a dialog) naming the institution, with the disclosure, two equal buttons and the privacy link — and steals no focus", () => {
    renderPrompt(snapshot());
    const section = card();
    expect(section).toBeTruthy();
    expect(section!.tagName).toBe("SECTION");
    expect(section!.getAttribute("role")).toBeNull();
    expect(screen.queryByRole("dialog")).toBeNull();
    // aria-labelledby resolves to the heading that names the institution.
    const heading = document.getElementById(section!.getAttribute("aria-labelledby")!);
    expect(heading?.textContent).toBe("List yourself under Nagoya University?");
    expect(screen.getByText(s.what.replace("{institution}", "Nagoya University"))).toBeTruthy();
    expect(screen.getByText(s.nothingUntil)).toBeTruthy();
    expect(screen.getByText(s.withdraw)).toBeTruthy();
    // The two buttons: real buttons, same class (equal weight), the consent names the institution.
    const yes = yesButton();
    const notNow = notNowButton();
    expect(yes.textContent).toBe("Yes, list me under Nagoya University");
    expect(yes.className).toBe(notNow.className);
    expect(yes.className).not.toMatch(/primary/);
    // "What this means" → the privacy notice, in a new tab.
    const more = screen.getByRole("link", { name: s.learnMore }) as HTMLAnchorElement;
    expect(more.getAttribute("href")).toBe(localePrivacyPath("en-US"));
    expect(more.getAttribute("target")).toBe("_blank");
    // Reconciliation rows: one sentence, a Versions link, NO third box.
    expect(screen.getByRole("button", { name: s.versions })).toBeTruthy();
    expect(screen.queryByLabelText(u.shareReconciliationRows)).toBeNull();
    // Nothing pre-ticked: with one institution there is no checkbox at all.
    expect(document.querySelectorAll("input[type=checkbox]")).toHaveLength(0);
    // Focus is not stolen on mount.
    expect(document.activeElement).toBe(document.body);
  });

  it("the Versions link opens the Versions menu via its trigger", () => {
    const trigger = document.createElement("button");
    trigger.className = "versions-trigger";
    trigger.setAttribute("aria-expanded", "false");
    const onClick = vi.fn();
    trigger.addEventListener("click", onClick);
    document.body.appendChild(trigger);
    renderPrompt(snapshot());
    fireEvent.click(screen.getByRole("button", { name: s.versions }));
    expect(onClick).toHaveBeenCalledTimes(1);
    trigger.remove();
  });
});

describe("InstitutionListingPrompt — the visibility matrix", () => {
  it("shows only when published + indexable + a ROR-linked current affiliation not yet listed + not dismissed", () => {
    const cases: Array<[string, PublishSnapshot, boolean]> = [
      ["published, indexable, unlisted", snapshot(), true],
      ["unpublished", snapshot({ published: false }), false],
      ["not indexable", snapshot({ indexable: false }), false],
      [
        "no ROR-linked current position",
        snapshot({ institutionPage: NO_INSTITUTION_PAGE, affiliationRorId: null }),
        false,
      ],
      [
        "already listed",
        snapshot({
          listUnderAffiliation: true,
          institutionPage: {
            ...NO_INSTITUTION_PAGE,
            currentAffiliations: [NAGOYA],
            visibleCurrentRorIds: [NAGOYA.rorId],
            showOnInstitutionPage: true,
            consentedRorIds: [NAGOYA.rorId],
          },
        }),
        false,
      ],
      [
        "institution page on, OAI listing off: on ONE surface — a status, not an ask",
        snapshot({
          institutionPage: {
            ...NO_INSTITUTION_PAGE,
            currentAffiliations: [NAGOYA],
            visibleCurrentRorIds: [NAGOYA.rorId],
            showOnInstitutionPage: true,
            consentedRorIds: [NAGOYA.rorId],
          },
        }),
        false,
      ],
      [
        "OAI listing on, institution page off: on ONE surface — a status, not an ask",
        snapshot({ listUnderAffiliation: true }),
        false,
      ],
    ];
    for (const [label, state, shown] of cases) {
      renderPrompt(state);
      expect(card() !== null, label).toBe(shown);
      cleanup();
    }
  });

  it("is hidden while dismissed for this set, while suppressed, and never fetches on mount", () => {
    window.localStorage.setItem(promptDismissalKey([NAGOYA.rorId]), "1");
    renderPrompt(snapshot());
    expect(card()).toBeNull();
    cleanup();
    window.localStorage.clear();
    renderPrompt(snapshot(), { suppressed: true });
    expect(card()).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("InstitutionListingPrompt — one affiliation, one click", () => {
  it("posts ONE request with the full publish state plus the three listing fields, then shows the confirmation", async () => {
    respond();
    const onPublishStateChange = renderPrompt(snapshot());
    await act(async () => {
      fireEvent.click(yesButton());
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]![0]).toBe("/api/cv/publish");
    expect(lastBody()).toEqual({
      published: true,
      indexable: true,
      listUnderAffiliation: true,
      showOnInstitutionPage: true,
      consentedRorIds: [NAGOYA.rorId],
      shareReconciliationRows: false,
    });
    // The host's state is re-read from the server's answer, exactly as PublishControls does.
    expect(onPublishStateChange).toHaveBeenCalledWith(
      expect.objectContaining({
        listUnderAffiliation: true,
        institutionPage: expect.objectContaining({
          showOnInstitutionPage: true,
          consentedRorIds: [NAGOYA.rorId],
        }),
      }),
    );
    // The existing "You are listed under …" confirmation replaces the ask.
    expect(screen.getByRole("status").textContent).toBe(
      u.institutionPageListedUnder.replace("{institutions}", "Nagoya University"),
    );
    expect(screen.queryByRole("button", { name: /^Yes, list me under/ })).toBeNull();
    // Never re-asked for this set.
    expect(window.localStorage.getItem(promptDismissalKey([NAGOYA.rorId]))).toBe("1");
  });

  it("on a failed request, shows the publish error, keeps the ask and changes nothing", async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({ error: "nope" }) });
    const onPublishStateChange = renderPrompt(snapshot());
    await act(async () => {
      fireEvent.click(yesButton());
    });
    expect(screen.getByRole("alert").textContent).toBe(u.publishError);
    expect(yesButton()).toBeTruthy();
    expect(onPublishStateChange).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(promptDismissalKey([NAGOYA.rorId]))).toBeNull();
  });
});

describe("InstitutionListingPrompt — several affiliations, the picker", () => {
  it("renders every checkbox unticked, disables Yes until a tick, names only the ticked institutions and posts only their ids", async () => {
    respond({
      consentedRorIds: [CAEN.rorId],
      currentAffiliations: [NAGOYA, CAEN],
      visibleCurrentRorIds: [NAGOYA.rorId, CAEN.rorId],
    });
    renderPrompt(withAffiliations(NAGOYA, CAEN));
    expect(screen.getByText(s.headingMany)).toBeTruthy();
    // The OAI-PMH set is keyed by the first current position whatever is
    // ticked, so the disclosure names that one, not the whole list.
    expect(screen.getByText(s.what.replace("{institution}", "Nagoya University"))).toBeTruthy();
    const boxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    expect(boxes).toHaveLength(2);
    for (const box of boxes) expect(box.checked).toBe(false);
    const yes = screen.getByRole("button", { name: s.yesNone }) as HTMLButtonElement;
    expect(yes.disabled).toBe(true);
    // Tick Caen only.
    fireEvent.click(screen.getByLabelText(/CHU de Caen Normandie/));
    const yesCaen = screen.getByRole("button", {
      name: "Yes, list me under CHU de Caen Normandie",
    }) as HTMLButtonElement;
    expect(yesCaen.disabled).toBe(false);
    expect(screen.queryByRole("button", { name: /Nagoya University/ })).toBeNull();
    await act(async () => {
      fireEvent.click(yesCaen);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(lastBody()).toMatchObject({
      listUnderAffiliation: true,
      showOnInstitutionPage: true,
      consentedRorIds: [CAEN.rorId],
    });
    expect(screen.getByRole("status").textContent).toBe(
      u.institutionPageListedUnder.replace("{institutions}", "CHU de Caen Normandie"),
    );
  });

  it("with both ticked, the label names both and both ids are posted", async () => {
    respond({
      consentedRorIds: [NAGOYA.rorId, CAEN.rorId],
      currentAffiliations: [NAGOYA, CAEN],
      visibleCurrentRorIds: [NAGOYA.rorId, CAEN.rorId],
    });
    renderPrompt(withAffiliations(NAGOYA, CAEN));
    fireEvent.click(screen.getByLabelText(/Nagoya University/));
    fireEvent.click(screen.getByLabelText(/CHU de Caen Normandie/));
    const yes = screen.getByRole("button", {
      name: "Yes, list me under Nagoya University, CHU de Caen Normandie",
    });
    // Unticking one narrows the label again.
    fireEvent.click(screen.getByLabelText(/Nagoya University/));
    expect(screen.getByRole("button", { name: "Yes, list me under CHU de Caen Normandie" })).toBe(
      yes,
    );
    fireEvent.click(screen.getByLabelText(/Nagoya University/));
    await act(async () => {
      fireEvent.click(yes);
    });
    expect(lastBody()).toMatchObject({ consentedRorIds: [NAGOYA.rorId, CAEN.rorId] });
  });
});

describe("InstitutionListingPrompt — the confirmation", () => {
  it("keeps its live region in the DOM from the start and swaps the CONTENT, so it is announced", async () => {
    respond();
    renderPrompt(snapshot());
    // The region exists before there is anything to say (an element that only
    // appears with its text is routinely missed by screen readers).
    const status = screen.getByRole("status");
    expect(status.textContent).toBe("");
    await act(async () => {
      fireEvent.click(yesButton());
    });
    // Same node, new content.
    expect(screen.getByRole("status")).toBe(status);
    expect(status.textContent).toBe(
      u.institutionPageListedUnder.replace("{institutions}", "Nagoya University"),
    );
    // The section is labelled by the confirmation now, not by a stale heading.
    const section = document.querySelector("section.institution-prompt")!;
    expect(section.getAttribute("aria-labelledby")).toBe(status.id);
  });

  it("belongs to the set it was given for: a NEW affiliation asks again", async () => {
    respond();
    const onPublishStateChange = vi.fn();
    const { rerender } = render(
      <InstitutionListingPrompt
        locale="en-US"
        state={snapshot()}
        onPublishStateChange={onPublishStateChange}
      />,
    );
    await act(async () => {
      fireEvent.click(yesButton());
    });
    expect(screen.getByRole("status").textContent).toContain("Nagoya University");
    // The same set, re-rendered with the server's answer: still the confirmation.
    const listedNagoya: PublishSnapshot = {
      ...snapshot(),
      listUnderAffiliation: true,
      institutionPage: {
        ...NO_INSTITUTION_PAGE,
        currentAffiliations: [NAGOYA],
        visibleCurrentRorIds: [NAGOYA.rorId],
        showOnInstitutionPage: true,
        consentedRorIds: [NAGOYA.rorId],
      },
    };
    rerender(
      <InstitutionListingPrompt
        locale="en-US"
        state={listedNagoya}
        onPublishStateChange={onPublishStateChange}
      />,
    );
    expect(card()).toBeNull();
    expect(screen.getByRole("status").textContent).toContain("Nagoya University");
    // A second affiliation arrives: a new set of ROR ids is a new question, and
    // the confirmation must not sit on top of it.
    const plusCaen: PublishSnapshot = {
      ...listedNagoya,
      institutionPage: {
        ...listedNagoya.institutionPage,
        currentAffiliations: [NAGOYA, CAEN],
        visibleCurrentRorIds: [NAGOYA.rorId, CAEN.rorId],
      },
    };
    rerender(
      <InstitutionListingPrompt
        locale="en-US"
        state={plusCaen}
        onPublishStateChange={onPublishStateChange}
      />,
    );
    expect(card()).not.toBeNull();
    expect(
      screen.getByRole("button", { name: "Yes, list me under CHU de Caen Normandie" }),
    ).toBeTruthy();
    expect(screen.getByRole("status").textContent).toBe("");
  });
});

describe("InstitutionListingPrompt — Not now, and memory per set", () => {
  it("sends nothing, closes, and stays closed for the same set — but a new affiliation asks again", () => {
    renderPrompt(snapshot());
    fireEvent.click(notNowButton());
    expect(fetchMock).not.toHaveBeenCalled();
    expect(card()).toBeNull();
    expect(window.localStorage.getItem(promptDismissalKey([NAGOYA.rorId]))).toBe("1");
    cleanup();
    renderPrompt(snapshot());
    expect(card()).toBeNull();
    cleanup();
    // A second current affiliation is a different set of ROR ids: ask again
    // (the picker offers both; nothing pre-ticked).
    renderPrompt(withAffiliations(NAGOYA, CAEN));
    expect(card()).not.toBeNull();
    for (const box of screen.getAllByRole("checkbox") as HTMLInputElement[]) {
      expect(box.checked).toBe(false);
    }
  });

  it("a withdrawal in the Publish menu is remembered under the same key, so the prompt does not re-ask", async () => {
    // Consented, then withdrawn via the institution-page toggle.
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        published: true,
        publicSlug: "ada-x7",
        indexable: true,
        listUnderAffiliation: false,
        affiliationRorId: NAGOYA.rorId,
        ...NO_INSTITUTION_PAGE,
        currentAffiliations: [NAGOYA],
        visibleCurrentRorIds: [NAGOYA.rorId],
      }),
    });
    render(
      <PublishControls
        initialPublished
        initialSlug="ada-x7"
        initialIndexable
        initialAffiliationRorId={NAGOYA.rorId}
        initialListUnderAffiliation
        initialInstitutionPage={{
          ...NO_INSTITUTION_PAGE,
          currentAffiliations: [NAGOYA],
          visibleCurrentRorIds: [NAGOYA.rorId],
          showOnInstitutionPage: true,
          consentedRorIds: [NAGOYA.rorId],
        }}
        locale="en-US"
        publicContact={{ email: false, phone: false, location: false }}
        onPublicContactChange={vi.fn()}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByLabelText(u.showOnInstitutionPage));
    });
    expect(lastBody()).toMatchObject({ showOnInstitutionPage: false, consentedRorIds: [] });
    expect(window.localStorage.getItem(promptDismissalKey([NAGOYA.rorId]))).toBe("1");
    cleanup();
    renderPrompt(snapshot());
    expect(card()).toBeNull();
  });

  it("unticking the OAI affiliation listing is a withdrawal too", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        published: true,
        publicSlug: "ada-x7",
        indexable: true,
        listUnderAffiliation: false,
        affiliationRorId: NAGOYA.rorId,
        ...NO_INSTITUTION_PAGE,
        currentAffiliations: [NAGOYA],
        visibleCurrentRorIds: [NAGOYA.rorId],
      }),
    });
    render(
      <PublishControls
        initialPublished
        initialSlug="ada-x7"
        initialIndexable
        initialAffiliationRorId={NAGOYA.rorId}
        initialListUnderAffiliation
        initialInstitutionPage={{
          ...NO_INSTITUTION_PAGE,
          currentAffiliations: [NAGOYA],
          visibleCurrentRorIds: [NAGOYA.rorId],
        }}
        locale="en-US"
        publicContact={{ email: false, phone: false, location: false }}
        onPublicContactChange={vi.fn()}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByLabelText(u.listUnderAffiliation));
    });
    expect(lastBody()).toMatchObject({ listUnderAffiliation: false });
    expect(window.localStorage.getItem(promptDismissalKey([NAGOYA.rorId]))).toBe("1");
  });
});

describe("InstitutionListingPrompt — never on a public or anonymous surface", () => {
  it("is rendered by the owner workspace only; the anonymous preview never imports it", () => {
    const src = (file: string) => readFileSync(`src/components/${file}`, "utf8");
    expect(src("CvWorkspace.tsx")).toContain("InstitutionListingPrompt");
    expect(src("PreviewWorkspace.tsx")).not.toContain("InstitutionListingPrompt");
    expect(src("PreviewBuilder.tsx")).not.toContain("InstitutionListingPrompt");
    expect(src("PreviewWorkspace.tsx")).not.toContain("institutionListing");
  });

  it("is absent from a REAL render of the anonymous preview — no ask, no status line, no consent button", () => {
    render(
      <PreviewWorkspace
        initialCv={previewCv()}
        initialHtml="<p>cv</p>"
        name="Ada"
        locale="en-US"
        availableStyles={["apa"]}
      />,
    );
    // The workspace really rendered (this guard would be vacuous otherwise).
    expect(document.querySelector(".preview-app")).toBeTruthy();
    // The card, the worklist's status line, and every string either would use.
    expect(card()).toBeNull();
    expect(document.querySelector('[data-worklist="listing"]')).toBeNull();
    expect(screen.queryByRole("button", { name: /^Yes, list me under/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /^List me under/ })).toBeNull();
    expect(document.body.textContent).not.toContain(s.nothingUntil);
    expect(document.body.textContent).not.toContain(s.withdraw);
    // And it asked the publish API nothing at all.
    expect(fetchMock.mock.calls.map(([url]) => String(url))).not.toContain("/api/cv/publish");
  });
});

describe("PublishControls — the 'Your institution' sub-section", () => {
  it("wraps the three institution boxes under one titled, focusable anchor the Change links open", () => {
    render(
      <PublishControls
        initialPublished
        initialSlug="ada-x7"
        initialIndexable
        initialAffiliationRorId={NAGOYA.rorId}
        initialInstitutionPage={{
          ...NO_INSTITUTION_PAGE,
          currentAffiliations: [NAGOYA],
          visibleCurrentRorIds: [NAGOYA.rorId],
          showOnInstitutionPage: true,
          consentedRorIds: [NAGOYA.rorId],
        }}
        locale="en-US"
        publicContact={{ email: false, phone: false, location: false }}
        onPublicContactChange={vi.fn()}
      />,
    );
    const section = document.getElementById("publish-institution")!;
    expect(section).toBeTruthy();
    expect(section.getAttribute("tabindex")).toBe("-1");
    expect(screen.getByRole("heading", { name: u.publishInstitutionSection })).toBeTruthy();
    for (const label of [
      u.listUnderAffiliation,
      u.showOnInstitutionPage,
      u.shareReconciliationRows,
    ]) {
      expect(section.contains(screen.getByLabelText(label))).toBe(true);
    }
    // Still nothing pre-ticked where no consent is stored.
    expect((screen.getByLabelText(u.listUnderAffiliation) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByLabelText(u.shareReconciliationRows) as HTMLInputElement).checked).toBe(
      false,
    );
  });
});
