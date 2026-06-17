import { beforeEach, describe, expect, it, vi } from "vitest";

// getPublicCvForPage pulls in sync.ts (which transitively reads env lazily).
// Provide a minimal valid env so nothing throws; the DB is mocked below.
Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
});

const mocks = vi.hoisted(() => ({
  cvFindUnique: vi.fn(),
  userFindMany: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    cv: { findUnique: mocks.cvFindUnique },
    user: { findMany: mocks.userFindMany },
  },
}));

import { buildCanonicalCv } from "@/lib/canonical/build";
import { updateDisplay } from "@/lib/canonical/curate";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import { resolveCoauthorCvs } from "@/lib/cv/coauthorLinks";
import { getPublicCvForPage } from "@/lib/cv/sync";
import type { OpenAlexWork } from "@/lib/openalex/types";
import type { CanonicalCv, CvItem } from "@/lib/canonical/schema";

const OWNER_ORCID = "0000-0002-7483-2489";
const COAUTHOR_ORCID = "0000-0001-2345-6789";

function workWithCoauthors(): OpenAlexWork {
  return {
    id: "https://openalex.org/W1",
    title: "Shared paper",
    publication_year: 2024,
    type: "article",
    authorships: [
      {
        author: {
          id: "https://openalex.org/A1",
          display_name: "Basile Chrétien",
          orcid: `https://orcid.org/${OWNER_ORCID}`,
        },
      },
      {
        author: {
          id: "https://openalex.org/A2",
          display_name: "Jane Coauthor",
          orcid: `https://orcid.org/${COAUTHOR_ORCID}`,
        },
      },
      { author: { id: "https://openalex.org/A3", display_name: "No Orcid Author" } },
    ],
  };
}

function workOwnerOnly(): OpenAlexWork {
  return {
    id: "https://openalex.org/W2",
    title: "Solo paper",
    publication_year: 2023,
    type: "article",
    authorships: [
      { author: { id: "https://openalex.org/A1", orcid: `https://orcid.org/${OWNER_ORCID}` } },
    ],
  };
}

function makeCv(works: OpenAlexWork[] = [workWithCoauthors()]): CanonicalCv {
  return buildCanonicalCv({
    id: "j",
    resolved: { orcid: OWNER_ORCID, authorIds: ["A5001069481"], displayName: "Basile Chrétien" },
    works,
    now: "2026-06-17T00:00:00.000Z",
  });
}

function firstCitationItem(cv: CanonicalCv): CvItem | undefined {
  for (const s of cv.sections) {
    const it = s.items.find((i) => i.csl);
    if (it) return it;
  }
  return undefined;
}

/** A target co-author's stored CV document (their own published+indexable CV). */
function targetCvDoc(opts: { displayName?: string; linkable?: boolean } = {}): CanonicalCv {
  let cv = buildCanonicalCv({
    id: "t",
    resolved: {
      orcid: COAUTHOR_ORCID,
      authorIds: [],
      displayName: opts.displayName ?? "Jane Curated",
    },
    works: [],
    now: "2026-06-17T00:00:00.000Z",
  });
  if (opts.linkable === false) cv = updateDisplay(cv, { coauthorLinkable: false });
  return cv;
}

/** Force a specific co-author ORCID list onto the first citation item. */
function withCoauthorOrcids(cv: CanonicalCv, orcids: string[]): CanonicalCv {
  let done = false;
  const sections = cv.sections.map((s) => ({
    ...s,
    items: s.items.map((it) => {
      if (!done && it.csl) {
        done = true;
        return { ...it, meta: { ...it.meta, coauthorOrcids: orcids } };
      }
      return it;
    }),
  }));
  return { ...cv, sections };
}

describe("build: meta.coauthorOrcids", () => {
  it("captures co-author ORCIDs, excluding the owner and authors with no ORCID", () => {
    const item = firstCitationItem(makeCv());
    expect(item?.meta.coauthorOrcids).toEqual([COAUTHOR_ORCID]);
  });

  it("omits the field when no co-author carries an ORCID", () => {
    const w = workWithCoauthors();
    w.authorships = [
      { author: { display_name: "Basile Chrétien", orcid: `https://orcid.org/${OWNER_ORCID}` } },
      { author: { display_name: "No Orcid" } },
    ];
    expect(firstCitationItem(makeCv([w]))?.meta.coauthorOrcids).toBeUndefined();
  });
});

describe("projectCvForPublic: strips meta.coauthorOrcids", () => {
  it("removes the raw co-author ORCID list from the public projection", () => {
    const cv = makeCv();
    expect(firstCitationItem(cv)?.meta.coauthorOrcids).toEqual([COAUTHOR_ORCID]);
    const pub = projectCvForPublic(cv);
    expect(firstCitationItem(pub)?.meta.coauthorOrcids).toBeUndefined();
  });
});

