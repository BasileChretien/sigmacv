// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import CvEditor from "@/components/CvEditor";
import WorklistPanel from "@/components/WorklistPanel";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { NO_INSTITUTION_PAGE } from "@/lib/cv/institutionConsent";
import type { PublishSnapshot } from "@/lib/cv/institutionPrompt";
import { institutionPromptStrings } from "@/lib/i18n/institutionPrompt";
import { ui } from "@/lib/i18n/ui";
import { workspaceUi } from "@/lib/i18n/workspaceUi";
import { localePrivacyPath } from "@/lib/seo";

/**
 * The worklist's first row, "Institution listing": a STATUS line, never a gap.
 * On neither surface → "You are not yet listed under …" + the prompt's own
 * disclosure and "What this means" link + the same one-request "List me under …"
 * control (picker rule included); on both → "Listed under …" + Change; on
 * exactly one → the third wording, which names the surface that is missing;
 * lapsed → the Publish menu's own wording. It is a reason to show the
 * otherwise-empty panel only while a choice is open, and the anonymous preview
 * never gets it.
 */

const wu = workspaceUi("en-US");
const u = ui("en-US");
const s = institutionPromptStrings("en-US");
const NAGOYA = { rorId: "04chrp450", name: "Nagoya University" };
const CAEN = { rorId: "04d9jrx35", name: "CHU de Caen Normandie" };

function work(id: string, meta: CvItem["meta"]): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id, type: "article-journal", title: `Work ${id}` },
    meta,
  };
}

/** A CV with nothing else for the worklist to say (one open work, a ROR-linked position). */
function quietCv(over: { closed?: boolean } = {}): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "wl",
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
            meta: { institution: "Nagoya University", rorId: NAGOYA.rorId, startYear: 2020 },
          },
        ],
      },
      {
        id: "pubs",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 1,
        items: [
          work("W1", {
            year: 2022,
            oaIsOpen: !over.closed,
            license: "cc-by",
            workInstitutions: [NAGOYA.rorId],
          }),
        ],
      },
    ],
    provenance: { generatedAt: "2026-09-08T00:00:00.000Z", sources: ["openalex"] },
  });
}

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
const listedSnapshot = () =>
  snapshot({
    listUnderAffiliation: true,
    institutionPage: {
      ...NO_INSTITUTION_PAGE,
      currentAffiliations: [NAGOYA],
      visibleCurrentRorIds: [NAGOYA.rorId],
      showOnInstitutionPage: true,
      consentedRorIds: [NAGOYA.rorId],
    },
  });

const fetchMock = vi.fn();
function lastBody(): Record<string, unknown> {
  const init = fetchMock.mock.calls.at(-1)![1] as { body: string };
  return JSON.parse(init.body) as Record<string, unknown>;
}

