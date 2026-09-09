import { randomBytes, randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/siteUrl";
import { pingIndexNow } from "@/lib/cv/indexNow";
import { invalidatePublicPage, purgeInstitutionPages } from "@/lib/cv/publicPageCache";
import {
  institutionPageState,
  resolveInstitutionConsent,
  visibleCurrentRorIds,
  type InstitutionConsentColumns,
  type InstitutionPageRequest,
  type InstitutionPageState,
} from "@/lib/cv/institutionConsent";
import { invalidateOrcidPreview } from "@/lib/cv/orcidPreviewCache";
import { projectCvForPublic } from "@/lib/cv/publicProjection";
import { currentAffiliation } from "@/lib/cv/publicJsonLd";
import { recordInstitutions, trustedInstitutionNames } from "@/lib/cv/listed";
import { computeCvAggregates } from "@/lib/institutions/cvAggregates";
import { provenanceLedger, type ProvenanceLedger } from "@/lib/cv/provenanceLedger";
import { resolveCoauthorCvs, type CoauthorCvLink } from "@/lib/cv/coauthorLinks";
import { logger } from "@/lib/log";
import { getEnv } from "@/lib/env";
import { buildCanonicalCv } from "@/lib/canonical/build";
import { attachDataciteLinks } from "@/lib/canonical/dataLinks";
import {
  canonicalizeInstitutions,
  enrichCvWithAbstracts,
  enrichCvWithCreditRoles,
  enrichCvWithCrossref,
  enrichCvWithDataLinks,
  enrichCvWithForrtReplications,
  enrichCvWithIcite,
  enrichCvWithOpenCitations,
  enrichCvWithRetractions,
  enrichCvWithSupervision,
  enrichCvWithSciety,
  enrichCvWithSoftwareHeritage,
  withRorProvenance,
} from "@/lib/canonical/enrich";
import { CanonicalCvSchema, safeParseCanonicalCv, type CanonicalCv } from "@/lib/canonical/schema";
import { rorSetSpec, type OaiRecordInput, type OaiSet } from "@/lib/oai/oai";
import { fetchJournalNamesByIssn, fetchWorksByAuthorIds } from "@/lib/openalex/client";
import { recordWorkFunders } from "@/lib/openalex/funders";
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
import { fetchEditorialRoleCandidates, fetchEditorialRoles } from "@/lib/oep/client";
import { fetchOpenaireOutputs } from "@/lib/openaire/client";
import { fetchDblpConferencePapers } from "@/lib/dblp/client";
import { fetchCrossrefGrantsByOrcid, fetchCrossrefPeerReviewsByOrcid } from "@/lib/crossref/client";
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
 * The denormalised `Cv.currentRorId` column: the bare ROR id of the owner's
 * first VISIBLE current position (the same rule as the public JSON-LD
 * affiliation), or null. Rewritten from the document on EVERY write — save,
 * sync/resync and publish-state change — so it can never go stale: it is the
 * key of the OAI-PMH `ror:<id>` set an opted-in CV is listed under, and a CV
 * whose current position disappears must drop out of the set at once.
 */
function currentRorKey(cv: CanonicalCv): string | null {
  return currentAffiliation(cv)?.rorId ?? null;
}

/** The canonical institution name written beside {@link currentRorKey}: the
 *  `ListSets` set name, chosen deterministically across every opted-in CV. */
function affiliationSetName(cv: CanonicalCv): string | null {
  return currentAffiliation(cv)?.setName ?? null;
}

/**
 * The `Cv.institutionAggregates` column: the counts-only aggregate of the works
 * the public page lists (`computeCvAggregates`), written beside
 * {@link currentRorKey} at EVERY write — sync, save and publish-state change —
 * so the column follows the document and the institution page never sums a
 * stale figure. A row with no parseable document gets a database null, which
 * the page counts as "not yet computed".
 */
function aggregatesColumn(cv: CanonicalCv | null): Prisma.InputJsonValue | typeof Prisma.DbNull {
  return cv ? (computeCvAggregates(cv) as unknown as Prisma.InputJsonValue) : Prisma.DbNull;
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
    crossrefPeerReviews,
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
    // DOI-bearing open peer reviews the publisher registered against the iD.
    timed("crossref.reviews", fetchCrossrefPeerReviewsByOrcid(orcid, mailto)),
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
    editorialRoleCandidates,
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
    // OEP editorships attributed by inference rather than by a printed ORCID —
    // an ORCID propagated from another row of the same unambiguous name, or an
    // OpenAlex author ID resolved from name+institution. Keyed on the author IDs
    // already resolved above, so no name string reaches the query.
    timed(
      "oep.candidates",
      fetchEditorialRoleCandidates({ orcid, authorIds: resolved?.authorIds ?? [] }),
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
  const {
    result: inst,
    used: usedRor,
    orgs: rorOrgs,
  } = await canonicalizeInstitutions({
    employments,
    education,
    distinctions,
    service,
    invitedPositions,
    affiliations: resolved?.affiliations ?? [],
  });
  // ROR's own name for every matched institution → the `Institution` table, the
  // only source of a public institution name (pages, sitemap, ListSets). Fail-soft.
  await recordInstitutions(rorOrgs);

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
    // Scraped ORCID matches (auto-included) + inferred matches (review
    // candidates); buildEditorialSection drops a candidate that duplicates one.
    editorialRoles: [...editorialRoles, ...editorialRoleCandidates],
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
    crossrefPeerReviews,
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

  // Supervision records (owner-entered, carried over by the build): gap-fill a
  // thesis DOI's title/year from Crossref → DataCite and the institution's ROR id.
  // Bounded + fails soft; filled fields persist, so they aren't re-fetched.
  cv = await timed("enrich.supervision", enrichCvWithSupervision(cv, getEnv().OPENALEX_MAILTO));

  // Open data / code links per work: the owner's own DataCite deposits that declare
  // the paper they supplement (pure, from the already-fetched records), then Europe
  // PMC data links + Crossref supplement relations (network, bounded + fail-soft).
  // Before iCite so a PMID Europe PMC back-fills can feed the RCR lookup.
  cv = attachDataciteLinks(cv, dataciteOutputs);
  cv = await timed("enrich.dataLinks", enrichCvWithDataLinks(cv, getEnv().OPENALEX_MAILTO, now));

  // NIH iCite: fold the Relative Citation Ratio onto works with a PMID (opt-in
  // biomedical field-normalized metric). Bounded + fails soft.
  cv = await timed("enrich.icite", enrichCvWithIcite(cv, now));

  // Crossref / Retraction Watch: flag retracted works (research-integrity signal).
  // Bounded + fails soft.
  cv = await timed(
    "enrich.retractions",
    enrichCvWithRetractions(cv, getEnv().OPENALEX_MAILTO, now),
  );

  // Crossref: the owner's CRediT contribution roles from the publisher's deposit
  // (owner matched by ORCID on the contributor list). Bounded + fails soft; a
  // self-declared set is never overwritten.
  cv = await timed(
    "enrich.credit",
    enrichCvWithCreditRoles(cv, cv.owner.orcid, getEnv().OPENALEX_MAILTO),
  );

  // FORRT / FReD: fold replication evidence onto works (DOI-matched, auto-included).
  // Bounded + fails soft; DORMANT (no-op) until `npm run forrt:import` is run.
  cv = await timed("enrich.forrt", enrichCvWithForrtReplications(cv));
  // Items this pass actually touched, for the provenance summary (sourceCounts
  // below) — the enrichment above doesn't return a count of its own.
  const forrtEnrichedCount = cv.sections.reduce(
    (n, section) =>
      n + section.items.filter((item) => item.meta.replications || item.meta.replicationOf).length,
    0,
  );

  // OpenCitations: independent citation counts alongside OpenAlex's own
  // (multi-source honesty, not a replacement). Bounded + fails soft.
  cv = await timed("enrich.opencitations", enrichCvWithOpenCitations(cv, now));

  // Software Heritage: archival status (SWHID) for software items whose source
  // repository was identified. Bounded + fails soft (404 = not archived).
  cv = await timed("enrich.softwareheritage", enrichCvWithSoftwareHeritage(cv, now));

  // Sciety: aggregated public evaluations of preprints. Bounded + fails soft
  // (404 = no evaluations recorded).
  cv = await timed("enrich.sciety", enrichCvWithSciety(cv, now));

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
    "oep.candidates": editorialRoleCandidates.length,
    datacite: dataciteOutputs.length,
    openaire: openaireOutputs.length,
    dblp: dblpConferencePapers.length,
    "crossref.grants": crossrefGrants.length,
    "crossref.reviews": crossrefPeerReviews.length,
    clinicaltrials: ctgovTrials.length,
    ctis: ctisTrials.length,
    ictrp: ictrpTrials.length,
    ukri: ukriGrants.length,
    nih: nihGrants.length,
    nsf: nsfGrants.length,
    forrt: forrtEnrichedCount,
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

  // The OAI affiliation-set key follows the document on every write (see
  // `currentRorKey`): a re-sync that changes or drops the current position
  // re-keys — or un-lists — the CV at once.
  const currentRorId = currentRorKey(cv);
  const currentAffiliationName = affiliationSetName(cv);
  const visibleRorIds = visibleCurrentRorIds(cv);
  const institutionAggregates = aggregatesColumn(cv);
  await prisma.cv.upsert({
    where: { userId },
    create: {
      id,
      userId,
      document: cv as unknown as Prisma.InputJsonValue,
      schemaVersion: cv.schemaVersion,
      lastSyncedAt: new Date(),
      lastSyncReport: report as unknown as Prisma.InputJsonValue,
      currentRorId,
      currentAffiliationName,
      visibleCurrentRorIds: visibleRorIds,
      institutionAggregates,
    },
    update: {
      document: cv as unknown as Prisma.InputJsonValue,
      schemaVersion: cv.schemaVersion,
      lastSyncedAt: new Date(),
      lastSyncReport: report as unknown as Prisma.InputJsonValue,
      currentRorId,
      currentAffiliationName,
      visibleCurrentRorIds: visibleRorIds,
      institutionAggregates,
    },
  });

  // AFTER the write: the OpenAlex funder crosswalk for the funders printed on
  // the owner's works (the owner worklist's funder join reads it). Reference
  // data about funders — at most 25 polite-pool calls per sync inside a 10 s
  // wall-clock budget, ~0 once warm, fail-soft — so the owner's document never
  // waits on it; the next page load reads whatever landed. Only on the
  // authenticated sync, never on the anonymous preview build.
  await recordWorkFunders(cv, new Date());

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
      currentRorId: currentRorKey(reconciled),
      currentAffiliationName: affiliationSetName(reconciled),
      visibleCurrentRorIds: visibleCurrentRorIds(reconciled),
      institutionAggregates: aggregatesColumn(reconciled),
    },
  });

  // The anonymous /preview/[orcid] build applies this researcher's own
  // disambiguation corrections, so a cached preview is stale the moment they
  // save one. Without this they could mark a namesake's paper "not mine" and
  // still see it on their own public preview until the TTL expired.
  invalidateOrcidPreview(reconciled.owner.orcid);

  // Consent-gated research logging (no-op without consent; never throws here).
  await logCvSave(userId, previous, reconciled);

  return reconciled;
}

