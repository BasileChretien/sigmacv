import {
  isHidden,
  type CanonicalCv,
  type CvItem,
  type CvSection,
  type DataLink,
  type Provenance,
} from "@/lib/canonical/schema";
import { toDataLink, withDataLinks, type RawDataLink } from "@/lib/canonical/dataLinks";
import { logger } from "@/lib/log";
import { isSoftwareItem } from "@/lib/canonical/softwareItem";
import {
  fetchCrossrefAbstract,
  fetchCrossrefCreditRoles,
  fetchCrossrefDataLinks,
  fetchCrossrefGapFields,
  fetchCrossrefTitleYear,
  fetchRetractionStatus,
  type CrossrefGapFields,
  type DoiTitleYear,
} from "@/lib/crossref/client";
import type { CreditRole } from "@/lib/canonical/credit";
import { fetchDataciteTitleYear } from "@/lib/datacite/client";
import { fetchEuropePmcByDoi, fetchEuropePmcDataLinks } from "@/lib/europepmc/client";
import { ICITE_BATCH_SIZE, fetchIciteByPmids, type IciteRecord } from "@/lib/icite/client";
import { fetchReplicationsForDois } from "@/lib/forrt/client";
import { bareDoiInput } from "@/lib/openalex/client";
import { fetchOpenCitationsCount } from "@/lib/opencitations/client";
import { fetchSoftwareHeritageArchival } from "@/lib/softwareheritage/client";
import { fetchScietyEvaluations, type PublicEvaluation } from "@/lib/sciety/client";
import { resolveInstitution } from "@/lib/ror/client";
import type { ResolvedAffiliation } from "@/lib/openalex/resolveAuthor";
import type { OrcidPosition } from "@/lib/orcid/client";
import type { CslItem } from "@/types/csl";

/**
 * Optional, network-backed enrichment of the canonical CV.
 *
 * Kept OUT of `buildCanonicalCv` (which stays pure + synchronous): the build
 * assembles the document from already-fetched data, and these passes layer
 * external lookups on top. Both are bounded, concurrency-limited and fail-soft,
 * and both are IMMUTABLE (return new objects).
 *
 *  - Crossref: fills bibliographic gaps (journal, volume/issue, pages) on works
 *    that have a DOI but incomplete OpenAlex metadata. POST-build.
 *  - ROR: canonicalizes free-text institution names. PRE-build (so the same
 *    institution from ORCID and OpenAlex de-duplicates and renders consistently).
 */

const CROSSREF_MAX_ENRICH = 50;
const CONCURRENCY = 5;

/**
 * Wall-clock budget for ONE per-work lookup pass (data links, OpenCitations,
 * Software Heritage, Sciety, iCite, retractions). A pass stops LAUNCHING lookups
 * once it has run this long — in-flight ones finish — and every target it did
 * not reach is left unstamped, so the rotation picks it up next sync. Without
 * this, a single dead upstream (Europe PMC's `datalinks` endpoint hanging, 2026-09-07)
 * turned a ~10 s re-sync into a ~250 s one: the per-work timeouts bound each
 * call, not the pass.
 */
export const ENRICH_PASS_BUDGET_MS = 30_000;

/** A pass's deadline: `expired()` once the budget has elapsed. */
interface PassBudget {
  expired: () => boolean;
}

function withPassBudget(ms: number = ENRICH_PASS_BUDGET_MS): PassBudget {
  const deadline = Date.now() + ms;
  return { expired: () => Date.now() >= deadline };
}

/**
 * Run an async mapper over items with a fixed concurrency cap (order preserved).
 * With a `budget`, no further item is STARTED once it has expired: the returned
 * array then covers only the launched prefix of `items` (workers pull from a
 * shared cursor, so what was launched is always exactly `items.slice(0, n)`).
 */
async function mapBounded<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
  budget?: PassBudget,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < items.length && !budget?.expired()) {
      const i = cursor++;
      results[i] = await fn(items[i] as T, i);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results.slice(0, cursor);
}

/**
 * The per-work lookups of one bounded pass under {@link ENRICH_PASS_BUDGET_MS}:
 * returns the targets actually examined (a prefix of `targets`) with their
 * results, and logs ONE info line when the budget deferred the rest.
 */
async function mapWithinBudget<T, R>(
  pass: string,
  targets: readonly T[],
  fn: (item: T, index: number) => Promise<R>,
  limit: number = CONCURRENCY,
): Promise<{ examined: T[]; results: R[] }> {
  const results = await mapBounded(targets, limit, fn, withPassBudget());
  const examined = targets.slice(0, results.length);
  if (examined.length < targets.length) {
    logger.info("enrich.pass_budget_exhausted", {
      pass,
      budgetMs: ENRICH_PASS_BUDGET_MS,
      examined: examined.length,
      deferred: targets.length - examined.length,
    });
  }
  return { examined, results };
}

function withSource(
  prov: Provenance,
  source:
    "crossref" | "datacite" | "ror" | "forrt" | "opencitations" | "softwareheritage" | "sciety",
): Provenance {
  if (prov.sources.includes(source)) return prov;
  return { ...prov, sources: [...prov.sources, source] };
}

// ─── Crossref bibliographic gap-fill ─────────────────────────────────────────

/**
 * Merge Crossref gap fields into a CSL item, filling ONLY fields the base lacks.
 * OpenAlex remains authoritative — we never overwrite a value it already set.
 */
