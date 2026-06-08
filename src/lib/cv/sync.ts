import { randomBytes, randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { invalidatePublicPage } from "@/lib/cv/publicPageCache";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import { logger } from "@/lib/log";
import { getEnv } from "@/lib/env";
import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  canonicalizeInstitutions,
  enrichCvWithCrossref,
  withRorProvenance,
} from "@/lib/canonical/enrich";
import { CanonicalCvSchema, safeParseCanonicalCv, type CanonicalCv } from "@/lib/canonical/schema";
import { fetchJournalNamesByIssn, fetchWorksByAuthorIds } from "@/lib/openalex/client";
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
import { fetchOpenaireOutputs } from "@/lib/openaire/client";
import { fetchDblpConferencePapers } from "@/lib/dblp/client";
import { fetchCrossrefGrantsByOrcid } from "@/lib/crossref/client";
import { fetchWikidataIdentity } from "@/lib/wikidata/client";
import { fetchUkriGrants } from "@/lib/ukri/client";
import { fetchNihGrants } from "@/lib/nih/client";
import { fetchNsfGrants } from "@/lib/nsf/client";
import { fetchClinicalTrials } from "@/lib/clinicaltrials/client";
import { fetchCtisTrials } from "@/lib/ctis/client";
import { fetchIctrpTrials } from "@/lib/ictrp/client";
import { fetchEpoPatents } from "@/lib/epo/client";
import { cvSlug } from "@/lib/render/slug";
import { logCvSave } from "@/lib/research/log";

/** Thrown when a save is attempted before the user has a CV row. */
export class CvNotFoundError extends Error {
  constructor() {
    super("No CV exists for this user yet — sync first.");
    this.name = "CvNotFoundError";
  }
}

/**
 * Hard cap on the TOTAL number of items across all sections, enforced on SAVE
 * only. A real auto-synced CV is far below this (bounded by the ~5k OpenAlex
 * fetch cap), but a crafted document with tens of thousands of citeproc items
 * would make a public-page render pin the single-process event loop. Reads are
 * never rejected by this — only writes — so it can't make a stored CV vanish.
 */
export const MAX_TOTAL_CV_ITEMS = 12_000;

/** Thrown when a save would exceed {@link MAX_TOTAL_CV_ITEMS}. */
export class CvTooLargeError extends Error {
  constructor() {
    super("CV exceeds the maximum number of items.");
    this.name = "CvTooLargeError";
  }
}

/** Total items across all sections of a canonical CV. */
export function cvItemCount(cv: Pick<CanonicalCv, "sections">): number {
  return cv.sections.reduce((n, s) => n + s.items.length, 0);
}

/**
 * Trim a CV's items to at most `max` total across all sections, preserving
 * section order and within-section order (later sections lose items first).
 * Immutable; a no-op when already under the cap. Used to keep the sync path from
 * persisting a document the public render couldn't safely handle, without ever
 * failing the sync (fail-soft).
 */
