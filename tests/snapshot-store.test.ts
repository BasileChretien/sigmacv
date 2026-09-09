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
  tombstoneSnapshotDoi: vi.fn(),
  recordPendingDoiWithdrawal: vi.fn(),
  updateMany: vi.fn(),
  transaction: vi.fn(),
  purgeInstitutionPages: vi.fn(),
}));

vi.mock("@/lib/cv/publicPageCache", () => ({
  purgeInstitutionPages: mocks.purgeInstitutionPages,
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    $transaction: mocks.transaction,
    cv: { findUnique: mocks.cvFindUnique },
    cvSnapshot: {
      findMany: mocks.findMany,
      count: mocks.count,
      aggregate: mocks.aggregate,
      create: mocks.create,
      findFirst: mocks.findFirst,
      update: mocks.update,
      updateMany: mocks.updateMany,
      deleteMany: mocks.deleteMany,
      findUnique: mocks.findUnique,
    },
  },
}));
vi.mock("@/lib/datacite/mint", () => ({
  doiMintingEnabled: mocks.doiMintingEnabled,
  mintSnapshotDoi: mocks.mintSnapshotDoi,
  tombstoneSnapshotDoi: mocks.tombstoneSnapshotDoi,
}));
vi.mock("@/lib/cv/doiWithdrawals", () => ({
  recordPendingDoiWithdrawal: mocks.recordPendingDoiWithdrawal,
}));
vi.mock("@/lib/log", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));

import { logger } from "@/lib/log";
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
  SnapshotNotPublicError,
  snapshotPublicPath,
  updateSnapshot,
  withdrawMintedSnapshotDois,
} from "@/lib/cv/snapshotStore";
import { CvNotFoundError } from "@/lib/cv/sync";
import { freezeCanonical, MAX_SNAPSHOTS_PER_CV } from "@/lib/cv/snapshots";
import { storedReconciliationRows } from "@/lib/institutions/reconciliationRows";
import { Prisma } from "@/generated/prisma/client";
import { provenanceLedger, type ProvenanceLedger } from "@/lib/cv/provenanceLedger";
import { contentHashOf, stableJson } from "@/lib/cv/snapshotHash";
import { projectCvForPublic } from "@/lib/cv/publicProjection";

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
const CONSENTED = ["04chrp450", "02kpeqv85"];
const CV_ROW = {
  id: "cv1",
  document: CV,
  published: true,
  publicSlug: "basile-x",
  consentedRorIds: CONSENTED,
};
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
  ledger: null as unknown,
  contentHash: null as string | null,
  readerMode: false,
  forReconciliation: false,
};