export function mergeCslGaps(base: CslItem, supp: CrossrefGapFields): CslItem {
  const out: CslItem = { ...base };
  const empty = (v: unknown) =>
    v === undefined || v === null || (typeof v === "string" && v.trim() === "");
  if (empty(out["container-title"]) && supp["container-title"]) {
    out["container-title"] = supp["container-title"];
  }
  if (empty(out.volume) && supp.volume) out.volume = supp.volume;
  if (empty(out.issue) && supp.issue) out.issue = supp.issue;
  if (empty(out.page) && supp.page) out.page = supp.page;
  if (empty(out.publisher) && supp.publisher) out.publisher = supp.publisher;
  if (empty(out.ISSN) && supp.ISSN) out.ISSN = supp.ISSN;
  return out;
}

/** A published item is worth enriching when it has a DOI but no journal name. */
function needsCrossref(item: CvItem): boolean {
  const csl = item.csl;
  return Boolean(csl?.DOI) && !csl?.["container-title"];
}

/**
 * Fill bibliographic gaps from Crossref for works that have a DOI but no journal
 * title. Bounded to {@link CROSSREF_MAX_ENRICH} lookups per call. Returns a new
 * CV (and the original, untouched, if nothing needed or could be enriched).
 */
export async function enrichCvWithCrossref(cv: CanonicalCv, mailto: string): Promise<CanonicalCv> {
  // Collect (sectionIndex, itemIndex, doi) for every gap-having item, capped.
  const targets: Array<{ s: number; i: number; doi: string }> = [];
  cv.sections.forEach((section, s) => {
    section.items.forEach((item, i) => {
      if (targets.length >= CROSSREF_MAX_ENRICH) return;
      if (needsCrossref(item) && item.csl?.DOI) {
        targets.push({ s, i, doi: item.csl.DOI });
      }
    });
  });
  if (targets.length === 0) return cv;

  const fetched = await mapBounded(targets, CONCURRENCY, (t) =>
    fetchCrossrefGapFields(t.doi, mailto),
  );

  // Index successful gap-fills by "section:item" for an immutable rebuild.
  const fills = new Map<string, CrossrefGapFields>();
  targets.forEach((t, idx) => {
    const supp = fetched[idx];
    if (supp) fills.set(`${t.s}:${t.i}`, supp);
  });
  if (fills.size === 0) return cv;

  const sections = cv.sections.map((section, s) => ({
    ...section,
    items: section.items.map((item, i) => {
      const supp = fills.get(`${s}:${i}`);
      return supp && item.csl
        ? {
            ...item,
            csl: mergeCslGaps(item.csl, supp),
            meta: { ...item.meta, enriched: true },
          }
        : item;
    }),
  }));

  return {
    ...cv,
    sections,
    provenance: withSource(cv.provenance, "crossref"),
  };
}

// ─── Crossref abstract gap-fill ──────────────────────────────────────────────

const ABSTRACT_MAX_ENRICH = 100;

/**
 * Fill missing abstracts from Crossref for citation works that have a DOI but no
 * abstract yet (OpenAlex carries no abstract for many works — older records, some
 * types). Bounded to {@link ABSTRACT_MAX_ENRICH} lookups per call (each a tiny
 * `select=abstract` query), concurrency-limited, fail-soft and immutable. Skips
 * hidden / non-citation items. A gap-filled abstract is PERSISTED across re-sync by
 * `build.ts`, so once filled a work is no longer a target (no perpetual re-fetch).
 */
export async function enrichCvWithAbstracts(cv: CanonicalCv, mailto: string): Promise<CanonicalCv> {
  const targets: Array<{ s: number; i: number; doi: string }> = [];
  cv.sections.forEach((section, s) => {
    section.items.forEach((item, i) => {
      if (targets.length >= ABSTRACT_MAX_ENRICH) return;
      const csl = item.csl;
      if (csl?.DOI && !csl.abstract && !isHidden(item)) targets.push({ s, i, doi: csl.DOI });
    });
  });
  if (targets.length === 0) return cv;

  const fetched = await mapBounded(targets, CONCURRENCY, (t) =>
    fetchCrossrefAbstract(t.doi, mailto),
  );

  const abstracts = new Map<string, string>();
  targets.forEach((t, idx) => {
    const abs = fetched[idx];
    if (abs) abstracts.set(`${t.s}:${t.i}`, abs);
  });
  if (abstracts.size === 0) return cv;

  const sections = cv.sections.map((section, s) => ({
    ...section,
    items: section.items.map((item, i) => {
      const abs = abstracts.get(`${s}:${i}`);
      return abs && item.csl ? { ...item, csl: { ...item.csl, abstract: abs } } : item;
    }),
  }));

  return { ...cv, sections, provenance: withSource(cv.provenance, "crossref") };
}

// ─── Rotation for the bounded per-sync passes ────────────────────────────────

/** One candidate item of a bounded pass: its position plus the pass's sentinel. */
interface RotationTarget {
  s: number;
  i: number;
  /** The pass's `meta.*CheckedAt` sentinel at the start of this run — undefined
   *  for an item the pass has never examined. */
  checkedAt?: string;
}

const posKey = (t: Pick<RotationTarget, "s" | "i">): string => `${t.s}:${t.i}`;

/**
 * Order + cap a bounded pass's candidates so its per-sync budget ROTATES through
 * the whole CV: never-examined items first (in CV order), then the rest
 * oldest-examined first, cut at `cap`. The passes stamp every item they examine
 * (hit or miss) with their sentinel, and the build carries the sentinel across
 * re-sync — without both, a CV larger than the cap had the same head re-queried
 * on every sync and its tail never reached. Pure (never mutates the input).
 */
function rotationQueue<T extends RotationTarget>(candidates: readonly T[], cap: number): T[] {
  const fresh = candidates.filter((t) => t.checkedAt === undefined);
  const known = candidates
    .filter((t) => t.checkedAt !== undefined)
    .sort((a, b) => (a.checkedAt ?? "").localeCompare(b.checkedAt ?? ""));
  return [...fresh, ...known].slice(0, cap);
}