// ─── Living public page ──────────────────────────────────────────────────────

/** Publish state; the institution-page part (`InstitutionPageState`) is a
 *  FOURTH separate consent, pinned to ticked ROR ids (see `institutionConsent.ts`). */
export interface PublishState extends InstitutionPageState {
  published: boolean;
  publicSlug: string | null;
  /** Whether the published page opts in to search-engine indexing. */
  indexable: boolean;
  /** Whether the CV opts in to the OAI-PMH `ror:<id>` affiliation set. A
   *  SEPARATE consent from `indexable` (which it requires). */
  listUnderAffiliation: boolean;
  /** The bare ROR id of the visible current position the CV would be listed
   *  under, or null when none resolves (the opt-in is then not offered). */
  affiliationRorId: string | null;
}

const NO_CONSENT: InstitutionConsentColumns = { showOnInstitutionPage: false, consentedRorIds: [] };

export async function getPublishState(userId: string): Promise<PublishState> {
  const row = await prisma.cv.findUnique({
    where: { userId },
    select: {
      published: true,
      publicSlug: true,
      publicIndexable: true,
      listUnderAffiliation: true,
      currentRorId: true,
      showOnInstitutionPage: true,
      consentedRorIds: true,
      document: true,
    },
  });
  const published = row?.published ?? false;
  const publicIndexable = row?.publicIndexable ?? false;
  const parsed = row ? safeParseCanonicalCv(row.document) : null;
  return {
    published,
    publicSlug: row?.publicSlug ?? null,
    indexable: publicIndexable,
    listUnderAffiliation: row?.listUnderAffiliation ?? false,
    affiliationRorId: row?.currentRorId ?? null,
    ...institutionPageState(
      parsed?.success ? parsed.data : null,
      row
        ? { showOnInstitutionPage: row.showOnInstitutionPage, consentedRorIds: row.consentedRorIds }
        : NO_CONSENT,
      { published, publicIndexable },
    ),
  };
}

