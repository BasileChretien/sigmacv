// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import WorklistPanel from "@/components/WorklistPanel";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { workspaceUi } from "@/lib/i18n/workspaceUi";

/**
 * The deposit action under a closed journal article: one place with its reason
 * and what the recorded policy asks of the form, the other places and
 * ShareYourPaper behind a disclosure, a Copy-DOI button, the choice of affiliation
 * when it would change the action, and one analytics event per click carrying the
 * route's kind only.
 */

const EN = workspaceUi("en-US");
const ACCEPTED = {
  source: "oa.works" as const,
  canArchive: true,
  versions: ["acceptedVersion" as const],
  locations: ["Institutional Repository"],
  licence: "cc-by-nc-nd",
  embargoMonths: 12,
  embargoEnd: "2999-01-01",
  retrievedAt: "2026-09-15T08:00:00.000Z",
};

function work(meta: CvItem["meta"], csl: Record<string, unknown> = {}): CvItem {
  return {
    id: "W1",
    source: "openalex",
    sourceId: "https://openalex.org/W1",
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id: "W1", type: "article-journal", title: "Work W1", DOI: "10.1234/w1", ...csl },
    meta: { year: 2023, oaIsOpen: false, ...meta },
  };
}

function makeCv(item: CvItem, owner: Record<string, unknown> = {}): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "wdp",
    owner: {
      orcid: "0000-0002-7483-2489",
      openAlexAuthorIds: ["A1"],
      displayName: "Owner",
      ...owner,
    },
    display: {},
    sections: [
      {
        id: "pubs",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items: [item],
      },
    ],
    provenance: { generatedAt: "2026-09-15T00:00:00.000Z", sources: ["openalex"] },
  });
}

const deposit = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-worklist="deposit"]')!;
const primaryText = (container: HTMLElement) =>
  deposit(container).querySelector(".cv-worklist-deposit-primary")!.textContent;

beforeEach(() => {
  window.plausible = vi.fn() as unknown as typeof window.plausible;
});
afterEach(() => {
  cleanup();
  delete window.plausible;
});