/**
 * Apply a bounded pass's outcome immutably: every examined item gets `stamp`
 * (the pass's sentinel) merged into its meta, and a hit additionally gets its
 * `hits` entry merged on top. Items the pass did not examine are returned as-is.
 * A miss therefore never removes an earlier find — only a fresh hit overwrites.
 */
function applyPass(
  cv: CanonicalCv,
  targets: readonly RotationTarget[],
  hits: ReadonlyMap<string, Partial<CvItem["meta"]>>,
  stamp: Partial<CvItem["meta"]>,
): CvSection[] {
  const examined = new Set(targets.map(posKey));
  return cv.sections.map((section, s) => ({
    ...section,
    items: section.items.map((item, i) => {
      const key = posKey({ s, i });
      if (!examined.has(key)) return item;
      return { ...item, meta: { ...item.meta, ...stamp, ...(hits.get(key) ?? {}) } };
    }),
  }));
}

// ─── NIH iCite RCR enrichment ────────────────────────────────────────────────

const ICITE_MAX_ENRICH = 500;

/** True when the item already carries ANY iCite field. */
function hasIciteData(meta: CvItem["meta"]): boolean {
  return (
    meta.rcr !== undefined ||
    meta.clinicalCitations !== undefined ||
    meta.isClinical !== undefined ||
    meta.apt !== undefined
  );
}

/**
 * Fold the NIH iCite record — Relative Citation Ratio plus the translational
 * fields (clinical-citation count, is-clinical flag, APT) — onto works that carry
 * a PMID (one batched lookup — the client chunks internally), capped at
 * {@link ICITE_MAX_ENRICH} works per sync. All of it is field-normalized-or-
 * factual but BIOMEDICAL-ONLY. RCR is stored so the opt-in RCR-mean metric
 * recomputes over the curated works; the translational fields are per-work only
 * (never aggregated).
 *
 * The build carries the fields AND the `meta.iciteCheckedAt` sentinel across
 * re-sync, and this pass stamps every work it examines (hit or miss), so the
 * budget rotates never-checked-first, then oldest-checked ({@link rotationQueue})
 * — a work's figures are refreshed when its turn comes round rather than
 * recomputed for the same first {@link ICITE_MAX_ENRICH} works forever. A work
 * that carries iCite data from before the sentinel existed counts as checked
 * (oldest). A miss never clears an earlier value. Fail-soft + immutable: returns
 * the original CV untouched only when there is nothing to examine.
 */
export async function enrichCvWithIcite(
  cv: CanonicalCv,
  now: string = new Date().toISOString(),
): Promise<CanonicalCv> {
  const candidates: Array<RotationTarget & { pmid: string }> = [];
  cv.sections.forEach((section, s) => {
    section.items.forEach((item, i) => {
      const pmid = item.meta.pmid;
      if (!pmid) return;
      const checkedAt = item.meta.iciteCheckedAt ?? (hasIciteData(item.meta) ? "" : undefined);
      candidates.push({ s, i, pmid, checkedAt });
    });
  });
  const targets = rotationQueue(candidates, ICITE_MAX_ENRICH);
  if (targets.length === 0) return cv;

  // Batched by the client's own page size, one batch at a time, so the pass
  // budget can stop before a later batch is launched (the client batches
  // internally too, but a single call could not be cut short).
  const batches: Array<typeof targets> = [];
  for (let i = 0; i < targets.length; i += ICITE_BATCH_SIZE) {
    batches.push(targets.slice(i, i + ICITE_BATCH_SIZE));
  }
  const { examined, results } = await mapWithinBudget(
    "icite.batches",
    batches,
    (batch) => fetchIciteByPmids(batch.map((t) => t.pmid)),
    1,
  );
  const checked = examined.flat();
  const byPmid = new Map<string, IciteRecord>(results.flatMap((m) => [...m]));
  const hits = new Map<string, Partial<CvItem["meta"]>>();
  for (const t of checked) {
    const rec = byPmid.get(t.pmid);
    if (rec) hits.set(posKey(t), rec);
  }
  return { ...cv, sections: applyPass(cv, checked, hits, { iciteCheckedAt: now }) };
}

// ─── Retraction flagging (Crossref / Retraction Watch) ───────────────────────

const RETRACTION_MAX_CHECK = 100;

/**
 * Flag works Crossref records as retracted (`meta.retracted`). Checks DOI-bearing,
 * non-hidden items not already flagged (a retraction is not undone, so a flagged
 * work leaves the queue for good), bounded to {@link RETRACTION_MAX_CHECK}
 * lookups per sync, concurrency-limited and fail-soft. Every examined work is
 * stamped `meta.retractionCheckedAt` (hit or miss) and the build carries it, so
 * the budget rotates never-checked-first, then oldest-checked
 * ({@link rotationQueue}) — a newly retracted work is still picked up, and a CV
 * larger than the cap is covered over successive syncs. Immutable; returns the
 * original CV only when there is nothing to check.
 */
export async function enrichCvWithRetractions(
  cv: CanonicalCv,
  mailto: string,
  now: string = new Date().toISOString(),
): Promise<CanonicalCv> {
  const candidates: Array<RotationTarget & { doi: string }> = [];
  cv.sections.forEach((section, s) => {
    section.items.forEach((item, i) => {
      const doi = item.csl?.DOI;
      if (doi && item.meta.retracted !== true && !isHidden(item)) {
        candidates.push({ s, i, doi, checkedAt: item.meta.retractionCheckedAt });
      }
    });
  });
  const targets = rotationQueue(candidates, RETRACTION_MAX_CHECK);
  if (targets.length === 0) return cv;

  const { examined, results } = await mapWithinBudget("retractions", targets, (t) =>
    fetchRetractionStatus(t.doi, mailto),
  );
  const hits = new Map<string, Partial<CvItem["meta"]>>();
  examined.forEach((t, idx) => {
    if (results[idx]) hits.set(posKey(t), { retracted: true });
  });
  return { ...cv, sections: applyPass(cv, examined, hits, { retractionCheckedAt: now }) };
}

