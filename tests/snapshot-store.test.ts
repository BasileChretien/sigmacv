import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { setItemIncluded, setNotes, updateDisplay, updateOwner } from "@/lib/canonical/curate";
import type { CanonicalCv } from "@/lib/canonical/schema";
import type { OpenAlexWork } from "@/lib/openalex/types";
import worksFixture from "./fixtures/openalex-works.json";

Object.assign(process.env, {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  AUTH_SECRET: "x".repeat(20),
  ORCID_CLIENT_ID: "APP-1",
  ORCID_CLIENT_SECRET: "secret",
  OPENALEX_MAILTO: "ci@example.org",
  AUTH_URL: "https://sigmacv.test",
});

const mocks = vi.hoisted(() => ({
  cvFindUnique: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
  aggregate: vi.fn(),
  create: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  deleteMany: vi.fn(),
  findUnique: vi.fn(),
  doiMintingEnabled: vi.fn(),
  mintSnapshotDoi: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    cv: { findUnique: mocks.cvFindUnique },
    cvSnapshot: {
      findMany: mocks.findMany,
      count: mocks.count,
      aggregate: mocks.aggregate,
      create: mocks.create,
      findFirst: mocks.findFirst,
      update: mocks.update,
      deleteMany: mocks.deleteMany,
      findUnique: mocks.findUnique,
    },
  },
}));
vi.mock("@/lib/datacite/mint", () => ({
  doiMintingEnabled: mocks.doiMintingEnabled,
  mintSnapshotDoi: mocks.mintSnapshotDoi,
}));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import {
  createSnapshot,
  deleteSnapshot,
  getOwnerSnapshot,
  getPublicSnapshot,
  isValidSnapshotToken,
  listSnapshots,
  mintDoiForSnapshot,
  newSnapshotToken,
  SnapshotDoiLockedError,
  SnapshotLimitError,
  snapshotPublicPath,
  updateSnapshot,
} from "@/lib/cv/snapshotStore";
import { CvNotFoundError } from "@/lib/cv/sync";
import { MAX_SNAPSHOTS_PER_CV } from "@/lib/cv/snapshots";

const works = worksFixture as unknown as OpenAlexWork[];
function makeCv(): CanonicalCv {
  return buildCanonicalCv({
    id: "s",
    resolved: { orcid: "0000-0002-7483-2489", authorIds: ["A1"], displayName: "Basile Chrétien" },
    works,
    now: "2026-06-02T00:00:00.000Z",
  });
}

const CV = makeCv();
const CV_ROW = { id: "cv1", document: CV, published: true, publicSlug: "basile-x" };
const ROW = {
  id: "snap1",
  cvId: "cv1",
  version: 2,
  label: "Tenure",
  createdAt: new Date("2026-09-04T10:00:00Z"),
  token: "abcdefghijklmnopqrstuvwx",
  isPublic: true,
  doi: null as string | null,
  doiState: "none",
  canonical: CV,
};

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  mocks.cvFindUnique.mockResolvedValue(CV_ROW);
  mocks.doiMintingEnabled.mockReturnValue(false);
});

describe("tokens", () => {
  it("generates 24-char base64url tokens that pass the shape check", () => {
    const t = newSnapshotToken();
    expect(t).toMatch(/^[A-Za-z0-9_-]{24}$/);
    expect(isValidSnapshotToken(t)).toBe(true);
    expect(newSnapshotToken()).not.toBe(t);
  });
  it("rejects short, padded or path-like tokens", () => {
    expect(isValidSnapshotToken("short")).toBe(false);
    expect(isValidSnapshotToken("a".repeat(22))).toBe(true);
    expect(isValidSnapshotToken("a".repeat(65))).toBe(false);
    expect(isValidSnapshotToken("abcdefghijklmnopqrstuv/w")).toBe(false);
    expect(isValidSnapshotToken("abcdefghijklmnopqrstuv==")).toBe(false);
  });
  it("builds the public path", () => {
    expect(snapshotPublicPath("basile-x", "tok")).toBe("p/basile-x/v/tok");
  });
});

