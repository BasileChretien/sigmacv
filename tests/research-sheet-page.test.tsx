import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * /cv/research-sheet: the approved information sheet with the user's consent
 * record, to print or save as PDF. While the study is closed it exists only for
 * someone with a record, who must still be able to re-read what they agreed to.
 */

const mocks = vi.hoisted(() => ({ auth: vi.fn(), findMany: vi.fn() }));
vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({ prisma: { researchConsentRecord: { findMany: mocks.findMany } } }));
vi.mock("next/navigation", () => ({
  redirect: (to: string) => {
    throw new Error(`REDIRECT ${to}`);
  },
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

import ResearchSheetPage from "@/app/cv/research-sheet/page";
import { consentText } from "@/lib/research/consent";

const RECORD = {
  action: "grant",
  at: new Date("2026-10-22T07:31:00Z"),
  version: 2,
  locale: "en-US",
  agreeRequired: true,
  secondaryUse: false,
};

const open = (query: Record<string, string> = {}) =>
  ResearchSheetPage({ searchParams: Promise.resolve(query) });

beforeEach(() => {
  mocks.auth.mockReset().mockResolvedValue({ user: { id: "u1" } });
  mocks.findMany.mockReset().mockResolvedValue([]);
  process.env.RESEARCH_LOGGING_ENABLED = "true";
});
afterEach(() => {
  delete process.env.RESEARCH_LOGGING_ENABLED;
});

describe("/cv/research-sheet", () => {
  it("sends a signed-out visitor home", async () => {
    mocks.auth.mockResolvedValue(null);
    await expect(open()).rejects.toThrow("REDIRECT /");
  });

  it("serves the sheet while the study is open, with the user's own records only", async () => {
    mocks.findMany.mockResolvedValue([RECORD]);
    const html = renderToStaticMarkup(await open({ lang: "en-US" }));
    expect(html).toContain(consentText("en-US").sheet.title);
    expect(html).toContain("2026-10-22 07:31 UTC");
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "u1" }, orderBy: { at: "asc" } }),
    );
  });

  it("is not found while the study is closed and the user has no record", async () => {
    delete process.env.RESEARCH_LOGGING_ENABLED;
    await expect(open()).rejects.toThrow("NOT_FOUND");
  });

  it("stays for a user with a record while the study is closed", async () => {
    delete process.env.RESEARCH_LOGGING_ENABLED;
    mocks.findMany.mockResolvedValue([RECORD]);
    const html = renderToStaticMarkup(await open({ lang: "ja-JP" }));
    expect(html).toContain(consentText("ja-JP").sheet.title);
  });
});