// ─── CRediT contributor roles (Crossref deposit, owner matched by ORCID) ─────

const CREDIT_MAX_ENRICH = 100;

/**
 * Fold the account holder's CRediT roles from the publisher's Crossref deposit
 * onto DOI-bearing, non-hidden citation works that carry NO roles yet. Bounded
 * to {@link CREDIT_MAX_ENRICH} lookups (each a tiny `select=author` query),
 * concurrency-limited, fail-soft and immutable. A work whose roles are already
 * set — by an earlier Crossref pass or, crucially, SELF-DECLARED in the editor —
 * is never a target, so a self-declaration can never be overwritten. Roles are
 * carried across re-sync by `build.ts`, so a filled work isn't re-fetched.
 */
export async function enrichCvWithCreditRoles(
  cv: CanonicalCv,
  ownerOrcid: string,
  mailto: string,
): Promise<CanonicalCv> {
  const targets: Array<{ s: number; i: number; doi: string }> = [];
  cv.sections.forEach((section, s) => {
    section.items.forEach((item, i) => {
      if (targets.length >= CREDIT_MAX_ENRICH) return;
      const doi = item.csl?.DOI;
      if (doi && item.meta.creditRoles === undefined && !isHidden(item)) {
        targets.push({ s, i, doi });
      }
    });
  });
  if (targets.length === 0) return cv;

  const fetched = await mapBounded(targets, CONCURRENCY, (t) =>
    fetchCrossrefCreditRoles(t.doi, ownerOrcid, mailto),
  );
  const roles = new Map<string, CreditRole[]>();
  targets.forEach((t, idx) => {
    const r = fetched[idx];
    if (r && r.length > 0) roles.set(`${t.s}:${t.i}`, r);
  });
  if (roles.size === 0) return cv;

  const sections = cv.sections.map((section, s) => ({
    ...section,
    items: section.items.map((item, i) => {
      const r = roles.get(`${s}:${i}`);
      return r
        ? {
            ...item,
            meta: { ...item.meta, creditRoles: r, creditRolesSource: "crossref" as const },
          }
        : item;
    }),
  }));
  return { ...cv, sections, provenance: withSource(cv.provenance, "crossref") };
}

// ─── Open data / code links (Europe PMC + Crossref relations) ────────────────

export const DATA_LINKS_MAX_CHECK = 100;

interface DataLinkTarget extends RotationTarget {
  doi: string;
  pmid?: string;
}

/** What one work's lookups produced (all fail-soft: an empty result is normal). */
interface DataLinkFinds {
  links: DataLink[];
  pmid?: string;
  hasData?: boolean;
  /**
   * False when the Europe PMC data-links lookup did NOT complete — the endpoint
   * failed, or the breaker below was already open and it was skipped. Such a
   * work keeps whatever the other lookups found but is NOT stamped as checked,
   * so the rotation retries it next sync.
   */
  complete: boolean;
}

/** Consecutive Europe PMC data-links failures that open the breaker for the rest of the pass. */
export const DATA_LINKS_BREAKER_THRESHOLD = 3;

/**
 * Per-pass circuit breaker for Europe PMC's `datalinks` endpoint. Local, mutable
 * state scoped to ONE pass invocation (like `mapBounded`'s cursor): after
 * {@link DATA_LINKS_BREAKER_THRESHOLD} consecutive endpoint failures the pass
 * stops calling the endpoint — the cheap search + Crossref lookups still run —
 * and logs the outage ONCE at the end instead of once per work.
 */
interface DataLinksBreaker {
  consecutiveFailures: number;
  open: boolean;
  skipped: number;
}

/**
 * The Europe PMC data-links lookup under the breaker: `null` when it did not
 * complete (skipped because the breaker is open, or the endpoint failed).
 */
async function fetchDataLinksUnderBreaker(
  pmid: string,
  breaker: DataLinksBreaker,
): Promise<RawDataLink[] | null> {
  if (breaker.open) {
    breaker.skipped += 1;
    return null;
  }
  const links = await fetchEuropePmcDataLinks(pmid);
  if (links === null) {
    breaker.consecutiveFailures += 1;
    if (breaker.consecutiveFailures >= DATA_LINKS_BREAKER_THRESHOLD) breaker.open = true;
    return null;
  }
  breaker.consecutiveFailures = 0;
  return links;
}

/**
 * The lookups for one work. Crossref's relation record and the Europe PMC search
 * run in parallel; the Europe PMC data-link list is fetched only when the record
 * says the work HAS data (or when Europe PMC didn't answer but the work already
 * carries a PMID — then one direct data-links call is the only way to know).
 */
async function lookupDataLinks(
  t: DataLinkTarget,
  mailto: string,
  breaker: DataLinksBreaker,
): Promise<DataLinkFinds> {
  const [crossref, record] = await Promise.all([
    fetchCrossrefDataLinks(t.doi, mailto),
    fetchEuropePmcByDoi(t.doi),
  ]);
  const pmid = record?.pmid ?? t.pmid;
  const tryEuropePmc = Boolean(pmid) && (record ? record.hasData !== false : true);
  const europepmc = tryEuropePmc ? await fetchDataLinksUnderBreaker(pmid!, breaker) : [];
  const links: DataLink[] = [];
  for (const raw of [...(europepmc ?? []), ...crossref]) {
    const link = toDataLink(raw);
    if (link) links.push(link);
  }
  return { links, pmid: record?.pmid, hasData: record?.hasData, complete: europepmc !== null };
}

