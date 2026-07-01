import { randomBytes, randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/siteUrl";
import { pingIndexNow } from "@/lib/cv/indexNow";
import { invalidatePublicPage } from "@/lib/cv/publicPageCache";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import { resolveCoauthorCvs, type CoauthorCvLink } from "@/lib/cv/coauthorLinks";
import { logger } from "@/lib/log";
import { getEnv } from "@/lib/env";
import { buildCanonicalCv } from "@/lib/canonical/build";
import {
  canonicalizeInstitutions,
  enrichCvWithAbstracts,
  enrichCvWithCrossref,
  enrichCvWithIcite,
  enrichCvWithRetractions,
  withRorProvenance,
} from "@/lib/canonical/enrich";
import { CanonicalCvSchema, safeParseCanonicalCv, type CanonicalCv } from "@/lib/canonical/schema";
import type { OaiRecordInput } from "@/lib/oai/oai";
import { fetchJournalNamesByIssn, fetchWorksByAuthorIds } from "@/lib/openalex/client";
import { resolveAuthorByOrcid } from "@/lib/openalex/resolveAuthor";
import { normalizeOrcid } from "@/lib/openalex/types";
import { discoverOrcidOnlyWorks } from "@/lib/cv/orcidDiscovery";
import { annotateDuplicatesWithRelations } from "@/lib/cv/duplicateRelations";
import {
  fetchOrcidDistinctions,
  fetchOrcidEducation,
  fetchOrcidFundings,
  fetchOrcidInvitedPositions,
  fetchOrcidPatents,
  fetchOrcidPeerReviews,
  fetchOrcidPositions,
  fetchOrcidService,
  fetchOrcidWorks,
  fetchOrcidWorkTypes,
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
import {
  computeSyncReport,
  publicRecentAdditions,
  safeParseSyncReport,
  type RecentAddition,
  type SyncReport,
} from "./syncReport";
import { applyHoldForReview } from "./holdForReview";

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

/**
 * A CV opened in the editor auto-refreshes in the background when it hasn't
 * synced within this window. The scheduled cron already keeps PUBLISHED CVs
 * current every 24h; this keeps any CV reasonably fresh whenever its owner opens
 * it, without syncing on every page load (most opens have no new upstream data).
 */
export const EDITOR_SYNC_STALE_MS = 12 * 60 * 60 * 1000;

/**
 * Whether a CV last synced at `lastSyncedAt` is stale enough to auto-refresh on
 * opening the editor: never synced, or older than {@link EDITOR_SYNC_STALE_MS}.
 * Pure (time passed in) so the freshness policy is unit-testable.
 */
export function isStaleSince(lastSyncedAt: Date | null, now: number): boolean {
  return lastSyncedAt === null || now - lastSyncedAt.getTime() > EDITOR_SYNC_STALE_MS;
}

/** The timestamp of the user's last sync (null = never synced / no CV row). A
 *  cheap single-column read used to decide the editor's background auto-sync. */
export async function getLastSyncedAt(userId: string): Promise<Date | null> {
  const row = await prisma.cv.findUnique({
    where: { userId },
    select: { lastSyncedAt: true },
  });
  return row?.lastSyncedAt ?? null;
}

interface SyncOptions {
  userId: string;
  orcid: string;
  fallbackName?: string;
}

/** What a sync returns: the rebuilt document plus its "what changed" report. */
export interface SyncResult {
  cv: CanonicalCv;
  report: SyncReport;
}

/** A single live progress tick: one source settled with `count` items. */
export interface SourceProgress {
  source: string;
  count: number;
}

interface BuildCvInput {
  orcid: string;
  fallbackName?: string;
  /** Prior document whose curation + display choices are preserved across the
   *  rebuild. Null on a first build and on the anonymous no-login preview. */
  previous?: CanonicalCv | null;
  /** Stable CV id to assign; defaults to a fresh UUID. The preview path has no
   *  persisted row, so it lets this default. */
  id?: string;
  /** Optional live progress sink, called the moment each source's fetch settles
   *  (in resolution order) — drives the streaming "searching open sources" view.
   *  Fires for the counted array sources only, never the author-resolve /
   *  Wikidata-identity prerequisites. */
  onProgress?: (event: SourceProgress) => void;
}

/**
 * Resolve OpenAlex author id(s) from the ORCID iD, pull every source, (re)build
 * the canonical object — preserving prior curation + display choices — enrich it,
 * and compute a {@link SyncReport} of what changed. Pure of the database (no reads
 * or writes): shared by {@link syncCvForUser} (which loads `previous` and persists
 * the result) and the no-login preview (which passes no `previous` and never
 * persists). Every client fails soft, so a build never throws on an upstream hiccup.
 */
export async function buildCvFromOrcid(input: BuildCvInput): Promise<SyncResult> {
  const { orcid, fallbackName, previous = null, id = randomUUID(), onProgress } = input;
  const now = new Date().toISOString();
  const startedAt = Date.now();

  // Per-source fetch durations. Every client fails SOFT (an upstream hiccup
  // yields [], never a throw), so a wall-clock spike or a zero count in the
  // report is the only observable trace of a struggling source.
  const timingsMs: Record<string, number> = {};
  const timed = <T>(key: string, p: Promise<T>): Promise<T> => {
    const t0 = Date.now();
    const done = p.finally(() => {
      timingsMs[key] = Math.round(Date.now() - t0);
    });
    if (onProgress) {
      // Live per-source tick the moment a fetch settles — drives the streaming
      // "searching open sources" view. Array sources only: the author-resolve
      // prerequisite and the Wikidata identity fetch aren't user-facing sources.
      // Observer-only side chain; it never changes `done` (still `p.finally(…)`).
      done
        .then((v) => {
          if (Array.isArray(v)) onProgress({ source: key, count: v.length });
        })
        /* v8 ignore next -- every client fails soft, so this observer chain never
           rejects; the caller's Promise.all owns any real rejection. */
        .catch(() => {});
    }
    return done;
  };

  const resolved = await timed("openalex.resolveAuthor", resolveAuthorByOrcid(orcid));
  const mailto = getEnv().OPENALEX_MAILTO;

  // Fetch the ORCID `/works` endpoint ONCE per sync and share the parsed payload
  // across its three consumers (work TYPES, self-asserted PATENTS, and the
  // discovery DOI diff below). Route Handlers don't get Next's fetch memoization,
  // so without this each consumer would hit ORCID's polite pool for the identical
  // endpoint. Started here (needs only the iD) so it runs concurrently with the
  // rest of the fan-out; fails soft to `null`.
  const orcidWorksPromise = timed("orcid.works", fetchOrcidWorks(orcid));

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
    orcidWorkTypes,
    orcidPatents,
  ] = await Promise.all([
    timed(
      "openalex.works",
      resolved ? fetchWorksByAuthorIds(resolved.authorIds) : Promise.resolve([]),
    ),
    timed("oep", fetchEditorialRoles(orcid)),
    timed("orcid.positions", fetchOrcidPositions(orcid)),
    timed("orcid.fundings", fetchOrcidFundings(orcid)),
    timed("orcid.invited", fetchOrcidInvitedPositions(orcid)),
    timed("orcid.education", fetchOrcidEducation(orcid)),
    timed("orcid.distinctions", fetchOrcidDistinctions(orcid)),
    timed("orcid.service", fetchOrcidService(orcid)),
    timed("orcid.peerReviews", fetchOrcidPeerReviews(orcid)),
    timed("datacite", fetchDataciteOutputs(orcid)),
    // ORCID-matched supplements (auto-included): datasets/software, conference
    // papers, Crossref grants; plus the owner's Wikidata identity for the page.
    timed("openaire", fetchOpenaireOutputs(orcid)),
    timed("dblp", fetchDblpConferencePapers(orcid)),
    timed("crossref.grants", fetchCrossrefGrantsByOrcid(orcid, mailto)),
    timed("wikidata", fetchWikidataIdentity(orcid)),
    // ORCID self-asserted work TYPES (DOI → type) — refine section placement so
    // posters/talks/datasets aren't mis-filed as preprints. Parses the shared
    // /works payload (fetched once above), not a fresh request.
    timed(
      "orcid.workTypes",
      orcidWorksPromise.then((w) => fetchOrcidWorkTypes(orcid, w)),
    ),
    // The owner's self-asserted patents on their ORCID record — identifier-matched
    // (their own iD), so AUTO-INCLUDED (unlike the EPO name-matched candidates
    // below). Parses the same shared /works payload.
    timed(
      "orcid.patents",
      orcidWorksPromise.then((w) => fetchOrcidPatents(orcid, w)),
    ),
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
  const [
    ctgovTrials,
    ctisTrials,
    ictrpTrials,
    ukriGrants,
    nihGrants,
    nsfGrants,
    epoPatents,
    orcidDiscoveredWorks,
  ] = await Promise.all([
    timed("clinicaltrials", fetchClinicalTrials(displayName, matchOrgs)),
    timed("ctis", fetchCtisTrials(displayName, matchOrgs)),
    timed("ictrp", fetchIctrpTrials(displayName, matchOrgs)),
    timed("ukri", fetchUkriGrants(displayName, matchOrgs)),
    timed("nih", fetchNihGrants(displayName, matchOrgs)),
    timed("nsf", fetchNsfGrants(displayName, matchOrgs)),
    timed("epo", fetchEpoPatents(displayName, matchOrgs)),
    // Works the user lists in ORCID that OpenAlex didn't attribute to their
    // author profile — surfaced as hidden review candidates. Reuses the shared
    // /works payload (its DOI diff), so it adds no extra ORCID request. Only
    // genuinely-new DOIs are fetched (already-known ones are carried over by the
    // build), so a steady-state re-sync issues no extra OpenAlex calls.
    timed(
      "orcid.discovery",
      orcidWorksPromise.then((w) =>
        discoverOrcidOnlyWorks({ orcid, openAlexWorks: works, previous, orcidWorks: w }),
      ),
    ),
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
    orcidDiscoveredWorks,
    orcidWorkTypes,
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
    // ORCID self-asserted patents (auto-included) + EPO name-matched candidates
    // (review); buildPatentsSection drops an EPO hit that duplicates an ORCID one.
    patents: [...orcidPatents, ...epoPatents],
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
  cv = await timed("enrich.crossref", enrichCvWithCrossref(cv, getEnv().OPENALEX_MAILTO));

  // Crossref: fill MISSING abstracts (OpenAlex carries none for many works), so the
  // public page's expandable abstract appears on more entries. Bounded + fails soft;
  // a filled abstract persists across re-sync (build.ts), so it isn't re-fetched.
  cv = await timed("enrich.abstracts", enrichCvWithAbstracts(cv, getEnv().OPENALEX_MAILTO));

  // NIH iCite: fold the Relative Citation Ratio onto works with a PMID (opt-in
  // biomedical field-normalized metric). Bounded + fails soft.
  cv = await timed("enrich.icite", enrichCvWithIcite(cv));

  // Crossref / Retraction Watch: flag retracted works (research-integrity signal).
  // Bounded + fails soft.
  cv = await timed("enrich.retractions", enrichCvWithRetractions(cv, getEnv().OPENALEX_MAILTO));

  // Upgrade duplicate hints with Crossref's publisher-asserted preprint↔published
  // relationships (the build already ran the identifier + heuristic tiers). The
  // lookup is targeted at ambiguous pairs only and fails soft.
  cv = await timed(
    "enrich.duplicates",
    annotateDuplicatesWithRelations(cv, getEnv().OPENALEX_MAILTO),
  );

  // "Review new works before they appear" (display.holdNewForReview): hold each
  // newly-found own work back as a review candidate instead of auto-including it.
  // After all enrichment so review flags are settled; before the report so held
  // works count as review candidates, not silent auto-applies. No-op by default and
  // on the first sync (no `previous`).
  cv = applyHoldForReview(cv, previous);

  // Defence-in-depth: never persist a document above the public-render item cap.
  // saveCvForUser enforces this for user saves; the sync/resync path writes via
  // upsert directly, so cap here too — trimming (fail-soft), never failing. A
  // real synced CV is far below the cap (bounded by the ~5k OpenAlex fetch cap).
  cv = capCvItems(cv, MAX_TOTAL_CV_ITEMS);

  // Items each source contributed to THIS build. A zero from a normally-rich
  // source is the user-visible trace of a silent fail-soft (the clients log the
  // error server-side but deliver an empty array).
  const sourceCounts: Record<string, number> = {
    openalex: works.length,
    "orcid.positions": employments.length,
    "orcid.fundings": fundings.length,
    "orcid.invited": invitedPositions.length,
    "orcid.education": education.length,
    "orcid.distinctions": distinctions.length,
    "orcid.service": service.length,
    "orcid.peerReviews": peerReviews.length,
    "orcid.discovery": orcidDiscoveredWorks.length,
    oep: editorialRoles.length,
    datacite: dataciteOutputs.length,
    openaire: openaireOutputs.length,
    dblp: dblpConferencePapers.length,
    "crossref.grants": crossrefGrants.length,
    clinicaltrials: ctgovTrials.length,
    ctis: ctisTrials.length,
    ictrp: ictrpTrials.length,
    ukri: ukriGrants.length,
    nih: nihGrants.length,
    nsf: nsfGrants.length,
    epo: epoPatents.length,
    "orcid.patents": orcidPatents.length,
  };

  const report = computeSyncReport(previous, cv, { syncedAt: now, sourceCounts, timingsMs });

  // Build-performance + outcome observability (one structured line per build,
  // whether it backs an authenticated sync or an anonymous no-login preview).
  logger.info("cv.build.completed", {
    ms: Date.now() - startedAt,
    added: report.addedTotal,
    removed: report.removedTotal,
    reviewCandidates: report.reviewCandidates,
    initial: report.initial,
    timingsMs,
    sourceCounts,
  });

  return { cv, report };
}

/**
 * Resolve OpenAlex author id(s) from the ORCID iD, (re)build the canonical object
 * preserving prior curation + display choices, and persist, along with a
 * {@link SyncReport} of what changed (surfaced in the editor). The heavy lifting is
 * {@link buildCvFromOrcid}; this adds the DB read (for prior curation) and the write.
 */
export async function syncCvForUser(opts: SyncOptions): Promise<SyncResult> {
  const { userId, orcid, fallbackName } = opts;

  const existing = await prisma.cv.findUnique({ where: { userId } });
  const previousParsed = existing ? safeParseCanonicalCv(existing.document) : null;
  const previous = previousParsed?.success ? previousParsed.data : null;
  const id = existing?.id ?? randomUUID();

  const { cv, report } = await buildCvFromOrcid({ orcid, fallbackName, previous, id });

  await prisma.cv.upsert({
    where: { userId },
    create: {
      id,
      userId,
      document: cv as unknown as Prisma.InputJsonValue,
      schemaVersion: cv.schemaVersion,
      lastSyncedAt: new Date(),
      lastSyncReport: report as unknown as Prisma.InputJsonValue,
    },
    update: {
      document: cv as unknown as Prisma.InputJsonValue,
      schemaVersion: cv.schemaVersion,
      lastSyncedAt: new Date(),
      lastSyncReport: report as unknown as Prisma.InputJsonValue,
    },
  });

  return { cv, report };
}

/** The persisted report of the user's last sync, or null (never synced, or a
 *  legacy/corrupt value — `safeParseSyncReport` degrades rather than throws). */
export async function getLastSyncReport(userId: string): Promise<SyncReport | null> {
  const row = await prisma.cv.findUnique({
    where: { userId },
    select: { lastSyncReport: true },
  });
  if (!row?.lastSyncReport) return null;
  return safeParseSyncReport(row.lastSyncReport);
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
  // Newly live AND indexable: nudge IndexNow (Bing/Yandex) to crawl now rather
  // than wait for sitemap rediscovery. Fire-and-forget — pingIndexNow is
  // fail-soft and no-ops outside production, so it never blocks or breaks publish.
  if (updated.published && updated.publicIndexable && updated.publicSlug) {
    void pingIndexNow([absoluteUrl(`p/${updated.publicSlug}`)]);
  }
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

/** Like getPublicCv, but also returns the indexing opt-in for robots/JSON-LD,
 *  and (when `resolveCoauthors`) the co-authors who have their OWN published,
 *  indexable SigmaCV CV — resolved from the UNPROJECTED document (the projection
 *  strips the raw co-author ORCID list) for the public JSON-LD `knows` graph.
 *  Only the page route asks for this; the OG-card path leaves it off to skip the
 *  extra query. */
export async function getPublicCvForPage(
  slug: string,
  opts?: { resolveCoauthors?: boolean },
): Promise<{
  cv: CanonicalCv;
  indexable: boolean;
  coauthorCvs: CoauthorCvLink[];
  recentlyAdded: RecentAddition[];
} | null> {
  const row = await prisma.cv.findUnique({ where: { publicSlug: slug } });
  if (!row || !row.published) return null;
  const parsed = safeParseCanonicalCv(row.document);
  if (!parsed.success) return null;
  const cv = projectCvForPublic(parsed.data);
  const coauthorCvs = opts?.resolveCoauthors ? await resolveCoauthorCvs(parsed.data) : [];
  // The most recent sync's confirmed, still-visible additions → the public
  // "What's new" strip. From the persisted last-sync report, cross-checked against
  // the projected (visible) CV so a since-hidden work is never advertised.
  const recentlyAdded = publicRecentAdditions(safeParseSyncReport(row.lastSyncReport), cv);
  return { cv, indexable: row.publicIndexable, coauthorCvs, recentlyAdded };
}

/**
 * Indexable published CVs for OAI-PMH harvesting — a page of {slug, datestamp
 * (row `updatedAt`), public-projected cv} plus the total matching count (for
 * resumption). Gated on `publicIndexable` (the same discovery opt-in the sitemap
 * uses). Stable order by slug so offset paging is consistent; `from`/`until`
 * filter on `updatedAt`. Unparseable rows are skipped.
 */
export async function listPublicCvRecords(opts: {
  limit: number;
  offset: number;
  from?: Date;
  until?: Date;
}): Promise<{ records: OaiRecordInput[]; total: number }> {
  const where: Prisma.CvWhereInput = {
    published: true,
    publicIndexable: true,
    publicSlug: { not: null },
  };
  if (opts.from || opts.until) {
    where.updatedAt = {
      ...(opts.from ? { gte: opts.from } : {}),
      ...(opts.until ? { lte: opts.until } : {}),
    };
  }
  const total = await prisma.cv.count({ where });
  const rows = await prisma.cv.findMany({
    where,
    select: { publicSlug: true, updatedAt: true, document: true },
    orderBy: { publicSlug: "asc" },
    take: opts.limit,
    skip: opts.offset,
  });
  const records: OaiRecordInput[] = [];
  for (const row of rows) {
    if (!row.publicSlug) continue;
    const parsed = safeParseCanonicalCv(row.document);
    if (!parsed.success) continue;
    records.push({
      slug: row.publicSlug,
      datestamp: row.updatedAt,
      cv: projectCvForPublic(parsed.data),
    });
  }
  return { records, total };
}

/** A single OAI record by slug (published + indexable), or null. */
export async function getPublicCvRecord(slug: string): Promise<OaiRecordInput | null> {
  const row = await prisma.cv.findUnique({ where: { publicSlug: slug } });
  if (!row || !row.published || !row.publicIndexable) return null;
  const parsed = safeParseCanonicalCv(row.document);
  if (!parsed.success) return null;
  return { slug, datestamp: row.updatedAt, cv: projectCvForPublic(parsed.data) };
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
