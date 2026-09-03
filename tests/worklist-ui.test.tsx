// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import CvEditor from "@/components/CvEditor";
import { buildCanonicalCv } from "@/lib/canonical/build";
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

/** Flag the first `n` citation items as likely-misattributed, with signals. */
function withMisattributed(cv: CanonicalCv, n: number): CanonicalCv {
  let left = n;
  return {
    ...cv,
    sections: cv.sections.map((s) => ({
      ...s,
      items: s.items.map((it): CvItem => {
        if (!it.csl || left <= 0) return it;
        left -= 1;
        return {
          ...it,
          meta: {
            ...it.meta,
            reviewFlag: "likely-misattributed",
            misattribution: { score: 0.8, signals: ["no-coauthor-overlap", "different-field"] },
          },
        };
      }),
    })),
  };
}

function renderEditor(cv: CanonicalCv) {
  render(<CvEditor cv={cv} availableStyles={["apa"]} uiLocale="en-US" onChange={vi.fn()} />);
}

/** The row currently flashed by a jump, if any. */
function flashedRowText(): string | null {
  const el = document.querySelector(".cv-item-row.is-flash");
  return el ? (el.textContent ?? "") : null;
}

// jsdom implements no layout, so scrollIntoView is absent. The jump effect
// calls it; stub it so the CYCLING behaviour under test can be observed.
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(cleanup);

describe("the attention checklist walks a category instead of pinning the first", () => {
  it("advances to a different row on each activation, and wraps", () => {
    // The gap: a researcher told "3 works may not be yours" landed on the same
    // row every time and had to hunt the rest by expanding sections.
    renderEditor(withMisattributed(makeCv(), 3));
    const row = screen.getByRole("button", { name: /works that may not be yours/i });

    fireEvent.click(row);
    const first = flashedRowText();
    expect(first).not.toBeNull();

    fireEvent.click(row);
    const second = flashedRowText();
    expect(second).not.toBeNull();
    expect(second).not.toBe(first);

    fireEvent.click(row);
    const third = flashedRowText();
    expect(third).not.toBe(first);
    expect(third).not.toBe(second);

    // …and wraps back to the start rather than stranding the walk.
    fireEvent.click(row);
    expect(flashedRowText()).toBe(first);
  });

  it("stays put for a single-item category", () => {
    renderEditor(withMisattributed(makeCv(), 1));
    const row = screen.getByRole("button", {
      name: /work that may not be yours|works that may not be yours/i,
    });
    fireEvent.click(row);
    const only = flashedRowText();
    fireEvent.click(row);
    expect(flashedRowText()).toBe(only);
  });
});

describe("the walk is perceptible without sight", () => {
  it("moves REAL focus to the row, not just the scroll position", () => {
    // Previously the jump was scrollIntoView + a CSS flash: nothing for a screen
    // reader, and the keyboard user's position stayed in the panel above, so the
    // row they had "jumped to" was unreachable without tabbing the whole list.
    renderEditor(withMisattributed(makeCv(), 2));
    fireEvent.click(screen.getByRole("button", { name: /works that may not be yours/i }));
    const active = document.activeElement as HTMLElement | null;
    expect(active).not.toBeNull();
    expect(active!.tagName).toBe("LI");
    expect(active!.className).toContain("cv-item-row");
    // Script-focusable only — never inserted into the tab sequence.
    expect(active!.getAttribute("tabindex")).toBe("-1");
  });

  it("announces where the walk landed, with its position", () => {
    renderEditor(withMisattributed(makeCv(), 3));
    const row = screen.getByRole("button", { name: /works that may not be yours/i });
    const status = document.querySelector('[role="status"][aria-live="polite"]')!;
    expect(status).toBeTruthy();

    fireEvent.click(row);
    const first = status.textContent ?? "";
    expect(first).toMatch(/1 of 3/);

    fireEvent.click(row);
    expect(status.textContent).toMatch(/2 of 3/);
    expect(status.textContent).not.toBe(first);
  });

  it("names the row it landed on, so the announcement is not just a number", () => {
    renderEditor(withMisattributed(makeCv(), 1));
    fireEvent.click(screen.getByRole("button", { name: /may not be yours/i }));
    const status = document.querySelector('[role="status"][aria-live="polite"]')!;
    // Position plus something identifying the work.
    expect(status.textContent).toMatch(/1 of 1/);
    expect((status.textContent ?? "").length).toBeGreaterThan("1 of 1: ".length);
  });

  it("tells the user the control walks, rather than jumping to one item", () => {
    // hpHint described the OLD jump-to-first behaviour and was the only
    // affordance copy in the product.
    renderEditor(withMisattributed(makeCv(), 2));
    expect(document.body.textContent).toMatch(/select again for the next/i);
  });
});
