// @vitest-environment jsdom
import { useState } from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import CvEditor from "@/components/CvEditor";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { proseStarterStrings } from "@/lib/i18n/proseStarter";

/**
 * The contribution cards in the editor: a picked entry becomes a card (the pick
 * prompt gone, the entry no longer offered), its role, impact, period, audience
 * and "cited in" lines are edited in place, cards move and are deleted, a blank
 * card takes a title; and a `#cv-edit=<sectionId>` fragment opens the section.
 */

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
    csl: {
      id,
      type: "article-journal",
      title: `Work ${id}`,
      author: [{ family: "Smith", given: "A" }],
      issued: { "date-parts": [[2021]] },
      DOI: `10.1234/${id}`,
    },
    meta: { year: 2021, citedByCount: id === "W1" ? 50 : 3, ...meta },
  };
}

const PICK = proseStarterStrings("en-US").pickPrompt;

function makeCv(): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "cards",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Owner" },
    display: { locale: "en-US" },
    sections: [
      {
        id: "pubs",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items: [
          work("W1", {
            guidelineCitations: [{ pmid: "39413835", title: "NCCN Guidelines", year: 2024 }],
          }),
          work("W2"),
        ],
      },
      {
        id: "contrib",
        type: "narrative-knowledge",
        title: "Contributions",
        visible: true,
        order: 1,
        items: [],
        body: PICK,
      },
    ],
    provenance: { generatedAt: "2026-09-17T00:00:00.000Z", sources: ["openalex"] },
  });
}

let latest: CanonicalCv;
function Harness() {
  const [cv, setCv] = useState(makeCv);
  latest = cv;
  return (
    <CvEditor
      cv={cv}
      availableStyles={["apa"]}
      uiLocale="en-US"
      onChange={setCv}
      variant="regions"
    />
  );
}

const section = () => latest.sections.find((s) => s.id === "contrib")!;
const cards = () => [...document.querySelectorAll<HTMLElement>("li.contrib-card")];
const openContent = () => {
  fireEvent.click(screen.getByRole("tab", { name: "Content" }));
  document
    .querySelectorAll<HTMLButtonElement>('button.section-toggle[aria-expanded="false"]')
    .forEach((b) => fireEvent.click(b));
};
const pickFirst = () => {
  fireEvent.click(screen.getByText("Add one of my entries as a contribution"));
  const option = document.querySelector<HTMLButtonElement>(".evidence-option")!;
  const title = option.querySelector(".evidence-option-title")!.textContent;
  fireEvent.click(option);
  return title;
};

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  window.requestAnimationFrame = (cb) => window.setTimeout(() => cb(0), 0);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", window.location.pathname);
});