/** Publish/unpublish the public page; mints a stable slug on first publish.
 *  `indexable` is a SEPARATE opt-in (default false) — unpublishing always
 *  clears it, and it can only be true while published. `listUnderAffiliation`
 *  is a THIRD, separate opt-in (the OAI-PMH affiliation set): it requires
 *  indexing AND a ROR-resolved visible current position, and is cleared with
 *  either — the set key is re-derived from the stored document here, so the
 *  decision is made on what the CV says now, not on a stale column.
 *  `institutionPage` is a FOURTH, separate opt-in (the public institution
 *  page), PINNED to the ROR ids the owner ticks: validated against the stored
 *  document's visible current positions (an unknown id throws
 *  `InstitutionConsentError`), cleared with indexing like the OAI listing, and
 *  — unlike the OAI key — never re-derived: omitted here, the stored choice is
 *  kept as-is, so a lapsed id survives to be re-asked rather than moved (and an
 *  already-stored id may be re-posted, so keeping a lapsed one while ticking a
 *  new affiliation is a valid request). */
export async function setPublishState(
  userId: string,
  published: boolean,
  indexable = false,
  listUnderAffiliation = false,
  institutionPage?: InstitutionPageRequest,
): Promise<PublishState> {
  const row = await prisma.cv.findUnique({ where: { userId } });
  if (!row) throw new CvNotFoundError();

  const parsed = safeParseCanonicalCv(row.document);
  const cv = parsed.success ? parsed.data : null;
  let slug = row.publicSlug;
  if (published && !slug) {
    const name = parsed.success ? parsed.data.owner.displayName : "cv";
    // Capability URL: a readable name plus an UNGUESSABLE 80-bit random suffix.
    // The old `row.id.slice(0,8)` exposed a time-ordered CUID prefix that, given
    // a known name + approximate signup time, narrowed enumeration — a privacy
    // risk for a tool keyed to real researcher identities.
    slug = `${cvSlug(name)}-${randomBytes(10).toString("hex")}`;
  }

  const publicIndexable = published && indexable;
  const currentRorId = cv ? currentRorKey(cv) : null;
  const currentAffiliationName = cv ? affiliationSetName(cv) : null;
  const listed = publicIndexable && listUnderAffiliation && currentRorId !== null;
  const stored: InstitutionConsentColumns = {
    showOnInstitutionPage: row.showOnInstitutionPage,
    consentedRorIds: row.consentedRorIds,
  };
  const requested = institutionPage
    ? resolveInstitutionConsent(
        institutionPage,
        cv ? visibleCurrentRorIds(cv) : [],
        stored.consentedRorIds,
      )
    : stored;
  const consent = publicIndexable ? requested : NO_CONSENT;
  const updated = await prisma.cv.update({
    where: { userId },
    data: {
      published,
      publicSlug: slug,
      publicIndexable,
      listUnderAffiliation: listed,
      currentRorId,
      currentAffiliationName,
      visibleCurrentRorIds: cv ? visibleCurrentRorIds(cv) : [],
      institutionAggregates: aggregatesColumn(cv),
      ...consent,
    },
    select: {
      published: true,
      publicSlug: true,
      publicIndexable: true,
      listUnderAffiliation: true,
      currentRorId: true,
    },
  });
  // Drop any cached render so unpublish/publish/index changes take effect at
  // once (the public route caches rendered pages for a short TTL).
  if (updated.publicSlug) invalidatePublicPage(updated.publicSlug);
  // Every institution page this CV was, or is now, consented to: a withdrawal
  // (explicit, or via indexing / unpublish) must be visible at once, not
  // within the TTL. Cheap — at most a handful of ids, usually none.
  purgeInstitutionPages([...stored.consentedRorIds, ...consent.consentedRorIds]);
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
    listUnderAffiliation: updated.listUnderAffiliation,
    affiliationRorId: updated.currentRorId,
    ...institutionPageState(cv, consent, {
      published: updated.published,
      publicIndexable: updated.publicIndexable,
    }),
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
  /** The provenance ledger of the STORED document (computed before projection —
   *  the projection strips the attribution/review signals it counts). Rendered
   *  by the footer only when the owner opted in (`display.showProvenance`). */
  provenanceLedger: ProvenanceLedger;
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
  return {
    cv,
    indexable: row.publicIndexable,
    coauthorCvs,
    recentlyAdded,
    provenanceLedger: provenanceLedger(parsed.data),
  };
}

