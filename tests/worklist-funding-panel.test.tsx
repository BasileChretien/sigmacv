// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

// The policy table is real data; one test below swaps in a maintainer-confirmed
// entry to exercise the "as recorded on <date>" wording, which no committed
// entry has yet (every entry is still pending live confirmation).
const policyMock = vi.hoisted(() => ({ override: undefined as undefined | (() => unknown) }));
vi.mock("@/lib/funders/oaPolicies", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/lib/funders/oaPolicies")>();
  return {
    ...real,
    funderOaPolicy: (doi: string | undefined) =>
      policyMock.override ? policyMock.override() : real.funderOaPolicy(doi),
  };
});

import WorklistPanel from "@/components/WorklistPanel";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { OPEN_POLICY_FINDER_URL } from "@/lib/cv/worklist";
import type { FunderRow } from "@/lib/funders/join";
import { funderOaPolicy, type FunderOaPolicy } from "@/lib/funders/oaPolicies";

/**
 * The owner-only "Your grants and their open-access policies" section of the
 * worklist: per (work, grant) joined through the funder crosswalk or an award
 * number — the work, "acknowledges award X from Y" (or the weaker funder-only
 * wording), the funder's recorded policy with its link — dated when a
 * maintainer confirmed it live, worded as unconfirmed otherwise — (or "no
 * policy record"), and what SigmaCV found. Facts side by side; never a
 * verdict, never a good/bad colour, never a count of works "needing action".
 */

const ANR_OA = "F4320332161";
const ANR_URL = `https://openalex.org/${ANR_OA}`;
const ANR_FUNDREF = "10.13039/501100001665";
const JSPS_OA = "F4320334764";
const JSPS_URL = `https://openalex.org/${JSPS_OA}`;
const JSPS_FUNDREF = "10.13039/501100001691";
const CROSSWALK: FunderRow[] = [
  { openalexId: ANR_OA, fundrefDoi: ANR_FUNDREF, name: "Agence Nationale de la Recherche" },
  {
    openalexId: JSPS_OA,
    fundrefDoi: JSPS_FUNDREF,
    name: "Japan Society for the Promotion of Science",
  },
];

function work(
  id: string,
  funders: NonNullable<CvItem["meta"]["funders"]>,
  meta: CvItem["meta"] = {},
): CvItem {
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
    meta: { year: 2024, funders, ...meta },
  };
}

function grant(id: string, meta: CvItem["meta"]): CvItem {
  return {
    id,
    source: "orcid",
    sourceId: id,
    included: true,
    notMine: false,
    order: 0,
    authoredBySelf: false,
    selfNameVariants: [],
    displayText: `Grant ${id}`,
    meta,
  };
}

function makeCv(works: CvItem[], grants: CvItem[]): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "wf",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Basile Chrétien" },
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
      { id: "grants", type: "grants", title: "Grants", visible: true, order: 1, items: grants },
    ],
    provenance: { generatedAt: "2026-09-09T00:00:00.000Z", sources: ["openalex", "orcid"] },
  });
}

afterEach(() => {
  policyMock.override = undefined;
  cleanup();
});