/**
 * Attach open data / code links (`meta.dataLinks`) to DOI-bearing, non-hidden
 * citation works: Europe PMC's data links (text-mined + publisher-asserted
 * accessions, gated on its `hasData` flag) and Crossref's supplement/part
 * relations. Also records Europe PMC's `hasData` as `meta.hasDataStatement` and
 * back-fills a missing `meta.pmid` from the DOI match (which the iCite RCR pass
 * then benefits from). Bounded to {@link DATA_LINKS_MAX_CHECK} works per sync,
 * concurrency-limited, fail-soft and immutable — new finds merge with the
 * carried links; a miss never removes one.
 *
 * Every work the pass EXAMINES is stamped `meta.dataLinksCheckedAt = now`,
 * whether the lookup found anything or not — a work Europe PMC never indexed
 * and Crossref has no relation for is still a checked work, not an unchecked
 * one. Without this a permanent miss stayed "unchecked" forever (no
 * `dataLinks`/`hasDataStatement` to show for it) and was re-queried every
 * sync, and a CV with more than {@link DATA_LINKS_MAX_CHECK} such works never
 * finished covering its tail. Never-checked works (no `dataLinksCheckedAt`)
 * go first; the remainder is ordered oldest-checked-first, so the budget
 * rotates through the whole CV over successive syncs instead of re-querying
 * the same head every time. Returns the original CV when nothing changed
 * (including the timestamp — i.e. there was nothing to check).
 *
 * Two guards keep a dead upstream from stalling the sync (2026-09-07 incident):
 * the pass runs under {@link ENRICH_PASS_BUDGET_MS}, and Europe PMC's
 * data-links endpoint is circuit-broken for the rest of the pass after
 * {@link DATA_LINKS_BREAKER_THRESHOLD} consecutive failures. A work whose
 * data-links lookup failed or was skipped is NOT stamped (only fully-completed
 * lookups are), so the rotation retries it next sync.
 */
export async function enrichCvWithDataLinks(
  cv: CanonicalCv,
  mailto: string,
  now: string = new Date().toISOString(),
): Promise<CanonicalCv> {
  const candidates: DataLinkTarget[] = [];
  cv.sections.forEach((section, s) => {
    section.items.forEach((item, i) => {
      const doi = item.csl?.DOI;
      if (!doi || isHidden(item)) return;
      candidates.push({ s, i, doi, pmid: item.meta.pmid, checkedAt: item.meta.dataLinksCheckedAt });
    });
  });
  const targets = rotationQueue(candidates, DATA_LINKS_MAX_CHECK);
  if (targets.length === 0) return cv;

  const breaker: DataLinksBreaker = { consecutiveFailures: 0, open: false, skipped: 0 };
  const { examined, results: finds } = await mapWithinBudget("dataLinks", targets, (t) =>
    lookupDataLinks(t, mailto, breaker),
  );
  if (breaker.open) {
    logger.warn("europepmc.datalinks_circuit_open", {
      consecutiveFailures: DATA_LINKS_BREAKER_THRESHOLD,
      skipped: breaker.skipped,
      examined: examined.length,
    });
  }
  const byPos = new Map<string, DataLinkFinds>();
  examined.forEach((t, idx) => byPos.set(`${t.s}:${t.i}`, finds[idx]!));

  let changed = false;
  const sections = cv.sections.map((section, s) => ({
    ...section,
    items: section.items.map((item, i) => {
      const find = byPos.get(`${s}:${i}`);
      if (!find) return item;
      let next = withDataLinks(item, find.links);
      if (find.hasData !== undefined && item.meta.hasDataStatement !== find.hasData) {
        next = { ...next, meta: { ...next.meta, hasDataStatement: find.hasData } };
      }
      if (find.pmid && !item.meta.pmid) next = { ...next, meta: { ...next.meta, pmid: find.pmid } };
      // Only a work whose lookups ALL completed is stamped; one whose data-links
      // call failed or was skipped by the open breaker stays "unchecked" so the
      // rotation retries it next sync (its other finds are still kept).
      if (find.complete && next.meta.dataLinksCheckedAt !== now) {
        next = { ...next, meta: { ...next.meta, dataLinksCheckedAt: now } };
      }
      if (next !== item) changed = true;
      return next;
    }),
  }));
  return changed ? { ...cv, sections } : cv;
}

// ─── FORRT / FReD replication evidence ────────────────────────────────────────

const FORRT_MAX_ENRICH = 200;

interface ForrtTarget extends RotationTarget {
  doi: string;
}

/**
 * Fold FORRT Replication Database (FReD) evidence onto works: `meta.replications`
 * on a work that has been replicated, `meta.replicationOf` on a work that IS a
 * replication. DOI-matched (identifier data), so this is auto-included — no
 * review flag. Both fields (and the `replicationsCheckedAt` sentinel below) are
 * carried across re-sync by the build, so a large CV is covered over successive
 * syncs rather than losing progress on every rebuild.
 *
 * Bounded to {@link FORRT_MAX_ENRICH} works per sync, works never checked before
 * FIRST, then oldest-checked ({@link rotationQueue}; a genuine miss still stamps
 * `meta.replicationsCheckedAt`, which is what lets it "graduate" out of the
 * always-fresh queue instead of being re-checked forever while works past the
 * cap are never reached) — same rotation as the data-links enrichment. Fail-soft (an empty/unreachable `ForrtReplication` table
 * is a no-op). Immutable; returns the original CV untouched when nothing to check.
 */
