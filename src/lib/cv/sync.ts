import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  CanonicalCvSchema,
  safeParseCanonicalCv,
  type CanonicalCv,
} from "@/lib/canonical/schema";
import { fetchWorksByAuthorIds } from "@/lib/openalex/client";
import { resolveAuthorByOrcid } from "@/lib/openalex/resolveAuthor";
import { normalizeOrcid } from "@/lib/openalex/types";
import { fetchOrcidFundings, fetchOrcidPositions } from "@/lib/orcid/client";
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
    console.error("[cv] stored document failed validation", parsed.error.issues);
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
  const [works, editorialRoles, employments, fundings] = await Promise.all([
    resolved ? fetchWorksByAuthorIds(resolved.authorIds) : Promise.resolve([]),
    fetchEditorialRoles(orcid),
    fetchOrcidPositions(orcid),
    fetchOrcidFundings(orcid),
  ]);

  const id = existing?.id ?? randomUUID();
  const cv = buildCanonicalCv({
    id,
    resolved: resolved ?? {
      orcid: normalizeOrcid(orcid),
      authorIds: [],
      displayName: fallbackName ?? "",
    },
    works,
    now,
    previous,
    editorialRoles,
    employments,
    fundings,
  });

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
}

export async function getPublishState(userId: string): Promise<PublishState> {
  const row = await prisma.cv.findUnique({
    where: { userId },
    select: { published: true, publicSlug: true },
  });
  return {
    published: row?.published ?? false,
    publicSlug: row?.publicSlug ?? null,
  };
}

/** Publish/unpublish the public page; mints a stable slug on first publish. */
export async function setPublishState(
  userId: string,
  published: boolean,
): Promise<PublishState> {
  const row = await prisma.cv.findUnique({ where: { userId } });
  if (!row) throw new CvNotFoundError();

  let slug = row.publicSlug;
  if (published && !slug) {
    const parsed = safeParseCanonicalCv(row.document);
    const name = parsed.success ? parsed.data.owner.displayName : "cv";
    slug = `${cvSlug(name)}-${row.id.slice(0, 8)}`;
  }

  const updated = await prisma.cv.update({
    where: { userId },
    data: { published, publicSlug: slug },
    select: { published: true, publicSlug: true },
  });
  return { published: updated.published, publicSlug: updated.publicSlug };
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