describe("contribution cards", () => {
  it("a picked entry becomes a card with its year and guidelines; the prompt goes; it is not offered again", () => {
    render(<Harness />);
    openContent();
    expect(pickFirst()).toBe("Work W1"); // most cited first
    expect(section().contributions).toEqual([
      {
        id: "c1",
        itemId: "W1",
        period: "2021",
        citedIn: [
          { text: "NCCN Guidelines (2024)", url: "https://pubmed.ncbi.nlm.nih.gov/39413835/" },
        ],
      },
    ]);
    expect(section().body).toBe("");
    expect(cards()).toHaveLength(1);
    const card = within(cards()[0]!);
    expect(card.getByText("Work W1")).toBeTruthy();
    expect(card.getByText(/Smith, A\. \(2021\)\. Work W1\./)).toBeTruthy();
    // The role box takes focus so the owner types straight away.
    expect(document.activeElement).toBe(card.getByLabelText("Role"));
    // W1 is no longer offered.
    fireEvent.click(screen.getByText("Add one of my entries as a contribution"));
    const offered = [...document.querySelectorAll(".evidence-option-title")].map(
      (e) => e.textContent,
    );
    expect(offered).not.toContain("Work W1");
    expect(offered).toContain("Work W2");
  });

  it("edits role, impact, period, audience and cited-in lines in place", () => {
    render(<Harness />);
    openContent();
    pickFirst();
    const card = within(cards()[0]!);
    fireEvent.change(card.getByLabelText("Role"), { target: { value: "Lead analyst" } });
    fireEvent.change(card.getByLabelText("Impact"), { target: { value: "Guideline change" } });
    fireEvent.change(card.getByLabelText("Period"), { target: { value: "2019–2023" } });
    fireEvent.click(card.getByRole("checkbox", { name: /B practice community/ }));
    fireEvent.click(card.getByText("+ Add a place where it is cited"));
    fireEvent.change(card.getByLabelText("Where it is cited (guideline, report, policy…) 2"), {
      target: { value: "Ministry report" },
    });
    fireEvent.change(card.getByLabelText("Link (optional) 2"), {
      target: { value: "https://example.org/r" },
    });
    // Drop the prefilled guideline line.
    fireEvent.click(card.getByLabelText("Remove this line 1"));
    expect(section().contributions![0]).toEqual({
      id: "c1",
      itemId: "W1",
      period: "2019–2023",
      audience: ["B"],
      role: "Lead analyst",
      impact: "Guideline change",
      citedIn: [{ text: "Ministry report", url: "https://example.org/r" }],
    });
    // Clearing a link keeps the line and drops the url.
    fireEvent.change(card.getByLabelText("Link (optional) 1"), { target: { value: "" } });
    expect(section().contributions![0]!.citedIn).toEqual([{ text: "Ministry report" }]);
    fireEvent.click(card.getByRole("checkbox", { name: /B practice community/ }));
    expect(section().contributions![0]!.audience).toBeUndefined();
  });

  it("moves and deletes cards, and a blank card takes a title", () => {
    render(<Harness />);
    openContent();
    pickFirst();
    pickFirst();
    fireEvent.click(screen.getByText("+ Add a contribution that is not an entry"));
    expect(cards()).toHaveLength(3);
    const blank = within(cards()[2]!);
    expect(document.activeElement).toBe(blank.getByLabelText("Title"));
    fireEvent.change(blank.getByLabelText("Title"), { target: { value: "Network coordination" } });
    expect(section().contributions!.map((c) => c.title ?? c.itemId)).toEqual([
      "W1",
      "W2",
      "Network coordination",
    ]);
    fireEvent.click(within(cards()[2]!).getByRole("button", { name: /Move up/ }));
    expect(section().contributions!.map((c) => c.id)).toEqual(["c1", "c3", "c2"]);
    expect(within(cards()[0]!).getByRole("button", { name: /Move up/ })).toHaveProperty(
      "disabled",
      true,
    );
    fireEvent.click(within(cards()[2]!).getByRole("button", { name: /Delete this contribution/ }));
    expect(section().contributions!.map((c) => c.id)).toEqual(["c1", "c3"]);
    fireEvent.click(within(cards()[0]!).getByRole("button", { name: /Move down/ }));
    expect(section().contributions!.map((c) => c.id)).toEqual(["c3", "c1"]);
    fireEvent.click(within(cards()[0]!).getByRole("button", { name: /Delete this contribution/ }));
    fireEvent.click(within(cards()[0]!).getByRole("button", { name: /Delete this contribution/ }));
    expect(section().contributions).toBeUndefined();
    expect(cards()).toHaveLength(0);
  });

  it("says so when a card's entry has left the record", () => {
    const Wrapped = () => {
      const [cv, setCv] = useState(() => {
        const base = makeCv();
        return {
          ...base,
          sections: base.sections.map((s) =>
            s.id === "contrib" ? { ...s, contributions: [{ id: "c1", itemId: "W-gone" }] } : s,
          ),
        };
      });
      latest = cv;
      return (
        <CvEditor
          cv={cv}
          availableStyles={["apa"]}
          uiLocale="en-US"
          onChange={setCv}
          variant="regions"
        />
      );
    };
    render(<Wrapped />);
    openContent();
    expect(cards()[0]!.classList.contains("is-missing")).toBe(true);
    expect(within(cards()[0]!).getByRole("status").textContent).toMatch(/no longer on your record/);
  });

  it("a #cv-edit fragment opens the Content part at the section, focuses its text box and clears the fragment", async () => {
    render(<Harness />);
    expect(screen.getByRole("tab", { name: "Content" }).getAttribute("aria-selected")).toBe(
      "false",
    );
    window.location.hash = "#cv-edit=contrib";
    fireEvent(window, new Event("hashchange"));
    expect(screen.getByRole("tab", { name: "Content" }).getAttribute("aria-selected")).toBe("true");
    await vi.waitFor(() => {
      const box = document.activeElement as HTMLTextAreaElement | null;
      expect(box?.classList.contains("prose-body")).toBe(true);
    });
    expect(window.location.hash).toBe("");
    window.location.hash = "#cv-edit=%E0%A4";
    expect(() => fireEvent(window, new Event("hashchange"))).not.toThrow();
    expect(window.location.hash).toBe("");
  });
});
