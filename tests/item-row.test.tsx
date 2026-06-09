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
    expect(document.querySelector(".cv-review-badge")).toBeTruthy();
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
    expect(document.querySelector(".cv-review-badge")).toBeTruthy();
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

  function renderDup(h: {
    onKeepThis?: () => void;
    onKeepPartner?: () => void;
    onKeepBoth?: () => void;
  }) {
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
          duplicatePartner={published}
          duplicatePartnerSection="Publications"
          onKeepThis={h.onKeepThis ?? noop}
          onKeepPartner={h.onKeepPartner ?? noop}
          onDupKeepBoth={h.onKeepBoth ?? noop}
          onMoveUp={noop}
          onMoveDown={noop}
        />
      </ul>,
    );
  }

  it("expands to show the full facts of BOTH entries", () => {
    renderDup({});
    fireEvent.click(screen.getByRole("button", { name: /possible duplicate/i }));
    // The partner's complete info is shown (title, venue, citations, section).
    expect(screen.getByText("My Published Article")).toBeTruthy();
    expect(screen.getByText(/Nature/)).toBeTruthy();
    expect(screen.getByText(/12 citations/)).toBeTruthy();
    expect(screen.getByText(/in Publications/)).toBeTruthy();
    // …and why it was flagged.
    expect(screen.getByText(/one is a preprint of the other/i)).toBeTruthy();
  });

  it("offers a 'Keep this one' choice on each entry plus 'Keep both'", () => {
    let kept = "";
    renderDup({
      onKeepThis: () => (kept = "this"),
      onKeepPartner: () => (kept = "partner"),
      onKeepBoth: () => (kept = "both"),
    });
    fireEvent.click(screen.getByRole("button", { name: /possible duplicate/i }));
    const keepButtons = screen.getAllByRole("button", { name: /keep this one/i });
    expect(keepButtons).toHaveLength(2);
    fireEvent.click(keepButtons[0]!); // keep THIS entry
    expect(kept).toBe("this");
    fireEvent.click(keepButtons[1]!); // keep the PARTNER entry
    expect(kept).toBe("partner");
    fireEvent.click(screen.getByRole("button", { name: /keep both/i }));
    expect(kept).toBe("both");
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
