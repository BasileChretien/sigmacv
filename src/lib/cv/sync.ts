import { randomBytes, randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/log";
import { getEnv } from "@/lib/env";
import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  canonicalizeInstitutions,
  enrichCvWithCrossref,
  withRorProvenance,
} from "@/lib/canonical/enrich";
import {
  CanonicalCvSchema,
  safeParseCanonicalCv,
  type CanonicalCv,
} from "@/lib/canonical/schema";
import { fetchWorksByAuthorIds } from "@/lib/openalex/client";
import { resolveAuthorByOrcid } from "@/lib/openalex/resolveAuthor";
import { normalizeOrcid } from "@/lib/openalex/types";
import {
  fetchOrcidDistinctions,
  fetchOrcidEducation,
  fetchOrcidFundings,
  fetchOrcidInvitedPositions,
  fetchOrcidPeerReviews,
  fetchOrcidPositions,
  fetchOrcidService,
} from "@/lib/orcid/client";
import { fetchDataciteOutputs } from "@/lib/datacite/client";
import { fetchEditorialRoles } from "@/lib/oep/client";
import { cvSlug } from "@/lib/render/slug";
import { logCvSave } from "@/lib/research/log";

/** Thrown when a save is attempted before the user has a CV row. */
export class CvNotFoundError extends Error {
  constructor() {
    super("No CV exists for this user yet — sync first.");
    this.name = "CvNotFoundError";
  }
}

/** Load + validate the user's canonical CV, or null if absent/corrupt. */
export async function getCvForUser(userId: string): Promise<CanonicalCv | null> {
  const row = await prisma.cv.findUnique({ where: { userId } });
  if (!row) return null;
  const parsed = safeParseCanonicalCv(row.document);
  if (!parsed.success) {
    logger.error("cv.stored_document_invalid", { issueCount: parsed.error.issues.length });
    return null;
  }
  return parsed.data;
}

interface SyncOptions {
  userId: string;
  orcid: string;
  fallbackName?: string;
}

/**
 * Resolve OpenAlex author id(s) from the ORCID iD, pull works, (re)build the
 * canonical object — preserving prior curation + display choices — and persist.
 */
export async function syncCvForUser(opts: SyncOptions): Promise<CanonicalCv> {
  const { userId, orcid, fallbackName } = opts;
  const now = new Date().toISOString();

  const existing = await prisma.cv.findUnique({ where: { userId } });
  const previousParsed = existing
    ? safeParseCanonicalCv(existing.document)
    : null;
  const previous = previousParsed?.success ? previousParsed.data : null;

  const resolved = await resolveAuthorByOrcid(orcid);
  const [
    works,
    editorialRoles,
    employments,
    fundings,
    invitedPositions,
    education,
    distinctions,
    service,
    peerReviews,
    dataciteOutputs,
  ] = await Promise.all([
    resolved ? fetchWorksByAuthorIds(resolved.authorIds) : Promise.resolve([]),
    fetchEditorialRoles(orcid),
    fetchOrcidPositions(orcid),
    fetchOrcidFundings(orcid),
    fetchOrcidInvitedPositions(orcid),
    fetchOrcidEducation(orcid),
    fetchOrcidDistinctions(orcid),
    fetchOrcidService(orcid),
    fetchOrcidPeerReviews(orcid),
    fetchDataciteOutputs(orcid),
  ]);

  // ROR: canonicalize free-text institution names BEFORE building so the same
  // institution from ORCID and OpenAlex de-duplicates and renders consistently.
  const { result: inst, used: usedRor } = await canonicalizeInstitutions({
    employments,
    education,
    distinctions,
    service,
    invitedPositions,
    affiliations: resolved?.affiliations ?? [],
  });

  const id = existing?.id ?? randomUUID();
  let cv = buildCanonicalCv({
    id,
    resolved: resolved
      ? { ...resolved, affiliations: inst.affiliations }
      : {
          orcid: normalizeOrcid(orcid),
          authorIds: [],
          displayName: fallbackName ?? "",
        },
    works,
    now,
    previous,
    editorialRoles,
    employments: inst.employments,
    fundings,
    invitedPositions: inst.invitedPositions,
    education: inst.education,
    distinctions: inst.distinctions,
    service: inst.service,
    peerReviews,
    dataciteOutputs,
  });
  if (usedRor) cv = withRorProvenance(cv);

  // Crossref: fill bibliographic gaps (journal, volume/issue, pages) on works
  // that have a DOI but incomplete OpenAlex metadata. Bounded + fails soft.
  cv = await enrichCvWithCrossref(cv, getEnv().OPENALEX_MAILTO);

  await prisma.cv.upsert({
    where: { userId },
    create: {
      id,
      userId,
      document: cv as unknown as Prisma.InputJsonValue,
      schemaVersion: cv.schemaVersion,
      lastSyncedAt: new Date(),
    },
    update: {
      document: cv as unknown as Prisma.InputJsonValue,
      schemaVersion: cv.schemaVersion,
      lastSyncedAt: new Date(),
    },
  });

  return cv;
}

