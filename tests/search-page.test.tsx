// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";

// The site chrome reads the App Router (pathname / router); stub it for jsdom.
vi.mock("next/navigation", () => ({
  usePathname: () => "/search",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
// next/link needs the App Router context; a plain anchor carries the same href/rel here.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: { href: string; children: React.ReactNode } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
import { cleanup, render, screen } from "@testing-library/react";
import SearchPage from "@/components/SearchPage";
import { searchStrings } from "@/lib/i18n/search";

const s = searchStrings("en-US");
afterEach(cleanup);

describe("SearchPage", () => {
  it("states the promise and offers only a name field on the bare page", () => {
    render(<SearchPage locale="en-US" lookup={{ kind: "idle" }} />);
    expect(screen.getByText(s.promise)).toBeTruthy();
    const input = screen.getByTestId("search-input") as HTMLInputElement;
    expect(input.name).toBe("q");
    expect(input.minLength).toBe(3);
    expect(input.maxLength).toBe(80);
    expect(screen.queryByTestId("search-results")).toBeNull();
    // No sort control, ever (the header's language switcher is not part of the form).
    expect(screen.getByRole("search").querySelector("select")).toBeNull();
  });

  it("renders a hit as name · affiliation · years · ORCID mark, linking nofollow to the preview — no figure", () => {
    render(
      <SearchPage
        locale="en-US"
        lookup={{
          kind: "ok",
          query: "chrétien",
          typed: "Chrétien",
          hits: [
            {
              name: "Basile Chrétien",
              orcid: "0000-0002-7483-2489",
              affiliation: "Nagoya University",
              years: [2024, 2026],
            },
            { name: "B. Chrétien", orcid: "0000-0002-1825-0097", affiliation: null, years: null },
          ],
        }}
      />,
    );
    const links = screen.getAllByTestId("search-result") as HTMLAnchorElement[];
    expect(links).toHaveLength(2);
    expect(links[0]!.getAttribute("href")).toBe("/preview/0000-0002-7483-2489");
    expect(links[0]!.getAttribute("rel")).toBe("nofollow");
    expect(links[0]!.textContent).toContain("Nagoya University");
    expect(links[0]!.textContent).toContain("2024–2026");
    expect(links[0]!.textContent).toContain(s.orcidMark);
    expect(links[1]!.textContent).not.toContain("null");
    // The box keeps what the visitor typed, not the lower-cased query; the list
    // is unordered — a numbered list would put a rank beside every name.
    expect((screen.getByTestId("search-input") as HTMLInputElement).value).toBe("Chrétien");
    expect(screen.getByTestId("search-results").tagName).toBe("UL");
    const list = screen.getByTestId("search-results").textContent ?? "";
    // The only digits on a row are the affiliation years.
    expect(list.replace(/\d{4}–\d{4}/g, "")).not.toMatch(/\d/);
    expect(screen.getByText(s.sourceNote)).toBeTruthy();
  });

  it("shows the empty, invalid and rate-limited notices", () => {
    const { unmount } = render(
      <SearchPage locale="en-US" lookup={{ kind: "ok", query: "zzz", typed: "zzz", hits: [] }} />,
    );
    expect(screen.getByTestId("search-empty").textContent).toBe(s.noResults);
    unmount();
    render(<SearchPage locale="en-US" lookup={{ kind: "invalid", raw: "a,b" }} />);
    expect(screen.getByTestId("search-invalid").textContent).toBe(s.invalid);
    expect((screen.getByTestId("search-input") as HTMLInputElement).defaultValue).toBe("a,b");
    cleanup();
    render(<SearchPage locale="en-US" lookup={{ kind: "rate-limited", retryAfterSec: 5 }} />);
    expect(screen.getByTestId("search-rate-limited").textContent).toBe(s.rateLimited);
  });
});
