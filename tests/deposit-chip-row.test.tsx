// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import CvEditor from "@/components/CvEditor";
import SectionsList from "@/components/SectionsList";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";

/**
 * The deposit chip on a publication row (the editor's Content tab): a journal
 * article with no open copy found carries the one deposit action's destination
 * and jumps to its row in the Open access tab. Owner only — the no-login preview
 * and a bare sections list show none. It reads the same basis as the worklist.
 */

type SelfArchiving = NonNullable<CvItem["meta"]["selfArchiving"]>;
const record = (over: Partial<SelfArchiving> = {}): SelfArchiving => ({
  source: "oa.works",
  canArchive: true,
  versions: ["acceptedVersion"],
  locations: [],
  retrievedAt: "2026-09-15T00:00:00.000Z",
  ...over,
});

function work(id: string, meta: CvItem["meta"] = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id, type: "article-journal", title: `Work ${id}`, DOI: `10.1234/${id}` },
    meta: { year: 2023, oaIsOpen: false, workCountries: ["FR"], ...meta },
  };
}

function makeCv(works: CvItem[]): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "chip",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Owner" },
    display: {},
    sections: [
      {
        id: "pubs",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items: works,
      },
    ],
    provenance: { generatedAt: "2026-09-15T00:00:00.000Z", sources: ["openalex"] },
  });
}

const chips = () => [...document.querySelectorAll<HTMLButtonElement>("button.cv-deposit-chip")];

/** Sections start collapsed (rows mount on expand): open every one, as the owner would. */
const expandSections = () =>
  document
    .querySelectorAll<HTMLButtonElement>('button.section-toggle[aria-expanded="false"]')
    .forEach((b) => fireEvent.click(b));

function renderEditor(cv: CanonicalCv, over: Partial<React.ComponentProps<typeof CvEditor>> = {}) {
  const view = render(
    <CvEditor
      cv={cv}
      availableStyles={["apa"]}
      uiLocale="en-US"
      onChange={vi.fn()}
      variant="regions"
      {...over}
    />,
  );
  expandSections();
  return view;
}

beforeAll(() => {
  // jsdom implements no layout: no scrollIntoView, and no frame timing.
  Element.prototype.scrollIntoView = vi.fn();
  window.requestAnimationFrame = (cb) => window.setTimeout(() => cb(0), 0);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);
});
afterEach(cleanup);

describe("Deposit chip on a publication row", () => {
  it("names the destination on a closed journal article only, and 'if allowed' when the record names another place", () => {
    renderEditor(
      makeCv([
        work("W-closed"),
        work("W-open", { oaIsOpen: true }),
        // A place the record does not name, and the French right not yet run.
        work("W-if", { year: 2026, selfArchiving: record({ locations: ["Preprint Server"] }) }),
      ]),
    );
    expect(chips().map((b) => b.textContent)).toEqual([
      "Deposit in HAL",
      "Deposit in HAL if allowed",
    ]);
    // On the closed row, after its badges; the open work's row has none.
    const closedRow = chips()[0]!.closest("li")!;
    expect(closedRow.textContent).toContain("Work W-closed");
    expect(
      screen
        .getByText("Work W-open", { exact: false })
        .closest("li")!
        .querySelector(".cv-deposit-chip"),
    ).toBeNull();
    expect(chips()[0]!.getAttribute("title")).toBe("Opens this work in the Open access tab");
    // Described by a hidden note too — a title alone is not read by every screen reader.
    const note = document.getElementById(chips()[0]!.getAttribute("aria-describedby")!)!;
    expect(note.textContent).toBe("Opens this work in the Open access tab");
  });

  it("jumps to the work's row in the Open access tab: tab selected, disclosure open, row scrolled and focused", async () => {
    renderEditor(makeCv([work("W-closed")]));
    const openAccessTab = screen.getByRole("tab", { name: "Open access" });
    expect(openAccessTab.getAttribute("aria-selected")).toBe("false");
    const panel = document.querySelector<HTMLDetailsElement>("details.cv-worklist")!;
    panel.open = false; // the owner had folded it
    fireEvent.click(chips()[0]!);
    expect(openAccessTab.getAttribute("aria-selected")).toBe("true");
    const row = document.querySelector<HTMLElement>('[data-worklist-item="W-closed"]')!;
    await vi.waitFor(() => expect(document.activeElement).toBe(row));
    expect(panel.open).toBe(true);
    const scrolls = vi.mocked(Element.prototype.scrollIntoView).mock.calls.length;
    expect(scrolls).toBeGreaterThan(0);
    // A second jump to the row already focused scrolls again (the owner may
    // have scrolled away meanwhile).
    fireEvent.click(chips()[0]!);
    await vi.waitFor(() =>
      expect(vi.mocked(Element.prototype.scrollIntoView).mock.calls.length).toBe(scrolls + 1),
    );
    // The row jumps back to the item in Content — the two surfaces point at each other.
    fireEvent.click(within(row).getByRole("button", { name: /Work W-closed/ }));
    expect(screen.getByRole("tab", { name: "Content" }).getAttribute("aria-selected")).toBe("true");
  });

  it("follows the worklist's basis choice: routing by the current affiliation changes the chip too", () => {
    renderEditor(makeCv([work("W-closed")]), { currentAffiliationCountry: "JP" });
    expect(chips()[0]!.textContent).toBe("Deposit in HAL");
    const fieldset = document.querySelector<HTMLElement>("fieldset.cv-worklist-deposit-basis")!;
    fireEvent.click(within(fieldset).getAllByRole("radio", { hidden: true })[1]!);
    expect(chips()[0]!.textContent).toBe("Deposit in Zenodo");
  });

  it("is present in the classic layout too", () => {
    renderEditor(makeCv([work("W-closed")]), { variant: "classic" });
    expect(chips()).toHaveLength(1);
  });

  it("never shows for the anonymous preview, nor on a sections list rendered without the editor", () => {
    renderEditor(makeCv([work("W-closed")]), { anonymous: true });
    expect(chips()).toHaveLength(0);
    cleanup();
    render(<SectionsList cv={makeCv([work("W-closed")])} locale="en-US" onChange={vi.fn()} />);
    expandSections();
    expect(chips()).toHaveLength(0);
  });
});