function renderPanel(cv: CanonicalCv, state: PublishSnapshot, consented: string[] = []) {
  const onPublishStateChange = vi.fn();
  const { container } = render(
    <WorklistPanel
      cv={cv}
      locale="en-US"
      consentedRorIds={consented}
      onJump={vi.fn()}
      listing={{ state, onPublishStateChange }}
    />,
  );
  return { container, onPublishStateChange };
}
const row = () => document.querySelector('[data-worklist="listing"]');

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  window.localStorage.clear();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("InstitutionListingRow — unlisted", () => {
  it("shows the panel for the status line alone, says who is not yet listed, and 'List me under …' posts the one full request", async () => {
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
      }),
    });
    const { onPublishStateChange } = renderPanel(quietCv(), snapshot());
    expect(row()).toBeTruthy();
    expect(screen.getByRole("heading", { name: wu.wlListingHeading })).toBeTruthy();
    expect(screen.getByText(wu.wlListingHelp)).toBeTruthy();
    expect(screen.getByText("You are not yet listed under Nagoya University.")).toBeTruthy();
    // Not a gap: no count anywhere in the row, nothing pre-ticked.
    expect(row()!.textContent).not.toMatch(/\d+ of \d+/);
    expect(row()!.querySelectorAll("input[type=checkbox]")).toHaveLength(0);
    const button = screen.getByRole("button", { name: "List me under Nagoya University" });
    await act(async () => {
      fireEvent.click(button);
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(lastBody()).toEqual({
      published: true,
      indexable: true,
      listUnderAffiliation: true,
      showOnInstitutionPage: true,
      consentedRorIds: [NAGOYA.rorId],
      shareReconciliationRows: false,
    });
    expect(onPublishStateChange).toHaveBeenCalledWith(
      expect.objectContaining({ listUnderAffiliation: true }),
    );
  });

  it("while the page is unpublished or not indexable, offers no button — the reason and a Change link instead", () => {
    renderPanel(quietCv(), snapshot({ published: false }));
    expect(screen.getByText("You are not yet listed under Nagoya University.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /List me under/ })).toBeNull();
    expect(screen.getByText(wu.wlListingNeedsPage)).toBeTruthy();
    expect(screen.getByRole("button", { name: wu.wlListingChange })).toBeTruthy();
    cleanup();
    renderPanel(quietCv(), snapshot({ indexable: false }));
    expect(screen.queryByRole("button", { name: /List me under/ })).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("with several unlisted affiliations: picker unticked, button disabled until a tick, only ticked ids posted", async () => {
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
        consentedRorIds: [CAEN.rorId],
        currentAffiliations: [NAGOYA, CAEN],
        visibleCurrentRorIds: [NAGOYA.rorId, CAEN.rorId],
      }),
    });
    renderPanel(
      quietCv(),
      snapshot({
        institutionPage: {
          ...NO_INSTITUTION_PAGE,
          currentAffiliations: [NAGOYA, CAEN],
          visibleCurrentRorIds: [NAGOYA.rorId, CAEN.rorId],
        },
      }),
    );
    expect(
      screen.getByText("You are not yet listed under Nagoya University, CHU de Caen Normandie."),
    ).toBeTruthy();
    const boxes = row()!.querySelectorAll<HTMLInputElement>("input[type=checkbox]");
    expect(boxes).toHaveLength(2);
    for (const box of boxes) expect(box.checked).toBe(false);
    const none = screen.getByRole("button", { name: wu.wlListingListMeNone }) as HTMLButtonElement;
    expect(none.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText(/CHU de Caen Normandie/));
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "List me under CHU de Caen Normandie" }));
    });
    expect(lastBody()).toMatchObject({ consentedRorIds: [CAEN.rorId] });
  });
});

describe("InstitutionListingRow — the disclosure at the point of consent", () => {
  it("says what the button does and links to the privacy notice, beside the button", () => {
    renderPanel(quietCv(), snapshot());
    const more = screen.getByRole("link", { name: s.learnMore }) as HTMLAnchorElement;
    expect(more.getAttribute("href")).toBe(localePrivacyPath("en-US"));
    expect(more.getAttribute("target")).toBe("_blank");
    expect(more.getAttribute("rel")).toBe("noopener noreferrer");
    // The prompt's own sentence — what appears where — not a bare button.
    const disclosure = more.closest("p")!;
    expect(disclosure.textContent).toContain(s.what.replace("{institution}", "Nagoya University"));
    // It sits in the same row as the control it explains.
    expect(row()!.contains(more)).toBe(true);
    expect(
      row()!.contains(screen.getByRole("button", { name: "List me under Nagoya University" })),
    ).toBe(true);
  });

  it("with several affiliations, the disclosure names the OAI-keyed institution — as the prompt's body does", () => {
    renderPanel(
      quietCv(),
      snapshot({
        institutionPage: {
          ...NO_INSTITUTION_PAGE,
          currentAffiliations: [NAGOYA, CAEN],
          visibleCurrentRorIds: [NAGOYA.rorId, CAEN.rorId],
        },
      }),
    );
    const disclosure = screen.getByRole("link", { name: s.learnMore }).closest("p")!;
    // The set is keyed to Nagoya (the server's `affiliationRorId`) whatever is
    // ticked, so the sentence names Nagoya, not the ticked institution.
    expect(disclosure.textContent).toContain(s.what.replace("{institution}", "Nagoya University"));
    fireEvent.click(screen.getByLabelText(/CHU de Caen Normandie/));
    expect(
      screen.getByRole("button", { name: "List me under CHU de Caen Normandie" }),
    ).toBeTruthy();
    expect(disclosure.textContent).toContain(s.what.replace("{institution}", "Nagoya University"));
  });

  it("no page to list on: the disclosure and the button go away together", () => {
    renderPanel(quietCv(), snapshot({ published: false }));
    expect(screen.queryByRole("link", { name: s.learnMore })).toBeNull();
    expect(screen.queryByRole("button", { name: /List me under/ })).toBeNull();
  });
});