describe("resolveCoauthorCvs", () => {
  beforeEach(() => {
    mocks.userFindMany.mockReset();
  });

  it("resolves co-authors with a published, indexable CV by ORCID", async () => {
    mocks.userFindMany.mockResolvedValue([
      { orcid: COAUTHOR_ORCID, name: "Jane Coauthor", cv: { publicSlug: "jane-coauthor-abc123" } },
    ]);
    const links = await resolveCoauthorCvs(makeCv());
    expect(links).toEqual([
      { orcid: COAUTHOR_ORCID, slug: "jane-coauthor-abc123", name: "Jane Coauthor" },
    ]);
    expect(mocks.userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          orcid: { in: [COAUTHOR_ORCID] },
          cv: { published: true, publicIndexable: true, publicSlug: { not: null } },
        },
      }),
    );
  });

  it("returns [] without querying when there are no co-author ORCIDs", async () => {
    const links = await resolveCoauthorCvs(makeCv([workOwnerOnly()]));
    expect(links).toEqual([]);
    expect(mocks.userFindMany).not.toHaveBeenCalled();
  });

  it("excludes the owner's own ORCID from the lookup", async () => {
    mocks.userFindMany.mockResolvedValue([]);
    await resolveCoauthorCvs(withCoauthorOrcids(makeCv(), [OWNER_ORCID, COAUTHOR_ORCID]));
    expect(mocks.userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ orcid: { in: [COAUTHOR_ORCID] } }),
      }),
    );
  });

  it("caps the lookup at the bound for a hyper-authored CV", async () => {
    const many = Array.from(
      { length: 600 },
      (_, i) => `0000-0000-${String(i).padStart(4, "0")}-0000`,
    );
    mocks.userFindMany.mockResolvedValue([]);
    await resolveCoauthorCvs(withCoauthorOrcids(makeCv(), many));
    const arg = mocks.userFindMany.mock.calls[0]![0] as { where: { orcid: { in: string[] } } };
    expect(arg.where.orcid.in).toHaveLength(500);
  });

  it("drops rows with an invalid slug, an unparseable ORCID, or no CV", async () => {
    mocks.userFindMany.mockResolvedValue([
      { orcid: COAUTHOR_ORCID, name: "Bad slug", cv: { publicSlug: "Has Space!" } },
      { orcid: "garbage", name: "Bad orcid", cv: { publicSlug: "ok-slug" } },
      { orcid: COAUTHOR_ORCID, name: null, cv: null },
    ]);
    expect(await resolveCoauthorCvs(makeCv())).toEqual([]);
  });

  it("excludes a co-author who opted out of being linked (coauthorLinkable=false)", async () => {
    mocks.userFindMany.mockResolvedValue([
      {
        orcid: COAUTHOR_ORCID,
        name: "Jane Account",
        cv: { publicSlug: "jane-x", document: targetCvDoc({ linkable: false }) },
      },
    ]);
    expect(await resolveCoauthorCvs(makeCv())).toEqual([]);
  });

  it("prefers the co-author's CV display name over the account name", async () => {
    mocks.userFindMany.mockResolvedValue([
      {
        orcid: COAUTHOR_ORCID,
        name: "Jane Account",
        cv: { publicSlug: "jane-x", document: targetCvDoc({ displayName: "Jane Q. Curated" }) },
      },
    ]);
    expect(await resolveCoauthorCvs(makeCv())).toEqual([
      { orcid: COAUTHOR_ORCID, slug: "jane-x", name: "Jane Q. Curated" },
    ]);
  });

  it("falls back to 'Researcher' when the user has no name", async () => {
    mocks.userFindMany.mockResolvedValue([
      { orcid: COAUTHOR_ORCID, name: null, cv: { publicSlug: "ok-1" } },
    ]);
    expect(await resolveCoauthorCvs(makeCv())).toEqual([
      { orcid: COAUTHOR_ORCID, slug: "ok-1", name: "Researcher" },
    ]);
  });

  it("orders results by name then ORCID (deterministic JSON-LD)", async () => {
    mocks.userFindMany.mockResolvedValue([
      { orcid: "0000-0001-2345-6789", name: "Same Name", cv: { publicSlug: "a-1" } },
      { orcid: "0000-0001-1111-1111", name: "Same Name", cv: { publicSlug: "b-2" } },
    ]);
    const links = await resolveCoauthorCvs(makeCv());
    expect(links.map((l) => l.orcid)).toEqual(["0000-0001-1111-1111", "0000-0001-2345-6789"]);
  });

  it("is fail-soft: a DB error yields an empty list", async () => {
    mocks.userFindMany.mockRejectedValue(new Error("db down"));
    expect(await resolveCoauthorCvs(makeCv())).toEqual([]);
  });
});

describe("getPublicCvForPage: co-author links", () => {
  beforeEach(() => {
    mocks.cvFindUnique.mockReset();
    mocks.userFindMany.mockReset();
  });

  it("resolves co-author CVs when asked, and the projection still strips the raw list", async () => {
    mocks.cvFindUnique.mockResolvedValue({
      published: true,
      publicIndexable: true,
      document: makeCv(),
    });
    mocks.userFindMany.mockResolvedValue([
      { orcid: COAUTHOR_ORCID, name: "Jane Coauthor", cv: { publicSlug: "jane-x1" } },
    ]);
    const record = await getPublicCvForPage("slug", { resolveCoauthors: true });
    expect(record?.coauthorCvs).toEqual([
      { orcid: COAUTHOR_ORCID, slug: "jane-x1", name: "Jane Coauthor" },
    ]);
    expect(firstCitationItem(record!.cv)?.meta.coauthorOrcids).toBeUndefined();
  });

  it("skips co-author resolution by default", async () => {
    mocks.cvFindUnique.mockResolvedValue({
      published: true,
      publicIndexable: false,
      document: makeCv(),
    });
    const record = await getPublicCvForPage("slug");
    expect(record?.coauthorCvs).toEqual([]);
    expect(mocks.userFindMany).not.toHaveBeenCalled();
  });

  it("returns null for a missing or unpublished CV", async () => {
    mocks.cvFindUnique.mockResolvedValue(null);
    expect(await getPublicCvForPage("nope", { resolveCoauthors: true })).toBeNull();
  });
});
