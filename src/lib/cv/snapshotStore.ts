import { randomBytes } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { safeParseCanonicalCv, type CanonicalCv } from "@/lib/canonical/schema";
import { CvNotFoundError } from "@/lib/cv/sync";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import { freezeCanonical, MAX_SNAPSHOTS_PER_CV } from "@/lib/cv/snapshots";
import { doiMintingEnabled, mintSnapshotDoi } from "@/lib/datacite/mint";
import { logger } from "@/lib/log";
import { absoluteUrl } from "@/lib/siteUrl";

/**
 * Persistence for frozen CV snapshots (`CvSnapshot` rows). Every owner-side
 * operation is scoped to the SERVER-derived userId → its single `Cv` row →
 * snapshots of that `cvId`; no route ever trusts a client-supplied cv id. The
 * public read (`getPublicSnapshot`) is keyed by the unguessable token AND
 * gated on the snapshot's `isPublic` AND the parent page being published under
 * that slug — a snapshot can never outlive its owner's publish decision.
 */

/** Thrown when a CV already holds {@link MAX_SNAPSHOTS_PER_CV} snapshots. */
export class SnapshotLimitError extends Error {
  constructor() {
    super(`A CV can hold at most ${MAX_SNAPSHOTS_PER_CV} frozen versions.`);
    this.name = "SnapshotLimitError";
  }
}

/** Thrown when a minted (DOI-bearing) snapshot would be made private: its DOI
 *  must keep resolving to a landing page. */
export class SnapshotDoiLockedError extends Error {
  constructor() {
    super("A version with a DOI must stay public.");
    this.name = "SnapshotDoiLockedError";
  }
}

export type DoiState = "none" | "pending" | "minted" | "failed";

/** What the editor lists — never the frozen document itself (fetched on demand). */
export interface SnapshotSummary {
  id: string;
  version: number;
  label: string;
  /** ISO timestamp. */
  createdAt: string;
  token: string;
  isPublic: boolean;
  doi: string | null;
  doiState: DoiState;
}

/** URL-safe capability token: 18 random bytes → 24 base64url chars (144 bits). */
export function newSnapshotToken(): string {
  return randomBytes(18).toString("base64url");
}

/** Shape a public snapshot token must have (`newSnapshotToken` output, with
 *  headroom). Checked by the public routes BEFORE any DB lookup. */
const TOKEN_RE = /^[A-Za-z0-9_-]{22,64}$/;
export function isValidSnapshotToken(token: string): boolean {
  return TOKEN_RE.test(token);
}

type SnapshotRow = {
  id: string;
  version: number;
  label: string;
  createdAt: Date;
  token: string;
  isPublic: boolean;
  doi: string | null;
  doiState: string;
};

const SUMMARY_SELECT = {
  id: true,
  version: true,
  label: true,
  createdAt: true,
  token: true,
  isPublic: true,
  doi: true,
  doiState: true,
} as const;

function asDoiState(s: string): DoiState {
  return s === "pending" || s === "minted" || s === "failed" ? s : "none";
}

function toSummary(row: SnapshotRow): SnapshotSummary {
  return {
    id: row.id,
    version: row.version,
    label: row.label,
    createdAt: row.createdAt.toISOString(),
    token: row.token,
    isPublic: row.isPublic,
    doi: row.doi,
    doiState: asDoiState(row.doiState),
  };
}

/** The owner's CV row (id + publish state + document); throws when absent. */
async function ownerCv(userId: string) {
  const row = await prisma.cv.findUnique({
    where: { userId },
    select: { id: true, document: true, published: true, publicSlug: true },
  });
  if (!row) throw new CvNotFoundError();
  return row;
}

/** The public URL of a snapshot page (needs the parent's slug). */
export function snapshotPublicPath(slug: string, token: string): string {
  return `p/${slug}/v/${token}`;
}

export interface SnapshotListing {
  snapshots: SnapshotSummary[];
  published: boolean;
  publicSlug: string | null;
  /** Whether this server can mint DOIs (all DATACITE_* set). */
  doiMintingEnabled: boolean;
  max: number;
}