export async function enrichCvWithForrtReplications(cv: CanonicalCv): Promise<CanonicalCv> {
  const candidates: ForrtTarget[] = [];
  cv.sections.forEach((section, s) => {
    section.items.forEach((item, i) => {
      const doi = item.csl?.DOI ?? item.meta.doi;
      if (!doi || isHidden(item)) return;
      // Evidence recorded before the sentinel existed counts as checked (oldest).
      const hasEvidence =
        item.meta.replications !== undefined || item.meta.replicationOf !== undefined;
      const checkedAt = item.meta.replicationsCheckedAt ?? (hasEvidence ? "" : undefined);
      candidates.push({ s, i, doi, checkedAt });
    });
  });
  const targets = rotationQueue(candidates, FORRT_MAX_ENRICH);
  if (targets.length === 0) return cv;

  const { replicatedBy, replicationOf } = await fetchReplicationsForDois(targets.map((t) => t.doi));

  const checkedAt = new Date().toISOString();
  let changed = false;
  let anyMatch = false;
  const sections = cv.sections.map((section, s) => ({
    ...section,
    items: section.items.map((item, i) => {
      const target = targets.find((t) => t.s === s && t.i === i);
      if (!target) return item;
      // The client normalizes every DOI it queries by the same function before
      // keying its result maps — re-normalize here so the lookup matches.
      const doi = bareDoiInput(target.doi);
      if (!doi) return item;
      const replications = replicatedBy.get(doi);
      const of = replicationOf.get(doi);
      if (replications || of) anyMatch = true;
      changed = true;
      return {
        ...item,
        meta: {
          ...item.meta,
          ...(replications ? { replications: replications.slice(0, 10) } : {}),
          ...(of ? { replicationOf: of } : {}),
          // Stamped on every item the pass actually examined — including a
          // miss — so it moves from "fresh" to "known" on the next sync.
          replicationsCheckedAt: checkedAt,
        },
      };
    }),
  }));
  if (!changed) return cv;
  return {
    ...cv,
    sections,
    provenance: anyMatch ? withSource(cv.provenance, "forrt") : cv.provenance,
  };
}

// ─── OpenCitations: independent citation counts ──────────────────────────────

const OPENCITATIONS_MAX_ENRICH = 100;

/**
 * Fold an OpenCitations citation count onto DOI-bearing, non-hidden works
 * (`meta.citedByOpenCitations`) — an independently-computed count alongside
 * OpenAlex's own `citedByCount`, so a reader can see the two don't always agree.
 * Bounded to {@link OPENCITATIONS_MAX_ENRICH} lookups per sync,
 * concurrency-limited, fail-soft and immutable. Every examined work is stamped
 * `meta.openCitationsCheckedAt` (hit or miss) and the build carries both fields,
 * so the budget rotates never-checked-first, then oldest-checked
 * ({@link rotationQueue}): a count is refreshed when the work's turn comes round,
 * and a miss never clears an earlier count. Returns the original CV untouched
 * only when there is nothing to check; provenance gains "opencitations" only on
 * a hit.
 */
export async function enrichCvWithOpenCitations(
  cv: CanonicalCv,
  now: string = new Date().toISOString(),
): Promise<CanonicalCv> {
  const candidates: Array<RotationTarget & { doi: string }> = [];
  cv.sections.forEach((section, s) => {
    section.items.forEach((item, i) => {
      const doi = item.csl?.DOI;
      if (doi && !isHidden(item)) {
        candidates.push({ s, i, doi, checkedAt: item.meta.openCitationsCheckedAt });
      }
    });
  });
  const targets = rotationQueue(candidates, OPENCITATIONS_MAX_ENRICH);
  if (targets.length === 0) return cv;

  const { examined, results: fetched } = await mapWithinBudget("openCitations", targets, (t) =>
    fetchOpenCitationsCount(t.doi),
  );
  const hits = new Map<string, Partial<CvItem["meta"]>>();
  examined.forEach((t, idx) => {
    const count = fetched[idx];
    if (count !== null && count !== undefined) hits.set(posKey(t), { citedByOpenCitations: count });
  });
  const sections = applyPass(cv, examined, hits, { openCitationsCheckedAt: now });
  return {
    ...cv,
    sections,
    provenance: hits.size > 0 ? withSource(cv.provenance, "opencitations") : cv.provenance,
  };
}

// ─── Software Heritage: archival status of software items ───────────────────

const SOFTWARE_HERITAGE_MAX_ENRICH = 50;

/** The sections a software item can live in: its own Software section, plus a
 *  Datasets section for a software-typed straggler (pre-split document). */
const SOFTWARE_HERITAGE_SECTIONS = new Set<CvSection["type"]>(["software", "datasets"]);

/**
 * Fold Software Heritage archival status onto software items (the Software
 * section, or a software-typed item still filed under Datasets) that carry a
 * source-repository URL (`meta.repositoryUrl`) and aren't already flagged
 * archived (an archived repository stays archived, so it leaves the queue).
 * Bounded to {@link SOFTWARE_HERITAGE_MAX_ENRICH} lookups per sync,
 * concurrency-limited, fail-soft (a 404 "not archived" is not an error) and
 * immutable. Every examined item is stamped `meta.swhCheckedAt` (hit or miss)
 * and the build carries it, so the budget rotates never-checked-first, then
 * oldest-checked ({@link rotationQueue}) and a newly-archived repo still picks
 * up its SWHID on a later turn. Returns the original CV untouched only when
 * there is nothing to check; provenance gains "softwareheritage" only on a hit.
 */
