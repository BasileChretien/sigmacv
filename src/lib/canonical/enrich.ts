import {
  isHidden,
  type CanonicalCv,
  type CvItem,
  type CvSection,
  type DataLink,
  type Provenance,
} from "@/lib/canonical/schema";
import { toDataLink, withDataLinks } from "@/lib/canonical/dataLinks";
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
import { fetchIciteByPmids } from "@/lib/icite/client";
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

/** Run an async mapper over items with a fixed concurrency cap (order preserved). */
async function mapBounded<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;
  async function worker(): Promise<void> {
    while (cursor < items.length) {
      const i = cursor++;
      results[i] = await fn(items[i] as T, i);
    }
  }
  const workers = Array.from({ length: Math.min(limit, items.length) }, worker);
  await Promise.all(workers);
  return results;
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

// ─── NIH iCite RCR enrichment ────────────────────────────────────────────────

const ICITE_MAX_ENRICH = 500;

/** True when the item already carries ANY iCite field (skip the re-lookup). */
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
 * a PMID but no iCite data yet (one batched lookup — the client chunks
 * internally), capped at {@link ICITE_MAX_ENRICH} works. All of it is
 * field-normalized-or-factual but BIOMEDICAL-ONLY; the build re-creates items
 * without these fields, so every sync recomputes them. RCR is stored so the
 * opt-in RCR-mean metric recomputes over the curated works; the translational
 * fields are per-work only (never aggregated). Fail-soft + immutable: returns the
 * original CV untouched when nothing matches or the lookup yields nothing.
 */
export async function enrichCvWithIcite(cv: CanonicalCv): Promise<CanonicalCv> {
  const pmids: string[] = [];
  for (const section of cv.sections) {
    for (const item of section.items) {
      if (pmids.length >= ICITE_MAX_ENRICH) break;
      if (item.meta.pmid && !hasIciteData(item.meta)) pmids.push(item.meta.pmid);
    }
  }
  if (pmids.length === 0) return cv;

  const byPmid = await fetchIciteByPmids(pmids);
  if (byPmid.size === 0) return cv;

  let changed = false;
  const sections = cv.sections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      if (!item.meta.pmid || hasIciteData(item.meta)) return item;
      const rec = byPmid.get(item.meta.pmid);
      if (!rec) return item;
      changed = true;
      return { ...item, meta: { ...item.meta, ...rec } };
    }),
  }));
  return changed ? { ...cv, sections } : cv;
}

// ─── Retraction flagging (Crossref / Retraction Watch) ───────────────────────

const RETRACTION_MAX_CHECK = 100;

/**
 * Flag works Crossref records as retracted (`meta.retracted`). Checks DOI-bearing,
 * non-hidden items not already flagged, bounded to {@link RETRACTION_MAX_CHECK}
 * lookups, concurrency-limited and fail-soft. Re-checks each sync so a newly
 * retracted work gets flagged. Immutable; returns the original CV when nothing
 * matched or nothing is retracted.
 */