describe("listSnapshots", () => {
  it("returns summaries newest-first with publish state and the mint flag", async () => {
    mocks.findMany.mockResolvedValue([ROW, { ...ROW, id: "snap0", version: 1, doiState: "weird" }]);
    mocks.doiMintingEnabled.mockReturnValue(true);
    const out = await listSnapshots("u1");
    expect(out.published).toBe(true);
    expect(out.publicSlug).toBe("basile-x");
    expect(out.doiMintingEnabled).toBe(true);
    expect(out.max).toBe(MAX_SNAPSHOTS_PER_CV);
    expect(out.snapshots[0]).toEqual({
      id: "snap1",
      version: 2,
      label: "Tenure",
      createdAt: "2026-09-04T10:00:00.000Z",
      token: ROW.token,
      isPublic: true,
      doi: null,
      doiState: "none",
    });
    // An unknown stored state degrades to "none".
    expect(out.snapshots[1]!.doiState).toBe("none");
    expect(mocks.findMany.mock.calls[0]![0]).toMatchObject({
      where: { cvId: "cv1" },
      orderBy: { version: "desc" },
    });
    // The frozen document is never part of the listing.
    expect(mocks.findMany.mock.calls[0]![0].select).not.toHaveProperty("canonical");
  });

  it("throws CvNotFoundError when the user has no CV yet", async () => {
    mocks.cvFindUnique.mockResolvedValue(null);
    await expect(listSnapshots("u1")).rejects.toBeInstanceOf(CvNotFoundError);
  });
});

describe("createSnapshot", () => {
  it("freezes the current document as max+1 with a fresh token", async () => {
    mocks.count.mockResolvedValue(3);
    mocks.aggregate.mockResolvedValue({ _max: { version: 7 } });
    mocks.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...ROW,
      version: data.version,
      label: data.label,
      token: data.token,
      isPublic: false,
    }));
    const withNotes = setNotes(CV, "private");
    mocks.cvFindUnique.mockResolvedValue({ ...CV_ROW, document: withNotes });
    const out = await createSnapshot("u1", "  Grant application  ");
    expect(out.version).toBe(8);
    expect(out.label).toBe("Grant application");
    expect(out.isPublic).toBe(false);
    expect(isValidSnapshotToken(out.token)).toBe(true);
    const data = mocks.create.mock.calls[0]![0].data as { canonical: CanonicalCv; cvId: string };
    expect(data.cvId).toBe("cv1");
    expect(data.canonical.notes).toBeUndefined();
    expect(data.canonical.sections.length).toBe(withNotes.sections.length);
  });

  it("starts at version 1 for a CV with no snapshots", async () => {
    mocks.count.mockResolvedValue(0);
    mocks.aggregate.mockResolvedValue({ _max: { version: null } });
    mocks.create.mockImplementation(async ({ data }: { data: { version: number } }) => ({
      ...ROW,
      version: data.version,
    }));
    expect((await createSnapshot("u1", "First")).version).toBe(1);
  });

  it("refuses at the per-CV cap without touching the DB further", async () => {
    mocks.count.mockResolvedValue(MAX_SNAPSHOTS_PER_CV);
    await expect(createSnapshot("u1", "x")).rejects.toBeInstanceOf(SnapshotLimitError);
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("refuses when the stored document no longer validates", async () => {
    mocks.cvFindUnique.mockResolvedValue({ ...CV_ROW, document: { nope: true } });
    await expect(createSnapshot("u1", "x")).rejects.toBeInstanceOf(CvNotFoundError);
  });
});

describe("updateSnapshot", () => {
  it("patches label and/or visibility, scoped to the owner's cv", async () => {
    mocks.findFirst.mockResolvedValue(ROW);
    mocks.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...ROW,
      ...data,
    }));
    const out = await updateSnapshot("u1", "snap1", { isPublic: false, label: " New " });
    expect(out).toMatchObject({ isPublic: false, label: "New" });
    expect(mocks.findFirst.mock.calls[0]![0]).toMatchObject({
      where: { id: "snap1", cvId: "cv1" },
    });
    expect(mocks.update.mock.calls[0]![0]).toMatchObject({
      where: { id: "snap1" },
      data: { isPublic: false, label: "New" },
    });
    // A label-only patch leaves isPublic alone.
    await updateSnapshot("u1", "snap1", { label: "Only" });
    expect(mocks.update.mock.calls[1]![0].data).toEqual({ label: "Only" });
  });

  it("returns null for a snapshot that isn't the owner's", async () => {
    mocks.findFirst.mockResolvedValue(null);
    expect(await updateSnapshot("u1", "other", { isPublic: true })).toBeNull();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("refuses to make a minted snapshot private (its DOI must resolve)", async () => {
    mocks.findFirst.mockResolvedValue({ ...ROW, doiState: "minted", doi: "10.1/x" });
    await expect(updateSnapshot("u1", "snap1", { isPublic: false })).rejects.toBeInstanceOf(
      SnapshotDoiLockedError,
    );
    // Relabelling a minted snapshot is still fine.
    mocks.update.mockResolvedValue({ ...ROW, doiState: "minted", doi: "10.1/x", label: "L" });
    expect((await updateSnapshot("u1", "snap1", { label: "L" }))?.doiState).toBe("minted");
  });
});

