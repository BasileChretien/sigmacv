// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import WorklistPanel from "@/components/WorklistPanel";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { workspaceUi } from "@/lib/i18n/workspaceUi";

/**
 * The deposit action under a closed journal article: one visible line — place,
 * reason, Copy DOI — and, behind the row's disclosure, what the recorded policy
 * asks of the form, the other places and ShareYourPaper; the choice of
 * affiliation when it would change the action; one analytics event per click
 * carrying the route's kind only; closed works ordered by what the owner can do
 * now; and the accessibility contract (one status region, described-by notes).
 */

const EN = workspaceUi("en-US");
const ACCEPTED = {
  source: "oa.works" as const,
  canArchive: true,
  versions: ["acceptedVersion" as const],
  locations: ["Institutional Repository"],
  licence: "cc-by-nc-nd",
  embargoMonths: 12,
  embargoEnd: "2021-01-23",
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

function makeCv(item: CvItem | CvItem[], owner: Record<string, unknown> = {}): CanonicalCv {
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
        items: Array.isArray(item) ? item : [item],
      },
    ],
    provenance: { generatedAt: "2026-09-15T00:00:00.000Z", sources: ["openalex"] },
  });
}

const deposit = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-worklist="deposit"]')!;
/** The notes and the other places: behind the row's disclosure. */
const depositDetails = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-worklist="deposit-details"]')!;
const primaryText = (container: HTMLElement) =>
  deposit(container).querySelector(".cv-worklist-deposit-primary")!.textContent;
/** Open every row's disclosure, as the owner would, so role queries reach inside. */
const openRows = (container: HTMLElement) =>
  container
    .querySelectorAll<HTMLDetailsElement>("details.cv-worklist-row-more")
    .forEach((d) => (d.open = true));