/** All of the owner's snapshots, newest version first. */
export async function listSnapshots(userId: string): Promise<SnapshotListing> {
  const cv = await ownerCv(userId);
  const rows = await prisma.cvSnapshot.findMany({
    where: { cvId: cv.id },
    orderBy: { version: "desc" },
    select: SUMMARY_SELECT,
  });
  return {
    snapshots: rows.map(toSummary),
    published: cv.published,
    publicSlug: cv.publicSlug,
    doiMintingEnabled: doiMintingEnabled(),
    max: MAX_SNAPSHOTS_PER_CV,
  };
}

/**
 * Freeze the owner's CURRENT stored document as the next version. Refused at
 * the per-CV cap ({@link SnapshotLimitError}); the version number is
 * max+1 and the `(cvId, version)` unique index is the guard against a
 * concurrent double-create (the second insert fails, nothing is overwritten).
 */
export async function createSnapshot(userId: string, label: string): Promise<SnapshotSummary> {
  const cv = await ownerCv(userId);
  const parsed = safeParseCanonicalCv(cv.document);
  if (!parsed.success) throw new CvNotFoundError();
  const count = await prisma.cvSnapshot.count({ where: { cvId: cv.id } });
  if (count >= MAX_SNAPSHOTS_PER_CV) throw new SnapshotLimitError();
  const agg = await prisma.cvSnapshot.aggregate({
    where: { cvId: cv.id },
    _max: { version: true },
  });
  const version = (agg._max.version ?? 0) + 1;
  const row = await prisma.cvSnapshot.create({
    data: {
      cvId: cv.id,
      version,
      label: label.trim(),
      canonical: freezeCanonical(parsed.data) as unknown as Prisma.InputJsonValue,
      token: newSnapshotToken(),
    },
    select: SUMMARY_SELECT,
  });
  logger.info("snapshot.created", { version });
  return toSummary(row);
}

/** Relabel and/or toggle visibility. Returns null when the id isn't the
 *  owner's. A minted snapshot cannot be made private ({@link SnapshotDoiLockedError}). */
export async function updateSnapshot(
  userId: string,
  id: string,
  patch: { isPublic?: boolean; label?: string },
): Promise<SnapshotSummary | null> {
  const cv = await ownerCv(userId);
  const existing = await prisma.cvSnapshot.findFirst({
    where: { id, cvId: cv.id },
    select: SUMMARY_SELECT,
  });
  if (!existing) return null;
  if (patch.isPublic === false && existing.doiState === "minted") {
    throw new SnapshotDoiLockedError();
  }
  const data: { isPublic?: boolean; label?: string } = {};
  if (patch.isPublic !== undefined) data.isPublic = patch.isPublic;
  if (patch.label !== undefined) data.label = patch.label.trim();
  const row = await prisma.cvSnapshot.update({
    where: { id: existing.id },
    data,
    select: SUMMARY_SELECT,
  });
  return toSummary(row);
}

/** Delete one snapshot; false when it isn't the owner's. */
export async function deleteSnapshot(userId: string, id: string): Promise<boolean> {
  const cv = await ownerCv(userId);
  const res = await prisma.cvSnapshot.deleteMany({ where: { id, cvId: cv.id } });
  return res.count > 0;
}

/** Parse a stored frozen document; null when it no longer validates. */
function parseFrozen(canonical: unknown): CanonicalCv | null {
  const parsed = safeParseCanonicalCv(canonical);
  if (!parsed.success) {
    logger.error("snapshot.stored_document_invalid", { issueCount: parsed.error.issues.length });
    return null;
  }
  return parsed.data;
}

export interface OwnerSnapshotView {
  snapshot: SnapshotSummary;
  /** The frozen document (owner level — hidden items retained). */
  frozen: CanonicalCv;
  /** The owner's CURRENT stored document (owner level). */
  live: CanonicalCv;
  publicSlug: string | null;
}