export async function enrichCvWithSoftwareHeritage(
  cv: CanonicalCv,
  now: string = new Date().toISOString(),
): Promise<CanonicalCv> {
  const candidates: Array<RotationTarget & { url: string }> = [];
  cv.sections.forEach((section, s) => {
    if (!SOFTWARE_HERITAGE_SECTIONS.has(section.type)) return;
    section.items.forEach((item, i) => {
      const url = item.meta.repositoryUrl;
      const software = section.type === "software" || isSoftwareItem(item);
      if (url && !item.meta.swhid && software && !isHidden(item)) {
        candidates.push({ s, i, url, checkedAt: item.meta.swhCheckedAt });
      }
    });
  });
  const targets = rotationQueue(candidates, SOFTWARE_HERITAGE_MAX_ENRICH);
  if (targets.length === 0) return cv;

  const { examined, results: fetched } = await mapWithinBudget("softwareHeritage", targets, (t) =>
    fetchSoftwareHeritageArchival(t.url),
  );
  const hits = new Map<string, Partial<CvItem["meta"]>>();
  examined.forEach((t, idx) => {
    const result = fetched[idx];
    if (result) {
      hits.set(posKey(t), {
        swhid: result.swhid,
        ...(result.archivedAt ? { swhArchivedAt: result.archivedAt } : {}),
      });
    }
  });
  const sections = applyPass(cv, examined, hits, { swhCheckedAt: now });
  return {
    ...cv,
    sections,
    provenance: hits.size > 0 ? withSource(cv.provenance, "softwareheritage") : cv.provenance,
  };
}

// ─── Sciety: public evaluations of preprints ─────────────────────────────────

const SCIETY_MAX_ENRICH = 50;

/**
 * Fold Sciety's aggregated public evaluations onto DOI-bearing, non-hidden
 * preprints (`meta.publicEvaluations`). Bounded to {@link SCIETY_MAX_ENRICH}
 * lookups per sync, concurrency-limited, fail-soft (a 404 "no evaluations" is
 * not an error) and immutable. Every examined preprint is stamped
 * `meta.publicEvaluationsCheckedAt` (hit or miss) and the build carries both
 * fields, so the budget rotates never-checked-first, then oldest-checked
 * ({@link rotationQueue}): a newly-published evaluation appears when the
 * preprint's turn comes round, and a miss never clears an earlier list. Returns
 * the original CV untouched only when there is nothing to check; provenance
 * gains "sciety" only on a hit.
 */
export async function enrichCvWithSciety(
  cv: CanonicalCv,
  now: string = new Date().toISOString(),
): Promise<CanonicalCv> {
  const candidates: Array<RotationTarget & { doi: string }> = [];
  cv.sections.forEach((section, s) => {
    if (section.type !== "preprints") return;
    section.items.forEach((item, i) => {
      const doi = item.csl?.DOI;
      if (doi && !isHidden(item)) {
        candidates.push({ s, i, doi, checkedAt: item.meta.publicEvaluationsCheckedAt });
      }
    });
  });
  const targets = rotationQueue(candidates, SCIETY_MAX_ENRICH);
  if (targets.length === 0) return cv;

  const { examined, results: fetched } = await mapWithinBudget("sciety", targets, (t) =>
    fetchScietyEvaluations(t.doi),
  );
  const hits = new Map<string, Partial<CvItem["meta"]>>();
  examined.forEach((t, idx) => {
    const list: PublicEvaluation[] | undefined = fetched[idx];
    if (list && list.length > 0) hits.set(posKey(t), { publicEvaluations: list });
  });
  const sections = applyPass(cv, examined, hits, { publicEvaluationsCheckedAt: now });
  return {
    ...cv,
    sections,
    provenance: hits.size > 0 ? withSource(cv.provenance, "sciety") : cv.provenance,
  };
}

// ─── ROR institution-name canonicalization ───────────────────────────────────

export interface InstitutionBundle {
  employments: OrcidPosition[];
  education: OrcidPosition[];
  distinctions: OrcidPosition[];
  service: OrcidPosition[];
  invitedPositions: OrcidPosition[];
  affiliations: ResolvedAffiliation[];
}

/**
 * Canonicalize every institution name across the ORCID + OpenAlex inputs via
 * ROR, BEFORE the canonical CV is built. Each distinct name is resolved once
 * (the ROR client also caches per process). Returns canonicalized copies plus
 * whether any name was actually changed (drives the "ror" provenance flag).
 */
export async function canonicalizeInstitutions(
  input: InstitutionBundle,
): Promise<{ result: InstitutionBundle; used: boolean }> {
  const names = new Set<string>();
  const add = (n: string | undefined) => {
    const t = (n ?? "").trim();
    if (t) names.add(t);
  };
  for (const p of input.employments) add(p.organization);
  for (const p of input.education) add(p.organization);
  for (const p of input.distinctions) add(p.organization);
  for (const p of input.service) add(p.organization);
  for (const p of input.invitedPositions) add(p.organization);
  for (const a of input.affiliations) add(a.institution);

  if (names.size === 0) return { result: input, used: false };

  const unique = [...names];
  const resolved = await mapBounded(unique, CONCURRENCY, (name) => resolveInstitution(name));

  // name → { canonical name?, rorId } for every CONFIDENT ROR match. The name is
  // only recorded when ROR returned a DIFFERENT string (so identical names are
  // left untouched), but the rorId is captured on ANY confident match so it can
  // be persisted even when the name didn't change.
  const matched = new Map<
    string,
    { name?: string; rorId?: string; names?: Record<string, string>; website?: string }
  >();
  unique.forEach((name, idx) => {
    const org = resolved[idx];
    if (!org) return;
    matched.set(name, {
      name: org.name && org.name !== name ? org.name : undefined,
      rorId: org.id || undefined,
      // Localized variants apply on ANY confident match (like the rorId), even
      // when the canonical name equals the user's free text — a ja CV can still
      // show 名古屋大学 for an item whose stored name is "Nagoya University".
      names: org.names,
      // The institution homepage (when ROR records one) — captured on any
      // confident match, like the rorId; the renderer prefers it as the link.
      website: org.website,
    });
  });
  if (matched.size === 0) return { result: input, used: false };
  // A name CHANGE drives the "ror" provenance flag (used). A pure id annotation
  // (name unchanged) is additive metadata and not a visible source contribution.
  const used = [...matched.values()].some((m) => m.name !== undefined);

  const mapPos = (p: OrcidPosition): OrcidPosition => {
    const m = matched.get(p.organization.trim());
    if (!m) return p;
    return {
      ...p,
      organization: m.name ?? p.organization,
      rorId: m.rorId ?? p.rorId,
      institutionNames: m.names ?? p.institutionNames,
      institutionUrl: m.website ?? p.institutionUrl,
    };
  };
  const mapAff = (a: ResolvedAffiliation): ResolvedAffiliation => {
    const m = matched.get(a.institution.trim());
    if (!m) return a;
    return {
      ...a,
      institution: m.name ?? a.institution,
      rorId: m.rorId ?? a.rorId,
      institutionNames: m.names ?? a.institutionNames,
      institutionUrl: m.website ?? a.institutionUrl,
    };
  };

  return {
    used,
    result: {
      employments: input.employments.map(mapPos),
      education: input.education.map(mapPos),
      distinctions: input.distinctions.map(mapPos),
      service: input.service.map(mapPos),
      invitedPositions: input.invitedPositions.map(mapPos),
      affiliations: input.affiliations.map(mapAff),
    },
  };
}