describe("deleteSnapshot", () => {
  it("deletes by (id, cvId) and reports whether a row went", async () => {
    mocks.deleteMany.mockResolvedValue({ count: 1 });
    expect(await deleteSnapshot("u1", "snap1")).toBe(true);
    expect(mocks.deleteMany.mock.calls[0]![0]).toEqual({ where: { id: "snap1", cvId: "cv1" } });
    mocks.deleteMany.mockResolvedValue({ count: 0 });
    expect(await deleteSnapshot("u1", "nope")).toBe(false);
  });
});

describe("getOwnerSnapshot", () => {
  it("returns the frozen + live documents at owner level", async () => {
    mocks.findFirst.mockResolvedValue(ROW);
    const out = await getOwnerSnapshot("u1", "snap1");
    expect(out?.snapshot.version).toBe(2);
    expect(out?.frozen.owner.displayName).toBe("Basile Chrétien");
    expect(out?.live).toEqual(CV);
    expect(out?.publicSlug).toBe("basile-x");
  });
  it("is null when the snapshot is missing or a stored document is corrupt", async () => {
    mocks.findFirst.mockResolvedValue(null);
    expect(await getOwnerSnapshot("u1", "x")).toBeNull();
    mocks.findFirst.mockResolvedValue({ ...ROW, canonical: { broken: 1 } });
    expect(await getOwnerSnapshot("u1", "snap1")).toBeNull();
    mocks.findFirst.mockResolvedValue(ROW);
    mocks.cvFindUnique.mockResolvedValue({ ...CV_ROW, document: { broken: 1 } });
    expect(await getOwnerSnapshot("u1", "snap1")).toBeNull();
  });
});

describe("getPublicSnapshot", () => {
  const withCv = (over: Partial<typeof CV_ROW> = {}, row: Partial<typeof ROW> = {}) => ({
    ...ROW,
    ...row,
    cv: { published: true, publicSlug: "basile-x", document: CV, ...over },
  });

  it("returns both sides public-projected when public + published under the slug", async () => {
    const first = CV.sections.find((s) => s.id === "publications")!.items[0]!.id;
    const frozen = setNotes(setItemIncluded(CV, "publications", first, false), "secret");
    const live = updateOwner(updateDisplay(CV, { showMetrics: true }), { metrics: { h_index: 3 } });
    mocks.findUnique.mockResolvedValue(
      withCv({ document: live }, { canonical: frozen, doi: "10.1/x" }),
    );
    const out = await getPublicSnapshot("basile-x", ROW.token);
    expect(mocks.findUnique.mock.calls[0]![0]).toMatchObject({ where: { token: ROW.token } });
    expect(out).toMatchObject({
      version: 2,
      label: "Tenure",
      doi: "10.1/x",
      createdAt: "2026-09-04T10:00:00.000Z",
    });
    // Hidden item dropped + notes gone on the frozen side; metrics only where opted in.
    expect(
      out!.cv.sections.find((s) => s.id === "publications")!.items.map((i) => i.id),
    ).not.toContain(first);
    expect(out!.cv.notes).toBeUndefined();
    expect(out!.cv.owner.metrics).toBeUndefined();
    expect(out!.live.owner.metrics).toEqual({ h_index: 3 });
  });

  it("is null (404) unless public AND published under exactly this slug", async () => {
    mocks.findUnique.mockResolvedValue(null);
    expect(await getPublicSnapshot("basile-x", "t")).toBeNull();
    mocks.findUnique.mockResolvedValue(withCv({}, { isPublic: false }));
    expect(await getPublicSnapshot("basile-x", "t")).toBeNull();
    mocks.findUnique.mockResolvedValue(withCv({ published: false }));
    expect(await getPublicSnapshot("basile-x", "t")).toBeNull();
    mocks.findUnique.mockResolvedValue(withCv({ publicSlug: "someone-else" }));
    expect(await getPublicSnapshot("basile-x", "t")).toBeNull();
    mocks.findUnique.mockResolvedValue(
      withCv({}, { canonical: { broken: 1 } as unknown as CanonicalCv }),
    );
    expect(await getPublicSnapshot("basile-x", "t")).toBeNull();
    mocks.findUnique.mockResolvedValue(
      withCv({ document: { broken: 1 } as unknown as CanonicalCv }),
    );
    expect(await getPublicSnapshot("basile-x", "t")).toBeNull();
  });
});