/** A snapshot + the live document, for the OWNER's "compare with live". */
export async function getOwnerSnapshot(
  userId: string,
  id: string,
): Promise<OwnerSnapshotView | null> {
  const cv = await ownerCv(userId);
  const row = await prisma.cvSnapshot.findFirst({ where: { id, cvId: cv.id } });
  if (!row) return null;
  const frozen = parseFrozen(row.canonical);
  const live = parseFrozen(cv.document);
  if (!frozen || !live) return null;
  return { snapshot: toSummary(row), frozen, live, publicSlug: cv.publicSlug };
}

export interface PublicSnapshotView {
  /** The frozen document, PUBLIC-projected (hidden items dropped, contact and
   *  metrics gated by the FROZEN display flags). */
  cv: CanonicalCv;
  /** The live document, public-projected (for the public diff). */
  live: CanonicalCv;
  version: number;
  label: string;
  createdAt: string;
  doi: string | null;
}

/**
 * Resolve a public snapshot by (slug, token). Null — a 404 — unless the parent
 * CV is published under exactly this slug AND the snapshot is public. Both the
 * frozen and the live document come back public-projected.
 */
export async function getPublicSnapshot(
  slug: string,
  token: string,
): Promise<PublicSnapshotView | null> {
  const row = await prisma.cvSnapshot.findUnique({
    where: { token },
    include: { cv: { select: { published: true, publicSlug: true, document: true } } },
  });
  if (!row || !row.isPublic) return null;
  if (!row.cv.published || row.cv.publicSlug !== slug) return null;
  const frozen = parseFrozen(row.canonical);
  const live = parseFrozen(row.cv.document);
  if (!frozen || !live) return null;
  return {
    cv: projectCvForPublic(frozen),
    live: projectCvForPublic(live),
    version: row.version,
    label: row.label,
    createdAt: row.createdAt.toISOString(),
    doi: row.doi,
  };
}

export type MintOutcome =
  | { state: "disabled" }
  | { state: "not-found" }
  | { state: "not-public" }
  | { state: "not-published" }
  | { state: "already-minted"; doi: string }
  | { state: "minted"; doi: string }
  | { state: "failed"; reason: string };

/**
 * Mint a DOI for one of the owner's snapshots. Preconditions, in order: the
 * server has DataCite credentials; the snapshot exists and is the owner's;
 * it is public and the parent page is published (the DOI must resolve). The
 * row is marked `pending` during the call, then `minted` (with the DOI) or
 * `failed` (retryable). The previous minted version, if any, is linked as
 * `IsNewVersionOf`.
 */
export async function mintDoiForSnapshot(userId: string, id: string): Promise<MintOutcome> {
  if (!doiMintingEnabled()) return { state: "disabled" };
  const cv = await ownerCv(userId);
  const row = await prisma.cvSnapshot.findFirst({ where: { id, cvId: cv.id } });
  if (!row) return { state: "not-found" };
  if (row.doiState === "minted" && row.doi) return { state: "already-minted", doi: row.doi };
  if (!row.isPublic) return { state: "not-public" };
  if (!cv.published || !cv.publicSlug) return { state: "not-published" };
  const frozen = parseFrozen(row.canonical);
  if (!frozen) return { state: "not-found" };

  const previous = await prisma.cvSnapshot.findFirst({
    where: { cvId: cv.id, doiState: "minted", version: { lt: row.version } },
    orderBy: { version: "desc" },
    select: { doi: true },
  });

  await prisma.cvSnapshot.update({ where: { id: row.id }, data: { doiState: "pending" } });
  const result = await mintSnapshotDoi({
    ownerName: frozen.owner.displayName,
    orcid: frozen.owner.orcid || undefined,
    version: row.version,
    year: row.createdAt.getUTCFullYear(),
    url: absoluteUrl(snapshotPublicPath(cv.publicSlug, row.token)),
    previousDoi: previous?.doi ?? null,
  });
  if (result.ok) {
    await prisma.cvSnapshot.update({
      where: { id: row.id },
      data: { doiState: "minted", doi: result.doi },
    });
    return { state: "minted", doi: result.doi };
  }
  await prisma.cvSnapshot.update({ where: { id: row.id }, data: { doiState: "failed" } });
  return { state: "failed", reason: result.reason };
}