/** Stamp "ror" onto a freshly-built CV's provenance (used after canonicalization). */
export function withRorProvenance(cv: CanonicalCv): CanonicalCv {
  return { ...cv, provenance: withSource(cv.provenance, "ror") };
}

// ─── Supervision records: thesis DOI gap-fill + institution ROR ───────────────

const SUPERVISION_MAX_ENRICH = 20;

type ThesisLookup = DoiTitleYear & { source: "crossref" | "datacite" };

/** A thesis DOI lookup: Crossref first, then DataCite (repository-minted DOIs). */
async function fetchThesisTitleYear(doi: string, mailto: string): Promise<ThesisLookup | null> {
  const cr = await fetchCrossrefTitleYear(doi, mailto);
  if (cr) return { ...cr, source: "crossref" };
  const dc = await fetchDataciteTitleYear(doi);
  return dc ? { ...dc, source: "datacite" } : null;
}

/**
 * Enrich the owner-entered SUPERVISION records after a sync (they are never
 * sourced, only carried over — see build.ts):
 *  - a thesis DOI with no title and/or no end year → title + year gap-filled
 *    from Crossref, falling back to DataCite. The year fills `endYear` only when
 *    the record is not marked ongoing (a thesis year IS the completion year);
 *  - an institution name with no ROR id → canonical id + localized names +
 *    homepage from ROR (the same confident-match rule as positions).
 * Bounded to {@link SUPERVISION_MAX_ENRICH} records, concurrency-limited,
 * fail-soft and immutable; already-filled fields are never overwritten (the
 * owner's text always wins), and a filled field persists, so it is not re-fetched.
 */
export async function enrichCvWithSupervision(
  cv: CanonicalCv,
  mailto: string,
): Promise<CanonicalCv> {
  const s = cv.sections.findIndex((sec) => sec.type === "supervision");
  if (s < 0) return cv;
  const section = cv.sections[s]!;
  const needsThesis = (it: CvItem): boolean =>
    Boolean(it.meta.thesisDoi) &&
    (!it.meta.thesisTitle?.trim() ||
      (it.meta.endYear === undefined && it.meta.status !== "ongoing"));
  const needsRor = (it: CvItem): boolean => Boolean(it.meta.institution?.trim()) && !it.meta.rorId;
  const targets = section.items
    .map((it, i) => ({ it, i }))
    .filter(({ it }) => !isHidden(it) && (needsThesis(it) || needsRor(it)))
    .slice(0, SUPERVISION_MAX_ENRICH);
  if (targets.length === 0) return cv;

  const results = await mapBounded(targets, CONCURRENCY, async ({ it }) => ({
    thesis: needsThesis(it) ? await fetchThesisTitleYear(it.meta.thesisDoi!, mailto) : null,
    ror: needsRor(it) ? await resolveInstitution(it.meta.institution!.trim()) : null,
  }));

  let changed = false;
  const used = new Set<"crossref" | "datacite">();
  const items = section.items.map((it, i) => {
    const t = targets.findIndex((x) => x.i === i);
    if (t < 0) return it;
    const r = results[t]!;
    const meta = { ...it.meta };
    if (r.thesis) {
      if (!meta.thesisTitle?.trim() && r.thesis.title) meta.thesisTitle = r.thesis.title;
      if (meta.endYear === undefined && meta.status !== "ongoing" && r.thesis.year) {
        meta.endYear = r.thesis.year;
      }
      used.add(r.thesis.source);
    }
    if (r.ror) {
      meta.rorId = r.ror.id || undefined;
      meta.institutionNames = r.ror.names ?? meta.institutionNames;
      meta.institutionUrl = r.ror.website ?? meta.institutionUrl;
    }
    if (
      meta.thesisTitle === it.meta.thesisTitle &&
      meta.endYear === it.meta.endYear &&
      meta.rorId === it.meta.rorId
    ) {
      return it;
    }
    changed = true;
    return { ...it, meta };
  });
  if (!changed) return cv;
  const sections = cv.sections.map((sec, i) => (i === s ? { ...sec, items } : sec));
  // Provenance names whichever DOI registry actually answered.
  let provenance = cv.provenance;
  for (const src of used) provenance = withSource(provenance, src);
  return { ...cv, sections, provenance };
}
