// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import CvEditor from "@/components/CvEditor";
import CvHealthPanel from "@/components/CvHealthPanel";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemNotMine, setItemReviewed } from "@/lib/canonical/curate";
import { needsReview, reviewCoverage } from "@/lib/canonical/review";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";
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
  return buildCanonicalCv({ id: "e", resolved, works, now: "2026-06-02T00:00:00.000Z" });
}

/** Mark the first `n` citation items as doubtful — flagged by the
 *  misattribution heuristic as probably someone else's. */
function withDoubtful(cv: CanonicalCv, n: number): CanonicalCv {
  let left = n;
  return {
    ...cv,
    sections: cv.sections.map((s) => ({
      ...s,
      items: s.items.map((it): CvItem => {
        if (!it.csl || left <= 0) return it;
        left -= 1;
        return { ...it, meta: { ...it.meta, reviewFlag: "likely-misattributed" } };
      }),
    })),
  };
}

function expandAllSections() {
  document
    .querySelectorAll<HTMLButtonElement>("button.section-toggle")
    .forEach((b) => fireEvent.click(b));
}

function confirmButtons(): HTMLButtonElement[] {
  return Array.from(document.querySelectorAll<HTMLButtonElement>("button.mine-btn.is-review"));
}

function renderEditor(cv: CanonicalCv, onChange = vi.fn()) {
  render(<CvEditor cv={cv} availableStyles={["apa"]} uiLocale="en-US" onChange={onChange} />);
  expandAllSections();
  return onChange;
}

afterEach(cleanup);

describe("Confirm is offered only where there is something to doubt", () => {
  it("offers NOTHING on a cleanly matched profile", () => {
    // The whole point: a researcher whose works are soundly attributed is never
    // asked to re-confirm them. The fixture builds exactly such a profile.
    const cv = makeCv();
    expect(reviewCoverage(cv).reviewable).toBe(0);
    renderEditor(cv);
    expect(confirmButtons()).toHaveLength(0);
  });

  it("offers it on exactly the doubtful rows, and no others", () => {
    const cv = withDoubtful(makeCv(), 2);
    expect(cv.sections.flatMap((s) => s.items).filter(needsReview)).toHaveLength(2);
    renderEditor(cv);
    const btns = confirmButtons();
    expect(btns).toHaveLength(2);
    for (const b of btns) expect(b.getAttribute("aria-pressed")).toBe("false");
  });

  it("stamps reviewedAt on the clicked item only", () => {
    const onChange = renderEditor(withDoubtful(makeCv(), 2));
    fireEvent.click(confirmButtons()[0]!);
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0]![0] as CanonicalCv;
    const stamped = next.sections.flatMap((s) => s.items).filter((i) => i.reviewedAt);
    expect(stamped).toHaveLength(1);
    expect(stamped[0]!.included).toBe(true);
    expect(stamped[0]!.notMine).toBe(false);
  });

  it("reads as confirmed once stamped", () => {
    const cv = withDoubtful(makeCv(), 1);
    const target = cv.sections.find((s) => s.items.some(needsReview))!;
    const first = target.items.find(needsReview)!;
    renderEditor(
      setItemReviewed(cv, target.id, first.id, true, { now: "2026-09-03T10:00:00.000Z" }),
    );
    const pressed = confirmButtons().filter((b) => b.getAttribute("aria-pressed") === "true");
    expect(pressed).toHaveLength(1);
    expect(pressed[0]!.textContent).toContain("Confirmed");
  });

  it("is withdrawn from a row already asserted not-mine", () => {
    const cv = withDoubtful(makeCv(), 2);
    const target = cv.sections.find((s) => s.items.some(needsReview))!;
    const first = target.items.find(needsReview)!;
    renderEditor(
      setItemNotMine(cv, target.id, first.id, true, { now: "2026-09-03T10:00:00.000Z" }),
    );
    expect(confirmButtons()).toHaveLength(1);
  });
});

describe("CvHealthPanel never nags about sound work", () => {
  it("renders NOTHING when there is no outstanding curation debt", () => {
    // Regression guard for the reported bug: on a healthy profile the panel
    // showed "Needs your attention" above an EMPTY list, plus
    // "Reviewed 8 of 123 attributed works — still to review: 115".
    const { container } = render(<CvHealthPanel cv={makeCv()} locale="en-US" />);
    expect(container.innerHTML).toBe("");
  });

  it("carries no blanket review-progress figure at all", () => {
    render(<CvHealthPanel cv={withDoubtful(makeCv(), 3)} locale="en-US" />);
    expect(document.querySelector(".cv-health-review")).toBeNull();
    expect(document.body.textContent ?? "").not.toMatch(/still to review/i);
    expect(document.body.textContent ?? "").not.toMatch(/Reviewed \d+ of \d+/);
  });

  it("still surfaces genuine curation debt, and never an empty list", () => {
    // A name-matched review candidate is real, actionable debt — that row stays.
    const base = makeCv();
    const target = base.sections.find((s) => s.items.some((i) => i.csl))!;
    const cv: CanonicalCv = {
      ...base,
      sections: base.sections.map((s) =>
        s.id !== target.id
          ? s
          : {
              ...s,
              items: s.items.map((it) =>
                it.id === target.items.find((i) => i.csl)!.id
                  ? { ...it, included: false, meta: { ...it.meta, reviewFlag: "name-matched" } }
                  : it,
              ),
            },
      ),
    };
    render(<CvHealthPanel cv={cv} locale="en-US" />);
    expect(screen.getByText(/review candidates? waiting/i)).toBeTruthy();
    expect(document.querySelectorAll(".cv-health-list li").length).toBeGreaterThan(0);
  });
});