beforeEach(() => {
  for (const m of Object.values(mocks)) m.mockReset();
  for (const fn of Object.values(logger)) vi.mocked(fn).mockReset();
  // The array form: every operation is already a promise from the mocks.
  mocks.transaction.mockImplementation(async (ops: Promise<unknown>[]) => Promise.all(ops));
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
      readerMode: false,
      contentHash: null,
      forReconciliation: false,
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

  it("stores the ledger computed BEFORE the frozen copy is stripped, the content hash, and the reader choice", async () => {
    mocks.count.mockResolvedValue(0);
    mocks.aggregate.mockResolvedValue({ _max: { version: null } });
    mocks.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...ROW,
      version: data.version,
      label: data.label,
      token: data.token,
      readerMode: data.readerMode,
      contentHash: data.contentHash,
    }));
    // A DOI-claimed work: `meta.claimed` is exactly what `freezeCanonical` strips, so a
    // ledger derived from the frozen copy would count it as identifier-matched.
    const claimed = JSON.parse(JSON.stringify(CV)) as CanonicalCv;
    const pubs = claimed.sections.find((s) => s.id === "publications")!;
    pubs.items[0]!.meta.claimed = true;
    mocks.cvFindUnique.mockResolvedValue({ ...CV_ROW, document: claimed });
    const out = await createSnapshot("u1", "Reader copy", { preset: "reader" });
    expect(out.readerMode).toBe(true);
    expect(out.contentHash).toMatch(/^[0-9a-f]{64}$/);
    const data = mocks.create.mock.calls[0]![0].data as {
      canonical: CanonicalCv;
      ledger: ProvenanceLedger;
      contentHash: string;
      readerMode: boolean;
    };
    expect(data.readerMode).toBe(true);
    expect(data.ledger.claimed.count).toBe(1);
    // The frozen copy has lost the signal — the stored ledger is the only truthful one.
    expect(
      data.canonical.sections.find((s) => s.id === "publications")!.items[0]!.meta.claimed,
    ).toBeUndefined();
    expect(provenanceLedger(data.canonical).claimed.count).toBe(0);
    expect(data.ledger.identifierMatched.count).toBe(
      provenanceLedger(data.canonical).identifierMatched.count - 1,
    );
    // The hash is of what the page SERVES (the public projection of the frozen
    // copy), never of the owner-level copy; stable across key order.
    expect(data.contentHash).toBe(contentHashOf(projectCvForPublic(data.canonical)));
    expect(data.contentHash).not.toBe(contentHashOf(data.canonical));
    expect(data.contentHash).toBe(
      contentHashOf(JSON.parse(stableJson(projectCvForPublic(data.canonical)))),
    );
    // A reader-view freeze materialises the preset: the frozen display IS the reader view.
    expect(data.canonical.display.hideRetracted).toBe(false);
    expect(data.canonical.display.showProvenance).toBe(true);
  });

  it("freezes in the shape of a CV model + preset on a COPY — the live document is untouched", async () => {
    mocks.count.mockResolvedValue(0);
    mocks.aggregate.mockResolvedValue({ _max: { version: null } });
    mocks.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...ROW,
      readerMode: data.readerMode,
    }));
    const before = JSON.stringify(CV);
    const out = await createSnapshot("u1", "Pharma", { modelId: "pharma-rd", preset: "hiring" });
    expect(out.readerMode).toBe(false);
    expect(JSON.stringify(CV)).toBe(before);
    const data = mocks.create.mock.calls[0]![0].data as {
      canonical: CanonicalCv;
      ledger: ProvenanceLedger;
    };
    const visible = data.canonical.sections.filter((s) => s.visible).map((s) => s.type);
    expect(visible).toContain("skills");
    expect(data.canonical.display.publicContact.email).toBe(true);
    expect(data.canonical.display.showProvenance).toBe(false);
    // The ledger follows the SHAPED document's visible sections.
    expect(data.ledger.kept).toBe(provenanceLedger(data.canonical).kept);
    // Nothing was written to the live row.
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("defaults to a standard (non-reader) freeze", async () => {
    mocks.count.mockResolvedValue(0);
    mocks.aggregate.mockResolvedValue({ _max: { version: null } });
    mocks.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...ROW,
      readerMode: data.readerMode,
    }));
    expect((await createSnapshot("u1", "Plain")).readerMode).toBe(false);
    const data = mocks.create.mock.calls[0]![0].data as {
      canonical: CanonicalCv;
      readerMode: boolean;
    };
    expect(data.readerMode).toBe(false);
    // A standard freeze keeps the owner's display exactly.
    expect(data.canonical.display.showProvenance).toBe(CV.display.showProvenance);
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

  describe("designation for the institution reconciliation export", () => {
    /** What the designation stores: the export's rows, computed from the
     *  version's frozen document (ROW.canonical) and its number / hash / date. */
    const STORED_ROWS = storedReconciliationRows(freezeCanonical(CV), {
      snapshotVersion: 2,
      contentHash: null,
      frozenAt: "2026-09-04T10:00:00.000Z",
    });

    it("designates a PUBLIC version, computes and stores its rows from the frozen document, clears every other of the CV (rows included) in ONE transaction, and purges the institution pages", async () => {
      mocks.findFirst.mockResolvedValue(ROW);
      mocks.updateMany.mockResolvedValue({ count: 1 });
      mocks.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        ...ROW,
        ...data,
      }));
      const out = await updateSnapshot("u1", "snap1", { forReconciliation: true });
      expect(out?.forReconciliation).toBe(true);
      expect(STORED_ROWS.rows.length).toBeGreaterThan(0);
      // The frozen document is read ONCE, here, for this version only.
      expect(mocks.findFirst).toHaveBeenCalledTimes(2);
      expect(mocks.findFirst.mock.calls[1]![0]).toEqual({
        where: { id: "snap1", cvId: "cv1" },
        select: { canonical: true },
      });
      expect(mocks.transaction).toHaveBeenCalledTimes(1);
      expect(mocks.updateMany.mock.calls[0]![0]).toEqual({
        where: { cvId: "cv1", forReconciliation: true, id: { not: "snap1" } },
        data: { forReconciliation: false, reconciliationRows: Prisma.DbNull },
      });
      expect(mocks.update.mock.calls[0]![0]).toEqual({
        where: { id: "snap1" },
        data: { forReconciliation: true, reconciliationRows: STORED_ROWS },
        select: expect.any(Object),
      });
      expect(mocks.purgeInstitutionPages).toHaveBeenCalledTimes(1);
      expect(mocks.purgeInstitutionPages).toHaveBeenCalledWith(CONSENTED);
      expect(logger.info).toHaveBeenCalledWith("snapshot.reconciliation_designated", {
        version: 2,
      });
    });

    it("refuses to designate a version whose frozen document no longer parses — nothing to compute rows from — and writes nothing", async () => {
      mocks.findFirst
        .mockResolvedValueOnce(ROW)
        .mockResolvedValueOnce({ canonical: { nope: true } });
      expect(await updateSnapshot("u1", "snap1", { forReconciliation: true })).toBeNull();
      expect(mocks.update).not.toHaveBeenCalled();
      expect(mocks.transaction).not.toHaveBeenCalled();
      expect(mocks.purgeInstitutionPages).not.toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith("snapshot.stored_document_invalid", {
        issueCount: expect.any(Number),
      });
    });

    it("refuses to designate a private version, or one being made private in the same patch — and never writes", async () => {
      mocks.findFirst.mockResolvedValue({ ...ROW, isPublic: false });
      await expect(
        updateSnapshot("u1", "snap1", { forReconciliation: true }),
      ).rejects.toBeInstanceOf(SnapshotNotPublicError);
      mocks.findFirst.mockResolvedValue(ROW);
      await expect(
        updateSnapshot("u1", "snap1", { isPublic: false, forReconciliation: true }),
      ).rejects.toBeInstanceOf(SnapshotNotPublicError);
      expect(mocks.update).not.toHaveBeenCalled();
      expect(mocks.transaction).not.toHaveBeenCalled();
      expect(mocks.purgeInstitutionPages).not.toHaveBeenCalled();
      // A private version made public in the same patch CAN be designated.
      mocks.findFirst.mockResolvedValue({ ...ROW, isPublic: false });
      mocks.updateMany.mockResolvedValue({ count: 0 });
      mocks.update.mockResolvedValue({ ...ROW, isPublic: true, forReconciliation: true });
      const out = await updateSnapshot("u1", "snap1", { isPublic: true, forReconciliation: true });
      expect(out?.forReconciliation).toBe(true);
      expect(mocks.update.mock.calls[0]![0].data).toEqual({
        isPublic: true,
        forReconciliation: true,
        reconciliationRows: STORED_ROWS,
      });
    });

    it("undesignates without a transaction, clearing the stored rows and purging the pages; making a version private drops its designation in the same write", async () => {
      mocks.findFirst.mockResolvedValue({ ...ROW, forReconciliation: true });
      mocks.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
        ...ROW,
        ...data,
      }));
      const off = await updateSnapshot("u1", "snap1", { forReconciliation: false });
      expect(off?.forReconciliation).toBe(false);
      expect(mocks.update.mock.calls[0]![0].data).toEqual({
        forReconciliation: false,
        reconciliationRows: Prisma.DbNull,
      });
      expect(mocks.transaction).not.toHaveBeenCalled();
      // Only the summary row was read: no document fetch on the way out.
      expect(mocks.findFirst).toHaveBeenCalledTimes(1);
      expect(mocks.purgeInstitutionPages).toHaveBeenCalledTimes(1);
      expect(mocks.purgeInstitutionPages).toHaveBeenCalledWith(CONSENTED);
      mocks.update.mockClear();
      mocks.purgeInstitutionPages.mockClear();
      const hidden = await updateSnapshot("u1", "snap1", { isPublic: false });
      expect(hidden?.forReconciliation).toBe(false);
      expect(mocks.update.mock.calls[0]![0].data).toEqual({
        isPublic: false,
        forReconciliation: false,
        reconciliationRows: Prisma.DbNull,
      });
      expect(mocks.purgeInstitutionPages).toHaveBeenCalledWith(CONSENTED);
      // A label-only patch on a designated version leaves the designation,
      // the rows and the cache alone.
      mocks.update.mockClear();
      mocks.purgeInstitutionPages.mockClear();
      await updateSnapshot("u1", "snap1", { label: "Only" });
      expect(mocks.update.mock.calls[0]![0].data).toEqual({ label: "Only" });
      expect(mocks.purgeInstitutionPages).not.toHaveBeenCalled();
    });

    it("the listing and the summaries carry the flag", async () => {
      mocks.cvFindUnique.mockResolvedValue(CV_ROW);
      mocks.findMany.mockResolvedValue([{ ...ROW, forReconciliation: true }, ROW]);
      const listing = await listSnapshots("u1");
      expect(listing.snapshots.map((s) => s.forReconciliation)).toEqual([true, false]);
    });
  });
});