describe("mintDoiForSnapshot", () => {
  it("is 'disabled' without credentials and never reads the DB", async () => {
    expect(await mintDoiForSnapshot("u1", "snap1")).toEqual({ state: "disabled" });
    expect(mocks.cvFindUnique).not.toHaveBeenCalled();
  });

  it("checks the preconditions in order", async () => {
    mocks.doiMintingEnabled.mockReturnValue(true);
    mocks.findFirst.mockResolvedValueOnce(null);
    expect(await mintDoiForSnapshot("u1", "x")).toEqual({ state: "not-found" });
    mocks.findFirst.mockResolvedValueOnce({ ...ROW, doiState: "minted", doi: "10.1/done" });
    expect(await mintDoiForSnapshot("u1", "snap1")).toEqual({
      state: "already-minted",
      doi: "10.1/done",
    });
    mocks.findFirst.mockResolvedValueOnce({ ...ROW, isPublic: false });
    expect(await mintDoiForSnapshot("u1", "snap1")).toEqual({ state: "not-public" });
    mocks.cvFindUnique.mockResolvedValueOnce({ ...CV_ROW, published: false });
    mocks.findFirst.mockResolvedValueOnce(ROW);
    expect(await mintDoiForSnapshot("u1", "snap1")).toEqual({ state: "not-published" });
    mocks.findFirst.mockResolvedValueOnce({ ...ROW, canonical: { broken: 1 } });
    expect(await mintDoiForSnapshot("u1", "snap1")).toEqual({ state: "not-found" });
    expect(mocks.mintSnapshotDoi).not.toHaveBeenCalled();
  });

  it("marks pending, mints with the previous minted DOI linked, then stores the DOI", async () => {
    mocks.doiMintingEnabled.mockReturnValue(true);
    mocks.findFirst.mockResolvedValueOnce(ROW).mockResolvedValueOnce({ doi: "10.1/prev" });
    mocks.update.mockResolvedValue({});
    mocks.mintSnapshotDoi.mockResolvedValue({ ok: true, doi: "10.1/new" });
    expect(await mintDoiForSnapshot("u1", "snap1")).toEqual({ state: "minted", doi: "10.1/new" });
    expect(mocks.mintSnapshotDoi.mock.calls[0]![0]).toEqual({
      ownerName: "Basile Chrétien",
      orcid: "0000-0002-7483-2489",
      version: 2,
      year: 2026,
      url: expect.stringMatching(/\/p\/basile-x\/v\/abcdefghijklmnopqrstuvwx$/),
      previousDoi: "10.1/prev",
    });
    expect(mocks.findFirst.mock.calls[1]![0]).toMatchObject({
      where: { cvId: "cv1", doiState: "minted", version: { lt: 2 } },
    });
    expect(mocks.update.mock.calls.map((c) => c[0].data)).toEqual([
      { doiState: "pending" },
      { doiState: "minted", doi: "10.1/new" },
    ]);
  });

  it("records a failed mint (retryable) and passes no previous DOI when none exists", async () => {
    mocks.doiMintingEnabled.mockReturnValue(true);
    mocks.findFirst.mockResolvedValueOnce(ROW).mockResolvedValueOnce(null);
    mocks.update.mockResolvedValue({});
    mocks.mintSnapshotDoi.mockResolvedValue({ ok: false, reason: "http-500" });
    expect(await mintDoiForSnapshot("u1", "snap1")).toEqual({
      state: "failed",
      reason: "http-500",
    });
    expect(mocks.mintSnapshotDoi.mock.calls[0]![0].previousDoi).toBeNull();
    expect(mocks.update.mock.calls[1]![0].data).toEqual({ doiState: "failed" });
  });
});
