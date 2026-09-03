// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import CvEditor from "@/components/CvEditor";
import CvHealthPanel from "@/components/CvHealthPanel";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemNotMine, setItemReviewed } from "@/lib/canonical/curate";
import { reviewCoverage } from "@/lib/canonical/review";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { ResolvedAuthor } from "@/lib/openalex/resolveAuthor";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

const works = worksFixture as unknown as OpenAlexWork[];
const resolved: ResolvedAuthor = {
  orcid: "0000-0002-7483-2489",
  authorIds: ["A5001069481"],
  displayName: "Basile Chrétien",
};

function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "e",
    resolved,
    works,
    now: "2026-06-02T00:00:00.000Z",
  });
}

/** Sections are collapsed by default; expand them all so item rows render. */
function expandAllSections() {
  document
    .querySelectorAll<HTMLButtonElement>("button.section-toggle")
    .forEach((b) => fireEvent.click(b));
}

/** Every Confirm toggle currently rendered in the editor. */
function confirmButtons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("button.mine-btn.is-review"));
}

afterEach(cleanup);

describe("Confirm toggle (ItemRow)", () => {
  it("renders on reviewable citation rows, unpressed by default", () => {
    render(
      <CvEditor cv={makeCv()} availableStyles={["apa"]} uiLocale="en-US" onChange={vi.fn()} />,
    );
    expandAllSections();
    const btns = confirmButtons();
    expect(btns.length).toBeGreaterThan(0);
    for (const b of btns) {
      expect(b.getAttribute("aria-pressed")).toBe("false");
      expect(b.textContent).toContain("Confirm");
    }
  });

  it("clicking it stamps reviewedAt on that item only", () => {
    const onChange = vi.fn();
    const cv = makeCv();
    render(<CvEditor cv={cv} availableStyles={["apa"]} uiLocale="en-US" onChange={onChange} />);
    expandAllSections();
    fireEvent.click(confirmButtons()[0]!);

    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0]![0] as CanonicalCv;
    const stamped = next.sections
      .flatMap((s) => s.items)
      .filter((i) => typeof i.reviewedAt === "string");
    expect(stamped).toHaveLength(1);
    // A record only — it must not disturb display curation.
    expect(stamped[0]!.included).toBe(true);
    expect(stamped[0]!.notMine).toBe(false);
  });

  it("reads as pressed and confirmed once the item carries reviewedAt", () => {
    const cv = makeCv();
    const target = cv.sections.find((s) => s.items.some((i) => i.csl))!;
    const first = target.items.find((i) => i.csl)!;
    const reviewed = setItemReviewed(cv, target.id, first.id, true, {
      now: "2026-09-02T10:00:00.000Z",
    });
    render(
      <CvEditor cv={reviewed} availableStyles={["apa"]} uiLocale="en-US" onChange={vi.fn()} />,
    );
    expandAllSections();
    const pressed = confirmButtons().filter((b) => b.getAttribute("aria-pressed") === "true");
    expect(pressed).toHaveLength(1);
    expect(pressed[0]!.textContent).toContain("Confirmed");
    expect(pressed[0]!.className).toContain("is-on");
  });

  it("is not offered on a row already asserted not-mine", () => {
    const cv = makeCv();
    const target = cv.sections.find((s) => s.items.some((i) => i.csl))!;
    const first = target.items.find((i) => i.csl)!;
    const before = confirmButtonCount(cv);
    const rejected = setItemNotMine(cv, target.id, first.id, true, {
      now: "2026-09-02T10:00:00.000Z",
    });
    expect(confirmButtonCount(rejected)).toBe(before - 1);
  });
});

/** Render a CV and count its Confirm toggles, then unmount. */
function confirmButtonCount(cv: CanonicalCv): number {
  const { unmount } = render(
    <CvEditor cv={cv} availableStyles={["apa"]} uiLocale="en-US" onChange={vi.fn()} />,
  );
  expandAllSections();
  const n = confirmButtons().length;
  unmount();
  return n;
}

describe("Review progress (CvHealthPanel)", () => {
  it("reports the coverage figure and what is outstanding", () => {
    const cv = makeCv();
    const cov = reviewCoverage(cv);
    expect(cov.reviewable).toBeGreaterThan(0);

    render(<CvHealthPanel cv={cv} locale="en-US" />);
    const line = document.querySelector(".cv-health-review")!;
    expect(line.textContent).toContain(`Reviewed 0 of ${cov.reviewable} attributed works`);
    expect(line.textContent).toContain(`still to review: ${cov.reviewable}`);
  });

  it("advances the figure as items are adjudicated either way", () => {
    let cv = makeCv();
    const target = cv.sections.find((s) => s.items.some((i) => i.csl))!;
    const [a, b] = target.items.filter((i) => i.csl);
    cv = setItemReviewed(cv, target.id, a!.id, true, { now: "2026-09-02T10:00:00.000Z" });
    cv = setItemNotMine(cv, target.id, b!.id, true, { now: "2026-09-02T10:00:00.000Z" });

    render(<CvHealthPanel cv={cv} locale="en-US" />);
    // Confirmed AND rejected both count as reviewed.
    expect(document.querySelector(".cv-health-review")!.textContent).toContain("Reviewed 2 of");
  });

  it("drops the outstanding clause once everything has been reviewed", () => {
    let cv = makeCv();
    for (const s of cv.sections) {
      for (const i of s.items) {
        if (i.csl) cv = setItemReviewed(cv, s.id, i.id, true, { now: "2026-09-02T10:00:00.000Z" });
      }
    }
    const cov = reviewCoverage(cv);
    render(<CvHealthPanel cv={cv} locale="en-US" />);
    const line = document.querySelector(".cv-health-review");
    // The panel still renders (there may be other curation debt), but the
    // "not reviewed yet" nag is gone.
    if (line) {
      expect(line.textContent).toContain(`Reviewed ${cov.reviewed} of ${cov.reviewable}`);
      expect(line.textContent).not.toContain("still to review");
    }
  });

  it("renders nothing when the CV is clean and fully reviewed", () => {
    // No sections at all: nothing outstanding, nothing reviewable.
    const empty = { ...makeCv(), sections: [] } as CanonicalCv;
    const { container } = render(<CvHealthPanel cv={empty} locale="en-US" />);
    expect(container.innerHTML).toBe("");
  });
});
