// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import WorklistPanel from "@/components/WorklistPanel";
import { STATUTORY_ARCHIVING } from "@/lib/archiving/statutoryRights";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { workspaceUi } from "@/lib/i18n/workspaceUi";

/**
 * The rights lines under a closed work in the owner worklist: the publisher's
 * policy as OA.Works recorded it (both dates, the statement quoted verbatim, the
 * archived policy linked) and the statutory rule that may also apply for the
 * country printed on the paper — facts beside the work, with one disclaimer
 * under the list. Nothing shows when the owner's sync stored nothing.
 */

const EN = workspaceUi("en-US");
const RECORD: NonNullable<CvItem["meta"]["selfArchiving"]> = {
  source: "oa.works",
  canArchive: true,
  versions: ["acceptedVersion"],
  locations: ["Institutional Repository"],
  embargoMonths: 12,
  embargoEnd: "2021-01-23",
  licence: "cc-by-nc-nd",
  depositStatement: "This is the peer reviewed version of the following article: [X].",
  recordUpdated: "2021-01-27",
  policyUrl: "https://perma.cc/J5MA-H2EJ",
  retrievedAt: "2026-09-15T08:00:00.000Z",
};
const entry = (code: string) => STATUTORY_ARCHIVING.find((e) => e.countryCode === code)!;

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
    csl: { id, type: "article-journal", title: `Work ${id}`, "container-title": "J. Ex." },
    meta: { year: 2021, repositoryCopiesCheckedAt: "2026-09-01T00:00:00.000Z", ...meta },
  };
}

function makeCv(works: CvItem[]): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "wrp",
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

afterEach(cleanup);

/** The rights lines sit behind each row's disclosure: open them, as the owner would. */
function openRows(container: HTMLElement): void {
  container
    .querySelectorAll<HTMLDetailsElement>("details.cv-worklist-row-more")
    .forEach((d) => (d.open = true));
}