describe("WorklistPanel — the deposit action", () => {
  it("offers one place with its reason and the form's conditions, then the other places and ShareYourPaper", () => {
    const { container } = render(
      <WorklistPanel
        cv={makeCv(work({ selfArchiving: ACCEPTED, workCountries: ["FR"] }))}
        locale="en-US"
      />,
    );
    const block = deposit(container);
    const primary = block.querySelector<HTMLElement>(".cv-worklist-deposit-primary")!;
    const link = within(primary).getByRole("link", {
      name: "Deposit the accepted manuscript in HAL",
    });
    expect(link.getAttribute("href")).toBe("https://hal.science/submit");
    expect(link.getAttribute("target")).toBe("_blank");
    expect(primary.textContent).toContain("— because of your affiliation on this paper (France)");
    expect(block.querySelector(".cv-worklist-deposit-notes")!.textContent).toBe(
      `In the form, set the licence to cc-by-nc-nd. Keep the file under embargo until 2999-01-01. ${EN.wlDepositHalDoi}`,
    );
    const others = block.querySelector("details")!;
    expect(others.querySelector("summary")!.textContent).toBe(EN.wlDepositOtherPlaces);
    expect(within(others).getByRole("link", { name: "Zenodo" }).getAttribute("href")).toBe(
      "https://zenodo.org/uploads/new",
    );
    expect(others.textContent).toContain("open to any researcher");
    expect(within(others).getByRole("link", { name: "ShareYourPaper" }).getAttribute("href")).toBe(
      "https://shareyourpaper.org/10.1234/w1",
    );
    expect(container.textContent).toContain(EN.wlDepositHelp);
    // Actions, never states: no count anywhere in the block.
    expect(block.textContent).not.toMatch(/\d+ (of|works)|%/);
  });

  it("says “only if” — naming a statutory right only when an author's right is shown — when the record allows no deposit", () => {
    const refused = { ...ACCEPTED, canArchive: false, versions: [], locations: [] };
    const { container, unmount } = render(
      <WorklistPanel
        cv={makeCv(work({ selfArchiving: refused, workCountries: ["FR"] }))}
        locale="en-US"
      />,
    );
    expect(primaryText(container)).toContain(
      "Deposit in HAL only if a right shown above or your publishing agreement allows it",
    );
    unmount();
    const rendered = render(
      <WorklistPanel cv={makeCv(work({ selfArchiving: refused }))} locale="en-US" />,
    );
    expect(primaryText(rendered.container)).toContain(
      "Deposit in Zenodo only if your publishing agreement allows it",
    );
    rendered.unmount();
    // Spain's rule is a deposit requirement, not a right over the publisher's terms:
    // shown above the work, but never offered as what allows the deposit.
    const spain = render(
      <WorklistPanel
        cv={makeCv(work({ selfArchiving: refused, workCountries: ["ES"] }))}
        locale="en-US"
      />,
    );
    expect(spain.container.querySelector('[data-worklist="rights"]')!.textContent).toContain(
      "(Spain)",
    );
    expect(primaryText(spain.container)).toContain(
      "Deposit in Zenodo only if your publishing agreement allows it",
    );
  });

  it("sends one analytics event per click, carrying the route's kind only", () => {
    const { container } = render(
      <WorklistPanel cv={makeCv(work({ workCountries: ["FR"] }))} locale="en-US" />,
    );
    const block = deposit(container);
    fireEvent.click(
      within(block).getByRole("link", { name: /in HAL if the journal's policy allows it$/ }),
    );
    fireEvent.click(within(block).getByRole("link", { name: "ShareYourPaper" }));
    expect(window.plausible).toHaveBeenNthCalledWith(1, "Deposit route", {
      props: { kind: "national" },
    });
    expect(window.plausible).toHaveBeenNthCalledWith(2, "Deposit route", {
      props: { kind: "shareyourpaper" },
    });
  });

  it("copies the DOI, and says so", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const { container } = render(
      <WorklistPanel cv={makeCv(work({ workCountries: ["FR"] }))} locale="en-US" />,
    );
    fireEvent.click(within(deposit(container)).getByRole("button", { name: EN.wlDepositCopyDoi }));
    expect(writeText).toHaveBeenCalledWith("10.1234/w1");
    expect(await screen.findByRole("button", { name: EN.wlDepositDoiCopied })).toBeTruthy();
  });

  it("keeps the button as it was when the clipboard refuses", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const { container } = render(
      <WorklistPanel cv={makeCv(work({ workCountries: ["FR"] }))} locale="en-US" />,
    );
    const button = within(deposit(container)).getByRole("button", { name: EN.wlDepositCopyDoi });
    fireEvent.click(button);
    await vi.waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(button.textContent).toBe(EN.wlDepositCopyDoi);
  });

  it("lets the owner route by their current affiliation when it changes the action", () => {
    const { container } = render(
      <WorklistPanel
        cv={makeCv(work({ workCountries: ["FR"] }))}
        locale="en-US"
        currentAffiliationCountry="JP"
      />,
    );
    const fieldset = container.querySelector<HTMLElement>("fieldset.cv-worklist-deposit-basis")!;
    expect(fieldset.textContent).toContain("your current affiliation (Japan)");
    fireEvent.click(within(fieldset).getByLabelText(/your current affiliation/));
    expect(primaryText(container)).toContain("in Zenodo if the journal's policy allows it");
    expect(primaryText(container)).toContain(
      "because SigmaCV doesn't know of a national repository for your current affiliation (Japan)",
    );
    expect(deposit(container).querySelector(".cv-worklist-deposit-notes")!.textContent).toBe(
      EN.wlDepositZenodoDoi,
    );
    fireEvent.click(within(fieldset).getByLabelText(EN.wlDepositBasisPaper));
    expect(primaryText(container)).toContain("in HAL");
  });

  it("offers no choice when the current affiliation is unknown, the same, or would change nothing", () => {
    for (const [countries, currentAffiliationCountry] of [
      [["FR"], undefined],
      [["FR"], "FR"],
      [["JP"], "US"],
    ] as const) {
      const { container } = render(
        <WorklistPanel
          cv={makeCv(work({ workCountries: [...countries] }))}
          locale="en-US"
          currentAffiliationCountry={currentAffiliationCountry}
        />,
      );
      expect(container.querySelector("fieldset.cv-worklist-deposit-basis")).toBeNull();
      cleanup();
    }
  });

  it("puts a confirmed funder repository first, and another repository of the owner's after the national one", () => {
    const own = {
      sourceId: "S4306401454",
      name: "Kyoto Repository",
      url: "https://repo.kyoto.example",
    };
    const { container, unmount } = render(
      <WorklistPanel
        cv={makeCv(work({ workCountries: ["FR"] }), { depositRepositories: [own] })}
        locale="en-US"
      />,
    );
    expect(primaryText(container)).toContain("in HAL");
    expect(deposit(container).querySelector("details")!.textContent).toContain(
      "Kyoto Repository — because OpenAlex lists some of your works in Kyoto Repository",
    );
    unmount();
    const funded = work({
      workCountries: ["FR"],
      funders: [{ id: "https://openalex.org/F100", name: "NIH" }],
    });
    const rendered = render(
      <WorklistPanel
        cv={makeCv(funded)}
        locale="en-US"
        funderCrosswalk={[
          {
            openalexId: "F100",
            fundrefDoi: "10.13039/100000002",
            name: "National Institutes of Health",
          },
        ]}
      />,
    );
    expect(primaryText(rendered.container)).toContain(
      "Deposit the accepted manuscript in PubMed Central (NIHMS) — because this work names National Institutes of Health (a co-author may already have submitted it)",
    );
  });

  it("is for journal articles only, and keeps the journal-policy search until OA.Works links the publisher's policy", () => {
    const venue = { "container-title": "Journal of Tests" };
    const book = render(
      <WorklistPanel
        cv={makeCv(work({ workCountries: ["FR"] }, { type: "book" }))}
        locale="en-US"
      />,
    );
    expect(book.container.querySelector('[data-worklist="deposit"]')).toBeNull();
    expect(book.container.textContent).not.toContain(EN.wlDepositHelp);
    book.unmount();

    const unrecorded = render(<WorklistPanel cv={makeCv(work({}, venue))} locale="en-US" />);
    expect(unrecorded.queryByRole("link", { name: EN.wlPolicyLink })).not.toBeNull();
    unrecorded.unmount();
    const recorded = (policy: Partial<typeof ACCEPTED> & { policyUrl?: string }) =>
      render(
        <WorklistPanel
          cv={makeCv(work({ selfArchiving: { ...ACCEPTED, ...policy } }, venue))}
          locale="en-US"
        />,
      );
    const linked = recorded({ policyUrl: "https://perma.cc/J5MA-H2EJ" });
    expect(linked.queryByRole("link", { name: EN.wlPolicyLink })).toBeNull();
    linked.unmount();
    // A refusal recorded without a link to the publisher's policy keeps the search:
    // otherwise the row would carry no link to any policy at all.
    const unlinked = recorded({ canArchive: false, versions: [], locations: [] });
    expect(unlinked.queryByRole("link", { name: EN.wlPolicyLink })).not.toBeNull();
  });

  it("shows no Copy DOI and no ShareYourPaper for a work without a DOI, and speaks the viewer's language", () => {
    const { container } = render(
      <WorklistPanel
        cv={makeCv(work({ workCountries: ["FR"], selfArchiving: ACCEPTED }, { DOI: undefined }))}
        locale="fr-FR"
      />,
    );
    const block = deposit(container);
    expect(within(block).queryByRole("button")).toBeNull();
    expect(within(block).queryByRole("link", { name: "ShareYourPaper" })).toBeNull();
    expect(block.textContent).toContain("Déposer le manuscrit accepté dans HAL");
  });
});
