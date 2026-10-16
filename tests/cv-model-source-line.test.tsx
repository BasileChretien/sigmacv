// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import CvModelSourceLine from "@/components/CvModelSourceLine";
import { cvModelSourceDueOn, cvModelSources } from "@/lib/canonical/cvModelSources";
import { editorUi } from "@/lib/i18n/editorUi";

afterEach(() => {
  vi.useRealTimers();
  cleanup();
});

const READ_ON = new Date("2026-10-20T09:00:00Z");

describe("CvModelSourceLine", () => {
  it("renders nothing for a model never read against a funder document", () => {
    const { container } = render(
      <CvModelSourceLine modelId="nih" locale="en-US" strings={editorUi("en-US")} />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("links each funder document, joined the locale's way, with the day it was read", () => {
    vi.useFakeTimers({ now: READ_ON });
    render(<CvModelSourceLine modelId="anr" locale="en-US" strings={editorUi("en-US")} />);
    const docs = cvModelSources("anr");
    for (const d of docs) {
      expect(screen.getByRole("link", { name: d.document }).getAttribute("href")).toBe(d.url);
    }
    const line = screen.getByText(/Checked against/);
    expect(line.textContent).toBe(
      `Checked against ${docs[0]!.document} and ${docs[1]!.document} on October 16, 2026.`,
    );
  });

  it("follows the locale's word order and date format", () => {
    vi.useFakeTimers({ now: READ_ON });
    render(<CvModelSourceLine modelId="frm" locale="fr-FR" strings={editorUi("fr-FR")} />);
    const [doc] = cvModelSources("frm");
    expect(screen.getByText(/Vérifié d’après/).textContent).toBe(
      `Vérifié d’après ${doc!.document} le 16 octobre 2026.`,
    );
  });

  it("says the funder may have changed its rules once the reading is due", () => {
    vi.useFakeTimers({
      now: new Date(`${cvModelSourceDueOn(cvModelSources("anr")[0]!)}T08:00:00Z`),
    });
    render(<CvModelSourceLine modelId="anr" locale="en-US" strings={editorUi("en-US")} />);
    expect(screen.getByText(/Checked against/).textContent).toMatch(
      /The funder may have changed its rules since\.$/,
    );
  });
});