describe("deleteSnapshot", () => {
  it("deletes by (id, cvId) and reports whether a row went", async () => {
    mocks.findFirst.mockResolvedValue({ id: "snap1", doiState: "none" });
    mocks.deleteMany.mockResolvedValue({ count: 1 });
    expect(await deleteSnapshot("u1", "snap1")).toBe(true);
    expect(mocks.findFirst.mock.calls[0]![0]).toMatchObject({
      where: { id: "snap1", cvId: "cv1" },
    });
    expect(mocks.deleteMany.mock.calls[0]![0]).toEqual({ where: { id: "snap1", cvId: "cv1" } });
    mocks.deleteMany.mockResolvedValue({ count: 0 });
    expect(await deleteSnapshot("u1", "snap1")).toBe(false);
  });

  it("is false (404) for a snapshot that isn't the owner's, without deleting", async () => {
    mocks.findFirst.mockResolvedValue(null);
    expect(await deleteSnapshot("u1", "other")).toBe(false);
    expect(mocks.deleteMany).not.toHaveBeenCalled();
  });

  it("purges the institution pages when the DESIGNATED version goes (it leaves the export), and not otherwise", async () => {
    mocks.findFirst.mockResolvedValue({ id: "snap1", doiState: "none", forReconciliation: true });
    mocks.deleteMany.mockResolvedValue({ count: 1 });
    expect(await deleteSnapshot("u1", "snap1")).toBe(true);
    expect(mocks.findFirst.mock.calls[0]![0].select).toMatchObject({ forReconciliation: true });
    expect(mocks.purgeInstitutionPages).toHaveBeenCalledWith(CONSENTED);
    mocks.purgeInstitutionPages.mockClear();
    mocks.findFirst.mockResolvedValue({ id: "snap1", doiState: "none", forReconciliation: false });
    expect(await deleteSnapshot("u1", "snap1")).toBe(true);
    expect(mocks.purgeInstitutionPages).not.toHaveBeenCalled();
    // A row that was already gone purges nothing either.
    mocks.findFirst.mockResolvedValue({ id: "snap1", doiState: "none", forReconciliation: true });
    mocks.deleteMany.mockResolvedValue({ count: 0 });
    expect(await deleteSnapshot("u1", "snap1")).toBe(false);
    expect(mocks.purgeInstitutionPages).not.toHaveBeenCalled();
  });

  it("refuses to delete a minted snapshot: its DOI must keep resolving while the account exists", async () => {
    mocks.findFirst.mockResolvedValue({ id: "snap1", doiState: "minted" });
    await expect(deleteSnapshot("u1", "snap1")).rejects.toBeInstanceOf(SnapshotDoiLockedError);
    expect(mocks.deleteMany).not.toHaveBeenCalled();
    // A failed or pending mint holds no DOI, so those rows can still go.
    for (const doiState of ["failed", "pending"]) {
      mocks.findFirst.mockResolvedValue({ id: "snap1", doiState });
      mocks.deleteMany.mockResolvedValue({ count: 1 });
      expect(await deleteSnapshot("u1", "snap1")).toBe(true);
    }
  });
});

