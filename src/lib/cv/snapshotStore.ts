import { randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { safeParseCanonicalCv, type CanonicalCv } from "@/lib/canonical/schema";
import { CvNotFoundError } from "@/lib/cv/sync";
import { recordPendingDoiWithdrawal } from "@/lib/cv/doiWithdrawals";
import { purgeInstitutionPages } from "@/lib/cv/publicPageCache";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import {
  isProvenanceLedger,
  provenanceLedger,
  type ProvenanceLedger,
} from "@/lib/cv/provenanceLedger";
import { shapeForFreeze, type FreezeShape } from "@/lib/cv/snapshotShape";
import { contentHashOf } from "@/lib/cv/snapshotHash";
import { freezeCanonical, MAX_SNAPSHOTS_PER_CV } from "@/lib/cv/snapshots";
import { storedReconciliationRows } from "@/lib/institutions/reconciliationRows";
import {
  doiMintingEnabled,
  mintSnapshotDoi,
  tombstoneSnapshotDoi,
  type TombstoneResult,
} from "@/lib/datacite/mint";
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

/** Thrown when a minted (DOI-bearing) snapshot would be made private OR
 *  deleted: while the account exists its DOI must keep resolving to a landing
 *  page. (Account deletion is the one way out — see
 *  {@link withdrawMintedSnapshotDois}.) */
export class SnapshotDoiLockedError extends Error {
  constructor() {
    super("A version with a DOI must stay public.");
    this.name = "SnapshotDoiLockedError";
  }
}

/** Thrown when a version that is NOT public would be designated as the source
 *  of the institution reconciliation export: the export reads a public frozen
 *  version only (a private one is the owner's alone). The API maps it to 409. */
export class SnapshotNotPublicError extends Error {
  constructor() {
    super("Only a public version can be used for the reconciliation export.");
    this.name = "SnapshotNotPublicError";
  }
}

/** `withdrawn` is written by {@link withdrawMintedSnapshotDois} moments before
 *  the row is cascaded away — it exists so a partially failed deletion leaves
 *  an honest state behind, never as something the editor lists. */
export type DoiState = "none" | "pending" | "minted" | "failed" | "withdrawn";

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
  /** Frozen as the assessor's reader view (chosen at freeze time; immutable). */
  readerMode: boolean;
  /** SHA-256 (hex) of the canonical JSON of the frozen document's PUBLIC
   *  projection; null on versions frozen before the hash existed. */
  contentHash: string | null;
  /** Designated as the source of the institution reconciliation export (at
   *  most one per CV; public versions only). */
  forReconciliation: boolean;
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
  readerMode: boolean;
  contentHash: string | null;
  forReconciliation: boolean;
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
  readerMode: true,
  contentHash: true,
  forReconciliation: true,
} as const;

function asDoiState(s: string): DoiState {
  return s === "pending" || s === "minted" || s === "failed" || s === "withdrawn" ? s : "none";
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
    readerMode: row.readerMode,
    contentHash: row.contentHash,
    forReconciliation: row.forReconciliation,
  };
}

/** The owner's CV row (id + publish state + document + the institution pages
 *  it is consented to, for the cache purge); throws when absent. */