describe("InstitutionListingRow — on exactly ONE of the two surfaces", () => {
  const onPage = snapshot({
    institutionPage: {
      ...NO_INSTITUTION_PAGE,
      currentAffiliations: [NAGOYA],
      visibleCurrentRorIds: [NAGOYA.rorId],
      showOnInstitutionPage: true,
      consentedRorIds: [NAGOYA.rorId],
    },
  });
  const inSet = snapshot({ listUnderAffiliation: true });
  const fill = (template: string, institution: string) =>
    template.replace("{institution}", institution);

  it("on the page but not in the repository set: says exactly that, with Change and no ask", () => {
    renderPanel(quietCv({ closed: true }), onPage, [NAGOYA.rorId]);
    expect(row()!.textContent).toContain(fill(wu.wlListingPageOnly, "Nagoya University"));
    expect(row()!.textContent).not.toContain("You are not yet listed");
    expect(screen.queryByRole("button", { name: /List me under/ })).toBeNull();
    expect(screen.getByRole("button", { name: wu.wlListingChange })).toBeTruthy();
  });

  it("in the repository set but not on the page: the other half of the same sentence", () => {
    renderPanel(quietCv({ closed: true }), inSet, []);
    expect(row()!.textContent).toContain(fill(wu.wlListingSetOnly, "Nagoya University"));
    expect(row()!.textContent).not.toContain("You are not yet listed");
    expect(screen.queryByRole("button", { name: /List me under/ })).toBeNull();
    expect(screen.getByRole("button", { name: wu.wlListingChange })).toBeTruthy();
  });

  it("is a status, not an open choice: it alone does not open an otherwise-empty panel", () => {
    const { container } = renderPanel(quietCv(), onPage, [NAGOYA.rorId]);
    expect(container.innerHTML).toBe("");
  });
});