/** The OAI set an opted-in CV is listed under, or undefined. The opt-in is the
 *  consent gate; the key alone (a CV that merely HAS that affiliation) is not. */
function affiliationSetSpec(row: {
  listUnderAffiliation: boolean;
  currentRorId: string | null;
}): string | undefined {
  return row.listUnderAffiliation && row.currentRorId ? rorSetSpec(row.currentRorId) : undefined;
}

/**
 * Indexable published CVs for OAI-PMH harvesting — a page of {slug, datestamp
 * (row `updatedAt`), public-projected cv, set membership} plus the total
 * matching count (for resumption). Gated on `publicIndexable` (the same
 * discovery opt-in the sitemap uses). With `set` (a bare ROR id), ONLY the CVs
 * that opted into the affiliation listing under that id match — never a CV that
 * merely carries the affiliation. Stable order by slug so offset paging is
 * consistent; `from`/`until` filter on `updatedAt`. Unparseable rows are skipped.
 */
export async function listPublicCvRecords(opts: {
  limit: number;
  offset: number;
  from?: Date;
  until?: Date;
  set?: string;
}): Promise<{ records: OaiRecordInput[]; total: number }> {
  const where: Prisma.CvWhereInput = {
    published: true,
    publicIndexable: true,
    publicSlug: { not: null },
  };
  if (opts.set) {
    where.listUnderAffiliation = true;
    where.currentRorId = opts.set;
  }
  if (opts.from || opts.until) {
    where.updatedAt = {
      ...(opts.from ? { gte: opts.from } : {}),
      ...(opts.until ? { lte: opts.until } : {}),
    };
  }
  const total = await prisma.cv.count({ where });
  const rows = await prisma.cv.findMany({
    where,
    select: {
      publicSlug: true,
      updatedAt: true,
      document: true,
      listUnderAffiliation: true,
      currentRorId: true,
    },
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
      setSpec: affiliationSetSpec(row),
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
  return {
    slug,
    datestamp: row.updatedAt,
    cv: projectCvForPublic(parsed.data),
    setSpec: affiliationSetSpec(row),
  };
}

/** Bound on the number of affiliation sets ListSets enumerates (one per
 *  distinct institution with an opted-in researcher — far above any near-term
 *  scale, and a hard ceiling on the query). */
const MAX_AFFILIATION_SETS = 5_000;

/**
 * The OAI-PMH `ror:<id>` sets: one per distinct current-affiliation ROR id
 * among the CVs that are published, indexable AND opted into the affiliation
 * listing. The `listUnderAffiliation` filter is the consent gate — a set must
 * contain only researchers who chose to be listed, so an institution with
 * researchers on SigmaCV but no opt-in has no set at all. The set name is the
 * institution's TRUSTED name — ROR's own record in the `Institution` table,
 * never anything from a CV (an owner controls a manual position's text) — and
 * falls back to the id; it is labelled as a self-declared affiliation by the
 * response builder, never as institutional output.
 */
export async function listAffiliationSets(): Promise<OaiSet[]> {
  const rows = await prisma.cv.findMany({
    where: {
      published: true,
      publicIndexable: true,
      listUnderAffiliation: true,
      currentRorId: { not: null },
    },
    distinct: ["currentRorId"],
    // One small denormalised column — never the documents (an unauthenticated
    // verb must not load every opted-in CV), and never `currentAffiliationName`.
    select: { currentRorId: true },
    orderBy: { currentRorId: "asc" },
    take: MAX_AFFILIATION_SETS,
  });
  const rorIds: string[] = [];
  for (const row of rows) {
    /* v8 ignore next -- the where clause already excludes null keys */
    if (!row.currentRorId) continue;
    rorIds.push(row.currentRorId);
  }
  const names = await trustedInstitutionNames(rorIds);
  return rorIds.map((rorId) => ({
    spec: rorSetSpec(rorId),
    rorId,
    name: names.get(rorId) ?? `ROR ${rorId}`,
  }));
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
