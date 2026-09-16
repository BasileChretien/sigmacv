// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import CvEditor from "@/components/CvEditor";
import WorklistPanel from "@/components/WorklistPanel";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { OPEN_POLICY_FINDER_URL } from "@/lib/cv/worklist";

/**
 * The owner-only "Affiliations & open access" panel: lists (a) current positions
 * without a ROR record and (b) works with no open copy found, with the state
 * chip + policy-finder link; every row jumps to the item; hidden entirely when
 * there is nothing to show. There is no list of works by printed affiliation:
 * nothing in the editor can act on one.
 */

const NAGOYA = "04chrp450";

function work(id: string, meta: CvItem["meta"], over: Partial<CvItem> = {}): CvItem {
  return {
    id,
    source: "openalex",
    sourceId: `https://openalex.org/${id}`,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: true,
    selfNameVariants: [],
    csl: { id, type: "article-journal", title: `Work ${id}`, "container-title": "Journal & Co" },
    meta,
    ...over,
  };
}

function position(id: string, meta: CvItem["meta"]): CvItem {
  return {
    id,
    source: "orcid",
    sourceId: id,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    displayText: `Role at ${meta.institution ?? "?"}`,
    meta,
  };
}

function makeCv(works: CvItem[], positions: CvItem[]): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "wl",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Basile Chrétien" },
    display: {},
    sections: [
      {
        id: "positions",
        type: "positions",
        title: "Positions",
        visible: true,
        order: 0,
        items: positions,
      },
      {
        id: "pubs",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 1,
        items: works,
      },
    ],
    provenance: { generatedAt: "2026-09-08T00:00:00.000Z", sources: ["openalex"] },
  });
}

afterEach(cleanup);

