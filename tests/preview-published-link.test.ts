import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique: mocks.findUnique } } }));

import { resolvePublishedPreviewLink } from "@/lib/cv/previewPublishedLink";

const ORCID = "0000-0002-7483-2489";

beforeEach(() => {
  mocks.findUnique.mockReset();
});

describe("resolvePublishedPreviewLink", () => {
  it("returns the public page path only for a published AND indexable CV with a slug", async () => {
    mocks.findUnique.mockResolvedValue({
      cv: { published: true, publicIndexable: true, publicSlug: "basile-chretien-ab12" },
    });
    await expect(resolvePublishedPreviewLink(ORCID)).resolves.toBe("/p/basile-chretien-ab12");
    // Looked up by the canonical iD, never by name.
    expect(mocks.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { orcid: ORCID } }),
    );
  });

  it("normalises the pasted form before the lookup", async () => {
    mocks.findUnique.mockResolvedValue({
      cv: { published: true, publicIndexable: true, publicSlug: "x1" },
    });
    await expect(resolvePublishedPreviewLink(`https://orcid.org/${ORCID}`)).resolves.toBe("/p/x1");
    expect(mocks.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { orcid: ORCID } }),
    );
  });

  it("returns null — the same as 'no account' — for published-but-unindexed, unpublished, and missing", async () => {
    // Published but NOT indexable: the owner did not consent to be findable, and
    // the slug is a capability URL. Must look exactly like no account at all.
    mocks.findUnique.mockResolvedValue({
      cv: { published: true, publicIndexable: false, publicSlug: "secret-slug" },
    });
    await expect(resolvePublishedPreviewLink(ORCID)).resolves.toBeNull();

    mocks.findUnique.mockResolvedValue({
      cv: { published: false, publicIndexable: true, publicSlug: "old-slug" },
    });
    await expect(resolvePublishedPreviewLink(ORCID)).resolves.toBeNull();

    mocks.findUnique.mockResolvedValue({ cv: null });
    await expect(resolvePublishedPreviewLink(ORCID)).resolves.toBeNull();

    mocks.findUnique.mockResolvedValue(null);
    await expect(resolvePublishedPreviewLink(ORCID)).resolves.toBeNull();
  });

  it("refuses a malformed slug rather than building a path from it", async () => {
    mocks.findUnique.mockResolvedValue({
      cv: { published: true, publicIndexable: true, publicSlug: "../etc" },
    });
    await expect(resolvePublishedPreviewLink(ORCID)).resolves.toBeNull();
    mocks.findUnique.mockResolvedValue({
      cv: { published: true, publicIndexable: true, publicSlug: null },
    });
    await expect(resolvePublishedPreviewLink(ORCID)).resolves.toBeNull();
  });

  it("never touches the database for an invalid iD, and fails soft on a DB error", async () => {
    await expect(resolvePublishedPreviewLink("not-an-orcid")).resolves.toBeNull();
    expect(mocks.findUnique).not.toHaveBeenCalled();

    mocks.findUnique.mockRejectedValue(new Error("db down"));
    await expect(resolvePublishedPreviewLink(ORCID)).resolves.toBeNull();
  });
});