export function capCvItems(cv: CanonicalCv, max: number): CanonicalCv {
  if (cvItemCount(cv) <= max) return cv;
  let remaining = max;
  const sections = cv.sections.map((s) => {
    if (remaining <= 0) return { ...s, items: [] };
    if (s.items.length <= remaining) {
      remaining -= s.items.length;
      return s;
    }
    const items = s.items.slice(0, remaining);
    remaining = 0;
    return { ...s, items };
  });
  return { ...cv, sections };
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
  const previousParsed = existing ? safeParseCanonicalCv(existing.document) : null;
  const previous = previousParsed?.success ? previousParsed.data : null;

  const resolved = await resolveAuthorByOrcid(orcid);
  const mailto = getEnv().OPENALEX_MAILTO;
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
    openaireOutputs,
    dblpConferencePapers,
    crossrefGrants,
    wikidataIdentity,
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
    // ORCID-matched supplements (auto-included): datasets/software, conference
    // papers, Crossref grants; plus the owner's Wikidata identity for the page.
    fetchOpenaireOutputs(orcid),
    fetchDblpConferencePapers(orcid),
    fetchCrossrefGrantsByOrcid(orcid, mailto),
    fetchWikidataIdentity(orcid),
  ]);

  // Registries with NO ORCID (national funders + trial registries) are matched by
  // NAME + organization, so their results are REVIEW CANDIDATES. Orgs come from
  // OpenAlex affiliations + ORCID employments (a clinician's hospital is often in
  // ORCID but not OpenAlex). Every client fails soft and early-returns without
  // orgs, so this is safe even when the name/org set is empty.
  const displayName = resolved?.displayName || fallbackName || "";
  const matchOrgs = [
    ...new Set(
      [
        ...(resolved?.affiliations ?? []).map((a) => a.institution),
        ...employments.map((e) => e.organization),
      ].filter((o): o is string => Boolean(o)),
    ),
  ];
  const [ctgovTrials, ctisTrials, ictrpTrials, ukriGrants, nihGrants, nsfGrants, patents] =
    await Promise.all([
      fetchClinicalTrials(displayName, matchOrgs),
      fetchCtisTrials(displayName, matchOrgs),
      fetchIctrpTrials(displayName, matchOrgs),
      fetchUkriGrants(displayName, matchOrgs),
      fetchNihGrants(displayName, matchOrgs),
      fetchNsfGrants(displayName, matchOrgs),
      fetchEpoPatents(displayName, matchOrgs),
    ]);

  // Peer reviews carry the journal ISSN but not its name (ORCID records the
  // publisher/Publons org). Resolve ISSNs → journal names so the section reads
  // by journal, not by publisher. Best-effort: unresolved ISSNs keep the
  // publisher fallback.
  const prIssns = peerReviews.map((p) => p.issn).filter((x): x is string => Boolean(x));
  let resolvedPeerReviews = peerReviews;
  if (prIssns.length > 0) {
    const names = await fetchJournalNamesByIssn(prIssns);
    // Immutable remap — never mutate the array returned by the ORCID client
    // (the project-wide immutability invariant; a future cached/shared client
    // result would otherwise be corrupted in place).
    resolvedPeerReviews = peerReviews.map((pr) =>
      pr.issn ? { ...pr, journal: names.get(pr.issn) ?? pr.journal } : pr,
    );
  }

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
    peerReviews: resolvedPeerReviews,
    dataciteOutputs,
    openaireOutputs,
    dblpConferencePapers,
    crossrefGrants,
    nationalGrants: [...ukriGrants, ...nihGrants, ...nsfGrants],
    clinicalTrials: [...ctgovTrials, ...ctisTrials, ...ictrpTrials],
    patents,
  });
  if (usedRor) cv = withRorProvenance(cv);

  // Wikidata is an OWNER-LEVEL identity enrichment (sameAs links for the public
  // page's schema.org graph), not a CV item — store it on the owner and record
  // it as a provenance source (like ROR). Preserve the prior values when a
  // re-sync's Wikidata fetch fails, so a transient miss never drops the links.
  const wikidataUri = wikidataIdentity?.wikidataUri ?? previous?.owner.wikidataUri;
  const wikidataSameAs = wikidataIdentity?.sameAs ?? previous?.owner.wikidataSameAs;
  if (wikidataUri || (wikidataSameAs && wikidataSameAs.length > 0)) {
    cv = {
      ...cv,
      owner: { ...cv.owner, wikidataUri, wikidataSameAs },
      provenance: {
        ...cv.provenance,
        sources: [...new Set([...cv.provenance.sources, "wikidata" as const])],
      },
    };
  }

  // Crossref: fill bibliographic gaps (journal, volume/issue, pages) on works
  // that have a DOI but incomplete OpenAlex metadata. Bounded + fails soft.
  cv = await enrichCvWithCrossref(cv, getEnv().OPENALEX_MAILTO);

  // Defence-in-depth: never persist a document above the public-render item cap.
  // saveCvForUser enforces this for user saves; the sync/resync path writes via
  // upsert directly, so cap here too — trimming (fail-soft), never failing. A
  // real synced CV is far below the cap (bounded by the ~5k OpenAlex fetch cap).
  cv = capCvItems(cv, MAX_TOTAL_CV_ITEMS);

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
export async function saveCvForUser(userId: string, doc: CanonicalCv): Promise<CanonicalCv> {
  const validated = CanonicalCvSchema.parse(doc);
  // Bound total items on save so a crafted many-item document can't later pin the
  // event loop on every public-page render (the per-section cap alone still
  // allows 60 × 10k). Far above any real CV.
  if (cvItemCount(validated) > MAX_TOTAL_CV_ITEMS) throw new CvTooLargeError();
  const existing = await prisma.cv.findUnique({ where: { userId } });
  if (!existing) throw new CvNotFoundError();

  const prevParsed = safeParseCanonicalCv(existing.document);
  const previous = prevParsed.success ? prevParsed.data : null;

  // Identity reconciliation: owner.orcid + openAlexAuthorIds are SERVER-derived
  // (set from the authenticated ORCID when the CV is built/synced). A curation
  // save must never change them — otherwise a user could set another
  // researcher's ORCID iD as their own and publish it on an indexable page.
  const reconciled: CanonicalCv = previous
    ? {
        ...validated,
        owner: {
          ...validated.owner,
          orcid: previous.owner.orcid,
          openAlexAuthorIds: previous.owner.openAlexAuthorIds,
        },
      }
    : validated;

  await prisma.cv.update({
    where: { userId },
    data: {
      document: reconciled as unknown as Prisma.InputJsonValue,
      schemaVersion: reconciled.schemaVersion,
    },
  });

  // Consent-gated research logging (no-op without consent; never throws here).
  await logCvSave(userId, previous, reconciled);

  return reconciled;
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
  // Drop any cached render so unpublish/publish/index changes take effect at
  // once (the public route caches rendered pages for a short TTL).
  if (updated.publicSlug) invalidatePublicPage(updated.publicSlug);
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
  // Public projection: strip personal fields + opt-in-gated contact details.
  return projectCvForPublic(parsed.data);
}

/** Like getPublicCv, but also returns the indexing opt-in for robots/JSON-LD. */
export async function getPublicCvForPage(
  slug: string,
): Promise<{ cv: CanonicalCv; indexable: boolean } | null> {
  const row = await prisma.cv.findUnique({ where: { publicSlug: slug } });
  if (!row || !row.published) return null;
  const parsed = safeParseCanonicalCv(row.document);
  if (!parsed.success) return null;
  return { cv: projectCvForPublic(parsed.data), indexable: row.publicIndexable };
}

/** Public slugs that the owner has opted into search-engine indexing — for the
 *  sitemap. Empty if none; never includes unpublished or non-indexable pages. */
export async function listIndexablePublicSlugs(): Promise<string[]> {
  const rows = await prisma.cv.findMany({
    where: { published: true, publicIndexable: true, publicSlug: { not: null } },
    select: { publicSlug: true },
    // Bound the sitemap so it can never grow into an unbounded scan/response as
    // the number of indexable public pages grows (well above any near-term scale).
    take: 50_000,
  });
  return rows.map((r) => r.publicSlug).filter((s): s is string => typeof s === "string");
}
