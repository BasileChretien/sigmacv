// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import ItemRow from "@/components/ItemRow";
import type { CvItem } from "@/lib/canonical/schema";

/**
 * The "not mine" control is offered only for items an EXTERNAL source attributed
 * to the account holder by identifier match (OpenAlex / DataCite / Open Editors
 * Plus) — where a wrong match is a real disambiguation error. ORCID records are
 * self-asserted and manual entries self-added, so they get Hide / Delete only.
 * Every item gets Hide.
 */
function makeItem(
  over: Partial<CvItem> & Pick<CvItem, "id" | "source">,
): CvItem {
  return {
    sourceId: over.source,
    displayText: "Item",
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    meta: {},
    ...over,
  } as CvItem;
}

const noop = () => {};
function renderRow(item: CvItem) {
  render(
    <ul>
      <ItemRow
        item={item}
        locale="en-US"
        isFirst
        isLast
        onToggleIncluded={noop}
        onToggleNotMine={noop}
        onMoveUp={noop}
        onMoveDown={noop}
      />
    </ul>,
  );
}

afterEach(cleanup);

describe("ItemRow — 'not mine' eligibility", () => {
  it("shows Hide AND 'not mine' for an OEP editorial role", () => {
    renderRow(
      makeItem({
        id: "editorial:bmj:associate-editor",
        source: "oep",
        displayText: "Associate Editor, BMJ",
      }),
    );
    expect(screen.getByRole("button", { name: /^hide/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /not mine/i })).toBeTruthy();
  });

  it("shows 'not mine' for an OpenAlex publication and a DataCite dataset", () => {
    renderRow(
      makeItem({
        id: "w1",
        source: "openalex",
        csl: {
          id: "w1",
          type: "article-journal",
          title: "A paper",
        } as CvItem["csl"],
      }),
    );
    expect(screen.getByRole("button", { name: /not mine/i })).toBeTruthy();
    cleanup();
    renderRow(makeItem({ id: "d1", source: "datacite", displayText: "Dataset" }));
    expect(screen.getByRole("button", { name: /not mine/i })).toBeTruthy();
  });

  it("offers Hide but NOT 'not mine' for self-asserted ORCID + manual items", () => {
    renderRow(
      makeItem({
        id: "position:orcid:1",
        source: "orcid",
        displayText: "Pharmacist, CHU de Caen",
      }),
    );
    expect(screen.getByRole("button", { name: /^hide/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /not mine/i })).toBeNull();
    cleanup();
    renderRow(makeItem({ id: "skills:manual:1", source: "manual", displayText: "Python" }));
    expect(screen.getByRole("button", { name: /^hide/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /not mine/i })).toBeNull();
  });

  it("renders the 'not mine' badge for a flagged editorial role", () => {
    renderRow(
      makeItem({
        id: "editorial:lancet:reviewer",
        source: "oep",
        displayText: "Reviewer, Lancet",
        notMine: true,
      }),
    );
    // The localized badge text ("not mine") appears in addition to the button.
    expect(screen.getAllByText(/not mine/i).length).toBeGreaterThan(0);
    // And the row is marked as a not-mine row for styling.
    expect(document.querySelector("li.is-not-mine")).toBeTruthy();
  });
});
