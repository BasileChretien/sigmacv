// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ItemRow from "@/components/ItemRow";
import type { CvItem, CvSectionType } from "@/lib/canonical/schema";

/**
 * The "not mine" control is offered for items an EXTERNAL source attributed to
 * the account holder by identifier match (OpenAlex / DataCite / Open Editors
 * Plus) — where a wrong match is a real disambiguation error — AND for every
 * Positions row except manual ones (a wrong institution, whether OpenAlex-
 * inferred or self-asserted in ORCID, can be corrected). Manual entries and
 * non-Positions ORCID records (education, awards, …) get Hide / Delete only.
 * Every item gets Hide.
 */
function makeItem(over: Partial<CvItem> & Pick<CvItem, "id" | "source">): CvItem {
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
function renderRow(item: CvItem, sectionType?: CvSectionType) {
  render(
    <ul>
      <ItemRow
        item={item}
        locale="en-US"
        sectionType={sectionType}
        isFirst
        isLast
        onToggleIncluded={noop}
        onToggleNotMine={noop}
        onRemove={item.source === "manual" ? noop : undefined}
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

  it("offers Hide but NOT 'not mine' for non-Positions ORCID + manual items", () => {
    // A self-asserted ORCID record OUTSIDE Positions (e.g. Education) is not a
    // third-party attribution → Hide only.
    renderRow(
      makeItem({
        id: "education:orcid:1",
        source: "orcid",
        displayText: "PharmD, Université de Caen",
      }),
      "education",
    );
    expect(screen.getByRole("button", { name: /^hide/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /not mine/i })).toBeNull();
    cleanup();
    renderRow(
      makeItem({ id: "skills:manual:1", source: "manual", displayText: "Python" }),
      "skills",
    );
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

  it("shows 'not mine' for ORCID-matched OpenAIRE + DBLP outputs", () => {
    renderRow(
      makeItem({ id: "dataset:openaire:1", source: "openaire", displayText: "OpenAIRE dataset" }),
    );
    expect(screen.getByRole("button", { name: /not mine/i })).toBeTruthy();
    cleanup();
    renderRow(makeItem({ id: "conference:dblp:1", source: "dblp", displayText: "Conf paper" }));
    expect(screen.getByRole("button", { name: /not mine/i })).toBeTruthy();
  });
});

describe("ItemRow — name+org review candidates", () => {
  it("flags a name-matched grant for review, offers Show (hidden) but NOT 'not mine'", () => {
    renderRow(
      makeItem({
        id: "grant:nih:5R01",
        source: "nih",
        displayText: "NIH grant",
        included: false, // review candidates start hidden
        meta: { reviewFlag: "name-matched" },
      }),
    );
    // A "probably yours" candidate gets the calm, neutral chip — no ⚠ alarm.
    expect(document.querySelector(".cv-review-badge--soft")).toBeTruthy();
    expect(screen.getByText("Review")).toBeTruthy();
    expect(screen.queryByText(/⚠/)).toBeNull();
    expect(screen.getByRole("button", { name: /^show/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /not mine/i })).toBeNull();
  });

  it("labels the registry data source on a clinical-trial candidate", () => {
    renderRow(
      makeItem({
        id: "trial:clinicaltrials:NCT1",
        source: "clinicaltrials",
        displayText: "A trial [NCT1]",
        included: false,
        meta: { reviewFlag: "name-matched" },
      }),
    );
    expect(screen.getByText("ClinicalTrials.gov")).toBeTruthy();
  });
});

describe("ItemRow — ORCID-discovered review candidates", () => {
  const orcidDoiCandidate = (over: Partial<CvItem> = {}) =>
    makeItem({
      id: "W9000001",
      source: "openalex",
      csl: {
        id: "W9000001",
        type: "article-journal",
        title: "An ORCID-listed paper",
      } as CvItem["csl"],
      included: false, // discovered candidates start hidden
      meta: { reviewFlag: "orcid-doi" },
      ...over,
    });

  it("flags a hidden orcid-doi candidate for review, offering Show AND 'not mine'", () => {
    renderRow(orcidDoiCandidate());
    // Probably yours (listed in your ORCID) → neutral chip, not the ⚠ alarm.
    expect(document.querySelector(".cv-review-badge--soft")).toBeTruthy();
    expect(screen.getByText("Review")).toBeTruthy();
    expect(screen.queryByText(/⚠/)).toBeNull();
    expect(screen.getByRole("button", { name: /^show/i })).toBeTruthy();
    // It's a citation (OpenAlex) → "not mine" IS offered (unlike name-matched registries).
    expect(screen.getByRole("button", { name: /not mine/i })).toBeTruthy();
  });

  it("drops the review badge once the candidate is confirmed (included)", () => {
    renderRow(orcidDoiCandidate({ included: true }));
    expect(document.querySelector(".cv-review-badge")).toBeNull();
  });
});

describe("ItemRow — duplicate comparison", () => {
  const preprint = () =>
    makeItem({
      id: "W_pre",
      source: "openalex",
      csl: {
        id: "W_pre",
        type: "article-journal",
        title: "My Preprint",
        author: [{ family: "Smith" }],
        DOI: "10.1101/x",
      } as CvItem["csl"],
      meta: {
        year: 2023,
        doi: "10.1101/x",
        peerReviewed: false,
        reviewFlag: "duplicate",
        duplicateOf: {
          itemId: "W_pub",
          tier: "strong",
          relationship: "preprint-of",
          groupId: "W_pub",
        },
      },
    });
  const published = makeItem({
    id: "W_pub",
    source: "openalex",
    csl: {
      id: "W_pub",
      type: "article-journal",
      title: "My Published Article",
      author: [{ family: "Smith" }],
      DOI: "10.1/x",
      "container-title": "Nature",
    } as CvItem["csl"],
    meta: { year: 2024, doi: "10.1/x", peerReviewed: true, citedByCount: 12 },
  });

  const dataset = makeItem({
    id: "D1",
    source: "datacite",
    displayText: "My Genome Dataset",
    meta: { year: 2024, doi: "10.5555/d" },
  });

  const threeMember = () => [
    { item: preprint(), sectionTitle: "Preprints" },
    { item: published, sectionTitle: "Publications" },
    { item: dataset, sectionTitle: "Datasets & Software" },
  ];

  function renderGroup(
    group: Array<{ item: CvItem; sectionTitle: string }>,
    h: { onKeepOnly?: (id: string) => void; onKeepAll?: () => void } = {},
  ) {
    render(
      <ul>
        <ItemRow
          item={preprint()}
          locale="en-US"
          sectionType="preprints"
          isFirst
          isLast
          onToggleIncluded={noop}
          onToggleNotMine={noop}
          duplicateGroup={group}
          onKeepOnly={h.onKeepOnly ?? (() => {})}
          onKeepAll={h.onKeepAll ?? noop}
          onMoveUp={noop}
          onMoveDown={noop}
        />
      </ul>,
    );
  }

  it("expands to show the full facts of EVERY member of a 3-item group", () => {
    renderGroup(threeMember());
    fireEvent.click(screen.getByRole("button", { name: /possible duplicate/i }));
    expect(screen.getByText("My Published Article")).toBeTruthy();
    expect(screen.getByText("My Genome Dataset")).toBeTruthy();
    expect(screen.getByText(/Nature/)).toBeTruthy();
    expect(screen.getByText(/12 citations/)).toBeTruthy();
    expect(screen.getByText(/in Publications/)).toBeTruthy();
    expect(screen.getByText(/in Datasets/)).toBeTruthy();
    expect(screen.getByText(/this entry/i)).toBeTruthy(); // the clicked (preprint) row
    expect(screen.getByText(/one is a preprint of the other/i)).toBeTruthy();
  });

  it("offers 'Keep this one' on each member and 'Keep all' for 3+", () => {
    let kept = "";
    renderGroup(threeMember(), {
      onKeepOnly: (id) => (kept = id),
      onKeepAll: () => (kept = "all"),
    });
    fireEvent.click(screen.getByRole("button", { name: /possible duplicate/i }));
    const keepButtons = screen.getAllByRole("button", { name: /keep this one/i });
    expect(keepButtons).toHaveLength(3);
    fireEvent.click(keepButtons[1]!); // keep the PUBLISHED entry (group order)
    expect(kept).toBe("W_pub");
    fireEvent.click(screen.getByRole("button", { name: /keep all/i }));
    expect(kept).toBe("all");
  });

  it("labels the keep-everything action 'Keep both' for a 2-member group", () => {
    renderGroup([
      { item: preprint(), sectionTitle: "Preprints" },
      { item: published, sectionTitle: "Publications" },
    ]);
    fireEvent.click(screen.getByRole("button", { name: /possible duplicate/i }));
    expect(screen.getByRole("button", { name: /keep both/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /keep all/i })).toBeNull();
  });

  it("opens the panel via the controlled `dupOpen` prop (editor review focus)", () => {
    render(
      <ul>
        <ItemRow
          item={preprint()}
          locale="en-US"
          sectionType="preprints"
          isFirst
          isLast
          onToggleIncluded={noop}
          onToggleNotMine={noop}
          duplicateGroup={threeMember()}
          dupOpen
          onMoveUp={noop}
          onMoveDown={noop}
        />
      </ul>,
    );
    // Panel is open WITHOUT a badge click (the editor drives it).
    expect(screen.getByText("My Published Article")).toBeTruthy();
  });

  it("delegates the badge click to onDupToggle when controlled", () => {
    let toggles = 0;
    render(
      <ul>
        <ItemRow
          item={preprint()}
          locale="en-US"
          sectionType="preprints"
          isFirst
          isLast
          onToggleIncluded={noop}
          onToggleNotMine={noop}
          duplicateGroup={threeMember()}
          dupOpen={false}
          onDupToggle={() => (toggles += 1)}
          onMoveUp={noop}
          onMoveDown={noop}
        />
      </ul>,
    );
    expect(screen.queryByText("My Published Article")).toBeNull(); // closed (controlled)
    fireEvent.click(screen.getByRole("button", { name: /possible duplicate/i }));
    expect(toggles).toBe(1);
    expect(screen.queryByText("My Published Article")).toBeNull(); // parent decides — still closed
  });
});

describe("ItemRow — Positions section", () => {
  it("offers 'not mine' for a self-asserted ORCID employment in Positions", () => {
    renderRow(
      makeItem({
        id: "position:orcid:1",
        source: "orcid",
        displayText: "Pharmacist, CHU de Caen",
      }),
      "positions",
    );
    expect(screen.getByRole("button", { name: /^hide/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /not mine/i })).toBeTruthy();
  });

  it("offers 'not mine' for an OpenAlex-inferred affiliation in Positions", () => {
    renderRow(
      makeItem({
        id: "position:openalex:nagoya-university",
        source: "openalex",
        sourceId: "openalex",
        displayText: "Nagoya University (2019–present)",
        included: false, // inferred affiliations start hidden
      }),
      "positions",
    );
    // Hidden affiliations are still actionable in the editor → Show + 'not mine'.
    expect(screen.getByRole("button", { name: /^show/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /not mine/i })).toBeTruthy();
  });

  it("keeps a manual Positions entry Delete-only (no 'not mine')", () => {
    renderRow(
      makeItem({
        id: "position:manual:1",
        source: "manual",
        displayText: "Visiting Researcher, Somewhere",
      }),
      "positions",
    );
    expect(screen.getByRole("button", { name: /^hide/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /delete/i })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /not mine/i })).toBeNull();
  });
});

describe("ItemRow — editable source-derived titles", () => {
  function renderEditable(
    item: CvItem,
    sectionType: CvSectionType,
    onSetTextOverride: (text: string) => void = noop,
  ) {
    render(
      <ul>
        <ItemRow
          item={item}
          locale="en-US"
          sectionType={sectionType}
          isFirst
          isLast
          onToggleIncluded={noop}
          onToggleNotMine={noop}
          onSetTextOverride={onSetTextOverride}
          onMoveUp={noop}
          onMoveDown={noop}
        />
      </ul>,
    );
  }

  it("renders an editable input for an ORCID position and reports edits", () => {
    let got = "";
    renderEditable(
      makeItem({ id: "position:orcid:1", source: "orcid", displayText: "Pharmacist, CHU de Caen" }),
      "positions",
      (t) => (got = t),
    );
    const input = screen.getByLabelText(/entry text/i) as HTMLInputElement;
    expect(input.value).toBe("Pharmacist, CHU de Caen");
    fireEvent.change(input, { target: { value: "Hospital Pharmacist, CHU de Caen" } });
    expect(got).toBe("Hospital Pharmacist, CHU de Caen");
  });

  it("shows the override value + a revert control that clears it", () => {
    let got = "untouched";
    renderEditable(
      makeItem({
        id: "education:orcid:1",
        source: "orcid",
        displayText: "PharmD, Université de Caen",
        displayTextOverride: "PharmD (Hons), Caen",
      }),
      "education",
      (t) => (got = t),
    );
    const input = screen.getByLabelText(/entry text/i) as HTMLInputElement;
    expect(input.value).toBe("PharmD (Hons), Caen"); // the override, not the source
    fireEvent.click(screen.getByRole("button", { name: /revert/i }));
    expect(got).toBe(""); // "" → setItemTextOverride reverts to the live source text
  });

  it("hides the revert control until an override exists", () => {
    renderEditable(
      makeItem({ id: "position:orcid:2", source: "orcid", displayText: "Role, Org" }),
      "positions",
    );
    expect(screen.getByLabelText(/entry text/i)).toBeTruthy();
    expect(screen.queryByRole("button", { name: /revert/i })).toBeNull();
  });

  it("does NOT offer the editable input for a citation row (static title kept)", () => {
    renderEditable(
      makeItem({
        id: "w1",
        source: "openalex",
        csl: { id: "w1", type: "article-journal", title: "A paper" } as CvItem["csl"],
      }),
      "publications",
    );
    expect(screen.queryByLabelText(/entry text/i)).toBeNull();
    expect(document.querySelector(".cv-item-title")).toBeTruthy();
  });
});

describe("ItemRow — structured role / institution / dates editor", () => {
  // The "Edit details" disclosure (role + institution + department + dates) is the
  // structured editor for source-derived Positions/Education rows: passed onSetRole
  // + onSetInstitution + onSetDateRange, with no whole-line `displayTextOverride`.
  function renderStructured(
    item: CvItem,
    sectionType: CvSectionType,
    handlers: {
      onSetRole?: (role: string) => void;
      onSetInstitution?: (name: string) => void;
      onSetDepartment?: (name: string) => void;
      onSetDateRange?: (range: { startYear?: number; endYear?: number } | null) => void;
    } = {},
  ) {
    render(
      <ul>
        <ItemRow
          item={item}
          locale="en-US"
          sectionType={sectionType}
          isFirst
          isLast
          onToggleIncluded={noop}
          onToggleNotMine={noop}
          onSetRole={handlers.onSetRole ?? noop}
          onSetInstitution={handlers.onSetInstitution ?? noop}
          onSetDepartment={handlers.onSetDepartment ?? noop}
          onSetDateRange={handlers.onSetDateRange ?? noop}
          onMoveUp={noop}
          onMoveDown={noop}
        />
      </ul>,
    );
  }

  // An ORCID education entry whose source listed only the institution — a degree
  // with no dates, the common case that used to dead-end on "Re-sync to edit dates".
  const datelessEducation = (over: Partial<CvItem> = {}) =>
    makeItem({
      id: "education:orcid:1",
      source: "orcid",
      displayText: "PharmD, Université de Caen",
      meta: { institution: "Université de Caen", roleTitle: "PharmD" },
      ...over,
    });

  it("lets you ADD dates to an education entry the source listed without any", () => {
    let got: { startYear?: number; endYear?: number } | null | undefined;
    renderStructured(datelessEducation(), "education", {
      onSetDateRange: (r) => (got = r),
    });
    // No dead-end note — the editable year fields are offered instead.
    expect(screen.queryByText(/re-sync to edit dates/i)).toBeNull();
    const start = screen.getByLabelText(/start year/i) as HTMLInputElement;
    const end = screen.getByLabelText(/end year/i) as HTMLInputElement;
    // An entry with no dates is NOT pre-marked "ongoing": the end field is editable.
    expect(start.value).toBe("");
    expect(end.value).toBe("");
    expect(end.disabled).toBe(false);
    fireEvent.change(start, { target: { value: "2007" } });
    expect(got).toEqual({ startYear: 2007, endYear: undefined });
  });

  it("still shows the re-sync note for a legacy entry with no structured institution", () => {
    // No meta.institution → the line can't be re-derived, so dates can't be added
    // until a re-sync populates the structured fields.
    renderStructured(
      makeItem({
        id: "education:orcid:2",
        source: "orcid",
        displayText: "PharmD, Université de Caen (2007–2016)",
        meta: {},
      }),
      "education",
    );
    expect(screen.getByText(/re-sync to edit dates/i)).toBeTruthy();
    expect(screen.queryByLabelText(/start year/i)).toBeNull();
  });

  it("pre-fills the existing range and marks an open end as ongoing", () => {
    renderStructured(
      makeItem({
        id: "position:orcid:1",
        source: "orcid",
        displayText: "Assistant Professor, Nagoya University (2022–present)",
        meta: {
          institution: "Nagoya University",
          roleTitle: "Assistant Professor",
          startYear: 2022,
        },
      }),
      "positions",
    );
    const start = screen.getByLabelText(/start year/i) as HTMLInputElement;
    const end = screen.getByLabelText(/end year/i) as HTMLInputElement;
    expect(start.value).toBe("2022");
    expect(end.value).toBe(""); // open end
    expect(end.disabled).toBe(true); // ongoing → end disabled
  });
});