describe("WorklistPanel — the rights lines under a closed work", () => {
  it("prints the publisher's policy with both dates, the quoted statement and the archived policy, then the statutory rule and the disclaimer", () => {
    const cv = makeCv([
      work("W1", { oaIsOpen: false, selfArchiving: RECORD, workCountries: ["FR"] }),
    ]);
    const { container } = render(<WorklistPanel cv={cv} locale="en-US" />);
    openRows(container);
    const rights = container.querySelector('[data-worklist="rights"]')!;
    expect(rights).not.toBeNull();
    const text = rights.textContent ?? "";
    expect(text).toContain(
      "Publisher policy recorded by OA.Works: self-archiving allowed — accepted manuscript. Where: Institutional Repository. Embargo: 12 months, ending 2021-01-23. Licence for the deposited copy: cc-by-nc-nd.",
    );
    expect(text).toContain(EN.wlArchivingStatement);
    expect(rights.querySelector("blockquote")!.textContent).toBe(RECORD.depositStatement);
    expect(text).toContain("OA.Works record updated 2021-01-27; retrieved 2026-09-15.");
    expect(screen.getByRole("link", { name: EN.wlArchivingPolicyLink }).getAttribute("href")).toBe(
      RECORD.policyUrl,
    );
    expect(text).toContain("May also apply — secondary-publication right (France), ");
    expect(text).toContain("Recorded on 2026-09-15.");
    expect(screen.getByRole("link", { name: EN.wlStatutorySourceLink }).getAttribute("href")).toBe(
      entry("FR").sourceUrl,
    );
    expect(
      screen.getByRole("link", { name: EN.wlStatutoryGuidanceLink }).getAttribute("href"),
    ).toBe(entry("FR").guidanceUrl);
    expect(container.textContent).toContain(EN.wlArchivingDisclaimer);
    // Facts, never a figure: the rights block carries no count and no percentage.
    expect(text).not.toMatch(/%|\bof \d+\b/);
  });

  it("prints a refusal without statement or link, and labels a policy document as policy text with its measures as guidance", () => {
    const cv = makeCv(
      [
        work("W1", {
          oaIsOpen: false,
          selfArchiving: {
            ...RECORD,
            canArchive: false,
            policyUrl: undefined,
            recordUpdated: undefined,
          },
          // A January 2025 paper: the French right has run (the ground), and Japan's
          // policy — a Cabinet Office document, not a statute — applies from 2025
          // and is shown beside it.
          workCountries: ["FR", "JP"],
          year: 2025,
        }),
      ].map((w) => ({ ...w, csl: { ...w.csl!, issued: { "date-parts": [[2025, 1, 15]] } } })),
    );
    const { container } = render(<WorklistPanel cv={cv} locale="en-US" />);
    openRows(container);
    const rights = container.querySelector('[data-worklist="rights"]')!;
    expect(rights.textContent).toContain(EN.wlArchivingNotAllowed);
    expect(rights.textContent).toContain(
      "Retrieved from OA.Works 2026-09-15; the record gives no update date.",
    );
    expect(rights.querySelector("blockquote")).toBeNull();
    expect(screen.queryByRole("link", { name: EN.wlArchivingPolicyLink })).toBeNull();
    const statutory = [
      ...rights.querySelectorAll<HTMLElement>(".cv-worklist-rights-statutory"),
    ].find((p) => p.textContent!.includes("(Japan)"))!;
    expect(statutory).toBeTruthy();
    expect(statutory.textContent).toContain("Recorded on 2026-09-16.");
    // Scoped to Japan's line: France's beside it carries "legal text" and "guidance" too.
    const jp = within(statutory);
    expect(jp.getByRole("link", { name: EN.wlStatutoryPolicyLink }).getAttribute("href")).toBe(
      entry("JP").sourceUrl,
    );
    expect(jp.getByRole("link", { name: EN.wlStatutoryGuidanceLink }).getAttribute("href")).toBe(
      entry("JP").guidanceUrl,
    );
    expect(jp.queryByRole("link", { name: EN.wlStatutorySourceLink })).toBeNull();
  });

  it("leaves out a rule the work's year rules out, and with nothing else shows no rights block", () => {
    const cv = makeCv([work("W1", { oaIsOpen: false, year: 2021, workCountries: ["ES", "JP"] })]);
    const { container } = render(<WorklistPanel cv={cv} locale="en-US" />);
    openRows(container);
    expect(container.querySelector('[data-worklist="rights"]')).toBeNull();
    expect(container.textContent).not.toContain(EN.wlArchivingDisclaimer);
  });

  it("prints the statutory rule alone when OA.Works holds nothing for the work", () => {
    const cv = makeCv([work("W1", { oaIsOpen: false, year: 2023, workCountries: ["FR", "ES"] })]);
    const { container } = render(<WorklistPanel cv={cv} locale="en-US" />);
    openRows(container);
    const rights = container.querySelector('[data-worklist="rights"]')!;
    expect(rights.querySelector(".cv-worklist-rights-publisher")).toBeNull();
    expect(rights.textContent).toContain(
      "May also apply — statutory repository-deposit requirement (Spain), ",
    );
    expect(rights.textContent).toContain("May also apply — secondary-publication right (France)");
    expect(container.textContent).toContain(EN.wlArchivingDisclaimer);
  });

  it("prints no rights block and no disclaimer when the owner's sync stored nothing", () => {
    const cv = makeCv([
      work("W1", { oaIsOpen: false, workCountries: ["US"] }),
      // Open and already in a repository: its record is not a row anywhere.
      work("W2", {
        oaIsOpen: true,
        oaStatus: "green",
        selfArchiving: RECORD,
        workCountries: ["FR"],
      }),
    ]);
    const { container } = render(<WorklistPanel cv={cv} locale="en-US" />);
    openRows(container);
    expect(container.querySelector('[data-worklist="rights"]')).toBeNull();
    expect(container.textContent).not.toContain(EN.wlArchivingDisclaimer);
  });

  it("speaks the viewer's language around the recorded words", () => {
    const cv = makeCv([
      work("W1", { oaIsOpen: false, selfArchiving: RECORD, workCountries: ["DE"] }),
    ]);
    const { container } = render(<WorklistPanel cv={cv} locale="fr-FR" />);
    openRows(container);
    const text = container.querySelector('[data-worklist="rights"]')!.textContent ?? "";
    expect(text).toContain("auto-archivage autorisé — manuscrit accepté");
    expect(text).toContain("(Allemagne)");
    // OA.Works' own words and the publisher's statement stay as recorded.
    expect(text).toContain("Institutional Repository");
    expect(text).toContain(RECORD.depositStatement!);
  });
});