describe("doiState", () => {
  it("lists a withdrawn version as 'withdrawn' (the state written after a successful tombstone)", async () => {
    mocks.findMany.mockResolvedValue([{ ...ROW, doi: "10.1/w", doiState: "withdrawn" }]);
    const out = await listSnapshots("u1");
    expect(out.snapshots[0]!.doiState).toBe("withdrawn");
    mocks.findMany.mockResolvedValue([{ ...ROW, doiState: "garbage" }]);
    expect((await listSnapshots("u1")).snapshots[0]!.doiState).toBe("none");
  });
});

describe("withdrawMintedSnapshotDois (account deletion)", () => {
  it("is a no-op — not even a DB read — while minting is disabled", async () => {
    expect(await withdrawMintedSnapshotDois("u1")).toEqual({ attempted: 0, withdrawn: 0 });
    expect(mocks.findMany).not.toHaveBeenCalled();
    expect(mocks.tombstoneSnapshotDoi).not.toHaveBeenCalled();
  });

  const minted = (id: string, doi: string | null) => ({ id, doi, canonical: CV });

  it("tombstones every minted DOI of the user's CV (with the owner's name) and counts the outcomes", async () => {
    mocks.doiMintingEnabled.mockReturnValue(true);
    mocks.findMany.mockResolvedValue([
      minted("s1", "10.1/a"),
      minted("s2", "10.1/b"),
      minted("s3", null),
    ]);
    mocks.tombstoneSnapshotDoi
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false, reason: "http-500" });
    expect(await withdrawMintedSnapshotDois("u1")).toEqual({ attempted: 2, withdrawn: 1 });
    expect(mocks.findMany.mock.calls[0]![0]).toMatchObject({
      where: { cv: { userId: "u1" }, doiState: "minted" },
    });
    // The owner's name comes from the frozen document itself (creators must stay non-empty).
    expect(mocks.tombstoneSnapshotDoi.mock.calls.map((c) => c[0])).toEqual([
      { doi: "10.1/a", ownerName: "Basile Chrétien" },
      { doi: "10.1/b", ownerName: "Basile Chrétien" },
    ]);
  });

  it("marks a successfully tombstoned snapshot 'withdrawn' before the cascade removes it", async () => {
    mocks.doiMintingEnabled.mockReturnValue(true);
    mocks.findMany.mockResolvedValue([minted("s1", "10.1/a")]);
    mocks.tombstoneSnapshotDoi.mockResolvedValue({ ok: true });
    expect(await withdrawMintedSnapshotDois("u1")).toEqual({ attempted: 1, withdrawn: 1 });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "s1" },
      data: { doiState: "withdrawn" },
    });
    expect(mocks.recordPendingDoiWithdrawal).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    // A failed state write after a SUCCESSFUL hide is only a warning: the row is
    // about to be cascaded anyway, and the DOI is confirmed withdrawn.
    mocks.update.mockRejectedValueOnce(new Error("db"));
    expect(await withdrawMintedSnapshotDois("u1")).toEqual({ attempted: 1, withdrawn: 1 });
    expect(mocks.recordPendingDoiWithdrawal).not.toHaveBeenCalled();
  });

  it("QUEUES every DOI not confirmed withdrawn for the cron retry, and logs the shortfall at error level", async () => {
    // Without the queue a DataCite outage at deletion time would leave the DOI
    // findable forever: the cascade removes the only other copy of it.
    mocks.doiMintingEnabled.mockReturnValue(true);
    mocks.findMany.mockResolvedValue([
      minted("s1", "10.1/a"),
      minted("s2", "10.1/b"),
      minted("s3", "10.1/c"),
    ]);
    mocks.tombstoneSnapshotDoi
      .mockResolvedValueOnce({ ok: false, reason: "http-502" })
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({ ok: true });
    expect(await withdrawMintedSnapshotDois("u1")).toEqual({ attempted: 3, withdrawn: 1 });
    expect(mocks.recordPendingDoiWithdrawal.mock.calls).toEqual([
      ["10.1/a", "http-502"],
      ["10.1/b", "error"],
    ]);
    expect(mocks.update).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith("snapshot.dois_withdrawn", {
      attempted: 3,
      withdrawn: 1,
    });
    expect(logger.info).not.toHaveBeenCalledWith("snapshot.dois_withdrawn", expect.anything());
  });

  it("never throws: a DB failure is logged and deletion proceeds", async () => {
    mocks.doiMintingEnabled.mockReturnValue(true);
    mocks.findMany.mockRejectedValue(new Error("db down"));
    expect(await withdrawMintedSnapshotDois("u1")).toEqual({ attempted: 0, withdrawn: 0 });
    expect(mocks.tombstoneSnapshotDoi).not.toHaveBeenCalled();
    // (A queue write that fails is contained inside recordPendingDoiWithdrawal
    // itself — see doi-withdrawals.test.ts.)
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

describe("getPublicSnapshot — assessment-grade columns", () => {
  const withCv = (row: Partial<typeof ROW> = {}) => ({
    ...ROW,
    ...row,
    cv: { published: true, publicSlug: "basile-x", document: CV },
  });

  it("hands back the stored ledger, hash and reader choice", async () => {
    const ledger = provenanceLedger(CV);
    mocks.findUnique.mockResolvedValue(
      withCv({ ledger, contentHash: "ab".repeat(32), readerMode: true }),
    );
    const out = await getPublicSnapshot("basile-x", ROW.token);
    expect(out!.ledger).toEqual(ledger);
    expect(out!.contentHash).toBe("ab".repeat(32));
    expect(out!.readerMode).toBe(true);
  });

  it("ignores a stored ledger that does not have the FULL ledger shape", async () => {
    mocks.findUnique.mockResolvedValue(withCv({ ledger: { kept: "many" } }));
    expect((await getPublicSnapshot("basile-x", ROW.token))!.ledger).toBeNull();
    mocks.findUnique.mockResolvedValue(withCv({ ledger: "nope" }));
    expect((await getPublicSnapshot("basile-x", ROW.token))!.ledger).toBeNull();
    // A ledger frozen before a line existed (one key missing) degrades to "derived".
    const { retractedVisible: _dropped, ...partial } = provenanceLedger(CV);
    void _dropped;
    mocks.findUnique.mockResolvedValue(withCv({ ledger: partial }));
    expect((await getPublicSnapshot("basile-x", ROW.token))!.ledger).toBeNull();
    // A line with a non-numeric count is rejected too.
    const bad = { ...provenanceLedger(CV), claimed: { count: "1", denominator: 2 } };
    mocks.findUnique.mockResolvedValue(withCv({ ledger: bad }));
    expect((await getPublicSnapshot("basile-x", ROW.token))!.ledger).toBeNull();
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
    // Legacy row (frozen before the assessment-grade columns): no ledger, no hash, standard view.
    expect(out!.ledger).toBeNull();
    expect(out!.contentHash).toBeNull();
    expect(out!.readerMode).toBe(false);
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
      cv: expect.objectContaining({
        owner: expect.objectContaining({ displayName: "Basile Chrétien" }),
      }),
    });
    // The payload builder only ever sees the PUBLIC projection of the frozen document.
    const sent = mocks.mintSnapshotDoi.mock.calls[0]![0].cv as CanonicalCv;
    expect(sent.notes).toBeUndefined();
    expect(sent.sections.every((s) => s.items.every((i) => i.included))).toBe(true);
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