describe("InstitutionListingRow — listed and lapsed", () => {
  it("listed: says so with a Change link, and is NOT a reason to show an otherwise-empty panel", () => {
    const { container } = renderPanel(quietCv(), listedSnapshot(), [NAGOYA.rorId]);
    expect(container.innerHTML).toBe("");
    cleanup();
    // With something else to show, the status line leads.
    renderPanel(quietCv({ closed: true }), listedSnapshot(), [NAGOYA.rorId]);
    expect(row()).toBeTruthy();
    expect(screen.getByText(/^Listed under Nagoya University\./)).toBeTruthy();
    expect(screen.getByRole("button", { name: wu.wlListingChange })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /List me under/ })).toBeNull();
    // The two status rows lead, indexing first (listing requires it), then the rest.
    const groups = [...document.querySelectorAll(".cv-worklist-group")].map((g) =>
      g.getAttribute("data-worklist"),
    );
    expect(groups.slice(0, 2)).toEqual(["indexing", "listing"]);
  });

  it("Change opens the Publish menu at the institution sub-section", async () => {
    const trigger = document.createElement("button");
    trigger.className = "publish-trigger";
    trigger.setAttribute("aria-expanded", "false");
    const anchor = document.createElement("div");
    anchor.id = "publish-institution";
    anchor.tabIndex = -1;
    trigger.addEventListener("click", () => document.body.appendChild(anchor));
    document.body.appendChild(trigger);
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });
    renderPanel(quietCv({ closed: true }), listedSnapshot(), [NAGOYA.rorId]);
    fireEvent.click(screen.getByRole("button", { name: wu.wlListingChange }));
    expect(document.activeElement).toBe(anchor);
    trigger.remove();
    anchor.remove();
  });

  it("lapsed: keeps the Publish menu's own wording for an id kept from a former affiliation, and re-asks for the current one", () => {
    renderPanel(
      quietCv({ closed: true }),
      snapshot({
        // The kept id is the ONLY consent: the current position is on neither
        // surface, so it is still an open choice.
        listUnderAffiliation: false,
        institutionPage: {
          ...NO_INSTITUTION_PAGE,
          currentAffiliations: [NAGOYA],
          visibleCurrentRorIds: [NAGOYA.rorId],
          showOnInstitutionPage: true,
          consentedRorIds: ["00old0000"],
          lapsedRorIds: ["00old0000"],
        },
      }),
      ["00old0000"],
    );
    expect(
      screen.getByText(u.institutionPageLapsedKept.replace("{rorId}", "00old0000")),
    ).toBeTruthy();
    expect(screen.getByText("You are not yet listed under Nagoya University.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "List me under Nagoya University" })).toBeTruthy();
  });

  it("lapsed while the current position IS in the repository set: the third wording, not an ask", () => {
    renderPanel(
      quietCv({ closed: true }),
      snapshot({
        listUnderAffiliation: true,
        institutionPage: {
          ...NO_INSTITUTION_PAGE,
          currentAffiliations: [NAGOYA],
          visibleCurrentRorIds: [NAGOYA.rorId],
          showOnInstitutionPage: true,
          consentedRorIds: ["00old0000"],
          lapsedRorIds: ["00old0000"],
        },
      }),
      ["00old0000"],
    );
    expect(
      screen.getByText(u.institutionPageLapsedKept.replace("{rorId}", "00old0000")),
    ).toBeTruthy();
    expect(row()!.textContent).toContain(
      wu.wlListingSetOnly.replace("{institution}", "Nagoya University"),
    );
    expect(screen.queryByRole("button", { name: /List me under/ })).toBeNull();
  });

  it("renders no row with no ROR-linked current affiliation and no lapsed id, and none at all without the listing prop", () => {
    renderPanel(
      quietCv({ closed: true }),
      snapshot({ institutionPage: NO_INSTITUTION_PAGE, affiliationRorId: null }),
    );
    expect(row()).toBeNull();
    cleanup();
    render(
      <WorklistPanel
        cv={quietCv({ closed: true })}
        locale="en-US"
        consentedRorIds={[]}
        onJump={vi.fn()}
      />,
    );
    expect(row()).toBeNull();
  });
});

describe("InstitutionListingRow — never for an anonymous viewer", () => {
  it("the anonymous editor renders no worklist, and so no row, even when given the listing", () => {
    render(
      <CvEditor
        cv={quietCv()}
        availableStyles={["apa"]}
        uiLocale="en-US"
        onChange={vi.fn()}
        variant="regions"
        anonymous
        institutionListing={{ state: snapshot(), onPublishStateChange: vi.fn() }}
      />,
    );
    expect(row()).toBeNull();
    expect(document.querySelector(".cv-worklist")).toBeNull();
    cleanup();
    // The owner's editor does get it.
    render(
      <CvEditor
        cv={quietCv()}
        availableStyles={["apa"]}
        uiLocale="en-US"
        onChange={vi.fn()}
        variant="regions"
        institutionListing={{ state: snapshot(), onPublishStateChange: vi.fn() }}
      />,
    );
    expect(row()).toBeTruthy();
  });
});
