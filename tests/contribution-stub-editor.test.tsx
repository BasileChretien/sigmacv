// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import CvEditor from "@/components/CvEditor";
import { CanonicalCvSchema, type CanonicalCv, type CvItem } from "@/lib/canonical/schema";
import { proseStarterStrings } from "@/lib/i18n/proseStarter";

/**
 * The editor wiring behind a contributions section: the picker's button names
 * the action, a picked entry becomes a numbered stub in the section's body (the
 * pick prompt gone), and a `#cv-edit=<sectionId>` fragment — what a placeholder
 * link in the preview sets — opens the Content part at that section, focuses
 * its text box and clears the fragment, malformed fragments included.
 */

function work(id: string): CvItem {
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
    meta: { year: 2021, citedByCount: 3 },
  };
}

function makeCv(): CanonicalCv {
  return CanonicalCvSchema.parse({
    schemaVersion: 2,
    id: "stubs",
    owner: { orcid: "0000-0002-7483-2489", openAlexAuthorIds: [], displayName: "Owner" },
    display: { locale: "en-US" },
    sections: [
      {
        id: "pubs",
        type: "publications",
        title: "Publications",
        visible: true,
        order: 0,
        items: [work("W1")],
      },
      {
        id: "contrib",
        type: "narrative-knowledge",
        title: "Contributions",
        visible: true,
        order: 1,
        items: [],
        body: proseStarterStrings("en-US").pickPrompt,
      },
    ],
    provenance: { generatedAt: "2026-09-17T00:00:00.000Z", sources: ["openalex"] },
  });
}

const expandSections = () =>
  document
    .querySelectorAll<HTMLButtonElement>('button.section-toggle[aria-expanded="false"]')
    .forEach((b) => fireEvent.click(b));

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  window.requestAnimationFrame = (cb) => window.setTimeout(() => cb(0), 0);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);
});
afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", window.location.pathname);
});

describe("a contributions section in the editor", () => {
  it("turns a picked entry into a numbered stub in the body, the pick prompt gone", () => {
    const onChange = vi.fn();
    render(
      <CvEditor
        cv={makeCv()}
        availableStyles={["apa"]}
        uiLocale="en-US"
        onChange={onChange}
        variant="regions"
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Content" }));
    expandSections();
    fireEvent.click(screen.getByText("Add one of my entries as a contribution"));
    // The publications row shows the same title; pick the option in the picker.
    fireEvent.click(document.querySelector<HTMLButtonElement>(".evidence-option")!);
    const next = onChange.mock.calls.at(-1)![0] as CanonicalCv;
    const body = next.sections.find((s) => s.id === "contrib")!.body!;
    expect(body).not.toContain(proseStarterStrings("en-US").pickPrompt);
    expect(body).toContain("1. Work W1 (2021 · Audience : A / B / C) [[W1 | Smith 2021]]");
    expect(body).toContain("Role : [to complete]");
    expect(body).toContain("Impact : [to complete]");
    expect(body).toContain("Reference : Smith, A. (2021). Work W1. https://doi.org/10.1234/W1");
  });

  it("a #cv-edit fragment opens the Content part at the section, focuses its text box and clears the fragment", async () => {
    render(
      <CvEditor
        cv={makeCv()}
        availableStyles={["apa"]}
        uiLocale="en-US"
        onChange={vi.fn()}
        variant="regions"
      />,
    );
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
    // A malformed fragment throws nothing and is cleared too.
    window.location.hash = "#cv-edit=%E0%A4";
    expect(() => fireEvent(window, new Event("hashchange"))).not.toThrow();
    expect(window.location.hash).toBe("");
  });
});