describe("WorklistPanel (component)", () => {
  it("renders nothing when there is nothing to show", () => {
    const cv = makeCv(
      [work("W1", { year: 2022, oaIsOpen: true, license: "cc-by", workInstitutions: [NAGOYA] })],
      [position("P1", { institution: "Nagoya University", rorId: NAGOYA, startYear: 2020 })],
    );
    const { container } = render(<WorklistPanel cv={cv} locale="en-US" onJump={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("lists the two groups under plain headings (no count, no open-access breakdown), the state chip, the funder names and the policy link, and jumps on activation — and never a work by its printed affiliation", () => {
    const cv = makeCv(
      [
        // Printed affiliation elsewhere, and none at all: neither is a row.
        work("W-elsewhere", {
          year: 2022,
          oaIsOpen: true,
          workInstitutions: ["https://ror.org/02kpeqv85"],
        }),
        work("W-nodata", { year: 2022, oaIsOpen: true, license: "cc-by" }),
        work("W-closed", {
          year: 2021,
          oaIsOpen: false,
          workInstitutions: [NAGOYA],
          funders: [{ id: "https://openalex.org/F1", name: "Wellcome Trust" }],
        }),
        work("W-unknown", { year: 2021, workInstitutions: [NAGOYA] }),
      ],
      [
        position("P-ok", { institution: "Nagoya University", rorId: NAGOYA, startYear: 2020 }),
        position("P-noror", { institution: "Some Hospital", startYear: 2021 }),
      ],
    );
    const onJump = vi.fn();
    render(<WorklistPanel cv={cv} locale="en-US" onJump={onJump} />);

    // Owner-only framing + collapsible.
    const details = screen.getByText("Affiliations & open access").closest("details");
    expect(details).toBeTruthy();
    expect(screen.getByText(/Nothing here appears on your CV/)).toBeTruthy();

    // (a) positions without ROR.
    expect(screen.getByText("Current positions without an institution record")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Some Hospital/ }));
    expect(onJump).toHaveBeenLastCalledWith("P-noror");

    // No list by printed affiliation, no "no affiliation data" bucket, no ROR id.
    expect(screen.queryByText(/printed affiliation/)).toBeNull();
    expect(screen.queryByText(/no affiliation data/)).toBeNull();
    expect(screen.queryByText(/Affiliation on the paper/)).toBeNull();
    expect(screen.queryByText(/02kpeqv85/)).toBeNull();
    expect(screen.queryByRole("button", { name: /Work W-elsewhere/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /Work W-nodata/ })).toBeNull();

    // (b) closed works: chip; funders; policy link.
    expect(screen.getByText("Works with no open copy found")).toBeTruthy();
    expect(screen.getByText(/Funders named on the work: Wellcome Trust/)).toBeTruthy();
    const link = screen.getByRole("link", { name: /Open Policy Finder/ }) as HTMLAnchorElement;
    expect(link.href).toBe(`${OPEN_POLICY_FINDER_URL}?q=Journal%20%26%20Co`);
    expect(link.rel).toContain("noopener");
    fireEvent.click(screen.getByRole("button", { name: /Work W-closed/ }));
    expect(onJump).toHaveBeenLastCalledWith("W-closed");

    // The help copy is help, never a verdict.
    expect(screen.getByText(/a repository deposit may be possible/)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/compliant|overdue|violation/i);
    // Actions, never states: no "N of M", no open-access breakdown by state.
    expect(document.body.textContent).not.toMatch(/\d+ of \d+/);
    expect(document.body.textContent).not.toMatch(
      /countable works|Not determined: \d|Creative Commons licence: \d/,
    );
  });

  const nagoyaNow = () =>
    position("P1", { institution: "Nagoya University", rorId: NAGOYA, startYear: 2020 });

  it("names a current position with neither an institution nor a line as untitled — never an empty button", () => {
    const empty: CvItem = { ...position("P-empty", { startYear: 2021 }), displayText: undefined };
    const onJump = vi.fn();
    render(<WorklistPanel cv={makeCv([], [empty])} locale="en-US" onJump={onJump} />);
    fireEvent.click(screen.getByRole("button", { name: "(untitled)" }));
    expect(onJump).toHaveBeenCalledWith("P-empty");
  });

  it("substitutes source values literally — a replacement pattern in a funder name never corrupts the copy", () => {
    const funder = "Fund $& Co $` Ltd";
    const cv = makeCv(
      [
        work("W-closed", {
          year: 2022,
          oaIsOpen: false,
          workInstitutions: [NAGOYA],
          funders: [{ id: "https://openalex.org/F1", name: funder }],
        }),
      ],
      [nagoyaNow()],
    );
    render(<WorklistPanel cv={cv} locale="en-US" />);
    expect(screen.getByText(`Funders named on the work: ${funder}`)).toBeTruthy();
  });

  it("renders rows as plain text without a jump callback, and omits the policy link without a venue", () => {
    const closed = work("W-closed", { year: 2021, oaIsOpen: false });
    const cv = makeCv([{ ...closed, csl: { id: "W-closed", type: "article-journal" } }], []);
    render(<WorklistPanel cv={cv} locale="en-US" />);
    expect(screen.queryByRole("button")).toBeNull();
    // The only links are the deposit places under the closed work (no DOI here, so
    // no Copy DOI button): the row itself and the journal policy stay plain.
    const links = screen.queryAllByRole("link");
    expect(links.length).toBeGreaterThan(0);
    expect(links.every((a) => a.closest('[data-worklist="deposit"]'))).toBe(true);
    expect(screen.getByText("(untitled) (2021)")).toBeTruthy();
    expect(screen.getByText("No open copy found")).toBeTruthy();
  });

  it("localizes the panel", () => {
    const cv = makeCv([work("W-closed", { year: 2021, oaIsOpen: false })], []);
    render(<WorklistPanel cv={cv} locale="fr-FR" />);
    expect(screen.getByText("Affiliations et accès ouvert")).toBeTruthy();
  });
});

describe("WorklistPanel — wired into the editor (owner-only)", () => {
  // jsdom implements no layout, so scrollIntoView is absent; the sections
  // list's jump effect calls it (same stub as worklist-ui.test.tsx).
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  const cvWithClosedWork = () =>
    makeCv(
      [work("W-closed", { year: 2021, oaIsOpen: false })],
      [position("P-noror", { institution: "Some Hospital", startYear: 2021 })],
    );

  it("has its own Open access tab in the regions layout, opens at once, and a row jump switches to Content", () => {
    render(
      <CvEditor
        cv={cvWithClosedWork()}
        availableStyles={["apa"]}
        uiLocale="en-US"
        onChange={vi.fn()}
        variant="regions"
      />,
    );
    const panel = document.querySelector<HTMLDetailsElement>("details.cv-worklist");
    expect(panel).toBeTruthy();
    // Not among the sections: in its own tabpanel, and open — the tab is the disclosure.
    expect(panel!.closest("#cv-part-panel-content")).toBeNull();
    expect(panel!.closest("#cv-part-panel-openAccess")).toBeTruthy();
    expect(panel!.open).toBe(true);
    const openAccessTab = screen.getByRole("tab", { name: "Open access" });
    expect(openAccessTab.getAttribute("aria-controls")).toBe("cv-part-panel-openAccess");
    // The editor opens on Profile; activating a row routes to Content (where the
    // rows live) so the target row is mounted before it scrolls.
    const contentTab = screen.getByRole("tab", { name: "Content" });
    expect(contentTab.getAttribute("aria-selected")).toBe("false");
    // (The tabpanel is `hidden` while Profile is active, so query it as such.)
    fireEvent.click(screen.getByRole("button", { name: /Some Hospital/, hidden: true }));
    expect(contentTab.getAttribute("aria-selected")).toBe("true");
  });

  it("keeps the tab, with an empty state, when there is nothing to list", () => {
    render(
      <CvEditor
        cv={makeCv([work("W-open", { year: 2021, oaIsOpen: true })], [])}
        availableStyles={["apa"]}
        uiLocale="en-US"
        onChange={vi.fn()}
        variant="regions"
      />,
    );
    expect(screen.getByRole("tab", { name: "Open access" })).toBeTruthy();
    expect(document.querySelector("details.cv-worklist")).toBeNull();
    const tabpanel = document.querySelector("#cv-part-panel-openAccess")!;
    expect(tabpanel.textContent).toContain("Nothing to show here yet.");
  });

  it("is present in the classic layout too", () => {
    render(
      <CvEditor
        cv={cvWithClosedWork()}
        availableStyles={["apa"]}
        uiLocale="en-US"
        onChange={vi.fn()}
      />,
    );
    expect(document.querySelector("details.cv-worklist")).toBeTruthy();
  });

  it("is absent from the anonymous (no-login) preview — no tab, no panel: a visitor never sees another person's worklist", () => {
    render(
      <CvEditor
        cv={cvWithClosedWork()}
        availableStyles={["apa"]}
        uiLocale="en-US"
        onChange={vi.fn()}
        variant="regions"
        anonymous
      />,
    );
    expect(document.querySelector("details.cv-worklist")).toBeNull();
    // The preview keeps its three tabs: no "Open access" tab and no fourth tabpanel.
    expect(screen.getAllByRole("tab").map((t) => t.textContent)).toEqual([
      "Profile",
      "Design",
      "Content",
    ]);
    expect(document.querySelector("#cv-part-panel-openAccess")).toBeNull();
  });
});