describe("WorklistPanel — your grants and their open-access policies", () => {
  it("renders the joined (work, grant) with the funder's pending policy — worded as unconfirmed, no date — its link, and what SigmaCV found", () => {
    const anr = funderOaPolicy(ANR_FUNDREF)!;
    expect(anr.verifiedBy).toBe("maintainer-pending");
    const onJump = vi.fn();
    // An OPEN work: the "no open copy found" section stays out, so every
    // element below belongs to the funding section alone.
    const cv = makeCv(
      [
        work("W-anr", [{ id: ANR_URL, awardId: "ANR-21-CE17-0001" }], {
          oaIsOpen: true,
          license: "cc-by",
        }),
      ],
      [grant("G1", { funderId: ANR_FUNDREF, funderName: "ANR", awardId: "ANR-21-CE17-0001" })],
    );
    render(
      <WorklistPanel
        cv={cv}
        locale="en-US"
        consentedRorIds={[]}
        funderCrosswalk={CROSSWALK}
        onJump={onJump}
      />,
    );
    expect(screen.getByText("Your grants and their open-access policies")).toBeTruthy();
    expect(screen.getByText(/acknowledges award ANR-21-CE17-0001 from ANR/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Work W-anr \(2024\)/ }));
    expect(onJump).toHaveBeenCalledWith("W-anr");

    const policy = screen.getByText(
      /ANR's open-access policy, drafted from memory and not yet confirmed against the funder's site:/,
    );
    expect(policy.textContent).toContain(anr.statements.join("; "));
    expect(document.body.textContent).not.toMatch(/as recorded on/);
    const link = screen.getByRole("link", { name: /policy page/ }) as HTMLAnchorElement;
    expect(link.href).toBe(anr.policyUrl);
    expect(link.rel).toContain("noopener");

    expect(screen.getByText(/SigmaCV found:/).textContent).toContain(
      "Open, Creative Commons licence",
    );
    const finder = screen.getByRole("link", { name: /Open Policy Finder/ }) as HTMLAnchorElement;
    expect(finder.href).toBe(`${OPEN_POLICY_FINDER_URL}?q=Journal%20%26%20Co`);

    // Help, not a verdict — and no count of works "needing action" in the heading.
    expect(document.body.textContent).not.toMatch(/compliant|overdue|violation|mandate/i);
    expect(screen.getByText("Your grants and their open-access policies").textContent).not.toMatch(
      /\d/,
    );
    expect(
      screen.getByText(/whether a policy applies to a given work is for you to judge/),
    ).toBeTruthy();
  });

  it("says 'as recorded on <date>' — and only then — for an entry a maintainer confirmed live", () => {
    const confirmed: FunderOaPolicy = {
      fundrefDoi: ANR_FUNDREF,
      name: "Agence Nationale de la Recherche (ANR)",
      policyUrl: "https://anr.fr/fr/lanr/engagements/la-science-ouverte/",
      statements: ["deposit of the full text in HAL", "CC BY licence"],
      verifiedBy: "maintainer",
      lastVerified: "2026-10-01",
    };
    policyMock.override = () => confirmed;
    const cv = makeCv(
      [work("W-anr", [{ id: ANR_URL, awardId: "ANR-21-CE17-0001" }], { oaIsOpen: true })],
      [grant("G1", { funderId: ANR_FUNDREF, funderName: "ANR", awardId: "ANR-21-CE17-0001" })],
    );
    render(
      <WorklistPanel cv={cv} locale="en-US" consentedRorIds={[]} funderCrosswalk={CROSSWALK} />,
    );
    expect(
      screen.getByText(
        "ANR's open-access policy, as recorded on 2026-10-01: deposit of the full text in HAL; CC BY licence",
        { exact: false },
      ),
    ).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/drafted from memory/);
    const link = screen.getByRole("link", { name: /policy page/ }) as HTMLAnchorElement;
    expect(link.href).toBe(confirmed.policyUrl);
  });

  it("says 'no policy record' for a funder outside the table, and uses the weaker wording for a funder-only join", () => {
    // A CLOSED work: it is listed under "no open copy found" too, so the work
    // appears twice — once per section — and both are plain text (no handler).
    const cv = makeCv(
      [work("W-jsps", [{ id: JSPS_URL }], { oaIsOpen: false })],
      [grant("G1", { funderId: `FUNDREF:http://dx.doi.org/${JSPS_FUNDREF}`, funderName: "JSPS" })],
    );
    render(
      <WorklistPanel cv={cv} locale="en-US" consentedRorIds={[]} funderCrosswalk={CROSSWALK} />,
    );
    expect(screen.getByText(/names your funder JSPS; no award number on the work/)).toBeTruthy();
    expect(screen.getByText("SigmaCV has no policy record for JSPS.")).toBeTruthy();
    expect(screen.queryByRole("link", { name: /policy page/ })).toBeNull();
    expect(screen.getByText(/SigmaCV found:/).textContent).toContain("No open copy found");
    expect(screen.getByText(/no open copy found \(1 of 1\)/)).toBeTruthy();
    // No jump handler → plain text, not a button.
    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getAllByText("Work W-jsps (2024)")).toHaveLength(2);
  });

  it("names an unnamed funder generically rather than printing an empty name", () => {
    const cv = makeCv(
      [work("W1", [{ id: "https://openalex.org/F777" }])],
      [grant("G1", { funderId: "https://openalex.org/F777" })],
    );
    render(<WorklistPanel cv={cv} locale="en-US" consentedRorIds={[]} funderCrosswalk={[]} />);
    expect(
      screen.getByText(/names your funder a funder; no award number on the work/),
    ).toBeTruthy();
    expect(screen.getByText("SigmaCV has no policy record for a funder.")).toBeTruthy();
  });

  it("omits the section — and the whole panel — when nothing joins", () => {
    const cv = makeCv(
      [work("W1", [{ id: ANR_URL, awardId: "ANR-21-CE17-0001" }], { oaIsOpen: true })],
      [grant("G1", { funderId: JSPS_FUNDREF, funderName: "JSPS", awardId: "OTHER-1" })],
    );
    const { container } = render(
      <WorklistPanel cv={cv} locale="en-US" consentedRorIds={[]} funderCrosswalk={CROSSWALK} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("is localised: the French heading and sentences carry the same placeholders", () => {
    const cv = makeCv(
      [work("W1", [{ id: ANR_URL, awardId: "ANR-21-CE17-0001" }], { oaIsOpen: false })],
      [grant("G1", { funderId: ANR_FUNDREF, funderName: "ANR", awardId: "ANR-21-CE17-0001" })],
    );
    render(
      <WorklistPanel cv={cv} locale="fr-FR" consentedRorIds={[]} funderCrosswalk={CROSSWALK} />,
    );
    expect(screen.getByText(/Vos financements et leurs politiques/)).toBeTruthy();
    expect(screen.getByText(/ANR-21-CE17-0001/)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(
      /\{award\}|\{funder\}|\{date\}|\{statements\}|\{state\}/,
    );
  });
});