async function ownerCv(userId: string) {
  const row = await prisma.cv.findUnique({
    where: { userId },
    select: {
      id: true,
      document: true,
      published: true,
      publicSlug: true,
      consentedRorIds: true,
    },
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
 * What to freeze: optionally a CV model (section layout) and a display preset —
 * `"reader"` (the assessor's reader view: evidence marks on, retracted works
 * visible; the page renders with `readerMode`) or `"hiring"` (contact on,
 * academic evidence and metrics off). Applied to a COPY (`shapeForFreeze`);
 * the live document is never changed. Explicit owner choices at freeze time,
 * stored with the version and never changed afterwards — a frozen artefact must
 * stay the bytes an assessor saw.
 */
export type CreateSnapshotOptions = FreezeShape;

/**
 * Freeze the owner's CURRENT stored document as the next version. Refused at
 * the per-CV cap ({@link SnapshotLimitError}); the version number is
 * max+1 and the `(cvId, version)` unique index is the guard against a
 * concurrent double-create (the second insert fails, nothing is overwritten).
 *
 * Two things are computed HERE, on the owner's stored document, because they
 * cannot be recovered later: the provenance ledger (`freezeCanonical` strips
 * the attribution / review signals it counts — a ledger derived from the frozen
 * copy would misreport, e.g. a DOI-claimed work as identifier-matched) and the
 * content hash of the frozen document.
 */
export async function createSnapshot(
  userId: string,
  label: string,
  options: CreateSnapshotOptions = {},
): Promise<SnapshotSummary> {
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
  const readerMode = options.preset === "reader";
  // Shape first — the model and the preset, on a COPY (`shapeForFreeze`
  // materialises the preset into the frozen display, so the ledger — whose
  // "retracted works shown" line depends on `hideRetracted` — the frozen
  // document and the page all describe the same view). Then the ledger on the
  // SHAPED document: its populations follow the sections the page will show.
  const doc = shapeForFreeze(parsed.data, options);
  const ledger = provenanceLedger(doc);
  const frozen = freezeCanonical(doc);
  const row = await prisma.cvSnapshot.create({
    data: {
      cvId: cv.id,
      version,
      label: label.trim(),
      canonical: frozen as unknown as Prisma.InputJsonValue,
      ledger: ledger as unknown as Prisma.InputJsonValue,
      // Hash of what the frozen page SERVES (the public projection), never of
      // the owner-level copy — a hash over withheld fields would both be
      // unverifiable by a reader and reveal owner-only edits between versions.
      contentHash: contentHashOf(projectCvForPublic(frozen)),
      readerMode,
      token: newSnapshotToken(),
    },
    select: SUMMARY_SELECT,
  });
  logger.info("snapshot.created", { version, readerMode, preset: options.preset ?? "standard" });
  return toSummary(row);
}

/** The reconciliation export's rows for a version being designated, computed
 *  from ITS frozen document (read here, once — the public request never reads
 *  it); null when that document no longer parses, in which case the version
 *  cannot be designated. */
async function reconciliationRowsColumn(
  snapshot: { id: string; version: number; contentHash: string | null; createdAt: Date },
  cvId: string,
): Promise<Prisma.InputJsonValue | null> {
  const row = await prisma.cvSnapshot.findFirst({
    where: { id: snapshot.id, cvId },
    select: { canonical: true },
  });
  /* v8 ignore next -- the caller just read the same row */
  if (!row) return null;
  const frozen = parseFrozen(row.canonical);
  if (!frozen) return null;
  // `freezeCanonical` once more (idempotent — the copy is already stripped),
  // so "the rows come from a stripped document" is a fact of this writer.
  const stored = storedReconciliationRows(freezeCanonical(frozen), {
    snapshotVersion: snapshot.version,
    contentHash: snapshot.contentHash,
    frozenAt: snapshot.createdAt.toISOString(),
  });
  return stored as unknown as Prisma.InputJsonValue;
}

type SnapshotPatchData = {
  isPublic?: boolean;
  label?: string;
  forReconciliation?: boolean;
  reconciliationRows?: Prisma.InputJsonValue | typeof Prisma.DbNull;
};

/**
 * Relabel, toggle visibility and/or (un)designate the version as the source
 * of the institution reconciliation export. Returns null when the id isn't
 * the owner's (or, on designation, when its frozen document no longer
 * parses — nothing to compute rows from). A minted snapshot cannot be made
 * private ({@link SnapshotDoiLockedError}); only a public version can be
 * designated ({@link SnapshotNotPublicError}), and making a version private
 * drops its designation in the same write. At most ONE version per CV is
 * designated: designating this one clears every other in one transaction, so
 * the export never reads two versions of one CV, and never none between two
 * writes (the partial unique index on `(cvId) WHERE forReconciliation` makes
 * the database refuse a concurrent second one).
 *
 * The export's rows are computed HERE, at designation, from the frozen
 * document and stored beside the flag (`reconciliationRows`), so that no
 * public request ever parses a frozen document; undesignating clears them.
 * Either change purges the institution pages this CV is consented to, so the
 * page's "N researchers share their rows" line moves at once, not within the
 * cache TTL.
 */
export async function updateSnapshot(
  userId: string,
  id: string,
  patch: { isPublic?: boolean; label?: string; forReconciliation?: boolean },
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
  const willBePublic = patch.isPublic ?? existing.isPublic;
  if (patch.forReconciliation === true && !willBePublic) throw new SnapshotNotPublicError();
  const data: SnapshotPatchData = {};
  if (patch.isPublic !== undefined) data.isPublic = patch.isPublic;
  if (patch.label !== undefined) data.label = patch.label.trim();
  if (patch.isPublic === false) data.forReconciliation = false;
  if (patch.forReconciliation !== undefined) data.forReconciliation = patch.forReconciliation;
  if (data.forReconciliation === true) {
    const rows = await reconciliationRowsColumn(existing, cv.id);
    if (rows === null) return null;
    data.reconciliationRows = rows;
  } else if (data.forReconciliation === false) {
    data.reconciliationRows = Prisma.DbNull;
  }
  const update = prisma.cvSnapshot.update({
    where: { id: existing.id },
    data,
    select: SUMMARY_SELECT,
  });
  if (data.forReconciliation !== true) {
    const summary = toSummary(await update);
    if (data.forReconciliation === false) purgeInstitutionPages(cv.consentedRorIds);
    return summary;
  }
  const [, row] = await prisma.$transaction([
    prisma.cvSnapshot.updateMany({
      where: { cvId: cv.id, forReconciliation: true, id: { not: existing.id } },
      data: { forReconciliation: false, reconciliationRows: Prisma.DbNull },
    }),
    update,
  ]);
  purgeInstitutionPages(cv.consentedRorIds);
  logger.info("snapshot.reconciliation_designated", { version: existing.version });
  return toSummary(row);
}

/** Delete one snapshot; false when it isn't the owner's. A MINTED snapshot is
 *  refused ({@link SnapshotDoiLockedError}) — its DOI must keep resolving; a
 *  `pending` / `failed` row holds no DOI and can go. Deleting the designated
 *  version drops it from the reconciliation export, so the institution pages
 *  are purged like an undesignation. */
export async function deleteSnapshot(userId: string, id: string): Promise<boolean> {
  const cv = await ownerCv(userId);
  const existing = await prisma.cvSnapshot.findFirst({
    where: { id, cvId: cv.id },
    select: { id: true, doiState: true, forReconciliation: true },
  });
  if (!existing) return false;
  if (existing.doiState === "minted") throw new SnapshotDoiLockedError();
  const res = await prisma.cvSnapshot.deleteMany({ where: { id, cvId: cv.id } });
  if (res.count > 0 && existing.forReconciliation) purgeInstitutionPages(cv.consentedRorIds);
  return res.count > 0;
}

/** The owner's display name as the frozen document records it (undefined when
 *  the stored JSON is not even shaped like a CV — the tombstone then falls back
 *  to its placeholder rather than skipping the withdrawal). */
function frozenOwnerName(canonical: unknown): string | undefined {
  const name = (canonical as { owner?: { displayName?: unknown } } | null)?.owner?.displayName;
  return typeof name === "string" ? name : undefined;
}

/**
 * Withdraw ONE minted snapshot's DOI. True only when DataCite confirmed the
 * hide; every other outcome — a refused / failed PUT, or an unexpected throw —
 * parks the DOI in the retry queue (`DoiWithdrawal`), because the cascade that
 * follows removes the only other copy of it. Never throws.
 */
async function withdrawOne(row: { id: string; doi: string; canonical: unknown }): Promise<boolean> {
  let outcome: TombstoneResult;
  try {
    outcome = await tombstoneSnapshotDoi({
      doi: row.doi,
      ownerName: frozenOwnerName(row.canonical),
    });
  } catch (err) {
    logger.warn("snapshot.doi_withdrawal_error", { err, doi: row.doi });
    outcome = { ok: false, reason: "error" };
  }
  if (!outcome.ok) {
    // Fail-soft itself (a queue write that fails is logged at error level).
    await recordPendingDoiWithdrawal(row.doi, outcome.reason);
    return false;
  }
  // Confirmed withdrawn: record it on the row (it is about to be cascaded, but
  // a deletion that fails halfway must leave an honest state behind). A failed
  // state write does not un-withdraw the DOI, so it is only a warning.
  try {
    await prisma.cvSnapshot.update({ where: { id: row.id }, data: { doiState: "withdrawn" } });
  } catch (err) {
    logger.warn("snapshot.doi_withdrawn_state_failed", { err, doi: row.doi });
  }
  return true;
}

/**
 * Account-deletion hook: BEFORE the `User → Cv → CvSnapshot` cascade removes
 * the rows, tombstone every minted DOI of this user's CV at DataCite (hide +
 * repoint at the static withdrawn page + minimise the record) so each DOI
 * resolves to "withdrawn by its owner" rather than a 404. Fail-soft by
 * contract: a DataCite outage or a DB error is logged and reported in the
 * counts, never thrown — the deletion must proceed regardless — and every DOI
 * NOT confirmed withdrawn is queued for the cron retry (`cv/doiWithdrawals.ts`)
 * so that proceeding never strands a findable record. A shortfall
 * (`attempted !== withdrawn`) is logged at error level. A no-op (not even a
 * DB read) while minting is disabled, since then no DOI can ever have been
 * minted by this server.
 */
export async function withdrawMintedSnapshotDois(
  userId: string,
): Promise<{ attempted: number; withdrawn: number }> {
  if (!doiMintingEnabled()) return { attempted: 0, withdrawn: 0 };
  let attempted = 0;
  let withdrawn = 0;
  try {
    const rows = await prisma.cvSnapshot.findMany({
      where: { cv: { userId }, doiState: "minted", doi: { not: null } },
      select: { id: true, doi: true, canonical: true },
    });
    for (const row of rows) {
      if (!row.doi) continue;
      attempted += 1;
      if (await withdrawOne({ id: row.id, doi: row.doi, canonical: row.canonical })) {
        withdrawn += 1;
      }
    }
  } catch (err) {
    logger.warn("snapshot.doi_withdrawal_failed", { err, attempted, withdrawn });
  }
  if (attempted > 0) {
    const level = attempted === withdrawn ? "info" : "error";
    logger[level]("snapshot.dois_withdrawn", { attempted, withdrawn });
  }
  return { attempted, withdrawn };
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
  /** The ledger computed at freeze time on the un-stripped document; null on
   *  versions frozen before it was recorded (the renderer then derives one from
   *  the frozen copy, which under-reports claimed / name-matched entries). */
  ledger: ProvenanceLedger | null;
  /** SHA-256 of the frozen document's public projection (`snapshotHash.ts`); null on old versions. */
  contentHash: string | null;
  /** Frozen as the reader view — the page renders with the reader-mode preset. */
  readerMode: boolean;
}

/** A stored ledger is trusted only when EVERY line the renderer reads is present
 *  (a ledger frozen before a line existed degrades to "derived", never a 500). */
function parseLedger(value: unknown): ProvenanceLedger | null {
  return isProvenanceLedger(value) ? value : null;
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
    ledger: parseLedger(row.ledger),
    contentHash: row.contentHash,
    readerMode: row.readerMode,
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
    // The payload's public-data enrichment (affiliation, referenced works,
    // funding) only ever sees what the frozen PUBLIC page itself shows.
    cv: projectCvForPublic(frozen),
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
