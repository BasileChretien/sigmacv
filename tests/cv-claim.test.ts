import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { OpenAlexWork } from "@/lib/openalex/types";

const mocks = vi.hoisted(() => ({
  fetchWork: vi.fn(),
  resolveAuthor: vi.fn(),
  getCv: vi.fn(),
  saveCv: vi.fn(),
}));

vi.mock("@/lib/cv/sync", () => ({
  CvNotFoundError: class CvNotFoundError extends Error {},
  getCvForUser: mocks.getCv,
  saveCvForUser: mocks.saveCv,
}));
vi.mock("@/lib/openalex/client", () => ({ fetchWorkByDoi: mocks.fetchWork }));
vi.mock("@/lib/openalex/resolveAuthor", () => ({ resolveAuthorByOrcid: mocks.resolveAuthor }));

import { addClaimByDoi, previewClaim } from "@/lib/cv/claim";
import { CvNotFoundError } from "@/lib/cv/sync";

const ME = "0000-0002-7483-2489";

function work(over: Partial<OpenAlexWork> = {}): OpenAlexWork {
  return {
    id: "https://openalex.org/W777",
    doi: "https://doi.org/10.7/x",
    title: "A claimed paper",
    publication_year: 2021,
    type: "article",
    cited_by_count: 3,
    primary_location: { source: { type: "journal", display_name: "Journal X" } },
    authorships: [{ author: { display_name: "Wei Zhang" } }],
    ...over,
  } as unknown as OpenAlexWork;
}

function emptyCv(): CanonicalCv {
  return {
    schemaVersion: 2,
    id: "cv1",
    owner: { displayName: "Wei Zhang", orcid: ME },
    display: { locale: "en-US" },
    sections: [
      { id: "publications", type: "publications", title: "Publications", visible: true, order: 0, items: [] },
    ],
  } as unknown as CanonicalCv;
}

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset());
  mocks.resolveAuthor.mockResolvedValue({ orcid: ME, authorIds: [], displayName: "Wei Zhang" });
  mocks.saveCv.mockImplementation(async (_id: string, cv: CanonicalCv) => cv);
});

describe("previewClaim", () => {
  it("returns the resolved work + author list when found", async () => {
    mocks.fetchWork.mockResolvedValue(work());
    mocks.getCv.mockResolvedValue(emptyCv());
    const p = await previewClaim("u1", ME, "10.7/x");
    expect(p.found).toBe(true);
    expect(p.alreadyInCv).toBe(false);
    expect(p.title).toBe("A claimed paper");
    expect(p.venue).toBe("Journal X");
    expect(p.authors).toHaveLength(1);
    expect(p.idMatchedIndex).toBe(-1); // no identifier match → user must pick
  });

  it("reports found:false when OpenAlex has no record", async () => {
    mocks.fetchWork.mockResolvedValue(null);
    const p = await previewClaim("u1", ME, "10.0/missing");
    expect(p).toEqual({ found: false, alreadyInCv: false, authors: [], idMatchedIndex: -1 });
    expect(mocks.getCv).not.toHaveBeenCalled();
  });

  it("flags alreadyInCv when the DOI is already present", async () => {
    mocks.fetchWork.mockResolvedValue(work());
    const cv = emptyCv();
    cv.sections[0]!.items.push({
      id: "W777", source: "openalex", sourceId: "x",
      csl: { id: "W777", type: "article-journal", DOI: "10.7/x" },
      included: true, notMine: false, order: 0, authoredBySelf: true, selfNameVariants: [], meta: {},
    });
    mocks.getCv.mockResolvedValue(cv);
    expect((await previewClaim("u1", ME, "10.7/x")).alreadyInCv).toBe(true);
  });

  it("falls back to an empty resolved author when ORCID doesn't resolve", async () => {
    mocks.fetchWork.mockResolvedValue(work());
    mocks.resolveAuthor.mockResolvedValue(null);
    mocks.getCv.mockResolvedValue(null);
    const p = await previewClaim("u1", ME, "10.7/x");
    expect(p.found).toBe(true);
    expect(p.alreadyInCv).toBe(false);
  });
});

describe("addClaimByDoi", () => {
  it("builds, appends and saves a claimed work", async () => {
    mocks.fetchWork.mockResolvedValue(work());
    mocks.getCv.mockResolvedValue(emptyCv());
    const r = await addClaimByDoi("u1", ME, "10.7/x", 0);
    expect(r.found).toBe(true);
    expect(r.added).toBe(true);
    expect(r.alreadyInCv).toBe(false);
    expect(mocks.saveCv).toHaveBeenCalledTimes(1);
    const pubs = r.cv!.sections.find((s) => s.type === "publications")!;
    const added = pubs.items.find((i) => i.id === "W777")!;
    expect(added.authoredBySelf).toBe(true);
    expect(added.meta.claimed).toBe(true);
    expect(added.meta.citedByCount).toBe(3); // source-driven
  });

  it("refuses to add a duplicate (already in CV) without saving", async () => {
    mocks.fetchWork.mockResolvedValue(work());
    const cv = emptyCv();
    cv.sections[0]!.items.push({
      id: "W777", source: "openalex", sourceId: "x",
      csl: { id: "W777", type: "article-journal", DOI: "10.7/x" },
      included: true, notMine: false, order: 0, authoredBySelf: true, selfNameVariants: [], meta: {},
    });
    mocks.getCv.mockResolvedValue(cv);
    const r = await addClaimByDoi("u1", ME, "10.7/x", 0);
    expect(r.added).toBe(false);
    expect(r.alreadyInCv).toBe(true);
    expect(mocks.saveCv).not.toHaveBeenCalled();
  });

  it("returns found:false when the DOI isn't in OpenAlex", async () => {
    mocks.fetchWork.mockResolvedValue(null);
    const r = await addClaimByDoi("u1", ME, "10.0/missing");
    expect(r).toEqual({ found: false, added: false, alreadyInCv: false, cv: null });
  });

  it("throws CvNotFoundError when the user has no CV yet", async () => {
    mocks.fetchWork.mockResolvedValue(work());
    mocks.getCv.mockResolvedValue(null);
    await expect(addClaimByDoi("u1", ME, "10.7/x", 0)).rejects.toBeInstanceOf(CvNotFoundError);
  });
});