/** Persist a curated canonical document. Keyed by userId — never trusts a
 *  client-supplied user id (no IDOR). Requires an existing row. */
export async function saveCvForUser(
  userId: string,
  doc: CanonicalCv,
): Promise<CanonicalCv> {
  const validated = CanonicalCvSchema.parse(doc);
  const existing = await prisma.cv.findUnique({ where: { userId } });
  if (!existing) throw new CvNotFoundError();

  const prevParsed = safeParseCanonicalCv(existing.document);
  const previous = prevParsed.success ? prevParsed.data : null;

  await prisma.cv.update({
    where: { userId },
    data: {
      document: validated as unknown as Prisma.InputJsonValue,
      schemaVersion: validated.schemaVersion,
    },
  });

  // Consent-gated research logging (no-op without consent; never throws here).
  await logCvSave(userId, previous, validated);

  return validated;
}

// ─── Living public page ──────────────────────────────────────────────────────

export interface PublishState {
  published: boolean;
  publicSlug: string | null;
  /** Whether the published page opts in to search-engine indexing. */
  indexable: boolean;
}

export async function getPublishState(userId: string): Promise<PublishState> {
  const row = await prisma.cv.findUnique({
    where: { userId },
    select: { published: true, publicSlug: true, publicIndexable: true },
  });
  return {
    published: row?.published ?? false,
    publicSlug: row?.publicSlug ?? null,
    indexable: row?.publicIndexable ?? false,
  };
}

/** Publish/unpublish the public page; mints a stable slug on first publish.
 *  `indexable` is a SEPARATE opt-in (default false) — unpublishing always
 *  clears it, and it can only be true while published. */
export async function setPublishState(
  userId: string,
  published: boolean,
  indexable = false,
): Promise<PublishState> {
  const row = await prisma.cv.findUnique({ where: { userId } });
  if (!row) throw new CvNotFoundError();

  let slug = row.publicSlug;
  if (published && !slug) {
    const parsed = safeParseCanonicalCv(row.document);
    const name = parsed.success ? parsed.data.owner.displayName : "cv";
    // Capability URL: a readable name plus an UNGUESSABLE 80-bit random suffix.
    // The old `row.id.slice(0,8)` exposed a time-ordered CUID prefix that, given
    // a known name + approximate signup time, narrowed enumeration — a privacy
    // risk for a tool keyed to real researcher identities.
    slug = `${cvSlug(name)}-${randomBytes(10).toString("hex")}`;
  }

  const publicIndexable = published && indexable;
  const updated = await prisma.cv.update({
    where: { userId },
    data: { published, publicSlug: slug, publicIndexable },
    select: { published: true, publicSlug: true, publicIndexable: true },
  });
  return {
    published: updated.published,
    publicSlug: updated.publicSlug,
    indexable: updated.publicIndexable,
  };
}

/**
 * Load a published CV by slug (null if not found or unpublished). READ-ONLY:
 * freshness of the "living" page is owned by the scheduled re-sync job
 * (src/lib/cv/resync.ts via /api/internal/resync), not by public GETs.
 */
export async function getPublicCv(slug: string): Promise<CanonicalCv | null> {
  const row = await prisma.cv.findUnique({ where: { publicSlug: slug } });
  if (!row || !row.published) return null;
  const parsed = safeParseCanonicalCv(row.document);
  if (!parsed.success) return null;
  return parsed.data;
}

/** Like getPublicCv, but also returns the indexing opt-in for robots/JSON-LD. */
export async function getPublicCvForPage(
  slug: string,
): Promise<{ cv: CanonicalCv; indexable: boolean } | null> {
  const row = await prisma.cv.findUnique({ where: { publicSlug: slug } });
  if (!row || !row.published) return null;
  const parsed = safeParseCanonicalCv(row.document);
  if (!parsed.success) return null;
  return { cv: parsed.data, indexable: row.publicIndexable };
}

/** Public slugs that the owner has opted into search-engine indexing — for the
 *  sitemap. Empty if none; never includes unpublished or non-indexable pages. */
export async function listIndexablePublicSlugs(): Promise<string[]> {
  const rows = await prisma.cv.findMany({
    where: { published: true, publicIndexable: true, publicSlug: { not: null } },
    select: { publicSlug: true },
  });
  return rows
    .map((r) => r.publicSlug)
    .filter((s): s is string => typeof s === "string");
}
