import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  listIndexablePublicSlugs: vi.fn(),
  institutionIndex: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/cv/sync", () => ({ listIndexablePublicSlugs: mocks.listIndexablePublicSlugs }));
vi.mock("@/lib/institutions/institutions", async (importOriginal) => ({
  // The real indexability rule (>= 2 listed) is under test; only the DB read is mocked.
  ...(await importOriginal<typeof import("@/lib/institutions/institutions")>()),
  institutionIndex: mocks.institutionIndex,
}));

import sitemap from "@/app/sitemap";
import { SITE_URL } from "@/lib/siteUrl";

const ROR = "04chrp450";

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  mocks.listIndexablePublicSlugs.mockResolvedValue(["ada-x7"]);
});

describe("sitemap: institution pages", () => {
  it("lists the index in every language and each indexable institution's page with hreflang alternates", async () => {
    mocks.institutionIndex.mockResolvedValue([
      { rorId: ROR, name: "Université de Caen Normandie", listedCount: 2 },
    ]);
    const entries = await sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toContain(`${SITE_URL}/i`);
    expect(urls).toContain(`${SITE_URL}/fr/i`);
    expect(urls).toContain(`${SITE_URL}/i/${ROR}`);
    expect(urls).toContain(`${SITE_URL}/ja/i/${ROR}`);
    const page = entries.find((e) => e.url === `${SITE_URL}/i/${ROR}`)!;
    expect(page.alternates?.languages?.["de-DE"]).toBe(`${SITE_URL}/de/i/${ROR}`);
    expect(page.changeFrequency).toBe("weekly");
    // Public CVs are still there alongside.
    expect(urls).toContain(`${SITE_URL}/p/ada-x7`);
  });

  it("omits an institution with a single listed researcher (served noindex) and keeps one with two", async () => {
    mocks.institutionIndex.mockResolvedValue([
      { rorId: ROR, name: "Université de Caen Normandie", listedCount: 1 },
      { rorId: "05m32f987", name: "Nagoya University", listedCount: 2 },
    ]);
    const urls = (await sitemap()).map((e) => e.url);
    expect(urls.some((u) => u.includes(`/i/${ROR}`))).toBe(false);
    expect(urls).toContain(`${SITE_URL}/i/05m32f987`);
    expect(urls).toContain(`${SITE_URL}/de/i/05m32f987`);
  });

  it("lists nothing under /i/ when nobody opted in, and survives a database error", async () => {
    mocks.institutionIndex.mockResolvedValue([]);
    let urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain(`${SITE_URL}/i`);
    expect(urls.some((u) => u.includes("/i/"))).toBe(false);

    mocks.institutionIndex.mockRejectedValue(new Error("db down"));
    urls = (await sitemap()).map((e) => e.url);
    expect(urls).toContain(`${SITE_URL}/i`);
    expect(urls).toContain(`${SITE_URL}/about`);
    expect(urls.some((u) => u.includes("/i/"))).toBe(false);
  });
});