export async function enrichCvWithRetractions(
  cv: CanonicalCv,
  mailto: string,
): Promise<CanonicalCv> {
  const targets: Array<{ s: number; i: number; doi: string }> = [];
  cv.sections.forEach((section, s) => {
    section.items.forEach((item, i) => {
      if (targets.length >= RETRACTION_MAX_CHECK) return;
      const doi = item.csl?.DOI;
      if (doi && item.meta.retracted !== true && !isHidden(item)) targets.push({ s, i, doi });
    });
  });
  if (targets.length === 0) return cv;

  const results = await mapBounded(targets, CONCURRENCY, (t) =>
    fetchRetractionStatus(t.doi, mailto),
  );
  const retracted = new Set<string>();
  targets.forEach((t, idx) => {
    if (results[idx]) retracted.add(`${t.s}:${t.i}`);
  });
  if (retracted.size === 0) return cv;

  const sections = cv.sections.map((section, s) => ({
    ...section,
    items: section.items.map((item, i) =>
      retracted.has(`${s}:${i}`) ? { ...item, meta: { ...item.meta, retracted: true } } : item,
    ),
  }));
  return { ...cv, sections };
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

interface DataLinkTarget {
  s: number;
  i: number;
  doi: string;
  pmid?: string;
  /** `meta.dataLinksCheckedAt` at the start of this pass — undefined for a
   *  never-checked work; used only to order the "known" bucket oldest-first. */
  checkedAt?: string;
}

/** What one work's lookups produced (all fail-soft: an empty result is normal). */
interface DataLinkFinds {
  links: DataLink[];
  pmid?: string;
  hasData?: boolean;
}

/**
 * The lookups for one work. Crossref's relation record and the Europe PMC search
 * run in parallel; the Europe PMC data-link list is fetched only when the record
 * says the work HAS data (or when Europe PMC didn't answer but the work already
 * carries a PMID — then one direct data-links call is the only way to know).
 */
async function lookupDataLinks(t: DataLinkTarget, mailto: string): Promise<DataLinkFinds> {
  const [crossref, record] = await Promise.all([
    fetchCrossrefDataLinks(t.doi, mailto),
    fetchEuropePmcByDoi(t.doi),
  ]);
  const pmid = record?.pmid ?? t.pmid;
  const tryEuropePmc = Boolean(pmid) && (record ? record.hasData !== false : true);
  const europepmc = tryEuropePmc ? await fetchEuropePmcDataLinks(pmid!) : [];
  const links: DataLink[] = [];
  for (const raw of [...europepmc, ...crossref]) {
    const link = toDataLink(raw);
    if (link) links.push(link);
  }
  return { links, pmid: record?.pmid, hasData: record?.hasData };
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
 */
export async function enrichCvWithDataLinks(
  cv: CanonicalCv,
  mailto: string,
  now: string = new Date().toISOString(),
): Promise<CanonicalCv> {
  const fresh: DataLinkTarget[] = [];
  const known: DataLinkTarget[] = [];
  cv.sections.forEach((section, s) => {
    section.items.forEach((item, i) => {
      const doi = item.csl?.DOI;
      if (!doi || isHidden(item)) return;
      const checkedAt = item.meta.dataLinksCheckedAt;
      const t = { s, i, doi, pmid: item.meta.pmid, checkedAt };
      (checkedAt === undefined ? fresh : known).push(t);
    });
  });
  known.sort((a, b) => (a.checkedAt ?? "").localeCompare(b.checkedAt ?? ""));
  const targets = [...fresh, ...known].slice(0, DATA_LINKS_MAX_CHECK);
  if (targets.length === 0) return cv;

  const finds = await mapBounded(targets, CONCURRENCY, (t) => lookupDataLinks(t, mailto));
  const byPos = new Map<string, DataLinkFinds>();
  targets.forEach((t, idx) => byPos.set(`${t.s}:${t.i}`, finds[idx]!));

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
      if (next.meta.dataLinksCheckedAt !== now) {
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

interface ForrtTarget {
  s: number;
  i: number;
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
 * FIRST (a genuine miss still stamps `meta.replicationsCheckedAt`, which is what
 * lets it "graduate" out of the always-fresh queue instead of being re-checked
 * forever while works past the cap are never reached) — same rotation as the
 * data-links enrichment. Fail-soft (an empty/unreachable `ForrtReplication` table
 * is a no-op). Immutable; returns the original CV untouched when nothing to check.
 */
export async function enrichCvWithForrtReplications(cv: CanonicalCv): Promise<CanonicalCv> {
  const fresh: ForrtTarget[] = [];
  const known: ForrtTarget[] = [];
  cv.sections.forEach((section, s) => {
    section.items.forEach((item, i) => {
      const doi = item.csl?.DOI ?? item.meta.doi;
      if (!doi || isHidden(item)) return;
      const t: ForrtTarget = { s, i, doi };
      const checked =
        item.meta.replications !== undefined ||
        item.meta.replicationOf !== undefined ||
        item.meta.replicationsCheckedAt !== undefined;
      (checked ? known : fresh).push(t);
    });
  });
  const targets = [...fresh, ...known].slice(0, FORRT_MAX_ENRICH);
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
 * Bounded to {@link OPENCITATIONS_MAX_ENRICH} lookups, concurrency-limited,
 * fail-soft and immutable. Re-checks each sync (like the retraction/RCR passes
 * above) so the count stays current; returns the original CV untouched when
 * nothing matched or nothing came back.
 */
export async function enrichCvWithOpenCitations(cv: CanonicalCv): Promise<CanonicalCv> {
  const targets: Array<{ s: number; i: number; doi: string }> = [];
  cv.sections.forEach((section, s) => {
    section.items.forEach((item, i) => {
      if (targets.length >= OPENCITATIONS_MAX_ENRICH) return;
      const doi = item.csl?.DOI;
      if (doi && !isHidden(item)) targets.push({ s, i, doi });
    });
  });
  if (targets.length === 0) return cv;

  const fetched = await mapBounded(targets, CONCURRENCY, (t) => fetchOpenCitationsCount(t.doi));
  const counts = new Map<string, number>();
  targets.forEach((t, idx) => {
    const count = fetched[idx];
    if (count !== null && count !== undefined) counts.set(`${t.s}:${t.i}`, count);
  });
  if (counts.size === 0) return cv;

  const sections = cv.sections.map((section, s) => ({
    ...section,
    items: section.items.map((item, i) => {
      const count = counts.get(`${s}:${i}`);
      return count === undefined
        ? item
        : { ...item, meta: { ...item.meta, citedByOpenCitations: count } };
    }),
  }));
  return { ...cv, sections, provenance: withSource(cv.provenance, "opencitations") };
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
 * archived. Bounded to {@link SOFTWARE_HERITAGE_MAX_ENRICH} lookups,
 * concurrency-limited, fail-soft (a 404 "not archived" is not an error) and
 * immutable. Re-checks each sync so a newly-archived repo picks up its SWHID.
 */
export async function enrichCvWithSoftwareHeritage(cv: CanonicalCv): Promise<CanonicalCv> {
  const targets: Array<{ s: number; i: number; url: string }> = [];
  cv.sections.forEach((section, s) => {
    if (!SOFTWARE_HERITAGE_SECTIONS.has(section.type)) return;
    section.items.forEach((item, i) => {
      if (targets.length >= SOFTWARE_HERITAGE_MAX_ENRICH) return;
      const url = item.meta.repositoryUrl;
      const software = section.type === "software" || isSoftwareItem(item);
      if (url && !item.meta.swhid && software && !isHidden(item)) {
        targets.push({ s, i, url });
      }
    });
  });
  if (targets.length === 0) return cv;

  const fetched = await mapBounded(targets, CONCURRENCY, (t) =>
    fetchSoftwareHeritageArchival(t.url),
  );
  const archival = new Map<string, { swhid: string; archivedAt?: string }>();
  targets.forEach((t, idx) => {
    const result = fetched[idx];
    if (result) archival.set(`${t.s}:${t.i}`, result);
  });
  if (archival.size === 0) return cv;

  const sections = cv.sections.map((section, s) => ({
    ...section,
    items: section.items.map((item, i) => {
      const result = archival.get(`${s}:${i}`);
      return result === undefined
        ? item
        : {
            ...item,
            meta: {
              ...item.meta,
              swhid: result.swhid,
              ...(result.archivedAt ? { swhArchivedAt: result.archivedAt } : {}),
            },
          };
    }),
  }));
  return { ...cv, sections, provenance: withSource(cv.provenance, "softwareheritage") };
}

// ─── Sciety: public evaluations of preprints ─────────────────────────────────

const SCIETY_MAX_ENRICH = 50;

/**
 * Fold Sciety's aggregated public evaluations onto DOI-bearing, non-hidden
 * preprints (`meta.publicEvaluations`). Bounded to {@link SCIETY_MAX_ENRICH}
 * lookups, concurrency-limited, fail-soft (a 404 "no evaluations" is not an
 * error) and immutable. Re-checks each sync so a newly-published evaluation
 * appears; returns the original CV untouched when nothing matched or nothing
 * came back.
 */
export async function enrichCvWithSciety(cv: CanonicalCv): Promise<CanonicalCv> {
  const targets: Array<{ s: number; i: number; doi: string }> = [];
  cv.sections.forEach((section, s) => {
    if (section.type !== "preprints") return;
    section.items.forEach((item, i) => {
      if (targets.length >= SCIETY_MAX_ENRICH) return;
      const doi = item.csl?.DOI;
      if (doi && !isHidden(item)) targets.push({ s, i, doi });
    });
  });
  if (targets.length === 0) return cv;

  const fetched = await mapBounded(targets, CONCURRENCY, (t) => fetchScietyEvaluations(t.doi));
  const evaluations = new Map<string, PublicEvaluation[]>();
  targets.forEach((t, idx) => {
    const list = fetched[idx];
    if (list && list.length > 0) evaluations.set(`${t.s}:${t.i}`, list);
  });
  if (evaluations.size === 0) return cv;

  const sections = cv.sections.map((section, s) => ({
    ...section,
    items: section.items.map((item, i) => {
      const list = evaluations.get(`${s}:${i}`);
      return list === undefined
        ? item
        : { ...item, meta: { ...item.meta, publicEvaluations: list } };
    }),
  }));
  return { ...cv, sections, provenance: withSource(cv.provenance, "sciety") };
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