/** Rebuild a work under another id (the fixture's id is fixed). */
const withId = (item: CvItem, id: string, title: string): CvItem => ({
  ...item,
  id,
  sourceId: `https://openalex.org/${id}`,
  csl: { ...item.csl!, id, title, DOI: `10.1234/${id}` },
});

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
    // The form notes and the other places sit behind the row's disclosure, not on
    // the visible line.
    openRows(container);
    const details = depositDetails(container);
    expect(block.contains(details)).toBe(false);
    expect(details.closest("details.cv-worklist-row-more")).not.toBeNull();
    expect(details.querySelector(".cv-worklist-deposit-notes")!.textContent).toBe(
      `In the form, set the licence to cc-by-nc-nd. ${EN.wlDepositHalDoi}`,
    );
    const others = details.querySelector("details")!;
    expect(others.querySelector("summary")!.textContent).toBe(EN.wlDepositOtherPlaces);
    expect(within(others).getByRole("link", { name: "Zenodo" }).getAttribute("href")).toBe(
      "https://zenodo.org/uploads/new",
    );
    expect(others.textContent).toContain("open to any researcher");
    expect(within(others).getByRole("link", { name: "ShareYourPaper" }).getAttribute("href")).toBe(
      "https://shareyourpaper.org/10.1234/w1",
    );
    // Actions, never states: no count anywhere in the block.
    expect(block.textContent).not.toMatch(/\d+ (of|works)|%/);
  });

  it("says “only if” for a place the record does not name — naming a statutory right only when one is shown — and lists nothing with no ground", () => {
    // The record names another place, and the French right has not run (2026).
    const elsewhere = {
      ...ACCEPTED,
      locations: ["Preprint Server"],
      embargoMonths: 0,
      embargoEnd: undefined,
    };
    const { container, unmount } = render(
      <WorklistPanel
        cv={makeCv(work({ year: 2026, selfArchiving: elsewhere, workCountries: ["FR"] }))}
        locale="en-US"
      />,
    );
    expect(primaryText(container)).toContain(
      "Deposit in HAL only if a right shown above or your publishing agreement allows it",
    );
    unmount();
    const rendered = render(
      <WorklistPanel cv={makeCv(work({ selfArchiving: elsewhere }))} locale="en-US" />,
    );
    expect(primaryText(rendered.container)).toContain(
      "Deposit in Zenodo only if your publishing agreement allows it",
    );
    rendered.unmount();
    // A refusal on record, but the French right has run: the law is the ground,
    // and the action names the accepted manuscript outright.
    const refused = { ...ACCEPTED, canArchive: false, versions: [], locations: [] };
    const byLaw = render(
      <WorklistPanel
        cv={makeCv(work({ selfArchiving: refused, workCountries: ["FR"] }))}
        locale="en-US"
      />,
    );
    expect(primaryText(byLaw.container)).toContain("Deposit the accepted manuscript in HAL");
    expect(byLaw.container.querySelector('[data-worklist="why"]')!.textContent).toBe(
      "Allowed by law — Code de la recherche, art. L533-4 (loi n° 2016-1321, art. 30) (France): the accepted manuscript, 12 months after publication (since 2024-12-31), under the conditions in the record below.",
    );
    byLaw.unmount();
    // Spain's rule is a deposit requirement, not a right over the publisher's
    // terms: with a refusal on record there is no ground today, so no row.
    const spain = render(
      <WorklistPanel
        cv={makeCv(work({ selfArchiving: refused, workCountries: ["ES"] }))}
        locale="en-US"
      />,
    );
    expect(spain.container.querySelector('[data-worklist="deposit"]')).toBeNull();
    expect(spain.container.textContent).not.toContain("(Spain)");
  });

  it("sends one analytics event per click, carrying the route's kind only", () => {
    const { container } = render(
      <WorklistPanel cv={makeCv(work({ workCountries: ["FR"] }))} locale="en-US" />,
    );
    const block = deposit(container);
    fireEvent.click(
      within(block).getByRole("link", { name: "Deposit the accepted manuscript in HAL" }),
    );
    openRows(container);
    fireEvent.click(
      within(depositDetails(container)).getByRole("link", { name: "ShareYourPaper" }),
    );
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
    expect(primaryText(container)).toContain("Deposit the accepted manuscript in Zenodo");
    expect(primaryText(container)).toContain(
      "because SigmaCV doesn't know of a national repository for your current affiliation (Japan)",
    );
    expect(depositDetails(container).querySelector(".cv-worklist-deposit-notes")!.textContent).toBe(
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
    expect(depositDetails(container).textContent).toContain(
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

    const unrecorded = render(
      <WorklistPanel cv={makeCv(work({ workCountries: ["FR"] }, venue))} locale="en-US" />,
    );
    expect(unrecorded.queryByRole("link", { name: EN.wlPolicyLink })).not.toBeNull();
    unrecorded.unmount();
    const recorded = (policy: Partial<typeof ACCEPTED> & { policyUrl?: string }) =>
      render(
        <WorklistPanel
          cv={makeCv(
            work({ selfArchiving: { ...ACCEPTED, ...policy }, workCountries: ["FR"] }, venue),
          )}
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
    openRows(container);
    expect(
      within(depositDetails(container)).queryByRole("link", { name: "ShareYourPaper" }),
    ).toBeNull();
    expect(block.textContent).toContain("Déposer le manuscrit accepté dans HAL");
  });

  it("measures today against the panel's one clock: the same paper is listed or not by the date given", () => {
    const cv = makeCv(work({ workCountries: ["FR"] })); // 2023: the right runs to 2024-12-31
    const early = render(<WorklistPanel cv={cv} locale="en-US" today="2024-06-01" />);
    expect(early.container.querySelector('[data-worklist="deposit"]')).toBeNull();
    early.unmount();
    const later = render(<WorklistPanel cv={cv} locale="en-US" today="2025-01-01" />);
    expect(later.container.querySelector('[data-worklist="why"]')!.textContent).toContain(
      "(since 2024-12-31)",
    );
  });

  it("lists nothing for a work with no ground today — no record, no right — even if closed", () => {
    const { container } = render(
      <WorklistPanel cv={makeCv(work({}, { DOI: undefined }))} locale="en-US" />,
    );
    expect(container.querySelector('[data-worklist="deposit"]')).toBeNull();
    expect(container.querySelector(".cv-worklist-row")).toBeNull();
  });

  it("orders the rows by what the owner can do now: a named version or a statutory ground first, then only-if; a book is never listed", () => {
    // French papers of 2026: the right has not run, so the record decides —
    // except for the 2023 paper with no record, where the right is the ground.
    const base = work({ year: 2026, workCountries: ["FR"] });
    const conditional = withId(
      {
        ...base,
        meta: { ...base.meta, selfArchiving: { ...ACCEPTED, locations: ["Preprint Server"] } },
      },
      "W-cond",
      "Only if",
    );
    const byLaw = withId({ ...base, meta: { ...base.meta, year: 2023 } }, "W-law", "By law");
    const named = withId(
      { ...base, meta: { ...base.meta, selfArchiving: ACCEPTED } },
      "W-named",
      "Named",
    );
    const book = {
      ...withId(base, "W-book", "A book"),
      csl: { ...base.csl!, id: "W-book", title: "A book", type: "book" },
    };
    const { container } = render(
      <WorklistPanel cv={makeCv([conditional, byLaw, book, named])} locale="en-US" />,
    );
    const heads = [...container.querySelectorAll(".cv-worklist-row-head")].map((h) =>
      h.textContent?.replace(/\s*\(20\d\d\).*$/, "").trim(),
    );
    expect(heads).toEqual(["By law", "Named", "Only if"]);
  });

  it("shows two lines per work and keeps the rest behind one disclosure; the title is the h2 and the group an h3", () => {
    const { container } = render(
      <WorklistPanel
        cv={makeCv(work({ selfArchiving: ACCEPTED, workCountries: ["FR"] }))}
        locale="en-US"
      />,
    );
    const row = container.querySelector(".cv-worklist-row")!;
    expect(row.querySelector(".cv-worklist-row-head")!.textContent).toContain("Work W1 (2023)");
    // The action line is visible, outside the disclosure.
    expect(
      row.querySelector('[data-worklist="deposit"]')!.closest("details.cv-worklist-row-more"),
    ).toBeNull();
    // The rights and the deposit details are inside it, under one summary.
    const more = row.querySelector<HTMLDetailsElement>("details.cv-worklist-row-more")!;
    expect(more.open).toBe(false);
    expect(more.querySelector("summary")!.textContent).toBe(EN.wlRowDetails);
    expect(more.querySelector('[data-worklist="rights"]')).not.toBeNull();
    expect(more.querySelector('[data-worklist="deposit-details"]')).not.toBeNull();
    // Heading levels inside the tabpanel.
    expect(screen.getByRole("heading", { level: 2, name: EN.wlTitle })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 3, name: EN.wlClosedHeading })).toBeTruthy();
  });

  it("announces DOI copied once, in one status region, and describes every external link and jump button by a hidden note", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const { container } = render(
      <WorklistPanel
        cv={makeCv(work({ selfArchiving: ACCEPTED, workCountries: ["FR"] }))}
        locale="en-US"
        onJump={vi.fn()}
      />,
    );
    const status = screen.getByTestId("worklist-status");
    expect(status.getAttribute("role")).toBe("status");
    expect(status.textContent).toBe("");
    const copy = within(deposit(container)).getByRole("button", { name: EN.wlDepositCopyDoi });
    expect(copy.getAttribute("aria-live")).toBeNull();
    fireEvent.click(copy);
    await vi.waitFor(() => expect(status.textContent).toBe(EN.wlDepositDoiCopied));
    // A second copy within the clearing delay is announced too: the same words,
    // but a different text node (a zero-width space no reader voices).
    fireEvent.click(copy);
    await vi.waitFor(() => expect(status.textContent).not.toBe(EN.wlDepositDoiCopied));
    expect(status.textContent!.replace(/\u200b/g, "")).toBe(EN.wlDepositDoiCopied);
    expect(container.querySelectorAll("[aria-live]")).toHaveLength(1);
    // Described-by: the notes exist once and every external link points at the same one.
    openRows(container);
    const external = [...container.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]')];
    expect(external.length).toBeGreaterThan(2);
    const noteIds = new Set(external.map((a) => a.getAttribute("aria-describedby")));
    expect(noteIds.size).toBe(1);
    const note = document.getElementById([...noteIds][0]!)!;
    expect(note.textContent).toBe(EN.wlOpensNewTab);
    const jumpButton = screen.getByRole("button", { name: /Work W1/ });
    expect(document.getElementById(jumpButton.getAttribute("aria-describedby")!)!.textContent).toBe(
      EN.wlJump,
    );
  });
});
